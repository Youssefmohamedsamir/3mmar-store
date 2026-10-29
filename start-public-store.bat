@echo off
title 3mmar Store - Live Production Server
color 0A

echo ================================================================
echo               3mmar Store - متجر عمار أونلاين
echo ================================================================
echo.

set TEMP=H:\temp
set TMP=H:\temp

cd /d "H:\3mmarStore\backend"

echo [1/2] Checking ASP.NET Core Backend on port 5000...
powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:5000/api/products' -UseBasicParsing -TimeoutSec 2).StatusCode } catch { exit 1 }" >nul 2>&1
if %errorlevel% NEQ 0 (
    echo [*] Starting Backend Server...
    start "3mmarStore-Backend" /min dotnet run --urls http://0.0.0.0:5000
    timeout /t 3 /nobreak >nul
) else (
    echo [OK] Backend Server is already running.
)

echo.
echo [2/2] Launching Cloudflare Global Tunnel...
echo.
echo ================================================================
echo انظر إلى السطر الذي يحتوي على الرابط (trycloudflare.com)
echo انسخ هذا الرابط وشاركه مع العملاء، وسيفتح متجرك أونلاين فوراً!
echo ================================================================
echo.

:LOOP
"C:\SQLData\cloudflared.exe" tunnel --url http://localhost:5000
echo.
echo [!] Tunnel disconnected. Reconnecting in 5 seconds...
timeout /t 5 /nobreak >nul
goto LOOP
