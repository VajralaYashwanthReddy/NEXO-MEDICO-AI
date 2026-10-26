# Nexo Medico AI - Local Development Launcher (PowerShell)
$Host.UI.RawUI.WindowTitle = "Nexo Medico AI - Local Dev Launcher"
Clear-Host

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "            NEXO MEDICO AI - LOCAL DEV LAUNCHER" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verify PostgreSQL
Write-Host "[*] Checking PostgreSQL connection on localhost:5432..." -ForegroundColor Yellow
try {
    $tcp = New-Object System.Net.Sockets.TcpClient("localhost", 5432)
    $tcp.Close()
    Write-Host "[+] PostgreSQL is running on port 5432" -ForegroundColor Green
} catch {
    Write-Host "[-] WARNING: PostgreSQL not detected on port 5432. Please start native PostgreSQL service or 'docker compose up -d'." -ForegroundColor Red
}

Write-Host ""

# 2. Launch FastAPI Microservice
Write-Host "[*] Launching AI Microservice (FastAPI) on port 8000..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "python ai_service/main.py"
Write-Host "[+] AI Microservice launched in separate window (http://127.0.0.1:8000)" -ForegroundColor Green

Write-Host ""

# 3. Print credentials and access instructions
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " LOCAL ACCESS & CREDENTIALS:" -ForegroundColor Cyan
Write-Host " ------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host " App URL:           http://localhost:3000" -ForegroundColor White
Write-Host " AI Docs URL:       http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host " CREDENTIALS (All passwords: password123):" -ForegroundColor Yellow
Write-Host " - Super Admin:     superadmin@nexomedico.ai" -ForegroundColor White
Write-Host " - Hospital Admin:  admin@metrohospital.org" -ForegroundColor White
Write-Host " - Doctor:          dr.smith@metrohospital.org" -ForegroundColor White
Write-Host " - Nurse:           nurse.sarah@metrohospital.org" -ForegroundColor White
Write-Host " - Pharmacist:      pharma.alex@metrohospital.org" -ForegroundColor White
Write-Host " - Lab Tech:        lab.tech@metrohospital.org" -ForegroundColor White
Write-Host " - Patient:         john.doe@gmail.com" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[*] Launching Next.js Development Server..." -ForegroundColor Yellow
npm.cmd run dev
