const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { protect } = require('../middleware/auth');

// Get all chat sessions for a user
router.get('/sessions', protect, async (req, res) => {
    try {
        const chatSessions = await Chat.find({ user: req.user.id })
            .sort({ updatedAt: -1 })
            .select('-messages');
        
        res.json(chatSessions);
    } catch (error) {
        console.error('Error fetching chat sessions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a specific chat session with messages
router.get('/sessions/:sessionId', protect, async (req, res) => {
    try {
        const chatSession = await Chat.findOne({
            _id: req.params.sessionId,
            user: req.user.id
        });
        
        if (!chatSession) {
            return res.status(404).json({ message: 'Chat session not found' });
        }
        
        res.json(chatSession);
    } catch (error) {
        console.error('Error fetching chat session:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new chat session
router.post('/sessions', protect, async (req, res) => {
    try {
        const { title, description, sessionType } = req.body;
        
        const newChatSession = new Chat({
            user: req.user.id,
            title: title || 'New Study Session',
            description: description || '',
            sessionType: sessionType || 'study',
            messages: []
        });
        
        await newChatSession.save();
        res.status(201).json(newChatSession);
    } catch (error) {
        console.error('Error creating chat session:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a message to a chat session
router.post('/sessions/:sessionId/messages', protect, async (req, res) => {
    try {
        const { content, messageType, sender } = req.body;
        
        const chatSession = await Chat.findOne({
            _id: req.params.sessionId,
            user: req.user.id
        });
        
        if (!chatSession) {
            return res.status(404).json({ message: 'Chat session not found' });
        }
        
        const newMessage = {
            content,
            messageType: messageType || 'text',
            sender: sender || 'user',
            timestamp: new Date()
        };
        
        chatSession.messages.push(newMessage);
        chatSession.updatedAt = new Date();
        await chatSession.save();
        
        res.json(newMessage);
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a chat session
router.put('/sessions/:sessionId', protect, async (req, res) => {
    try {
        const { title, description, sessionType } = req.body;
        
        const chatSession = await Chat.findOneAndUpdate(
            {
                _id: req.params.sessionId,
                user: req.user.id
            },
            {
                title,
                description,
                sessionType,
                updatedAt: new Date()
            },
            { new: true }
        );
        
        if (!chatSession) {
            return res.status(404).json({ message: 'Chat session not found' });
        }
        
        res.json(chatSession);
    } catch (error) {
        console.error('Error updating chat session:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a chat session
router.delete('/sessions/:sessionId', protect, async (req, res) => {
    try {
        const chatSession = await Chat.findOneAndDelete({
            _id: req.params.sessionId,
            user: req.user.id
        });
        
        if (!chatSession) {
            return res.status(404).json({ message: 'Chat session not found' });
        }
        
        res.json({ message: 'Chat session deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat session:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get chat statistics
router.get('/statistics', protect, async (req, res) => {
    try {
        const totalSessions = await Chat.countDocuments({ user: req.user.id });
        const totalMessages = await Chat.aggregate([
            { $match: { user: req.user.id } },
            { $unwind: '$messages' },
            { $count: 'total' }
        ]);
        
        const recentSessions = await Chat.find({ user: req.user.id })
            .sort({ updatedAt: -1 })
            .limit(5)
            .select('title updatedAt messageCount');
        
        const statistics = {
            totalSessions,
            totalMessages: totalMessages[0]?.total || 0,
            recentSessions
        };
        
        res.json(statistics);
    } catch (error) {
        console.error('Error fetching chat statistics:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search chat messages
router.get('/search', protect, async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        
        const searchResults = await Chat.find({
            user: req.user.id,
            'messages.content': { $regex: query, $options: 'i' }
        }).select('title messages');
        
        const results = searchResults.map(session => ({
            sessionId: session._id,
            title: session.title,
            messages: session.messages.filter(msg => 
                msg.content.toLowerCase().includes(query.toLowerCase())
            )
        }));
        
        res.json(results);
    } catch (error) {
        console.error('Error searching chat messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 