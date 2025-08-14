import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Award, Calendar, BookOpen, Clock, Star } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { apiService, apiUtils } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const ProgressTracker = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedSubject, setSelectedSubject] = useState('all');

  const [progressData, setProgressData] = useState({
    overallScore: 0,
    weeklyProgress: [],
    subjects: [],
    achievements: [],
    recentActivity: []
  });

  // Fetch progress data
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        
        // Fetch progress analytics
        const [progressResponse, sessionsResponse, quizzesResponse, streaksResponse] = await Promise.all([
          apiService.progress.getAnalytics(),
          apiService.studySessions.getAnalytics(),
          apiService.quizzes.getAll(),
          apiService.progress.getStreaks()
        ]);

        const progress = progressResponse.data;
        const sessions = sessionsResponse.data;
        const quizzes = quizzesResponse.data;
        const streaks = streaksResponse.data;

        // Calculate overall score
        const totalQuizzes = quizzes.length;
        const totalScore = quizzes.reduce((sum, quiz) => sum + (quiz.average_score || 0), 0);
        const overallScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;

        // Generate weekly progress data
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();

        const weeklyProgress = last7Days.map(date => ({
          day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          score: Math.floor(Math.random() * 30) + 70, // Mock data for now
          time: Math.floor(Math.random() * 60) + 30
        }));

        // Generate subject data
        const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
        const subjectData = subjects.map((subject, index) => ({
          name: subject,
          progress: Math.floor(Math.random() * 40) + 60,
          time: Math.floor(Math.random() * 20) + 5,
          quizzes: Math.floor(Math.random() * 10) + 1
        }));

        // Generate achievements
        const achievements = [
          { name: 'First Quiz', description: 'Completed your first quiz', date: '2024-01-15', icon: '🎯' },
          { name: 'Study Streak', description: `${streaks.current_streak || 0} days of consistent studying`, date: '2024-01-20', icon: '🔥' },
          { name: 'Perfect Score', description: 'Achieved 100% on a quiz', date: '2024-01-22', icon: '⭐' },
          { name: 'Subject Master', description: 'Completed all topics in Physics', date: '2024-01-25', icon: '🏆' }
        ];

        // Generate recent activity
        const recentActivity = [
          { type: 'quiz', subject: 'Mathematics', score: 92, time: '2 hours ago' },
          { type: 'study', subject: 'Physics', duration: 45, time: '1 day ago' },
          { type: 'achievement', name: 'Perfect Score', time: '2 days ago' },
          { type: 'quiz', subject: 'Chemistry', score: 88, time: '3 days ago' }
        ];

        setProgressData({
          overallScore,
          weeklyProgress,
          subjects: subjectData,
          achievements,
          recentActivity
        });

      } catch (error) {
        apiUtils.handleError(error, 'Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getSubjectColor = (index) => {
    return COLORS[index % COLORS.length];
  };

  const getProgressColor = (progress) => {
    if (progress >= 90) return 'text-green-600';
    if (progress >= 75) return 'text-blue-600';
    if (progress >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (progress) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Tracker</h1>
          <p className="text-gray-600">Monitor your learning journey and achievements</p>
        </div>
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-primary-600" />
          <span className="text-sm font-medium text-primary-600">Analytics</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Score</p>
              <p className="text-2xl font-bold text-gray-900">{progressData.overallScore}%</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Study Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(progressData.subjects.reduce((sum, subject) => sum + subject.time, 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-secondary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Quizzes Taken</p>
              <p className="text-2xl font-bold text-gray-900">
                {progressData.subjects.reduce((sum, subject) => sum + subject.quizzes, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-accent-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Achievements</p>
              <p className="text-2xl font-bold text-gray-900">{progressData.achievements.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Progress</h3>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={progressData.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Performance */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={progressData.subjects}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="progress" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Details */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Details</h3>
        <div className="space-y-4">
          {progressData.subjects.map((subject, index) => (
            <div key={subject.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getSubjectColor(index) }}
                ></div>
                <div>
                  <h4 className="font-medium text-gray-900">{subject.name}</h4>
                  <p className="text-sm text-gray-500">
                    {subject.quizzes} quizzes • {formatTime(subject.time)} studied
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className={`text-lg font-bold ${getProgressColor(subject.progress)}`}>
                    {subject.progress}%
                  </p>
                  <p className="text-sm text-gray-500">Progress</p>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressBarColor(subject.progress)}`}
                    style={{ width: `${subject.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {progressData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  {activity.type === 'quiz' && <BookOpen className="w-4 h-4 text-primary-600" />}
                  {activity.type === 'study' && <Clock className="w-4 h-4 text-primary-600" />}
                  {activity.type === 'achievement' && <Star className="w-4 h-4 text-primary-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {activity.type === 'quiz' && `${activity.subject} Quiz - ${activity.score}%`}
                    {activity.type === 'study' && `${activity.subject} Study Session`}
                    {activity.type === 'achievement' && activity.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.type === 'study' && `${formatTime(activity.duration)} • `}
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
          <div className="space-y-3">
            {progressData.achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{achievement.name}</p>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  <p className="text-xs text-gray-500">{achievement.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Study Time Distribution */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Time Distribution</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={progressData.subjects}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="time"
              >
                {progressData.subjects.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getSubjectColor(index)} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-3">
            {progressData.subjects.map((subject, index) => (
              <div key={subject.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getSubjectColor(index) }}
                  ></div>
                  <span className="text-sm font-medium">{subject.name}</span>
                </div>
                <span className="text-sm text-gray-600">{formatTime(subject.time)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker; 