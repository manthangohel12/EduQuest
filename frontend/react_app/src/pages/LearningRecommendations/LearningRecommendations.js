import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, BookOpen, Play, Globe, Lightbulb, ExternalLink, Loader2 } from 'lucide-react';
import { aiService, apiUtils } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const LearningRecommendations = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Get content from navigation state or allow manual input
  useEffect(() => {
    if (location.state?.content) {
      setContent(location.state.content);
      // Clear the navigation state to avoid re-filling on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleAnalyzeContent = async () => {
    if (!content.trim()) {
      apiUtils.handleError(new Error('Please enter some content to analyze'));
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setRecommendations(null);
    setShowAnalysis(false);

    try {
      // First, analyze the content using Gemini to understand what it's about
      const analysisResponse = await aiService.analyzeContent(content);
      const contentAnalysis = analysisResponse.data;
      setAnalysis(contentAnalysis);
      setShowAnalysis(true);

      // Then get recommendations based on the analyzed content
      const recResponse = await aiService.getIntelligentRecommendations(
        content,
        contentAnalysis.topics || [],
        contentAnalysis.subject || 'general',
        12
      );
      
      setRecommendations(recResponse.data);
      apiUtils.handleSuccess('Content analyzed and learning recommendations generated successfully!');
      
    } catch (error) {
      console.error('Analysis error:', error);
      apiUtils.handleError(error, 'Failed to analyze content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResourceClick = (resource) => {
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGenerateQuiz = () => {
    if (content) {
      navigate('/quiz', { 
        state: { 
          content: content,
          source: 'recommendations'
        } 
      });
    }
  };

  const handleSimplifyContent = () => {
    if (content) {
      navigate('/simplify', { 
        state: { 
          content: content,
          source: 'recommendations'
        } 
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGoBack}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Learning Recommendations</h1>
            <p className="text-gray-600">Get intelligent learning resources based on content analysis</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-6 h-6 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-600">AI-Powered</span>
        </div>
      </div>

      {/* Content Input */}
      <div className="card">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content for Analysis
            </label>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Paste or type content to get intelligent learning recommendations..."
              className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={handleAnalyzeContent}
              disabled={loading || !content.trim()}
              className="btn-primary flex items-center space-x-2 px-8 py-3"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>{loading ? 'Analyzing...' : 'Analyze & Get Recommendations'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Analysis */}
      {showAnalysis && analysis && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Content Analysis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Identified Topics</h3>
              <div className="space-y-2">
                {analysis.topics?.map((topic, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-800">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Subject Area</h3>
              <p className="text-sm text-gray-800">{analysis.subject || 'General'}</p>
              
              {analysis.complexity && (
                <>
                  <h3 className="text-sm font-medium text-gray-700 mb-2 mt-4">Content Complexity</h3>
                  <p className="text-sm text-gray-800">{analysis.complexity}</p>
                </>
              )}
            </div>
          </div>

          {analysis.summary && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Content Summary</h3>
              <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">
                {analysis.summary}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {recommendations && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-indigo-600" />
                Learning Resources Found
              </h2>
              <div className="text-sm text-gray-500">
                {recommendations.total_recommendations} resources available
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {recommendations.wikipedia?.length || 0}
                </div>
                <div className="text-sm text-blue-700">Wikipedia</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {recommendations.youtube?.length || 0}
                </div>
                <div className="text-sm text-red-700">Videos</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {recommendations.web_resources?.length || 0}
                </div>
                <div className="text-sm text-green-700">Web Resources</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {recommendations.courses?.length || 0}
                </div>
                <div className="text-sm text-purple-700">Courses</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleSimplifyContent}
              className="btn-secondary flex items-center space-x-2 px-6 py-3"
            >
              <BookOpen className="w-5 h-5" />
              <span>Simplify This Content</span>
            </button>
            <button
              onClick={handleGenerateQuiz}
              className="btn-primary flex items-center space-x-2 px-6 py-3"
            >
              <Lightbulb className="w-5 h-5" />
              <span>Generate Quiz</span>
            </button>
          </div>

          {/* Resource Sections */}
          {Object.entries(recommendations).map(([key, resources]) => {
            if (key === 'summary' || key === 'topics' || key === 'subject' || key === 'total_recommendations') {
              return null;
            }

            if (!Array.isArray(resources) || resources.length === 0) {
              return null;
            }

            const getSectionIcon = (type) => {
              switch (type) {
                case 'wikipedia':
                  return <BookOpen className="w-5 h-5 text-blue-600" />;
                case 'youtube':
                  return <Play className="w-5 h-5 text-red-600" />;
                case 'web_resources':
                  return <Globe className="w-5 h-5 text-green-600" />;
                case 'courses':
                  return <Lightbulb className="w-5 h-5 text-purple-600" />;
                default:
                  return <Globe className="w-5 h-5 text-gray-600" />;
              }
            };

            const getSectionTitle = (type) => {
              switch (type) {
                case 'wikipedia':
                  return 'Wikipedia Articles';
                case 'youtube':
                  return 'Educational Videos';
                case 'web_resources':
                  return 'Web Resources';
                case 'courses':
                  return 'Online Courses';
                default:
                  return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
              }
            };

            const getSectionColor = (type) => {
              switch (type) {
                case 'wikipedia':
                  return 'border-blue-200 bg-blue-50';
                case 'youtube':
                  return 'border-red-200 bg-red-50';
                case 'web_resources':
                  return 'border-green-200 bg-green-50';
                case 'courses':
                  return 'border-purple-200 bg-purple-50';
                default:
                  return 'border-gray-200 bg-gray-50';
              }
            };

            return (
              <div key={key} className={`border rounded-lg ${getSectionColor(key)}`}>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    {getSectionIcon(key)}
                    <h3 className="font-medium text-gray-900">{getSectionTitle(key)}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300">
                      {resources.length}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {resources.map((resource, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleResourceClick(resource)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail/Icon */}
                        {resource.thumbnail && key === 'youtube' ? (
                          <img
                            src={resource.thumbnail}
                            alt={resource.title}
                            className="w-20 h-15 object-cover rounded-md flex-shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-15 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                            {getSectionIcon(key)}
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                            {resource.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {resource.description}
                          </p>
                          
                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {resource.channel && (
                              <span className="flex items-center gap-1">
                                <span>Channel:</span>
                                <span className="font-medium">{resource.channel}</span>
                              </span>
                            )}
                            {resource.platform && (
                              <span className="flex items-center gap-1">
                                <span>Platform:</span>
                                <span className="font-medium">{resource.platform}</span>
                              </span>
                            )}
                            {resource.domain && (
                              <span className="flex items-center gap-1">
                                <span>Domain:</span>
                                <span className="font-medium">{resource.domain}</span>
                              </span>
                            )}
                            {resource.duration && (
                              <span className="flex items-center gap-1">
                                <span>Duration:</span>
                                <span className="font-medium">{resource.duration}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResourceClick(resource);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LearningRecommendations;

