const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: ''
  },
  isAI: {
    type: Boolean,
    default: false
  },
  aiModel: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const chatSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  sessionType: {
    type: String,
    enum: ['study'],
    default: 'study'
  },
  subject: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  aiSettings: {
    model: {
      type: String,
      default: 'gemini-1.5-flash'
    },
    personality: {
      type: String,
      enum: ['friendly', 'professional', 'encouraging', 'strict'],
      default: 'friendly'
    },
    expertise: {
      type: String,
      default: 'general'
    }
  },
  statistics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    userMessages: {
      type: Number,
      default: 0
    },
    aiMessages: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update statistics when messages are added
chatSessionSchema.methods.updateStatistics = function () {
  this.statistics.totalMessages = this.messages.length;
  this.statistics.userMessages = this.messages.filter(msg => !msg.isAI).length;
  this.statistics.aiMessages = this.messages.filter(msg => msg.isAI).length;
  this.lastActivity = new Date();
  return this.save();
};

// Add message to chat
chatSessionSchema.methods.addMessage = function (messageData) {
  this.messages.push(messageData);
  return this.updateStatistics();
};

// Get recent messages
chatSessionSchema.methods.getRecentMessages = function (limit = 50) {
  return this.messages.slice(-limit);
};

// Get chat summary
chatSessionSchema.methods.getSummary = function () {
  const userMessages = this.messages.filter(msg => !msg.isAI);
  const aiMessages = this.messages.filter(msg => msg.isAI);
  
  return {
    id: this._id,
    title: this.title,
    sessionType: this.sessionType,
    subject: this.subject,
    difficulty: this.difficulty,
    totalMessages: this.statistics.totalMessages,
    userMessages: userMessages.length,
    aiMessages: aiMessages.length,
    lastActivity: this.lastActivity,
    createdAt: this.createdAt
  };
};
const Chat=mongoose.model('ChatSession', chatSessionSchema);
module.exports = Chat;