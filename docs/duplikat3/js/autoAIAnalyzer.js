/**
 * Auto AI Analyzer - Automatically runs AI models for continuous emotion analysis
 * Integrates with AIModelManager to provide real-time emotion detection
 */

class AutoAIAnalyzer {
    constructor() {
        this.aiManager = null;
        this.isRunning = false;
        this.analysisHistory = [];
        this.maxHistorySize = 100;
        this.currentEmotions = {
            face: null,
            audio: null,
            text: null,
            combined: null
        };
        
        // Analysis settings
        this.settings = {
            enableRealTimeAnalysis: true,
            enableHistoryTracking: true,
            enableCombinedAnalysis: true,
            analysisInterval: 1000, // ms
            confidenceThreshold: 0.7,
            emotionSmoothing: 0.3, // Smoothing factor for emotion transitions
            autoSaveResults: true,
            enableNotifications: true
        };
        
        // Callbacks
        this.callbacks = {
            onEmotionDetected: null,
            onAnalysisComplete: null,
            onError: null,
            onStatusChange: null
        };
        
        // Initialize voice analysis
        this.voiceAnalyzer = null;
        this.voiceInitialized = false;
        
        // Multi-modal analysis state
        this.combinedEmotions = {
            face: null,
            voice: null,
            text: null,
            combined: null
        };
        
        // Analysis weights for combining modalities
        this.modalityWeights = {
            face: 0.4,
            voice: 0.35,
            text: 0.25
        };
        
        console.log('Auto AI Analyzer initialized');
    }

    /**
     * Initialize the auto AI analyzer
     */
    async initialize() {
        try {
            console.log('Initializing Auto AI Analyzer...');
            
            // Initialize AI model manager
            await this.initializeModelManager();
            
            // Initialize face analysis
            await this.initializeFaceAnalysis();
            
            // Initialize voice analysis
            await this.initializeVoiceAnalysis();
            
            // Initialize text analysis
            await this.initializeTextAnalysis();
            
            // Set up analysis loop
            this.setupAnalysisLoop();
            
            this.initialized = true;
            console.log('Auto AI Analyzer initialized successfully');
            this.updateStatus('ready', 'All systems ready');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Auto AI Analyzer:', error);
            this.updateStatus('error', error.message);
            return false;
        }
    }

    /**
     * Initialize AI model manager
     */
    async initializeModelManager() {
        try {
            console.log('Initializing AI Model Manager...');
            
            // Create AI Model Manager
            this.aiManager = new AIModelManager();
            
            // Set up callbacks
            this.setupCallbacks();
            
            // Initialize AI Manager
            const success = await this.aiManager.initialize();
            
            if (success) {
                console.log('AI Model Manager initialized successfully');
                this.updateStatus('ready');
                return true;
            } else {
                throw new Error('Failed to initialize AI Model Manager');
            }
        } catch (error) {
            console.error('Failed to initialize AI Model Manager:', error);
            this.updateStatus('error', error.message);
            return false;
        }
    }

    /**
     * Initialize face analysis
     */
    async initializeFaceAnalysis() {
        try {
            console.log('Initializing face analysis...');
            
            // Set up face analysis callbacks
            this.aiManager.setCallbacks({
                onFaceDetected: (results) => this.handleFaceDetection(results)
            });
            
            console.log('Face analysis initialized successfully');
            this.updateStatus('ready');
            return true;
        } catch (error) {
            console.error('Failed to initialize face analysis:', error);
            this.updateStatus('error', error.message);
            return false;
        }
    }

    /**
     * Initialize voice analysis
     */
    async initializeVoiceAnalysis() {
        try {
            if (typeof VoiceEmotionAnalyzer === 'undefined') {
                console.warn('VoiceEmotionAnalyzer not available');
                return false;
            }
            
            console.log('Initializing voice analysis...');
            
            this.voiceAnalyzer = new VoiceEmotionAnalyzer();
            
            // Set up voice analysis callbacks
            this.voiceAnalyzer.setCallbacks({
                onEmotionDetected: (emotions) => {
                    this.handleVoiceEmotion(emotions);
                },
                onFeatureExtracted: (features) => {
                    this.handleVoiceFeatures(features);
                },
                onError: (type, error) => {
                    console.error(`Voice Analysis Error (${type}):`, error);
                    this.updateStatus('voice_error', error.message);
                }
            });
            
            const success = await this.voiceAnalyzer.initialize();
            
            if (success) {
                this.voiceInitialized = true;
                console.log('Voice analysis initialized successfully');
                this.updateStatus('voice_ready', 'Voice analysis ready');
                return true;
            } else {
                throw new Error('Voice analysis initialization failed');
            }
        } catch (error) {
            console.error('Failed to initialize voice analysis:', error);
            this.updateStatus('voice_error', error.message);
            return false;
        }
    }

