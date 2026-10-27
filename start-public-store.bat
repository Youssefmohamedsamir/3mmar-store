@echo off
title 3mmar Store - Server & Public Cloudflare Tunnel
color 0A

echo ========================================================
echo        3mmar Store - Starting Live Production Server
echo ========================================================
echo.

cd /d "H:\3mmarStore\backend"
echo [1/2] Starting ASP.NET Core Backend on port 5000...
start "3mmarStore-Backend" /min dotnet run --urls http://0.0.0.0:5000

echo [2/2] Launching High-Speed Cloudflare Global Edge Tunnel...
echo.
"C:\SQLData\cloudflared.exe" tunnel --url http://localhost:5000

pause
