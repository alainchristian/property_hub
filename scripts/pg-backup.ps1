$BACKUP_DIR = "C:\pg-backups"
$DB_NAME    = "property_mgmt"
$TIMESTAMP  = Get-Date -Format "yyyyMMdd_HHmmss"
$env:PGPASSWORD = "admin"

if (-not (Test-Path $BACKUP_DIR)) { New-Item -ItemType Directory -Path $BACKUP_DIR }

# Dump and compress
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U admin $DB_NAME |
  Out-File -FilePath "$BACKUP_DIR\${DB_NAME}_${TIMESTAMP}.sql" -Encoding utf8

Compress-Archive `
  -Path "$BACKUP_DIR\${DB_NAME}_${TIMESTAMP}.sql" `
  -DestinationPath "$BACKUP_DIR\${DB_NAME}_${TIMESTAMP}.zip" `
  -CompressionLevel Optimal

Remove-Item "$BACKUP_DIR\${DB_NAME}_${TIMESTAMP}.sql"

# Delete backups older than 30 days
Get-ChildItem $BACKUP_DIR -Filter "*.zip" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
  Remove-Item

Write-Host "Backup complete: ${DB_NAME}_${TIMESTAMP}.zip"
