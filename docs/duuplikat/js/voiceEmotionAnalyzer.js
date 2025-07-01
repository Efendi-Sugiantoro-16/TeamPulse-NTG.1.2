/**
 * Voice Emotion Analyzer - Advanced audio emotion detection with real-time spectrogram
 * Uses TensorFlow.js for AI models and Meyda.js for feature extraction
 */

class VoiceEmotionAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.mediaStream = null;
        this.isRecording = false;
        this.model = null;
        this.modelLoaded = false;
        
        // Audio recording
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordedAudio = null;
        
        // Spectrogram
        this.spectrogramCanvas = null;
        this.spectrogramCtx = null;
        this.spectrogramData = [];
        this.maxSpectrogramLength = 200; // Number of time slices to display
        
        // Configuration
        this.config = {
            sampleRate: 44100,
            fftSize: 2048,
            analysisInterval: 50, // Faster updates for real-time
            smoothingFactor: 0.3,
            spectrogramHeight: 200,
            spectrogramWidth: 400
        };
        
        // Emotion mapping
        this.emotions = {
            happy: { icon: '😊', label: 'Happy', color: '#4CAF50' },
            sad: { icon: '😢', label: 'Sad', color: '#2196F3' },
            angry: { icon: '😠', label: 'Angry', color: '#f44336' },
            neutral: { icon: '😐', label: 'Neutral', color: '#9E9E9E' },
            surprise: { icon: '😲', label: 'Surprise', color: '#FF9800' },
            fear: { icon: '😨', label: 'Fear', color: '#9C27B0' },
            disgust: { icon: '🤢', label: 'Disgust', color: '#795548' }
        };
        
        // Analysis state
        this.currentEmotion = null;
        this.analysisHistory = [];
        this.callbacks = {};
        
        // Audio level monitoring
        this.audioLevel = 0;
        this.silenceThreshold = -50; // dB
        
        console.log('Voice Emotion Analyzer initialized');
    }

    async initialize() {
        try {
            console.log('Initializing Voice Emotion Analyzer...');
            
            // Initialize TensorFlow.js
            await this.initializeTensorFlow();
            
            // Load audio model
            await this.loadAudioModel();
            
            // Initialize audio context
            await this.initializeAudioContext();
            
            // Initialize spectrogram canvas
            this.initializeSpectrogram();
            
            console.log('Voice Emotion Analyzer ready');
            return true;
        } catch (error) {
            console.error('Voice initialization failed:', error);
            return false;
        }
    }

    async initializeTensorFlow() {
        try {
            await tf.setBackend('webgl');
            await tf.ready();
            console.log('TensorFlow.js initialized with WebGL');
        } catch (error) {
            console.warn('WebGL not available, using CPU');
            await tf.setBackend('cpu');
            await tf.ready();
        }
    }

    async loadAudioModel() {
        try {
            // Try to load local model
            const modelPath = './models/audio_emotion_model/model.json';
            this.model = await tf.loadLayersModel(modelPath);
            this.modelLoaded = true;
            console.log('Audio emotion model loaded');
        } catch (error) {
            console.warn('Using fallback model:', error);
            this.model = this.createFallbackModel();
            this.modelLoaded = true;
        }
    }

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
        model.add(tf.layers.dense({ units: 7, activation: 'softmax' })); // 7 emotions
        
        model.compile({
            optimizer: 'adam',
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });
        
        return model;
    }

    async initializeAudioContext() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = this.config.fftSize;
        this.analyser.smoothingTimeConstant = 0.8;
    }

    initializeSpectrogram() {
        this.spectrogramCanvas = document.getElementById('spectrogramCanvas');
        if (this.spectrogramCanvas) {
            this.spectrogramCtx = this.spectrogramCanvas.getContext('2d');
            this.spectrogramCanvas.width = this.config.spectrogramWidth;
            this.spectrogramCanvas.height = this.config.spectrogramHeight;
            this.clearSpectrogram();
        }
    }

    clearSpectrogram() {
        if (this.spectrogramCtx) {
            this.spectrogramCtx.fillStyle = '#000';
            this.spectrogramCtx.fillRect(0, 0, this.spectrogramCanvas.width, this.spectrogramCanvas.height);
        }
    }

    async startRecording() {
        if (this.isRecording) return;
        
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: this.config.sampleRate,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);
            
            // Initialize MediaRecorder for audio recording
            this.mediaRecorder = new MediaRecorder(this.mediaStream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.recordedAudio = URL.createObjectURL(audioBlob);
                console.log('Audio recording completed');
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            this.startAnalysisLoop();
            
            console.log('Voice recording started');
        } catch (error) {
            console.error('Recording failed:', error);
            throw error;
        }
    }

    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        console.log('Voice recording stopped');
    }

    startAnalysisLoop() {
        const analyze = () => {
            if (!this.isRecording) return;
            
            try {
                const features = this.extractFeatures();
                this.updateSpectrogram(features);
                this.updateAudioLevel(features);
                this.analyzeEmotions(features);
            } catch (error) {
                console.error('Analysis error:', error);
            }
            
            requestAnimationFrame(analyze);
        };
        
        analyze();
    }

    extractFeatures() {
        const bufferLength = this.analyser.frequencyBinCount;
        const frequencyData = new Float32Array(bufferLength);
        const timeData = new Float32Array(bufferLength);
        
        this.analyser.getFloatFrequencyData(frequencyData);
        this.analyser.getFloatTimeDomainData(timeData);
        
        const features = {
            rms: this.calculateRMS(timeData),
            zcr: this.calculateZCR(timeData),
            spectralCentroid: this.calculateSpectralCentroid(frequencyData),
            spectralRolloff: this.calculateSpectralRolloff(frequencyData),
            spectralFlatness: this.calculateSpectralFlatness(frequencyData),
            spectralEnergy: this.calculateSpectralEnergy(frequencyData),
            frequencyData: frequencyData,
            timeData: timeData
        };
        
        // Use Meyda.js if available
        if (typeof Meyda !== 'undefined') {
            try {
                const magnitudeSpectrum = frequencyData.map(f => Math.pow(10, f / 20));
                features.mfcc = Meyda.extract('mfcc', timeData, this.config.sampleRate);
                features.chroma = Meyda.extract('chroma', magnitudeSpectrum, this.config.sampleRate);
            } catch (error) {
                console.warn('Meyda extraction failed:', error);
            }
        }
        
        return features;
    }

    updateSpectrogram(features) {
        if (!this.spectrogramCtx) return;
        
        const { frequencyData } = features;
        const canvas = this.spectrogramCanvas;
        const ctx = this.spectrogramCtx;
        
        // Shift existing spectrogram data
        this.spectrogramData.push(frequencyData);
        if (this.spectrogramData.length > this.maxSpectrogramLength) {
            this.spectrogramData.shift();
        }
        
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw spectrogram
        const sliceWidth = canvas.width / this.spectrogramData.length;
        const binHeight = canvas.height / frequencyData.length;
        
        for (let i = 0; i < this.spectrogramData.length; i++) {
            const slice = this.spectrogramData[i];
            const x = i * sliceWidth;
            
            for (let j = 0; j < slice.length; j++) {
                const y = canvas.height - (j * binHeight);
                const magnitude = (slice[j] + 140) / 140; // Normalize to 0-1
                const intensity = Math.max(0, Math.min(1, magnitude));
                
                // Color mapping based on frequency and intensity
                const hue = (j / slice.length) * 360;
                const saturation = 100;
                const lightness = 50 + (intensity * 50);
                
                ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                ctx.fillRect(x, y, sliceWidth, binHeight);
            }
        }
    }

    updateAudioLevel(features) {
        const rms = features.rms;
        this.audioLevel = 20 * Math.log10(rms);
        
        // Update UI if callback exists
        if (this.callbacks.onAudioLevel) {
            this.callbacks.onAudioLevel(this.audioLevel);
        }
    }

    calculateRMS(timeData) {
        let sum = 0;
        for (let i = 0; i < timeData.length; i++) {
            sum += timeData[i] * timeData[i];
        }
        return Math.sqrt(sum / timeData.length);
    }

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

    calculateSpectralRolloff(frequencyData) {
        const threshold = 0.85; // 85% of total energy
        let totalEnergy = 0;
        
        for (let i = 0; i < frequencyData.length; i++) {
            totalEnergy += Math.pow(10, frequencyData[i] / 20);
        }
        
        let cumulativeEnergy = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            cumulativeEnergy += Math.pow(10, frequencyData[i] / 20);
            if (cumulativeEnergy >= threshold * totalEnergy) {
                return i / frequencyData.length;
            }
        }
        
        return 1.0;
    }

    calculateSpectralFlatness(frequencyData) {
        let geometricMean = 0;
        let arithmeticMean = 0;
        
        for (let i = 0; i < frequencyData.length; i++) {
            const magnitude = Math.pow(10, frequencyData[i] / 20);
            geometricMean += Math.log(magnitude + 1e-10);
            arithmeticMean += magnitude;
        }
        
        geometricMean = Math.exp(geometricMean / frequencyData.length);
        arithmeticMean /= frequencyData.length;
        
        return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
    }

    calculateSpectralEnergy(frequencyData) {
        let energy = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            energy += Math.pow(10, frequencyData[i] / 20);
        }
        return energy;
    }

    async analyzeEmotions(features) {
        try {
            if (!this.modelLoaded) return;
            
            const featureTensor = this.featuresToTensor(features);
            const predictions = await this.predictEmotions(featureTensor);
            const emotion = this.processPredictions(predictions);
            
            this.updateCurrentEmotion(emotion);
            
            // Call callback if provided
            if (this.callbacks.onEmotionDetected) {
                this.callbacks.onEmotionDetected(emotion);
            }
            
        } catch (error) {
            console.error('Emotion analysis error:', error);
        }
    }

    featuresToTensor(features) {
        const featureArray = [
            features.rms,
            features.zcr,
            features.spectralCentroid,
            features.spectralRolloff,
            features.spectralFlatness,
            features.spectralEnergy
        ];
        
        // Add MFCC features if available
        if (features.mfcc) {
            featureArray.push(...features.mfcc);
        }
        
        // Add chroma features if available
        if (features.chroma) {
            featureArray.push(...features.chroma);
        }
        
        // Pad or truncate to 128 features
        while (featureArray.length < 128) {
            featureArray.push(0);
        }
        if (featureArray.length > 128) {
            featureArray.splice(128);
        }
        
        return tf.tensor2d([featureArray], [1, 128]);
    }

    async predictEmotions(featureTensor) {
        try {
            const predictions = await this.model.predict(featureTensor).array();
            featureTensor.dispose();
            return predictions[0];
        } catch (error) {
            console.warn('Model prediction failed, using rule-based analysis');
            return this.ruleBasedAnalysis(featureTensor);
        }
    }

    ruleBasedAnalysis(featureTensor) {
        const features = featureTensor.arraySync()[0];
        const [rms, zcr, spectralCentroid, spectralRolloff, spectralFlatness, spectralEnergy] = features;
        
        // Simple rule-based emotion detection
        const emotions = [0, 0, 0, 0, 0, 0, 0]; // 7 emotions
        
        if (rms > 0.1 && spectralEnergy > 100) {
            if (spectralCentroid > 0.6) {
                emotions[0] = 0.8; // Happy
            } else if (spectralCentroid < 0.3) {
                emotions[1] = 0.7; // Sad
            } else {
                emotions[3] = 0.6; // Neutral
            }
        }
        
        featureTensor.dispose();
        return emotions;
    }

    processPredictions(predictions) {
        const emotionNames = ['happy', 'sad', 'angry', 'neutral', 'surprise', 'fear', 'disgust'];
        const maxIndex = predictions.indexOf(Math.max(...predictions));
        const confidence = predictions[maxIndex];
        
        return {
            name: emotionNames[maxIndex],
            confidence: confidence,
            predictions: predictions,
            timestamp: new Date().toISOString()
        };
    }

    updateCurrentEmotion(newEmotion) {
        this.currentEmotion = newEmotion;
        this.addToHistory(newEmotion);
        
        // Update UI if callback exists
        if (this.callbacks.onEmotionUpdate) {
            this.callbacks.onEmotionUpdate(newEmotion);
        }
    }

    addToHistory(emotion) {
        this.analysisHistory.push(emotion);
        
        // Keep only last 100 entries
        if (this.analysisHistory.length > 100) {
            this.analysisHistory.shift();
        }
    }

    getCurrentEmotion() {
        return this.currentEmotion;
    }

    getHistory() {
        return this.analysisHistory;
    }

    getRecordedAudio() {
        return this.recordedAudio;
    }

    getAudioLevel() {
        return this.audioLevel;
    }

    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    cleanup() {
        this.stopRecording();
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        if (this.recordedAudio) {
            URL.revokeObjectURL(this.recordedAudio);
        }
        
        console.log('Voice Emotion Analyzer cleaned up');
    }
}

window.VoiceEmotionAnalyzer = VoiceEmotionAnalyzer;
