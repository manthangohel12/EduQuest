import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  MessageSquare, 
  HelpCircle, 
  BarChart3, 
  TrendingUp, 
  Clock,
  Target,
  Award,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';
// charts removed
import { apiService, apiUtils } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useAppTimer } from '../hooks/useAppTimer';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const appMinutes = useAppTimer(); // Add this line
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
  const [attempts, setAttempts] = useState([]);

  const [showViewGoalModal, setShowViewGoalModal] = useState(false);
  const [viewGoal, setViewGoal] = useState(null);
  const [goals, setGoals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEditGoalModal, setShowEditGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ 
    title: '', 
    description: '', 
    target_value: '', 
    deadline: '', 
    goal_type: 'completion',
    priority: 'medium',
    difficulty: 'moderate'
  });
  const [editGoal, setEditGoal] = useState(null);
  const handleViewGoal = (goal) => {
    setViewGoal(goal);
    setShowViewGoalModal(true);
  };
  // Local wrappers to satisfy linter and bind handlers in JSX
  const onDeleteGoal = async (goalId) => {
    try {
      await apiService.progress.deleteGoal(goalId);
      const goalsRes = await apiService.progress.getGoals();
      const list = Array.isArray(goalsRes.data?.results) ? goalsRes.data.results : (Array.isArray(goalsRes.data) ? goalsRes.data : []);
      setGoals(list);
      apiUtils.handleSuccess('Goal deleted');
    } catch (error) {
      apiUtils.handleError(error, 'Failed to delete goal');
    }
  };
  // / Add this function after your existing onDeleteGoal function in Dashboard.js

// Replace the existing onCompleteGoal and onToggleGoalCompletion functions in Dashboard.js
// with these corrected versions:

const onToggleGoalCompletion = async (goalId, currentStatus) => {
  try {
    const newStatus = !currentStatus;
    
    // Find the goal in our local state to get all required fields
    const goal = goals.find(g => g.id === goalId);
    if (!goal) {
      throw new Error('Goal not found in local state');
    }
    
    // Include ALL required fields that the API expects
    const payload = {
      title: goal.title,
      target_value: goal.target_value,
      deadline: goal.deadline,
      description: goal.description || '',
      goal_type: goal.goal_type,
      priority: goal.priority,
      difficulty: goal.difficulty,
      current_value: goal.current_value || '0',
      is_completed: newStatus,
      completed_at: newStatus ? new Date().toISOString() : null
    };
    
    console.log('Updating goal with full payload:', payload);
    
    await apiService.progress.updateGoal(goalId, payload);
    
    // Refresh goals list
    const goalsRes = await apiService.progress.getGoals();
    const list = Array.isArray(goalsRes.data?.results) 
      ? goalsRes.data.results 
      : (Array.isArray(goalsRes.data) ? goalsRes.data : []);
    setGoals(list);
    
    apiUtils.handleSuccess(newStatus ? 'Goal completed! 🎉' : 'Goal reactivated');
  } catch (error) {
    console.error('Goal toggle error:', error.response?.data || error);
    apiUtils.handleError(error, 'Failed to update goal status');
  }
};

