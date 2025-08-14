@echo off
echo ==========================================
echo   EduQuest Project - All Services Startup
echo ==========================================
echo.

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found. Please run setup_ai_explanations.bat first.
    pause
    exit /b 1
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Node.js found
)

REM Check if npm is installed
echo [INFO] Checking npm installation...
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm first.
    pause
    exit /b 1
) else (
    echo [SUCCESS] npm found
)

echo.
echo 🚀 Starting all EduQuest services...
echo.

REM Start Django API (Port 8000)
echo [INFO] Starting Django API on port 8000...
start "Django API" cmd /k "title Django API - Port 8000 && cd backend\django_api && python manage.py runserver 8000"

REM Wait for Django to start
echo [INFO] Waiting for Django API to initialize...
timeout /t 5 /nobreak > nul

REM Start Node.js API (Port 3001)
echo [INFO] Starting Node.js API on port 3001...
start "Node.js API" cmd /k "title Node.js API - Port 3001 && cd backend\node_api && npm run dev"

REM Wait for Node.js to start
echo [INFO] Waiting for Node.js API to initialize...
timeout /t 3 /nobreak > nul

REM Start AI Services (Port 8001)
echo [INFO] Starting AI Services on port 8001...
start "AI Services" cmd /k "title AI Services - Port 8001 && cd backend\ai_services && python main.py"

REM Wait for AI Services to start
echo [INFO] Waiting for AI Services to initialize...
timeout /t 5 /nobreak > nul

REM Start React Frontend (Port 3000)
echo [INFO] Starting React Frontend on port 3000...
start "React Frontend" cmd /k "title React Frontend - Port 3000 && cd frontend\react_app && npm start"

echo.
echo ==========================================
echo ✅ All services are starting...
echo ==========================================
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Django API: http://localhost:8000
echo 🔌 Node.js API: http://localhost:3001
echo 🤖 AI Services: http://localhost:8001
echo.
echo 📚 API Documentation:
echo    Django Admin: http://localhost:8000/admin
echo    AI Services Health: http://localhost:8001/health
echo.
echo 👤 Default Admin Login: admin / admin123
echo.
echo ⏳ Please wait for all services to fully start...
echo    This may take 1-2 minutes for the first startup.
echo.
echo 💡 Tips:
echo    - Keep all command windows open
echo    - Check each window for any error messages
echo    - Frontend will open automatically in your browser
echo    - AI Services may take longer to load the Mistral model
echo.
echo Press any key to continue...
pause > nul

echo.
echo 🎉 Services should now be running!
echo.
echo To stop all services, close the command windows or press Ctrl+C in each window.
echo.
pause 