// Service to submit emotion data using DataStorage
function normalizeEmotionData(raw) {
    const validEmotions = ['happy', 'sad', 'angry', 'excited', 'fearful', 'surprised', 'neutral', 'confused'];
    const validSources = ['camera', 'audio', 'text', 'camera_snapshot'];
    let dominantEmotion = raw.dominantEmotion || raw.emotion || 'neutral';
    if (!validEmotions.includes(dominantEmotion)) dominantEmotion = 'neutral';
    let source = raw.source || raw.emotionSource || 'camera';
    if (!validSources.includes(source)) source = 'camera';
    let confidence = typeof raw.confidence === 'number' ? raw.confidence : (raw.confidence ? parseFloat(raw.confidence) : 0.8);
    if (isNaN(confidence) || confidence < 0 || confidence > 1) confidence = 0.8;
    let timestamp = raw.timestamp || new Date().toISOString();
    return {
        ...raw,
        dominantEmotion,
        source,
        confidence,
        timestamp
    };
}

window.submitEmotionData = async function(data) {
    const storage = new window.DataStorage();
    data = normalizeEmotionData(data);
    return await storage.saveEmotionData(data);
}
