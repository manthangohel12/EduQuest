    @echo off
echo 🚀 Starting EduQuest Project...

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Start Django API (Port 8000)
echo Starting Django API on port 8000...
start "Django API" cmd /k "cd backend\django_api && python manage.py runserver 8000"

REM Start Node.js API (Port 3000)
echo Starting Node.js API on port 3000...
start "Node.js API" cmd /k "cd backend\node_api && npm run dev"

REM Start AI Services (Port 8001)
echo Starting AI Services on port 8001...
start "AI Services" cmd /k "cd backend\ai_services && python main.py"

REM Start React Frontend (Port 3000)
echo Starting React Frontend on port 3000...
start "React Frontend" cmd /k "cd frontend\react_app && npm start"

echo.
echo ✅ All services are starting...
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Django API: http://localhost:8000
echo 🔌 Node.js API: http://localhost:3000
echo 🤖 AI Services: http://localhost:8001
echo.
echo 👤 Admin Login: admin / admin123
echo.
pause 