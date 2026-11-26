#!/bin/sh
# Daily copy of the files people attach (red tags, audit photos, work-log
# files), for the attachments-backup service in docker-compose.prod.yml.
#
# The database dump (the "backup" service beside it) holds every row,
# including the rows that name these files, but not the files themselves:
# they live in the attachments_prod volume. Restoring the dump without them
# would bring back records whose photos open as "not found".
#
# The volume is mounted read-only at /data; each run writes one dated archive
# to /backups/attachments and removes archives older than KEEP_DAYS days.
# Written under a temporary name and renamed when complete, so a run cut short
# never leaves a half-written archive that looks like a good one.
set -eu

target=/backups/attachments
mkdir -p "$target"

archive="$target/attachments-$(date +%Y%m%d).tar.gz"
tar -czf "$archive.part" -C /data .
mv "$archive.part" "$archive"

find "$target" -name 'attachments-*.tar.gz' -mtime +"${KEEP_DAYS:-7}" -delete
echo "attachments backed up to $archive"
