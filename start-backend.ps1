# Start Backend Server (Windows PowerShell)

Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\backend"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
