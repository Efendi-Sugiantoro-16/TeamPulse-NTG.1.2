/**
 * AI Model Manager - Manages and runs multiple AI models for emotion detection
 * Supports face detection, audio analysis, and text sentiment analysis
 */

class AIModelManager {
    constructor() {
        this.models = {
            face: null,
            audio: null,
            text: null
        };
        this.modelStatus = {
            face: 'not_loaded',
            audio: 'not_loaded',
            text: 'not_loaded'
        };
        this.isInitialized = false;
        this.autoAnalysis = false;
        this.analysisInterval = null;
        this.currentStream = null;
        this.analysisCallbacks = {
            onFaceDetected: null,
            onAudioAnalyzed: null,
            onTextAnalyzed: null,
            onError: null
        };
        
        // Configuration
        this.config = {
            faceDetectionInterval: 100, // ms
            audioAnalysisInterval: 200, // ms
            autoStart: true,
            enableFaceDetection: true,
            enableAudioAnalysis: true,
            enableTextAnalysis: true,
            confidenceThreshold: 0.6,
            maxFaces: 5
        };
        
        console.log('AI Model Manager initialized');
    }

    /**
     * Initialize all AI models
     */
    async initialize() {
        try {
            console.log('Initializing AI Model Manager...');
            
            // Initialize TensorFlow.js backend
            await this.initializeTensorFlow();
            
            // Load all models in parallel
            const loadPromises = [];
            
            if (this.config.enableFaceDetection) {
                loadPromises.push(this.loadFaceModel());
            }
            
            if (this.config.enableAudioAnalysis) {
                loadPromises.push(this.loadAudioModel());
            }
            
            if (this.config.enableTextAnalysis) {
                loadPromises.push(this.loadTextModel());
            }
            
            // Wait for all models to load
            await Promise.allSettled(loadPromises);
            
            this.isInitialized = true;
            console.log('AI Model Manager initialized successfully');
            
            // Auto-start analysis if enabled
            if (this.config.autoStart) {
                this.startAutoAnalysis();
            }
            
            return true;
        } catch (error) {
            console.error('Failed to initialize AI Model Manager:', error);
            return false;
        }
    }

    /**
     * Initialize TensorFlow.js backend
     */
    async initializeTensorFlow() {
        try {
            // Try WebGL first for better performance
            await tf.setBackend('webgl');
            console.log('TensorFlow.js backend: WebGL');
        } catch (error) {
            console.warn('WebGL not available, falling back to CPU:', error);
            await tf.setBackend('cpu');
            console.log('TensorFlow.js backend: CPU');
        }
        
        // Wait for backend to be ready
        await tf.ready();
    }

    /**
     * Load face detection model
     */
    async loadFaceModel() {
        try {
            console.log('Loading face detection model...');
            
            if (typeof faceapi === 'undefined') {
                throw new Error('face-api.js not loaded');
            }
            
            // Load face-api.js models
            const MODEL_URL = './models';
            
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
            
            this.models.face = {
                detector: faceapi.nets.tinyFaceDetector,
                landmark: faceapi.nets.faceLandmark68Net,
                expression: faceapi.nets.faceExpressionNet
            };
            
            this.modelStatus.face = 'loaded';
            console.log('Face detection model loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to load face detection model:', error);
            this.modelStatus.face = 'failed';
            return false;
        }
    }

    /**
     * Load audio emotion detection model
     */
    async loadAudioModel() {
        try {
            console.log('Loading audio emotion model...');
            
            // Load TensorFlow.js model
            const modelPath = './models/audio_emotion_model/model.json';
            this.models.audio = await tf.loadLayersModel(modelPath);
            
            this.modelStatus.audio = 'loaded';
            console.log('Audio emotion model loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to load audio emotion model:', error);
            this.modelStatus.audio = 'failed';
            return false;
        }
    }