// Also update the simple onCompleteGoal function:
const onCompleteGoal = async (goalId) => {
  try {
    console.log('=== GOAL COMPLETION DEBUG ===');
    console.log('Goal ID:', goalId);
    
    // Find the goal in our local state
    const goal = goals.find(g => g.id === goalId);
    if (!goal) {
      throw new Error('Goal not found in local state');
    }
    
    console.log('Found goal:', goal);
    console.log('Current completion status:', goal.is_completed);
    
    // Try minimal payload first - just completion fields
    const payload = {
      is_completed: true,
      completed_at: new Date().toISOString()
    };
    
    console.log('Sending payload:', payload);
    
    const updateResponse = await apiService.progress.updateGoal(goalId, payload);
    console.log('Update response:', updateResponse);
    
    // Refresh goals list
    console.log('Refreshing goals list...');
    const goalsRes = await apiService.progress.getGoals();
    console.log('Goals response:', goalsRes);
    
    const list = Array.isArray(goalsRes.data?.results) 
      ? goalsRes.data.results 
      : (Array.isArray(goalsRes.data) ? goalsRes.data : []);
    
    console.log('Processed goals list:', list);
    
    // Check if the goal is now completed
    const updatedGoal = list.find(g => g.id === goalId);
    console.log('Updated goal after refresh:', updatedGoal);
    console.log('Is goal now completed?', updatedGoal?.is_completed);
    
    setGoals(list);
    
    apiUtils.handleSuccess('Goal marked as complete! 🎉');
    console.log('=== END GOAL COMPLETION DEBUG ===');
  } catch (error) {
    console.error('Goal completion error:', error);
    console.error('Error details:', error.response?.data);
    apiUtils.handleError(error, 'Failed to complete goal');
  }
};
  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const [, , , , , attemptsRes] = await Promise.all([
          apiService.progress.getAnalytics(),
          apiService.progress.getLearningInsights(),
          apiService.progress.getProgressChartData({}),
          apiService.progress.getGoals(),
          apiService.studySessions.getRecent(5),
          apiService.quizzes.listAttempts()
        ]);
  
        const attemptsData = Array.isArray(attemptsRes.data?.results)
          ? attemptsRes.data.results
          : (Array.isArray(attemptsRes.data) ? attemptsRes.data : []);
  
        setAttempts(attemptsData);
      } catch (error) {
        apiUtils.handleError(error, 'Failed to load quiz attempts');
        setAttempts([]);
      }
    };
  
    fetchAttempts();
  }, []);
  const onSaveEditGoal = async () => {
    if (!editGoal) return;
    try {
      const payload = {
        title: editGoal.title,
        description: editGoal.description || '',
        goal_type: editGoal.goal_type,
        target_value: editGoal.target_value,
        deadline: editGoal.deadline,
        priority: editGoal.priority,
        difficulty: editGoal.difficulty,
        current_value: editGoal.current_value || '0',
        is_completed: editGoal.is_completed || false,
        completed_at: editGoal.completed_at || null
      };
      await apiService.progress.updateGoal(editGoal.id, payload);
      const goalsRes = await apiService.progress.getGoals();
      const list = Array.isArray(goalsRes.data?.results) ? goalsRes.data.results : (Array.isArray(goalsRes.data) ? goalsRes.data : []);
      setGoals(list);
      apiUtils.handleSuccess('Goal updated');
      setShowEditGoalModal(false);
      setEditGoal(null);
    } catch (error) {
      apiUtils.handleError(error, 'Failed to update goal');
    }
  };
  
// // Simple and reliable app timer logic - replace the existing useEffect

// Update stats when app timer changes
useEffect(() => {
  setStats(prevStats => ({
    ...prevStats,
    studyTime: appMinutes
  }));
}, [appMinutes]);

// Add these debugging functions to help identify the API issue:

// 1. First, let's check what the API expects by examining a goal object
const debugGoalStructure = (goal) => {
  console.log('Goal structure:', {
    id: goal.id,
    title: goal.title,
    is_completed: goal.is_completed,
    completed_at: goal.completed_at,
    target_value: goal.target_value,
    current_value: goal.current_value,
    deadline: goal.deadline,
    goal_type: goal.goal_type,
    priority: goal.priority,
    difficulty: goal.difficulty
  });
};

