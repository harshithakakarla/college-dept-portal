@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js 18 or newer is required. Install Node.js and run this file again.
  pause
  exit /b 1
)
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo Created .env. Configure the MySQL credentials and SESSION_SECRET, then run this file again.
  start "" notepad.exe "%~dp0.env"
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Installing portal dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)
echo Starting College Department Information Management Portal at http://localhost:3000
start "Vel Tech Portal Server" cmd /k "cd /d ""%~dp0"" && npm start"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline = (Get-Date).AddSeconds(45); while ((Get-Date) -lt $deadline) { try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3000/api/health' -TimeoutSec 2; if ($response.StatusCode -eq 200) { Start-Process 'http://localhost:3000'; exit 0 } } catch { Start-Sleep -Seconds 1 } }; exit 1"
if errorlevel 1 (
  echo Portal server did not become ready. Check the server window for MySQL connection errors.
  pause
  exit /b 1
)
echo Portal connected. The browser is opening.
pause
