# Nexo Medico AI - Local Database Restore Script (PowerShell)
param (
    [Parameter(Mandatory=$false)]
    [string]$InputFile = "",
    [string]$Database = $(if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "nexo_medico_ai" }),
    [string]$User = $(if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }),
    [string]$Password = $(if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "" }),
    [string]$DbHost = "localhost",
    [int]$Port = 5432
)

$ErrorActionPreference = "Stop"

# If InputFile is not provided, pick the latest backup in backups/
$BackupDir = Join-Path $PSScriptRoot "..\backups"
if ([string]::IsNullOrWhiteSpace($InputFile)) {
    if (Test-Path $BackupDir) {
        $latest = Get-ChildItem -Path $BackupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($latest) {
            $InputFile = $latest.FullName
        }
    }
}

if ([string]::IsNullOrWhiteSpace($InputFile) -or -not (Test-Path $InputFile)) {
    Write-Error "No valid backup file specified or found in $BackupDir. Usage: .\restore-db.ps1 -InputFile path\to\backup.sql"
    exit 1
}

$psqlPath = "psql.exe"
$cmdInfo = Get-Command "psql.exe" -ErrorAction SilentlyContinue
if ($cmdInfo) {
    $psqlPath = $cmdInfo.Source
} else {
    $fallbackPaths = @(
        "C:\Program Files\PostgreSQL\17\bin\psql.exe",
        "C:\Program Files\PostgreSQL\16\bin\psql.exe",
        "C:\Program Files\PostgreSQL\15\bin\psql.exe"
    )
    foreach ($p in $fallbackPaths) {
        if (Test-Path $p) {
            $psqlPath = $p
            break
        }
    }
}

Write-Host "Restoring database '$Database' from: $InputFile..." -ForegroundColor Cyan
$env:PGPASSWORD = $Password

try {
    & $psqlPath -h $DbHost -p $Port -U $User -d $Database -f $InputFile
    if ($LASTEXITCODE -ne 0) {
        throw "psql exited with error code $LASTEXITCODE"
    }
    Write-Host "Database restore completed successfully!" -ForegroundColor Green
}
catch {
    Write-Error "Restore failed: $_"
    exit 1
}
finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
