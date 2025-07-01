/**
 * Emotion Input Controller - AI-Powered Emotion Analysis
 * Integrates face detection, voice analysis, and text sentiment analysis
 */

class EmotionInputController {
    constructor() {
        // Core components
        this.aiModelManager = null;
        this.dataStorage = null;
        this.audioRecorder = null;
        this.voiceAnalyzer = null;
        this.faceApiManager = null;
        
        // State management
        this.isInitialized = false;
        this.currentSession = {
            id: null,
            startTime: null,
            analysisCount: 0,
            currentEmotion: 'neutral',
            emotionSource: null
        };
        
        // Camera and audio streams
        this.cameraStream = null;
        this.audioStream = null;
        this.analysisInterval = null;
        
        // UI elements
        this.elements = {};
        
        // Configuration
        this.config = {
            faceDetectionInterval: 100,
            audioAnalysisInterval: 200,
            confidenceThreshold: 0.6,
            maxHistoryItems: 10,
            autoSave: true
        };
        
        console.log('EmotionInputController initialized');
    }

    /**
     * Initialize all components and start the application
     */
    async init() {
        try {
            console.log('Initializing Emotion Input Controller...');
            
            // Check dependencies
            this.checkDependencies();
            
            // Initialize UI elements
            this.initializeElements();
            
            // Initialize DataStorage with fallback
            try {
                // Try to use the enhanced DataStorage with HybridStorage
                if (typeof DataStorage !== 'undefined') {
                    this.dataStorage = new DataStorage();
                    await this.dataStorage.init();
                } else {
                    // Fallback to SimpleDataStorage
                    this.dataStorage = new SimpleDataStorage();
                    await this.dataStorage.init();
                }
            } catch (error) {
                console.warn('Failed to initialize enhanced DataStorage, using SimpleDataStorage:', error);
                this.dataStorage = new SimpleDataStorage();
                await this.dataStorage.init();
            }
            
            // Update storage mode status in UI
            this.updateStorageModeStatus();
            
            // Initialize Face API Manager
            await this.initializeFaceApiManager();
            
            // Initialize audio components
            this.initializeAudioComponents();
            
            // Start session
            this.startSession();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update UI
            this.updateUI();
            
            this.isInitialized = true;
            console.log('Emotion Input Controller initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Emotion Input Controller:', error);
            this.showError('Failed to initialize application: ' + error.message);
        }
    }

    async initializeFaceApiManager() {
        try {
            console.log('Initializing Face API Manager...');
            
            // Check if FaceApiManager is available
            if (typeof FaceApiManager === 'undefined') {
                console.warn('FaceApiManager not available, face detection will be simulated');
                return;
            }
            
            // Create Face API Manager instance
            this.faceApiManager = new FaceApiManager();
            
            // Initialize with proper error handling
            const success = await this.faceApiManager.init();
            
            if (success) {
                console.log('Face API Manager initialized successfully');
                
                // Set up callbacks for face detection events
                this.faceApiManager.setCallbacks(
                    (faceData) => this.onFaceDetected(faceData),
                    () => this.onNoFaceDetected()
                );
            } else {
                console.warn('Face API Manager initialization failed, will use simulation mode');
            }
            
        } catch (error) {
            console.warn('Face API Manager initialization error:', error);
            console.log('Face detection will be simulated');
        }
    }

    /**
     * Initialize UI element references
     */
    initializeElements() {
        // Camera elements
        this.elements.cameraVideo = document.getElementById('cameraVideo');
        this.elements.cameraCanvas = document.getElementById('cameraCanvas');
        this.elements.startCameraBtn = document.getElementById('startCameraBtn');
        this.elements.stopCameraBtn = document.getElementById('stopCameraBtn');
        this.elements.captureSnapshotBtn = document.getElementById('captureSnapshotBtn');
        this.elements.cameraStatus = document.getElementById('cameraStatus');
        this.elements.cameraEmotion = document.getElementById('cameraEmotion');
        this.elements.cameraConfidenceMeter = document.getElementById('cameraConfidenceMeter');
        this.elements.faceDetected = document.getElementById('faceDetected');
        
        // Audio elements
        this.elements.startAudioBtn = document.getElementById('startAudioBtn');
        this.elements.stopAudioBtn = document.getElementById('stopAudioBtn');
        this.elements.recordAudioBtn = document.getElementById('recordAudioBtn');
        this.elements.audioStatus = document.getElementById('audioStatus');
        this.elements.audioLevelFill = document.getElementById('audioLevelFill');
        this.elements.audioLevelText = document.getElementById('audioLevelText');
        this.elements.spectrogramCanvas = document.getElementById('spectrogramCanvas');
        this.elements.audioEmotion = document.getElementById('audioEmotion');
        this.elements.audioConfidenceMeter = document.getElementById('audioConfidenceMeter');
        this.elements.voiceQuality = document.getElementById('voiceQuality');
        
        // Text analysis elements
        this.elements.textInput = document.getElementById('textInput');
        this.elements.analyzeTextBtn = document.getElementById('analyzeTextBtn');
        this.elements.aiAnalysisResults = document.getElementById('aiAnalysisResults');
        
        // Display elements
        this.elements.currentEmotion = document.getElementById('currentEmotion');
        this.elements.emotionSource = document.getElementById('emotionSource');
        this.elements.emotionHistory = document.getElementById('emotionHistory');
        this.elements.sessionDuration = document.getElementById('sessionDuration');
        this.elements.analysisCount = document.getElementById('analysisCount');
        this.elements.storageStatus = document.getElementById('storageStatus');
        this.elements.submitDataBtn = document.getElementById('submitDataBtn');
        this.elements.viewDashboardBtn = document.getElementById('viewDashboardBtn');
        
        // Tab elements
        this.elements.tabBtns = document.querySelectorAll('.tab-btn');
        this.elements.inputSections = document.querySelectorAll('.input-section');
        
        // Debug log
        console.log('Tab buttons found:', this.elements.tabBtns.length);
        console.log('Input sections found:', this.elements.inputSections.length);
        
        // Export elements
        this.elements.exportBtn = document.getElementById('exportBtn');
        this.elements.exportModal = document.getElementById('exportModal');
        
        // Log error dan notifikasi visual jika elemen penting tidak ditemukan
        [
            'startCameraBtn','stopCameraBtn','captureSnapshotBtn','startAudioBtn','stopAudioBtn','recordAudioBtn',
            'analyzeTextBtn','submitDataBtn','viewDashboardBtn'
        ].forEach(key => {
            if (!this.elements[key]) {
                console.error('Element not found:', key);
                this.showError('Tombol/elemen tidak ditemukan di halaman: ' + key);
            }
        });
        // Enable semua tombol utama pada awal (kecuali yang memang harus disabled)
        if (this.elements.startCameraBtn) this.elements.startCameraBtn.disabled = false;
        if (this.elements.stopCameraBtn) this.elements.stopCameraBtn.disabled = true;
        if (this.elements.captureSnapshotBtn) this.elements.captureSnapshotBtn.disabled = true;
        if (this.elements.startAudioBtn) this.elements.startAudioBtn.disabled = false;
        if (this.elements.stopAudioBtn) this.elements.stopAudioBtn.disabled = true;
        if (this.elements.recordAudioBtn) this.elements.recordAudioBtn.disabled = true;
        if (this.elements.analyzeTextBtn) this.elements.analyzeTextBtn.disabled = false;
        if (this.elements.submitDataBtn) this.elements.submitDataBtn.disabled = true;
        if (this.elements.viewDashboardBtn) this.elements.viewDashboardBtn.disabled = false;
    }

