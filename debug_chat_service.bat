@echo off
echo ========================================
echo EduQuest Chat Service Debug & Startup
echo ========================================
echo.

cd /d "%~dp0eduquest\backend\node_api"

echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo    Please install Node.js from https://nodejs.org/
    echo    Required version: 18.0.0 or higher
    pause
    exit /b 1
) else (
    echo ✅ Node.js found: 
    node --version
)

echo.
echo [2/6] Checking if port 3001 is available...
netstat -an | findstr ":3001" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  WARNING: Port 3001 is already in use
    echo    This might prevent the chat service from starting
    echo    Checking what's using port 3001:
    netstat -an | findstr ":3001"
    echo.
    echo    You may need to stop the service using port 3001 first
    echo.
)

echo.
echo [3/6] Checking MongoDB connection...
netstat -an | findstr ":27017" >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: MongoDB doesn't appear to be running on port 27017
    echo    Please start MongoDB service or ensure it's running
    echo    You can start MongoDB with: mongod
    echo.
) else (
    echo ✅ MongoDB appears to be running on port 27017
)

echo.
echo [4/6] Checking for .env file...
if not exist ".env" (
    echo ⚠️  WARNING: .env file not found
    echo    Creating from env.example...
    if exist "env.example" (
        copy "env.example" ".env" >nul
        echo ✅ Created .env file from env.example
    ) else (
        echo ❌ ERROR: env.example not found
        echo    Please create a .env file with proper configuration
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file found
)

echo.
echo [5/6] Installing dependencies...
if not exist "node_modules" (
    echo Installing npm packages...
    npm install
    if errorlevel 1 (
        echo ❌ ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
) else (
    echo ✅ Dependencies already installed
)

echo.
echo [6/6] Starting Node.js Chat API server...
echo.
echo ========================================
echo Server will be available at: http://localhost:3001
echo Health check: http://localhost:3001/health
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

pause



