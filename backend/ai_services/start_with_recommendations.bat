@echo off
echo Starting EduQuest AI Services with Recommendations...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if required packages are installed
echo Checking required packages...
python -c "import aiohttp, bs4, lxml, google.generativeai" >nul 2>&1
if errorlevel 1 (
    echo Installing required packages...
    pip install aiohttp beautifulsoup4 lxml google-generativeai
    if errorlevel 1 (
        echo Error: Failed to install required packages
        pause
        exit /b 1
    )
)

REM Check if environment file exists
if not exist ".env" (
    echo Creating .env file from template...
    copy "env.example" ".env"
    echo.
    echo IMPORTANT: Please edit the .env file and add your YouTube API key
    echo Get your API key from: https://console.developers.google.com/apis/credentials
    echo.
    pause
)

echo Starting AI Services...
echo.
echo Available endpoints:
echo - POST /simplify - Simplify text
echo - POST /simplify-with-recommendations - Simplify text + get recommendations
echo - POST /generate-quiz - Generate quiz
echo - POST /generate-quiz-with-recommendations - Generate quiz + get recommendations
echo - POST /get-recommendations - Get learning resource recommendations
echo.
echo Service will be available at: http://localhost:8001
echo Press Ctrl+C to stop
echo.

python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
