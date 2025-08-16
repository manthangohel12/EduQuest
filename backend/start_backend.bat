@echo off
REM EduQuest Backend Startup Script for Windows
echo 🚀 Starting EduQuest Backend Services
echo =====================================

REM Check if we're in the right directory
if not exist "django_api\manage.py" (
    echo ❌ Please run this script from the backend directory
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install Python dependencies
echo 📦 Installing Python dependencies...
pip install -r django_api\requirements.txt
pip install -r ai_services\requirements.txt

REM Install Node.js dependencies
echo 📦 Installing Node.js dependencies...
cd node_api
npm install
cd ..

REM Setup Django database
echo 🗄️ Setting up Django database...
cd django_api

REM Run migrations
echo Running Django migrations...
python manage.py makemigrations
python manage.py migrate

REM Create superuser if it doesn't exist
echo Creating superuser...
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.get_or_create(username='admin', defaults={'email': 'admin@eduquest.com', 'is_staff': True, 'is_superuser': True}); print('Superuser ready: admin@eduquest.com / admin123')"

REM Run database setup script
echo Creating sample data...
python setup_db.py

cd ..

REM Start services in background
echo 🚀 Starting backend services...

REM Start Django API
echo Starting Django API on port 8000...
cd django_api
start "Django API" python manage.py runserver 0.0.0.0:8000
cd ..

REM Start Node.js API
echo Starting Node.js API on port 3000...
cd node_api
start "Node.js API" npm run dev
cd ..

REM Start AI Services
echo Starting AI Services on port 8001...
cd ai_services
start "AI Services" python main.py
cd ..

REM Wait a moment for services to start
timeout /t 5 /nobreak >nul

REM Check if services are running
echo 🔍 Checking service status...

REM Check Django API
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Django API is running on http://localhost:8000
) else (
    echo ⚠️ Django API may still be starting...
)

REM Check Node.js API
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js API is running on http://localhost:3000
) else (
    echo ⚠️ Node.js API may still be starting...
)

REM Check AI Services
curl -s http://localhost:8001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ AI Services are running on http://localhost:8001
) else (
    echo ⚠️ AI Services may still be starting...
)

echo.
echo 🎉 Backend services are starting up!
echo.
echo 📱 Service URLs:
echo    Django API: http://localhost:8000
echo    Node.js API: http://localhost:3000
echo    AI Services: http://localhost:8001
echo.
echo 🔧 Useful commands:
echo    View Django logs: tail -f django_api\logs\django.log
echo    View Node.js logs: tail -f node_api\logs\app.log
echo    Stop all services: taskkill /f /im python.exe && taskkill /f /im node.exe
echo.
echo 📚 API Documentation:
echo    Django API: http://localhost:8000/api/
echo    Node.js API: http://localhost:3000/api/
echo    AI Services: http://localhost:8001/docs
echo.
echo Happy coding! 🚀
pause 