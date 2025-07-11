/**
 * Emotion Controller - Main Application Controller
 * Orchestrates all components for emotion analysis
 */

class EmotionController {
    constructor(config = {}) {
        this.config = {
            autoSave: true,
            maxHistoryItems: 20,
            ...config
        };
        
        // Core components
        this.uiManager = null;
        this.dataManager = null;
        this.cameraManager = null;
        this.audioManager = null;
        this.textAnalyzer = null;
        
        // State management
        this.isInitialized = false;
        this.currentSession = {
            id: null,
            startTime: null,
            analysisCount: 0,
            currentEmotion: 'neutral',
            emotionSource: null
        };
        
        // Session timer
        this.sessionTimer = null;
        
        console.log('EmotionController: Initialized');
    }

    async init() {
        try {
            console.log('EmotionController: Initializing...');
            
            // Initialize components
            await this.initializeComponents();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start session
            this.startSession();
            
            // Update UI
            this.updateUI();
            
            // Update storage mode status
            await this.updateStorageModeStatus();
            
            this.isInitialized = true;
            console.log('EmotionController: Initialized successfully');
            
        } catch (error) {
            console.error('EmotionController: Initialization failed:', error);
            throw error;
        }
    }

    async initializeComponents() {
        // Initialize UI Manager
        this.uiManager = new UIManager();
        this.uiManager.init();
        
        // Initialize Data Manager
        this.dataManager = new DataManager();
        await this.dataManager.init();
        
        // Initialize Camera Manager
        this.cameraManager = new CameraManager();
        
        // Initialize Audio Manager
        this.audioManager = new AudioManager();
        
        // Initialize Text Analyzer
        this.textAnalyzer = new TextAnalyzer();
        
        console.log('EmotionController: All components initialized');
    }

    setupEventListeners() {
        // UI Events
        this.uiManager.on('startCamera', () => this.handleStartCamera());
        this.uiManager.on('stopCamera', () => this.handleStopCamera());
        this.uiManager.on('captureSnapshot', () => this.handleCaptureSnapshot());
        this.uiManager.on('startAudio', () => this.handleStartAudio());
        this.uiManager.on('stopAudio', () => this.handleStopAudio());
        this.uiManager.on('recordAudio', () => this.handleRecordAudio());
        this.uiManager.on('analyzeText', (text) => this.handleAnalyzeText(text));
        this.uiManager.on('submitData', () => this.handleSubmitData());
        this.uiManager.on('tabChange', (tabName) => this.handleTabChange(tabName));
        
        // Camera Events
        this.cameraManager.on('emotionDetected', (data) => this.handleEmotionDetected(data, 'camera'));
        this.cameraManager.on('noFaceDetected', () => this.handleNoFaceDetected());
        this.cameraManager.on('detectionError', (error) => this.handleDetectionError(error));
        this.cameraManager.on('cameraStarted', () => this.handleCameraStarted());
        this.cameraManager.on('cameraStopped', () => this.handleCameraStopped());
        
        // Audio Events
        this.audioManager.on('emotionDetected', (data) => this.handleEmotionDetected(data, 'audio'));
        this.audioManager.on('audioLevel', (level) => this.handleAudioLevel(level));
        this.audioManager.on('recordingStarted', () => this.handleRecordingStarted());
        this.audioManager.on('recordingStopped', () => this.handleRecordingStopped());
        this.audioManager.on('analysisError', (error) => this.handleAnalysisError(error));
        this.audioManager.on('audioStarted', () => this.handleAudioStarted());
        this.audioManager.on('audioStopped', () => this.handleAudioStopped());
        
        // Text Analyzer Events
        this.textAnalyzer.on('analysisComplete', (data) => this.handleEmotionDetected(data, 'text'));
        this.textAnalyzer.on('analysisError', (error) => this.handleAnalysisError(error));
        
        // Snapshot Events
        this.uiManager.on('startSnapshotCamera', () => this.handleStartSnapshotCamera());
        this.uiManager.on('stopSnapshotCamera', () => this.handleStopSnapshotCamera());
        this.uiManager.on('captureSnapshot2', () => this.handleCaptureSnapshot2());
        
        console.log('EmotionController: Event listeners setup complete');
    }

