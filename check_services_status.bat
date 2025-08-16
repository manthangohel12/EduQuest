@echo off
echo ==========================================
echo   EduQuest Project - Service Status Check
echo ==========================================
echo.

echo [INFO] Checking service status...
echo.

REM Check Django API (Port 8000)
echo [INFO] Checking Django API (Port 8000)...
curl -s http://localhost:8000/api/ >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Django API is not running on port 8000
) else (
    echo [SUCCESS] Django API is running on port 8000
)

REM Check Node.js API (Port 3001)
echo [INFO] Checking Node.js API (Port 3001)...
curl -s http://localhost:3001/health >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js API is not running on port 3001
) else (
    echo [SUCCESS] Node.js API is running on port 3001
)

REM Check AI Services (Port 8001)
echo [INFO] Checking AI Services (Port 8001)...
curl -s http://localhost:8001/health >nul 2>&1
if errorlevel 1 (
    echo [ERROR] AI Services is not running on port 8001
) else (
    echo [SUCCESS] AI Services is running on port 8001
)

REM Check React Frontend (Port 3000)
echo [INFO] Checking React Frontend (Port 3000)...
curl -s http://localhost:3000/ >nul 2>&1
if errorlevel 1 (
    echo [ERROR] React Frontend is not running on port 3000
) else (
    echo [SUCCESS] React Frontend is running on port 3000
)

echo.
echo ==========================================
echo 📊 Service Summary:
echo ==========================================
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Django API: http://localhost:8000
echo 🔌 Node.js API: http://localhost:3001
echo 🤖 AI Services: http://localhost:8001
echo.
echo 📚 Quick Links:
echo    Django Admin: http://localhost:8000/admin
echo    AI Services Health: http://localhost:8001/health
echo    Node.js Health: http://localhost:3001/health
echo.
echo 💡 If any services show as not running, try:
echo    1. Run start_all_services.bat
echo    2. Check the command windows for error messages
echo    3. Ensure all dependencies are installed
echo.
pause 