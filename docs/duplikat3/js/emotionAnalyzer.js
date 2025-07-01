class AudioEmotionAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.scriptProcessor = null;
        this.isAnalyzing = false;
        this.volumeHistory = [];
        this.pitchHistory = [];
        this.maxHistoryLength = 20;
        
        // Thresholds untuk deteksi emosi
        this.thresholds = {
            highVolume: 0.7,    // Volume tinggi mengindikasikan marah/bersemangat
            lowVolume: 0.3,     // Volume rendah mengindikasikan sedih/takut
            highPitch: 0.6,     // Nada tinggi mengindikasikan takut/terkejut
            lowPitch: 0.4,      // Nada rendah mengindikasikan marah
            consistency: 0.5     // Konsistensi suara (variansi rendah = konsisten)
        };
    }


    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            
            // Setup script processor untuk analisis real-time
            this.scriptProcessor = this.audioContext.createScriptProcessor(2048, 1, 1);
            this.scriptProcessor.connect(this.audioContext.destination);
            
            return true;
        } catch (error) {
            console.error('Error initializing audio analyzer:', error);
            return false;
        }
    }

    async startAnalysis(stream) {
        if (!this.audioContext) {
            await this.initialize();
        }
        
        try {
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            this.analyser.connect(this.scriptProcessor);
            
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            this.scriptProcessor.onaudioprocess = () => {
                if (!this.isAnalyzing) return;
                
                // Dapatkan data frekuensi
                this.analyser.getByteFrequencyData(dataArray);
                
                // Hitung volume rata-rata
                const volume = this.calculateVolume(dataArray);
                
                // Hitung pitch (frekuensi dominan)
                const pitch = this.calculatePitch(dataArray);
                
                // Update history
                this.updateHistory(volume, pitch);
            };
            
            this.isAnalyzing = true;
            return true;
        } catch (error) {
            console.error('Error starting audio analysis:', error);
            return false;
        }
    }

    stopAnalysis() {
        this.isAnalyzing = false;
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
        }
        if (this.microphone) {
            this.microphone.disconnect();
        }
        if (this.analyser) {
            this.analyser.disconnect();
        }
    }

    calculateVolume(dataArray) {
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        return sum / dataArray.length / 255; // Normalize to 0-1
    }

    calculatePitch(dataArray) {
        // Mencari frekuensi dengan amplitudo tertinggi
        let maxIndex = 0;
        let maxValue = 0;
        
        for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i] > maxValue) {
                maxValue = dataArray[i];
                maxIndex = i;
            }
        }
        
        // Normalize to 0-1 (asumsi frekuensi suara manusia 85-255 Hz)
        const normalizedPitch = Math.min(Math.max((maxIndex / dataArray.length - 0.1) / 0.4, 0), 1);
        return normalizedPitch;
    }

    updateHistory(volume, pitch) {
        this.volumeHistory.push(volume);
        this.pitchHistory.push(pitch);
        
        // Batasi panjang history
        if (this.volumeHistory.length > this.maxHistoryLength) {
            this.volumeHistory.shift();
            this.pitchHistory.shift();
        }
    }

    analyzeEmotion() {
        if (this.volumeHistory.length < 5) {
            return this.getNeutralEmotion();
        }
        
        // Hitung statistik volume
        const volumeAvg = this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length;
        const volumeVariance = this.calculateVariance(this.volumeHistory, volumeAvg);
        
        // Hitung statistik pitch
        const pitchAvg = this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length;
        const pitchVariance = this.calculateVariance(this.pitchHistory, pitchAvg);
        
        // Tentukan emosi berdasarkan parameter suara
        let emotion = this.determineEmotion(volumeAvg, pitchAvg, volumeVariance, pitchVariance);
        
        // Hitung confidence score (0-1)
        const confidence = this.calculateConfidence(emotion, volumeAvg, pitchAvg);
        
        return {
            emotion,
            confidence,
            metrics: {
                volume: volumeAvg,
                pitch: pitchAvg,
                volumeVariance,
                pitchVariance
            }
        };
    }

    calculateVariance(data, mean) {
        const squareDiffs = data.map(value => Math.pow(value - mean, 2));
        return squareDiffs.reduce((a, b) => a + b, 0) / data.length;
    }

    determineEmotion(volume, pitch, volumeVar, pitchVar) {
        const isHighVolume = volume > this.thresholds.highVolume;
        const isLowVolume = volume < this.thresholds.lowVolume;
        const isHighPitch = pitch > this.thresholds.highPitch;
        const isLowPitch = pitch < this.thresholds.lowPitch;
        const isConsistent = volumeVar < this.thresholds.consistency && 
                           pitchVar < this.thresholds.consistency;
        
        // Logika deteksi emosi
        if (isHighVolume && isLowPitch) return 'anger';
        if (isHighVolume && isHighPitch) return 'excitement';
        if (isLowVolume && isHighPitch) return 'fearful';
        if (isLowVolume && isLowPitch) return 'sadness';
        if (isHighPitch && !isConsistent) return 'surprise';
        
        return 'neutral';
    }

    calculateConfidence(emotion, volume, pitch) {
        // Confidence berdasarkan seberapa jauh dari threshold
        let confidence = 0.5; // Default confidence
        
        switch(emotion) {
            case 'anger':
                confidence = 0.7 + (volume - this.thresholds.highVolume) * 2;
                break;
            case 'excitement':
                confidence = 0.7 + (pitch - this.thresholds.highPitch) * 2;
                break;
            case 'fearful':
                confidence = 0.7 + (pitch - this.thresholds.highPitch) * 2;
                break;
            case 'sadness':
                confidence = 0.7 + (this.thresholds.lowVolume - volume) * 2;
                break;
            case 'surprise':
                confidence = 0.7 + (pitch - this.thresholds.highPitch) * 2;
                break;
        }
        
        return Math.min(Math.max(confidence, 0.1), 0.95); // Clamp between 0.1 and 0.95
    }

    getNeutralEmotion() {
        return {
            emotion: 'neutral',
            confidence: 0.7,
            metrics: {
                volume: 0.5,
                pitch: 0.5,
                volumeVariance: 0,
                pitchVariance: 0
            }
        };
    }
}

