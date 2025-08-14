import React, { useState, useEffect } from 'react';
import { Map, BookOpen, Target, Clock, CheckCircle, Play, Star, TrendingUp } from 'lucide-react';
import { apiService, apiUtils } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const LearningPath = () => {
  const { user } = useAuth();
  const [selectedPath, setSelectedPath] = useState('recommended');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [learningPaths, setLearningPaths] = useState({
    recommended: {
      title: "AI-Recommended Path",
      description: "Personalized learning sequence based on your progress",
      subjects: []
    },
    custom: {
      title: "Custom Learning Path",
      description: "Build your own learning journey",
      subjects: []
    }
  });

  // Fetch learning paths data
  useEffect(() => {
    const fetchLearningPaths = async () => {
      try {
        setDataLoading(true);
        
        // Fetch learning paths and recommendations
        const [pathsResponse, recommendationsResponse] = await Promise.all([
          apiService.learningPaths.getAll(),
          apiService.learningPaths.getRecommendations()
        ]);

        const paths = pathsResponse.data;
        const recommendations = recommendationsResponse.data;

        // Transform data for UI
        const recommendedPath = {
          title: "AI-Recommended Path",
          description: "Personalized learning sequence based on your progress",
          subjects: recommendations.map(rec => ({
            name: rec.subject,
            progress: rec.progress || 0,
            topics: rec.topics.map(topic => ({
              name: topic.name,
              status: topic.status || 'not-started',
              difficulty: topic.difficulty || 'medium',
              time: topic.estimated_time || 60
            }))
          }))
        };

        const customPath = {
          title: "Custom Learning Path",
          description: "Build your own learning journey",
          subjects: paths.map(path => ({
            name: path.title,
            progress: path.progress || 0,
            topics: path.steps.map(step => ({
              name: step.title,
              status: step.status || 'not-started',
              difficulty: step.difficulty || 'medium',
              time: step.estimated_time || 60
            }))
          }))
        };

        setLearningPaths({
          recommended: recommendedPath,
          custom: customPath
        });

      } catch (error) {
        apiUtils.handleError(error, 'Failed to load learning paths');
      } finally {
        setDataLoading(false);
      }
    };

    fetchLearningPaths();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'not-started': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-orange-600';
      case 'expert': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🟠';
      case 'expert': return '🔴';
      default: return '⚪';
    }
  };

  const handleStartTopic = async (subjectName, topicName) => {
    setLoading(true);
    try {
      // Update learning path step status
      await apiService.learningPaths.update(selectedPath, {
        step: topicName,
        status: 'in-progress',
        started_at: new Date().toISOString()
      });
      apiUtils.handleSuccess(`Started learning ${topicName}`);
    } catch (error) {
      apiUtils.handleError(error, 'Failed to start topic');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTopic = async (subjectName, topicName) => {
    setLoading(true);
    try {
      // Update learning path step status
      await apiService.learningPaths.update(selectedPath, {
        step: topicName,
        status: 'completed',
        completed_at: new Date().toISOString()
      });
      apiUtils.handleSuccess(`Completed ${topicName}!`);
    } catch (error) {
      apiUtils.handleError(error, 'Failed to complete topic');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (dataLoading) {
    return <LoadingSpinner />;
  }

  const currentPath = learningPaths[selectedPath];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Path</h1>
          <p className="text-gray-600">Your personalized learning journey</p>
        </div>
        <div className="flex items-center space-x-2">
          <Map className="w-6 h-6 text-primary-600" />
          <span className="text-sm font-medium text-primary-600">AI-Powered</span>
        </div>
      </div>

      {/* Path Selection */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Learning Paths</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedPath('recommended')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPath === 'recommended'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Recommended
            </button>
            <button
              onClick={() => setSelectedPath('custom')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPath === 'custom'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{currentPath.title}</h3>
          <p className="text-gray-600">{currentPath.description}</p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Total Subjects</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{currentPath.subjects.length}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Completed Topics</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {currentPath.subjects.reduce((sum, subject) => 
                sum + subject.topics.filter(topic => topic.status === 'completed').length, 0
              )}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">Total Time</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {formatTime(currentPath.subjects.reduce((sum, subject) => 
                sum + subject.topics.reduce((topicSum, topic) => topicSum + topic.time, 0), 0
              ))}
            </p>
          </div>
        </div>
      </div>

      {/* Subjects and Topics */}
      <div className="space-y-6">
        {currentPath.subjects.map((subject, subjectIndex) => (
          <div key={subject.name} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                  <p className="text-sm text-gray-600">
                    {subject.topics.filter(t => t.status === 'completed').length} of {subject.topics.length} topics completed
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-600">{subject.progress}%</p>
                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${subject.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {subject.topics.map((topic, topicIndex) => (
                <div
                  key={topic.name}
                  className={`p-4 border rounded-lg transition-colors ${
                    topic.status === 'completed'
                      ? 'border-green-200 bg-green-50'
                      : topic.status === 'in-progress'
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {topic.status === 'completed' && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {topic.status === 'in-progress' && (
                          <Play className="w-5 h-5 text-blue-600" />
                        )}
                        {topic.status === 'not-started' && (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{topic.name}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(topic.status)}`}>
                            {topic.status.replace('-', ' ')}
                          </span>
                          <span className={`text-xs font-medium ${getDifficultyColor(topic.difficulty)}`}>
                            {getDifficultyIcon(topic.difficulty)} {topic.difficulty}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(topic.time)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {topic.status === 'not-started' && (
                        <button
                          onClick={() => handleStartTopic(subject.name, topic.name)}
                          disabled={loading}
                          className="btn-primary text-sm"
                        >
                          {loading ? <LoadingSpinner size="sm" color="white" /> : 'Start'}
                        </button>
                      )}
                      {topic.status === 'in-progress' && (
                        <button
                          onClick={() => handleCompleteTopic(subject.name, topic.name)}
                          disabled={loading}
                          className="btn-secondary text-sm"
                        >
                          {loading ? <LoadingSpinner size="sm" color="primary" /> : 'Complete'}
                        </button>
                      )}
                      {topic.status === 'completed' && (
                        <span className="text-green-600 text-sm font-medium">Completed</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-500" />
          AI Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-gray-900 mb-2">Next Best Topic</h4>
            <p className="text-sm text-gray-600 mb-3">
              Based on your current progress, we recommend focusing on Linear Algebra next.
            </p>
            <button className="btn-primary text-sm">Start Now</button>
          </div>
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-gray-900 mb-2">Study Strategy</h4>
            <p className="text-sm text-gray-600 mb-3">
              Try studying for 45-minute sessions with 15-minute breaks for optimal retention.
            </p>
            <button className="btn-secondary text-sm">Learn More</button>
          </div>
        </div>
      </div>

      {/* Progress Insights */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
          Progress Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-primary-600 mb-1">85%</div>
            <div className="text-sm text-gray-600">Overall Progress</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-green-600 mb-1">12</div>
            <div className="text-sm text-gray-600">Topics Completed</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-blue-600 mb-1">3</div>
            <div className="text-sm text-gray-600">Current Streak</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPath; 