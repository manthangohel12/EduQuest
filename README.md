# EduQuest - AI-Powered Personalized Learning Companion

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)
- MongoDB (included in Docker setup)

### Option 1: Docker (Recommended)

1. **Clone and setup:**
```bash
cd eduquest
cp env.example .env
# Edit .env with your configurations
```

2. **Start all services:**
```bash
docker-compose up -d
```

3. **Access the application:**
- Frontend: http://localhost:3001
- Django API: http://localhost:8000
- Node.js API: http://localhost:3000
- AI Services: http://localhost:8001
- MongoDB: localhost:27017

### Option 2: Local Development

1. **Start MongoDB:**
```bash
mongod --dbpath ./data/db
```

2. **Django API (Terminal 1):**
```bash
cd backend/django_api
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

3. **Node.js API (Terminal 2):**
```bash
cd backend/node_api
npm install
npm run dev
```

4. **AI Services (Terminal 3):**
```bash
cd backend/ai_services
pip install -r requirements.txt
python main.py
```

5. **React Frontend (Terminal 4):**
```bash
cd frontend/react_app
npm install
npm start
```

## 🏗️ Architecture

### Backend Services
- **Django API** (Port 8000): Main REST API with user management, courses, quizzes
- **Node.js API** (Port 3000): Real-time features, WebSocket chat, file uploads
- **AI Services** (Port 8001): FastAPI service for text simplification, quiz generation, progress prediction

### Frontend
- **React App** (Port 3001): Modern UI with Tailwind CSS, real-time features

### Database
- **MongoDB**: Document database with Mongoose ODM

## 🎯 Features

### Core Learning Features
- **Content Simplification**: AI-powered text simplification with difficulty adjustment
- **Adaptive Quizzes**: Auto-generated quizzes from any content
- **Study Chat**: Real-time AI conversation partner
- **Progress Tracking**: Visual analytics and learning insights
- **Personalized Learning Paths**: AI-recommended learning sequences
- **Gamification**: Badges, streaks, experience points

### Technical Features
- **JWT Authentication**: Secure user authentication
- **Real-time Updates**: WebSocket integration
- **File Upload**: Support for PDF, documents, videos
- **Responsive Design**: Mobile-first UI
- **AI Integration**: Local models + OpenAI fallback

## 📁 Project Structure

```
eduquest/
├── backend/
│   ├── django_api/          # Django REST API
│   ├── node_api/            # Node.js Express API
│   └── ai_services/         # FastAPI AI services
├── frontend/
│   └── react_app/           # React application
├── docs/                    # Documentation
├── docker-compose.yml       # Docker orchestration
└── env.example             # Environment configuration
```

## 🔧 Configuration

### Environment Variables
Copy `env.example` to `.env` and configure:

```bash
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=mongodb://admin:password123@localhost:27017/eduquest

# AI Services
OPENAI_API_KEY=your-openai-key
HUGGINGFACE_API_KEY=your-huggingface-key

# Frontend
REACT_APP_API_URL=http://localhost:8000
REACT_APP_AI_SERVICES_URL=http://localhost:8001
```

## 🧪 Testing

### Backend Tests
```bash
# Django tests
cd backend/django_api
python manage.py test

# AI services tests
cd backend/ai_services
python -m pytest
```

### Frontend Tests
```bash
cd frontend/react_app
npm test
```

## 📊 API Documentation

### Django API Endpoints
- `POST /api/token/` - User login
- `POST /api/users/register/` - User registration
- `GET /api/users/me/` - Get user profile
- `GET /api/courses/` - List courses
- `GET /api/quizzes/` - List quizzes
- `POST /api/study-sessions/` - Create study session

### AI Services Endpoints
- `POST /simplify` - Text simplification
- `POST /generate-quiz` - Quiz generation
- `POST /predict-progress` - Progress prediction

## 🚀 Deployment

### Production Setup
1. Update environment variables for production
2. Set up SSL certificates
3. Configure reverse proxy (Nginx)
4. Set up monitoring and logging
5. Configure database backups

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the API documentation

## 🔄 Updates

### Recent Updates
- Added AI-powered content simplification
- Implemented real-time study chat
- Enhanced progress tracking with charts
- Added gamification system
- Improved responsive design

### Roadmap
- [ ] Advanced AI model integration
- [ ] Video content processing
- [ ] Collaborative learning features
- [ ] Mobile app development
- [ ] Advanced analytics dashboard 