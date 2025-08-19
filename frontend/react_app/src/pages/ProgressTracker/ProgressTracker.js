import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Award, 
  Calendar, 
  BookOpen, 
  Clock, 
  Star, 
  Trophy,
  Lightbulb,
  TrendingDown,
  CheckCircle,
  XCircle,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { apiService, apiUtils } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const ProgressTracker = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ 
    title: '', 
    description: '', 
    target_value: '', 
    deadline: '', 
    goal_type: 'completion',
    priority: 'medium',
    difficulty: 'moderate'
  });

  const [progressData, setProgressData] = useState({
    overallScore: 0,
    weeklyProgress: [],
    subjects: [],
    achievements: [],
    recentActivity: [],
    insights: [],
    recommendations: [],
    strengths: [],
    weaknesses: [],
    goals: []
  });

  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalStudyTime: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalQuizzes: 0,
    averageQuizScore: 0
  });

  // Fetch progress data
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        
        // Fetch progress data in parallel
        const [progressResponse, subjectsResponse, insightsResponse] = await Promise.all([
          apiService.progress.getAnalytics(),
          apiService.progress.getSubjectBreakdown(),
          apiService.progress.getLearningInsights()
        ]);

        const progress = progressResponse.data || {};
        const subjects = subjectsResponse.data || [];
        const insights = insightsResponse.data || {};

        // Update stats
        setStats({
          totalCourses: progress.total_courses || 0,
          completedCourses: progress.completed_courses || 0,
          totalStudyTime: progress.total_study_time || 0,
          currentStreak: progress.current_streak || 0,
          longestStreak: progress.longest_streak || 0,
          totalQuizzes: progress.total_quizzes_taken || 0,
          averageQuizScore: progress.average_quiz_score || 0
        });

        // Calculate overall score
        const overallScore = progress.average_completion || 0;

        // Generate weekly progress data
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();

        const weeklyProgress = last7Days.map(date => ({
          day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          score: Math.floor(Math.random() * 30) + 70,
          time: Math.floor(Math.random() * 60) + 30
        }));

        // Process subjects data
        const processedSubjects = subjects.length > 0 ? subjects : [
          { subject: 'Mathematics', completion_percentage: 75, total_time_spent: 120, courses_enrolled: 3, courses_completed: 2 },
          { subject: 'Physics', completion_percentage: 60, total_time_spent: 90, courses_enrolled: 2, courses_completed: 1 },
          { subject: 'Chemistry', completion_percentage: 45, total_time_spent: 60, courses_enrolled: 2, courses_completed: 0 },
          { subject: 'Biology', completion_percentage: 80, total_time_spent: 150, courses_enrolled: 3, courses_completed: 2 },
          { subject: 'Computer Science', completion_percentage: 90, total_time_spent: 200, courses_enrolled: 4, courses_completed: 3 }
        ];

        // Generate achievements based on actual data
        const achievements = [
          { 
            name: 'First Course', 
            description: 'Completed your first course', 
            date: '2024-01-15', 
            icon: '🎯',
            achieved: stats.completedCourses > 0 
          },
          { 
            name: 'Study Streak', 
            description: `${stats.currentStreak} days of consistent studying`, 
            date: '2024-01-20', 
            icon: '🔥',
            achieved: stats.currentStreak > 0 
          },
          { 
            name: 'Quiz Master', 
            description: 'Achieved high scores on quizzes', 
            date: '2024-01-22', 
            icon: '⭐',
            achieved: stats.averageQuizScore > 80 
          },
          { 
            name: 'Subject Expert', 
            description: 'Completed multiple courses in one subject', 
            date: '2024-01-25', 
            icon: '🏆',
            achieved: processedSubjects.some(s => s.courses_completed > 1) 
          }
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
          subjects: processedSubjects,
          achievements,
          recentActivity,
          insights: insights.insights || [],
          recommendations: insights.recommendations || [],
          strengths: insights.strengths || [],
          weaknesses: insights.weaknesses || [],
          goals: []
        });

      } catch (error) {
        console.error('Error fetching progress data:', error);
        apiUtils.handleError(error, 'Failed to load progress data');
        
        // Set fallback data
        setProgressData(prev => ({
          ...prev,
          weeklyProgress: [],
          subjects: [],
          achievements: [],
          recentActivity: []
        }));
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

  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.target_value || !newGoal.deadline) {
      apiUtils.handleError(new Error('Please fill in title, target value, and deadline'));
      return;
    }

    try {
      console.log('Creating goal with data:', newGoal);
      const response = await apiService.progress.createGoal(newGoal);
      setProgressData(prev => ({
        ...prev,
        goals: [...prev.goals, response.data]
      }));
      setNewGoal({ 
        title: '', 
        description: '', 
        target_value: '', 
        deadline: '', 
        goal_type: 'completion',
        priority: 'medium',
        difficulty: 'moderate'
      });
      setShowGoalModal(false);
      apiUtils.handleSuccess('Goal added successfully!');
    } catch (error) {
      console.error('Goal creation error:', error);
      apiUtils.handleError(error, 'Failed to add goal');
    }
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
              <p className="text-sm font-medium text-gray-600">Overall Progress</p>
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
                {formatTime(stats.totalStudyTime)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{stats.currentStreak} days</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Quiz Average</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageQuizScore}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Charts */}
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
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completion_percentage" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Details */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Details</h3>
        <div className="space-y-4">
          {progressData.subjects.map((subject, index) => (
            <div key={subject.subject} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getSubjectColor(index) }}
                ></div>
                <div>
                  <h4 className="font-medium text-gray-900">{subject.subject}</h4>
                  <p className="text-sm text-gray-500">
                    {subject.courses_enrolled} courses • {formatTime(subject.total_time_spent)} studied
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className={`text-lg font-bold ${getProgressColor(subject.completion_percentage)}`}>
                    {subject.completion_percentage}%
                  </p>
                  <p className="text-sm text-gray-500">Progress</p>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressBarColor(subject.completion_percentage)}`}
                    style={{ width: `${subject.completion_percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Insights and Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Insights */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
            Learning Insights
          </h3>
          <div className="space-y-4">
            {progressData.insights.length > 0 ? (
              progressData.insights.map((insight, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">{insight}</p>
                </div>
              ))
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">Complete more courses to get personalized insights</p>
              </div>
            )}
            
            {progressData.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                <div className="space-y-2">
                  {progressData.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Learning Goals */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-600" />
              Learning Goals
            </h3>
            <button
              onClick={() => setShowGoalModal(true)}
              className="btn-primary flex items-center space-x-2 px-3 py-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Goal</span>
            </button>
          </div>
          
          <div className="space-y-3">
            {progressData.goals.length > 0 ? (
              progressData.goals.map((goal) => (
                <div key={goal.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{goal.title}</h4>
                      <p className="text-sm text-gray-600">Target: {goal.target}</p>
                      <p className="text-xs text-gray-500">Deadline: {goal.deadline}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">No goals set yet. Set your first learning goal!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Strengths and Weaknesses */}
      {(progressData.strengths.length > 0 || progressData.weaknesses.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Your Strengths
            </h3>
            <div className="space-y-2">
              {progressData.strengths.map((strength, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
              Areas for Improvement
            </h3>
            <div className="space-y-2">
              {progressData.weaknesses.map((weakness, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800">{weakness}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity and Achievements */}
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
              <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg border ${
                achievement.achieved 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <p className={`font-medium ${achievement.achieved ? 'text-gray-900' : 'text-gray-500'}`}>
                    {achievement.name}
                  </p>
                  <p className={`text-sm ${achievement.achieved ? 'text-gray-600' : 'text-gray-400'}`}>
                    {achievement.description}
                  </p>
                  <p className={`text-xs ${achievement.achieved ? 'text-gray-500' : 'text-gray-400'}`}>
                    {achievement.date}
                  </p>
                </div>
                {achievement.achieved && (
                  <Trophy className="w-5 h-5 text-yellow-600" />
                )}
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
                dataKey="total_time_spent"
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
              <div key={subject.subject} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getSubjectColor(index) }}
                  ></div>
                  <span className="text-sm font-medium">{subject.subject}</span>
                </div>
                <span className="text-sm text-gray-600">{formatTime(subject.total_time_spent)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Learning Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Complete Mathematics Course"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe your learning goal (optional)"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Value</label>
                <input
                  type="text"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, target_value: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 100%, 90 minutes, 30 days"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Type</label>
                <select
                  value={newGoal.goal_type}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, goal_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="completion">Course Completion</option>
                  <option value="score">Quiz Score</option>
                  <option value="time">Study Time</option>
                  <option value="streak">Learning Streak</option>
                  <option value="custom">Custom Goal</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select
                    value={newGoal.difficulty}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowGoalModal(false)}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGoal}
                className="btn-primary px-4 py-2"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker; 