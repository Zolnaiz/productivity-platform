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

Restore the container's output with `psql`:

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml `
  exec -T postgres createdb -U $env:DB_USERNAME productivity_restore_check

Get-Content ".\backups\daily\productivity_prod-YYYYMMDD-HHMMSS.sql.gz" -AsByteStream `
  | docker compose --env-file .env.production -f docker-compose.prod.yml `
      exec -T postgres sh -c 'gunzip | psql -U $POSTGRES_USER -d productivity_restore_check'
```

The hand-taken dumps at the top of this page stay custom-format, and
`pg_restore` is still the right tool for those. Which file you are holding
decides which command you use, and the file extension says which it is:
`.dump` is custom-format, `.sql.gz` is the container's.

## Attachments

Where the bytes live depends on `ATTACHMENT_STORE`, and so does how they are
backed up.

**`local` (the default).** The production compose file keeps them on the
`attachments_prod` volume. Copy it out with a throwaway container, which needs
no knowledge of where Docker actually stores volumes:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
docker run --rm `
  -v productivity-platform_attachments_prod:/data:ro `
  -v "${PWD}ackups:/backup" `
  alpine tar czf "/backup/attachments-$stamp.tar.gz" -C /data .
```

Restore the same way, into the volume:

```powershell
docker run --rm `
  -v productivity-platform_attachments_prod:/data `
  -v "${PWD}ackups:/backup" `
  alpine sh -c "tar xzf /backup/attachments-YYYYMMDD-HHMMSS.tar.gz -C /data"
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
- Run `npm run attachments:check` from `backend`, against the same environment
  the application uses. It reports every attachment row whose bytes are not in
  the store and exits non-zero, which is the one failure a restore otherwise
  hides: the database comes back complete and the evidence does not.

  Run it **where the bytes are**. With `ATTACHMENT_STORE=local` in Docker the
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
