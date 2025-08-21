const Chat = require('../models/Chat');
const aiService = require('../services/aiService');

class ChatController {
  // Create a new chat session
  async createSession(req, res) {
    try {
      const { subject, difficulty } = req.body;
      const sessionId = require('uuid').v4();
      
      const newSession = new Chat({
        sessionId,
        subject: subject || 'General Study',
        difficulty: difficulty || 'intermediate',
        messages: []
      });
      
      await newSession.save();
      
      res.status(201).json({
        success: true,
        data: {
          sessionId: newSession.sessionId,
          subject: newSession.subject,
          difficulty: newSession.difficulty,
          messages: []
        }
      });
    } catch (error) {
      console.error('Error creating chat session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create chat session'
      });
    }
  }

  // Get chat session by ID
  async getSession(req, res) {
    try {
      const { sessionId } = req.params;
      const session = await Chat.findOne({ sessionId });
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }
      
      res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          subject: session.subject,
          difficulty: session.difficulty,
          messages: session.messages
        }
      });
    } catch (error) {
      console.error('Error fetching chat session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chat session'
      });
    }
  }

  // Send a message and get AI response
  async sendMessage(req, res) {
    try {
      const { sessionId } = req.params;
      const { content } = req.body;
      
      if (!content || content.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Message content is required'
        });
      }
      
      const session = await Chat.findOne({ sessionId });
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }
      
      // Add user message
      await session.addMessage('user', content.trim());
      
      // Generate AI response
      const aiResponse = await aiService.generateResponse(content.trim(), session.subject);
      
      // Add AI response
      await session.addMessage('assistant', aiResponse);
      
      // Get updated session
      const updatedSession = await Chat.findOne({ sessionId });
      
      res.json({
        success: true,
        data: {
          userMessage: {
            role: 'user',
            content: content.trim(),
            timestamp: new Date()
          },
          aiResponse: {
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date()
          },
          session: {
            sessionId: updatedSession.sessionId,
            subject: updatedSession.subject,
            difficulty: updatedSession.difficulty,
            messages: updatedSession.messages
          }
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message'
      });
    }
  }

  // Get all chat sessions
  async getAllSessions(req, res) {
    try {
      const sessions = await Chat.find({})
        .select('sessionId subject difficulty lastActivity createdAt')
        .sort({ lastActivity: -1 });
      
      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chat sessions'
      });
    }
  }

  // Delete chat session
  async deleteSession(req, res) {
    try {
      const { sessionId } = req.params;
      const session = await Chat.findOneAndDelete({ sessionId });
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Chat session deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete chat session'
      });
    }
  }

  // Get study tips for a specific subject
  async getStudyTips(req, res) {
    try {
      const { subject } = req.params;
      const tips = aiService.getStudyTips(subject);
      
      res.json({
        success: true,
        data: {
          subject: subject || 'general',
          tips: tips
        }
      });
    } catch (error) {
      console.error('Error getting study tips:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get study tips'
      });
    }
  }
}

module.exports = new ChatController();

