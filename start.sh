#!/bin/bash

# EduQuest Startup Script
# This script helps you start the EduQuest learning platform

set -e

echo "🚀 Starting EduQuest - AI-Powered Learning Platform"
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. You can edit it later if needed."
fi

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from the eduquest directory."
    exit 1
fi

echo "🔧 Starting all services..."
echo "This may take a few minutes on first run..."

# Start services
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."

# Check Django API
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ Django API is running on http://localhost:8000"
else
    echo "⚠️  Django API may still be starting..."
fi

# Check Node.js API
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Node.js API is running on http://localhost:3000"
else
    echo "⚠️  Node.js API may still be starting..."
fi

# Check AI Services
if curl -s http://localhost:8001 > /dev/null; then
    echo "✅ AI Services are running on http://localhost:8001"
else
    echo "⚠️  AI Services may still be starting..."
fi

# Check React App
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ React App is running on http://localhost:3001"
else
    echo "⚠️  React App may still be starting..."
fi

echo ""
echo "🎉 EduQuest is starting up!"
echo ""
echo "📱 Access the application:"
echo "   Frontend: http://localhost:3001"
echo "   Django API: http://localhost:8000"
echo "   Node.js API: http://localhost:3000"
echo "   AI Services: http://localhost:8001"
echo ""
echo "📚 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Rebuild services: docker-compose up --build"
echo ""
echo "🔧 Troubleshooting:"
echo "   If services don't start, check the logs with: docker-compose logs"
echo "   For AI model issues, check: docker-compose logs ai_services"
echo "   For frontend issues, check: docker-compose logs react_app"
echo ""
echo "📖 Documentation:"
echo "   See README.md for detailed setup instructions"
echo "   Check /docs for API documentation"
echo ""
echo "Happy learning! 🎓" 