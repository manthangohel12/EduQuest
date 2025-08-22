import React, { useState, useEffect } from 'react';
import { BookOpen, Play, Globe, GraduationCap, Target, Clock, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

const LearningRecommendations = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState({
    wikipedia: [],
    youtube: [],
    web_resources: [],
    courses: [],
    topics: [],
    subject: 'general',
    total_recommendations: 0
  });
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [customContent, setCustomContent] = useState('');

  const subjects = [
    'Mathematics', 'Science', 'History', 'Literature', 'Computer Science',
    'Languages', 'Arts', 'Music', 'Philosophy', 'Economics', 'Psychology',
    'Geography', 'Biology', 'Chemistry', 'Physics', 'Engineering'
  ];

  const commonTopics = [
    'Algebra', 'Calculus', 'Programming', 'Machine Learning', 'World War II',
    'Shakespeare', 'Python', 'JavaScript', 'React', 'Data Science',
    'Artificial Intelligence', 'Climate Change', 'Evolution', 'Quantum Physics'
  ];

  useEffect(() => {
    if (user?.difficulty_preference) {
      // Set default subject based on user preferences
      if (user.learning_style === 'visual') {
        setSelectedSubject('Computer Science');
      } else if (user.learning_style === 'auditory') {
        setSelectedSubject('Languages');
      } else if (user.learning_style === 'kinesthetic') {
        setSelectedSubject('Science');
      } else {
        setSelectedSubject('Mathematics');
      }
    }
  }, [user]);

  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    setSelectedTopics([]);
  };

  const handleTopicToggle = (topic) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleCustomContentChange = (e) => {
    setCustomContent(e.target.value);
  };

  const getRecommendations = async () => {
    if (!selectedSubject && !customContent.trim()) {
      toast.error('Please select a subject or enter custom content');
      return;
    }

    setLoading(true);
    
    try {
      let content = customContent.trim();
      if (!content && selectedTopics.length > 0) {
        content = selectedTopics.join(', ');
      } else if (!content) {
        content = selectedSubject;
      }

      const response = await apiService.ai.getIntelligentRecommendations(
        content,
        selectedTopics,
        selectedSubject || 'general',
        20
      );

      if (response.data) {
        setRecommendations(response.data);
        toast.success(`Found ${response.data.total_recommendations} recommendations!`);
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast.error('Failed to get recommendations. Please try again.');
      
      // Fallback to mock data for demonstration
      setRecommendations({
        wikipedia: [
          {
            title: 'Introduction to Machine Learning',
            description: 'A comprehensive overview of machine learning concepts and applications',
            url: 'https://en.wikipedia.org/wiki/Machine_learning',
            topic: 'Machine Learning',
            type: 'wikipedia',
            relevance_score: 0.95
          }
        ],
        youtube: [
          {
            title: 'Machine Learning for Beginners',
            description: 'Learn the basics of machine learning in this comprehensive tutorial',
            url: 'https://www.youtube.com/watch?v=example',
            topic: 'Machine Learning',
            type: 'youtube',
            relevance_score: 0.92
          }
        ],
        web_resources: [
          {
            title: 'Machine Learning Tutorial',
            description: 'Step-by-step guide to understanding machine learning',
            url: 'https://example.com/ml-tutorial',
            topic: 'Machine Learning',
            type: 'web',
            relevance_score: 0.88
          }
        ],
        courses: [
          {
            title: 'Machine Learning Course',
            description: 'Comprehensive course covering all aspects of ML',
            url: 'https://coursera.org/ml-course',
            topic: 'Machine Learning',
            type: 'course',
            platform: 'Coursera',
            relevance_score: 0.90
          }
        ],
        topics: ['Machine Learning', 'Artificial Intelligence', 'Data Science'],
        subject: selectedSubject || 'Computer Science',
        total_recommendations: 4
      });
    } finally {
      setLoading(false);
    }
  };

  const renderRecommendationCard = (item, index) => (
    <div key={index} className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {item.type === 'wikipedia' && <BookOpen className="w-6 h-6 text-blue-600" />}
          {item.type === 'youtube' && <Play className="w-6 h-6 text-red-600" />}
          {item.type === 'web' && <Globe className="w-6 h-6 text-green-600" />}
          {item.type === 'course' && <GraduationCap className="w-6 h-6 text-purple-600" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary-600 transition-colors"
            >
              {item.title}
            </a>
          </h3>
          
          <p className="text-gray-600 mb-3">{item.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Target className="w-4 h-4 mr-1" />
                {item.topic}
              </span>
              {item.platform && (
                <span className="flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  {item.platform}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm font-medium text-green-600">
                  {Math.round(item.relevance_score * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Recommendations</h1>
          <p className="text-gray-600">Get personalized learning resources based on your interests and preferences</p>
        </div>
        <div className="flex items-center space-x-2">
          <BookOpen className="w-6 h-6 text-primary-600" />
          <span className="text-sm font-medium text-primary-600">AI-Powered</span>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Your Search</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose a Subject
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => handleSubjectChange(subject)}
                  className={`p-2 text-sm rounded-lg border transition-colors ${
                    selectedSubject === subject
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Topics (Optional)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {commonTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTopicToggle(topic)}
                  className={`p-2 text-sm rounded-lg border transition-colors ${
                    selectedTopics.includes(topic)
                      ? 'bg-secondary-100 border-secondary-300 text-secondary-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Content Input */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or describe what you want to learn
          </label>
          <textarea
            value={customContent}
            onChange={handleCustomContentChange}
            placeholder="e.g., I want to learn about neural networks and deep learning..."
            className="input-field"
            rows="3"
          />
        </div>

        {/* Get Recommendations Button */}
        <div className="mt-6">
          <button
            onClick={getRecommendations}
            disabled={loading || (!selectedSubject && !customContent.trim())}
            className="btn-primary w-full lg:w-auto"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Getting Recommendations...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Get Recommendations</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Recommendations Display */}
      {recommendations.total_recommendations > 0 && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="card bg-gradient-to-r from-primary-50 to-secondary-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Found {recommendations.total_recommendations} Recommendations
                </h3>
                <p className="text-gray-600">
                  Based on {recommendations.subject} - {recommendations.topics.join(', ')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">
                  {recommendations.total_recommendations}
                </div>
                <div className="text-sm text-gray-500">Resources</div>
              </div>
            </div>
          </div>

          {/* Wikipedia Articles */}
          {recommendations.wikipedia.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                Wikipedia Articles ({recommendations.wikipedia.length})
              </h3>
              <div className="space-y-4">
                {recommendations.wikipedia.map((item, index) => renderRecommendationCard(item, index))}
              </div>
            </div>
          )}

          {/* YouTube Videos */}
          {recommendations.youtube.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Play className="w-5 h-5 mr-2 text-red-600" />
                YouTube Videos ({recommendations.youtube.length})
              </h3>
              <div className="space-y-4">
                {recommendations.youtube.map((item, index) => renderRecommendationCard(item, index))}
              </div>
            </div>
          )}

          {/* Web Resources */}
          {recommendations.web_resources.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-green-600" />
                Web Resources ({recommendations.web_resources.length})
              </h3>
              <div className="space-y-4">
                {recommendations.web_resources.map((item, index) => renderRecommendationCard(item, index))}
              </div>
            </div>
          )}

          {/* Courses */}
          {recommendations.courses.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-purple-600" />
                Course Recommendations ({recommendations.courses.length})
              </h3>
              <div className="space-y-4">
                {recommendations.courses.map((item, index) => renderRecommendationCard(item, index))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Recommendations State */}
      {!loading && recommendations.total_recommendations === 0 && (
        <div className="card text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
          <p className="text-gray-600 mb-4">
            Select a subject or describe what you want to learn to get personalized recommendations.
          </p>
        </div>
      )}
    </div>
  );
};

export default LearningRecommendations;
