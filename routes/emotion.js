const express = require('express');
const router = express.Router();
const Emotion = require('../models/emotion');
const authMiddleware = require('../middleware/auth');

// Semua route di bawah ini protected
router.use(authMiddleware);

// Create emotion
router.post('/', async (req, res) => {
  try {
    const { emotion, score, source } = req.body;
    const newEmotion = await Emotion.create({
      userId: req.user.id,
      emotion,
      score,
      source,
      createdAt: new Date(),
    });
    res.json(newEmotion);
  } catch (err) {
    res.status(500).json({ message: 'Create failed', error: err.message });
  }
});

// Get all emotions for user
router.get('/', async (req, res) => {
  try {
    const emotions = await Emotion.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json(emotions);
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err.message });
  }
});

// Get emotion by id
router.get('/:id', async (req, res) => {
  try {
    const emotion = await Emotion.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!emotion) return res.status(404).json({ message: 'Not found' });
    res.json(emotion);
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err.message });
  }
});

// Update emotion
router.put('/:id', async (req, res) => {
  try {
    const { emotion, score, source } = req.body;
    const updated = await Emotion.update(
      { emotion, score, source },
      { where: { id: req.params.id, userId: req.user.id } }
    );
    if (!updated[0]) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
});

// Delete emotion
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Emotion.destroy({ where: { id: req.params.id, userId: req.user.id } });
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
});

// History (limit)
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const emotions = await Emotion.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit,
    });
    res.json(emotions);
  } catch (err) {
    res.status(500).json({ message: 'History failed', error: err.message });
  }
});

// Stats (count per emotion)
router.get('/stats', async (req, res) => {
  try {
    const stats = await Emotion.findAll({
      where: { userId: req.user.id },
      attributes: ['emotion', [Emotion.sequelize.fn('COUNT', Emotion.sequelize.col('emotion')), 'count']],
      group: ['emotion'],
    });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Stats failed', error: err.message });
  }
});

module.exports = router; 