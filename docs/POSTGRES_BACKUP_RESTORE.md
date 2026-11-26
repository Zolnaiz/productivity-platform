# Backup And Restore

This platform stores operational data in PostgreSQL and attachment bytes —
photographs on red tags, zones and audits — outside it. Both have to be backed
up, and a backup of only one of them restores a system that looks healthy and
has lost its evidence: every row says there is a photograph, and there is not.

Backups should be tested before production launch and after every schema
migration.

## Backup

Create a timestamped custom-format backup from the local Docker database:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
docker exec productivity-postgres pg_dump -U postgres -d questionnaire_db -Fc -f "/tmp/productivity-$stamp.dump"
docker cp "productivity-postgres:/tmp/productivity-$stamp.dump" ".\backups\productivity-$stamp.dump"
```

For the backend-only dev database container:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
docker exec productivity-postgres-dev pg_dump -U postgres -d questionnaire_db -Fc -f "/tmp/productivity-$stamp.dump"
docker cp "productivity-postgres-dev:/tmp/productivity-$stamp.dump" ".\backups\productivity-$stamp.dump"
```

For a non-Docker PostgreSQL server:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
pg_dump -h localhost -p 5432 -U postgres -d questionnaire_db -Fc -f ".\backups\productivity-$stamp.dump"
```

## Restore

Restore into a new empty database first. Do not restore directly over production until the backup has been verified.

```powershell
createdb -h localhost -p 5432 -U postgres productivity_restore_check
pg_restore -h localhost -p 5432 -U postgres -d productivity_restore_check --clean --if-exists ".\backups\productivity-YYYYMMDD-HHMMSS.dump"
```

For Docker:

```powershell
docker cp ".\backups\productivity-YYYYMMDD-HHMMSS.dump" "productivity-postgres:/tmp/restore.dump"
docker exec productivity-postgres createdb -U postgres productivity_restore_check
docker exec productivity-postgres pg_restore -U postgres -d productivity_restore_check --clean --if-exists "/tmp/restore.dump"
```

## The backup container writes a different format

The `backup` profile in `docker-compose.prod.yml` runs
`prodrigestivill/postgres-backup-local`, and it writes **gzipped plain SQL**,
not the custom-format dump the commands above produce. `pg_restore` cannot
read it, and the error it gives — `input file does not appear to be a valid
archive` — reads like a corrupted backup rather than the wrong tool. That is
the worst possible sentence to meet during a restore.

It keeps them in `backups/` at the top of the repository: `daily/`, `weekly/`
and `monthly/` (7, 4 and 6 kept), and `last/` with every run's own file and a
`-latest` link to the newest.

Restore one with `psql`, inside the database container. Copy the file in, then
create the scratch database and load it there:

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml -p productivity-prod `
  cp .\backups\last\productivity_prod-YYYYMMDD-HHMMSS.sql.gz postgres:/tmp/restore.sql.gz

docker compose --env-file .env.production -f docker-compose.prod.yml -p productivity-prod `
  exec -T postgres sh -c 'createdb -U "$POSTGRES_USER" productivity_restore_check && gunzip -c /tmp/restore.sql.gz | psql -q -U "$POSTGRES_USER" -d productivity_restore_check -v ON_ERROR_STOP=1'
```

The same two commands work in Git Bash with `MSYS_NO_PATHCONV=1` in front,
so that `/tmp/...` is not turned into a Windows path. Three things in the
commands this page used to give stopped a restore before it began, and each is
easy to bring back by "simplifying":

- **`-p productivity-prod`.** The stack runs as that compose project. Without
  it, compose looks for a project named after the folder and answers
  `service "postgres" is not running`.
- **`$POSTGRES_USER`, read inside the container.** `$env:DB_USERNAME` is in
  `.env.production`, not in the shell, so it was empty.
- **No bytes through PowerShell.** `Get-Content -AsByteStream` exists only in
  PowerShell 7; Windows PowerShell 5.1, the one Windows comes with, refuses it,
  and its pipeline would turn the gzip bytes into text even if it did not.
  `cp` hands the file over untouched.

