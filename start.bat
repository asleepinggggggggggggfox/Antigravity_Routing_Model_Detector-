@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Antigravity Routing Model Detector

echo ========================================================
echo   Starting Antigravity Routing Model Detector...
echo   Opening Web GUI: http://localhost:18981
echo ========================================================

start "" "http://localhost:18981"
call pnpm.cmd start
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Launch failed. Error code: %ERRORLEVEL%
    pause
)
