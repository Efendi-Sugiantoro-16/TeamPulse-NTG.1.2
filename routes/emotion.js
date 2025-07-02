const express = require('express');
const router = express.Router();
const emotionController = require('../api/controllers/emotionController');

// Public routes (no auth required for testing)
// POST /api/emotions - Create new emotion
router.post('/', emotionController.createEmotion);

// GET /api/emotions - Get all emotions (with filters)
router.get('/', emotionController.getEmotions);

// GET /api/emotions/stats - Get emotion statistics
router.get('/stats', emotionController.getEmotionStats);

// PUT /api/emotions/:id - Update emotion
router.put('/:id', emotionController.updateEmotion);

// DELETE /api/emotions/:id - Delete emotion
router.delete('/:id', emotionController.deleteEmotion);

// Health check for emotions API
router.get('/ping', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Emotions API is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router; 