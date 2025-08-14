#!/bin/bash

# EduQuest AI Explanations System Setup Script
# This script sets up the enhanced AI explanations system with Mistral 7B and file processing

set -e  # Exit on any error

echo "🚀 Setting up EduQuest AI Explanations System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
check_python() {
    print_status "Checking Python installation..."
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
        print_success "Python $PYTHON_VERSION found"
    else
        print_error "Python 3 is not installed. Please install Python 3.8+ first."
        exit 1
    fi
}

# Check if pip is installed
check_pip() {
    print_status "Checking pip installation..."
    if command -v pip3 &> /dev/null; then
        print_success "pip3 found"
    else
        print_error "pip3 is not installed. Please install pip first."
        exit 1
    fi
}

# Check system requirements
check_system_requirements() {
    print_status "Checking system requirements..."
    
    # Check available memory
    if command -v free &> /dev/null; then
        MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
        if [ "$MEMORY_GB" -lt 8 ]; then
            print_warning "System has less than 8GB RAM. Performance may be limited."
        else
            print_success "System has ${MEMORY_GB}GB RAM"
        fi
    fi
    
    # Check GPU
    if command -v nvidia-smi &> /dev/null; then
        print_success "NVIDIA GPU detected"
        nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits
    else
        print_warning "No NVIDIA GPU detected. Will use CPU (slower performance)"
    fi
}

# Install AI services dependencies
install_ai_dependencies() {
    print_status "Installing AI services dependencies..."
    
    cd eduquest/backend/ai_services
    
    # Upgrade pip
    pip3 install --upgrade pip
    
    # Install base requirements
    pip3 install -r requirements.txt
    
    # Install additional dependencies
    pip3 install PyPDF2 pdfplumber python-docx mammoth chardet bitsandbytes accelerate
    
    print_success "AI services dependencies installed"
    cd ../../..
}

# Install Django dependencies
install_django_dependencies() {
    print_status "Installing Django dependencies..."
    
    cd eduquest/backend/django_api
    
    # Install requests for AI service communication
    pip3 install requests
    
    print_success "Django dependencies installed"
    cd ../../..
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p eduquest/backend/ai_services/models
    mkdir -p eduquest/backend/ai_services/logs
    mkdir -p eduquest/backend/django_api/logs
    
    print_success "Directories created"
}

# Create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # AI Services .env
    cat > eduquest/backend/ai_services/.env << EOF
# AI Services Configuration
MODEL_CACHE_DIR=./models
MAX_FILE_SIZE=50MB
SUPPORTED_FORMATS=.txt,.pdf,.docx,.doc,.rtf,.md,.html,.htm

# Mistral Model Configuration
MISTRAL_MODEL_NAME=mistralai/Mistral-7B-Instruct-v0.2
USE_4BIT_QUANTIZATION=true
DEVICE_MAP=auto

# Processing Configuration
MAX_TEXT_LENGTH=4000
MAX_SUMMARY_LENGTH=500
PROCESSING_TIMEOUT=120
EOF

    print_success "Environment files created"
}

# Test installation
test_installation() {
    print_status "Testing installation..."
    
    # Test Python imports
    python3 -c "
import torch
import transformers
import PyPDF2
import pdfplumber
from docx import Document
import mammoth
import chardet
import bitsandbytes
import accelerate
print('All required packages imported successfully')
"
    
    print_success "Installation test passed"
}

# Show next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Start AI Services:"
    echo "   cd eduquest/backend/ai_services"
    echo "   python main.py"
    echo ""
    echo "2. Start Django Backend:"
    echo "   cd eduquest/backend/django_api"
    echo "   python manage.py runserver"
    echo ""
    echo "3. Start Frontend:"
    echo "   cd eduquest/frontend/react_app"
    echo "   npm start"
    echo ""
    echo "4. Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Django API: http://localhost:8000"
    echo "   AI Services: http://localhost:8001"
    echo ""
    echo "📚 For detailed documentation, see: eduquest/AI_EXPLANATIONS_SETUP.md"
    echo ""
}

# Main setup function
main() {
    echo "=========================================="
    echo "  EduQuest AI Explanations System Setup"
    echo "=========================================="
    echo ""
    
    check_python
    check_pip
    check_system_requirements
    install_ai_dependencies
    install_django_dependencies
    create_directories
    create_env_files
    test_installation
    show_next_steps
}

# Run main function
main "$@" 