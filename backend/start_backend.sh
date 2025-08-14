#!/bin/bash

# EduQuest Backend Startup Script
echo "🚀 Starting EduQuest Backend Services"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "django_api/manage.py" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Check required ports
echo "🔍 Checking port availability..."
check_port 8000 || exit 1  # Django API
check_port 3000 || exit 1  # Node.js API
check_port 8001 || exit 1  # AI Services

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r django_api/requirements.txt
pip install -r ai_services/requirements.txt

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd node_api
npm install
cd ..

# Setup Django database
echo "🗄️  Setting up Django database..."
cd django_api

# Run migrations
echo "Running Django migrations..."
python manage.py makemigrations
python manage.py migrate

# Create superuser if it doesn't exist
echo "Creating superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@eduquest.com').exists():
    User.objects.create_superuser('admin', 'admin@eduquest.com', 'admin123')
    print('Superuser created: admin@eduquest.com / admin123')
else:
    print('Superuser already exists')
"

# Run database setup script
echo "Creating sample data..."
python setup_db.py

cd ..

# Start services in background
echo "🚀 Starting backend services..."

# Start Django API
echo "Starting Django API on port 8000..."
cd django_api
python manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!
cd ..

# Start Node.js API
echo "Starting Node.js API on port 3000..."
cd node_api
npm run dev &
NODE_PID=$!
cd ..

# Start AI Services
echo "Starting AI Services on port 8001..."
cd ai_services
python main.py &
AI_PID=$!
cd ..

# Wait a moment for services to start
sleep 5

# Check if services are running
echo "🔍 Checking service status..."

# Check Django API
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Django API is running on http://localhost:8000"
else
    echo "⚠️  Django API may still be starting..."
fi

# Check Node.js API
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Node.js API is running on http://localhost:3000"
else
    echo "⚠️  Node.js API may still be starting..."
fi

# Check AI Services
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "✅ AI Services are running on http://localhost:8001"
else
    echo "⚠️  AI Services may still be starting..."
fi

echo ""
echo "🎉 Backend services are starting up!"
echo ""
echo "📱 Service URLs:"
echo "   Django API: http://localhost:8000"
echo "   Node.js API: http://localhost:3000"
echo "   AI Services: http://localhost:8001"
echo ""
echo "🔧 Useful commands:"
echo "   View Django logs: tail -f django_api/logs/django.log"
echo "   View Node.js logs: tail -f node_api/logs/app.log"
echo "   Stop all services: pkill -f 'python manage.py runserver' && pkill -f 'npm run dev' && pkill -f 'python main.py'"
echo ""
echo "📚 API Documentation:"
echo "   Django API: http://localhost:8000/api/"
echo "   Node.js API: http://localhost:3000/api/"
echo "   AI Services: http://localhost:8001/docs"
echo ""
echo "Happy coding! 🚀"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping backend services..."
    kill $DJANGO_PID 2>/dev/null || true
    kill $NODE_PID 2>/dev/null || true
    kill $AI_PID 2>/dev/null || true
    echo "✅ Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
echo "Press Ctrl+C to stop all services"
wait 