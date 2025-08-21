const axios = require('axios');

class AIService {
  constructor() {
    this.baseURL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
    this.apiKey = process.env.AI_API_KEY || '';
  }

  // Generate AI response for study questions
  async generateResponse(userMessage, context = '') {
    try {
      // If we have an AI service URL, use it
      if (this.baseURL && this.baseURL !== 'http://localhost:8001') {
        const response = await axios.post(`${this.baseURL}/study-chat/respond`, {
          question: userMessage,
          context: context
        }, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : undefined
          }
        });
        
        return response.data?.answer || this.getFallbackResponse(userMessage);
      }
      
      // Fallback to local AI logic
      return this.getFallbackResponse(userMessage);
      
    } catch (error) {
      console.error('AI service error:', error.message);
      return this.getFallbackResponse(userMessage);
    }
  }

  // Fallback AI responses for common study topics
  getFallbackResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Math topics
    if (message.includes('calculus') || message.includes('derivative') || message.includes('integral')) {
      return `I'd be happy to help you with calculus! ${message.includes('derivative') ? 'Derivatives measure the rate of change of a function. For example, the derivative of x² is 2x, which tells us how fast x² is changing at any point.' : ''} ${message.includes('integral') ? 'Integrals find the area under a curve or the accumulation of change. They\'re essentially the reverse of derivatives.' : ''} Would you like me to explain a specific concept or work through an example problem?`;
    }
    
    // Physics topics
    if (message.includes('physics') || message.includes('force') || message.includes('energy')) {
      return `Physics is fascinating! ${message.includes('force') ? 'Force is any interaction that changes the motion of an object. Newton\'s laws describe how forces affect motion.' : ''} ${message.includes('energy') ? 'Energy is the ability to do work. It can be kinetic (motion), potential (stored), or in other forms like thermal or electrical.' : ''} What specific physics concept would you like to explore?`;
    }
    
    // Chemistry topics
    if (message.includes('chemistry') || message.includes('molecule') || message.includes('reaction')) {
      return `Chemistry is all about matter and its changes! ${message.includes('molecule') ? 'Molecules are groups of atoms bonded together. They determine the properties of substances.' : ''} ${message.includes('reaction') ? 'Chemical reactions involve breaking and forming bonds between atoms, creating new substances.' : ''} What chemistry topic interests you most?`;
    }
    
    // Biology topics
    if (message.includes('biology') || message.includes('cell') || message.includes('evolution')) {
      return `Biology is the study of living things! ${message.includes('cell') ? 'Cells are the basic units of life. All living organisms are made of cells.' : ''} ${message.includes('evolution') ? 'Evolution is the process by which species change over time through natural selection and genetic variation.' : ''} What biological concept would you like to learn about?`;
    }
    
    // History topics
    if (message.includes('history') || message.includes('ancient') || message.includes('war')) {
      return `History helps us understand how the past shaped our present! ${message.includes('ancient') ? 'Ancient civilizations like Egypt, Greece, and Rome laid the foundation for modern society.' : ''} ${message.includes('war') ? 'Wars have shaped borders, politics, and technology throughout human history.' : ''} What historical period or event would you like to explore?`;
    }
    
    // Literature topics
    if (message.includes('literature') || message.includes('book') || message.includes('poem')) {
      return `Literature opens windows to different worlds and perspectives! ${message.includes('book') ? 'Books can transport us to different times and places, helping us understand human nature.' : ''} ${message.includes('poem') ? 'Poetry uses language in creative ways to express emotions and ideas.' : ''} What literary work or genre interests you?`;
    }
    
    // Study tips
    if (message.includes('study') || message.includes('learn') || message.includes('remember')) {
      return `Great question about studying! Here are some effective strategies:
      
1. **Active Learning**: Don't just read - take notes, ask questions, and explain concepts to others
2. **Spaced Repetition**: Review material at increasing intervals to strengthen memory
3. **Practice Problems**: Apply what you learn through exercises and real-world examples
4. **Break It Down**: Divide complex topics into smaller, manageable chunks
5. **Get Enough Sleep**: Sleep is crucial for memory consolidation

What subject are you studying? I can give you more specific tips!`;
    }
    
    // General academic help
    if (message.includes('help') || message.includes('confused') || message.includes('understand')) {
      return `I'm here to help you learn! It sounds like you might be feeling a bit confused about something. 

Here's what I can help with:
- Explaining complex concepts in simple terms
- Breaking down difficult topics step by step
- Providing examples and analogies
- Suggesting study strategies
- Answering questions about various subjects

What specific topic or concept would you like me to help you understand? Feel free to ask me anything!`;
    }
    
    // Default response
    return `I'm your AI study assistant, and I'm here to help you learn! I can help with:

📚 **Academic Subjects**: Math, Science, History, Literature, and more
🧠 **Study Skills**: Effective learning strategies and memory techniques
💡 **Concept Explanations**: Breaking down complex topics into simple terms
❓ **Question Answering**: Helping you understand any study-related questions

What would you like to learn about today? Feel free to ask me anything related to your studies!`;
  }

  // Get subject-specific study tips
  getStudyTips(subject) {
    const tips = {
      math: [
        "Practice regularly - math is a skill that improves with repetition",
        "Work through problems step by step",
        "Don't just memorize formulas - understand why they work",
        "Use visual aids like graphs and diagrams",
        "Connect new concepts to things you already know"
      ],
      science: [
        "Make observations and ask questions",
        "Understand the scientific method",
        "Use experiments and hands-on activities",
        "Connect concepts across different topics",
        "Practice critical thinking and analysis"
      ],
      history: [
        "Create timelines to see how events connect",
        "Understand cause and effect relationships",
        "Consider multiple perspectives",
        "Connect historical events to current issues",
        "Use primary sources when possible"
      ],
      literature: [
        "Read actively - take notes and ask questions",
        "Look for themes and patterns",
        "Consider the historical and cultural context",
        "Analyze the author's style and techniques",
        "Connect the text to your own experiences"
      ]
    };
    
    return tips[subject.toLowerCase()] || tips.math;
  }
}

module.exports = new AIService();

