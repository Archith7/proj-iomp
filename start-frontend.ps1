# Start Frontend Server (Windows PowerShell)

Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\frontend"
npm start