class EmotionAnalyzer {
    constructor() {
        // Face detection and analysis properties
        this.faceDetectionOptions = null;
        this.faceApiInitialized = false;
        this.minConfidence = 0.1;
        this.modelsLoaded = false;
        
        // Audio analysis properties
        this.audioContext = null;
        this.analyser = null;
        this.meter = null;
        this.REFERENCE_LEVEL = -20; // Reference level in dB
        this.audioHistory = [];
        this.HISTORY_LENGTH = 10;
        
        // Audio processing parameters
        this.SAMPLE_RATE = 16000;
        this.FRAME_LENGTH = 1024;
        this.HOP_LENGTH = 512;
        this.N_MELS = 128;
        
        // Initialize Mel Spectrogram
        this.melSpectrogram = new MelSpectrogram({
            sampleRate: this.SAMPLE_RATE,
            frameLength: this.FRAME_LENGTH,
            hopLength: this.HOP_LENGTH,
            nMelBands: this.N_MELS
        });
        
        // Emotion thresholds and mappings
        this.EMOTION_THRESHOLDS = {
            happy: { minDb: -30, maxDb: 0, freqRange: [1000, 4000] },
            sad: { minDb: -50, maxDb: -20, freqRange: [0, 500] },
            angry: { minDb: -20, maxDb: 0, freqRange: [500, 2000] },
            neutral: { minDb: -40, maxDb: -10, freqRange: [0, 4000] }
        };
        
        this.correctionManager = new EmotionCorrectionManager();
    }

    async initFaceApi() {
        try {
            // Pastikan face-api.js sudah dimuat
            if (typeof faceapi === 'undefined') {
                console.warn('face-api.js belum dimuat. Menunggu inisialisasi...');
                return false;
            }
            
            // Inisialisasi opsi deteksi wajah
            this.faceDetectionOptions = new faceapi.TinyFaceDetectorOptions({
                inputSize: 416,
                scoreThreshold: 0.5
            });
            
            this.faceApiInitialized = true;
            console.log('Face API berhasil diinisialisasi');
            return true;
        } catch (error) {
            console.error('Gagal menginisialisasi Face API:', error);
            this.faceApiInitialized = false;
            return false;
        }
    }
    
