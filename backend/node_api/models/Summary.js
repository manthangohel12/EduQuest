const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
    default: null,
  },
  originalContent: {
    type: String,
    required: true,
    trim: true,
  },
  summaryContent: {
    type: String,
    required: true,
    trim: true,
  },
  source: {
    type: String,
    enum: ['chat', 'manual', 'simplifier'],
    default: 'chat',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Summary', summarySchema);
