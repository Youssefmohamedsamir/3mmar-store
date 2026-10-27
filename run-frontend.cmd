@echo off
title 3mmar Store - Frontend (Angular 21)
set TEMP=H:\temp
set TMP=H:\temp
set npm_config_cache=H:\temp\npm-cache
if not exist "H:\temp" mkdir "H:\temp"
cd /d "%~dp0frontend"
echo ========================================================
echo  Starting 3mmar Store Frontend on http://localhost:4200
echo ========================================================
call .\node_modules\.bin\ng serve --open
pause
