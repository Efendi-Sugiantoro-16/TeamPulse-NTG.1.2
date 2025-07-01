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
// saveEmotionData({ dominantEmotion: 'happy', confidence: 0.9, source: 'camera' });
