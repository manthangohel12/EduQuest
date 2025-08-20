const express = require('express');
const router = express.Router();
const Summary = require('../models/Summary');
const { protect } = require('../middleware/auth');

// Create a new summary
router.post('/', protect, async (req, res) => {
  try {
    const { originalContent, summaryContent, sessionId, source, metadata } = req.body;

    if (!originalContent || !summaryContent) {
      return res.status(400).json({ message: 'originalContent and summaryContent are required' });
    }

    const summary = await Summary.create({
      user: req.user.id,
      session: sessionId || null,
      originalContent,
      summaryContent,
      source: source || 'chat',
      metadata: metadata || {},
    });

    return res.status(201).json(summary);
  } catch (error) {
    console.error('Error creating summary:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get summaries for the authenticated user (optionally filter by sessionId)
router.get('/', protect, async (req, res) => {
  try {
    const { sessionId } = req.query;
    const filter = { user: req.user.id };
    if (sessionId) {
      filter.session = sessionId;
    }

    const summaries = await Summary.find(filter)
      .sort({ createdAt: -1 });

    return res.json(summaries);
  } catch (error) {
    console.error('Error fetching summaries:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get a single summary by id (must belong to the user)
router.get('/:id', protect, async (req, res) => {
  try {
    const summary = await Summary.findOne({ _id: req.params.id, user: req.user.id });
    if (!summary) return res.status(404).json({ message: 'Summary not found' });
    return res.json(summary);
  } catch (error) {
    console.error('Error fetching summary:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
