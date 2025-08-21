const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Create a new chat session
router.post('/sessions', chatController.createSession);

// Get chat session by ID
router.get('/sessions/:sessionId', chatController.getSession);

// Send a message and get AI response
router.post('/sessions/:sessionId/messages', chatController.sendMessage);

// Get all chat sessions
router.get('/sessions', chatController.getAllSessions);

// Delete chat session
router.delete('/sessions/:sessionId', chatController.deleteSession);

// Get study tips for a specific subject
router.get('/study-tips/:subject', chatController.getStudyTips);

module.exports = router;
