# PostgreSQL Backup And Restore

This platform stores operational data in PostgreSQL. Backups should be tested before production launch and after every schema migration.

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

## Verification Checklist

- Confirm the restore command exits successfully.
- Run the backend migrations against the restored database.
- Start the backend with the restored database connection.
- Run `npm run smoke:api` from `backend`.
- Compare record counts for core tables: `projects`, `work_tasks`, `work_logs`, `time_entries`, `audit_templates`, `audit_runs`, `assessment_templates`, `assessment_responses`, and `expenses`.

## Production Policy

- Keep at least one daily backup and one weekly backup.
- Store backups outside the application server.
- Encrypt backups at rest if they contain employee or financial data.
- Test restore regularly; an untested backup is only a hope with a filename.
- Never commit backup files into git. Keep local backups under an ignored `backups/` directory.
