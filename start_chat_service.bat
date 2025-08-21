@echo off
echo Starting EduQuest Chat Service...
echo.

cd /d "%~dp0eduquest\backend\node_api"

echo Checking if Node.js is installed...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking if MongoDB is running...
netstat -an | findstr ":27017" >nul 2>&1
if errorlevel 1 (
    echo WARNING: MongoDB doesn't appear to be running on port 27017
    echo Please start MongoDB service or ensure it's running
    echo.
)

echo Installing dependencies...
if not exist "node_modules" (
    echo Installing npm packages...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Starting Node.js Chat API server...
echo Server will be available at: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

pause