    /**
     * Initialize text analysis
     */
    async initializeTextAnalysis() {
        try {
            console.log('Initializing text analysis...');
            
            // Set up text analysis callbacks
            this.aiManager.setCallbacks({
                onTextAnalyzed: (emotions) => this.handleTextAnalysis(emotions)
            });
            
            console.log('Text analysis initialized successfully');
            this.updateStatus('ready');
            return true;
        } catch (error) {
            console.error('Failed to initialize text analysis:', error);
            this.updateStatus('error', error.message);
            return false;
        }
    }

    /**
     * Set up callbacks for AI analysis
     */
    setupCallbacks() {
        this.aiManager.setCallbacks({
            onFaceDetected: (results) => this.handleFaceDetection(results),
            onAudioAnalyzed: (emotions) => this.handleAudioAnalysis(emotions),
            onTextAnalyzed: (emotions) => this.handleTextAnalysis(emotions),
            onError: (type, error) => this.handleError(type, error)
        });
    }

    /**
     * Start automatic analysis
     */
    startAnalysis() {
        if (this.isRunning) {
            console.warn('Analysis already running');
            return;
        }
        
        if (!this.aiManager || !this.aiManager.isInitialized) {
            console.error('AI Manager not initialized');
            return;
        }
        
        try {
            this.isRunning = true;
            this.startTime = Date.now();
            this.updateStatus('running');
            
            // Start AI Manager auto analysis
            this.aiManager.startAutoAnalysis();
            
            // Start combined analysis loop
            if (this.settings.enableCombinedAnalysis) {
                this.startCombinedAnalysisLoop();
            }
            
            console.log('Auto AI analysis started');
            
            // Show notification
            if (this.settings.enableNotifications) {
                this.showNotification('AI Analysis Started', 'Real-time emotion detection is now active');
            }
        } catch (error) {
            console.error('Failed to start analysis:', error);
            this.handleError('startup', error);
        }
    }

    /**
     * Stop automatic analysis
     */
    stopAnalysis() {
        if (!this.isRunning) {
            console.warn('Analysis not running');
            return;
        }
        
        try {
            this.isRunning = false;
            this.updateStatus('stopped');
            
            // Stop AI Manager
            if (this.aiManager) {
                this.aiManager.stopAutoAnalysis();
            }
            
            console.log('Auto AI analysis stopped');
            
            // Show notification
            if (this.settings.enableNotifications) {
                this.showNotification('AI Analysis Stopped', 'Real-time emotion detection has been stopped');
            }
        } catch (error) {
            console.error('Failed to stop analysis:', error);
            this.handleError('shutdown', error);
        }
    }

    /**
     * Handle face detection results
     */
    handleFaceDetection(results) {
        if (!this.isRunning) return;
        
        try {
            // Process face detection results
            const processedResults = this.processFaceResults(results);
            this.currentEmotions.face = processedResults;
            
            // Update combined analysis
            this.updateCombinedAnalysis();
            
            // Call emotion detected callback
            if (this.callbacks.onEmotionDetected) {
                this.callbacks.onEmotionDetected('face', processedResults);
            }
            
            // Add to history
            if (this.settings.enableHistoryTracking) {
                this.addToHistory('face', processedResults);
            }
        } catch (error) {
            this.handleError('face_processing', error);
        }
    }

    /**
     * Handle audio analysis results
     */
    handleAudioAnalysis(emotions) {
        if (!this.isRunning) return;
        
        try {
            // Process audio emotions
            const processedEmotions = this.processAudioEmotions(emotions);
            this.currentEmotions.audio = processedEmotions;
            
            // Update combined analysis
            this.updateCombinedAnalysis();
            
            // Call emotion detected callback
            if (this.callbacks.onEmotionDetected) {
                this.callbacks.onEmotionDetected('audio', processedEmotions);
            }
            
            // Add to history
            if (this.settings.enableHistoryTracking) {
                this.addToHistory('audio', processedEmotions);
            }
        } catch (error) {
            this.handleError('audio_processing', error);
        }
    }