    async loadModels() {
        try {
            // Initialize Face API if not already done
            if (!this.faceApiInitialized) {
                const initResult = await this.initFaceApi();
                if (!initResult) {
                    throw new Error('Gagal menginisialisasi Face API');
                }
            }
            
            // Set TensorFlow.js backend to webgl for better performance
            try {
                await tf.setBackend('webgl');
                console.log('TensorFlow.js backend set to webgl');
            } catch (tfError) {
                console.warn('Failed to set webgl backend, trying cpu:', tfError);
                await tf.setBackend('cpu');
            }
            
            // Try loading models from local directory first
            let MODEL_URL = './models';
            let modelsLoaded = false;
            
            // Add timeout for model loading
            const loadWithTimeout = async (loadFunction, timeoutMs = 30000) => {
                return Promise.race([
                    loadFunction(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Model loading timeout')), timeoutMs)
                    )
                ]);
            };
            
            try {
                console.log('Memuat model deteksi wajah...');
                await loadWithTimeout(() => faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL));
                
                console.log('Memuat model landmark wajah...');
                await loadWithTimeout(() => faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL));
                
                console.log('Memuat model ekspresi wajah...');
                await loadWithTimeout(() => faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL));
                
                modelsLoaded = true;
                console.log('Semua model face-api.js berhasil dimuat dari local');
            } catch (localError) {
                console.warn('Failed to load local models, trying CDN fallback:', localError);
                
                // Fallback to CDN if local models fail
                try {
                    MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
                    
                    console.log('Memuat model deteksi wajah dari CDN...');
                    await loadWithTimeout(() => faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL));
                    
                    console.log('Memuat model landmark wajah dari CDN...');
                    await loadWithTimeout(() => faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL));
                    
                    console.log('Memuat model ekspresi wajah dari CDN...');
                    await loadWithTimeout(() => faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL));
                    
                    modelsLoaded = true;
                    console.log('Semua model face-api.js berhasil dimuat dari CDN');
                } catch (cdnError) {
                    console.error('Failed to load models from both local and CDN:', cdnError);
                    throw new Error('Tidak dapat memuat model dari local maupun CDN');
                }
            }
            
            if (modelsLoaded) {
                this.modelsLoaded = true;
                return true;
            } else {
                throw new Error('Model loading failed');
            }
        } catch (error) {
            console.error('Error loading face-api.js models:', error);
            this.modelsLoaded = false;
            return false;
        }
    }

    async loadAudioModel() {
        // Simulate loading an audio emotion detection model
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    predict: (audio) => this.simulateAudioEmotion(audio)
                });
            }, 1000);
        });
    }

    async loadTextModel() {
        // Simulate loading a text sentiment analysis model
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    predict: (text) => this.simulateTextEmotion(text)
                });
            }, 1000);
        });
    }

    /**
     * Analyzes video frame for face detection and emotion recognition
     * @param {HTMLVideoElement} videoElement - The video element to analyze
     * @param {Object} options - Additional options
     * @param {boolean} options.includeLandmarks - Whether to include facial landmarks
     * @param {number} options.minConfidence - Minimum confidence threshold (0-1)
     * @returns {Promise<Object|null>} - Object containing face detections and emotions, or null if no faces found
     */
    async analyzeVideo(videoElement, options = {}) {
        if (!this.modelsLoaded) {
            throw new Error('Face detection models not loaded. Call loadModels() first.');
        }

        try {
            // Update detection options if provided
            if (options.minConfidence) {
                this.faceDetectionOptions.scoreThreshold = options.minConfidence;
            }

            // Detect all faces with expressions and optionally landmarks
            let detections;
            if (options.includeLandmarks) {
                detections = await faceapi
                    .detectAllFaces(videoElement, this.faceDetectionOptions)
                    .withFaceLandmarks()
                    .withFaceExpressions();
            } else {
                detections = await faceapi
                    .detectAllFaces(videoElement, this.faceDetectionOptions)
                    .withFaceExpressions();
            }

            if (detections.length === 0) {
                return null;
            }

            // Process all detected faces
            const results = detections.map(detection => {
                const { expressions } = detection;
                const total = Object.values(expressions).reduce((sum, val) => sum + val, 0);
                
                // Normalize emotion scores
                const normalizedExpressions = {};
                for (const [emotion, score] of Object.entries(expressions)) {
                    normalizedExpressions[emotion] = total > 0 ? score / total : 0;
                }

                // Get dominant emotion
                const dominantEmotion = Object.entries(normalizedExpressions)
                    .reduce((a, b) => a[1] > b[1] ? a : b)[0];

                return {
                    box: detection.detection.box,
                    landmarks: detection.landmarks,
                    expressions: normalizedExpressions,
                    dominantEmotion,
                    score: detection.detection.score
                };
            });

            return {
                timestamp: Date.now(),
                faces: results,
                faceCount: results.length
            };
        } catch (error) {
            console.error('Error analyzing video:', error);
            return null;
        }
    }

    /**
     * Draws face detections and expressions on a canvas
     * @param {HTMLCanvasElement} canvas - The canvas to draw on
     * @param {Object} detections - The detections to draw
     * @param {Object} options - Drawing options
     */
    drawDetections(canvas, detections, options = {}) {
        if (!detections || !detections.faces) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw each face
        detections.faces.forEach(face => {
            // Draw face box
            const { x, y, width, height } = face.box;
            ctx.strokeStyle = options.boxColor || '#00ff00';
            ctx.lineWidth = options.lineWidth || 2;
            ctx.strokeRect(x, y, width, height);
            
            // Draw face expressions
            if (options.drawExpressions !== false) {
                const expressionText = `${face.dominantEmotion} (${(face.expressions[face.dominantEmotion] * 100).toFixed(1)}%)`;
                ctx.fillStyle = options.textColor || '#00ff00';
                ctx.font = options.font || '16px Arial';
                ctx.fillText(expressionText, x, y - 5);
            }
            
            // Draw landmarks if available
            if (options.drawLandmarks && face.landmarks) {
                ctx.fillStyle = options.landmarkColor || '#ff0000';
                face.landmarks.positions.forEach(point => {
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                    ctx.fill();
                });
            }
        });
    }

    async analyzeAudio(audioChunks) {
        try {
            // Gabungkan audio chunks menjadi satu blob
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const arrayBuffer = await audioBlob.arrayBuffer();
            // Decode audio tanpa tf.js
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const channelData = audioBuffer.getChannelData(0); // Ambil channel pertama

            // Hitung rata-rata amplitudo (volume)
            let sum = 0;
            for (let i = 0; i < channelData.length; i++) {
                sum += Math.abs(channelData[i]);
            }
            const avg = sum / channelData.length;

            // Logika sederhana: volume tinggi = angry/surprise, sedang = happy, rendah = sad/neutral
            let emotions = { happy: 0, sad: 0, angry: 0, neutral: 0, surprise: 0 };
            if (avg > 0.15) {
                emotions.angry = 0.3 + Math.random() * 0.2;
                emotions.surprise = 0.3 + Math.random() * 0.2;
                emotions.happy = 0.1 + Math.random() * 0.1;
                emotions.sad = 0.1 + Math.random() * 0.1;
                emotions.neutral = 0.1 + Math.random() * 0.1;
            } else if (avg > 0.07) {
                emotions.happy = 0.4 + Math.random() * 0.2;
                emotions.neutral = 0.2 + Math.random() * 0.2;
                emotions.surprise = 0.1 + Math.random() * 0.1;
                emotions.angry = 0.1 + Math.random() * 0.1;
                emotions.sad = 0.1 + Math.random() * 0.1;
            } else {
                emotions.sad = 0.4 + Math.random() * 0.2;
                emotions.neutral = 0.3 + Math.random() * 0.2;
                emotions.happy = 0.1 + Math.random() * 0.1;
                emotions.angry = 0.1 + Math.random() * 0.1;
                emotions.surprise = 0.1 + Math.random() * 0.1;
            }
            // Normalisasi
            const total = Object.values(emotions).reduce((a, b) => a + b, 0);
            for (let key in emotions) emotions[key] /= total;
            return emotions;
        } catch (error) {
            console.error('Error analyzing audio:', error);
            return null;
        }
    }

    async extractAudioFeatures(audioBuffer) {
        // Convert audio buffer to mono
        const monoData = this.convertToMono(audioBuffer);
        
        // Resample to target sample rate if needed
        const resampledData = this.resampleAudio(monoData, audioBuffer.sampleRate, this.SAMPLE_RATE);
        
        // Convert to mel spectrogram
        const melSpec = await this.melSpectrogram.convert(resampledData);
        
        // Normalize the spectrogram
        const normalizedSpec = this.normalizeSpectrogram(melSpec);
        
        return normalizedSpec;
    }

    convertToMono(audioBuffer) {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length;
        const monoData = new Float32Array(length);
        
        for (let i = 0; i < length; i++) {
            let sum = 0;
            for (let channel = 0; channel < numberOfChannels; channel++) {
                sum += audioBuffer.getChannelData(channel)[i];
            }
            monoData[i] = sum / numberOfChannels;
        }
        
        return monoData;
    }

    resampleAudio(audioData, originalSampleRate, targetSampleRate) {
        if (originalSampleRate === targetSampleRate) {
            return audioData;
        }

        const ratio = originalSampleRate / targetSampleRate;
        const newLength = Math.round(audioData.length / ratio);
        const result = new Float32Array(newLength);

        for (let i = 0; i < newLength; i++) {
            const position = i * ratio;
            const index = Math.floor(position);
            const fraction = position - index;
            
            if (index + 1 < audioData.length) {
                result[i] = audioData[index] * (1 - fraction) + audioData[index + 1] * fraction;
            } else {
                result[i] = audioData[index];
            }
        }

        return result;
    }

    normalizeSpectrogram(spectrogram) {
        const mean = tf.mean(spectrogram);
        const std = tf.moments(spectrogram).variance.sqrt();
        return spectrogram.sub(mean).div(std.add(1e-7));
    }

    async predictEmotions(features) {
        // Prepare input tensor
        const inputTensor = tf.tensor4d(features, [1, features.length, features[0].length, 1]);
        
        // Get predictions
        const predictions = await this.audioModel.predict(inputTensor).array();
        
        // Convert predictions to emotion scores
        const emotions = {
            happy: predictions[0][0],
            sad: predictions[0][1],
            angry: predictions[0][2],
            neutral: predictions[0][3],
            surprise: predictions[0][4] || 0
        };

        // Clean up tensors
        inputTensor.dispose();
        
        return emotions;
    }

    updateAudioHistory(emotions) {
        this.audioHistory.push(emotions);
        if (this.audioHistory.length > this.HISTORY_LENGTH) {
            this.audioHistory.shift();
        }
    }

    getFinalEmotions() {
        if (this.audioHistory.length === 0) {
            return null;
        }

        // Calculate weighted average of emotions
        const weights = this.audioHistory.map((_, i) => 
            Math.pow(0.8, this.audioHistory.length - 1 - i)
        );
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        const finalEmotions = {
            happy: 0,
            sad: 0,
            angry: 0,
            neutral: 0,
            surprise: 0
        };

        this.audioHistory.forEach((emotions, i) => {
            for (let emotion in finalEmotions) {
                finalEmotions[emotion] += (emotions[emotion] || 0) * weights[i];
            }
        });

        // Normalize final emotions
        for (let emotion in finalEmotions) {
            finalEmotions[emotion] /= totalWeight;
        }

        return finalEmotions;
    }

    analyzeDbLevels(frequencyData) {
        // Convert frequency data to dB
        const dbData = frequencyData.map(freq => 20 * Math.log10(Math.abs(freq)));
        
        // Calculate average dB levels for different frequency ranges
        const lowDb = this.getAverageDb(dbData, 0, 100);    // Bass frequencies
        const midDb = this.getAverageDb(dbData, 100, 1000); // Mid frequencies
        const highDb = this.getAverageDb(dbData, 1000, 2000); // High frequencies

        // Calculate overall volume level
        const overallDb = (lowDb + midDb + highDb) / 3;
        
        // Map dB levels to emotions
        const emotions = {
            happy: this.mapDbToEmotion(highDb, 'happy'),
            sad: this.mapDbToEmotion(lowDb, 'sad'),
            angry: this.mapDbToEmotion(midDb, 'angry'),
            neutral: this.mapDbToEmotion(overallDb, 'neutral'),
            surprise: 0 // default 0, bisa dikembangkan jika ada logika surprise dari audio
        };

        // Normalize emotions
        const total = Object.values(emotions).reduce((a, b) => a + b, 0);
        for (let emotion in emotions) {
            emotions[emotion] /= total;
        }

        return emotions;
    }

    getAverageDb(dbData, start, end) {
        let sum = 0;
        let count = 0;
        for (let i = start; i < end && i < dbData.length; i++) {
            if (dbData[i] > -Infinity) { // Filter out -Infinity values
                sum += dbData[i];
                count++;
            }
        }
        return count > 0 ? sum / count : -100; // Return -100 dB if no valid data
    }

    mapDbToEmotion(db, emotion) {
        // Normalize dB to 0-1 range
        const normalizedDb = Math.max(0, Math.min(1, (db - this.REFERENCE_LEVEL) / 40));
        
        // Different mapping for each emotion based on typical dB patterns
        switch(emotion) {
            case 'happy':
                // Happy emotions typically have higher dB in high frequencies
                return Math.pow(normalizedDb, 1.5);
            case 'sad':
                // Sad emotions typically have lower overall dB
                return Math.pow(1 - normalizedDb, 1.2);
            case 'angry':
                // Angry emotions typically have high mid-range dB
                return Math.pow(normalizedDb, 0.8);
            case 'neutral':
                // Neutral emotions typically have moderate dB
                return Math.pow(0.5 - Math.abs(normalizedDb - 0.5), 2);
            default:
                return 0.25;
        }
    }

    async analyzeText(text) {
        try {
            // This is a placeholder for actual text emotion analysis
            // In a real implementation, you would use a natural language processing API
            return this.simulateTextEmotion(text);
        } catch (error) {
            console.error('Error analyzing text:', error);
            return null;
        }
    }

    applyPrivacyFilter(emotions) {
        if (!this.isPrivacyMode) {
            return emotions;
        }

        // Apply differential privacy
        return this.anonymizeData(emotions);
    }

    anonymizeData(emotions) {
        // Add noise to the emotion scores to preserve privacy
        const epsilon = 0.1; // Privacy parameter
        const noisyEmotions = {};

        for (const [emotion, score] of Object.entries(emotions)) {
            const noise = this.generateLaplaceNoise(epsilon);
            noisyEmotions[emotion] = Math.max(0, Math.min(1, score + noise));
        }

        return noisyEmotions;
    }

    generateLaplaceNoise(epsilon) {
        const u = Math.random() - 0.5;
        return -(1/epsilon) * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    }

    togglePrivacyMode(enabled) {
        this.isPrivacyMode = enabled;
    }

    // Simulation methods for demo purposes
    simulateVideoEmotion(frame) {
        return {
            happy: Math.random() * 0.8 + 0.2,
            sad: Math.random() * 0.3,
            angry: Math.random() * 0.2,
            neutral: Math.random() * 0.4 + 0.3,
            surprise: Math.random() * 0.3
        };
    }

    simulateAudioEmotion(audio) {
        return {
            happy: Math.random() * 0.7 + 0.1,
            sad: Math.random() * 0.4,
            angry: Math.random() * 0.3,
            neutral: Math.random() * 0.5 + 0.2,
            surprise: Math.random() * 0.3
        };
    }

    simulateTextEmotion(text) {
        // Improved pattern matching for text emotion detection
        const patterns = {
            happy: [/\bhappy\b/, /\b(great|excellent|good|wonderful|joy|delighted|pleased|cheerful|smile|excited)\b/],
            sad: [/\bsad\b/, /\b(disappointed|unhappy|bad|terrible|depressed|cry|down|gloomy|miserable)\b/],
            angry: [/\bangry\b/, /\b(frustrated|annoyed|mad|furious|irritated|rage|hate|resent)\b/],
            neutral: [/\bokay\b/, /\b(fine|normal|average|standard|calm|indifferent|meh)\b/],
            surprise: [/\b(wow|amazed|shocked|surprised|unbelievable|unexpected|astonished|whoa)\b/]
        };

        // Negation words
        const negations = ["not", "no", "never", "n't", "cannot", "can't"];

        // Lowercase and tokenize
        const lowerText = text.toLowerCase();
        const words = lowerText.split(/\W+/);

        // Initial scores
        const emotions = {
            happy: 0,
            sad: 0,
            angry: 0,
            neutral: 0,
            surprise: 0
        };

        // Pattern matching with negation handling
        for (const [emotion, regexArr] of Object.entries(patterns)) {
            regexArr.forEach(regex => {
                let match;
                let lastIndex = 0;
                while ((match = regex.exec(lowerText.substring(lastIndex))) !== null) {
                    // Check for negation within 3 words before the match
                    const before = lowerText.substring(0, match.index).split(/\W+/);
                    const context = before.slice(-3);
                    const isNegated = context.some(word => negations.includes(word));
                    if (isNegated) {
                        // If negated, reduce the score for this emotion
                        emotions[emotion] -= 0.5;
                    } else {
                        emotions[emotion] += 1;
                    }
                    lastIndex += match.index + match[0].length;
                }
            });
        }

        // If no emotion detected, set neutral to 1
        if (Object.values(emotions).every(v => v <= 0)) {
            emotions.neutral = 1;
        }

        // Normalize scores to sum to 1
        const minScore = Math.min(...Object.values(emotions));
        // Shift all scores to be >= 0
        for (const key in emotions) emotions[key] -= minScore;
        const total = Object.values(emotions).reduce((a, b) => a + b, 0);
        if (total > 0) {
            for (const key in emotions) emotions[key] /= total;
        } else {
            for (const key in emotions) emotions[key] = 1 / Object.keys(emotions).length;
        }
        return emotions;
    }

    /**
     * Analisis emosi dari video menggunakan face-api.js (TinyFaceDetector)
     * Selalu mengembalikan objek dengan property lengkap (angka, default 0)
     */
    async analyzeVideo(videoElement) {
        if (!this.modelsLoaded) {
            console.warn('Models not loaded yet, attempting to load...');
            await this.loadModels();
        }

        try {
            // Ensure the video element is ready
            if (!videoElement || videoElement.readyState < 2) {
                console.warn('Video element not ready');
                return null;
            }

            // Detect faces with expressions and landmarks
            const detections = await faceapi
                .detectAllFaces(videoElement, this.faceDetectionOptions)
                .withFaceLandmarks()
                .withFaceExpressions();

            if (!detections || detections.length === 0) {
                return { faces: null, expressions: null };
            }

            // Process all detected faces
            const faces = detections.map(face => ({
                box: face.detection.box,
                landmarks: face.landmarks,
                expressions: face.expressions
            }));

            // For simplicity, return the first face's expressions
            // You can modify this to handle multiple faces
            return {
                faces: faces,
                expressions: faces[0].expressions,
                mainFace: faces[0]
            };
        } catch (error) {
            console.error('Error in analyzeVideo:', error);
            return { faces: null, expressions: null, error: error.message };
        }
    }

    async analyzeVideoFaceApi(videoElement) {
        try {
            // Deteksi wajah dan ekspresi
            const detections = await faceapi.detectAllFaces(
                videoElement,
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceExpressions();
            if (!detections || detections.length === 0) {
                // Tidak ada wajah terdeteksi
                return {
                    neutral: 0,
                    happy: 0,
                    sad: 0,
                    angry: 0,
                    fearful: 0,
                    disgusted: 0,
                    surprised: 0
                };
            }
            // Ambil ekspresi wajah dari wajah pertama
            const expr = detections[0].expressions || {};
            return {
                neutral: typeof expr.neutral === 'number' ? expr.neutral : 0,
                happy: typeof expr.happy === 'number' ? expr.happy : 0,
                sad: typeof expr.sad === 'number' ? expr.sad : 0,
                angry: typeof expr.angry === 'number' ? expr.angry : 0,
                fearful: typeof expr.fearful === 'number' ? expr.fearful : 0,
                disgusted: typeof expr.disgusted === 'number' ? expr.disgusted : 0,
                surprised: typeof expr.surprised === 'number' ? expr.surprised : 0
            };
        } catch (e) {
            console.error('Detection error:', e);
            // Jika error, kembalikan semua 0 agar UI tidak error
            return {
                neutral: 0,
                happy: 0,
                sad: 0,
                angry: 0,
                fearful: 0,
                disgusted: 0,
                surprised: 0
            };
        }
    }
}

