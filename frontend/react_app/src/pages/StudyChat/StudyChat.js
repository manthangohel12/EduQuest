import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, MessageSquare, Sparkles, BookOpen, Lightbulb } from 'lucide-react';
import { nodeService, apiUtils } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const StudyChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const messagesEndRef = useRef(null);

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

      // Get AI response
      const response = await simulateAIResponse(inputMessage);
      
      const aiMessage = {
        id: Date.now() + 1,
        content: response,
        messageType: 'text',
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Save AI message to backend
      if (currentSession) {
        await nodeService.chat.addMessage(currentSession._id, {
          content: response,
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

  const simulateAIResponse = async (message) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple response logic (replace with actual AI service)
    const responses = {
      'quantum': "Quantum physics deals with the behavior of matter and energy at the atomic and subatomic levels. Think of it like this: while classical physics describes how objects move in predictable ways, quantum physics shows that at the smallest scales, particles can exist in multiple states simultaneously and can be connected regardless of distance.",
      'calculus': "Calculus is the mathematical study of continuous change. Derivatives measure how fast something is changing at any given moment. For example, if you're driving a car, the derivative of your position gives you your speed, and the derivative of your speed gives you your acceleration.",
      'machine learning': "Machine learning is a subset of artificial intelligence where computers learn patterns from data without being explicitly programmed. It's like teaching a computer to recognize patterns the way humans do, but using algorithms and statistics.",
      'water cycle': "The water cycle is how water moves around our planet. Water evaporates from oceans and lakes, forms clouds, falls as rain or snow, and flows back to oceans. It's nature's way of recycling water!",
      'quadratic': "Quadratic equations are equations with x² terms. To solve them, you can use the quadratic formula: x = (-b ± √(b² - 4ac)) / 2a. This gives you the values of x that make the equation true.",
      'mitosis meiosis': "Mitosis creates two identical cells for growth and repair. Meiosis creates four cells with half the chromosomes for reproduction. Think of mitosis as copying a book, and meiosis as creating a summary."
    };

    const lowerMessage = message.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }

    return "I'd be happy to help you learn! Could you please provide more specific details about what you'd like to understand? I can explain concepts, solve problems, or help you with any subject you're studying.";
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
              <button
                onClick={clearChat}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear Chat
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
          <div className="card">
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
          </div>

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