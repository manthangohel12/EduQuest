#!/bin/bash

echo "Starting EduQuest AI Services with Recommendations..."
echo

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ and try again"
    exit 1
fi

# Check if required packages are installed
echo "Checking required packages..."
python3 -c "import aiohttp, bs4, lxml, google.generativeai" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing required packages..."
    pip3 install aiohttp beautifulsoup4 lxml google-generativeai
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install required packages"
        exit 1
    fi
fi

# Check if environment file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp "env.example" ".env"
    echo
    echo "IMPORTANT: Please edit the .env file and add your YouTube API key"
    echo "Get your API key from: https://console.developers.google.com/apis/credentials"
    echo
    read -p "Press Enter to continue..."
fi

echo "Starting AI Services..."
echo
echo "Available endpoints:"
echo "- POST /simplify - Simplify text"
echo "- POST /simplify-with-recommendations - Simplify text + get recommendations"
echo "- POST /generate-quiz - Generate quiz"
echo "- POST /generate-quiz-with-recommendations - Generate quiz + get recommendations"
echo "- POST /get-recommendations - Get learning resource recommendations"
echo
echo "Service will be available at: http://localhost:8001"
echo "Press Ctrl+C to stop"
echo

python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
