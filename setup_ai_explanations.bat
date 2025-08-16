@echo off
REM EduQuest AI Explanations System Setup Script for Windows
REM This script sets up the enhanced AI explanations system with Mistral 7B and file processing

echo ==========================================
echo   EduQuest AI Explanations System Setup
echo ==========================================
echo.

echo 🚀 Setting up EduQuest AI Explanations System...
echo.

REM Check if Python is installed
echo [INFO] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Python found
)

REM Check if pip is installed
echo [INFO] Checking pip installation...
pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pip is not installed. Please install pip first.
    pause
    exit /b 1
) else (
    echo [SUCCESS] pip found
)

REM Install AI services dependencies
echo [INFO] Installing AI services dependencies...
cd eduquest\backend\ai_services

REM Upgrade pip
pip install --upgrade pip

REM Install base requirements
pip install -r requirements.txt

REM Install additional dependencies
pip install PyPDF2 pdfplumber python-docx mammoth chardet bitsandbytes accelerate

echo [SUCCESS] AI services dependencies installed
cd ..\..\..

REM Install Django dependencies
echo [INFO] Installing Django dependencies...
cd eduquest\backend\django_api

REM Install requests for AI service communication
pip install requests

echo [SUCCESS] Django dependencies installed
cd ..\..\..

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist "eduquest\backend\ai_services\models" mkdir "eduquest\backend\ai_services\models"
if not exist "eduquest\backend\ai_services\logs" mkdir "eduquest\backend\ai_services\logs"
if not exist "eduquest\backend\django_api\logs" mkdir "eduquest\backend\django_api\logs"

echo [SUCCESS] Directories created

REM Create environment files
echo [INFO] Creating environment files...

REM AI Services .env
echo # AI Services Configuration > eduquest\backend\ai_services\.env
echo MODEL_CACHE_DIR=./models >> eduquest\backend\ai_services\.env
echo MAX_FILE_SIZE=50MB >> eduquest\backend\ai_services\.env
echo SUPPORTED_FORMATS=.txt,.pdf,.docx,.doc,.rtf,.md,.html,.htm >> eduquest\backend\ai_services\.env
echo. >> eduquest\backend\ai_services\.env
echo # Mistral Model Configuration >> eduquest\backend\ai_services\.env
echo MISTRAL_MODEL_NAME=mistralai/Mistral-7B-Instruct-v0.2 >> eduquest\backend\ai_services\.env
echo USE_4BIT_QUANTIZATION=true >> eduquest\backend\ai_services\.env
echo DEVICE_MAP=auto >> eduquest\backend\ai_services\.env
echo. >> eduquest\backend\ai_services\.env
echo # Processing Configuration >> eduquest\backend\ai_services\.env
echo MAX_TEXT_LENGTH=4000 >> eduquest\backend\ai_services\.env
echo MAX_SUMMARY_LENGTH=500 >> eduquest\backend\ai_services\.env
echo PROCESSING_TIMEOUT=120 >> eduquest\backend\ai_services\.env

echo [SUCCESS] Environment files created

REM Test installation
echo [INFO] Testing installation...
python -c "import torch, transformers, PyPDF2, pdfplumber; from docx import Document; import mammoth, chardet, bitsandbytes, accelerate; print('All required packages imported successfully')"

if errorlevel 1 (
    echo [ERROR] Installation test failed. Please check the error messages above.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Installation test passed
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Start AI Services:
echo    cd eduquest\backend\ai_services
echo    python main.py
echo.
echo 2. Start Django Backend:
echo    cd eduquest\backend\django_api
echo    python manage.py runserver
echo.
echo 3. Start Frontend:
echo    cd eduquest\frontend\react_app
echo    npm start
echo.
echo 4. Access the application:
echo    Frontend: http://localhost:3000
echo    Django API: http://localhost:8000
echo    AI Services: http://localhost:8001
echo.
echo 📚 For detailed documentation, see: eduquest\AI_EXPLANATIONS_SETUP.md
echo.
pause 