    // Camera handlers
    async handleStartCamera() {
        try {
            await this.cameraManager.start();
            this.uiManager.updateCameraStatus('Camera active with AI face detection');
        } catch (error) {
            console.error('EmotionController: Failed to start camera:', error);
            this.uiManager.showError('Failed to start camera: ' + error.message);
        }
    }

    handleStopCamera() {
        this.cameraManager.stop();
        this.uiManager.updateCameraStatus('Camera stopped');
    }

    async handleCaptureSnapshot() {
        try {
            console.log('EmotionController: Capturing snapshot...');
            
            const video = document.getElementById('cameraVideo');
            const canvas = document.getElementById('cameraCanvas');
            
            if (!video || !canvas) {
                throw new Error('Video or canvas element not found');
            }
            
            // Draw video frame to canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            let detectionData = null;
            
            // Analyze snapshot if face detection is available
            if (this.faceApiLoaded) {
                try {
                    const detections = await faceapi.detectAllFaces(
                        canvas, 
                        new faceapi.TinyFaceDetectorOptions({
                            inputSize: 320,  // Increased for better accuracy
                            scoreThreshold: 0.6  // Higher threshold for more confident detections
                        })
                    ).withFaceLandmarks().withFaceExpressions();
                    
                    if (detections.length > 0) {
                        // Enhanced bounding box with gradient and better styling
                        detections.forEach(det => {
                            const box = det.detection.box;
                            
                            // Draw bounding box with gradient and shadow
                            ctx.save();
                            
                            // Create gradient for bounding box
                            const gradient = ctx.createLinearGradient(box.x, box.y, box.x + box.width, box.y + box.height);
                            gradient.addColorStop(0, 'rgba(0, 255, 127, 0.9)');  // Bright green
                            gradient.addColorStop(0.5, 'rgba(0, 200, 100, 0.95)'); // Medium green
                            gradient.addColorStop(1, 'rgba(0, 150, 75, 0.9)');   // Dark green
                            
                            ctx.strokeStyle = gradient;
                            ctx.lineWidth = 3;
                            ctx.lineCap = 'round';
                            ctx.lineJoin = 'round';
                            
                            // Enhanced shadow
                            ctx.shadowColor = 'rgba(0, 255, 127, 0.6)';
                            ctx.shadowBlur = 15;
                            ctx.shadowOffsetX = 2;
                            ctx.shadowOffsetY = 2;
                            
                            // Draw rounded rectangle
                            const radius = 8;
                            ctx.beginPath();
                            ctx.moveTo(box.x + radius, box.y);
                            ctx.lineTo(box.x + box.width - radius, box.y);
                            ctx.quadraticCurveTo(box.x + box.width, box.y, box.x + box.width, box.y + radius);
                            ctx.lineTo(box.x + box.width, box.y + box.height - radius);
                            ctx.quadraticCurveTo(box.x + box.width, box.y + box.height, box.x + box.width - radius, box.y + box.height);
                            ctx.lineTo(box.x + radius, box.y + box.height);
                            ctx.quadraticCurveTo(box.x, box.y + box.height, box.x, box.y + box.height - radius);
                            ctx.lineTo(box.x, box.y + radius);
                            ctx.quadraticCurveTo(box.x, box.y, box.x + radius, box.y);
                            ctx.closePath();
                            ctx.stroke();
                            
                            // Draw corner indicators
                            const cornerSize = 12;
                            ctx.lineWidth = 2;
                            ctx.shadowBlur = 8;
                            
                            // Top-left corner
                            ctx.beginPath();
                            ctx.moveTo(box.x, box.y + cornerSize);
                            ctx.lineTo(box.x, box.y);
                            ctx.lineTo(box.x + cornerSize, box.y);
                            ctx.stroke();
                            
                            // Top-right corner
                            ctx.beginPath();
                            ctx.moveTo(box.x + box.width - cornerSize, box.y);
                            ctx.lineTo(box.x + box.width, box.y);
                            ctx.lineTo(box.x + box.width, box.y + cornerSize);
                            ctx.stroke();
                            
                            // Bottom-right corner
                            ctx.beginPath();
                            ctx.moveTo(box.x + box.width, box.y + box.height - cornerSize);
                            ctx.lineTo(box.x + box.width, box.y + box.height);
                            ctx.lineTo(box.x + box.width - cornerSize, box.y + box.height);
                            ctx.stroke();
                            
                            // Bottom-left corner
                            ctx.beginPath();
                            ctx.moveTo(box.x + cornerSize, box.y + box.height);
                            ctx.lineTo(box.x, box.y + box.height);
                            ctx.lineTo(box.x, box.y + box.height - cornerSize);
                            ctx.stroke();
                            
                            ctx.restore();
                        });
                        
                        // Enhanced landmark drawing with better visibility
                        detections.forEach(det => {
                            if (det.landmarks) {
                                ctx.save();
                                
                                const points = det.landmarks.positions;
                                
                                // Draw landmark connections with gradient
                                const landmarkGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                                landmarkGradient.addColorStop(0, 'rgba(255, 165, 0, 0.8)');  // Orange
                                landmarkGradient.addColorStop(0.5, 'rgba(255, 140, 0, 0.9)'); // Dark orange
                                landmarkGradient.addColorStop(1, 'rgba(255, 120, 0, 0.8)');  // Red-orange
                                
                                ctx.strokeStyle = landmarkGradient;
                                ctx.lineWidth = 2;
                                ctx.lineCap = 'round';
                                ctx.lineJoin = 'round';
                                
                                // Enhanced shadow for landmarks
                                ctx.shadowColor = 'rgba(255, 165, 0, 0.5)';
                                ctx.shadowBlur = 8;
                                ctx.shadowOffsetX = 1;
                                ctx.shadowOffsetY = 1;
                                
                                // Draw landmark connections
                                ctx.beginPath();
                                for (let i = 0; i < points.length; i++) {
                                    const pt = points[i];
                                    if (i === 0) ctx.moveTo(pt.x, pt.y);
                                    else ctx.lineTo(pt.x, pt.y);
                                }
                                ctx.closePath();
                                ctx.stroke();
                                
                                // Draw individual landmark points with enhanced styling
                                points.forEach((pt, index) => {
                                    ctx.save();
                                    
                                    // Different sizes for different landmark types
                                    let pointSize = 2;
                                    if (index < 17) pointSize = 3; // Face outline
                                    else if (index < 27) pointSize = 2.5; // Eyebrows
                                    else if (index < 36) pointSize = 2; // Nose
                                    else if (index < 48) pointSize = 2.5; // Eyes
                                    else pointSize = 2; // Mouth
                                    
                                    // Create radial gradient for points
                                    const pointGradient = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pointSize);
                                    pointGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                                    pointGradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.8)');
                                    pointGradient.addColorStop(1, 'rgba(255, 140, 0, 0.6)');
                                    
                                    ctx.fillStyle = pointGradient;
                                    ctx.shadowColor = 'rgba(255, 165, 0, 0.4)';
                                    ctx.shadowBlur = 4;
                                    ctx.shadowOffsetX = 0;
                                    ctx.shadowOffsetY = 0;
                                    
                                    ctx.beginPath();
                                    ctx.arc(pt.x, pt.y, pointSize, 0, 2 * Math.PI);
                                    ctx.fill();
                                    
                                    ctx.restore();
                                });
                                
                                ctx.restore();
                            }
                        });
                        
                        const face = detections[0];
                        const expressions = face.expressions;
                        const dominantExpression = Object.entries(expressions)
                            .reduce((a, b) => a[1] > b[1] ? a : b);
                        
                        const emotion = this.mapExpressionToEmotion(dominantExpression[0]);
                        const confidence = dominantExpression[1];
                        
                        detectionData = {
                            emotion: emotion,
                            dominantEmotion: emotion,
                            confidence: confidence,
                            expressions: expressions,
                            source: 'camera_snapshot',
                            timestamp: new Date().toISOString()
                        };
                    }
                } catch (error) {
                    console.warn('EmotionController: Snapshot analysis failed:', error);
                }
            }
            
