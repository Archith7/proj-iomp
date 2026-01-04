Set-Location $PSScriptRoot
python -m uvicorn main:app --port 8001 --host 0.0.0.0
