# AI-Powered Emotion Analysis System

## Overview

Sistem analisis emosi berbasis AI yang menggunakan teknologi canggih untuk mendeteksi emosi secara otomatis melalui tiga input utama:

1. **Camera Analysis** - Analisis ekspresi wajah real-time
2. **Voice Analysis** - Analisis nada suara dan intonasi
3. **AI Text Analysis** - Analisis sentimen teks dengan AI

## Fitur Utama

### 🎥 Camera Analysis (Analisis Kamera)
- **Real-time Facial Recognition** menggunakan face-api.js
- **Emotion Detection** dengan 7 kategori emosi
- **Confidence Scoring** untuk akurasi analisis
- **Snapshot Capture** untuk momen spesifik
- **Face Landmark Detection** untuk analisis detail

### 🎤 Voice Analysis (Analisis Suara)
- **Real-time Voice Processing** dengan Web Audio API
- **Audio Level Meter** untuk monitoring volume
- **Spectrogram Visualization** untuk analisis pola suara
- **Voice Quality Assessment** untuk kualitas input
- **Emotion from Tone** analisis emosi dari nada suara

### 🤖 AI Text Analysis (Analisis Teks AI)
- **Enhanced Sentiment Analysis** dengan keyword detection
- **Multi-emotion Classification** untuk analisis kompleks
- **Confidence Scoring** untuk setiap prediksi
- **Keyword Extraction** untuk insight mendalam
- **Sentiment Polarity** (positive/negative/neutral)

## Teknologi yang Digunakan

### AI Models & Libraries
- **TensorFlow.js** - Machine learning framework
- **face-api.js** - Facial recognition dan expression detection
- **Web Audio API** - Real-time audio processing
- **Enhanced Sentiment Analyzer** - Custom text analysis

### Storage System
- **Hybrid Storage** - Kombinasi MySQL dan localStorage
- **Real-time Sync** - Sinkronisasi otomatis
- **Data Export** - JSON, CSV format
- **Backup & Recovery** - Sistem backup otomatis

## Struktur Data

### Emotion Data Structure
```javascript
{
  id: "emotion_timestamp_random",
  timestamp: "2024-01-01T12:00:00.000Z",
  dominantEmotion: "happy", // happy, sad, angry, excited, fearful, surprised, neutral, confused
  confidence: 0.85, // 0-1 scale
  source: "camera", // camera, audio, text, camera_snapshot
  analysisType: "facial_expression",
  
  aiAnalysis: {
    model: "face-api.js",
    confidence: 0.85,
    processingTime: 150, // milliseconds
    features: {}
  },
  
  // Source-specific data
  facialExpressions: { happy: 0.85, sad: 0.05, ... },
  audioFeatures: { volume: 120, frequencyRatio: 1.2, ... },
  textAnalysis: { sentiment: "positive", keywords: [...], ... },
  
  notes: "User input notes",
  tags: ["work", "meeting"],
  sessionId: "session_123",
  
  createdAt: "2024-01-01T12:00:00.000Z",
  updatedAt: "2024-01-01T12:00:00.000Z",
  version: "1.0"
}
```

## Cara Penggunaan

### 1. Camera Analysis
```javascript
// Start camera analysis
await aiAnalyzer.startCameraAnalysis(videoElement, canvasElement, (emotionData) => {
    console.log('Detected emotion:', emotionData.emotion);
    console.log('Confidence:', emotionData.confidence);
});

// Stop camera analysis
aiAnalyzer.stopCameraAnalysis();
```

### 2. Voice Analysis
```javascript
// Start voice analysis
await aiAnalyzer.startAudioAnalysis((emotionData) => {
    console.log('Voice emotion:', emotionData.emotion);
    console.log('Voice quality:', emotionData.voiceQuality);
});

// Stop voice analysis
aiAnalyzer.stopAudioAnalysis();
```

### 3. Text Analysis
```javascript
// Analyze text with AI
const analysis = await aiAnalyzer.analyzeTextEmotion("I'm feeling great today!");
console.log('Text emotion:', analysis.emotion);
console.log('Sentiment:', analysis.sentiment);
```

## Dashboard Integration

### Real-time Charts
- **Emotion Distribution** - Pie chart emosi yang terdeteksi
- **Confidence Trends** - Line chart tingkat kepercayaan
- **Source Analysis** - Bar chart sumber analisis
- **Time-based Trends** - Trend emosi berdasarkan waktu

### Statistics
- **Total AI Analysis** - Jumlah total analisis
- **Average Confidence** - Rata-rata kepercayaan AI
- **Most Common Emotion** - Emosi yang paling sering terdeteksi
- **Analysis Sources** - Distribusi sumber analisis

## Export Capabilities

### Data Export
- **JSON Export** - Full data dengan metadata
- **CSV Export** - Data terstruktur untuk spreadsheet
- **Filtered Export** - Export berdasarkan kriteria tertentu

