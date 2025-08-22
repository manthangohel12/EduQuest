import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import ContentSimplifier from './pages/ContentSimplifier/ContentSimplifier';
import StudyChat from './pages/StudyChat/StudyChat';
import QuizBuilder from './pages/QuizBuilder/QuizBuilder';
import LearningRecommendations from './pages/LearningRecommendations/LearningRecommendations';
import ProgressTracker from './pages/ProgressTracker/ProgressTracker';
import LearningPath from './pages/LearningPath/LearningPath';
import ProfileSettings from './pages/ProfileSettings/ProfileSettings';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import LoadingSpinner from './components/Common/LoadingSpinner';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="simplify" element={<ContentSimplifier />} />
        <Route path="chat" element={<StudyChat />} />
        <Route path="quiz" element={<QuizBuilder />} />
        <Route path="recommendations" element={<LearningRecommendations />} />
        <Route path="progress" element={<ProgressTracker />} />
        <Route path="learning-path" element={<LearningPath />} />
        <Route path="profile" element={<ProfileSettings />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App; 