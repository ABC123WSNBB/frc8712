@echo off
set "ROOT=%~dp0."

where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Please install Python and run this file again.
  pause
  exit /b 1
)

start "FRC Tank Battle Server" /min python -m http.server 8000 --bind 127.0.0.1 --directory "%ROOT%"
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:8000/"
echo Game started. Close the server window to stop it.