// 2. Enhanced update function with detailed logging
const onToggleGoalCompletionDebug = async (goalId, currentStatus) => {
  try {
    console.log('=== Goal Toggle Debug ===');
    console.log('Goal ID:', goalId);
    console.log('Current status:', currentStatus);
    
    // Find the goal in our local state
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      console.log('Found goal:', goal);
      debugGoalStructure(goal);
    }
    
    const newStatus = !currentStatus;
    console.log('New status will be:', newStatus);
    
    // Try different payload structures to see what works
    const payloadOptions = [
      // Option 1: Minimal
      { is_completed: newStatus },
      
      // Option 2: With timestamp
      { 
        is_completed: newStatus,
        completed_at: newStatus ? new Date().toISOString() : null
      },
      
      // Option 3: Full goal data (if API expects complete object)
      goal ? {
        title: goal.title,
        description: goal.description || '',
        target_value: goal.target_value,
        current_value: goal.current_value || '0',
        deadline: goal.deadline,
        goal_type: goal.goal_type,
        priority: goal.priority,
        difficulty: goal.difficulty,
        is_completed: newStatus,
        completed_at: newStatus ? new Date().toISOString() : null
      } : { is_completed: newStatus }
    ];
    
    // Try each payload until one works
    for (let i = 0; i < payloadOptions.length; i++) {
      const payload = payloadOptions[i];
      console.log(`Trying payload option ${i + 1}:`, payload);
      
      try {
        const response = await apiService.progress.updateGoal(goalId, payload);
        console.log('Success with option', i + 1, '- Response:', response);
        
        // Refresh goals list
        const goalsRes = await apiService.progress.getGoals();
        const list = Array.isArray(goalsRes.data?.results) 
          ? goalsRes.data.results 
          : (Array.isArray(goalsRes.data) ? goalsRes.data : []);
        setGoals(list);
        
        apiUtils.handleSuccess(newStatus ? 'Goal completed! 🎉' : 'Goal reactivated');
        return; // Success, exit function
        
      } catch (error) {
        console.log(`Option ${i + 1} failed:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        // If this is the last option, throw the error
        if (i === payloadOptions.length - 1) {
          throw error;
        }
      }
    }
    
  } catch (error) {
    console.error('All payload options failed:', error);
    apiUtils.handleError(error, 'Failed to update goal status');
  }
};

// 3. Test API endpoint directly


// useEffect(() => {
//   const LS_KEY = "appActiveMinutes";
//   const LAST_ACTIVE_KEY = "lastActiveTime";
  
//   // Get saved total minutes
//   const savedMinutes = parseInt(localStorage.getItem(LS_KEY) || "0", 10);
//   setAppMinutes(savedMinutes);
  
//   let startTime = Date.now();
//   let isTabActive = !document.hidden;
  
//   // Save current time as last active time
//   localStorage.setItem(LAST_ACTIVE_KEY, String(startTime));
  
//   const updateTimer = () => {
//     if (isTabActive) {
//       const now = Date.now();
//       const sessionMinutes = Math.floor((now - startTime) / 60000);
      
//       if (sessionMinutes > 0) {
//         const newTotal = savedMinutes + sessionMinutes;
//         setAppMinutes(newTotal);
//         localStorage.setItem(LS_KEY, String(newTotal));
//         localStorage.setItem(LAST_ACTIVE_KEY, String(now));
        
//         // Reset start time for next interval
//         startTime = now;
//       }
//     }
//   };
  
//   // Update timer every 60 seconds (1 minute)
//   const intervalId = setInterval(updateTimer, 60000);
  
//   // Handle tab visibility changes
//   const handleVisibilityChange = () => {
//     const wasActive = isTabActive;
//     isTabActive = !document.hidden;
    
//     if (!wasActive && isTabActive) {
//       // Tab became active - reset start time
//       startTime = Date.now();
//       localStorage.setItem(LAST_ACTIVE_KEY, String(startTime));
//     } else if (wasActive && !isTabActive) {
//       // Tab became inactive - save any accumulated time
//       updateTimer();
//     }
//   };
  
//   // Add visibility change listener
//   document.addEventListener('visibilitychange', handleVisibilityChange);
  
//   // Cleanup
//   return () => {
//     clearInterval(intervalId);
//     document.removeEventListener('visibilitychange', handleVisibilityChange);
//     // Final update on cleanup
//     updateTimer();
//   };
// }, []);

  const formatHM = (minutes) => {
    const safeMinutes = Number.isFinite(minutes) ? Math.max(0, Math.floor(minutes)) : 0;
    const h = Math.floor(safeMinutes / 60);
    const m = safeMinutes % 60;
    return `${h}h ${m}m`;
  };

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
        let attempts = [];

        try {
          const coursesResponse = await apiService.courses.getEnrollments();
          enrollments = Array.isArray(coursesResponse.data) ? coursesResponse.data : [];
        } catch (error) {
          console.warn('Failed to fetch enrollments:', error);
          enrollments = [];
        }

        try {
          const attemptsRes = await apiService.quizzes.listAttempts();
          attempts = Array.isArray(attemptsRes.data?.results) ? attemptsRes.data.results : (Array.isArray(attemptsRes.data) ? attemptsRes.data : []);
        } catch (error) {
          console.warn('Failed to fetch quiz attempts:', error);
          attempts = [];
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

        try {
          const goalsRes = await apiService.progress.getGoals();
          const list = Array.isArray(goalsRes.data?.results) ? goalsRes.data.results : (Array.isArray(goalsRes.data) ? goalsRes.data : []);
          setGoals(list);
        } catch (error) {
          console.warn('Failed to fetch goals:', error);
          setGoals([]);
        }

        // Safe data processing
        const avgAttemptScore = attempts.length ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length) : Math.round(progress.average_quiz_score || 0);
        const displayStreak = Math.max((progress.current_streak || 0) + 1, 1);

        // Preserve studyTime to avoid resetting App Time after fetch completes
        setStats(prev => ({
          ...prev,
          totalCourses: enrollments.length,
          completedCourses: enrollments.filter(e => e?.status === 'completed').length,
          totalQuizzes: attempts.length,
          completedQuizzes: attempts.length,
          currentStreak: displayStreak,
          accuracy: avgAttemptScore,
          level: Math.floor((progress.total_experience || 0) / 100) + 1
        }));

        // Fetch recent activity with error handling
        let recentSessions = { data: [] };
        let recentQuizzes = { data: attempts };
        let recentExplanations = { data: [] };

        try {
          recentSessions = await apiService.studySessions.getRecent(5);
        } catch (error) {
          console.warn('Failed to fetch recent sessions:', error);
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
          ...(Array.isArray(recentQuizzes.data) ? recentQuizzes.data.slice(0,5).map(att => ({
            id: att.id,
            type: 'quiz',
            title: att.quiz?.title || 'Quiz',
            time: apiUtils.formatDate(att.started_at),
            score: Math.round(att.score || 0)
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
    // {
    //   title: 'View Progress',
    //   description: 'Track your learning',
    //   icon: BarChart3,
    //   link: '/progress',
    //   color: 'primary'
    // }
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
              <p className="text-sm font-medium text-gray-600">App Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatHM(appMinutes)}</p>
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
              <p className="text-sm font-medium text-gray-600">Total Quizzes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
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

      

        {goals.length > 0 ? (
  goals.map((goal) => (
    <div key={goal.id} className={`p-4 rounded-lg border transition-all duration-200 ${
      goal.is_completed 
        ? 'bg-green-50 border-green-200 shadow-sm' 
        : 'bg-white border-gray-200 hover:border-purple-200 hover:shadow-sm'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className={`font-semibold truncate ${
              goal.is_completed ? 'text-gray-600 line-through' : 'text-gray-900'
            }`}>
              {goal.title}
            </h4>
            {goal.is_completed && (
              <span className="text-green-600 text-lg flex-shrink-0">✅</span>
            )}
            <span className={`px-2 py-1 text-xs rounded-full ${
              goal.priority === 'high' 
                ? 'bg-red-100 text-red-700' 
                : goal.priority === 'medium'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {goal.priority}
            </span>
            {goal.is_completed && (
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                COMPLETED
              </span>
            )}
          </div>
          
          {goal.description && (
            <p className={`text-sm mb-2 ${goal.is_completed ? 'text-gray-500' : 'text-gray-700'}`}>
              {goal.description}
            </p>
          )}
          
          <div className="space-y-1 text-sm">
            <p className={`${goal.is_completed ? 'text-gray-500' : 'text-gray-600'}`}>
              <span className="font-medium">Target:</span> {goal.target_value}
            </p>
            <p className={`text-xs ${goal.is_completed ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="font-medium">Deadline:</span> {new Date(goal.deadline).toLocaleDateString()}
            </p>
            

            {/* Show completion date for completed goals */}
            {goal.is_completed && goal.completed_at && (
              <p className="text-xs text-green-600 font-medium mt-2">
                ✓ Completed on {new Date(goal.completed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        
        {/* Action buttons - Different behavior for completed vs active goals */}
        <div className="flex flex-col space-y-2 flex-shrink-0">
          {goal.is_completed ? (
            // COMPLETED GOAL BUTTONS: Only View Details and Delete
            <>
              {/* View Details Button */}
              <button 
                onClick={() => {
                  setViewGoal(goal);
                  setShowViewGoalModal(true);
                }}
                className="px-3 py-2 text-sm rounded-md flex items-center justify-center bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                title="View goal details"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Details
              </button>

              {/* Delete Button */}
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this completed goal? This action cannot be undone.')) {
                    console.log('Deleting completed goal:', goal.id);
                    onDeleteGoal(goal.id);
                  }
                }} 
                className="px-3 py-2 text-sm rounded-md flex items-center justify-center text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-colors"
                title="Delete completed goal"
              >
                <Trash2 className="w-4 h-4 mr-1" /> 
                Delete
              </button>
            </>
          ) : (
            // ACTIVE GOAL BUTTONS: Edit, Delete
            <>
              <div className="flex space-x-1">
                {/* Edit button */}
                <button 
                  onClick={() => {
                    setEditGoal({ ...goal }); 
                    setShowEditGoalModal(true);
                  }} 
                  className="px-3 py-2 text-sm rounded-md flex items-center bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 transition-colors"
                  title="Edit goal details"
                >
                  <Edit3 className="w-3 h-3 mr-1" /> 
                  Edit
                </button>
                
                {/* Delete button */}
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this active goal?')) {
                      console.log('Deleting active goal:', goal.id);
                      onDeleteGoal(goal.id);
                    }
                  }} 
                  className="px-3 py-2 text-sm rounded-md flex items-center text-red-600 hover:bg-red-50 border border-red-300 hover:border-red-400 transition-colors"
                  title="Delete goal"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> 
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  ))
) : (
  <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
    <div className="text-gray-400 mb-2">
      <Target className="w-8 h-8 mx-auto" />
    </div>
    <p className="text-sm text-gray-600 font-medium">No learning goals yet</p>
    <p className="text-xs text-gray-500 mt-1">Set your first goal to start tracking your progress</p>
    <button
      onClick={() => setShowGoalModal(true)}
      className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
    >
      Add your first goal →
    </button>
  </div>
)}   </div>
      </div>

      {/* View Goal Details Modal */}
{showViewGoalModal && viewGoal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Goal Details
        </h3>
        <button
          onClick={() => setShowViewGoalModal(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {/* Goal Status */}
        <div className="flex items-center justify-center mb-4">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            viewGoal.is_completed 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {viewGoal.is_completed ? '✅ Completed' : '🎯 Active'}
          </span>
        </div>

        {/* Goal Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
            {viewGoal.title}
          </div>
        </div>

        {/* Description */}
        {viewGoal.description && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 min-h-[60px]">
              {viewGoal.description}
            </div>
          </div>
        )}

        {/* Goal Details Grid */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
              {viewGoal.target_value}
            </div>
          </div>

          {/* Only show current value for active goals */}
          {!viewGoal.is_completed && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                {viewGoal.current_value || '0'}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 capitalize">
              {viewGoal.goal_type.replace('_', ' ')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
              {new Date(viewGoal.deadline).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <div className={`w-full px-3 py-2 border border-gray-200 rounded-lg capitalize font-medium ${
                viewGoal.priority === 'high' 
                  ? 'bg-red-50 text-red-700' 
                  : viewGoal.priority === 'medium'
                  ? 'bg-yellow-50 text-yellow-700'
                  : 'bg-gray-50 text-gray-700'
              }`}>
                {viewGoal.priority}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 capitalize">
                {viewGoal.difficulty}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <div>
              <span className="font-medium">Created:</span> {new Date(viewGoal.created_at).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {new Date(viewGoal.updated_at).toLocaleString()}
            </div>
            {viewGoal.completed_at && (
              <div className="text-green-600">
                <span className="font-medium">Completed:</span> {new Date(viewGoal.completed_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between space-x-3 mt-6 pt-4 border-t">
        <button
          onClick={() => setShowViewGoalModal(false)}
          className="btn-secondary px-6 py-2"
        >
          Close
        </button>
        
        <div className="flex space-x-2">
          {viewGoal.is_completed ? (
            <>
              <button
                onClick={() => {
                  if (window.confirm('Delete this completed goal? This action cannot be undone.')) {
                    onDeleteGoal(viewGoal.id);
                    setShowViewGoalModal(false);
                  }
                }}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded-md transition-colors"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditGoal({ ...viewGoal });
                  setShowViewGoalModal(false);
                  setShowEditGoalModal(true);
                }}
                className="btn-primary px-4 py-2 text-sm"
              >
                Edit Goal
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Mark this goal as completed?')) {
                    onToggleGoalCompletion(viewGoal.id, viewGoal.is_completed);
                    setShowViewGoalModal(false);
                  }
                }}
                className="px-4 py-2 text-sm bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 rounded-md transition-colors"
              >
                Complete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
)}

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
                onClick={async () => {
                  if (!newGoal.title || !newGoal.target_value || !newGoal.deadline) {
                    apiUtils.handleError(new Error('Please fill in title, target value, and deadline'));
                    return;
                  }
                  try {
                    await apiService.progress.createGoal(newGoal);
                    const goalsRes = await apiService.progress.getGoals();
                    const list = Array.isArray(goalsRes.data?.results) ? goalsRes.data.results : (Array.isArray(goalsRes.data) ? goalsRes.data : []);
                    setGoals(list);
                    setNewGoal({ title: '', description: '', target_value: '', deadline: '', goal_type: 'completion', priority: 'medium', difficulty: 'moderate' });
                    setShowGoalModal(false);
                    apiUtils.handleSuccess('Goal added successfully!');
                  } catch (error) {
                    apiUtils.handleError(error, 'Failed to add goal');
                  }
                }}
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
                onClick={onSaveEditGoal}
                className="btn-primary px-4 py-2"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
       {/* Previous Quizzes */}
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
                  <p className="text-xs text-gray-500 mt-0.5">
                    {apiUtils.formatDate(att.started_at)} • {att.total_questions} questions
                  </p>
                </div>
                <div className="flex items-center space-x-3 ml-3">
                  <span
                    className={`text-sm font-semibold ${
                      att.score >= 80
                        ? 'text-green-600'
                        : att.score >= 60
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {Math.round(att.score || 0)}%
                  </span>
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