class EmotionCorrectionManager {
    constructor() {
        this.corrections = new Map();
    }

    addCorrection(originalEmotion, correctedEmotion, context) {
        const correction = {
            original: originalEmotion,
            corrected: correctedEmotion,
            context,
            timestamp: new Date()
        };

        this.corrections.set(correction.timestamp.getTime(), correction);
        this.updateModel(correction);
    }

    getCorrectionHistory() {
        return Array.from(this.corrections.values());
    }

    updateModel(correction) {
        // In a real implementation, this would update the model weights
        console.log('Model updated with correction:', correction);
    }
}

// Mel Spectrogram class for audio feature extraction
class MelSpectrogram {
    constructor({ sampleRate, frameLength, hopLength, nMelBands }) {
        this.sampleRate = sampleRate;
        this.frameLength = frameLength;
        this.hopLength = hopLength;
        this.nMelBands = nMelBands;
        this.melFilterbank = this.createMelFilterbank();
    }

    createMelFilterbank() {
        const fftSize = this.frameLength;
        const melBasis = this.createMelBasis(fftSize);
        return tf.tensor2d(melBasis);
    }

    createMelBasis(fftSize) {
        const fftFreqs = this.getFftFreqs(fftSize);
        const melFreqs = this.getMelFreqs();
        const weights = this.getMelWeights(fftFreqs, melFreqs);
        return weights;
    }

