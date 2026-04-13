# scripts/setup-db.ps1
# Run once from the repo root in PowerShell as Administrator:
#   .\scripts\setup-db.ps1

$DB_NAME      = "property_mgmt"
$DB_TEST_NAME = "property_mgmt_test"
$DB_USER      = "admin"
$DB_PASS      = "admin"

Write-Host "Creating PostgreSQL user and databases..." -ForegroundColor Cyan

# Connect as the postgres superuser (password set during PostgreSQL installation)
# If your postgres superuser password differs, replace 'admin' below with it
$env:PGPASSWORD = "admin"

psql -U postgres -c @"
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS' SUPERUSER;
  END IF;
END
`$`$;
"@

psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Database '$DB_NAME' already exists — skipping." -ForegroundColor Yellow
} else {
  Write-Host "Database '$DB_NAME' created." -ForegroundColor Green
}

psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Test database
psql -U postgres -c "CREATE DATABASE $DB_TEST_NAME OWNER $DB_USER;" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Test database '$DB_TEST_NAME' already exists — skipping." -ForegroundColor Yellow
} else {
  Write-Host "Test database '$DB_TEST_NAME' created." -ForegroundColor Green
}

psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_TEST_NAME TO $DB_USER;"

Write-Host "Database setup complete." -ForegroundColor Green
Write-Host ""
Write-Host "Verify with:" -ForegroundColor Cyan
Write-Host '  $env:PGPASSWORD = "admin"'
Write-Host '  psql -U admin -c "\l" postgres'
