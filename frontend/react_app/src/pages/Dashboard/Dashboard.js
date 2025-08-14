import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  MessageSquare, 
  HelpCircle, 
  BarChart3, 
  TrendingUp, 
  Clock,
  Target,
  Award
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiService, apiUtils } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalQuizzes: 0,
    completedQuizzes: 0,
    studyTime: 0,
    currentStreak: 0,
    accuracy: 0,
    level: 1
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Initialize with safe defaults
        let enrollments = [];
        let quizzes = [];
        let progress = {};
        let sessions = {};

        try {
          const coursesResponse = await apiService.courses.getEnrollments();
          enrollments = Array.isArray(coursesResponse.data) ? coursesResponse.data : [];
        } catch (error) {
          console.warn('Failed to fetch enrollments:', error);
          enrollments = [];
        }

        try {
          const quizzesResponse = await apiService.quizzes.getAll();
          quizzes = Array.isArray(quizzesResponse.data) ? quizzesResponse.data : [];
        } catch (error) {
          console.warn('Failed to fetch quizzes:', error);
          quizzes = [];
        }

        try {
          const progressResponse = await apiService.progress.getAnalytics();
          progress = progressResponse.data || {};
        } catch (error) {
          console.warn('Failed to fetch progress analytics:', error);
          progress = {};
        }

        try {
          const sessionsResponse = await apiService.studySessions.getAnalytics();
          sessions = sessionsResponse.data || {};
        } catch (error) {
          console.warn('Failed to fetch study sessions analytics:', error);
          sessions = {};
        }

        // Safe data processing
        setStats({
          totalCourses: enrollments.length,
          completedCourses: enrollments.filter(e => e?.status === 'completed').length,
          totalQuizzes: quizzes.length,
          completedQuizzes: quizzes.filter(q => q?.status === 'completed').length,
          studyTime: Math.round((sessions.total_study_time || 0) / 60),
          currentStreak: progress.current_streak || 0,
          accuracy: Math.round(progress.average_quiz_score || 0),
          level: Math.floor((progress.total_experience || 0) / 100) + 1
        });

        // Fetch recent activity with error handling
        let recentSessions = { data: [] };
        let recentQuizzes = { data: [] };
        let recentExplanations = { data: [] };

        try {
          recentSessions = await apiService.studySessions.getAll({ limit: 5 });
        } catch (error) {
          console.warn('Failed to fetch recent sessions:', error);
        }

        try {
          recentQuizzes = await apiService.quizzes.getAll({ limit: 5 });
        } catch (error) {
          console.warn('Failed to fetch recent quizzes:', error);
        }

        try {
          recentExplanations = await apiService.aiExplanations.getAll({ limit: 5 });
        } catch (error) {
          console.warn('Failed to fetch recent explanations:', error);
        }

        const activities = [
          ...(Array.isArray(recentSessions.data) ? recentSessions.data.map(session => ({
            id: session.id,
            type: 'session',
            title: session.title,
            time: apiUtils.formatDate(session.started_at),
            duration: session.duration
          })) : []),
          ...(Array.isArray(recentQuizzes.data) ? recentQuizzes.data.map(quiz => ({
            id: quiz.id,
            type: 'quiz',
            title: quiz.title,
            time: apiUtils.formatDate(quiz.created_at),
            score: quiz.average_score
          })) : []),
          ...(Array.isArray(recentExplanations.data) ? recentExplanations.data.map(explanation => ({
            id: explanation.id,
            type: 'simplify',
            title: `Simplified ${explanation.content_type}`,
            time: apiUtils.formatDate(explanation.created_at),
            difficulty: explanation.difficulty_level
          })) : [])
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

        setRecentActivity(activities);

        // Generate progress data for the last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();

        setProgressData(last7Days.map(date => ({
          name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          value: Math.floor(Math.random() * 30) + 70 // Mock data for now
        })));

        // Generate subject distribution
        const subjects = ['JavaScript', 'React', 'Python', 'Data Science'];
        const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];
        
        setSubjectData(subjects.map((subject, index) => ({
          name: subject,
          value: Math.floor(Math.random() * 40) + 20, // Mock data for now
          color: colors[index]
        })));

      } catch (error) {
        apiUtils.handleError(error, 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'Simplify Content',
      description: 'Get AI-powered explanations',
      icon: BookOpen,
      link: '/simplify',
      color: 'primary'
    },
    {
      title: 'Study Chat',
      description: 'Ask questions to AI tutor',
      icon: MessageSquare,
      link: '/chat',
      color: 'secondary'
    },
    {
      title: 'Take Quiz',
      description: 'Test your knowledge',
      icon: HelpCircle,
      link: '/quiz',
      color: 'accent'
    },
    {
      title: 'View Progress',
      description: 'Track your learning',
      icon: BarChart3,
      link: '/progress',
      color: 'primary'
    }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.first_name || 'Learner'}! 👋
        </h1>
        <p className="text-primary-100">
          Ready to continue your learning journey? You're on a {stats.currentStreak}-day streak!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Study Time</p>
              <p className="text-2xl font-bold text-gray-900">{stats.studyTime}h</p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-secondary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.accuracy}%</p>
            </div>
            <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-accent-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Level</p>
              <p className="text-2xl font-bold text-gray-900">{stats.level}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={subjectData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {subjectData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.link}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all duration-200"
              >
                <div className={`w-12 h-12 bg-${action.color}-100 rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-6 h-6 text-${action.color}-600`} />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                {activity.type === 'quiz' && <HelpCircle className="w-5 h-5 text-primary-600" />}
                {activity.type === 'course' && <BookOpen className="w-5 h-5 text-primary-600" />}
                {activity.type === 'simplify' && <MessageSquare className="w-5 h-5 text-primary-600" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
              <div className="text-right">
                {activity.score && (
                  <span className="text-sm font-medium text-green-600">{activity.score}%</span>
                )}
                {activity.progress && (
                  <span className="text-sm font-medium text-blue-600">{activity.progress}%</span>
                )}
                {activity.difficulty && (
                  <span className="text-sm font-medium text-orange-600">{activity.difficulty}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 