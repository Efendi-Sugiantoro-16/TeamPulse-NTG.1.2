# Voice Emotion Analysis System Documentation

## Overview

The Voice Emotion Analysis System is an advanced audio emotion detection system that uses TensorFlow.js and Meyda.js to provide real-time voice emotion analysis. It integrates seamlessly with the existing face and text analysis systems to provide comprehensive multi-modal emotion detection.

## Features

### Core Features
- **Real-time Voice Analysis**: Continuous audio processing and emotion detection
- **Advanced Feature Extraction**: Uses Meyda.js for professional audio feature extraction
- **AI-Powered Emotion Detection**: TensorFlow.js models for accurate emotion classification
- **Multi-modal Integration**: Combines voice, face, and text analysis
- **Fallback Systems**: Rule-based analysis when AI models are unavailable
- **Responsive UI**: Real-time visualization and status updates

### Audio Features Extracted
- **RMS (Root Mean Square)**: Volume/amplitude measurement
- **ZCR (Zero Crossing Rate)**: Frequency content analysis
- **Spectral Centroid**: Brightness of sound
- **Spectral Rolloff**: Frequency distribution
- **Spectral Flatness**: Noise vs. tonal content
- **Spectral Energy**: Overall energy content
- **MFCC (Mel-frequency cepstral coefficients)**: Speech characteristics
- **Chroma**: Musical pitch content

## Architecture

### Components

#### 1. VoiceEmotionAnalyzer Class
```javascript
class VoiceEmotionAnalyzer {
    constructor()
    async initialize()
    async startRecording()
    stopRecording()
    extractFeatures()
    analyzeEmotions()
    // ... other methods
}
```

#### 2. AutoAIAnalyzer Integration
```javascript
class AutoAIAnalyzer {
    async initializeVoiceAnalysis()
    handleVoiceEmotion()
    handleVoiceFeatures()
    updateCombinedEmotions()
    // ... voice integration methods
}
```

#### 3. UI Components
- Voice emotion indicator
- Audio visualizer with feature-based rendering
- Real-time feature display (RMS, ZCR, Centroid)
- Status indicators and controls

### Data Flow

1. **Audio Input** → Microphone access via Web Audio API
2. **Feature Extraction** → Meyda.js extracts audio features
3. **AI Analysis** → TensorFlow.js model processes features
4. **Emotion Classification** → Maps features to emotions
5. **UI Update** → Real-time display of results
6. **Multi-modal Combination** → Integrates with face and text analysis

## Technical Implementation

### Audio Processing Pipeline

```javascript
// 1. Audio Context Setup
this.audioContext = new AudioContext();
this.analyser = this.audioContext.createAnalyser();

// 2. Feature Extraction
const features = {
    rms: this.calculateRMS(timeData),
    zcr: this.calculateZCR(timeData),
    spectralCentroid: this.calculateSpectralCentroid(frequencyData),
    // ... more features
};

// 3. AI Model Processing
const featureTensor = this.featuresToTensor(features);
const predictions = await this.model.predict(featureTensor);

// 4. Emotion Classification
const emotions = this.processPredictions(predictions);
```

### Feature Extraction Methods

#### RMS (Root Mean Square)
```javascript
calculateRMS(timeData) {
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
        sum += timeData[i] * timeData[i];
    }
    return Math.sqrt(sum / timeData.length);
}
```

#### Zero Crossing Rate
```javascript
calculateZCR(timeData) {
    let crossings = 0;
    for (let i = 1; i < timeData.length; i++) {
        if ((timeData[i] >= 0 && timeData[i - 1] < 0) || 
            (timeData[i] < 0 && timeData[i - 1] >= 0)) {
            crossings++;
        }
    }
    return crossings / timeData.length;
}
```

