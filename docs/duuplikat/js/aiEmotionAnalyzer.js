// AI-Powered Emotion Analyzer
class AIEmotionAnalyzer {
    constructor() {
        this.faceApiModels = null;
        this.isModelsLoaded = false;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.isRecording = false;
        this.recordingData = [];
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing AI Emotion Analyzer...');
            
            // Load face-api.js models
            await this.loadFaceApiModels();
            
            // Initialize audio context
            this.initAudioContext();
            
            console.log('AI Emotion Analyzer initialized successfully');
            
        } catch (error) {
            console.error('Error initializing AI Emotion Analyzer:', error);
        }
    }

    async loadFaceApiModels() {
        try {
            console.log('Loading face-api.js models...');
            
            // Load models from CDN
            await faceapi.loadTinyFaceDetectorModel('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights');
            await faceapi.loadFaceLandmarkModel('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights');
            await faceapi.loadFaceExpressionModel('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights');
            
            this.isModelsLoaded = true;
            console.log('Face-api.js models loaded successfully');
            
        } catch (error) {
            console.error('Error loading face-api.js models:', error);
            throw error;
        }
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            console.log('Audio context initialized');
        } catch (error) {
            console.error('Error initializing audio context:', error);
        }
    }

    // Camera/Facial Analysis
    async startCameraAnalysis(videoElement, canvasElement, onEmotionDetected) {
        try {
            if (!this.isModelsLoaded) {
                throw new Error('Face-api.js models not loaded');
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user'
                } 
            });
            
            videoElement.srcObject = stream;
            
            // Start emotion detection loop
            this.detectEmotions(videoElement, canvasElement, onEmotionDetected);
            
            return true;
        } catch (error) {
            console.error('Error starting camera analysis:', error);
            throw error;
        }
    }

    async detectEmotions(videoElement, canvasElement, onEmotionDetected) {
        if (!this.isModelsLoaded) return;

        try {
            const detections = await faceapi.detectAllFaces(
                videoElement, 
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceExpressions();

            const canvas = canvasElement;
            const ctx = canvas.getContext('2d');
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (detections.length > 0) {
                // Draw detections
                const resizedDetections = faceapi.resizeResults(detections, {
                    width: canvas.width,
                    height: canvas.height
                });
                
                faceapi.draw.drawDetections(canvas, resizedDetections);
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
                
                // Get emotion from first detected face
                const face = detections[0];
                const emotions = face.expressions;
                
                // Find dominant emotion
                const dominantEmotion = this.getDominantEmotion(emotions);
                
                // Call callback with emotion data
                if (onEmotionDetected) {
                    onEmotionDetected({
                        emotion: dominantEmotion.emotion,
                        confidence: dominantEmotion.confidence,
                        allEmotions: emotions,
                        faceDetected: true
                    });
                }
            } else {
                // No face detected
                if (onEmotionDetected) {
                    onEmotionDetected({
                        emotion: 'neutral',
                        confidence: 0,
                        allEmotions: {},
                        faceDetected: false
                    });
                }
            }
            
            // Continue detection loop
            requestAnimationFrame(() => this.detectEmotions(videoElement, canvasElement, onEmotionDetected));
            
        } catch (error) {
            console.error('Error detecting emotions:', error);
            // Continue detection loop even if error occurs
            requestAnimationFrame(() => this.detectEmotions(videoElement, canvasElement, onEmotionDetected));
        }
    }

    getDominantEmotion(emotions) {
        const emotionMap = {
            neutral: emotions.neutral,
            happy: emotions.happy,
            sad: emotions.sad,
            angry: emotions.angry,
            fearful: emotions.fearful,
            disgusted: emotions.disgusted,
            surprised: emotions.surprised
        };
        
        let maxEmotion = 'neutral';
        let maxConfidence = 0;
        
        for (const [emotion, confidence] of Object.entries(emotionMap)) {
            if (confidence > maxConfidence) {
                maxConfidence = confidence;
                maxEmotion = emotion;
            }
        }
        
        // Map face-api emotions to our emotion set
        const emotionMapping = {
            neutral: 'neutral',
            happy: 'happy',
            sad: 'sad',
            angry: 'angry',
            fearful: 'fearful',
            disgusted: 'angry', // Map to angry
            surprised: 'surprised'
        };
        
        return {
            emotion: emotionMapping[maxEmotion] || 'neutral',
            confidence: maxConfidence
        };
    }

    // Audio/Voice Analysis
    async startAudioAnalysis(onEmotionDetected) {
        try {
            if (!this.audioContext) {
                throw new Error('Audio context not initialized');
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            
            this.isRecording = true;
            this.recordingData = [];
            
            // Start audio analysis
            this.analyzeAudio(onEmotionDetected);
            
            return true;
        } catch (error) {
            console.error('Error starting audio analysis:', error);
            throw error;
        }
    }

    analyzeAudio(onEmotionDetected) {
        if (!this.isRecording) return;

        try {
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            this.analyser.getByteFrequencyData(dataArray);
            
            // Calculate audio features
            const audioFeatures = this.extractAudioFeatures(dataArray);
            
            // Analyze emotion from audio features
            const emotionResult = this.analyzeVoiceEmotion(audioFeatures);
            
            // Call callback with emotion data
            if (onEmotionDetected) {
                onEmotionDetected({
                    emotion: emotionResult.emotion,
                    confidence: emotionResult.confidence,
                    audioFeatures: audioFeatures,
                    voiceQuality: this.getVoiceQuality(audioFeatures)
                });
            }
            
            // Continue analysis
            requestAnimationFrame(() => this.analyzeAudio(onEmotionDetected));
            
        } catch (error) {
            console.error('Error analyzing audio:', error);
            requestAnimationFrame(() => this.analyzeAudio(onEmotionDetected));
        }
    }

    extractAudioFeatures(dataArray) {
        // Calculate basic audio features
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;
        const max = Math.max(...dataArray);
        const min = Math.min(...dataArray);
        
        // Calculate frequency distribution
        const lowFreq = dataArray.slice(0, Math.floor(dataArray.length * 0.3)).reduce((a, b) => a + b, 0);
        const midFreq = dataArray.slice(Math.floor(dataArray.length * 0.3), Math.floor(dataArray.length * 0.7)).reduce((a, b) => a + b, 0);
        const highFreq = dataArray.slice(Math.floor(dataArray.length * 0.7)).reduce((a, b) => a + b, 0);
        
        return {
            volume: average,
            maxVolume: max,
            minVolume: min,
            dynamicRange: max - min,
            lowFrequency: lowFreq,
            midFrequency: midFreq,
            highFrequency: highFreq,
            frequencyRatio: highFreq / (lowFreq + 0.1)
        };
    }

    analyzeVoiceEmotion(audioFeatures) {
        // Simple rule-based voice emotion analysis
        // In a real implementation, this would use a trained ML model
        
        const { volume, dynamicRange, frequencyRatio } = audioFeatures;
        
        let emotion = 'neutral';
        let confidence = 0.5;
        
        // Volume-based analysis
        if (volume > 100) {
            if (dynamicRange > 50) {
                emotion = 'excited';
                confidence = 0.8;
            } else {
                emotion = 'angry';
                confidence = 0.7;
            }
        } else if (volume < 30) {
            emotion = 'sad';
            confidence = 0.6;
        }
        
        // Frequency-based analysis
        if (frequencyRatio > 1.5) {
            if (emotion === 'excited') {
                confidence += 0.1;
            } else {
                emotion = 'surprised';
                confidence = 0.7;
            }
        } else if (frequencyRatio < 0.5) {
            if (emotion === 'sad') {
                confidence += 0.1;
            } else {
                emotion = 'fearful';
                confidence = 0.6;
            }
        }
        
        return { emotion, confidence: Math.min(confidence, 1.0) };
    }

    getVoiceQuality(audioFeatures) {
        const { volume, dynamicRange } = audioFeatures;
        
        if (volume > 80 && dynamicRange > 40) {
            return 'Excellent';
        } else if (volume > 50 && dynamicRange > 20) {
            return 'Good';
        } else if (volume > 20) {
            return 'Fair';
        } else {
            return 'Poor';
        }
    }

    stopAudioAnalysis() {
        this.isRecording = false;
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
    }

    // AI Text Analysis
    async analyzeTextEmotion(text) {
        try {
            // In a real implementation, this would call an AI API
            // For now, we'll use an enhanced keyword-based analysis
            
            const analysis = this.enhancedTextAnalysis(text);
            
            return {
                emotion: analysis.emotion,
                confidence: analysis.confidence,
                sentiment: analysis.sentiment,
                keywords: analysis.keywords,
                analysis: analysis
            };
            
        } catch (error) {
            console.error('Error analyzing text emotion:', error);
            throw error;
        }
    }

    enhancedTextAnalysis(text) {
        const lowerText = text.toLowerCase();
        
        // Enhanced emotion keywords with weights
        const emotionKeywords = {
            happy: {
                keywords: ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'love', 'good', 'fantastic', 'brilliant', 'awesome', 'delighted', 'thrilled', 'ecstatic'],
                weight: 1.0
            },
            sad: {
                keywords: ['sad', 'depressed', 'unhappy', 'miserable', 'terrible', 'awful', 'bad', 'heartbroken', 'devastated', 'hopeless', 'lonely', 'grief'],
                weight: 1.0
            },
            angry: {
                keywords: ['angry', 'mad', 'furious', 'hate', 'terrible', 'awful', 'horrible', 'rage', 'outraged', 'irritated', 'annoyed', 'frustrated'],
                weight: 1.0
            },
            excited: {
                keywords: ['excited', 'thrilled', 'pumped', 'energized', 'motivated', 'inspired', 'eager', 'enthusiastic', 'passionate', 'dynamic'],
                weight: 1.0
            },
            fearful: {
                keywords: ['scared', 'afraid', 'fear', 'worried', 'anxious', 'nervous', 'terrified', 'panicked', 'stressed', 'overwhelmed', 'concerned'],
                weight: 1.0
            },
            surprised: {
                keywords: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'unexpected', 'wow', 'incredible', 'unbelievable'],
                weight: 1.0
            },
            confused: {
                keywords: ['confused', 'puzzled', 'uncertain', 'unsure', 'doubt', 'question', 'wonder', 'perplexed', 'bewildered'],
                weight: 1.0
            }
        };
        
        // Calculate emotion scores
        const emotionScores = {};
        let totalScore = 0;
        
        for (const [emotion, config] of Object.entries(emotionKeywords)) {
            let score = 0;
            for (const keyword of config.keywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const matches = (lowerText.match(regex) || []).length;
                score += matches * config.weight;
            }
            emotionScores[emotion] = score;
            totalScore += score;
        }
        
        // Find dominant emotion
        let dominantEmotion = 'neutral';
        let maxScore = 0;
        
        for (const [emotion, score] of Object.entries(emotionScores)) {
            if (score > maxScore) {
                maxScore = score;
                dominantEmotion = emotion;
            }
        }
        
        // Calculate confidence based on text length and emotion strength
        const textLength = text.length;
        const confidence = Math.min((maxScore / Math.max(textLength / 10, 1)) * 0.3, 1.0);
        
        // Determine sentiment
        const positiveEmotions = ['happy', 'excited'];
        const negativeEmotions = ['sad', 'angry', 'fearful'];
        
        let sentiment = 'neutral';
        if (positiveEmotions.includes(dominantEmotion)) {
            sentiment = 'positive';
        } else if (negativeEmotions.includes(dominantEmotion)) {
            sentiment = 'negative';
        }
        
        // Extract keywords found
        const keywords = [];
        for (const [emotion, config] of Object.entries(emotionKeywords)) {
            for (const keyword of config.keywords) {
                if (lowerText.includes(keyword)) {
                    keywords.push(keyword);
                }
            }
        }
        
        return {
            emotion: dominantEmotion,
            confidence: confidence,
            sentiment: sentiment,
            keywords: keywords,
            scores: emotionScores,
            textLength: textLength
        };
    }

    // Utility methods
    stopCameraAnalysis() {
        // This would stop the video stream
        // Implementation depends on how the video is being used
    }

    getAnalysisStats() {
        return {
            modelsLoaded: this.isModelsLoaded,
            audioContextActive: !!this.audioContext,
            isRecording: this.isRecording
        };
    }
}

// Global instance
window.AIEmotionAnalyzer = AIEmotionAnalyzer; 