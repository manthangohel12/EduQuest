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
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { apiService, apiUtils } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const ProgressTracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEditGoalModal, setShowEditGoalModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
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
  const [attempts, setAttempts] = useState([]);

  // Fetch progress data
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        // date range for chart based on selectedPeriod
        const now = new Date();
        const endDate = now.toISOString().slice(0, 10);
        const start = new Date(now);
        if (selectedPeriod === 'month') start.setDate(start.getDate() - 30);
        else if (selectedPeriod === 'year') start.setDate(start.getDate() - 365);
        else start.setDate(start.getDate() - 7);
        const startDate = start.toISOString().slice(0, 10);

        const [summaryRes, insightsRes, chartRes, goalsRes, recentRes, attemptsRes] = await Promise.all([
          apiService.progress.getAnalytics(),
          apiService.progress.getLearningInsights(),
          apiService.progress.getProgressChartData({ start_date: startDate, end_date: endDate }),
          apiService.progress.getGoals(),
          apiService.studySessions.getRecent(5),
          apiService.quizzes.listAttempts()
        ]);

        const summary = summaryRes.data || {};
        const insights = insightsRes.data || {};
        const chart = chartRes.data || { labels: [], datasets: [] };
        const goals = Array.isArray(goalsRes.data?.results) ? goalsRes.data.results : (Array.isArray(goalsRes.data) ? goalsRes.data : []);
        const attemptsData = Array.isArray(attemptsRes.data?.results) ? attemptsRes.data.results : (Array.isArray(attemptsRes.data) ? attemptsRes.data : []);
        setAttempts(attemptsData);
        const recentSessions = Array.isArray(recentRes.data) ? recentRes.data : [];

        setStats({
          totalCourses: summary.total_courses || 0,
          completedCourses: summary.completed_courses || 0,
          totalStudyTime: summary.total_study_time || 0,
          currentStreak: summary.current_streak || 0,
          longestStreak: summary.longest_streak || 0,
          totalQuizzes: summary.total_quizzes_taken || 0,
          averageQuizScore: summary.average_quiz_score || 0
        });

        const weeklyProgress = (chart.labels || []).map((label, idx) => ({
          day: label,
          score: chart.datasets?.[0]?.data?.[idx] ?? 0,
          time: chart.datasets?.[1]?.data?.[idx] ?? 0
        }));

        // achievements derived dynamically
        const achievements = [
          {
            name: 'First Course',
            description: 'Completed your first course',
            date: new Date().toISOString().slice(0, 10),
            icon: '🎯',
            achieved: (summary.completed_courses || 0) > 0
          },
          {
            name: 'Study Streak',
            description: `${summary.current_streak || 0} days of consistent studying`,
            date: new Date().toISOString().slice(0, 10),
            icon: '🔥',
            achieved: (summary.current_streak || 0) > 0
          },
          {
            name: 'Quiz Master',
            description: 'Achieved high scores on quizzes',
            date: new Date().toISOString().slice(0, 10),
            icon: '⭐',
            achieved: (summary.average_quiz_score || 0) > 80
          }
        ];

        const recentActivity = recentSessions.map(s => ({
          type: 'study',
          title: s.title || 'Study Session',
          duration: s.duration || 0,
          time: apiUtils.formatDate(s.started_at)
        }));

        setProgressData({
          overallScore: summary.average_completion || 0,
          weeklyProgress,
          achievements,
          recentActivity,
          insights: insights.insights || [],
          recommendations: insights.recommendations || [],
          strengths: insights.strengths || [],
          weaknesses: insights.weaknesses || [],
          goals
        });
      } catch (error) {
        console.error('Progress load error:', error);
        apiUtils.handleError(error, 'Failed to load progress data');
        setProgressData(prev => ({ ...prev, weeklyProgress: [], achievements: [], recentActivity: [] }));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [selectedPeriod]);

  

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
      const response = await apiService.progress.createGoal(newGoal);
      // reload goals list to stay consistent with backend
      const goalsRes = await apiService.progress.getGoals();
      const goals = Array.isArray(goalsRes.data?.results) ? goalsRes.data.results : (Array.isArray(goalsRes.data) ? goalsRes.data : []);
      setProgressData(prev => ({ ...prev, goals }));
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

  const openEditGoalModal = (goal) => {
    setEditGoal({ ...goal });
    setShowEditGoalModal(true);
  };
  const handleSaveEditGoal = async () => {
    if (!editGoal) return;
    try {
      await handleUpdateGoal(editGoal);
      setShowEditGoalModal(false);
      setEditGoal(null);
    } catch (e) {}
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await apiService.progress.deleteGoal(goalId);
      const goalsRes = await apiService.progress.getGoals();
      const goals = Array.isArray(goalsRes.data?.results) ? goalsRes.data.results : (Array.isArray(goalsRes.data) ? goalsRes.data : []);
      setProgressData(prev => ({ ...prev, goals }));
      apiUtils.handleSuccess('Goal deleted');
    } catch (error) {
      apiUtils.handleError(error, 'Failed to delete goal');
    }
  };

  const handleUpdateGoal = async (goal) => {
    try {
      const payload = {
        title: goal.title,
        description: goal.description || '',
        goal_type: goal.goal_type,
        target_value: goal.target_value,
        deadline: goal.deadline,
        priority: goal.priority,
        difficulty: goal.difficulty,
      };
      await apiService.progress.updateGoal(goal.id, payload);
      const goalsRes = await apiService.progress.getGoals();
      const goals = Array.isArray(goalsRes.data?.results) ? goalsRes.data.results : (Array.isArray(goalsRes.data) ? goalsRes.data : []);
      setProgressData(prev => ({ ...prev, goals }));
      apiUtils.handleSuccess('Goal updated');
    } catch (error) {
      apiUtils.handleError(error, 'Failed to update goal');
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

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Quizzes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Longest Streak</p>
              <p className="text-2xl font-bold text-gray-900">{stats.longestStreak} days</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Previous Quizzes (Scrollable) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Previous Quizzes</h3>
          </div>
          <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
            {attempts.length === 0 ? (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
                No quiz attempts yet.
              </div>
            ) : (
              attempts.map((att) => (
                <div key={att.id} className="p-3 rounded-lg border flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{att.quiz?.title || 'Quiz'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{apiUtils.formatDate(att.started_at)} • {att.total_questions} questions</p>
                  </div>
                  <div className="flex items-center space-x-3 ml-3">
                    <span className={`text-sm font-semibold ${att.score >= 80 ? 'text-green-600' : att.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{Math.round(att.score || 0)}%</span>
                    <button
                      onClick={async () => {
                        try {
                          const quizId = att.quiz?.id;
                          if (!quizId) return;
                          const quizRes = await apiService.quizzes.getById(quizId);
                          const q = quizRes.data || {};
                          navigate('/quiz', { state: { content: q.source_content || '', source: 'saved' } });
                        } catch (e) {
                          apiUtils.handleError(e, 'Unable to open quiz');
                        }
                      }}
                      className="btn-secondary text-sm px-3 py-1"
                    >
                      Retake
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
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
                      <p className="text-sm text-gray-600">Target: {goal.target_value}</p>
                      <p className="text-sm text-gray-600">Current: {goal.current_value}</p>
                      <p className="text-xs text-gray-500">Deadline: {goal.deadline}</p>
                      <p className={`text-xs mt-1 ${goal.is_completed ? 'text-green-600' : 'text-gray-600'}`}>
                        {goal.is_completed ? 'Completed' : 'Active'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => openEditGoalModal(goal)} className="btn-secondary px-2 py-1 text-xs flex items-center">
                        <Edit3 className="w-4 h-4 mr-1" /> Edit
                      </button>
                      <button onClick={() => handleDeleteGoal(goal.id)} className="btn-secondary px-2 py-1 text-xs flex items-center">
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </button>
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
                    {activity.type === 'quiz' && `${activity.title} - ${activity.score}%`}
                    {activity.type === 'study' && `${activity.title}`}
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

      {/* Edit Goal Modal */}
      {showEditGoalModal && editGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Learning Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Title</label>
                <input
                  type="text"
                  value={editGoal.title}
                  onChange={(e) => setEditGoal(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={editGoal.description || ''}
                  onChange={(e) => setEditGoal(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Value</label>
                <input
                  type="text"
                  value={editGoal.target_value}
                  onChange={(e) => setEditGoal(prev => ({ ...prev, target_value: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                <input
                  type="date"
                  value={editGoal.deadline}
                  onChange={(e) => setEditGoal(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Type</label>
                <select
                  value={editGoal.goal_type}
                  onChange={(e) => setEditGoal(prev => ({ ...prev, goal_type: e.target.value }))}
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
                    value={editGoal.priority}
                    onChange={(e) => setEditGoal(prev => ({ ...prev, priority: e.target.value }))}
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
                    value={editGoal.difficulty}
                    onChange={(e) => setEditGoal(prev => ({ ...prev, difficulty: e.target.value }))}
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
                onClick={() => { setShowEditGoalModal(false); setEditGoal(null); }}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditGoal}
                className="btn-primary px-4 py-2"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker; 