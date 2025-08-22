import React, { useState } from 'react';
import { Upload, FileText, Sparkles, Copy, Download, BookOpen, Target, Users, HelpCircle, MessageSquare, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aiService, apiService, apiUtils } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';


const ContentSimplifier = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [simplifiedContent, setSimplifiedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState('middle_school');
  const [targetAudience, setTargetAudience] = useState('student');
  const [keyConcepts, setKeyConcepts] = useState([]);
  const [explanations, setExplanations] = useState([]);
  const [originalComplexity, setOriginalComplexity] = useState(0);
  const [simplifiedComplexity, setSimplifiedComplexity] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyItems, setHistoryItems] = useState([]);


  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await apiService.aiExplanations.getAll();
      const data = res.data;
      const items = Array.isArray(data) ? data : (data.results || []);
      setHistoryItems(items);
    } catch (err) {
      console.error('Failed to load history:', err);
      const e = apiUtils.handleError(err, 'Failed to load history');
      setHistoryError(e.detail || e.networkError || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleToggleHistory = async () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next) {
      await loadHistory();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setLoading(true);
        
        // Use the AI service to process the file
        const response = await aiService.processFile(file, difficultyLevel, targetAudience);
        const result = response.data;
        
        // Update state with processed content
        setContent(result.original_text);
        setSimplifiedContent(result.simplified_text);
        setOriginalComplexity(result.original_complexity);
        setSimplifiedComplexity(result.simplified_complexity);
        setKeyConcepts(result.key_concepts || []);
        setExplanations(result.explanations || []);
        
        // Save to backend for history
        try {
          await apiService.aiExplanations.create({
            original_content: result.original_text,
            simplified_content: result.simplified_text,
            difficulty_level: difficultyLevel,
            content_type: 'file',
            key_concepts: result.key_concepts,
            definitions: {},
            examples: result.explanations
          });
        } catch (saveError) {
          console.warn('Failed to save to backend:', saveError);
        }
        
        apiUtils.handleSuccess('File processed and simplified successfully!');
        
      } catch (error) {
        console.error('File processing error:', error);
        apiUtils.handleError(error, 'Failed to process file. Please try again.');
        
        // Fallback to basic file reading
        const reader = new FileReader();
        reader.onload = (event) => {
          setContent(event.target.result);
          apiUtils.handleSuccess('File uploaded (basic processing only)');
        };
        reader.readAsText(file);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSimplify = async () => {
    if (!content.trim()) {
      apiUtils.handleError(new Error('Please enter some content to simplify'));
      return;
    }

    setLoading(true);
    try {
      // Use the new endpoint that includes recommendations
      const response = await aiService.simplifyWithRecommendations(content, difficultyLevel, targetAudience);
      
      const { simplification } = response.data;
      
      // Set simplification results
      setSimplifiedContent(simplification.simplified_text);
      setOriginalComplexity(simplification.original_complexity);
      setSimplifiedComplexity(simplification.simplified_complexity);
      setKeyConcepts(simplification.key_concepts);
      setExplanations(simplification.explanations);
      
      // Save to backend
      await apiService.aiExplanations.create({
        original_content: content,
        simplified_content: simplification.simplified_text,
        difficulty_level: difficultyLevel,
        content_type: 'text',
        key_concepts: simplification.key_concepts,
        definitions: {},
        examples: simplification.explanations
      });
      
      apiUtils.handleSuccess('Content simplified successfully!');
    } catch (error) {
      console.error('Simplification error:', error);
      // Fallback to original method if recommendations fail
      try {
        const fallbackResponse = await aiService.simplifyText(content, difficultyLevel, targetAudience);
        const { simplified_text, original_complexity, simplified_complexity, key_concepts, explanations } = fallbackResponse.data;
        
        setSimplifiedContent(simplified_text);
        setOriginalComplexity(original_complexity);
        setSimplifiedComplexity(simplified_complexity);
        setKeyConcepts(key_concepts);
        setExplanations(explanations);
        
        // Save to backend
        await apiService.aiExplanations.create({
          original_content: content,
          simplified_content: simplified_text,
          difficulty_level: difficultyLevel,
          content_type: 'text',
          key_concepts: key_concepts,
          definitions: {},
          examples: explanations
        });
        
        apiUtils.handleSuccess('Content simplified successfully!');
      } catch (fallbackError) {
        apiUtils.handleError(fallbackError, 'Failed to simplify content. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    apiUtils.handleSuccess('Copied to clipboard!');
  };

  const handleDownload = (text, filename) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    apiUtils.handleSuccess('File downloaded successfully!');
  };

  const handleGetRecommendations = () => {
    if (!content.trim()) {
      apiUtils.handleError(new Error('Please enter some content to get recommendations'));
      return;
    }

    // Navigate to the dedicated recommendations page
    navigate('/recommendations', { 
      state: { 
        content: content,
        source: 'simplifier'
      } 
    });
  };



  const handleGenerateQuiz = () => {
    if (simplifiedContent) {
      // Navigate to quiz page with the simplified content
      navigate('/quiz', { 
        state: { 
          content: content,
          source: 'original'
        } 
      });
    }
  };

  const handleAskDoubts = () => {
    if (!simplifiedContent) {
      apiUtils.handleError(new Error('Please simplify content first to provide context for Study Chat'));
      return;
    }
    navigate('/chat', {
      state: {
        context: simplifiedContent,
        source: 'simplifier'
      }
    });
  };

  const getComplexityColor = (complexity) => {
    if (complexity >= 80) return 'text-green-600';
    if (complexity >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplexityLabel = (complexity) => {
    if (complexity >= 80) return 'Easy';
    if (complexity >= 60) return 'Moderate';
    return 'Difficult';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Simplifier</h1>
          <p className="text-gray-600">Transform complex content into easy-to-understand explanations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-primary-600" />
          <span className="text-sm font-medium text-primary-600">AI-Powered</span>
          <button
            onClick={handleToggleHistory}
            className="btn-secondary px-3 py-1"
          >
            {showHistory ? 'Hide History' : 'View History'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Original Content</h2>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Upload className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Upload File</span>
                  <input
                    type="file"
                    accept=".txt,.doc,.docx,.pdf,.rtf,.md,.html,.htm"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Paste or type your complex content here..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />

            <div className="mt-4 space-y-4">
              {/* <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={difficultyLevel}
                    onChange={(e) => setDifficultyLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="student">Student</option>
                    <option value="professional">Professional</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div> */}

              <button
                onClick={handleSimplify}
                disabled={loading || !content.trim()}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                <span>{loading ? 'Simplifying...' : 'Simplify Content'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Simplified Content</h2>
              {simplifiedContent && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(simplifiedContent)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(simplifiedContent, 'simplified-content.txt')}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    title="Download as file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {simplifiedContent ? (
              <div className="space-y-4">
                

                <textarea
                  value={simplifiedContent}
                  readOnly
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none bg-gray-50"
                />

                {/* Generate Quiz Button */}
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={handleGenerateQuiz}
                    className="btn-secondary flex items-center space-x-2 px-6 py-3"
                  >
                    <HelpCircle className="w-5 h-5" />
                    <span>Generate Quiz from the Original Content</span>
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Create a quiz based on the original content to test understanding
                  </p>
                </div>

                {/* Ask Doubts in Study Chat Button */}
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={handleAskDoubts}
                    className="btn-primary flex items-center space-x-2 px-6 py-3"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>Ask doubts in Study Chat</span>
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Opens Study Chat with this simplified content as context
                  </p>
                </div>

                {/* Get Learning Recommendations Button */}
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={handleGetRecommendations}
                    disabled={loading}
                    className="btn-secondary flex items-center space-x-2 px-6 py-3"
                  >
                    <Lightbulb className="w-5 h-5" />
                    <span>Get Learning Recommendations</span>
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Discover Wikipedia articles, YouTube videos, and educational resources
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Simplified content will appear here</p>
                </div>
              </div>
            )}
          </div>


        </div>
      </div>

      {showHistory && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Simplification History</h2>
            <div className="flex items-center space-x-2">
              <button onClick={loadHistory} className="btn-secondary px-3 py-1">Refresh</button>
            </div>
          </div>
          {historyLoading ? (
            <div className="py-8 flex justify-center"><LoadingSpinner size="md" /></div>
          ) : historyError ? (
            <p className="text-red-600 text-sm">{historyError}</p>
          ) : historyItems.length === 0 ? (
            <p className="text-gray-500 text-sm">No history yet. Simplify something to see it here.</p>
          ) : (
            <div className="space-y-6">
              {historyItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-600">
                      <span className="mr-2">{apiUtils.formatDate(item.created_at)}</span>
                      {item.content_type && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 rounded">{item.content_type}</span>
                      )}
                      {item.difficulty_level && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded">{item.difficulty_level}</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-800 mb-2">Original</h3>
                      <textarea
                        value={item.original_content || ''}
                        readOnly
                        className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none bg-gray-50"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-800 mb-2">Simplified</h3>
                      <textarea
                        value={item.simplified_content || ''}
                        readOnly
                        className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentSimplifier; 