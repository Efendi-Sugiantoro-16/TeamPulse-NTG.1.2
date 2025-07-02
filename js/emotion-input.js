// BroadcastChannel untuk realtime update dashboard
const emotionChannel = ('BroadcastChannel' in window) ? new BroadcastChannel('emotion-data') : null;

// Fungsi simpan data emosi dan broadcast ke dashboard
async function saveEmotionData(entry) {
    // Tunggu storage siap
    let storage = window.hybridStorage || window.dataStorage;
    if (!storage) {
        if (window.hybridStorage) storage = window.hybridStorage;
        else if (window.dataStorage) storage = window.dataStorage;
        else throw new Error('Storage not available');
    }
    await storage.addEmotionData(entry);
    // Broadcast ke dashboard
    if (emotionChannel) {
        emotionChannel.postMessage({ type: 'new-emotion', entry });
    }
}

// Contoh pemakaian:
// Camera
// saveEmotionData({ dominantEmotion: 'happy', confidence: 0.9, source: 'camera', notes: 'Detected from camera' });
// Audio
// saveEmotionData({ dominantEmotion: 'neutral', confidence: 0.7, source: 'audio', notes: 'Detected from audio' });
// Text
// saveEmotionData({ dominantEmotion: 'excited', confidence: 0.95, source: 'text', notes: 'Detected from text' });
// Snapshot
// saveEmotionData({ dominantEmotion: 'surprised', confidence: 0.8, source: 'snapshot', notes: 'Detected from snapshot' });
