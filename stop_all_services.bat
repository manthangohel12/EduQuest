@echo off
echo ==========================================
echo   EduQuest Project - Stop All Services
echo ==========================================
echo.

echo [INFO] Stopping all EduQuest services...
echo.

REM Stop Django API (Port 8000)
echo [INFO] Stopping Django API...
taskkill /f /im python.exe /fi "WINDOWTITLE eq Django API*" >nul 2>&1

REM Stop Node.js API (Port 3001)
echo [INFO] Stopping Node.js API...
taskkill /f /im node.exe /fi "WINDOWTITLE eq Node.js API*" >nul 2>&1

REM Stop AI Services (Port 8001)
echo [INFO] Stopping AI Services...
taskkill /f /im python.exe /fi "WINDOWTITLE eq AI Services*" >nul 2>&1

REM Stop React Frontend (Port 3000)
echo [INFO] Stopping React Frontend...
taskkill /f /im node.exe /fi "WINDOWTITLE eq React Frontend*" >nul 2>&1

REM Kill any remaining Python processes related to the project
echo [INFO] Cleaning up remaining processes...
taskkill /f /im python.exe /fi "WINDOWTITLE eq *EduQuest*" >nul 2>&1
taskkill /f /im node.exe /fi "WINDOWTITLE eq *EduQuest*" >nul 2>&1

echo.
echo ✅ All services have been stopped.
echo.
echo 💡 If you see any error messages above, it means those services were already stopped.
echo.
pause 