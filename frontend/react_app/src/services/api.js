import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create AI services instance
const aiApi = axios.create({
  baseURL: process.env.REACT_APP_AI_SERVICES_URL || 'http://localhost:8001',
  timeout: parseInt(process.env.REACT_APP_AI_TIMEOUT || '120000', 10), // Allow longer operations (default 120s)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create Node.js API instance for real-time features
// EDITED: default Node API fallback changed to port 3001 after port swap
const nodeApi = axios.create({
  baseURL: process.env.REACT_APP_NODE_API_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${api.defaults.baseURL}/api/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('token', access);
        api.defaults.headers.Authorization = `Bearer ${access}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Apply same interceptors to other API instances
[nodeApi, aiApi].forEach(instance => {
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
});

// API service functions
export const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials) => api.post('/api/token/', credentials),
    register: (userData) => {
      console.log('API Service - Register called with:', userData);
      return api.post('/api/users/register/', userData);
    },
    getProfile: () => api.get('/api/users/me/'),
    updateProfile: (profileData) => api.patch('/api/users/me/', profileData),
    refreshToken: (refresh) => api.post('/api/token/refresh/', { refresh }),
  },

  // Courses
  courses: {
    getAll: (params = {}) => api.get('/api/courses/', { params }),
    getById: (id) => api.get(`/api/courses/${id}/`),
    create: (courseData) => api.post('/api/courses/', courseData),
    update: (id, courseData) => api.patch(`/api/courses/${id}/`, courseData),
    delete: (id) => api.delete(`/api/courses/${id}/`),
    enroll: (courseId) => api.post('/api/courses/enroll/', { course_id: courseId }),
    getEnrollments: () => api.get('/api/courses/my-enrollments/'),
  },

  // Quizzes
  quizzes: {
    getAll: (params = {}) => api.get('/api/quizzes/', { params }),
    getById: (id) => api.get(`/api/quizzes/${id}/`),
    getQuestions: (quizId) => api.get(`/api/quizzes/${quizId}/questions/`),
    create: (quizData) => api.post('/api/quizzes/', quizData),
    update: (id, quizData) => api.patch(`/api/quizzes/${id}/`, quizData),
    delete: (id) => api.delete(`/api/quizzes/${id}/`),
    // Legacy (backend may not support these exact endpoints)
    startAttempt: (quizId) => api.post(`/api/quizzes/${quizId}/start/`),
    submitAttempt: (quizId, answers) => api.post(`/api/quizzes/${quizId}/submit/`, { answers }),
    // Current
    listAttempts: () => api.get('/api/quizzes/attempts/'),
    saveAIQuiz: (payload) => api.post('/api/quizzes/ai/save/', payload),
    submitAIAttempt: (quizId, payload) => api.post(`/api/quizzes/ai/attempts/${quizId}/submit/`, payload),
  },

  // Study Sessions
  studySessions: {
    getAll: (params = {}) => api.get('/api/study-sessions/', { params }),
    getById: (id) => api.get(`/api/study-sessions/${id}/`),
    create: (sessionData) => api.post('/api/study-sessions/', sessionData),
    update: (id, sessionData) => api.patch(`/api/study-sessions/${id}/`, sessionData),
    delete: (id) => api.delete(`/api/study-sessions/${id}/`),
    endSession: (id, endData) => api.post(`/api/study-sessions/${id}/end/`, endData),
    getAnalytics: (params = {}) => api.get('/api/study-sessions/analytics/', { params }),
    getRecent: (limit = 5) => api.get('/api/study-sessions/recent/', { params: { limit } }),
  },

  // Progress
  progress: {
    getAll: (params = {}) => api.get('/api/progress/', { params }),
    getByCourse: (courseId) => api.get(`/api/progress/course/${courseId}/`),
    updateProgress: (courseId, progressData) => api.patch(`/api/progress/course/${courseId}/`, progressData),
    getAnalytics: (params = {}) => api.get('/api/progress/summary/', { params }),
    getStreaks: () => api.get('/api/progress/streak/'),
    getLearningInsights: () => api.get('/api/progress/insights/'),
    getProgressChartData: (params = {}) => api.get('/api/progress/chart-data/', { params }),
    getGoals: () => api.get('/api/progress/goals/'),
    createGoal: (goalData) => api.post('/api/progress/goals/', goalData),
    updateGoal: (goalId, goalData) => api.patch(`/api/progress/goals/${goalId}/`, goalData),
    deleteGoal: (goalId) => api.delete(`/api/progress/goals/${goalId}/`),
  },

  // Learning Paths
  learningPaths: {
    getAll: (params = {}) => api.get('/api/learning-paths/', { params }),
    getById: (id) => api.get(`/api/learning-paths/${id}/`),
    create: (pathData) => api.post('/api/learning-paths/', pathData),
    update: (id, pathData) => api.patch(`/api/learning-paths/${id}/`, pathData),
    delete: (id) => api.delete(`/api/learning-paths/${id}/`),
    getRecommendations: () => api.get('/api/learning-paths/recommendations/'),
  },

  // AI Explanations
  aiExplanations: {
    getAll: (params = {}) => api.get('/api/ai-explanations/', { params }),
    getById: (id) => api.get(`/api/ai-explanations/${id}/`),
    create: (explanationData) => api.post('/api/ai-explanations/', explanationData),
    update: (id, explanationData) => api.patch(`/api/ai-explanations/${id}/`, explanationData),
    delete: (id) => api.delete(`/api/ai-explanations/${id}/`),
    rate: (id, rating) => api.post(`/api/ai-explanations/${id}/rate/`, { rating }),
  },
};

// AI Services API
export const aiService = {
  simplifyText: (text, difficultyLevel, targetAudience) =>
    aiApi.post('/simplify', { text, difficulty_level: difficultyLevel, target_audience: targetAudience }),
  
  processFile: (file, difficultyLevel, targetAudience) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('difficulty_level', difficultyLevel);
    formData.append('target_audience', targetAudience);
    return aiApi.post('/process-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  generateQuiz: (content, settings) =>
    aiApi.post('/generate-quiz', { content, ...settings }),
  
  generateQuizWithRecommendations: (content, settings) =>
    aiApi.post('/generate-quiz-with-recommendations', { content, ...settings }),
  
  getRecommendations: (content, contentType = 'text', maxRecommendations = 10) =>
    aiApi.post('/get-recommendations', { content, content_type: contentType, max_recommendations: maxRecommendations }),
  
  simplifyWithRecommendations: (text, difficultyLevel = 'intermediate', targetAudience = 'student') =>
    aiApi.post('/simplify-with-recommendations', { text, difficulty_level: difficultyLevel, target_audience: targetAudience }),
  
  analyzeContent: (content) =>
    aiApi.post('/analyze-content', { content }),
  
  getIntelligentRecommendations: (content, topics, subject, maxRecommendations = 12) =>
    aiApi.post('/get-intelligent-recommendations', { 
      content, 
      topics, 
      subject, 
      max_recommendations: maxRecommendations 
    }),
  
  getSupportedFormats: () =>
    aiApi.get('/supported-formats'),

  studyChatRespond: (question, context = '') =>
    aiApi.post('/study-chat/respond', { question, context }),
};

// Node.js API for real-time features
export const nodeService = {
  // Chat
  chat: {
    getSessions: () => nodeApi.get('/api/chat/sessions'),
    getSession: (sessionId) => nodeApi.get(`/api/chat/sessions/${sessionId}`),
    createSession: (sessionData) => nodeApi.post('/api/chat/sessions', sessionData),
    addMessage: (sessionId, messageData) => nodeApi.post(`/api/chat/sessions/${sessionId}/messages`, messageData),
    updateSession: (sessionId, sessionData) => nodeApi.put(`/api/chat/sessions/${sessionId}`, sessionData),
    deleteSession: (sessionId) => nodeApi.delete(`/api/chat/sessions/${sessionId}`),
    getStatistics: () => nodeApi.get('/api/chat/statistics'),
    searchMessages: (query) => nodeApi.get('/api/chat/search', { params: { query } }),
  },

  // Summaries
  summaries: {
    create: (payload) => nodeApi.post('/api/summaries', payload),
    list: (params = {}) => nodeApi.get('/api/summaries', { params }),
    getById: (id) => nodeApi.get(`/api/summaries/${id}`),
  },

  // File Upload
  upload: {
    uploadSingle: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return nodeApi.post('/api/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    uploadMultiple: (files) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      return nodeApi.post('/api/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    getFiles: () => nodeApi.get('/api/upload/files'),
    downloadFile: (filename) => nodeApi.get(`/api/upload/download/${filename}`),
    deleteFile: (filename) => nodeApi.delete(`/api/upload/files/${filename}`),
    getFileInfo: (filename) => nodeApi.get(`/api/upload/files/${filename}/info`),
  },
};

// Utility functions
export const apiUtils = {
  handleError: (error, customMessage = null) => {
    let errorDetails = {
      fieldErrors: {},
      nonFieldErrors: [],
      detail: '',
      networkError: '',
    };
    if (error.response && error.response.data) {
      const data = error.response.data;
      // Field errors
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'non_field_errors' || key === 'detail') {
          if (Array.isArray(value)) errorDetails.nonFieldErrors.push(...value);
          else if (typeof value === 'string') errorDetails.nonFieldErrors.push(value);
          else errorDetails.nonFieldErrors.push(JSON.stringify(value));
        } else if (key === 'detail') {
          errorDetails.detail = value;
        } else {
          errorDetails.fieldErrors[key] = value;
        }
      });
    } else if (error.message && error.message.includes('Network Error')) {
      errorDetails.networkError = 'Network error: Unable to reach the server.';
    } else if (error.message) {
      errorDetails.networkError = error.message;
    }
    // Show toast for the first error (optional)
    const firstError = errorDetails.nonFieldErrors[0] || errorDetails.detail || Object.values(errorDetails.fieldErrors)[0]?.[0] || errorDetails.networkError || customMessage;
    if (firstError) toast.error(firstError);
    console.error('API Error:', error);
    return errorDetails;
  },

  handleSuccess: (message = 'Operation completed successfully') => {
    toast.success(message);
  },

  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  formatDuration: (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  },

  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};

export default api; 