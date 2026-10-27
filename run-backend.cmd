@echo off
title 3mmar Store - Backend (.NET Web API)
cd /d "%~dp0backend"
echo ========================================================
echo  Starting 3mmar Store Backend on http://localhost:5000
echo ========================================================
dotnet run --urls "http://localhost:5000"
pause
