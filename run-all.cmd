@echo off
title 3mmar Store - Launcher
echo ========================================================
echo  Launching 3mmar Store (Backend + Frontend)
echo ========================================================
start "3mmar Store - Backend" cmd /c "%~dp0run-backend.cmd"
timeout /t 3 /nobreak >nul
start "3mmar Store - Frontend" cmd /c "%~dp0run-frontend.cmd"