    getFftFreqs(fftSize) {
        const freqs = new Float32Array(fftSize / 2 + 1);
        for (let i = 0; i < freqs.length; i++) {
            freqs[i] = i * this.sampleRate / fftSize;
        }
        return freqs;
    }

    getMelFreqs() {
        const minMel = this.hzToMel(0);
        const maxMel = this.hzToMel(this.sampleRate / 2);
        const melPoints = tf.linspace(minMel, maxMel, this.nMelBands + 2).arraySync();
        return melPoints.map(mel => this.melToHz(mel));
    }

    getMelWeights(fftFreqs, melFreqs) {
        const weights = new Array(this.nMelBands).fill(0).map(() => 
            new Float32Array(fftFreqs.length)
        );

        for (let i = 0; i < this.nMelBands; i++) {
            const fLeft = melFreqs[i];
            const fCenter = melFreqs[i + 1];
            const fRight = melFreqs[i + 2];

            for (let j = 0; j < fftFreqs.length; j++) {
                const freq = fftFreqs[j];
                if (freq >= fLeft && freq <= fRight) {
                    if (freq <= fCenter) {
                        weights[i][j] = (freq - fLeft) / (fCenter - fLeft);
                    } else {
                        weights[i][j] = (fRight - freq) / (fRight - fCenter);
                    }
                }
            }
        }

        return weights;
    }

