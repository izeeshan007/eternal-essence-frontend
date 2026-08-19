@echo off
setlocal
cd /d %~dp0
if not exist node_modules (
  echo Installing frontend dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. Make sure Node.js and internet access are available.
    pause
    exit /b 1
  )
)
echo.
echo Starting Eternal Essence frontend...
echo Open the URL Vite prints below, usually http://localhost:5173
call npm run dev
endlocal
