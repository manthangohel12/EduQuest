@echo off
echo Starting EduQuest StudyChat AI Backend...
echo.

REM Check if .env file exists
if not exist ".env" (
    echo Creating .env file from template...
    copy "env.example" ".env"
    echo Please edit .env file with your configuration
    echo.
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

REM Start the server
echo Starting StudyChat AI server on port 3001...
echo.
npm start

pause