            // Fallback to simulation if no face detected or analysis failed
            if (!detectionData) {
                const emotions = ['happy', 'sad', 'angry', 'excited', 'fearful', 'surprised', 'neutral', 'confused'];
                const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
                const confidence = 0.5 + Math.random() * 0.5;
                
                detectionData = {
                    emotion: randomEmotion,
                    dominantEmotion: randomEmotion,
                    confidence: confidence,
                    expressions: {},
                    source: 'camera_snapshot_simulation',
                    timestamp: new Date().toISOString()
                };
            }
            
            console.log('EmotionController: Snapshot captured');
            return detectionData;
            
        } catch (error) {
            console.error('EmotionController: Snapshot failed:', error);
            throw error;
        }
    }

    // Audio handlers
    async handleStartAudio() {
        try {
            await this.audioManager.start();
            this.uiManager.updateAudioStatus('Audio analysis active');
        } catch (error) {
            console.error('EmotionController: Failed to start audio:', error);
            this.uiManager.showError('Failed to start audio analysis: ' + error.message);
        }
    }

    handleStopAudio() {
        this.audioManager.stop();
        this.uiManager.updateAudioStatus('Audio analysis stopped');
    }

    handleRecordAudio() {
        this.audioManager.toggleRecording();
    }

    handleRecordingStarted() {
        this.uiManager.showNotification('Audio recording started');
    }

    handleRecordingStopped() {
        this.uiManager.showNotification('Audio recording stopped');
    }

    // Text analysis handlers
    async handleAnalyzeText(text) {
        try {
            await this.textAnalyzer.analyzeText(text);
        } catch (error) {
            console.error('EmotionController: Text analysis failed:', error);
            this.uiManager.showError('Failed to analyze text: ' + error.message);
        }
    }

    // Data handlers
    async handleEmotionDetected(data, source) {
        try {
            // Update current emotion
            this.updateCurrentEmotion(data.emotion, source, data.confidence);
            
            // Save data
            await this.saveEmotionData(data, source);
            
            // Update UI based on source
            this.updateSourceUI(data, source);
            
            // Add to history
            this.addToHistory(data, source);
            
        } catch (error) {
            console.error('EmotionController: Failed to handle emotion detection:', error);
            this.uiManager.showError('Failed to process emotion data: ' + error.message);
        }
    }

    updateCurrentEmotion(emotion, source, confidence) {
        this.currentSession.currentEmotion = emotion;
        this.currentSession.emotionSource = source;
        
        this.uiManager.updateEmotionDisplay({
            emotion: emotion,
            source: source,
            confidence: confidence
        });
    }

    async saveEmotionData(data, source) {
        // Pastikan struktur data valid
        const emotionData = {
            ...data,
            dominantEmotion: data.dominantEmotion || data.emotion || '',
            source: data.source || source || '',
            confidence: typeof data.confidence === 'number' ? data.confidence : 0,
            sessionId: this.currentSession.id,
            timestamp: new Date().toISOString()
        };

        // Debug log sebelum simpan
        if (!emotionData.dominantEmotion || !emotionData.source) {
            console.error('EmotionController: Data tidak valid sebelum simpan:', emotionData);
        }

        await this.dataManager.saveEmotionData(emotionData);

        // Broadcast ke channel agar history realtime
        if ('BroadcastChannel' in window) {
            if (!this._emotionChannel) {
                this._emotionChannel = new BroadcastChannel('emotion-data');
            }
            this._emotionChannel.postMessage({ type: 'new-emotion', entry: emotionData });
        }

        // Update session stats
        this.currentSession.analysisCount++;
        this.uiManager.updateSessionStats(this.currentSession);
    }

    updateSourceUI(data, source) {
        switch (source) {
            case 'camera':
            case 'camera_snapshot':
                this.uiManager.updateCameraEmotion(data.emotion);
                this.uiManager.updateCameraConfidence(data.confidence);
                this.uiManager.updateFaceDetected('Yes');
                break;
                
            case 'audio':
                this.uiManager.updateAudioEmotion(data.emotion);
                this.uiManager.updateAudioConfidence(data.confidence);
                this.uiManager.updateVoiceQuality(data.voiceQuality);
                break;
                
            case 'text':
                this.uiManager.updateTextResults(data);
                break;
        }
    }

    addToHistory(data, source) {
        this.uiManager.addToHistory(data, source);
    }

    // Error handlers
    handleNoFaceDetected() {
        this.uiManager.updateFaceDetected('No');
        this.uiManager.updateCameraEmotion('-');
        this.uiManager.updateCameraConfidence(0);
    }

    handleDetectionError(error) {
        console.error('EmotionController: Detection error:', error);
        this.uiManager.showError('Face detection error: ' + error.message);
    }

    handleAudioLevel(level) {
        this.uiManager.updateAudioLevel(level);
    }

    handleAnalysisError(error) {
        console.error('EmotionController: Analysis error:', error);
        this.uiManager.showError('Analysis error: ' + error.message);
    }

    // Tab handlers
    handleTabChange(tabName) {
        // Stop all analysis when switching tabs
        this.stopAllAnalysis();
        
        // Update UI for the new tab
        this.uiManager.updateTabUI(tabName);
    }

    stopAllAnalysis() {
        if (this.cameraManager && typeof this.cameraManager.stop === 'function') {
            this.cameraManager.stop();
        }
        if (this.audioManager && typeof this.audioManager.stop === 'function') {
            this.audioManager.stop();
        }
    }

    // Data submission
    async handleSubmitData() {
        try {
            if (!this.currentSession.currentEmotion || this.currentSession.currentEmotion.trim() === '') {
                this.uiManager.showError('No emotion data to submit');
                return;
            }
            
            const submissionData = {
                emotion: this.currentSession.currentEmotion,
                confidence: 0.8,
                source: this.currentSession.emotionSource || 'manual_submission',
                sessionId: this.currentSession.id,
                timestamp: new Date().toISOString(),
                notes: 'Manually submitted emotion data',
                tags: ['submitted', 'manual']
            };
            
            await this.dataManager.saveEmotionData(submissionData);
            
            this.uiManager.showNotification('Data submitted successfully!');
            this.uiManager.disableSubmitButton();
            
            // Reset after 2 seconds
            setTimeout(() => {
                this.updateCurrentEmotion('neutral', null, 0);
            }, 2000);
            
        } catch (error) {
            console.error('EmotionController: Failed to submit data:', error);
            this.uiManager.showError('Failed to submit data: ' + error.message);
        }
    }

    // Session management
    startSession() {
        this.currentSession.id = 'session_' + Date.now();
        this.currentSession.startTime = new Date();
        this.currentSession.analysisCount = 0;
        this.currentSession.currentEmotion = 'neutral';
        this.currentSession.emotionSource = null;
        
        this.startSessionTimer();
        
        console.log('EmotionController: Session started:', this.currentSession.id);
    }

    startSessionTimer() {
        this.sessionTimer = setInterval(() => {
            if (this.currentSession.startTime) {
                const duration = new Date() - this.currentSession.startTime;
                const hours = Math.floor(duration / 3600000);
                const minutes = Math.floor((duration % 3600000) / 60000);
                const seconds = Math.floor((duration % 60000) / 1000);
                
                const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                const sessionDurationEl = document.getElementById('sessionDuration');
                if (sessionDurationEl) {
                    sessionDurationEl.textContent = timeString;
                }
            }
        }, 1000);
    }

    // UI updates
    updateUI() {
        this.uiManager.updateSessionStats(this.currentSession);
        this.uiManager.updateEmotionDisplay({
            emotion: 'neutral',
            source: null,
            confidence: 0
        });
        
        const storageStatusEl = document.getElementById('storageStatus');
        if (storageStatusEl) {
            storageStatusEl.textContent = 'Ready';
        }
    }

    // Export functionality
    async performExport() {
        try {
            const format = document.getElementById('exportFormat')?.value || 'json';
            const startDate = document.getElementById('exportStartDate')?.value;
            const endDate = document.getElementById('exportEndDate')?.value;
            const emotion = document.getElementById('exportEmotion')?.value;
            const source = document.getElementById('exportSource')?.value;
            
            const filters = {};
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;
            if (emotion) filters.emotion = emotion;
            if (source) filters.source = source;
            
            const exportData = await this.dataManager.exportData(format, filters);
            
            // Download file
            const url = URL.createObjectURL(exportData.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = exportData.filename;
            a.click();
            
            URL.revokeObjectURL(url);
            this.uiManager.closeExportModal();
            this.uiManager.showNotification('Data exported successfully!');
            
        } catch (error) {
            console.error('EmotionController: Export failed:', error);
            this.uiManager.showError('Failed to export data: ' + error.message);
        }
    }

    // Storage mode management
    async updateStorageModeStatus() {
        try {
            const mode = await this.dataManager.getStorageMode();
            this.uiManager.updateStorageModeStatus(mode);
        } catch (error) {
            console.error('EmotionController: Failed to update storage mode status:', error);
            // Fallback to local mode
            this.uiManager.updateStorageModeStatus('local');
        }
    }

    // Cleanup
    destroy() {
        // Stop session timer
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }
        
        // Destroy components
        if (this.uiManager) this.uiManager.destroy();
        if (this.cameraManager) this.cameraManager.destroy();
        if (this.audioManager) this.audioManager.destroy();
        if (this.textAnalyzer) this.textAnalyzer.destroy();
        
        this.isInitialized = false;
        console.log('EmotionController: Destroyed');
    }

    // Camera state handlers
    handleCameraStarted() {
        this.uiManager.updateCameraButtonStates(true);
        this.uiManager.updateCameraStatus('Camera active with AI face detection');
    }

    handleCameraStopped() {
        this.uiManager.updateCameraButtonStates(false);
        this.uiManager.updateCameraStatus('Camera stopped');
    }

    // Audio state handlers
    handleAudioStarted() {
        this.uiManager.updateAudioButtonStates(true);
        this.uiManager.updateAudioStatus('Audio analysis active');
    }

    handleAudioStopped() {
        this.uiManager.updateAudioButtonStates(false);
        this.uiManager.updateAudioStatus('Audio analysis stopped');
    }

    // === SNAPSHOT CAMERA HANDLERS ===
    async handleStartSnapshotCamera() {
        try {
            const video = document.getElementById('snapshotCameraVideo');
            if (!video) return;
            this.snapshotStream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = this.snapshotStream;
            video.style.display = '';
            this.uiManager.updateSnapshotUI('active');
            document.getElementById('startSnapshotCameraBtn').disabled = true;
            document.getElementById('stopSnapshotCameraBtn').disabled = false;
            document.getElementById('captureSnapshotBtn2').disabled = false;
        } catch (err) {
            this.uiManager.updateSnapshotStatus('Camera error');
            this.uiManager.showError('Tidak dapat mengakses kamera: ' + err.message);
        }
    }

    handleStopSnapshotCamera() {
        const video = document.getElementById('snapshotCameraVideo');
        if (this.snapshotStream) {
            this.snapshotStream.getTracks().forEach(track => track.stop());
            this.snapshotStream = null;
        }
        if (video) {
            video.srcObject = null;
            video.style.display = 'none';
        }
        this.uiManager.updateSnapshotUI('reset');
        document.getElementById('startSnapshotCameraBtn').disabled = false;
        document.getElementById('stopSnapshotCameraBtn').disabled = true;
        document.getElementById('captureSnapshotBtn2').disabled = true;
    }

    async handleCaptureSnapshot2() {
        const video = document.getElementById('snapshotCameraVideo');
        const canvas = document.getElementById('snapshotCameraCanvas');
        if (!video || !canvas) return;
        // Draw video frame to canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Analisis emosi & landmark dengan face-api.js pada canvas
        this.uiManager.updateSnapshotStatus('Menganalisis emosi...');
        try {
            await faceapi.nets.tinyFaceDetector.loadFromUri('models/');
            await faceapi.nets.faceExpressionNet.loadFromUri('models/');
            await faceapi.nets.faceLandmark68Net.loadFromUri('models/');
            const detections = await faceapi.detectAllFaces(
                canvas,
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceExpressions();
            ctx.save();
            ctx.globalAlpha = 1;
            ctx.restore();
            if (detections.length > 0) {
                // Custom: Gambar bounding box dan landmark (seperti live camera)
                detections.forEach(det => {
                    const box = det.detection.box;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(0, 200, 80, 0.95)';
                    ctx.lineWidth = 4;
                    ctx.shadowColor = 'rgba(0,200,80,0.5)';
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.rect(box.x, box.y, box.width, box.height);
                    ctx.stroke();
                    ctx.restore();
                });
                detections.forEach(det => {
                    if (det.landmarks) {
                        ctx.save();
                        ctx.strokeStyle = 'orange';
                        ctx.lineWidth = 3;
                        ctx.shadowColor = 'rgba(255,140,0,0.4)';
                        ctx.shadowBlur = 6;
                        const points = det.landmarks.positions;
                        ctx.beginPath();
                        for (let i = 0; i < points.length; i++) {
                            const pt = points[i];
                            if (i === 0) ctx.moveTo(pt.x, pt.y);
                            else ctx.lineTo(pt.x, pt.y);
                        }
                        ctx.closePath();
                        ctx.stroke();
                        points.forEach(pt => {
                            ctx.beginPath();
                            ctx.arc(pt.x, pt.y, 2.5, 0, 2 * Math.PI);
                            ctx.fillStyle = 'orange';
                            ctx.shadowBlur = 0;
                            ctx.fill();
                        });
                        ctx.restore();
                    }
                });
                // Hapus faceapi bawaan untuk menghindari duplikasi landmark
                // faceapi.draw.drawDetections(canvas, detections);
                // faceapi.draw.drawFaceLandmarks(canvas, detections);
                // Cari emosi dominan
                let maxEmotion = 'neutral';
                let maxValue = 0;
                for (const [emo, val] of Object.entries(detections[0].expressions)) {
                    if (val > maxValue) {
                        maxValue = val;
                        maxEmotion = emo;
                    }
                }
                this.uiManager.updateSnapshotUI('preview', {
                    imgSrc: canvas.toDataURL('image/png'),
                    emotion: this.capitalizeFirst(maxEmotion),
                    confidence: maxValue,
                    faceDetected: 'Yes'
                });
                this.uiManager.updateEmotionDisplay({
                    emotion: this.capitalizeFirst(maxEmotion),
                    confidence: maxValue,
                    source: 'camera_snapshot'
                });
            } else {
                this.uiManager.updateSnapshotUI('preview', {
                    imgSrc: canvas.toDataURL('image/png'),
                    emotion: '-',
                    confidence: 0,
                    faceDetected: 'No'
                });
                this.uiManager.updateEmotionDisplay({
                    emotion: '-',
                    confidence: 0,
                    source: 'camera_snapshot'
                });
            }
        } catch (err) {
            this.uiManager.updateSnapshotStatus('Analisis gagal');
            this.uiManager.showError('Gagal analisis emosi snapshot: ' + err.message);
        }
    }

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Global functions for HTML integration
function closeExportModal() {
    if (window.emotionController) {
        window.emotionController.uiManager.closeExportModal();
    }
}

function performExport() {
    if (window.emotionController) {
        window.emotionController.performExport();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing Emotion Controller...');
        
        // Check for required dependencies
        const requiredDeps = ['UIManager', 'DataManager', 'CameraManager', 'AudioManager', 'TextAnalyzer'];
        const missingDeps = requiredDeps.filter(dep => typeof window[dep] === 'undefined');
        
        if (missingDeps.length > 0) {
            throw new Error(`Missing required dependencies: ${missingDeps.join(', ')}`);
        }
        
        // Initialize controller
        window.emotionController = new EmotionController();
        await window.emotionController.init();
        
        console.log('Emotion Controller initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize Emotion Controller:', error);
        
        // Show error notification
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>Failed to initialize system: ${error.message}</span>
        `;
        document.body.appendChild(notification);
        setTimeout(() => { 
            if (notification.parentNode) {
                notification.remove(); 
            }
        }, 8000);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmotionController;
}

window.EmotionController = EmotionController; 