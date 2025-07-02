const Emotion = require('../../models/emotion');
const { sequelize } = require('../../config/database');
const { Op } = require('sequelize');

// Create Emotion - Handle all input sources (camera, audio, text, snapshot)
exports.createEmotion = async (req, res) => {
  try {
    const { 
      user_id, 
      emotion, 
      confidence, 
      source, 
      dominantEmotion, 
      confidence_level,
      emotion_type,
      data,
      notes 
    } = req.body;

    // Handle different input formats
    const emotionValue = emotion || dominantEmotion || emotion_type;
    const confidenceValue = confidence || confidence_level || 0.0;
    const sourceValue = source || 'unknown';
    const userId = user_id || null;

    if (!emotionValue) {
      return res.status(400).json({ 
        success: false,
        message: 'Data emosi tidak lengkap.',
        received: req.body
      });
    }

    const emotionData = {
      userId: userId,
      emotion: emotionValue,
      score: confidenceValue,
      source: sourceValue,
      createdAt: new Date()
    };

    // Add additional data if available
    if (data) emotionData.data = typeof data === 'string' ? data : JSON.stringify(data);
    if (notes) emotionData.notes = notes;

    const newEmotion = await Emotion.create(emotionData, { ignoreUnknownValues: true });
    
    console.log('✅ Emotion saved to database:', {
      id: newEmotion.id,
      emotion: emotionValue,
      confidence: confidenceValue,
      source: sourceValue
    });

    res.status(201).json({ 
      success: true,
      message: 'Emotion berhasil disimpan', 
      data: newEmotion 
    });
  } catch (err) {
    console.error('❌ Error saving emotion:', err);
    res.status(500).json({ 
      success: false,
      message: 'Gagal menyimpan emotion', 
      error: err.message,
      stack: err.stack,
      full: err
    });
  }
};

// Get All Emotions (bisa difilter user_id, source, date range)
exports.getEmotions = async (req, res) => {
  try {
    const { 
      user_id, 
      source, 
      start_date, 
      end_date, 
      limit = 100,
      offset = 0 
    } = req.query;

    const whereClause = {};
    
    if (user_id) whereClause.userId = user_id;
    if (source) whereClause.source = source;
    
    if (start_date || end_date) {
      whereClause.createdAt = {};
      if (start_date) whereClause.createdAt[Op.gte] = new Date(start_date);
      if (end_date) whereClause.createdAt[Op.lte] = new Date(end_date);
    }

    const emotions = await Emotion.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log(`✅ Retrieved ${emotions.length} emotions from database`);

    res.json({
      success: true,
      data: emotions,
      count: emotions.length
    });
  } catch (err) {
    console.error('❌ Error fetching emotions:', err);
    res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil data emotion', 
      error: err.message,
      stack: err.stack,
      full: err
    });
  }
};

// Get Emotion Statistics
exports.getEmotionStats = async (req, res) => {
  try {
    const { user_id, source, start_date, end_date } = req.query;

    const whereClause = {};
    if (user_id) whereClause.userId = user_id;
    if (source) whereClause.source = source;
    
    if (start_date || end_date) {
      whereClause.createdAt = {};
      if (start_date) whereClause.createdAt[Op.gte] = new Date(start_date);
      if (end_date) whereClause.createdAt[Op.lte] = new Date(end_date);
    }

    const stats = await Emotion.findAll({
      where: whereClause,
      attributes: [
        'emotion',
        [sequelize.fn('COUNT', sequelize.col('emotion')), 'count'],
        [sequelize.fn('AVG', sequelize.col('confidence')), 'avg_confidence']
      ],
      group: ['emotion'],
      order: [[sequelize.fn('COUNT', sequelize.col('emotion')), 'DESC']]
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('❌ Error fetching emotion stats:', err);
    res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil statistik emotion', 
      error: err.message,
      stack: err.stack,
      full: err
    });
  }
};

// Update Emotion
exports.updateEmotion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const emotion = await Emotion.findByPk(id);
    if (!emotion) {
      return res.status(404).json({ 
        success: false,
        message: 'Emotion tidak ditemukan' 
      });
    }

    await emotion.update(updateData);
    
    res.json({
      success: true,
      message: 'Emotion berhasil diupdate',
      data: emotion
    });
  } catch (err) {
    console.error('❌ Error updating emotion:', err);
    res.status(500).json({ 
      success: false,
      message: 'Gagal mengupdate emotion', 
      error: err.message,
      stack: err.stack,
      full: err
    });
  }
};

// Delete Emotion
exports.deleteEmotion = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Emotion.destroy({
      where: { id: id }
    });

    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        message: 'Emotion tidak ditemukan' 
      });
    }

    res.json({
      success: true,
      message: 'Emotion berhasil dihapus'
    });
  } catch (err) {
    console.error('❌ Error deleting emotion:', err);
    res.status(500).json({ 
      success: false,
      message: 'Gagal menghapus emotion', 
      error: err.message,
      stack: err.stack,
      full: err
    });
  }
}; 