    /**
     * Load text sentiment analysis model
     */
    async loadTextModel() {
        try {
            console.log('Loading text sentiment model...');
            
            // For now, we'll use a simple rule-based approach
            // In a real implementation, you would load a trained model
            this.models.text = {
                analyze: (text) => this.analyzeTextSentiment(text)
            };
            
            this.modelStatus.text = 'loaded';
            console.log('Text sentiment model loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to load text sentiment model:', error);
            this.modelStatus.text = 'failed';
            return false;
        }
    }

    /**
     * Start automatic analysis
     */
    startAutoAnalysis() {
        if (this.autoAnalysis) {
            console.warn('Auto analysis already running');
            return;
        }
        
        this.autoAnalysis = true;
        console.log('Starting automatic AI analysis...');
        
        // Start face detection loop
        if (this.modelStatus.face === 'loaded') {
            this.startFaceDetectionLoop();
        }
        
        // Start audio analysis loop
        if (this.modelStatus.audio === 'loaded') {
            this.startAudioAnalysisLoop();
        }
    }

    /**
     * Stop automatic analysis
     */
    stopAutoAnalysis() {
        this.autoAnalysis = false;
        
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }
        
        console.log('Automatic AI analysis stopped');
    }

    /**
     * Start face detection loop
     */
    startFaceDetectionLoop() {
        if (!this.autoAnalysis) return;
        
        const videoElement = document.getElementById('video');
        if (!videoElement || !videoElement.srcObject) {
            setTimeout(() => this.startFaceDetectionLoop(), 1000);
            return;
        }
        
        const canvas = document.getElementById('canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        const detectFaces = async () => {
            if (!this.autoAnalysis || !videoElement.srcObject) return;
            
            try {
                // Detect faces with expressions
                const detections = await faceapi
                    .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions({
                        inputSize: 416,
                        scoreThreshold: this.config.confidenceThreshold
                    }))
                    .withFaceLandmarks()
                    .withFaceExpressions();
                
                if (detections.length > 0) {
                    // Process detections
                    const results = detections.map(detection => {
                        const { expressions } = detection;
                        const dominantEmotion = Object.entries(expressions)
                            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
                        
                        return {
                            box: detection.detection.box,
                            landmarks: detection.landmarks,
                            expressions: expressions,
                            dominantEmotion: dominantEmotion,
                            confidence: detection.detection.score
                        };
                    });
                    
                    // Draw detections
                    this.drawFaceDetections(canvas, results);
                    
                    // Call callback
                    if (this.analysisCallbacks.onFaceDetected) {
                        this.analysisCallbacks.onFaceDetected(results);
                    }
                }
            } catch (error) {
                console.error('Face detection error:', error);
                if (this.analysisCallbacks.onError) {
                    this.analysisCallbacks.onError('face', error);
                }
            }
        };
        
        // Run detection loop
        const runDetection = () => {
            if (this.autoAnalysis) {
                detectFaces();
                setTimeout(runDetection, this.config.faceDetectionInterval);
            }
        };
        
        runDetection();
    }

    /**
     * Start audio analysis loop
     */
    startAudioAnalysisLoop() {
        if (!this.autoAnalysis) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const analyzeAudio = () => {
            if (!this.autoAnalysis) return;
            
            try {
                analyser.getByteFrequencyData(dataArray);
                
                // Convert to mel spectrogram
                const melSpectrogram = this.convertToMelSpectrogram(dataArray);
                
                // Predict emotions
                const predictions = this.models.audio.predict(melSpectrogram);
                
                // Process results
                const emotions = this.processAudioEmotions(predictions);
                
                // Call callback
                if (this.analysisCallbacks.onAudioAnalyzed) {
                    this.analysisCallbacks.onAudioAnalyzed(emotions);
                }
            } catch (error) {
                console.error('Audio analysis error:', error);
                if (this.analysisCallbacks.onError) {
                    this.analysisCallbacks.onError('audio', error);
                }
            }
        };
        
        // Run analysis loop
        const runAnalysis = () => {
            if (this.autoAnalysis) {
                analyzeAudio();
                setTimeout(runAnalysis, this.config.audioAnalysisInterval);
            }
        };
        
        runAnalysis();
    }

    /**
     * Draw face detections on canvas
     */
    drawFaceDetections(canvas, detections) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        detections.forEach(detection => {
            const { x, y, width, height } = detection.box;
            
            // Draw face box
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
            
            // Draw emotion label
            const emotionText = `${detection.dominantEmotion} (${(detection.confidence * 100).toFixed(1)}%)`;
            ctx.fillStyle = '#00ff00';
            ctx.font = '16px Arial';
            ctx.fillText(emotionText, x, y - 5);
            
            // Draw landmarks
            if (detection.landmarks) {
                ctx.fillStyle = '#ff0000';
                detection.landmarks.positions.forEach(point => {
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                    ctx.fill();
                });
            }
        });
    }

    /**
     * Convert audio data to mel spectrogram
     */
    convertToMelSpectrogram(audioData) {
        // Simple conversion - in a real implementation, you would use proper FFT and mel filterbank
        const spectrogram = [];
        const frameSize = 128;
        
        for (let i = 0; i < audioData.length; i += frameSize) {
            const frame = audioData.slice(i, i + frameSize);
            spectrogram.push(frame);
        }
        
        // Pad or truncate to 128x128
        while (spectrogram.length < 128) {
            spectrogram.push(new Uint8Array(128).fill(0));
        }
        
        return spectrogram.slice(0, 128);
    }

    /**
     * Process audio emotion predictions
     */
    processAudioEmotions(predictions) {
        const emotionLabels = ['happy', 'sad', 'angry', 'neutral'];
        const emotions = {};
        
        predictions.forEach((value, index) => {
            emotions[emotionLabels[index]] = value;
        });
        
        return emotions;
    }

    /**
     * Analyze text sentiment
     */
    analyzeTextSentiment(text) {
        const positiveWords = ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'love', 'good', 'positive'];
        const negativeWords = ['sad', 'angry', 'fear', 'hate', 'terrible', 'awful', 'bad', 'negative', 'depressed'];
        const neutralWords = ['okay', 'fine', 'normal', 'neutral', 'average', 'regular'];
        
        const words = text.toLowerCase().split(/\s+/);
        let positiveScore = 0;
        let negativeScore = 0;
        let neutralScore = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveScore++;
            if (negativeWords.includes(word)) negativeScore++;
            if (neutralWords.includes(word)) neutralScore++;
        });
        
        const total = positiveScore + negativeScore + neutralScore;
        
        if (total === 0) {
            return { happy: 0.25, sad: 0.25, angry: 0.25, neutral: 0.25 };
        }
        
        return {
            happy: positiveScore / total,
            sad: negativeScore / total,
            angry: negativeScore / total * 0.5,
            neutral: neutralScore / total
        };
    }

    /**
     * Analyze text input
     */
    async analyzeText(text) {
        if (!this.models.text) {
            throw new Error('Text model not loaded');
        }
        
        const emotions = this.models.text.analyze(text);
        
        if (this.analysisCallbacks.onTextAnalyzed) {
            this.analysisCallbacks.onTextAnalyzed(emotions);
        }
        
        return emotions;
    }

    /**
     * Set analysis callbacks
     */
    setCallbacks(callbacks) {
        this.analysisCallbacks = { ...this.analysisCallbacks, ...callbacks };
    }

    /**
     * Get model status
     */
    getModelStatus() {
        return this.modelStatus;
    }

    /**
     * Check if all models are loaded
     */
    areModelsLoaded() {
        return Object.values(this.modelStatus).every(status => status === 'loaded');
    }

    /**
     * Get configuration
     */
    getConfig() {
        return this.config;
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopAutoAnalysis();
        
        // Dispose TensorFlow models
        if (this.models.audio) {
            this.models.audio.dispose();
        }
        
        this.isInitialized = false;
        console.log('AI Model Manager cleaned up');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIModelManager;
} else if (typeof window !== 'undefined') {
    window.AIModelManager = AIModelManager;
}
