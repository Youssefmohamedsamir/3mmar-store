@echo off
title 3mmar Store - Frontend (Angular 21)
cd /d "%~dp0frontend"
echo ========================================================
echo  Starting 3mmar Store Frontend on http://localhost:4200
echo ========================================================
npx ng serve --open
pause
