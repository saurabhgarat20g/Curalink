# Curalink AI Medical Research Assistant - Deployment Script

Write-Host "Starting Deployment Process for Curalink..." -ForegroundColor Cyan

# 1. Build Client
Write-Host "Building Frontend..." -ForegroundColor Yellow
cd client
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend Build Failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}
cd ..

# 2. Setup Environment
if (-not (Test-Path "server\.env")) {
    Write-Host "Warning: .env file missing in /server. Creating from template..." -ForegroundColor Yellow
    Copy-Item "server\.env.example" "server\.env"
}

# 3. Start Production Server
Write-Host "Curalink Deployed Successfully!" -ForegroundColor Green
Write-Host "The app will now be available at http://localhost:5000" -ForegroundColor Cyan
Write-Host "Starting Server..." -ForegroundColor Yellow

cd server
$env:SERVE_STATIC="true"
node index.js
