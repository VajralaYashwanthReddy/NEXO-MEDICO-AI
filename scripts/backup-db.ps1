# Nexo Medico AI - Local Database Backup Script (PowerShell)
param (
    [string]$Database = $(if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "nexo_medico_ai" }),
    [string]$User = $(if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }),
    [string]$Password = $(if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "" }),
    [string]$DbHost = "localhost",
    [int]$Port = 5432,
    [string]$OutputFile = ""
)

$ErrorActionPreference = "Stop"

$BackupDir = Join-Path $PSScriptRoot "..\backups"
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $OutputFile = Join-Path $BackupDir "nexo_medico_ai_$timestamp.sql"
}

$pgDumpPath = "pg_dump.exe"
$cmdInfo = Get-Command "pg_dump.exe" -ErrorAction SilentlyContinue
if ($cmdInfo) {
    $pgDumpPath = $cmdInfo.Source
} else {
    $fallbackPaths = @(
        "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
    )
    foreach ($p in $fallbackPaths) {
        if (Test-Path $p) {
            $pgDumpPath = $p
            break
        }
    }
}

Write-Host "Starting backup of database '$Database' from $DbHost`:$Port..." -ForegroundColor Cyan
$env:PGPASSWORD = $Password

try {
    & $pgDumpPath -h $DbHost -p $Port -U $User -d $Database --clean --if-exists --no-owner --no-privileges -f $OutputFile
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump exited with error code $LASTEXITCODE"
    }
    $fileInfo = Get-Item $OutputFile
    $sizeKb = [math]::Round($fileInfo.Length / 1KB, 2)
    Write-Host "Backup completed successfully!" -ForegroundColor Green
    Write-Host "File: $($fileInfo.FullName) ($sizeKb KB)" -ForegroundColor Yellow
}
catch {
    Write-Error "Backup failed: $_"
    exit 1
}
finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
