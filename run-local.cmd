@echo off
title Nexo Medico AI - Local Development Launcher
cls
echo ======================================================================
echo             NEXO MEDICO AI - LOCAL DEV LAUNCHER
echo ======================================================================
echo.

echo [*] Checking PostgreSQL connection on localhost:5432...
powershell -Command "try { $client = New-Object System.Net.Sockets.TcpClient('localhost', 5432); $client.Close(); Write-Host '[+] PostgreSQL is running on port 5432' -ForegroundColor Green } catch { Write-Host '[-] WARNING: PostgreSQL is not detected on port 5432. Please ensure the PostgreSQL service or Docker is running.' -ForegroundColor Red }"
echo.

echo [*] Launching AI Microservice (FastAPI) on port 8000...
start "Nexo Medico AI - FastAPI Service" cmd /k "python ai_service/main.py"
echo [+] AI Microservice launched in background window (http://127.0.0.1:8000)
echo.

echo [*] Launching Next.js Application on port 3000...
echo.
echo ======================================================================
echo  LOCAL ACCESS & CREDENTIALS:
echo  ------------------------------------------------------------------
echo  App URL:           http://localhost:3000
echo  AI Docs URL:       http://127.0.0.1:8000/docs
echo.
echo  CREDENTIALS (All passwords: password123):
echo  - Super Admin:     superadmin@nexomedico.ai
echo  - Hospital Admin:  admin@metrohospital.org
echo  - Doctor:          dr.smith@metrohospital.org
echo  - Nurse:           nurse.sarah@metrohospital.org
echo  - Pharmacist:      pharma.alex@metrohospital.org
echo  - Lab Tech:        lab.tech@metrohospital.org
echo  - Patient:         john.doe@gmail.com
echo ======================================================================
echo.

npm run dev