#### Spectral Centroid
```javascript
calculateSpectralCentroid(frequencyData) {
    let weightedSum = 0;
    let sum = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
        const magnitude = Math.pow(10, frequencyData[i] / 20);
        weightedSum += i * magnitude;
        sum += magnitude;
    }
    
    return sum > 0 ? weightedSum / sum : 0;
}
```

### AI Model Integration

#### Model Loading
```javascript
async loadAudioModel() {
    try {
        const modelPath = './models/audio_emotion_model/model.json';
        this.model = await tf.loadLayersModel(modelPath);
        this.modelLoaded = true;
    } catch (error) {
        this.model = this.createFallbackModel();
        this.modelLoaded = true;
    }
}
```

#### Fallback Model
```javascript
createFallbackModel() {
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
        units: 64,
        activation: 'relu',
        inputShape: [128]
    }));
    
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: 4, activation: 'softmax' }));
    
    model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });
    
    return model;
}
```

## Emotion Mapping

### Supported Emotions
- **Happy** 😊 - High energy, positive tone
- **Sad** 😢 - Low energy, melancholic tone
- **Angry** 😠 - High intensity, aggressive tone
- **Neutral** 😐 - Balanced, calm tone

### Emotion Detection Rules (Fallback)
```javascript
// High RMS + high ZCR = happy/excited
if (rms > 0.5 && zcr > 0.3) {
    emotions.happy = 0.6 + Math.random() * 0.3;
}

// Low RMS + low ZCR = sad
else if (rms < 0.2 && zcr < 0.1) {
    emotions.sad = 0.6 + Math.random() * 0.3;
}

// High RMS + low ZCR = angry
else if (rms > 0.6 && zcr < 0.2) {
    emotions.angry = 0.6 + Math.random() * 0.3;
}
```

## Multi-modal Integration

### Weighted Combination
```javascript
const modalityWeights = {
    face: 0.4,    // 40% weight for face analysis
    voice: 0.35,  // 35% weight for voice analysis
    text: 0.25    // 25% weight for text analysis
};
```

### Combined Emotion Calculation
```javascript
updateCombinedEmotions() {
    const emotions = ['happy', 'sad', 'angry', 'neutral'];
    const combinedScores = {};
    
    // Weight and combine face emotions
    if (this.combinedEmotions.face) {
        emotions.forEach(emotion => {
            const faceScore = this.combinedEmotions.face.emotions[emotion] || 0;
            combinedScores[emotion] += faceScore * this.modalityWeights.face;
        });
    }
    
    // Weight and combine voice emotions
    if (this.combinedEmotions.voice) {
        emotions.forEach(emotion => {
            const voiceScore = this.combinedEmotions.voice.emotions[emotion] || 0;
            combinedScores[emotion] += voiceScore * this.modalityWeights.voice;
        });
    }
    
    // Similar for text emotions...
}
```

## User Interface

### Voice Controls
```html
<div class="voice-controls">
    <div class="voice-emotion-indicator" id="voiceEmotionIndicator">
        <div class="voice-emotion-display">
            <span class="emotion-icon">🎤</span>
            <span class="emotion-label">Ready</span>
        </div>
    </div>
    <div class="voice-features">
        <div class="feature-item">
            <span class="feature-label">RMS:</span>
            <span class="feature-value" id="rmsValue">0.00</span>
        </div>
        <!-- More features... -->
    </div>
</div>
```

### Audio Visualizer
```javascript
updateAudioVisualizer(features) {
    const ctx = audioCanvas.getContext('2d');
    
    // Draw RMS-based volume bars
    if (features.rms !== undefined) {
        const barHeight = (features.rms * maxHeight) * (0.5 + Math.random() * 0.5);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
    }
    
    // Draw spectral centroid line
    if (features.spectralCentroid !== undefined) {
        const centroidX = (features.spectralCentroid || 0) * width;
        ctx.strokeStyle = '#E91E63';
        ctx.lineTo(centroidX, height);
        ctx.stroke();
    }
}
```

## Configuration

