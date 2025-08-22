import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  MessageSquare, 
  BookOpen, 
  Lightbulb, 
  Trash2, 
  Plus,
  Brain,
  GraduationCap,
  Zap
} from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const StudyChat = () => {
  // EDITED: use env-based Node API URL; default to 3001 after port swap
  const NODE_API_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:3001';
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showSessions, setShowSessions] = useState(false);
  const [showStudyTips, setShowStudyTips] = useState(false);
  const [studyTips, setStudyTips] = useState([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Normalize any message object coming from backend or local state
  const toUiMessage = (msg) => ({
    role: msg?.role ?? (msg?.isAI ? 'assistant' : 'user'),
    content: msg?.content ?? '',
    timestamp: msg?.timestamp || msg?.createdAt || msg?.updatedAt || new Date()
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadSessions();
  }, []);

  // Sample conversation starters
  const conversationStarters = [
    "Can you explain quantum physics in simple terms?",
    "Help me understand calculus derivatives",
    "What are the main principles of machine learning?",
    "Explain the water cycle for a 5th grader",
    "How do I solve quadratic equations?",
    // "What is the difference between mitosis and meiosis?",
    // "Tell me about ancient civilizations",
    // "How does photosynthesis work?",
    // "Explain the basics of programming",
    // "What are effective study techniques?",
    // "How do atoms form molecules?",
    // "What is the Renaissance period?"
  ];

  const loadSessions = async () => {
    try {
      const response = await fetch(`${NODE_API_URL}/api/chat/sessions`);
      const data = await response.json();
      if (data.success) {
        setSessions(data.data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const createNewSession = async () => {
    try {
      setSessionLoading(true);
      console.log('Creating new session...');
      
      const response = await fetch(`${NODE_API_URL}/api/chat/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: 'General Study',
          difficulty: 'intermediate'
        })
      });

      const data = await response.json();
      console.log('Session creation response:', data);
      
      if (data.success) {
        const newSession = data.data;
        console.log('Setting current session:', newSession);
        setCurrentSession(newSession);
      setMessages([]);
        setShowSessions(false);
        await loadSessions();
        
        // Add a welcome message
        const welcomeMessage = {
          role: 'assistant',
          content: "Hello! I'm your AI study assistant, and I'm here to help you learn! I can help with:\n\n📚 **Academic Subjects**: Math, Science, History, Literature, and more\n🧠 **Study Skills**: Effective learning strategies and memory techniques\n💡 **Concept Explanations**: Breaking down complex topics into simple terms\n❓ **Question Answering**: Helping you understand any study-related questions\n\nWhat would you like to learn about today? Feel free to ask me anything related to your studies!",
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      } else {
        console.error('Failed to create session:', data.message);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setSessionLoading(false);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      setLoading(true);
      const response = await fetch(`${NODE_API_URL}/api/chat/sessions/${sessionId}`);
      const data = await response.json();
      if (data.success) {
        setCurrentSession(data.data);
        const normalized = (data.data.messages || []).map(toUiMessage);
        setMessages(normalized);
        setShowSessions(false);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      const response = await fetch(`${NODE_API_URL}/api/chat/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await loadSessions();
        if (currentSession?.sessionId === sessionId) {
          setCurrentSession(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession) return;

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    console.log('Sending message:', userMessage);
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // First, save the user message to the backend
      const messageResponse = await fetch(`${NODE_API_URL}/api/chat/sessions/${currentSession.sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: userMessage.content,
          messageType: 'text',
          isAI: false
        })
      });

      if (!messageResponse.ok) {
        throw new Error('Failed to save user message');
      }

      // Generate AI response using Gemini AI service
      const aiResponse = await generateAIResponse(userMessage.content);
      
      // Save the AI response to the backend
      const aiMessageResponse = await fetch(`${NODE_API_URL}/api/chat/sessions/${currentSession.sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: aiResponse,
          messageType: 'text',
          isAI: true,
          aiModel: 'gemini-1.5-flash'
        })
      });

      if (!aiMessageResponse.ok) {
        throw new Error('Failed to save AI message');
      }

      // Add AI response to the chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }]);

      await loadSessions(); // Refresh sessions to update last activity
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Generate intelligent AI response using Gemini AI service
  const generateAIResponse = async (userQuestion) => {
    try {
      const response = await fetch('http://localhost:8001/study-chat/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userQuestion,
          context: currentSession?.subject || 'General Study'
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.is_study_related) {
        return data.answer;
      } else {
        return "I'm here to help with study-related questions. Please ask something related to your studies, such as math, science, history, literature, or any academic subject you'd like to learn about.";
      }
    } catch (error) {
      console.error('Error calling Gemini AI service:', error);
      // Fallback to intelligent local responses if AI service fails
      return generateFallbackResponse(userQuestion);
    }
  };

  // Fallback response generation for when AI service is unavailable
  const generateFallbackResponse = (userQuestion) => {
    const question = userQuestion.toLowerCase();
    
    // Enhanced response logic with more subjects and detailed explanations
    const responses = {
      // Mathematics
      'math': {
        'algebra': "Algebra is the branch of mathematics that deals with symbols and the rules for manipulating these symbols. It's like solving puzzles where you need to find the value of unknown variables. For example, in the equation 2x + 3 = 11, you'd solve for x by subtracting 3 from both sides (2x = 8) and then dividing by 2 (x = 4).",
        'calculus': "Calculus is the mathematical study of continuous change. It has two main branches: differential calculus (studying rates of change) and integral calculus (studying accumulation of quantities). Think of it as the mathematics of motion and growth - it helps us understand how things change over time.",
        'geometry': "Geometry is the study of shapes, sizes, positions, and dimensions. It's everywhere around us - from the angles of a triangle to the curves of a circle. Practical applications include architecture, engineering, and even art!",
        'trigonometry': "Trigonometry deals with the relationships between the sides and angles of triangles. It's essential for understanding waves, sound, light, and many real-world phenomena. The basic functions are sine, cosine, and tangent."
      },
      
      // Science
      'science': {
        'physics': "Physics is the study of matter, energy, and their interactions. It explains everything from how objects fall to how light travels. Key concepts include forces, motion, energy, and waves. It's the foundation for understanding how our universe works!",
        'chemistry': "Chemistry is the study of matter and the changes it undergoes. It explains how atoms combine to form molecules, how reactions occur, and why materials have different properties. Everything around us is made of chemicals!",
        'biology': "Biology is the study of living organisms and their interactions with each other and their environment. It covers everything from cells and genetics to ecosystems and evolution. It helps us understand life itself!",
        'astronomy': "Astronomy is the study of celestial objects and phenomena beyond Earth's atmosphere. It explores planets, stars, galaxies, and the universe as a whole. It's one of the oldest sciences and continues to reveal amazing discoveries!"
      },
      
      // History
      'history': {
        'ancient': "Ancient history covers the period from the beginning of recorded human history to the fall of the Western Roman Empire in 476 CE. It includes civilizations like Egypt, Greece, Rome, China, and Mesopotamia. These societies laid the foundation for modern civilization!",
        'medieval': "Medieval history spans roughly from the 5th to the 15th century. It was a time of knights, castles, feudalism, and the rise of powerful kingdoms. The period saw significant developments in art, architecture, and culture.",
        'modern': "Modern history begins around the 15th century with the Renaissance and continues to the present. It includes the Age of Exploration, Industrial Revolution, World Wars, and the digital age. It's marked by rapid technological and social change."
      },
      
      // Literature
      'literature': {
        'poetry': "Poetry is a form of literary expression that uses aesthetic and rhythmic qualities of language. It can be structured (like sonnets) or free verse. Poetry often uses metaphor, simile, and imagery to convey emotions and ideas in a condensed form.",
        'novels': "Novels are long-form fictional narratives that tell stories through characters, plot, and setting. They can explore complex themes and provide deep insights into human nature and society. Different genres include romance, mystery, science fiction, and historical fiction.",
        'drama': "Drama is literature intended for performance. It includes plays, scripts, and theatrical works. Drama can be comedy, tragedy, or a mix of both, and it explores human conflicts and emotions through dialogue and action."
      },
      
      // Computer Science
      'programming': "Programming is the process of creating instructions for computers to follow. It involves writing code in programming languages like Python, JavaScript, or Java. Programming is used to create software, websites, apps, and solve complex problems. It's like giving a computer a recipe to follow!",
      'coding': "Coding is writing instructions in a programming language that a computer can understand and execute. It's like learning a new language - you need to understand syntax, logic, and problem-solving. Coding skills are valuable in many fields today!",
      
      // Study Skills
      'study': "Effective studying involves active learning techniques like summarizing, questioning, and testing yourself. Break down complex topics into smaller parts, use spaced repetition, and connect new information to what you already know. Regular review and practice are key!",
      'learning': "Learning is most effective when you're actively engaged. Use techniques like mind mapping, teaching others, and applying concepts to real-world examples. Everyone learns differently, so experiment with various methods to find what works best for you!",
      
      // General Knowledge
      'what is': "I'd be happy to explain that concept! Could you provide more specific details about what you'd like to understand? I can break down complex topics into simple terms and provide examples to help you learn.",
      'how to': "I can help you learn step-by-step! Please give me more details about what you're trying to accomplish, and I'll provide a clear explanation with practical examples.",
      'explain': "I'd love to help explain that! To give you the most helpful response, could you provide more context or specific details about what you'd like me to clarify?"
    };

    // Check for specific subject matches first
    for (const [subject, topics] of Object.entries(responses)) {
      if (typeof topics === 'object') {
        // This is a subject with multiple topics
        for (const [topic, explanation] of Object.entries(topics)) {
          if (question.includes(topic)) {
            return explanation;
          }
        }
      } else if (question.includes(subject)) {
        // This is a general subject
        return topics;
      }
    }

    // Check for specific question patterns
    if (question.includes('quantum')) {
      return "Quantum physics deals with the behavior of matter and energy at the atomic and subatomic levels. Unlike classical physics, quantum mechanics shows that particles can exist in multiple states simultaneously (superposition) and can be connected regardless of distance (entanglement). It's the foundation of modern technologies like lasers, transistors, and quantum computers!";
    }
    
    
    
    if (question.includes('machine learning') || question.includes('ai')) {
      return "Machine learning is a subset of artificial intelligence where computers learn patterns from data without being explicitly programmed. Think of it as teaching a computer to recognize patterns the way humans do, but using algorithms and statistics. It's used in recommendation systems, image recognition, language processing, and many other applications!";
    }
    
    if (question.includes('water cycle')) {
      return "The water cycle is how water moves around our planet through evaporation, condensation, precipitation, and collection. Water evaporates from oceans and lakes, forms clouds, falls as rain or snow, and flows back to oceans. It's nature's way of recycling water and is essential for all life on Earth!";
    }
    
    if (question.includes('quadratic')) {
      return "Quadratic equations are equations with x² terms. They form parabolas when graphed and can have 0, 1, or 2 real solutions. You can solve them using factoring, completing the square, or the quadratic formula: x = (-b ± √(b² - 4ac)) / 2a. They're used in physics, engineering, and many real-world applications!";
    }
    
    if (question.includes('mitosis') || question.includes('meiosis')) {
      return "Mitosis and meiosis are both cell division processes, but they serve different purposes. Mitosis creates two identical cells for growth and repair. Meiosis creates four cells with half the chromosomes for reproduction. Think of mitosis as copying a book (duplication), and meiosis as creating a summary (reduction division)!";
    }
    
    if (question.includes('ancient') || question.includes('civilization')) {
      return "Ancient civilizations were the first complex human societies that emerged thousands of years ago. They include Mesopotamia (the first civilization), Ancient Egypt with its pyramids and pharaohs, Ancient Greece with democracy and philosophy, Ancient Rome with its empire and law, and Ancient China with its dynasties and inventions. These societies developed writing, agriculture, architecture, and complex social structures that laid the foundation for modern civilization!";
    }
    
    if (question.includes('photosynthesis')) {
      return "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose (sugar) and oxygen. It's like a natural solar panel! Plants use chlorophyll (the green pigment) to capture sunlight energy. This process is crucial for life on Earth because it produces oxygen for animals to breathe and provides the energy foundation for most food chains. Without photosynthesis, life as we know it wouldn't exist!";
    }
    
    if (question.includes('renaissance')) {
      return "The Renaissance was a period of great cultural, artistic, and intellectual rebirth in Europe from the 14th to 17th centuries. It marked the transition from the Middle Ages to modern times. Key features include a renewed interest in classical Greek and Roman culture, the development of humanism, amazing advances in art (like Leonardo da Vinci and Michelangelo), scientific discoveries, and the beginning of the Age of Exploration. It was a time when people began to question old beliefs and explore new ideas!";
    }
    
    if (question.includes('atom') || question.includes('molecule')) {
      return "Atoms are the basic building blocks of matter - they're incredibly tiny! When atoms join together, they form molecules. Think of atoms like LEGO pieces and molecules like the structures you build with them. For example, two hydrogen atoms and one oxygen atom join to form a water molecule (H₂O). The way atoms connect depends on their electrons and chemical properties. This bonding creates everything from simple water to complex proteins in your body!";
    }

    // If no specific match, provide a helpful general response
    return "I'd be happy to help you learn! To give you the most helpful response, could you please provide more specific details about what you'd like to understand? I can explain concepts, solve problems, or help you with any subject you're studying. What specific topic or question do you have in mind?";
  };

  const getStudyTips = async (subject) => {
    try {
      const response = await fetch(`${NODE_API_URL}/api/chat/study-tips/${subject}`);
      const data = await response.json();
      if (data.success) {
        setStudyTips(data.data.tips);
        setShowStudyTips(true);
      }
    } catch (error) {
      console.error('Error getting study tips:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleStarterClick = (starter) => {
    setInputMessage(starter);
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentSession(null);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Brain className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">StudyChat AI</h1>
        </div>
          <p className="text-xl text-gray-600">Your intelligent study partner for learning assistance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg h-[700px] flex flex-col">
            {/* Chat Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {currentSession ? currentSession.subject : 'AI Study Assistant'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {currentSession ? `Difficulty: ${currentSession.difficulty}` : 'Ready to help you learn'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">                  
                  <button
                    onClick={() => setShowSessions(!showSessions)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    Sessions
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
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Start Learning Today!</h3>
                    <p className="text-gray-500 mb-6">Ask me anything about your studies. I'm here to help!</p>
                    {!currentSession && (
                      <button
                        onClick={createNewSession}
                        disabled={sessionLoading}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {sessionLoading ? <LoadingSpinner size="sm" /> : <Plus className="w-5 h-5" />}
                        {sessionLoading ? 'Creating...' : 'Start New Session'}
                      </button>
                    )}
                </div>
              ) : (
                messages.map((message, index) => {
                  const role = message?.role ?? (message?.isAI ? 'assistant' : 'user');
                  const when = message?.timestamp || message?.createdAt || message?.updatedAt || new Date();
                  return (
                    <div
                      key={index}
                      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {role === 'assistant' && (
                            <Bot className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-2 ${
                              role === 'user' ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                              {formatTime(when)}
                            </p>
                          </div>
                          {role === 'user' && (
                            <User className="w-5 h-5 text-blue-200 mt-1 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {loading && (
                <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-3 rounded-2xl">
                      <div className="flex items-center space-x-3">
                        <Bot className="w-5 h-5 text-blue-600" />
                        <LoadingSpinner size="sm" />
                      <span className="text-sm">AI is thinking...</span>
                      </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                    placeholder={currentSession ? "Ask me anything about your studies..." : "Create a session first to start chatting..."}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                    disabled={!currentSession || loading}
                />
                <button
                    onClick={sendMessage}
                    disabled={loading || !inputMessage.trim() || !currentSession}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                </button>
                </div>
                {!currentSession && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Click "Start New Session" to begin chatting with the AI
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
          <div className="space-y-6">
          {/* Quick Starters */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-500" />
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
            {/* {showStudyTips && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              Study Tips
            </h3>
                <div className="space-y-3">
                  {studyTips.map((tip, index) => (
                    <div key={index} className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">{tip}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => getStudyTips('math')}
                    className="w-full p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Math Tips
                  </button>
                  <button
                    onClick={() => getStudyTips('science')}
                    className="w-full p-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    Science Tips
                  </button>
                  <button
                    onClick={() => getStudyTips('history')}
                    className="w-full p-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    History Tips
                  </button>
                </div>
              </div>
            )} */}

            {/* Chat Sessions */}
            {showSessions && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                  Chat Sessions
                </h3>
                <div className="space-y-2">
                  {sessions.length === 0 ? (
                    <p className="text-sm text-gray-500">No sessions yet.</p>
                  ) : (
                    sessions.map((session) => (
                      <div key={session.sessionId} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <p className="font-medium text-gray-900 text-sm">{session.subject}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {session.difficulty} • {new Date(session.lastActivity).toLocaleDateString()}
                            </p>
              </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => loadSession(session.sessionId)}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => deleteSession(session.sessionId)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
              </div>
            </div>
          </div>
                    ))
                  )}
                  <button
                    onClick={createNewSession}
                    disabled={sessionLoading}
                    className="w-full mt-3 p-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    + New Session
                  </button>
                </div>
              </div>
            )}

          {/* Chat Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat Stats</h3>
              <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Messages</span>
                <span className="font-medium">{messages.length}</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-gray-600">Sessions</span>
                  <span className="font-medium">{sessions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                <span className="font-medium">
                    {currentSession ? 'Active' : 'Not started'}
                </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyChat; 
