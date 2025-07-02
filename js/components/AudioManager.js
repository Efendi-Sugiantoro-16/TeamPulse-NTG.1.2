/**
 * Audio Manager Component
 * Handles audio recording and voice analysis
 */

class AudioManager {
    constructor(config = {}) {
        this.config = {
            audioAnalysisInterval: 200,
            confidenceThreshold: 0.6,
            ...config
        };
        
        this.audioStream = null;
        this.audioContext = null;
        this.analyzer = null;
        this.microphone = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        
        this.isAnalyzing = false;
        this.isRecording = false;
        this.analysisInterval = null;
        this.eventListeners = new Map();
        
        this.lastAudioEmotionResult = { emotion: 'neutral', confidence: 0.5, features: {} };
        
        console.log('AudioManager: Initialized');
    }

    async start() {
        try {
            console.log('AudioManager: Starting audio analysis...');
            
            // Get audio stream
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Initialize audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyzer = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(this.audioStream);
            
            // Connect audio nodes
            this.microphone.connect(this.analyzer);
            
            // Configure analyzer
            this.analyzer.fftSize = 2048;
            this.analyzer.smoothingTimeConstant = 0.8;
            
            // Start analysis
            this.startAnalysis();
            
            // Emit audio started event
            this.emit('audioStarted');
            
            console.log('AudioManager: Audio analysis started successfully');
            
        } catch (error) {
            console.error('AudioManager: Failed to start audio analysis:', error);
            throw error;
        }
    }

    stop() {
        console.log('AudioManager: Stopping audio analysis...');
        
        // Stop recording if active
        if (this.isRecording) {
            this.stopRecording();
        }
        
        // Stop analysis
        this.stopAnalysis();
        
        // Stop audio stream
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }
        
        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.analyzer = null;
        this.microphone = null;
        
        // Emit audio stopped event
        this.emit('audioStopped');
        
        console.log('AudioManager: Audio analysis stopped');
    }

    startAnalysis() {
        if (!this.analyzer) {
            console.error('AudioManager: Analyzer not initialized');
            return;
        }
        console.log('AudioManager: Starting voice analysis...');
        this.isAnalyzing = true;
        const bufferLength = 1024;
        if (window.analyzeAudioEmotionIntonation && this.audioContext && this.microphone && !this._scriptNode) {
            this._scriptNode = this.audioContext.createScriptProcessor(bufferLength, 1, 1);
            this.microphone.connect(this._scriptNode);
            this._scriptNode.onaudioprocess = (audioProcessingEvent) => {
                const inputBuffer = audioProcessingEvent.inputBuffer.getChannelData(0);
                this.lastAudioEmotionResult = window.analyzeAudioEmotionIntonation(inputBuffer, this.audioContext.sampleRate);
            };
        }
        const bufferLen = this.analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLen);
        const analyzeVoice = () => {
            if (!this.isAnalyzing) return;
            try {
                this.analyzer.getByteFrequencyData(dataArray);
                const audioLevel = this.calculateAudioLevel(dataArray);
                const emotion = this.analyzeVoiceEmotion(dataArray);
                this.updateSpectrogram(dataArray);
                const analysisData = {
                    emotion: emotion.emotion,
                    dominantEmotion: emotion.emotion,
                    confidence: emotion.confidence,
                    audioLevel: audioLevel,
                    voiceQuality: emotion.voiceQuality,
                    features: emotion.features,
                    source: 'audio',
                    timestamp: new Date().toISOString()
                };
                this.emit('emotionDetected', analysisData);
                this.emit('audioLevel', audioLevel);
            } catch (error) {
                console.error('AudioManager: Voice analysis error:', error);
                this.emit('analysisError', error);
            }
        };
        this.analysisInterval = setInterval(analyzeVoice, this.config.audioAnalysisInterval);
    }

    stopAnalysis() {
        this.isAnalyzing = false;
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }
        if (this._scriptNode) {
            this._scriptNode.disconnect();
            this._scriptNode = null;
        }
    }

    calculateAudioLevel(dataArray) {
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const average = sum / dataArray.length;
        const db = 20 * Math.log10(average / 255);
        return Math.max(0, (db + 60) / 60); // Normalize to 0-1
    }

    analyzeVoiceEmotion(dataArray) {
        if (window.analyzeAudioEmotionIntonation && this.audioContext && this.microphone) {
            return this.lastAudioEmotionResult;
        }
        // Fallback lama (tanpa random)
        const lowFreq = dataArray.slice(0, Math.floor(dataArray.length * 0.3));
        const midFreq = dataArray.slice(Math.floor(dataArray.length * 0.3), Math.floor(dataArray.length * 0.7));
        const highFreq = dataArray.slice(Math.floor(dataArray.length * 0.7));
        const lowAvg = lowFreq.reduce((sum, val) => sum + val, 0) / lowFreq.length;
        const midAvg = midFreq.reduce((sum, val) => sum + val, 0) / midFreq.length;
        const highAvg = highFreq.reduce((sum, val) => sum + val, 0) / highFreq.length;
        let emotion = 'neutral';
        let confidence = 0.5;
        if (highAvg > midAvg && highAvg > lowAvg) {
            emotion = 'excited';
            confidence = 0.7;
        } else if (lowAvg > midAvg && lowAvg > highAvg) {
            emotion = 'sad';
            confidence = 0.6;
        } else if (midAvg > lowAvg && midAvg > highAvg) {
            emotion = 'happy';
            confidence = 0.65;
        }
        const voiceQuality = confidence > 0.7 ? 'Good' : 'Fair';
        return { emotion, confidence, voiceQuality };
    }

    updateSpectrogram(dataArray) {
        const canvas = document.getElementById('spectrogramCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw spectrogram
        const barWidth = width / dataArray.length;
        
        for (let i = 0; i < dataArray.length; i++) {
            const barHeight = (dataArray[i] / 255) * height;
            const x = i * barWidth;
            const y = height - barHeight;
            
            // Color based on frequency
            const hue = (i / dataArray.length) * 360;
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.fillRect(x, y, barWidth, barHeight);
        }
    }

    startRecording() {
        if (!this.audioStream || this.isRecording) return;
        
        console.log('AudioManager: Starting audio recording...');
        
        this.audioChunks = [];
        this.mediaRecorder = new MediaRecorder(this.audioStream);
        
        this.mediaRecorder.ondataavailable = (event) => {
            this.audioChunks.push(event.data);
        };
        
        this.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            this.saveRecording(audioBlob);
        };
        
        this.mediaRecorder.start();
        this.isRecording = true;
        
        this.emit('recordingStarted');
    }

    stopRecording() {
        if (!this.mediaRecorder || !this.isRecording) return;
        
        console.log('AudioManager: Stopping audio recording...');
        
        this.mediaRecorder.stop();
        this.isRecording = false;
        
        this.emit('recordingStopped');
    }

    saveRecording(audioBlob) {
        // Create download link
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emotion_recording_${Date.now()}.wav`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        this.emit('recordingSaved', audioBlob);
    }

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    isActive() {
        return this.audioStream !== null;
    }

    isRecording() {
        return this.isRecording;
    }

    // Event system
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('AudioManager: Event callback error:', error);
                }
            });
        }
    }

    destroy() {
        this.stop();
        this.eventListeners.clear();
        this.audioChunks = [];
    }
}

window.AudioManager = AudioManager; 