    /**
     * Handle text analysis results
     */
    handleTextAnalysis(emotions) {
        this.combinedEmotions.text = emotions;
        this.updateCombinedEmotions();
        
        // Update UI
        if (this.callbacks.onTextEmotion) {
            this.callbacks.onTextEmotion(emotions);
        }
        
        console.log('Text emotion detected:', emotions);
    }

    /**
     * Process face detection results
     */
    processFaceResults(results) {
        if (!results || results.length === 0) {
            return null;
        }
        
        // Get the most confident detection
        const bestDetection = results.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
        );
        
        return {
            timestamp: Date.now(),
            dominantEmotion: bestDetection.dominantEmotion,
            confidence: bestDetection.confidence,
            expressions: bestDetection.expressions,
            faceCount: results.length,
            box: bestDetection.box
        };
    }

    /**
     * Process audio emotions
     */
    processAudioEmotions(emotions) {
        if (!emotions) return null;
        
        // Find dominant emotion
        const dominantEmotion = Object.entries(emotions)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        return {
            timestamp: Date.now(),
            dominantEmotion: dominantEmotion,
            confidence: emotions[dominantEmotion],
            emotions: emotions
        };
    }

    /**
     * Process text emotions
     */
    processTextEmotions(emotions) {
        if (!emotions) return null;
        
        // Find dominant emotion
        const dominantEmotion = Object.entries(emotions)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        return {
            timestamp: Date.now(),
            dominantEmotion: dominantEmotion,
            confidence: emotions[dominantEmotion],
            emotions: emotions
        };
    }

    /**
     * Update combined analysis
     */
    updateCombinedAnalysis() {
        if (!this.settings.enableCombinedAnalysis) return;
        
        const availableEmotions = [];
        
        // Collect available emotion data
        if (this.currentEmotions.face) {
            availableEmotions.push({
                type: 'face',
                emotion: this.currentEmotions.face.dominantEmotion,
                confidence: this.currentEmotions.face.confidence
            });
        }
        
        if (this.currentEmotions.audio) {
            availableEmotions.push({
                type: 'audio',
                emotion: this.currentEmotions.audio.dominantEmotion,
                confidence: this.currentEmotions.audio.confidence
            });
        }
        
        if (this.currentEmotions.text) {
            availableEmotions.push({
                type: 'text',
                emotion: this.currentEmotions.text.dominantEmotion,
                confidence: this.currentEmotions.text.confidence
            });
        }
        
        if (availableEmotions.length === 0) return;
        
        // Calculate combined emotion
        const combinedEmotion = this.calculateCombinedEmotion(availableEmotions);
        this.currentEmotions.combined = combinedEmotion;
        
        // Call analysis complete callback
        if (this.callbacks.onAnalysisComplete) {
            this.callbacks.onAnalysisComplete(this.currentEmotions);
        }
    }

    /**
     * Calculate combined emotion from multiple sources
     */
    calculateCombinedEmotion(emotions) {
        // Weight different sources
        const weights = {
            face: 0.5,
            audio: 0.3,
            text: 0.2
        };
        
        const emotionScores = {};
        
        emotions.forEach(({ type, emotion, confidence }) => {
            const weight = weights[type] || 0.1;
            const score = confidence * weight;
            
            if (!emotionScores[emotion]) {
                emotionScores[emotion] = 0;
            }
            emotionScores[emotion] += score;
        });
        
        // Find dominant emotion
        const dominantEmotion = Object.entries(emotionScores)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        return {
            timestamp: Date.now(),
            dominantEmotion: dominantEmotion,
            confidence: emotionScores[dominantEmotion],
            allEmotions: emotionScores,
            sources: emotions
        };
    }

    /**
     * Start combined analysis loop
     */
    startCombinedAnalysisLoop() {
        const runLoop = () => {
            if (!this.isRunning) return;
            
            // Update combined analysis
            this.updateCombinedAnalysis();
            
            // Schedule next iteration
            setTimeout(runLoop, this.settings.analysisInterval);
        };
        
        runLoop();
    }

    /**
     * Add analysis result to history
     */
    addToHistory(type, data) {
        if (!this.settings.enableHistoryTracking) return;
        
        const historyEntry = {
            id: Date.now() + Math.random(),
            timestamp: Date.now(),
            type: type,
            data: data
        };
        
        this.analysisHistory.push(historyEntry);
        
        // Limit history size
        if (this.analysisHistory.length > this.maxHistorySize) {
            this.analysisHistory.shift();
        }
    }

    /**
     * Get analysis history
     */
    getHistory(type = null, limit = null) {
        let history = this.analysisHistory;
        
        if (type) {
            history = history.filter(entry => entry.type === type);
        }
        
        if (limit) {
            history = history.slice(-limit);
        }
        
        return history;
    }

    /**
     * Clear analysis history
     */
    clearHistory() {
        this.analysisHistory = [];
        console.log('Analysis history cleared');
    }

    /**
     * Get current emotions
     */
    getCurrentEmotions() {
        return this.currentEmotions;
    }

    /**
     * Get dominant emotion across all sources
     */
    getDominantEmotion() {
        if (this.currentEmotions.combined) {
            return this.currentEmotions.combined.dominantEmotion;
        }
        
        // Fallback to individual sources
        const emotions = [
            this.currentEmotions.face?.dominantEmotion,
            this.currentEmotions.audio?.dominantEmotion,
            this.currentEmotions.text?.dominantEmotion
        ].filter(Boolean);
        
        return emotions.length > 0 ? emotions[0] : 'neutral';
    }

    /**
     * Analyze text input
     */
    async analyzeText(text) {
        if (!this.aiManager || !this.aiManager.models.text) {
            throw new Error('Text analysis not available');
        }
        
        return await this.aiManager.analyzeText(text);
    }

    /**
     * Set callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        console.log('Settings updated:', this.settings);
    }

    /**
     * Get settings
     */
    getSettings() {
        return this.settings;
    }

    /**
     * Update status
     */
    updateStatus(status, message = '') {
        const statusInfo = {
            status: status,
            message: message,
            timestamp: Date.now()
        };
        
        console.log(`Status: ${status}${message ? ' - ' + message : ''}`);
        
        if (this.callbacks.onStatusChange) {
            this.callbacks.onStatusChange(statusInfo);
        }
    }

    /**
     * Handle errors
     */
    handleError(type, error) {
        console.error(`Error in Auto AI Analyzer (${type}):`, error);
        
        if (this.callbacks.onError) {
            this.callbacks.onError(type, error);
        }
        
        this.updateStatus('error', error.message);
    }

    /**
     * Show notification
     */
    showNotification(title, message) {
        if (!this.settings.enableNotifications) return;
        
        // Check if browser supports notifications
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: message });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body: message });
                }
            });
        }
    }

    /**
     * Get analysis statistics
     */
    getStatistics() {
        const stats = {
            totalAnalyses: this.analysisHistory.length,
            runningTime: this.isRunning ? Date.now() - this.startTime : 0,
            modelStatus: this.aiManager ? this.aiManager.getModelStatus() : {},
            currentEmotions: this.currentEmotions,
            dominantEmotion: this.getDominantEmotion()
        };
        
        return stats;
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        console.log('Cleaning up Auto AI Analyzer...');
        
        // Stop analysis
        this.stop();
        
        // Cleanup AI Manager
        if (this.aiManager) {
            this.aiManager.cleanup();
        }
        
        // Cleanup Voice Analyzer
        if (this.voiceAnalyzer) {
            this.voiceAnalyzer.cleanup();
        }
        
        // Reset state
        this.initialized = false;
        this.isRunning = false;
        this.faceInitialized = false;
        this.voiceInitialized = false;
        this.textInitialized = false;
        
        // Clear data
        this.analysisHistory = [];
        this.combinedEmotions = {
            face: null,
            voice: null,
            text: null,
            combined: null
        };
        
        console.log('Auto AI Analyzer cleaned up');
    }

    /**
     * Handle voice emotion detection
     */
    handleVoiceEmotion(emotions) {
        this.combinedEmotions.voice = emotions;
        this.updateCombinedEmotions();
        
        // Update UI
        if (this.callbacks.onVoiceEmotion) {
            this.callbacks.onVoiceEmotion(emotions);
        }
        
        // Log voice emotion
        console.log('Voice emotion detected:', emotions);
    }

    /**
     * Handle voice feature extraction
     */
    handleVoiceFeatures(features) {
        // Update voice features display
        if (this.callbacks.onVoiceFeatures) {
            this.callbacks.onVoiceFeatures(features);
        }
        
        // Update audio visualizer
        this.updateAudioVisualizer(features);
    }

    /**
     * Update audio visualizer with voice features
     */
    updateAudioVisualizer(features) {
        const audioCanvas = document.getElementById('audioCanvas');
        if (!audioCanvas) return;
        
        const ctx = audioCanvas.getContext('2d');
        const width = audioCanvas.width;
        const height = audioCanvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw feature-based visualization
        if (features.rms !== undefined) {
            const barWidth = width / 20;
            const maxHeight = height * 0.8;
            
            for (let i = 0; i < 20; i++) {
                const barHeight = (features.rms * maxHeight) * (0.5 + Math.random() * 0.5);
                const x = i * barWidth;
                const y = height - barHeight;
                
                // Color based on emotion features
                let color = '#4CAF50';
                if (features.spectralCentroid > 0.5) color = '#FF9800';
                if (features.zcr > 0.3) color = '#2196F3';
                
                ctx.fillStyle = color;
                ctx.fillRect(x, y, barWidth - 2, barHeight);
            }
        }
        
        // Draw spectral centroid line
        if (features.spectralCentroid !== undefined) {
            const centroidX = (features.spectralCentroid || 0) * width;
            ctx.strokeStyle = '#E91E63';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centroidX, 0);
            ctx.lineTo(centroidX, height);
            ctx.stroke();
        }
    }

    /**
     * Update combined emotions from all modalities
     */
    updateCombinedEmotions() {
        const emotions = ['happy', 'sad', 'angry', 'neutral'];
        const combinedScores = {};
        
        // Initialize combined scores
        emotions.forEach(emotion => {
            combinedScores[emotion] = 0;
        });
        
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
        
        // Weight and combine text emotions
        if (this.combinedEmotions.text) {
            emotions.forEach(emotion => {
                const textScore = this.combinedEmotions.text.emotions[emotion] || 0;
                combinedScores[emotion] += textScore * this.modalityWeights.text;
            });
        }
        
        // Find dominant emotion
        const dominantEmotion = Object.entries(combinedScores)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        this.combinedEmotions.combined = {
            timestamp: Date.now(),
            emotions: combinedScores,
            dominantEmotion: dominantEmotion,
            confidence: combinedScores[dominantEmotion],
            modalities: {
                face: this.combinedEmotions.face ? this.combinedEmotions.face.dominantEmotion : null,
                voice: this.combinedEmotions.voice ? this.combinedEmotions.voice.dominantEmotion : null,
                text: this.combinedEmotions.text ? this.combinedEmotions.text.dominantEmotion : null
            }
        };
        
        // Call combined emotion callback
        if (this.callbacks.onCombinedEmotion) {
            this.callbacks.onCombinedEmotion(this.combinedEmotions.combined);
        }
        
        // Update history
        this.addToHistory(this.combinedEmotions.combined);
        
        console.log('Combined emotion updated:', this.combinedEmotions.combined);
    }

    /**
     * Start voice recording
     */
    async startVoiceRecording() {
        if (!this.voiceAnalyzer || !this.voiceInitialized) {
            console.warn('Voice analyzer not initialized');
            return false;
        }
        
        try {
            await this.voiceAnalyzer.startRecording();
            this.updateStatus('voice_recording', 'Voice recording started');
            return true;
        } catch (error) {
            console.error('Failed to start voice recording:', error);
            this.updateStatus('voice_error', error.message);
            return false;
        }
    }

    /**
     * Stop voice recording
     */
    stopVoiceRecording() {
        if (!this.voiceAnalyzer) return;
        
        try {
            this.voiceAnalyzer.stopRecording();
            this.updateStatus('voice_stopped', 'Voice recording stopped');
        } catch (error) {
            console.error('Failed to stop voice recording:', error);
            this.updateStatus('voice_error', error.message);
        }
    }

    /**
     * Get voice analysis status
     */
    getVoiceStatus() {
        return {
            initialized: this.voiceInitialized,
            recording: this.voiceAnalyzer ? this.voiceAnalyzer.isRecording : false,
            currentEmotion: this.voiceAnalyzer ? this.voiceAnalyzer.getCurrentEmotion() : null
        };
    }

    /**
     * Get combined analysis status
     */
    getCombinedStatus() {
        return {
            face: this.faceInitialized,
            voice: this.voiceInitialized,
            text: this.textInitialized,
            combined: this.combinedEmotions.combined
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoAIAnalyzer;
} else if (typeof window !== 'undefined') {
    window.AutoAIAnalyzer = AutoAIAnalyzer;
}