    hzToMel(hz) {
        return 2595 * Math.log10(1 + hz / 700);
    }

    melToHz(mel) {
        return 700 * (Math.pow(10, mel / 2595) - 1);
    }

    async convert(audioData) {
        // Convert to tensor
        const audioTensor = tf.tensor1d(audioData);
        
        // Apply STFT
        const stft = this.applyStft(audioTensor);
        
        // Convert to power spectrogram
        const powerSpec = tf.square(tf.abs(stft));
        
        // Apply mel filterbank
        const melSpec = tf.matMul(this.melFilterbank, powerSpec);
        
        // Convert to log scale
        const logMelSpec = tf.log(tf.add(melSpec, 1e-7));
        
        // Clean up tensors
        audioTensor.dispose();
        stft.dispose();
        powerSpec.dispose();
        melSpec.dispose();
        
        return logMelSpec.arraySync();
    }

    applyStft(audioTensor) {
        // Implementation of Short-Time Fourier Transform
        const numFrames = Math.floor((audioTensor.shape[0] - this.frameLength) / this.hopLength) + 1;
        const window = tf.hannWindow(this.frameLength);
        
        const frames = [];
        for (let i = 0; i < numFrames; i++) {
            const start = i * this.hopLength;
            const frame = audioTensor.slice([start], [this.frameLength]);
            const windowedFrame = frame.mul(window);
            const fft = tf.spectral.rfft(windowedFrame);
            frames.push(fft);
        }
        
        return tf.stack(frames);
    }
}

// Export the classes
window.EmotionAnalyzer = EmotionAnalyzer;
window.EmotionCorrectionManager = EmotionCorrectionManager;