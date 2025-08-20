import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, MessageSquare, Sparkles, BookOpen, Lightbulb, Save, History } from 'lucide-react';
import { nodeService, apiService, apiUtils, aiService } from '../../services/api';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const StudyChat = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const messagesEndRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [showQuizHistory, setShowQuizHistory] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [quizHistoryLoading, setQuizHistoryLoading] = useState(false);
  const [quizHistoryError, setQuizHistoryError] = useState('');
  const [quizDetails, setQuizDetails] = useState({}); // { [quizId]: QuizDetail }
  const [expandedQuizIds, setExpandedQuizIds] = useState({}); // { [quizId]: boolean }
  const [contextText, setContextText] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat sessions on component mount
  useEffect(() => {
    loadChatSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Preload context from navigation (e.g., Content Simplifier)
  useEffect(() => {
    const incoming = (location && location.state) ? (location.state.context || location.state.content || '') : '';
    if (incoming && typeof incoming === 'string') {
      setContextText(incoming);
    }
  }, [location]);

  // Sample conversation starters
  const conversationStarters = [
    "Can you explain quantum physics in simple terms?",
    "Help me understand calculus derivatives",
    "What are the main principles of machine learning?",
    "Explain the water cycle for a 5th grader",
    "How do I solve quadratic equations?",
    "What is the difference between mitosis and meiosis?"
  ];

  const loadChatSessions = async () => {
    try {
      const response = await nodeService.chat.getSessions();
      setSessions(response.data);
    } catch (error) {
      apiUtils.handleError(error, 'Failed to load chat sessions');
    }
  };

  const loadSummaryHistory = async () => {
    if (!currentSession) {
      setSummaries([]);
      return;
    }
    try {
      const resp = await nodeService.summaries.list({ sessionId: currentSession._id });
      setSummaries(resp.data || []);
    } catch (error) {
      apiUtils.handleError(error, 'Failed to load summary history');
    }
  };

  const loadQuizHistory = async () => {
    setQuizHistoryLoading(true);
    setQuizHistoryError('');
    try {
      const resp = await apiService.quizzes.listAttempts();
      const items = Array.isArray(resp.data?.results) ? resp.data.results : (resp.data || []);
      setQuizAttempts(items);
    } catch (error) {
      apiUtils.handleError(error, 'Failed to load quiz history');
      setQuizHistoryError('Failed to load quiz history');
    } finally {
      setQuizHistoryLoading(false);
    }
  };

  const fetchQuizDetail = async (quizId) => {
    try {
      if (quizDetails[quizId]) return;
      const resp = await apiService.quizzes.getById(quizId);
      setQuizDetails(prev => ({ ...prev, [quizId]: resp.data }));
    } catch (error) {
      apiUtils.handleError(error, 'Failed to load quiz details');
    }
  };

  const toggleQuizExpand = async (quizId) => {
    const willExpand = !expandedQuizIds[quizId];
    setExpandedQuizIds(prev => ({ ...prev, [quizId]: willExpand }));
    if (willExpand && !quizDetails[quizId]) {
      await fetchQuizDetail(quizId);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await nodeService.chat.createSession({
        title: 'New Study Session',
        description: 'AI-powered study assistance',
        sessionType: 'study'
      });
      setCurrentSession(response.data);
      setMessages([]);
      apiUtils.handleSuccess('New chat session created');
    } catch (error) {
      apiUtils.handleError(error, 'Failed to create new session');
    }
  };

  const loadSession = async (sessionId) => {
    try {
      const response = await nodeService.chat.getSession(sessionId);
      setCurrentSession(response.data);
      setMessages(response.data.messages || []);
    } catch (error) {
      apiUtils.handleError(error, 'Failed to load session');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      content: inputMessage,
      messageType: 'text',
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Save user message to backend
      if (currentSession) {
        await nodeService.chat.addMessage(currentSession._id, {
          content: inputMessage,
          messageType: 'text',
          sender: 'user'
        });
      }

      // Get AI response from backend AI service
      let responseText = '';
      try {
        const resp = await aiService.studyChatRespond(inputMessage, contextText);
        responseText = resp?.data?.answer || '';
        if (!responseText) {
          responseText = "I'm here to help with study-related questions. Please try asking in a different way.";
        }
      } catch (e) {
        apiUtils.handleError(e, 'AI response failed');
        responseText = 'Sorry, the AI tutor is unavailable right now.';
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        content: responseText,
        messageType: 'text',
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Save AI message to backend
      if (currentSession) {
        await nodeService.chat.addMessage(currentSession._id, {
          content: responseText,
          messageType: 'text',
          sender: 'ai'
        });
      }

      setChatHistory(prev => [...prev, userMessage, aiMessage]);
    } catch (error) {
      apiUtils.handleError(error, 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const saveLastExchange = async () => {
    if (!currentSession) {
      apiUtils.handleError(new Error('Please create or load a session first.'));
      return;
    }

    // Find the last AI message and the nearest preceding user message
    const reversed = [...messages].reverse();
    const lastAiIndex = reversed.findIndex(m => m.sender === 'ai');
    if (lastAiIndex === -1) {
      apiUtils.handleError(new Error('No AI response to save yet.'));
      return;
    }
    const lastAiMessage = reversed[lastAiIndex];
    const userBeforeAi = reversed.slice(lastAiIndex + 1).find(m => m.sender === 'user');
    if (!userBeforeAi) {
      apiUtils.handleError(new Error('Could not find the preceding user message.'));
      return;
    }

    setSaving(true);
    try {
      await nodeService.summaries.create({
        originalContent: userBeforeAi.content,
        summaryContent: lastAiMessage.content,
        sessionId: currentSession._id,
        source: 'chat',
        metadata: { clientIds: { user: userBeforeAi.id, ai: lastAiMessage.id } },
      });
      apiUtils.handleSuccess('Summary saved');
      if (showHistory) await loadSummaryHistory();
    } catch (error) {
      apiUtils.handleError(error, 'Failed to save summary');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStarterClick = (starter) => {
    setInputMessage(starter);
  };

  const clearChat = () => {
    setMessages([]);
    setChatHistory([]);
    setCurrentSession(null);
    apiUtils.handleSuccess('Chat history cleared');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Chat</h1>
          <p className="text-gray-600">Your AI-powered study partner for learning assistance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-primary-600" />
          <span className="text-sm font-medium text-primary-600">AI Tutor</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <div className="card h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">EduQuest AI Tutor</h3>
                  <p className="text-sm text-gray-500">Always here to help you learn</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={saveLastExchange}
                  disabled={saving || messages.length < 2}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  title="Save last user/AI exchange as a summary"
                >
                  {saving ? <LoadingSpinner size="xs" /> : <Save className="w-4 h-4" />}
                  <span>Save Summary</span>
                </button>
                <button
                  onClick={async () => { const newShow = !showHistory; setShowHistory(newShow); if (newShow) await loadSummaryHistory(); }}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                  title="Toggle summary history"
                >
                  <History className="w-4 h-4" />
                  <span>{showHistory ? 'Hide History' : 'View History'}</span>
                </button>
                <button
                  onClick={async () => { const newShow = !showQuizHistory; setShowQuizHistory(newShow); if (newShow) await loadQuizHistory(); }}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                  title="Toggle quiz history"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{showQuizHistory ? 'Hide Quiz History' : 'Quiz History'}</span>
                </button>
                <button
                  onClick={clearChat}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear Chat
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {contextText && (
                <div className="mb-2 px-3 py-2 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded flex items-center justify-between">
                  <span>Using context from previous page. Your questions will be answered based on it.</span>
                  <button onClick={() => setContextText('')} className="text-blue-600 hover:underline">Clear</button>
                </div>
              )}
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                  <p className="text-gray-500">Ask me anything about your studies!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.sender === 'ai' && (
                          <Bot className="w-4 h-4 text-primary-600 mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender === 'user' ? 'text-primary-200' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                        {message.sender === 'user' && (
                          <User className="w-4 h-4 text-primary-200 mt-1 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-primary-600" />
                      <LoadingSpinner size="sm" color="primary" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your studies..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows="2"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !inputMessage.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Summary History */}
          {showHistory && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <History className="w-5 h-5 mr-2" />
                Summary History
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {summaries.length === 0 ? (
                  <p className="text-sm text-gray-500">No summaries saved yet.</p>
                ) : (
                  summaries.map(s => (
                    <div key={s._id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 line-clamp-3">{s.summaryContent}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(s.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Quiz History */}
          {showQuizHistory && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Quiz History
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {quizHistoryLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600"><LoadingSpinner size="xs" /> Loading...</div>
                ) : quizHistoryError ? (
                  <p className="text-sm text-red-600">{quizHistoryError}</p>
                ) : quizAttempts.length === 0 ? (
                  <p className="text-sm text-gray-500">No quiz attempts yet.</p>
                ) : (
                  quizAttempts.map((a) => {
                    const q = a.quiz || {};
                    const qid = q.id;
                    const expanded = !!expandedQuizIds[qid];
                    const detail = qid ? quizDetails[qid] : null;
                    return (
                      <div key={a.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <p className="font-medium text-gray-900 text-sm">{q.title || 'Untitled Quiz'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {q.subject ? `${q.subject} • ` : ''}{q.difficulty ? q.difficulty : ''}{q.total_questions ? ` • ${q.total_questions} questions` : ''}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Attempted: {a.started_at ? new Date(a.started_at).toLocaleString() : '—'}
                              {typeof a.score === 'number' ? ` • Score: ${Math.round(a.score)}%` : ''}
                            </p>
                          </div>
                          {qid && (
                            <button
                              onClick={() => toggleQuizExpand(qid)}
                              className="text-xs text-primary-600 hover:text-primary-700"
                            >
                              {expanded ? 'Hide Source' : 'View Source'}
                            </button>
                          )}
                        </div>
                        {expanded && (
                          <div className="mt-2">
                            {detail ? (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Source Content</p>
                                <textarea
                                  className="w-full text-xs p-2 border border-gray-200 rounded bg-white"
                                  rows="4"
                                  readOnly
                                  value={detail.source_content || ''}
                                />
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500">Loading content...</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
          {/* Quick Starters */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" />
              Quick Starters
            </h3>
            <div className="space-y-2">
              {conversationStarters.map((starter, index) => (
                <button
                  key={index}
                  onClick={() => handleStarterClick(starter)}
                  className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>

          {/* Study Tips */}
          {/* <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Study Tips
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900 mb-1">Active Learning</p>
                <p>Ask questions and engage with the material actively</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium text-green-900 mb-1">Spaced Repetition</p>
                <p>Review concepts at increasing intervals</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="font-medium text-purple-900 mb-1">Practice Problems</p>
                <p>Apply what you learn through exercises</p>
              </div>
            </div>
          </div> */}

          {/* Chat Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Messages</span>
                <span className="font-medium">{messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Session Time</span>
                <span className="font-medium">
                  {messages.length > 0 ? 'Active' : 'Not started'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyChat; 