### Export Filters
- **Date Range** - Filter berdasarkan tanggal
- **Emotion Type** - Filter berdasarkan jenis emosi
- **Source Type** - Filter berdasarkan sumber analisis
- **Confidence Level** - Filter berdasarkan tingkat kepercayaan

## Performance & Optimization

### Real-time Processing
- **60 FPS Camera Analysis** - Analisis wajah real-time
- **Audio Buffer Optimization** - Processing audio yang efisien
- **Memory Management** - Pengelolaan memori yang optimal

### Accuracy Improvements
- **Confidence Thresholds** - Hanya menyimpan data dengan kepercayaan tinggi
- **Multi-frame Analysis** - Analisis dari beberapa frame untuk akurasi
- **Noise Reduction** - Pengurangan noise pada audio

## Security & Privacy

### Data Protection
- **Local Processing** - Semua analisis dilakukan di browser
- **No Cloud Upload** - Data tidak dikirim ke server eksternal
- **Encrypted Storage** - Data tersimpan dengan enkripsi

### Privacy Features
- **Camera Permission** - Izin kamera yang eksplisit
- **Audio Permission** - Izin mikrofon yang eksplisit
- **Data Deletion** - Kemampuan menghapus data pribadi

## Troubleshooting

### Common Issues

#### Camera Not Working
```javascript
// Check camera permissions
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => console.log('Camera access granted'))
    .catch(err => console.error('Camera access denied:', err));
```

#### Audio Not Working
```javascript
// Check audio permissions
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => console.log('Audio access granted'))
    .catch(err => console.error('Audio access denied:', err));
```

#### AI Models Not Loading
```javascript
// Check if models are loaded
if (aiAnalyzer.isModelsLoaded) {
    console.log('AI models ready');
} else {
    console.log('Loading AI models...');
}
```

### Performance Tips
1. **Close other tabs** - Kurangi beban browser
2. **Good lighting** - Untuk analisis kamera yang lebih akurat
3. **Quiet environment** - Untuk analisis suara yang lebih baik
4. **Stable internet** - Untuk loading AI models

## Development

### File Structure
```
js/
├── aiEmotionAnalyzer.js    # AI analysis engine
├── emotion-input-ai.js     # Main UI controller
├── dataStorage.js          # Data management
└── hybridStorage.js        # Storage system

css/
└── emotion-input.css       # AI interface styles

models/                     # AI model files
├── face-api.js models
└── audio analysis models
```

### Adding New Features
1. **New Emotion Types** - Update emotion validation
2. **New Analysis Sources** - Extend source mapping
3. **Custom AI Models** - Integrate new ML models
4. **Export Formats** - Add new export options

## API Reference

### AIEmotionAnalyzer Class
```javascript
class AIEmotionAnalyzer {
    async init()                    // Initialize AI models
    async startCameraAnalysis()     // Start facial analysis
    async startAudioAnalysis()      // Start voice analysis
    async analyzeTextEmotion()      // Analyze text sentiment
    stopCameraAnalysis()            // Stop camera
    stopAudioAnalysis()             // Stop audio
    getAnalysisStats()              // Get system stats
}
```

### DataStorage Class
```javascript
class DataStorage {
    async saveEmotionData()         // Save analysis data
    async getEmotionData()          // Retrieve data
    async getEmotionStats()         // Get statistics
    async getEmotionTrends()        // Get trends
    async exportData()              // Export data
    async clearData()               // Clear data
}
```

## Future Enhancements

### Planned Features
- **Multi-language Support** - Analisis teks dalam berbagai bahasa
- **Advanced Audio Features** - Analisis suara yang lebih mendalam
- **Emotion History** - Riwayat emosi yang lebih detail
- **Predictive Analysis** - Prediksi emosi berdasarkan pola
- **Integration APIs** - API untuk integrasi dengan sistem lain

### AI Model Improvements
- **Custom Training** - Model AI yang dapat dilatih ulang
- **Transfer Learning** - Adaptasi model untuk pengguna spesifik
- **Ensemble Methods** - Kombinasi multiple AI models
- **Real-time Learning** - Pembelajaran real-time dari data

## Support

### Documentation
- **API Documentation** - Referensi lengkap API
- **User Guide** - Panduan penggunaan
- **Developer Guide** - Panduan pengembangan
- **Troubleshooting Guide** - Solusi masalah umum

### Contact
- **Technical Support** - Dukungan teknis
- **Feature Requests** - Permintaan fitur baru
- **Bug Reports** - Laporan bug
- **Contributions** - Kontribusi pengembangan

---

**Sistem AI Emotion Analysis** - Teknologi canggih untuk analisis emosi otomatis dengan akurasi tinggi dan privasi terjamin. 