### Audio Settings
```javascript
this.config = {
    sampleRate: 44100,        // Audio sample rate
    fftSize: 2048,           // FFT buffer size
    analysisInterval: 100,   // Analysis frequency (ms)
    smoothingFactor: 0.3     // Emotion smoothing
};
```

### Feature Extraction Settings
```javascript
this.featureExtractors = [
    'rms',
    'zcr',
    'spectralCentroid',
    'spectralRolloff',
    'spectralFlatness',
    'mfcc',
    'chroma',
    // ... more features
];
```

## Error Handling

### Graceful Degradation
1. **Model Loading Failure**: Falls back to rule-based analysis
2. **Meyda.js Unavailable**: Uses basic feature extraction
3. **Microphone Access Denied**: Shows appropriate error message
4. **Audio Context Failure**: Provides fallback mode

### Error Recovery
```javascript
try {
    await this.voiceAnalyzer.initialize();
} catch (error) {
    console.warn('Voice analysis failed, using fallback:', error);
    this.enableFallbackMode();
}
```

## Performance Optimization

### Memory Management
- Automatic tensor cleanup in TensorFlow.js
- Limited history size (100 entries)
- Efficient audio buffer processing

### Real-time Processing
- Optimized analysis intervals
- WebGL acceleration for TensorFlow.js
- Efficient feature extraction algorithms

## Browser Compatibility

### Supported Browsers
- Chrome 66+
- Firefox 60+
- Safari 11.1+
- Edge 79+

### Required APIs
- Web Audio API
- MediaDevices API
- WebGL (for TensorFlow.js acceleration)

## Usage Examples

### Basic Voice Analysis
```javascript
const voiceAnalyzer = new VoiceEmotionAnalyzer();
await voiceAnalyzer.initialize();
await voiceAnalyzer.startRecording();

voiceAnalyzer.setCallbacks({
    onEmotionDetected: (emotions) => {
        console.log('Detected emotion:', emotions.dominantEmotion);
    }
});
```

### Multi-modal Analysis
```javascript
const autoAnalyzer = new AutoAIAnalyzer();
await autoAnalyzer.initialize();

// Start voice recording with AI integration
await autoAnalyzer.startVoiceRecording();

autoAnalyzer.setCallbacks({
    onCombinedEmotion: (emotions) => {
        console.log('Combined emotion:', emotions);
    }
});
```

## Troubleshooting

### Common Issues

1. **"VoiceEmotionAnalyzer not available"**
   - Ensure `voiceEmotionAnalyzer.js` is loaded
   - Check script loading order

2. **"Microphone access denied"**
   - Check browser permissions
   - Ensure HTTPS connection (required for microphone)

3. **"Model loading failed"**
   - Check model file paths
   - Verify TensorFlow.js is loaded
   - System will use fallback mode

4. **"Audio context failed"**
   - Check browser compatibility
   - Ensure audio drivers are working

### Debug Mode
```javascript
// Enable debug logging
localStorage.setItem('debug', 'true');

// Check system status
console.log('Voice status:', autoAnalyzer.getVoiceStatus());
console.log('Combined status:', autoAnalyzer.getCombinedStatus());
```

## Future Enhancements

### Planned Features
- **Advanced Audio Models**: More sophisticated emotion detection
- **Speaker Recognition**: Identify different speakers
- **Emotion Trends**: Long-term emotion tracking
- **Custom Models**: User-trainable emotion models
- **Offline Support**: Local processing without internet

### Performance Improvements
- **WebAssembly**: Faster feature extraction
- **Web Workers**: Background processing
- **GPU Acceleration**: Enhanced TensorFlow.js performance

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Test voice analysis functionality

### Code Standards
- Use ES6+ features
- Follow JSDoc documentation
- Implement proper error handling
- Add unit tests for new features

## License

This voice emotion analysis system is part of the TeamPulse project and follows the same licensing terms as the main project.