The hand-taken dumps at the top of this page stay custom-format, and
`pg_restore` is still the right tool for those. Which file you are holding
decides which command you use, and the file extension says which it is:
`.dump` is custom-format, `.sql.gz` is the container's.

## Attachments

Where the bytes live depends on `ATTACHMENT_STORE`, and so does how they are
backed up.

**`local` (the default).** The production compose file keeps them on the
`productivity-prod_attachments_prod` volume (the compose project's name, then
the volume's). With the `backup` profile on, the `attachments-backup` service
copies it every day at 03:30 to `backups/attachments/attachments-YYYYMMDD.tar.gz`
and keeps seven days (`scripts/backup-attachments.sh`). To take one now, with
a throwaway container that needs no knowledge of where Docker stores volumes:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
docker run --rm `
  -v productivity-prod_attachments_prod:/data:ro `
  -v "${PWD}\backups\attachments:/backup" `
  alpine tar czf "/backup/attachments-$stamp.tar.gz" -C /data .
```

Restore the same way, into the volume:

```powershell
docker run --rm `
  -v productivity-prod_attachments_prod:/data `
  -v "${PWD}\backups\attachments:/backup" `
  alpine sh -c "tar xzf /backup/attachments-YYYYMMDD.tar.gz -C /data"
```

**`s3`.** The bucket is the backup boundary. Turn on versioning so a delete is
recoverable, and either replicate the bucket or mirror it on the same schedule
as the database dump:

```bash
aws s3 sync s3://evidence ./backups/attachments --endpoint-url "$S3_ENDPOINT"
```

Take the database dump and the attachment copy close together. They will never
be a perfectly matched pair — a photograph uploaded between the two shows up as
a row with no bytes, or bytes with no row — and the check below is what tells
you which.

## Verification Checklist

- Confirm the restore command exits successfully.
- Run the backend migrations against the restored database.
- Start the backend with the restored database connection.
- Run `npm run smoke:api` from `backend`.
- Check that every attachment still has its bytes - the one failure a restore
  otherwise hides: the database comes back complete and the evidence does not.
  Ask the running application, which is where the store is: sign in as an
  administrator and use **Settings -> Photographs and files -> Check the
  files**, or `GET /api/attachments/check` with an administrator's token. It
  names every row whose bytes are missing and what the row belonged to.

  `npm run attachments:check` from `backend` asks the same question from
  outside, and has to be run **where the bytes are**. With `ATTACHMENT_STORE=local` in Docker the
  bytes live on the `attachments_prod` volume and the host has no such
  directory, so running the check from the host reports every row as missing
  and exits non-zero — a reader under pressure would conclude they had lost
  every photograph the programme has. `docs/DEPLOYMENT_RUN.md` has the command
  that mounts the volume and asks the question properly.
- Compare record counts for core tables: `projects`, `work_tasks`, `work_logs`, `time_entries`, `audit_templates`, `audit_runs`, `assessment_templates`, `assessment_responses`, and `expenses`.

## Production Policy

- Keep at least one daily backup and one weekly backup — of the database *and*
  of the attachments.
- Store backups outside the application server.
- Encrypt backups at rest if they contain employee or financial data.
- Test restore regularly; an untested backup is only a hope with a filename.
- Never commit backup files into git. Keep local backups under an ignored `backups/` directory.

## Last restore drill: 2026-11-12

Run on the production machine with the commands on this page, into scratch
databases only. The live database was never written to.

| What | How it was checked | Result |
|---|---|---|
| Production dump, `backup` service | restored into `productivity_restore_check`; exact row count of every table compared with the live database | 30 tables, identical; all 45 migrations present |
| A dump holding data | the same image (`postgres-backup-local:15`) pointed at a seeded and smoke-tested scratch database (159 rows); restored the same way | identical row counts and an identical checksum of every table's contents |
| The application on the restored data | backend started on the restored database; sign-in, monthly report, weekly K1–K6 and the task list | all answered 200 with the restored records |
| Attached files | 3 files (a 2 MB binary, a PDF, a name with a space) archived by `scripts/backup-attachments.sh` and restored with the command above into a fresh volume | identical MD5 for every file |

The drill also found this page's old restore commands could not run here (the
three points under "The backup container writes a different format"). Run it
again after a schema change, and before the system holds data that matters.