    /**
     * Initialize audio components
     */
    initializeAudioComponents() {
        // Initialize voice analyzer
        this.voiceAnalyzer = {
            audioContext: null,
            analyzer: null,
            microphone: null,
            isAnalyzing: false
        };
        
        // Initialize audio recorder
        this.audioRecorder = {
            mediaRecorder: null,
            audioChunks: [],
            isRecording: false
        };
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // --- Tab navigation ---
        if (!this.elements.tabBtns || !this.elements.inputSections) {
            console.error('Tab buttons or input sections not found!');
            this.showError('Tab menu tidak ditemukan di halaman.');
            return;
        }
        // Hindari duplikasi event listener
        this.elements.tabBtns.forEach(btn => {
            btn.onclick = null;
            btn.addEventListener('click', () => {
                console.log('[Tab] clicked:', btn.dataset.tab);
                this.switchTab(btn.dataset.tab);
            });
        });
        // Inisialisasi tab pertama aktif (camera)
        this.switchTab('camera');

        // --- Camera controls ---
        if (this.elements.startCameraBtn) {
            this.elements.startCameraBtn.onclick = null;
            this.elements.startCameraBtn.addEventListener('click', () => {
                if (!this.isTabActive('camera')) {
                    this.showError('Fitur kamera hanya bisa digunakan di tab Camera Analysis!');
                    return;
                }
                console.log('[Camera] Start Camera Clicked');
                this.startCamera();
            });
        }
        if (this.elements.stopCameraBtn) {
            this.elements.stopCameraBtn.onclick = null;
            this.elements.stopCameraBtn.addEventListener('click', () => {
                if (!this.isTabActive('camera')) {
                    this.showError('Fitur kamera hanya bisa digunakan di tab Camera Analysis!');
                    return;
                }
                console.log('[Camera] Stop Camera Clicked');
                this.stopCamera();
            });
        }
        if (this.elements.captureSnapshotBtn) {
            this.elements.captureSnapshotBtn.onclick = null;
            this.elements.captureSnapshotBtn.addEventListener('click', () => {
                if (!this.isTabActive('camera')) {
                    this.showError('Fitur kamera hanya bisa digunakan di tab Camera Analysis!');
                    return;
                }
                console.log('[Camera] Capture Snapshot Clicked');
                this.captureSnapshot();
            });
        }
        // --- Audio controls ---
        if (this.elements.startAudioBtn) {
            this.elements.startAudioBtn.onclick = null;
            this.elements.startAudioBtn.addEventListener('click', () => {
                if (!this.isTabActive('audio')) {
                    this.showError('Fitur audio hanya bisa digunakan di tab Voice Analysis!');
                    return;
                }
                console.log('[Audio] Start Audio Clicked');
                this.startAudioAnalysis();
            });
        }
        if (this.elements.stopAudioBtn) {
            this.elements.stopAudioBtn.onclick = null;
            this.elements.stopAudioBtn.addEventListener('click', () => {
                if (!this.isTabActive('audio')) {
                    this.showError('Fitur audio hanya bisa digunakan di tab Voice Analysis!');
                    return;
                }
                console.log('[Audio] Stop Audio Clicked');
                this.stopAudioAnalysis();
            });
        }
        if (this.elements.recordAudioBtn) {
            this.elements.recordAudioBtn.onclick = null;
            this.elements.recordAudioBtn.addEventListener('click', () => {
                if (!this.isTabActive('audio')) {
                    this.showError('Fitur audio hanya bisa digunakan di tab Voice Analysis!');
                    return;
                }
                console.log('[Audio] Record Audio Clicked');
                this.toggleAudioRecording();
            });
        }
        // --- Text analysis ---
        if (this.elements.analyzeTextBtn) {
            this.elements.analyzeTextBtn.onclick = null;
            this.elements.analyzeTextBtn.addEventListener('click', () => {
                if (!this.isTabActive('text')) {
                    this.showError('Fitur analisis teks hanya bisa digunakan di tab AI Text Analysis!');
                    return;
                }
                console.log('[Text] Analyze Text Clicked');
                this.analyzeText();
            });
        }
        // --- Export, submit, dashboard ---
        if (this.elements.exportBtn) {
            this.elements.exportBtn.onclick = null;
            this.elements.exportBtn.addEventListener('click', () => {
                console.log('[Export] Clicked');
                this.openExportModal();
            });
        }
        if (this.elements.submitDataBtn) {
            this.elements.submitDataBtn.onclick = null;
            this.elements.submitDataBtn.addEventListener('click', () => {
                console.log('[Submit] Data Clicked');
                this.submitCurrentData();
            });
        }
        if (this.elements.viewDashboardBtn) {
            this.elements.viewDashboardBtn.onclick = null;
            this.elements.viewDashboardBtn.addEventListener('click', () => {
                console.log('[Dashboard] View Clicked');
                window.location.href = 'dashboard.html';
            });
        }
        // --- Text input enter key ---
        if (this.elements.textInput) {
            this.elements.textInput.onkeypress = null;
            this.elements.textInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.analyzeText();
                }
            });
        }
    }

    // Helper untuk cek tab aktif
    isTabActive(tabName) {
        const section = document.getElementById(`${tabName}-section`);
        return section && section.classList.contains('active');
    }

    switchTab(tabName) {
        console.log('[Tab] Switching to tab:', tabName);
        let found = false;
        // Update tab buttons
        this.elements.tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabName) found = true;
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        // Update input sections
        this.elements.inputSections.forEach(section => {
            section.classList.toggle('active', section.id === `${tabName}-section`);
        });
        if (!found) {
            this.showError('Tab tidak ditemukan: ' + tabName);
            console.error('Tab not found:', tabName);
        }
        // Stop all analysis and reset UI when switching tabs
        this.stopCurrentAnalysis();
        this.resetTabUI(tabName);
        // Enable/disable tombol sesuai tab aktif
        this.updateTabButtonStates(tabName);
    }

    // Reset UI pada setiap tab saat berpindah
    resetTabUI(tabName) {
        // Camera
        if (tabName !== 'camera') {
            if (this.elements.cameraStatus) this.elements.cameraStatus.textContent = 'Camera not active';
            if (this.elements.cameraEmotion) this.elements.cameraEmotion.textContent = '-';
            if (this.elements.cameraConfidenceMeter) this.elements.cameraConfidenceMeter.style.width = '0%';
            if (this.elements.faceDetected) this.elements.faceDetected.textContent = 'No';
        }
        // Audio
        if (tabName !== 'audio') {
            if (this.elements.audioStatus) this.elements.audioStatus.textContent = 'Audio analysis not active';
            if (this.elements.audioEmotion) this.elements.audioEmotion.textContent = '-';
            if (this.elements.audioConfidenceMeter) this.elements.audioConfidenceMeter.style.width = '0%';
            if (this.elements.voiceQuality) this.elements.voiceQuality.textContent = 'Poor';
            if (this.elements.audioLevelFill) this.elements.audioLevelFill.style.width = '0%';
            if (this.elements.audioLevelText) this.elements.audioLevelText.textContent = '0 dB';
        }
        // Text
        if (tabName !== 'text') {
            if (this.elements.aiAnalysisResults) this.elements.aiAnalysisResults.innerHTML = '';
            if (this.elements.textInput) this.elements.textInput.value = '';
        }
    }

    // Aktifkan tombol hanya di tab yang sesuai
    updateTabButtonStates(tabName) {
        // Kamera
        if (this.elements.startCameraBtn) this.elements.startCameraBtn.disabled = tabName !== 'camera';
        if (this.elements.stopCameraBtn) this.elements.stopCameraBtn.disabled = tabName !== 'camera';
        if (this.elements.captureSnapshotBtn) this.elements.captureSnapshotBtn.disabled = tabName !== 'camera';
        // Audio
        if (this.elements.startAudioBtn) this.elements.startAudioBtn.disabled = tabName !== 'audio';
        if (this.elements.stopAudioBtn) this.elements.stopAudioBtn.disabled = tabName !== 'audio';
        if (this.elements.recordAudioBtn) this.elements.recordAudioBtn.disabled = tabName !== 'audio';
        // Text
        if (this.elements.analyzeTextBtn) this.elements.analyzeTextBtn.disabled = tabName !== 'text';
    }

    /**
     * Start a new analysis session
     */
    startSession() {
        this.currentSession.id = 'session_' + Date.now();
        this.currentSession.startTime = new Date();
        this.currentSession.analysisCount = 0;
        this.currentSession.currentEmotion = 'neutral';
        this.currentSession.emotionSource = null;
        
        // Start session timer
        this.startSessionTimer();
        
        console.log('Analysis session started:', this.currentSession.id);
    }

    /**
     * Start session timer
     */
    startSessionTimer() {
        setInterval(() => {
            if (this.currentSession.startTime) {
                const duration = new Date() - this.currentSession.startTime;
                const hours = Math.floor(duration / 3600000);
                const minutes = Math.floor((duration % 3600000) / 60000);
                const seconds = Math.floor((duration % 60000) / 1000);
                
                const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                if (this.elements.sessionDuration) {
                    this.elements.sessionDuration.textContent = timeString;
                }
            }
        }, 1000);
    }

    /**
     * Camera Analysis Functions
     */
    async startCamera() {
        try {
            this.updateCameraStatus('Starting camera...');
            this.cameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                }
            });
            if (this.elements.cameraVideo) {
                this.elements.cameraVideo.srcObject = this.cameraStream;
                this.elements.cameraVideo.style.transform = 'scaleX(1)';
                await new Promise((resolve, reject) => {
                    this.elements.cameraVideo.onloadedmetadata = () => {
                        this.elements.cameraVideo.play()
                            .then(resolve)
                            .catch(reject);
                    };
                    this.elements.cameraVideo.onerror = (error) => {
                        reject(new Error('Video error: ' + error.message));
                    };
                });
            }
            // Enable/disable tombol dengan benar
            if (this.elements.startCameraBtn) this.elements.startCameraBtn.disabled = true;
            if (this.elements.stopCameraBtn) this.elements.stopCameraBtn.disabled = false;
            if (this.elements.captureSnapshotBtn) this.elements.captureSnapshotBtn.disabled = false;
            this.updateCameraStatus('Camera active - initializing AI...');
            setTimeout(async () => {
                try {
                    await this.initializeFaceApi();
                    if (this.elements.cameraCanvas && this.elements.cameraVideo) {
                        this.elements.cameraCanvas.width = this.elements.cameraVideo.videoWidth || 640;
                        this.elements.cameraCanvas.height = this.elements.cameraVideo.videoHeight || 480;
                    }
                    this.startFaceApiDetection();
                    this.updateCameraStatus('Camera active with AI face detection');
                } catch (error) {
                    console.error('Face detection initialization error:', error);
                    this.startFaceDetection();
                    this.updateCameraStatus('Camera active (simulation mode)');
                }
            }, 1000);
        } catch (error) {
            console.error('Failed to start camera:', error);
            this.updateCameraStatus('Camera failed to start');
            this.showError('Failed to start camera: ' + error.message);
            if (this.elements.startCameraBtn) this.elements.startCameraBtn.disabled = false;
            if (this.elements.stopCameraBtn) this.elements.stopCameraBtn.disabled = true;
            if (this.elements.captureSnapshotBtn) this.elements.captureSnapshotBtn.disabled = true;
        }
    }

    /**
     * Initialize face-api.js directly
     */
    async initializeFaceApi() {
        try {
            console.log('Initializing face-api.js...');
            if (typeof faceapi === 'undefined') {
                throw new Error('face-api.js not loaded');
            }
            
            const modelPath = './models';
            console.log('Loading face-api.js models from:', modelPath);
            
            // Check if we're running on a local file system
            if (window.location.protocol === 'file:') {
                throw new Error('face-api.js requires a web server. Please use a local server like Python http.server or Live Server VSCode.');
            }
            
            // Load models with timeout
            const modelLoadPromises = [
                faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
                faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
                faceapi.nets.faceExpressionNet.loadFromUri(modelPath)
            ];
            
            await Promise.allSettled(modelLoadPromises);
            
            // Check if models loaded successfully
            const modelsLoaded = await Promise.all([
                faceapi.nets.tinyFaceDetector.isLoaded(),
                faceapi.nets.faceLandmark68Net.isLoaded(),
                faceapi.nets.faceExpressionNet.isLoaded()
            ]);
            
            if (modelsLoaded.every(loaded => loaded)) {
                console.log('face-api.js models loaded successfully');
                if (this.elements.cameraCanvas) {
                    this.elements.cameraCanvas.width = 640;
                    this.elements.cameraCanvas.height = 480;
                }
                return true;
            } else {
                throw new Error('Some face-api.js models failed to load');
            }
            
        } catch (error) {
            console.error('Failed to initialize face-api.js:', error);
            if (error.message.includes('Failed to fetch') || window.location.protocol === 'file:') {
                this.showError('Gagal memuat model AI wajah. Silakan buka file ini melalui web server lokal (bukan langsung file://). Contoh: gunakan Python http.server atau Live Server VSCode.');
            } else {
                this.showError('Face detection initialization failed: ' + error.message);
            }
            throw error;
        }
    }

    /**
     * Start face detection using face-api.js directly
     */
    startFaceApiDetection() {
        if (!this.elements.cameraVideo || !this.elements.cameraCanvas) return;
        // Pastikan hanya satu interval berjalan
        if (this.analysisInterval) clearInterval(this.analysisInterval);
        // Sinkronkan ukuran canvas dengan video
        this.elements.cameraCanvas.width = this.elements.cameraVideo.videoWidth || 640;
        this.elements.cameraCanvas.height = this.elements.cameraVideo.videoHeight || 480;
        const detectFaces = async () => {
            if (!this.cameraStream || this.elements.cameraVideo.readyState < 2) return;
            try {
                const detections = await faceapi.detectAllFaces(
                    this.elements.cameraVideo,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
                ).withFaceLandmarks().withFaceExpressions();
                const ctx = this.elements.cameraCanvas.getContext('2d');
                ctx.clearRect(0, 0, this.elements.cameraCanvas.width, this.elements.cameraCanvas.height);
                if (detections.length > 0) {
                    const resizedDetections = faceapi.resizeResults(detections, {
                        width: this.elements.cameraCanvas.width,
                        height: this.elements.cameraCanvas.height
                    });
                    faceapi.draw.drawDetections(this.elements.cameraCanvas, resizedDetections);
                    faceapi.draw.drawFaceLandmarks(this.elements.cameraCanvas, resizedDetections);
                    const face = detections[0];
                    const expressions = face.expressions;
                    const dominantExpression = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b);
                    const emotion = this.mapExpressionToEmotion(dominantExpression[0]);
                    const confidence = dominantExpression[1];
                    this.updateFaceDetectionUI({
                        emotion: emotion,
                        confidence: confidence,
                        expressions: expressions
                    });
                } else {
                    this.updateFaceDetectionUI(null);
                }
            } catch (error) {
                console.error('Face detection error:', error);
                this.updateFaceDetectionUI(null);
            }
        };
        this.analysisInterval = setInterval(detectFaces, 200);
    }

    /**
     * Map face-api.js expressions to our emotion categories
     */
    mapExpressionToEmotion(expression) {
        const emotionMap = {
            'happy': 'happy',
            'sad': 'sad',
            'angry': 'angry',
            'fearful': 'fearful',
            'surprised': 'surprised',
            'disgusted': 'confused',
            'neutral': 'neutral'
        };
        
        return emotionMap[expression] || 'neutral';
    }

    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        
        if (this.elements.cameraVideo) {
            this.elements.cameraVideo.srcObject = null;
        }
        
        // Stop face-api.js detection
        this.stopFaceApiDetection();
        
        // Stop Face API Manager detection (fallback)
        if (this.faceApiManager) {
            this.faceApiManager.stopDetection();
        }
        
        // Stop simulation detection
        this.stopFaceDetection();
        
        // Enable/disable tombol dengan benar
        if (this.elements.startCameraBtn) this.elements.startCameraBtn.disabled = false;
        if (this.elements.stopCameraBtn) this.elements.stopCameraBtn.disabled = true;
        if (this.elements.captureSnapshotBtn) this.elements.captureSnapshotBtn.disabled = true;
        this.updateCameraStatus('Camera stopped');
    }

    /**
     * Stop face-api.js detection
     */
    stopFaceApiDetection() {
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }
        
        // Clear canvas
        if (this.elements.cameraCanvas) {
            const ctx = this.elements.cameraCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.elements.cameraCanvas.width, this.elements.cameraCanvas.height);
        }
    }

    startFaceDetection() {
        if (!this.elements.cameraVideo) return;
        
        const detectFaces = async () => {
            if (!this.cameraStream) return;
            
            try {
                // Always use simulation mode for now
                const emotion = this.simulateFaceDetection();
                this.updateFaceDetectionUI({
                    emotion: emotion.emotion,
                    confidence: emotion.confidence
                });
                
                // Save data
                this.saveEmotionData({
                    dominantEmotion: emotion.emotion,
                    confidence: emotion.confidence,
                    source: 'camera',
                    processingTime: Date.now()
                });
                
                // Update current emotion
                this.updateCurrentEmotion(emotion.emotion, 'camera', emotion.confidence);
                
            } catch (error) {
                console.error('Face detection error:', error);
                // Fallback to simulation on error
                const emotion = this.simulateFaceDetection();
                this.updateFaceDetectionUI({
                    emotion: emotion.emotion,
                    confidence: emotion.confidence
                });
            }
        };
        
        // Run detection loop
        this.analysisInterval = setInterval(detectFaces, 2000); // Slower interval
    }

    simulateFaceDetection() {
        const emotions = ['happy', 'sad', 'angry', 'excited', 'fearful', 'surprised', 'neutral', 'confused'];
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        const confidence = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
        
        return {
            emotion: randomEmotion,
            confidence: confidence
        };
    }

    stopFaceDetection() {
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }
    }

    updateFaceDetectionUI(data) {
        if (!data) {
            if (this.elements.faceDetected) this.elements.faceDetected.textContent = 'No';
            if (this.elements.cameraEmotion) this.elements.cameraEmotion.textContent = '-';
            if (this.elements.cameraConfidenceMeter) this.elements.cameraConfidenceMeter.style.width = '0%';
            // Update confidence text
            const confidenceText = document.querySelector('#cameraConfidenceMeter + .confidence-text');
            if (confidenceText) confidenceText.textContent = '0%';
            return;
        }
        
        if (this.elements.faceDetected) this.elements.faceDetected.textContent = 'Yes';
        if (this.elements.cameraEmotion) this.elements.cameraEmotion.textContent = data.emotion;
        if (this.elements.cameraConfidenceMeter) {
            this.elements.cameraConfidenceMeter.style.width = `${data.confidence * 100}%`;
        }
        
        // Update confidence text
        const confidenceText = document.querySelector('#cameraConfidenceMeter + .confidence-text');
        if (confidenceText) {
            confidenceText.textContent = `${(data.confidence * 100).toFixed(0)}%`;
        }
        
        // Save data
        this.saveEmotionData({
            dominantEmotion: data.emotion,
            confidence: data.confidence,
            source: 'camera',
            processingTime: Date.now()
        });
        
        // Update current emotion
        this.updateCurrentEmotion(data.emotion, 'camera', data.confidence);
    }

    updateCameraStatus(status) {
        if (this.elements.cameraStatus) {
            this.elements.cameraStatus.textContent = status;
        }
    }

    async captureSnapshot() {
        if (!this.elements.cameraCanvas || !this.elements.cameraVideo) return;
        
        const ctx = this.elements.cameraCanvas.getContext('2d');
        ctx.drawImage(this.elements.cameraVideo, 0, 0, 640, 480);
        
        try {
            // Analyze snapshot with face-api.js
            const detections = await faceapi.detectAllFaces(
                this.elements.cameraCanvas, 
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceExpressions();
            
            if (detections.length > 0) {
                // Get the first detected face
                const face = detections[0];
                const expressions = face.expressions;
                
                // Find the dominant expression
                const dominantExpression = Object.entries(expressions)
                    .reduce((a, b) => a[1] > b[1] ? a : b);
                
                const emotion = this.mapExpressionToEmotion(dominantExpression[0]);
                const confidence = dominantExpression[1];
                
                // Update UI
                this.updateFaceDetectionUI({
                    emotion: emotion,
                    confidence: confidence,
                    expressions: expressions
                });
                
                // Save as snapshot
                this.saveEmotionData({
                    dominantEmotion: emotion,
                    confidence: confidence,
                    source: 'camera_snapshot',
                    facialExpressions: expressions,
                    processingTime: Date.now()
                });
                
                this.showNotification('Snapshot captured and analyzed with AI!');
            } else {
                // No face detected in snapshot
                this.showNotification('No face detected in snapshot');
            }
            
        } catch (error) {
            console.error('Snapshot analysis error:', error);
            
            // Fallback to simulation
            const emotion = this.simulateFaceDetection();
            this.updateFaceDetectionUI({
                emotion: emotion.emotion,
                confidence: emotion.confidence,
                expressions: {}
            });
            
            // Save as snapshot
            this.saveEmotionData({
                dominantEmotion: emotion.emotion,
                confidence: emotion.confidence,
                source: 'camera_snapshot',
                processingTime: Date.now()
            });
            
            this.showNotification('Snapshot captured (simulation mode)!');
        }
    }

    /**
     * Audio Analysis Functions
     */
    async startAudioAnalysis() {
        try {
            this.updateAudioStatus('Starting audio analysis...');
            
            // Get audio stream
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Initialize audio context
            this.voiceAnalyzer.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.voiceAnalyzer.analyzer = this.voiceAnalyzer.audioContext.createAnalyser();
            this.voiceAnalyzer.microphone = this.voiceAnalyzer.audioContext.createMediaStreamSource(this.audioStream);
            
            // Connect audio nodes
            this.voiceAnalyzer.microphone.connect(this.voiceAnalyzer.analyzer);
            
            // Configure analyzer
            this.voiceAnalyzer.analyzer.fftSize = 2048;
            this.voiceAnalyzer.analyzer.smoothingTimeConstant = 0.8;
            
            // Update UI
            this.elements.startAudioBtn.disabled = true;
            this.elements.stopAudioBtn.disabled = false;
            this.elements.recordAudioBtn.disabled = false;
            this.updateAudioStatus('Audio analysis active');
            
            // Start analysis
            this.startVoiceAnalysis();
            
        } catch (error) {
            console.error('Failed to start audio analysis:', error);
            this.updateAudioStatus('Audio analysis failed to start');
            this.showError('Failed to start audio analysis: ' + error.message);
        }
    }

    stopAudioAnalysis() {
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }
        
        if (this.voiceAnalyzer.audioContext) {
            this.voiceAnalyzer.audioContext.close();
            this.voiceAnalyzer.audioContext = null;
        }
        
        this.voiceAnalyzer.isAnalyzing = false;
        
        // Update UI
        this.elements.startAudioBtn.disabled = false;
        this.elements.stopAudioBtn.disabled = true;
        this.elements.recordAudioBtn.disabled = true;
        this.updateAudioStatus('Audio analysis stopped');
    }

    startVoiceAnalysis() {
        if (!this.voiceAnalyzer.analyzer) return;
        
        this.voiceAnalyzer.isAnalyzing = true;
        const bufferLength = this.voiceAnalyzer.analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const analyzeVoice = () => {
            if (!this.voiceAnalyzer.isAnalyzing) return;
            
            try {
                // Get frequency data
                this.voiceAnalyzer.analyzer.getByteFrequencyData(dataArray);
                
                // Calculate audio level
                const audioLevel = this.calculateAudioLevel(dataArray);
                this.updateAudioLevelUI(audioLevel);
                
                // Simulate voice emotion analysis
                const emotion = this.simulateVoiceEmotion();
                this.updateVoiceEmotionUI(emotion);
                
                // Update spectrogram
                this.updateSpectrogram(dataArray);
                
                // Save data
                this.saveEmotionData({
                    dominantEmotion: emotion.emotion,
                    confidence: emotion.confidence,
                    source: 'audio',
                    processingTime: Date.now()
                });
                
                // Update current emotion
                this.updateCurrentEmotion(emotion.emotion, 'audio', emotion.confidence);
                
            } catch (error) {
                console.error('Voice analysis error:', error);
            }
        };
        
        // Run analysis loop
        setInterval(analyzeVoice, this.config.audioAnalysisInterval);
    }

    simulateVoiceEmotion() {
        const emotions = ['happy', 'sad', 'angry', 'excited', 'fearful', 'surprised', 'neutral', 'confused'];
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        const confidence = 0.4 + Math.random() * 0.6; // 0.4 to 1.0
        
        return {
            emotion: randomEmotion,
            confidence: confidence
        };
    }

    calculateAudioLevel(dataArray) {
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const average = sum / dataArray.length;
        const db = 20 * Math.log10(average / 255);
        return Math.max(0, (db + 60) / 60); // Normalize to 0-1
    }

    updateAudioLevelUI(level) {
        if (this.elements.audioLevelFill) {
            this.elements.audioLevelFill.style.width = `${level * 100}%`;
        }
        
        if (this.elements.audioLevelText) {
            const db = 20 * Math.log10(level);
            this.elements.audioLevelText.textContent = `${db.toFixed(1)} dB`;
        }
    }

    updateVoiceEmotionUI(emotionData) {
        if (this.elements.audioEmotion) {
            this.elements.audioEmotion.textContent = emotionData.emotion;
        }
        
        if (this.elements.audioConfidenceMeter) {
            this.elements.audioConfidenceMeter.style.width = `${emotionData.confidence * 100}%`;
        }
        
        // Update audio confidence text
        const audioConfidenceText = document.querySelector('#audioConfidenceMeter + .confidence-text');
        if (audioConfidenceText) {
            audioConfidenceText.textContent = `${(emotionData.confidence * 100).toFixed(0)}%`;
        }
        
        // Update voice quality
        if (this.elements.voiceQuality) {
            const quality = emotionData.confidence > 0.7 ? 'Good' : 
                           emotionData.confidence > 0.4 ? 'Fair' : 'Poor';
            this.elements.voiceQuality.textContent = quality;
        }
    }

    updateSpectrogram(dataArray) {
        if (!this.elements.spectrogramCanvas) return;
        
        const canvas = this.elements.spectrogramCanvas;
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

    updateAudioStatus(status) {
        if (this.elements.audioStatus) {
            this.elements.audioStatus.textContent = status;
        }
    }

    toggleAudioRecording() {
        if (this.audioRecorder.isRecording) {
            this.stopAudioRecording();
        } else {
            this.startAudioRecording();
        }
    }

    startAudioRecording() {
        if (!this.audioStream) return;
        
        this.audioRecorder.audioChunks = [];
        this.audioRecorder.mediaRecorder = new MediaRecorder(this.audioStream);
        
        this.audioRecorder.mediaRecorder.ondataavailable = (event) => {
            this.audioRecorder.audioChunks.push(event.data);
        };
        
        this.audioRecorder.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this.audioRecorder.audioChunks, { type: 'audio/wav' });
            this.saveAudioRecording(audioBlob);
        };
        
        this.audioRecorder.mediaRecorder.start();
        this.audioRecorder.isRecording = true;
        
        this.elements.recordAudioBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
        this.showNotification('Audio recording started');
    }

    stopAudioRecording() {
        if (this.audioRecorder.mediaRecorder) {
            this.audioRecorder.mediaRecorder.stop();
            this.audioRecorder.isRecording = false;
        }
        
        this.elements.recordAudioBtn.innerHTML = '<i class="fas fa-record-vinyl"></i> Record Audio';
        this.showNotification('Audio recording stopped');
    }

    saveAudioRecording(audioBlob) {
        // Create download link
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emotion_recording_${Date.now()}.wav`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Text Analysis Functions
     */
    async analyzeText() {
        const text = this.elements.textInput?.value.trim();
        if (!text) {
            this.showError('Please enter some text to analyze');
            return;
        }
        
        try {
            this.elements.analyzeTextBtn.disabled = true;
            this.elements.analyzeTextBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
            
            // Analyze text sentiment
            const emotion = await this.analyzeTextSentiment(text);
            
            // Update UI
            this.updateTextAnalysisUI(emotion, text);
            
            // Save data
            this.saveEmotionData({
                dominantEmotion: emotion.emotion,
                confidence: emotion.confidence,
                source: 'text',
                textAnalysis: {
                    text: text,
                    sentiment: emotion.sentiment,
                    keywords: emotion.keywords
                },
                processingTime: Date.now()
            });
            
            // Update current emotion
            this.updateCurrentEmotion(emotion.emotion, 'text', emotion.confidence);
            
            // Clear input
            this.elements.textInput.value = '';
            
        } catch (error) {
            console.error('Text analysis error:', error);
            this.showError('Failed to analyze text: ' + error.message);
        } finally {
            this.elements.analyzeTextBtn.disabled = false;
            this.elements.analyzeTextBtn.innerHTML = '<i class="fas fa-brain"></i> Analyze with AI';
        }
    }

    async analyzeTextSentiment(text) {
        // Enhanced sentiment analysis
        const positiveWords = [
            'happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'love', 'good', 'positive',
            'fantastic', 'excellent', 'brilliant', 'awesome', 'perfect', 'beautiful', 'delighted',
            'pleased', 'satisfied', 'content', 'cheerful', 'optimistic', 'enthusiastic'
        ];
        
        const negativeWords = [
            'sad', 'angry', 'fear', 'hate', 'terrible', 'awful', 'bad', 'negative', 'depressed',
            'upset', 'frustrated', 'disappointed', 'worried', 'anxious', 'scared', 'horrible',
            'dreadful', 'miserable', 'lonely', 'hopeless', 'desperate', 'furious'
        ];
        
        const excitedWords = [
            'excited', 'thrilled', 'ecstatic', 'elated', 'overjoyed', 'euphoric', 'energetic',
            'passionate', 'enthusiastic', 'motivated', 'inspired', 'pumped', 'fired up'
        ];
        
        const fearfulWords = [
            'afraid', 'scared', 'terrified', 'frightened', 'panicked', 'anxious', 'worried',
            'nervous', 'tense', 'stressed', 'overwhelmed', 'intimidated', 'threatened'
        ];
        
        const words = text.toLowerCase().split(/\s+/);
        let positiveScore = 0;
        let negativeScore = 0;
        let excitedScore = 0;
        let fearfulScore = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveScore++;
            if (negativeWords.includes(word)) negativeScore++;
            if (excitedWords.includes(word)) excitedScore++;
            if (fearfulWords.includes(word)) fearfulScore++;
        });
        
        // Calculate emotion scores
        const total = positiveScore + negativeScore + excitedScore + fearfulScore;
        
        if (total === 0) {
            return {
                emotion: 'neutral',
                confidence: 0.5,
                sentiment: 'neutral',
                keywords: []
            };
        }
        
        const scores = {
            happy: positiveScore / total,
            sad: negativeScore / total,
            excited: excitedScore / total,
            fearful: fearfulScore / total
        };
        
        // Find dominant emotion
        const dominantEmotion = Object.entries(scores)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        const confidence = scores[dominantEmotion];
        
        // Determine sentiment
        let sentiment = 'neutral';
        if (dominantEmotion === 'happy' || dominantEmotion === 'excited') {
            sentiment = 'positive';
        } else if (dominantEmotion === 'sad' || dominantEmotion === 'fearful') {
            sentiment = 'negative';
        }
        
        // Extract keywords
        const keywords = words.filter(word => 
            positiveWords.includes(word) || 
            negativeWords.includes(word) || 
            excitedWords.includes(word) || 
            fearfulWords.includes(word)
        );
        
        return {
            emotion: dominantEmotion,
            confidence: confidence,
            sentiment: sentiment,
            keywords: [...new Set(keywords)]
        };
    }

    updateTextAnalysisUI(emotionData, text) {
        if (!this.elements.aiAnalysisResults) return;
        
        const resultHTML = `
            <div class="analysis-result">
                <h4>AI Analysis Results</h4>
                <div class="result-item">
                    <span class="label">Detected Emotion:</span>
                    <span class="value emotion-${emotionData.emotion}">${emotionData.emotion}</span>
                </div>
                <div class="result-item">
                    <span class="label">Confidence:</span>
                    <span class="value">${(emotionData.confidence * 100).toFixed(1)}%</span>
                </div>
                <div class="result-item">
                    <span class="label">Sentiment:</span>
                    <span class="value sentiment-${emotionData.sentiment}">${emotionData.sentiment}</span>
                </div>
                ${emotionData.keywords.length > 0 ? `
                    <div class="result-item">
                        <span class="label">Keywords:</span>
                        <span class="value">${emotionData.keywords.join(', ')}</span>
                    </div>
                ` : ''}
                <div class="result-item">
                    <span class="label">Analyzed Text:</span>
                    <span class="value text-preview">"${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"</span>
                </div>
            </div>
        `;
        
        this.elements.aiAnalysisResults.innerHTML = resultHTML;
    }

    /**
     * Data Management Functions
     */
    async saveEmotionData(data) {
        try {
            // Add session info
            data.sessionId = this.currentSession.id;
            data.timestamp = new Date().toISOString();
            
            // Save to localStorage
            await this.dataStorage.saveEmotionData(data);
            
            // Update session stats
            this.currentSession.analysisCount++;
            this.updateSessionStats();
            
            // Add to history
            this.addToHistory(data);
            
            console.log('Emotion data saved successfully:', data);
            
        } catch (error) {
            console.error('Failed to save emotion data:', error);
            this.showError('Failed to save data: ' + error.message);
        }
    }

    updateSessionStats() {
        if (this.elements.analysisCount) {
            this.elements.analysisCount.textContent = this.currentSession.analysisCount;
        }
        
        if (this.elements.storageStatus) {
            this.elements.storageStatus.textContent = 'Data saved';
        }
    }

    addToHistory(data) {
        if (!this.elements.emotionHistory) return;
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const time = new Date(data.timestamp).toLocaleTimeString();
        const sourceIcon = this.getSourceIcon(data.source);
        
        historyItem.innerHTML = `
            <div class="history-icon">
                <i class="${sourceIcon}"></i>
            </div>
            <div class="history-content">
                <div class="history-emotion emotion-${data.dominantEmotion}">
                    ${data.dominantEmotion}
                </div>
                <div class="history-details">
                    <span class="history-time">${time}</span>
                    <span class="history-source">${data.source}</span>
                    <span class="history-confidence">${(data.confidence * 100).toFixed(0)}%</span>
                </div>
            </div>
        `;
        
        // Add to beginning of history
        this.elements.emotionHistory.insertBefore(historyItem, this.elements.emotionHistory.firstChild);
        
        // Limit history items
        const items = this.elements.emotionHistory.querySelectorAll('.history-item');
        if (items.length > this.config.maxHistoryItems) {
            items[items.length - 1].remove();
        }
    }

    getSourceIcon(source) {
        const icons = {
            camera: 'fas fa-camera',
            audio: 'fas fa-microphone',
            text: 'fas fa-keyboard',
            camera_snapshot: 'fas fa-camera-retro'
        };
        return icons[source] || 'fas fa-question';
    }

    /**
     * Current Emotion Display
     */
    updateCurrentEmotion(emotion, source, confidence) {
        this.currentSession.currentEmotion = emotion;
        this.currentSession.emotionSource = source;
        
        if (this.elements.currentEmotion) {
            this.elements.currentEmotion.textContent = emotion;
            this.elements.currentEmotion.className = `emotion-display ${emotion}`;
        }
        
        if (this.elements.emotionSource) {
            const sourceText = {
                camera: 'Camera Analysis',
                audio: 'Voice Analysis',
                text: 'AI Text Analysis',
                camera_snapshot: 'Camera Snapshot',
                manual_submission: 'Manual Submission'
            };
            this.elements.emotionSource.textContent = sourceText[source] || source;
        }
        
        // Enable/disable submit button based on emotion
        if (this.elements.submitDataBtn) {
            const hasValidEmotion = emotion && emotion !== 'neutral';
            this.elements.submitDataBtn.disabled = !hasValidEmotion;
        }
    }

    /**
     * Export Functions
     */
    openExportModal() {
        if (this.elements.exportModal) {
            this.elements.exportModal.style.display = 'block';
        }
    }

    closeExportModal() {
        if (this.elements.exportModal) {
            this.elements.exportModal.style.display = 'none';
        }
    }

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
            
            let exportData;
            
            // Try to use dataStorage export method first
            if (this.dataStorage && typeof this.dataStorage.exportData === 'function') {
                exportData = await this.dataStorage.exportData(format, filters);
            } else {
                // Fallback to simple export
                exportData = await this.exportFromLocalStorage(format, filters);
            }
            
            // Download file
            const url = URL.createObjectURL(exportData.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = exportData.filename;
            a.click();
            
            URL.revokeObjectURL(url);
            this.closeExportModal();
            this.showNotification('Data exported successfully!');
            
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Failed to export data: ' + error.message);
        }
    }

    /**
     * UI Update Functions
     */
    updateUI() {
        // Update initial state
        this.updateSessionStats();
        
        // Set initial emotion
        this.updateCurrentEmotion('neutral', null, 0);
        
        // Update storage status
        if (this.elements.storageStatus) {
            this.elements.storageStatus.textContent = 'Ready';
        }
    }

    /**
     * Utility Functions
     */
    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Simple localStorage methods
     */
    saveToLocalStorage(data) {
        try {
            const existingData = this.getFromLocalStorage();
            const newData = {
                id: this.generateId(),
                ...data,
                createdAt: new Date().toISOString()
            };
            
            existingData.push(newData);
            localStorage.setItem('aiEmotionData', JSON.stringify(existingData));
            
            console.log('Data saved to localStorage:', newData);
            return newData;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            throw error;
        }
    }

    getFromLocalStorage() {
        try {
            const data = localStorage.getItem('aiEmotionData');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }

    async exportFromLocalStorage(format, filters = {}) {
        try {
            let data = this.getFromLocalStorage();
            
            // Apply filters
            if (filters.startDate) {
                data = data.filter(item => new Date(item.timestamp) >= new Date(filters.startDate));
            }
            if (filters.endDate) {
                data = data.filter(item => new Date(item.timestamp) <= new Date(filters.endDate));
            }
            if (filters.emotion) {
                data = data.filter(item => item.dominantEmotion === filters.emotion);
            }
            if (filters.source) {
                data = data.filter(item => item.source === filters.source);
            }
            
            if (format === 'json') {
                return this.exportAsJSON(data);
            } else if (format === 'csv') {
                return this.exportAsCSV(data);
            }
        } catch (error) {
            console.error('Error exporting from localStorage:', error);
            throw error;
        }
    }

    exportAsJSON(data) {
        const exportData = {
            exportInfo: {
                timestamp: new Date().toISOString(),
                totalRecords: data.length,
                format: 'json',
                version: '1.0'
            },
            data: data
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        return {
            blob: blob,
            filename: `ai_emotion_analysis_${new Date().toISOString().slice(0, 10)}.json`
        };
    }

    exportAsCSV(data) {
        if (data.length === 0) {
            throw new Error('No data to export');
        }

        const headers = [
            'ID',
            'Timestamp',
            'Dominant Emotion',
            'Confidence',
            'Source',
            'Session ID'
        ];

        const csvRows = [headers.join(',')];

        data.forEach(record => {
            const row = [
                record.id,
                record.timestamp,
                record.dominantEmotion,
                record.confidence,
                record.source,
                record.sessionId || ''
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });

        return {
            blob: blob,
            filename: `ai_emotion_analysis_${new Date().toISOString().slice(0, 10)}.csv`
        };
    }

    generateId() {
        return 'emotion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Face detection callbacks
     */
    onFaceDetected(faceData) {
        console.log('Face detected:', faceData);
        
        // Update UI with detected emotion
        this.updateFaceDetectionUI({
            emotion: faceData.emotion,
            confidence: faceData.confidence,
            expressions: faceData.expressions
        });
        
        // Save data
        this.saveEmotionData({
            dominantEmotion: faceData.emotion,
            confidence: faceData.confidence,
            source: 'camera',
            facialExpressions: faceData.expressions,
            processingTime: Date.now()
        });
        
        // Update current emotion
        this.updateCurrentEmotion(faceData.emotion, 'camera', faceData.confidence);
    }

    onNoFaceDetected() {
        console.log('No face detected');
        this.updateFaceDetectionUI(null);
    }

    /**
     * Submit current emotion data to storage
     */
    async submitCurrentData() {
        try {
            if (!this.currentSession.currentEmotion || this.currentSession.currentEmotion === 'neutral') {
                this.showError('No emotion data to submit');
                return;
            }
            const submissionData = {
                dominantEmotion: this.currentSession.currentEmotion,
                confidence: 0.8,
                source: this.currentSession.emotionSource || 'manual_submission',
                sessionId: this.currentSession.id,
                timestamp: new Date().toISOString(),
                notes: 'Manually submitted emotion data',
                tags: ['submitted', 'manual'],
                processingTime: Date.now()
            };
            // Save to dataStorage
            const result = await this.dataStorage.saveEmotionData(submissionData);
            
            // Check storage mode and show appropriate message
            let storageMode = 'local';
            if (this.dataStorage && this.dataStorage.hybridStorage && this.dataStorage.hybridStorage.storageMode) {
                storageMode = this.dataStorage.hybridStorage.storageMode;
            } else if (this.dataStorage && this.dataStorage.storageMode) {
                storageMode = this.dataStorage.storageMode;
            }
            
            if (storageMode === 'database') {
                // Check if we're online for database mode
                const isOnline = navigator.onLine;
                if (!isOnline) {
                    this.showNotification('Data disimpan ke antrian offline. Akan otomatis di-sync ke database saat online.');
                } else {
                    this.showNotification('Data berhasil disimpan ke database!');
                }
            } else {
                this.showNotification('Data berhasil disimpan secara permanen! Data tidak akan hilang walaupun server mati atau browser ditutup.');
            }
            
            this.elements.submitDataBtn.disabled = true;
            setTimeout(() => {
                this.updateCurrentEmotion('neutral', null, 0);
                this.elements.submitDataBtn.disabled = true;
            }, 2000);
            console.log('Data submitted:', submissionData);
        } catch (error) {
            console.error('Failed to submit data:', error);
            this.showError('Failed to submit data: ' + error.message);
        }
    }

    updateStorageModeStatus() {
        try {
            let mode = 'local';
            if (this.dataStorage && this.dataStorage.hybridStorage && this.dataStorage.hybridStorage.storageMode) {
                mode = this.dataStorage.hybridStorage.storageMode;
            } else if (this.dataStorage && this.dataStorage.storageMode) {
                mode = this.dataStorage.storageMode;
            }
            const modeText = mode === 'database' ? 'Database (MySQL)' : 'Lokal (Browser)';
            const el = document.getElementById('storageModeStatus');
            if (el) el.textContent = modeText;
        } catch (e) {
            console.warn('Error updating storage mode status:', e);
            // fallback
            const el = document.getElementById('storageModeStatus');
            if (el) el.textContent = 'Lokal (Browser)';
        }
    }

    setupStorageModeSelector() {
        const select = document.getElementById('storageModeSelect');
        if (!select) return;
        
        // Set initial value based on available storage
        let currentMode = 'local';
        if (this.dataStorage && this.dataStorage.hybridStorage && this.dataStorage.hybridStorage.storageMode) {
            currentMode = this.dataStorage.hybridStorage.storageMode;
        } else if (this.dataStorage && this.dataStorage.storageMode) {
            currentMode = this.dataStorage.storageMode;
        }
        
        select.value = currentMode;
        
        select.addEventListener('change', async (e) => {
            const mode = e.target.value;
            try {
                if (this.dataStorage && this.dataStorage.hybridStorage && this.dataStorage.hybridStorage.setStorageMode) {
                    await this.dataStorage.hybridStorage.setStorageMode(mode);
                } else if (this.dataStorage && this.dataStorage.setStorageMode) {
                    await this.dataStorage.setStorageMode(mode);
                } else {
                    // Fallback: just update the mode in localStorage
                    localStorage.setItem('teamPulseStorageMode', mode);
                }
                
                this.updateStorageModeStatus();
                this.showNotification('Mode penyimpanan diubah ke: ' + (mode === 'database' ? 'Database (MySQL)' : 'Lokal (Browser)'));
            } catch (error) {
                console.error('Error setting storage mode:', error);
                this.showError('Gagal mengubah mode penyimpanan: ' + error.message);
            }
        });
    }

    // Stop all analysis and reset UI when switching tabs
    stopCurrentAnalysis() {
        // Stop camera analysis
        if (this.cameraStream) {
            this.stopCamera();
        }
        
        // Stop audio analysis
        if (this.audioStream) {
            this.stopAudioAnalysis();
        }
        
        // Stop face detection intervals
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }
        
        // Stop voice analysis
        if (this.voiceAnalyzer && this.voiceAnalyzer.isAnalyzing) {
            this.voiceAnalyzer.isAnalyzing = false;
        }
        
        console.log('All analysis stopped');
    }

    /**
     * Check if all required dependencies are available
     */
    checkDependencies() {
        const required = {
            'TensorFlow.js': typeof tf !== 'undefined',
            'face-api.js': typeof faceapi !== 'undefined',
            'Meyda': typeof Meyda !== 'undefined',
            'DataStorage': typeof DataStorage !== 'undefined',
            'HybridStorage': typeof HybridStorage !== 'undefined'
        };
        
        const missing = Object.entries(required)
            .filter(([name, available]) => !available)
            .map(([name]) => name);
        
        if (missing.length > 0) {
            console.warn('Missing dependencies:', missing);
            this.showNotification(`Some features may not work: ${missing.join(', ')}`, 'warning');
        }
        
        return missing.length === 0;
    }
}

// Simple Data Storage for client-side
class SimpleDataStorage {
    constructor() {
        this.storageKey = 'aiEmotionData';
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('Initializing Simple Data Storage...');
            this.isInitialized = true;
            console.log('Simple Data Storage initialized successfully');
        } catch (error) {
            console.error('Error initializing Simple Data Storage:', error);
            throw error;
        }
    }

    async saveEmotionData(data) {
        try {
            if (!this.isInitialized) {
                throw new Error('DataStorage not initialized');
            }

            // Get existing data
            const existingData = this.getStoredData();
            
            // Add new data
            const newData = {
                id: this.generateId(),
                ...data,
                createdAt: new Date().toISOString()
            };
            
            existingData.push(newData);
            
            // Save back to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(existingData));
            
            console.log('Data saved to localStorage:', newData);
            return newData;
            
        } catch (error) {
            console.error('Error saving data:', error);
            throw error;
        }
    }

    getStoredData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }

    async getEmotionData(options = {}) {
        try {
            let data = this.getStoredData();
            
            // Apply filters
            if (options.startDate) {
                data = data.filter(item => new Date(item.timestamp) >= new Date(options.startDate));
            }
            if (options.endDate) {
                data = data.filter(item => new Date(item.timestamp) <= new Date(options.endDate));
            }
            if (options.emotion) {
                data = data.filter(item => item.dominantEmotion === options.emotion);
            }
            if (options.source) {
                data = data.filter(item => item.source === options.source);
            }
            
            // Sort by timestamp (newest first)
            data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            return data;
        } catch (error) {
            console.error('Error getting emotion data:', error);
            return [];
        }
    }

    async exportData(format = 'json', filters = {}) {
        try {
            const data = await this.getEmotionData(filters);
            
            if (format === 'json') {
                return this.exportAsJSON(data);
            } else if (format === 'csv') {
                return this.exportAsCSV(data);
            } else {
                throw new Error(`Unsupported export format: ${format}`);
            }
            
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    exportAsJSON(data) {
        const exportData = {
            exportInfo: {
                timestamp: new Date().toISOString(),
                totalRecords: data.length,
                format: 'json',
                version: '1.0'
            },
            data: data
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        return {
            blob: blob,
            filename: `ai_emotion_analysis_${new Date().toISOString().slice(0, 10)}.json`
        };
    }

    exportAsCSV(data) {
        if (data.length === 0) {
            throw new Error('No data to export');
        }

        // Define CSV headers
        const headers = [
            'ID',
            'Timestamp',
            'Dominant Emotion',
            'Confidence',
            'Source',
            'Session ID',
            'Created At'
        ];

        // Create CSV content
        const csvRows = [headers.join(',')];

        data.forEach(record => {
            const row = [
                record.id,
                record.timestamp,
                record.dominantEmotion,
                record.confidence,
                record.source,
                record.sessionId || '',
                record.createdAt
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });

        return {
            blob: blob,
            filename: `ai_emotion_analysis_${new Date().toISOString().slice(0, 10)}.csv`
        };
    }

    generateId() {
        return 'emotion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Global functions for HTML integration
function closeExportModal() {
    if (window.emotionController) {
        window.emotionController.closeExportModal();
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
        console.log('Initializing Emotion Input System...');
        
        // Initialize controller directly
        window.emotionController = new EmotionInputController();
        await window.emotionController.init();
        console.log('EmotionInputController initialized and ready.');
        
    } catch (error) {
        console.error('Failed to initialize emotion input system:', error);
        alert('Initialization error: ' + error.message);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmotionInputController;
}