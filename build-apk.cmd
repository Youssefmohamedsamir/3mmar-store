@echo off
title Build 3mmar $tore APK
set TEMP=H:\temp
set TMP=H:\temp
set JAVA_HOME=E:\Andoroid studio\jbr
set ANDROID_HOME=C:\Users\fagr\AppData\Local\Android\Sdk
cd /d "%~dp0android"
echo ========================================================
echo  Building "3mmar $tore APK.apk" ...
echo ========================================================
call "E:\.gradle\wrapper\dists\gradle-9.3.1-all\9ot9r568e8zfvvd4mn8rbu1j0\gradle-9.3.1\bin\gradle.bat" assembleDebug
pause
