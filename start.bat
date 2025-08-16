@echo off
REM EduQuest Startup Script for Windows
REM This script helps you start the EduQuest learning platform

echo 🚀 Starting EduQuest - AI-Powered Learning Platform
echo ==================================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    echo Visit: https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    echo Visit: https://docs.docker.com/compose/install/
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ✅ .env file created. You can edit it later if needed.
)

REM Check if we're in the right directory
if not exist "docker-compose.yml" (
    echo ❌ Please run this script from the eduquest directory.
    pause
    exit /b 1
)

echo 🔧 Starting all services...
echo This may take a few minutes on first run...

REM Start services
docker-compose up -d

echo.
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

echo 🔍 Checking service status...

REM Check Django API
curl -s http://localhost:8000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Django API is running on http://localhost:8000
) else (
    echo ⚠️  Django API may still be starting...
)

REM Check Node.js API
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js API is running on http://localhost:3000
) else (
    echo ⚠️  Node.js API may still be starting...
)

REM Check AI Services
curl -s http://localhost:8001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ AI Services are running on http://localhost:8001
) else (
    echo ⚠️  AI Services may still be starting...
)

REM Check React App
curl -s http://localhost:3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ React App is running on http://localhost:3001
) else (
    echo ⚠️  React App may still be starting...
)

echo.
echo 🎉 EduQuest is starting up!
echo.
echo 📱 Access the application:
echo    Frontend: http://localhost:3001
echo    Django API: http://localhost:8000
echo    Node.js API: http://localhost:3000
echo    AI Services: http://localhost:8001
echo.
echo 📚 Useful commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart services: docker-compose restart
echo    Rebuild services: docker-compose up --build
echo.
echo 🔧 Troubleshooting:
echo    If services don't start, check the logs with: docker-compose logs
echo    For AI model issues, check: docker-compose logs ai_services
echo    For frontend issues, check: docker-compose logs react_app
echo.
echo 📖 Documentation:
echo    See README.md for detailed setup instructions
echo    Check /docs for API documentation
echo.
echo Happy learning! 🎓
pause 