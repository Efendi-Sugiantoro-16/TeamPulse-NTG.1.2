# Emotion Input System - User Guide

## Overview
The Emotion Input System is a comprehensive AI-powered emotion analysis tool that can detect emotions through:
- **Camera Analysis**: Real-time facial expression detection
- **Voice Analysis**: Speech pattern and tone analysis  
- **Text Analysis**: Sentiment analysis of written text

## Features

### 🎥 Camera Analysis
- Real-time facial expression detection using face-api.js
- Detects 7 emotions: happy, sad, angry, excited, fearful, surprised, neutral, confused
- Confidence scoring for each detection
- Snapshot capture functionality

### 🎤 Voice Analysis
- Real-time voice level monitoring
- Voice pattern visualization (spectrogram)
- Voice quality assessment
- Audio recording capability

### 📝 Text Analysis
- AI-powered sentiment analysis
- Keyword extraction
- Emotion classification
- Confidence scoring

### 💾 Data Storage
- **Local Mode**: Data stored in browser (persistent)
- **Database Mode**: Data stored in MySQL database
- Automatic offline queue when database is unavailable
- Export functionality (JSON/CSV)

## Getting Started

### Prerequisites
1. **Web Server**: The application requires a local web server due to face-api.js model loading
2. **Modern Browser**: Chrome, Firefox, Safari, or Edge with camera/microphone permissions
3. **Required Files**: Ensure all JavaScript and model files are in the correct locations

### Setup Instructions

#### 1. Start Local Web Server
```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

#### 2. Access the Application
Open your browser and navigate to:
```
http://localhost:8000/emotion-input.html
```

#### 3. Grant Permissions
- Allow camera access when prompted
- Allow microphone access when prompted

## Usage Guide

### Camera Analysis
1. Click the **"Camera Analysis"** tab
2. Click **"Start Camera"** to begin facial detection
3. Position your face in the camera view
4. The system will automatically detect and display:
   - Detected emotion
   - Confidence level
   - Face detection status
5. Use **"Capture Snapshot"** to save a specific moment
6. Click **"Stop Camera"** when finished

### Voice Analysis
1. Click the **"Voice Analysis"** tab
2. Click **"Start Voice Analysis"** to begin audio processing
3. Speak into your microphone
4. Monitor:
   - Voice level meter
   - Spectrogram visualization
   - Detected emotion
   - Voice quality
5. Use **"Record Audio"** to save audio clips
6. Click **"Stop Analysis"** when finished

### Text Analysis
1. Click the **"AI Text Analysis"** tab
2. Enter your text in the textarea
3. Click **"Analyze with AI"**
4. View the analysis results:
   - Detected emotion
   - Confidence level
   - Sentiment (positive/negative/neutral)
   - Keywords
   - Text preview

### Data Management
1. **Submit Data**: Click **"Submit Data"** to save current emotion
2. **Export Data**: Click **"Export Data"** to download analysis data
3. **Storage Mode**: Use the dropdown to switch between local and database storage
4. **View Dashboard**: Click **"View Dashboard"** to see analytics

## Storage Modes

### Local Mode (Browser)
- Data stored in browser's localStorage
- Persistent across browser sessions
- Works offline
- No server required

### Database Mode (MySQL)
- Data stored in MySQL database
- Requires server connection
- Automatic offline queue when disconnected
- Syncs data when connection restored

## Troubleshooting

### Common Issues

#### Face Detection Not Working
- **Problem**: "Failed to fetch" error
- **Solution**: Ensure you're using a web server (not file:// protocol)
- **Problem**: Models not loading
- **Solution**: Check that face-api.js models are in the `models/` folder

#### Camera Not Starting
- **Problem**: Camera permission denied
- **Solution**: Allow camera access in browser settings
- **Problem**: No camera detected
- **Solution**: Check camera connections and browser compatibility

#### Audio Not Working
- **Problem**: Microphone permission denied
- **Solution**: Allow microphone access in browser settings
- **Problem**: No audio input
- **Solution**: Check microphone connections and browser compatibility

#### Data Not Saving
- **Problem**: Storage mode issues
- **Solution**: Check browser localStorage quota or database connection
- **Problem**: Export not working
- **Solution**: Ensure browser allows downloads

### Browser Compatibility
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (may require HTTPS for camera/microphone)
- **Edge**: Full support

### Performance Tips
1. Close other applications using camera/microphone
2. Ensure good lighting for face detection
3. Speak clearly for voice analysis
4. Use a stable internet connection for database mode

## File Structure
```
TeamPulse-NTG.1.2/
├── emotion-input.html          # Main application file
├── js/
│   ├── emotion-input.js        # Main controller
│   ├── dataStorage.js          # Data storage system
│   ├── hybridStorage.js        # Hybrid storage system
│   ├── faceApiManager.js       # Face detection manager
│   └── tf.min.js              # TensorFlow.js
├── models/
│   ├── face-api.min.js        # Face detection library
│   └── [face-api models]      # AI models
└── css/
    └── emotion-input.css      # Styling
```

## API Reference

### EmotionInputController Methods
- `init()`: Initialize the system
- `startCamera()`: Start camera analysis
- `stopCamera()`: Stop camera analysis
- `startAudioAnalysis()`: Start voice analysis
- `stopAudioAnalysis()`: Stop voice analysis
- `analyzeText()`: Analyze text sentiment
- `saveEmotionData(data)`: Save emotion data
- `exportData(format, filters)`: Export data

### Data Storage Methods
- `saveEmotionData(data)`: Save emotion data
- `getEmotionData(filters)`: Retrieve emotion data
- `exportData(format, filters)`: Export data
- `clearData(options)`: Clear data

## Support
For technical support or questions:
1. Check the browser console for error messages
2. Ensure all required files are present
3. Verify web server is running correctly
4. Check browser permissions for camera/microphone

## Version History
- **v1.2**: Added hybrid storage, improved error handling
- **v1.1**: Added voice and text analysis
- **v1.0**: Initial release with camera analysis 