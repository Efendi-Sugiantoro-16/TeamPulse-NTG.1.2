// Check if we're in a browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Function to initialize the application
    const initializeApp = async () => {
        console.log('Menginisialisasi aplikasi...');
        
        try {
            // Pastikan EmotionAnalyzer tersedia
            if (typeof EmotionAnalyzer === 'undefined') {
                throw new Error('EmotionAnalyzer tidak ditemukan. Pastikan emotionAnalyzer.js dimuat dengan benar.');
            }
            
            // Buat instance EmotionAnalyzer
            const emotionAnalyzer = new EmotionAnalyzer();
            
            // Muat model yang diperlukan
            console.log('Memuat model EmotionAnalyzer...');
            const modelsLoaded = await emotionAnalyzer.loadModels();
            
            if (!modelsLoaded) {
                throw new Error('Gagal memuat model EmotionAnalyzer');
            }
            
            console.log('Menginisialisasi EmotionInput...');
            // Inisialisasi EmotionInput dengan EmotionAnalyzer yang sudah dimuat
            window.emotionInput = new EmotionInput(emotionAnalyzer);
            
            // Inisialisasi HistoryManager jika tersedia
            if (window.HistoryManager && !window.historyManager) {
                window.historyManager = new window.HistoryManager();
            }
            
        } catch (error) {
            console.error('Kesalahan saat menginisialisasi aplikasi:', error);
            // Tampilkan pesan error ke pengguna
            const statusElement = document.getElementById('videoStatus');
            if (statusElement) {
                statusElement.textContent = `Error: ${error.message}`;
                statusElement.style.color = 'red';
            }
        }
    };

    // Fungsi untuk memeriksa kesiapan face-api.js
    const checkFaceApiReady = () => {
        if (typeof faceapi !== 'undefined' && 
            faceapi.nets && 
            faceapi.nets.tinyFaceDetector) {
            console.log('face-api.js siap digunakan');
            return true;
        }
        return false;
    };

    // Tunggu hingga DOM sepenuhnya dimuat
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('DOM selesai dimuat, memeriksa kesiapan face-api.js...');
        
        // Coba langsung inisialisasi jika face-api.js sudah siap
        if (checkFaceApiReady()) {
            window.faceApiReady = true;
            await initializeApp();
        } else {
            // Jika belum siap, atur event listener untuk inisialisasi nanti
            window.onFaceApiReady = initializeApp;
            
            // Beri timeout untuk menampilkan pesan jika loading terlalu lama
            setTimeout(() => {
                if (!window.faceApiReady) {
                    console.warn('Menunggu inisialisasi face-api.js...');
                    const statusElement = document.getElementById('videoStatus');
                    if (statusElement) {
                        statusElement.textContent = 'Memuat model deteksi wajah, harap tunggu...';
                    }
                }
            }, 2000);
        }
    });

    class EmotionInput {
        constructor(emotionAnalyzer) {
            if (!emotionAnalyzer) {
                throw new Error('EmotionAnalyzer instance diperlukan');
            }
            
            this.videoStream = null;
            this.audioStream = null;
            this.mediaRecorder = null;
            this.audioChunks = [];
            this.emotionAnalyzer = emotionAnalyzer;
            this.dataStorage = new window.DataStorage();
            this.isAnalyzing = false;
            this.analysisInterval = null;
            this.audioContext = null;
            this.analyser = null;
            this.microphone = null;
            this.audioAnalyzer = new AudioEmotionAnalyzer();
            this.audioAnalysisInterval = null;
            
            try {
                this.initializeElements();
                this.setupEventListeners();
                this.setupTabNavigation();
                this.initializeAudioContext();
                this.initializeVisualizer();
                this.initializeEmotionDisplay();
                this.showResultsSection(); // Tampilkan section hasil analisis
                console.log('EmotionInput initialized successfully');
            } catch (error) {
                console.error('Error initializing EmotionInput:', error);
                // Show error message to user
                const errorMessage = document.getElementById('errorMessage');
                const errorText = document.getElementById('errorText');
                if (errorMessage && errorText) {
                    errorText.textContent = `Initialization error: ${error.message}`;
                    errorMessage.style.display = 'block';
                }
            }
        }

        async loadModels() {
            try {
                if (this.cameraStatus) {
                    this.cameraStatus.textContent = "Loading face detection models...";
                }
                const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

                this.isModelLoaded = true;
                if (this.cameraStatus) {
                    this.cameraStatus.textContent = "Face detection ready";
                }
                if (this.startCameraButton) {
                    this.startCameraButton.disabled = false;
                }
                console.log("All models loaded successfully");
            } catch (error) {
                console.error('Error loading models:', error);
                if (this.cameraStatus) {
                    this.cameraStatus.textContent = "Error loading models. Please check console and refresh the page.";
                }
                this.isModelLoaded = false;
                if (this.startCameraButton) {
                    this.startCameraButton.disabled = true;
                }
            }
        }

        initializeElements() {
            try {
                // Video elements - Updated to match HTML IDs
                this.videoElement = document.getElementById('video');
                this.canvasElement = document.getElementById('canvas');
                if (!(this.canvasElement instanceof HTMLCanvasElement)) {
                    const errorMsg = 'Element with id="canvas" is not a <canvas>!';
                    console.error(errorMsg);
                    const errorText = document.getElementById('errorText');
                    if (errorText) errorText.textContent = errorMsg;
                    const errorMessage = document.getElementById('errorMessage');
                    if (errorMessage) errorMessage.style.display = 'block';
                    this.canvasElement = null;
                    return;
                }
                // Cek duplikasi id di DOM
                if (document.querySelectorAll('#canvas').length > 1) {
                    const warnMsg = 'WARNING: More than one element with id="canvas" found in DOM!';
                    console.warn(warnMsg);
                    const errorText = document.getElementById('errorText');
                    if (errorText) errorText.textContent = warnMsg;
                    const errorMessage = document.getElementById('errorMessage');
                    if (errorMessage) errorMessage.style.display = 'block';
                    this.canvasElement = null;
                    return;
                }
                this.detectionOverlay = document.getElementById('detectionOverlay');
                this.detectionBox = document.getElementById('detectionBox');
                this.startCameraButton = document.getElementById('startCamera');
                this.captureEmotionButton = document.getElementById('captureEmotion');
                this.stopCameraButton = document.getElementById('stopCamera');
                this.cameraStatus = document.getElementById('cameraStatus');
                
                // Audio elements - Updated to match HTML IDs
                this.audioVisualizer = document.getElementById('audioVisualizer');
                this.audioCanvas = document.getElementById('audioCanvas');
                this.startRecordingButton = document.getElementById('startRecording');
                this.stopRecordingButton = document.getElementById('stopRecording');
                this.playRecordingButton = document.getElementById('playRecording');
                this.recordingStatus = document.getElementById('recordingStatus');
                
                // Text elements - Updated to match HTML IDs
                this.emotionText = document.getElementById('emotionText');
                this.analyzeTextButton = document.getElementById('analyzeText');
                this.clearTextButton = document.getElementById('clearText');
                
                // Results section elements
                this.resultsSection = document.getElementById('resultsSection');
                this.primaryEmotion = document.getElementById('primaryEmotion');
                this.confidenceBar = document.getElementById('confidenceBar');
                this.confidenceText = document.getElementById('confidenceText');
                this.moodScore = document.getElementById('moodScore');
                this.stressIndicator = document.getElementById('stressIndicator');
                this.emotionBars = document.getElementById('emotionBars');
                this.closeResultsButton = document.getElementById('closeResults');
                this.saveEmotionButton = document.getElementById('saveEmotion');
                this.newAnalysisButton = document.getElementById('newAnalysis');
                this.shareResultsButton = document.getElementById('shareResults');
                
                // Tab elements
                this.tabButtons = document.querySelectorAll('.tab-btn');
                this.inputSections = document.querySelectorAll('.input-section');
                
                // Log missing elements for debugging
                const requiredElements = {
                    'video': this.videoElement,
                    'canvas': this.canvasElement,
                    'audioCanvas': this.audioCanvas,
                    'startCamera': this.startCameraButton,
                    'cameraStatus': this.cameraStatus,
                    'resultsSection': this.resultsSection
                };
                
                const missingElements = Object.entries(requiredElements)
                    .filter(([name, element]) => !element)
                    .map(([name]) => name);
                
                if (missingElements.length > 0) {
                    console.warn('Missing required elements:', missingElements);
                } else {
                    console.log('All required elements found successfully');
                }
                
                // Tampilkan canvas hanya saat dibutuhkan (misal: saat snapshot atau overlay deteksi)
                if (this.canvasElement) this.canvasElement.style.display = 'none';
                
            } catch (error) {
                console.error('Error initializing elements:', error);
                throw error;
            }
        }

        // Method to update status message
        updateStatus(message, type = 'info') {
            // Update camera status
            if (this.cameraStatus) {
                this.cameraStatus.textContent = message;
                this.cameraStatus.className = 'status-message';
                if (type === 'error') {
                    this.cameraStatus.style.color = '#e74c3c';
                } else if (type === 'success') {
                    this.cameraStatus.style.color = '#2ecc71';
                } else {
                    this.cameraStatus.style.color = '#3498db';
                }
            }
            
            // Update recording status
            if (this.recordingStatus) {
                this.recordingStatus.textContent = message;
                this.recordingStatus.className = 'recording-status';
                if (type === 'error') {
                    this.recordingStatus.style.color = '#e74c3c';
                } else if (type === 'success') {
                    this.recordingStatus.style.color = '#2ecc71';
                } else {
                    this.recordingStatus.style.color = '#3498db';
                }
            }
        }

        // Setup tab navigation
        setupTabNavigation() {
            const tabButtons = document.querySelectorAll('.tab-btn');
            const inputSections = document.querySelectorAll('.input-section');

            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Remove active class from all buttons and sections
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    inputSections.forEach(section => section.classList.remove('active'));

                    // Add active class to clicked button
                    button.classList.add('active');

                    // Show corresponding input section
                    const tabId = button.getAttribute('data-tab');
                    const activeSection = document.getElementById(`${tabId}-section`);
                    if (activeSection) {
                        activeSection.classList.add('active');
                    }
                });
            });
        }

        // Initialize audio context
        initializeAudioContext() {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 2048;
                
                // Inisialisasi audio analyzer
                this.audioAnalyzer = new AudioEmotionAnalyzer();
                
                return true;
            } catch (error) {
                console.error('Error initializing audio context:', error);
                this.updateStatus('Error initializing audio: ' + error.message, 'error');
                return false;
            }
        }

        // Start audio analysis
        async startAudioAnalysis() {
            try {
                // Minta izin akses mikrofon
                this.audioStream = await navigator.mediaDevices.getUserMedia({ 
                    audio: true, 
                    video: false 
                });
                
                // Mulai analisis audio
                const audioStarted = await this.audioAnalyzer.startAnalysis(this.audioStream);
                
                if (audioStarted) {
                    // Update UI
                    this.updateStatus('Menganalisis suara...');
                    
                    // Mulai interval untuk analisis emosi dari audio
                    this.audioAnalysisInterval = setInterval(() => {
                        const result = this.audioAnalyzer.analyzeEmotion();
                        this.updateAudioEmotionResults(result);
                    }, 500); // Analisis setiap 500ms
                    
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Error starting audio analysis:', error);
                this.updateStatus('Gagal mengakses mikrofon: ' + error.message, 'error');
                return false;
            }
        }
        
        // Stop audio analysis
        stopAudioAnalysis() {
            if (this.audioAnalysisInterval) {
                clearInterval(this.audioAnalysisInterval);
                this.audioAnalysisInterval = null;
            }
            
            if (this.audioAnalyzer) {
                this.audioAnalyzer.stopAnalysis();
            }
            
            if (this.audioStream) {
                this.audioStream.getTracks().forEach(track => track.stop());
                this.audioStream = null;
            }
            
            this.updateStatus('Analisis suara dihentikan');
        }

        // Update emotion results from audio analysis
        updateAudioEmotionResults(audioResult) {
            if (!audioResult) return;
            
            // Map audio emotion to face-api.js emotion format
            const emotionMap = {
                'anger': 'angry',
                'excitement': 'happy',
                'fearful': 'fearful',
                'sadness': 'sad',
                'surprise': 'surprised',
                'neutral': 'neutral'
            };
            
            const emotion = emotionMap[audioResult.emotion] || 'neutral';
            const confidence = audioResult.confidence || 0;
            
            // Update UI
            const element = document.getElementById(`${emotion}Result`);
            if (element) {
                const scoreElement = element.querySelector('.score');
                const progressBar = element.querySelector('.progress-bar');
                
                if (scoreElement && progressBar) {
                    const percentage = Math.round(confidence * 100);
                    scoreElement.textContent = `${percentage}%`;
                    progressBar.style.width = `${percentage}%`;
                    
                    // Update color based on intensity
                    if (percentage > 70) {
                        progressBar.style.backgroundColor = getComputedStyle(document.documentElement)
                            .getPropertyValue('--primary-color').trim() || '#4CAF50';
                    } else if (percentage > 30) {
                        progressBar.style.backgroundColor = getComputedStyle(document.documentElement)
                            .getPropertyValue('--warning-color').trim() || '#FFC107';
                    } else {
                        progressBar.style.backgroundColor = getComputedStyle(document.documentElement)
                            .getPropertyValue('--danger-color').trim() || '#F44336';
                    }
                }
            }
            
            // Simpan hasil emosi audio ke lastEmotions
            const audioEmotions = {
                happy: emotion === 'happy' ? confidence : 0,
                sad: emotion === 'sad' ? confidence : 0,
                angry: emotion === 'angry' ? confidence : 0,
                neutral: emotion === 'neutral' ? confidence : 0,
                surprised: emotion === 'surprised' ? confidence : 0,
                surprise: emotion === 'surprised' ? confidence : 0,
                disgusted: 0
            };
            this.lastEmotions = audioEmotions;
        }

        // Initialize visualizer
        initializeVisualizer() {
            try {
                if (!this.audioCanvas) {
                    console.warn('Audio canvas element not found');
                    return;
                }
                
                // Check if canvas is properly initialized
                if (!this.audioCanvas.getContext) {
                    console.error('Canvas getContext method not available');
                    return;
                }
                
                const canvasCtx = this.audioCanvas.getContext('2d');
                if (!canvasCtx) {
                    console.error('Failed to get 2D context from canvas');
                    return;
                }
                
                const WIDTH = this.audioCanvas.width || 600;
                const HEIGHT = this.audioCanvas.height || 200;
                
                const draw = () => {
                    if (!this.analyser) return;
                    
                    requestAnimationFrame(draw);
                    
                    const bufferLength = this.analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    this.analyser.getByteFrequencyData(dataArray);
                    
                    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
                    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
                    
                    const barWidth = (WIDTH / bufferLength) * 2.5;
                    let barHeight;
                    let x = 0;
                    
                    for (let i = 0; i < bufferLength; i++) {
                        barHeight = dataArray[i] / 2;
                        
                        canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
                        canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight);
                        
                        x += barWidth + 1;
                    }
                };
                
                draw();
                console.log('Audio visualizer initialized successfully');
                
            } catch (error) {
                console.error('Error initializing audio visualizer:', error);
            }
        }

        // Initialize emotion display
        initializeEmotionDisplay() {
            // Initialize with zero values for all possible emotions
            const initialEmotions = {
                happy: 0,
                sad: 0,
                angry: 0,
                fearful: 0,
                surprised: 0,
                surprise: 0,
                disgusted: 0,
                neutral: 0,
                contempt: 0,
                confused: 0,
                anxious: 0,
                embarrassed: 0,
                proud: 0,
                relieved: 0,
                satisfied: 0,
                amused: 0,
                inspired: 0,
                determined: 0,
                focused: 0,
                thoughtful: 0,
                peaceful: 0,
                grateful: 0,
                hopeful: 0,
                confident: 0,
                curious: 0,
                worried: 0,
                frustrated: 0,
                lonely: 0,
                overwhelmed: 0,
                stressed: 0,
                tired: 0,
                bored: 0,
                irritated: 0,
                jealous: 0,
                guilty: 0,
                ashamed: 0,
                disappointed: 0,
                hurt: 0,
                vulnerable: 0,
                insecure: 0,
                defensive: 0,
                aggressive: 0,
                hostile: 0,
                contemptuous: 0,
                revolted: 0,
                appalled: 0,
                horrified: 0,
                terrified: 0,
                panicked: 0,
                hysterical: 0,
                overjoyed: 0,
                ecstatic: 0,
                elated: 0,
                euphoric: 0,
                thrilled: 0,
                exhilarated: 0,
                jubilant: 0,
                triumphant: 0,
                victorious: 0,
                accomplished: 0,
                fulfilled: 0,
                content: 0,
                serene: 0,
                tranquil: 0,
                calm: 0,
                relaxed: 0,
                at_ease: 0,
                comfortable: 0,
                secure: 0,
                safe: 0,
                protected: 0,
                supported: 0,
                loved: 0,
                cherished: 0,
                valued: 0,
                appreciated: 0,
                respected: 0,
                admired: 0,
                esteemed: 0,
                honored: 0,
                revered: 0,
                worshiped: 0,
                adored: 0,
                idolized: 0,
                worshipped: 0
            };
            // Don't update results yet, wait for actual analysis
            this.lastEmotions = initialEmotions;
        }

        setupEventListeners() {
            // Video event listeners
            if (this.startCameraButton) {
                this.startCameraButton.addEventListener('click', () => this.startVideo());
            }
            if (this.stopCameraButton) {
                this.stopCameraButton.addEventListener('click', () => this.stopVideo());
            }
            if (this.captureEmotionButton) {
                this.captureEmotionButton.addEventListener('click', () => this.takeSnapshot());
            }

            // Audio event listeners
            if (this.startRecordingButton) {
                this.startRecordingButton.addEventListener('click', async () => {
                    const started = await this.startAudioAnalysis();
                    if (started) {
                        this.startRecordingButton.disabled = true;
                        this.stopRecordingButton.disabled = false;
                        this.startRecordingButton.classList.add('recording-active');
                    }
                });
            }
            
            if (this.stopRecordingButton) {
                this.stopRecordingButton.addEventListener('click', () => {
                    this.stopAudioAnalysis();
                    this.startRecordingButton.disabled = false;
                    this.stopRecordingButton.disabled = true;
                    this.startRecordingButton.classList.remove('recording-active');
                });
            }

            if (this.playRecordingButton) {
                this.playRecordingButton.addEventListener('click', () => this.startAudioRecording());
            }

            // Text event listeners
            if (this.analyzeTextButton) {
            this.analyzeTextButton.addEventListener('click', () => this.analyzeTextInput());
            }
            
            if (this.clearTextButton) {
                this.clearTextButton.addEventListener('click', () => {
                    this.emotionText.value = '';
                    this.recordingStatus.textContent = 'Text cleared';
                });
            }
            
            // Add input event for real-time text analysis
            if (this.emotionText) {
                this.emotionText.addEventListener('input', this.debounce(() => {
                    if (this.emotionText.value.trim()) {
                    this.analyzeTextInput();
                }
            }, 500));
            }

            // Results section event listeners
            if (this.closeResultsButton) {
                this.closeResultsButton.addEventListener('click', () => {
                    this.resultsSection.style.display = 'none';
                });
            }

            if (this.saveEmotionButton) {
                this.saveEmotionButton.addEventListener('click', async () => {
                    try {
                        this.saveEmotionButton.disabled = true;
                        this.saveEmotionButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                        
                        const emotions = this.lastEmotions || null;
                        if (!emotions) {
                            this.updateStatus('No emotion data to save. Please perform emotion analysis first.', 'error');
                            return;
                        }
                        
                        const dataToSave = {
                            ...emotions,
                            id: Date.now().toString(),
                            timestamp: new Date().toISOString(),
                            source: 'emotion_input'
                        };
                        
                        const storage = new window.DataStorage();
                        const saved = await storage.saveEmotionData(dataToSave);
                        
                        if (saved) {
                            this.updateStatus('Emotion data saved successfully!', 'success');
                            } else {
                            throw new Error('Failed to save emotion data');
                        }
                        
                    } catch (error) {
                        console.error('Error saving emotion data:', error);
                        this.updateStatus('Failed to save emotion data: ' + error.message, 'error');
                        this.saveEmotionButton.disabled = false;
                        this.saveEmotionButton.innerHTML = '<i class="fas fa-save"></i> Save Emotion';
                    }
                });
            }

            if (this.newAnalysisButton) {
                this.newAnalysisButton.addEventListener('click', () => {
                    this.resultsSection.style.display = 'none';
                    this.resetAnalysis();
                });
            }

            if (this.shareResultsButton) {
                this.shareResultsButton.addEventListener('click', () => {
                    this.shareResults();
                });
            }
        }

        async startVideo() {
            try {
                this.videoStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
                this.videoElement.srcObject = this.videoStream;
                this.startCameraButton.disabled = true;
                this.stopCameraButton.disabled = false;
                this.captureEmotionButton.disabled = false;
                this.updateStatus('Kamera aktif. Arahkan wajah Anda ke kamera.');
                
                // Start face detection and emotion analysis
                this.startFaceAnalysis();
                await this.videoElement.play();
                this.showCameraCanvas();
                this.startFaceDetectionLoop();
            } catch (error) {
                console.error('Error accessing camera:', error);
                this.updateStatus('Tidak dapat mengakses kamera: ' + error.message, 'error');
            }
        }

        stopVideo() {
            if (this.videoStream) {
                this.videoStream.getTracks().forEach(track => track.stop());
                this.videoStream = null;
                this.videoElement.srcObject = null;
                this.startCameraButton.disabled = false;
                this.stopCameraButton.disabled = true;
                this.captureEmotionButton.disabled = true;
                this.updateStatus('Kamera dimatikan.');
                
                // Stop face detection and analysis
                this.stopFaceAnalysis();
                this.hideCameraCanvas();
                this.stopFaceDetectionLoop();
            }
        }

        async startFaceAnalysis() {
            if (this.isAnalyzing) return;
            
            try {
                // Pastikan model sudah dimuat
                if (!this.emotionAnalyzer.modelsLoaded) {
                    await this.emotionAnalyzer.loadModels();
                }
                
                this.isAnalyzing = true;
                this.updateStatus('Menganalisis ekspresi wajah...');
                
                const analyzeFrame = async () => {
                    if (!this.isAnalyzing) return;
                    
                    try {
                        if (this.videoElement && this.videoElement.readyState >= 2) {
                            const detections = await this.emotionAnalyzer.analyzeVideo(this.videoElement);
                            
                            if (detections && detections.expressions) {
                                const emotions = this.convertFaceApiEmotions(detections.expressions);
                                this.updateResults(emotions);
                                this.drawDetections(detections);
                                
                                // Update status dengan emosi dominan
                                const dominant = Object.entries(emotions).reduce(
                                    (a, b) => a[1] > b[1] ? a : b
                                );
                                this.updateStatus(`Ekspresi terdeteksi: ${dominant[0]} (${Math.round(dominant[1] * 100)}%)`);
                            } else {
                                this.updateStatus('Tidak ada wajah yang terdeteksi');
                            }
                        }
                    } catch (error) {
                        console.error('Error analyzing video frame:', error);
                        this.updateStatus(`Error: ${error.message}`, 'error');
                    }
                    
                    if (this.isAnalyzing) {
                        requestAnimationFrame(analyzeFrame);
                    }
                };
                
                // Mulai analisis
                analyzeFrame();
                
            } catch (error) {
                console.error('Failed to start face analysis:', error);
                this.updateStatus(`Gagal memulai analisis: ${error.message}`, 'error');
                this.isAnalyzing = false;
            }
        }

        stopFaceAnalysis() {
            if (this.analysisInterval) {
                clearInterval(this.analysisInterval);
                this.analysisInterval = null;
            }
            this.isAnalyzing = false;
        }

        updateEmotionResults(expressions) {
            // Store emotions for later use
            this.lastEmotions = expressions;
            
            // Find dominant emotion
            const dominantEmotion = Object.entries(expressions).reduce(
                (a, b) => a[1] > b[1] ? a : b
            );
            
            // Update primary emotion display
            if (this.primaryEmotion) {
            const emotionMap = {
                    'happy': { icon: '😊', label: 'Senang' },
                    'sad': { icon: '😢', label: 'Sedih' },
                    'angry': { icon: '😠', label: 'Marah' },
                    'fearful': { icon: '😨', label: 'Takut' },
                    'surprised': { icon: '😲', label: 'Terkejut' },
                    'surprise': { icon: '😲', label: 'Terkejut' },
                    'disgusted': { icon: '🤢', label: 'Jijik' },
                    'neutral': { icon: '😐', label: 'Netral' },
                    'excited': { icon: '🤩', label: 'Bersemangat' },
                    'confused': { icon: '😕', label: 'Bingung' },
                    'anxious': { icon: '😰', label: 'Cemas' },
                    'contempt': { icon: '😏', label: 'Meremehkan' },
                    'embarrassed': { icon: '😳', label: 'Malu' },
                    'proud': { icon: '😌', label: 'Bangga' },
                    'relieved': { icon: '😌', label: 'Lega' },
                    'satisfied': { icon: '😊', label: 'Puas' },
                    'amused': { icon: '😄', label: 'Terhibur' },
                    'inspired': { icon: '🤔', label: 'Terinspirasi' },
                    'determined': { icon: '😤', label: 'Bertekad' },
                    'focused': { icon: '🤨', label: 'Fokus' },
                    'thoughtful': { icon: '🤔', label: 'Bijaksana' },
                    'peaceful': { icon: '😌', label: 'Tenang' },
                    'grateful': { icon: '🙏', label: 'Bersyukur' },
                    'hopeful': { icon: '🤗', label: 'Berharap' },
                    'confident': { icon: '😎', label: 'Percaya Diri' },
                    'curious': { icon: '🤔', label: 'Penasaran' },
                    'worried': { icon: '😟', label: 'Khawatir' },
                    'frustrated': { icon: '😤', label: 'Frustrasi' },
                    'lonely': { icon: '🥺', label: 'Kesepian' },
                    'overwhelmed': { icon: '😵', label: 'Kewalahan' },
                    'stressed': { icon: '😰', label: 'Stres' },
                    'tired': { icon: '😴', label: 'Lelah' },
                    'bored': { icon: '🥱', label: 'Bosan' },
                    'irritated': { icon: '😤', label: 'Kesal' },
                    'jealous': { icon: '😒', label: 'Cemburu' },
                    'guilty': { icon: '😔', label: 'Bersalah' },
                    'ashamed': { icon: '😞', label: 'Malu' },
                    'disappointed': { icon: '😞', label: 'Kecewa' },
                    'hurt': { icon: '🥺', label: 'Sakit Hati' },
                    'vulnerable': { icon: '🥺', label: 'Rentan' },
                    'insecure': { icon: '😰', label: 'Tidak Aman' },
                    'defensive': { icon: '😤', label: 'Defensif' },
                    'aggressive': { icon: '😠', label: 'Agresif' },
                    'hostile': { icon: '😡', label: 'Memusuhi' },
                    'contemptuous': { icon: '😏', label: 'Meremehkan' },
                    'revolted': { icon: '🤮', label: 'Jijik' },
                    'appalled': { icon: '😱', label: 'Terkejut' },
                    'horrified': { icon: '😱', label: 'Ngeri' },
                    'terrified': { icon: '😨', label: 'Ketakutan' },
                    'panicked': { icon: '😰', label: 'Panik' },
                    'hysterical': { icon: '😵', label: 'Histeris' },
                    'overjoyed': { icon: '🤩', label: 'Sangat Senang' },
                    'ecstatic': { icon: '🤩', label: 'Ekstasi' },
                    'elated': { icon: '😊', label: 'Gembira' },
                    'euphoric': { icon: '🤩', label: 'Euforia' },
                    'thrilled': { icon: '🤩', label: 'Tergugah' },
                    'exhilarated': { icon: '🤩', label: 'Bersemangat' },
                    'jubilant': { icon: '🎉', label: 'Bergembira' },
                    'triumphant': { icon: '🏆', label: 'Menang' },
                    'victorious': { icon: '🏆', label: 'Menang' },
                    'accomplished': { icon: '😌', label: 'Berhasil' },
                    'fulfilled': { icon: '😊', label: 'Terpenuhi' },
                    'content': { icon: '😌', label: 'Puas' },
                    'serene': { icon: '😌', label: 'Tenteram' },
                    'tranquil': { icon: '😌', label: 'Tenteram' },
                    'calm': { icon: '😌', label: 'Tenang' },
                    'relaxed': { icon: '😌', label: 'Santai' },
                    'at_ease': { icon: '😌', label: 'Nyaman' },
                    'comfortable': { icon: '😌', label: 'Nyaman' },
                    'secure': { icon: '😊', label: 'Aman' },
                    'safe': { icon: '😊', label: 'Aman' },
                    'protected': { icon: '😊', label: 'Terlindungi' },
                    'supported': { icon: '🤗', label: 'Didukung' },
                    'loved': { icon: '🥰', label: 'Dicintai' },
                    'cherished': { icon: '🥰', label: 'Disayangi' },
                    'valued': { icon: '😊', label: 'Dihargai' },
                    'appreciated': { icon: '😊', label: 'Dihargai' },
                    'respected': { icon: '😊', label: 'Dihormati' },
                    'admired': { icon: '😊', label: 'Dikagumi' },
                    'esteemed': { icon: '😊', label: 'Dihormati' },
                    'honored': { icon: '😊', label: 'Dihormati' },
                    'revered': { icon: '🙏', label: 'Dihormati' },
                    'worshiped': { icon: '🙏', label: 'Disembah' },
                    'adored': { icon: '🥰', label: 'Disembah' },
                    'idolized': { icon: '🤩', label: 'Dipuja' },
                    'worshipped': { icon: '🙏', label: 'Disembah' }
                };
                
                const emotion = emotionMap[dominantEmotion[0]] || emotionMap['neutral'];
                const confidence = Math.round(dominantEmotion[1] * 100);
                
                this.primaryEmotion.innerHTML = `
                    <span class="emotion-icon">${emotion.icon}</span>
                    <span class="emotion-label">${emotion.label}</span>
                `;
                
                // Update confidence bar
                if (this.confidenceBar && this.confidenceText) {
                    this.confidenceBar.style.width = `${confidence}%`;
                    this.confidenceText.textContent = `${confidence}%`;
                }
                
                // Update mood score (simple calculation)
                if (this.moodScore) {
                    const moodScore = Math.round((expressions.happy * 0.4 + expressions.neutral * 0.3 + (1 - expressions.sad - expressions.angry) * 0.3) * 10);
                    this.moodScore.textContent = `${moodScore}/10`;
                }
                
                // Update stress indicator
                if (this.stressIndicator) {
                    const stressLevel = expressions.angry + expressions.sad;
                    if (stressLevel > 0.7) {
                        this.stressIndicator.textContent = 'High';
                        this.stressIndicator.className = 'stress-indicator high';
                    } else if (stressLevel > 0.4) {
                        this.stressIndicator.textContent = 'Medium';
                        this.stressIndicator.className = 'stress-indicator medium';
                    } else {
                        this.stressIndicator.textContent = 'Low';
                        this.stressIndicator.className = 'stress-indicator low';
                    }
                }
                
                // Update emotion breakdown bars
                if (this.emotionBars) {
                    this.emotionBars.innerHTML = '';
                    
                    Object.entries(expressions).forEach(([emotion, value]) => {
                        const percentage = Math.round(value * 100);
                        const bar = document.createElement('div');
                        bar.className = 'emotion-bar';
                        bar.innerHTML = `
                            <div class="emotion-bar-label">${emotion.charAt(0).toUpperCase() + emotion.slice(1)}</div>
                            <div class="emotion-bar-container">
                                <div class="emotion-bar-fill" style="width: ${percentage}%"></div>
                                <span class="emotion-bar-value">${percentage}%</span>
                            </div>
                        `;
                        this.emotionBars.appendChild(bar);
                    });
                }
            }
        }

        // Draw face detections and expressions on canvas
        drawDetections(detections) {
            if (!this.canvasElement || !detections || !detections.faces) return;

            const canvas = this.canvasElement;
            const ctx = canvas.getContext('2d');
            
            // Clear previous drawings
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Set canvas dimensions to match video
            if (this.videoElement) {
                canvas.width = this.videoElement.videoWidth;
                canvas.height = this.videoElement.videoHeight;
            }

            // Draw each detected face
            detections.faces.forEach(face => {
                if (!face || !face.box) return;

                const { x, y, width, height } = face.box;
                
                // Draw face box
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, width, height);

                // Draw face expressions if available
                if (face.expressions) {
                    const dominantExpression = Object.entries(face.expressions).reduce(
                        (max, [emotion, value]) => value > max.value ? { emotion, value } : max,
                        { emotion: '', value: 0 }
                    );

                    // Draw expression text above the face box
                    ctx.fillStyle = '#00ff00';
                    ctx.font = '16px Arial';
                    ctx.fillText(
                        `${dominantExpression.emotion} (${Math.round(dominantExpression.value * 100)}%)`,
                        x,
                        y - 10
                    );
                }

                // Draw face landmarks if available
                if (face.landmarks) {
                    ctx.fillStyle = '#00ff00';
                    face.landmarks.positions.forEach(point => {
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                        ctx.fill();
                    });
                }
            });
        }

        showResultsSection() {
            if (this.resultsSection) {
                this.resultsSection.style.display = 'block';
            }
        }

        async startAudioRecording() {
            try {
                this.audioStream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                
                // Setup audio context and analyzer
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 256;
                
                const source = this.audioContext.createMediaStreamSource(this.audioStream);
                source.connect(this.analyser);
                
                this.mediaRecorder = new MediaRecorder(this.audioStream);
                this.audioChunks = [];

                this.mediaRecorder.ondataavailable = async (event) => {
                    this.audioChunks.push(event.data);
                    const emotions = await this.emotionAnalyzer.analyzeAudio(this.audioChunks);
                    if (emotions) {
                        await this.saveAndProcessEmotions(emotions, 'audio');
                        this.updateResults(emotions);
                    }
                };

                this.mediaRecorder.start(1000); // Analyze every second
                
                if (this.startRecordingButton) {
                    this.startRecordingButton.disabled = true;
                }
                if (this.stopRecordingButton) {
                    this.stopRecordingButton.disabled = false;
                }
                if (this.recordingStatus) {
                    this.recordingStatus.textContent = "Recording...";
                }
                
                // Start visualization
                this.visualizeAudio();
            } catch (error) {
                console.error('Error starting audio recording:', error);
                if (this.recordingStatus) {
                    this.recordingStatus.textContent = "Error: " + error.message;
                }
            }
        }

        stopAudioRecording() {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
                this.audioStream.getTracks().forEach(track => track.stop());
                
                // Stop visualization
                if (this.visualizerInterval) {
                    clearInterval(this.visualizerInterval);
                    this.visualizerInterval = null;
                }
                
                // Clear visualizer
                if (this.audioCanvas) {
                    const ctx = this.audioCanvas.getContext('2d');
                    ctx.clearRect(0, 0, this.audioCanvas.width, this.audioCanvas.height);
                }
                
                if (this.startRecordingButton) {
                    this.startRecordingButton.disabled = false;
                }
                if (this.stopRecordingButton) {
                    this.stopRecordingButton.disabled = true;
                }
                if (this.recordingStatus) {
                    this.recordingStatus.textContent = "Stopped";
                }
            }
        }

        async analyzeTextInput() {
            const text = this.emotionText.value.trim();
            if (text) {
                try {
                    if (this.recordingStatus) {
                        this.recordingStatus.textContent = "Analyzing...";
                    }
                    const emotions = await this.emotionAnalyzer.analyzeText(text);
                    if (emotions) {
                        await this.saveAndProcessEmotions(emotions, 'text');
                        this.updateResults(emotions);
                        if (this.recordingStatus) {
                            this.recordingStatus.textContent = "Analysis complete";
                        }
                        
                        // Show results section
                        this.showResultsSection();
                        
                        // Simpan hasil emosi text ke lastEmotions
                        this.lastEmotions = emotions;
                    }
                } catch (error) {
                    console.error('Error analyzing text:', error);
                    if (this.recordingStatus) {
                        this.recordingStatus.textContent = "Error: " + error.message;
                    }
                }
            }
        }

        async saveAndProcessEmotions(emotions, source) {
            // Kirim ke backend
            try {
                const response = await EmotionService.trackEmotion({ ...emotions, source });
                this.updateResults([response]);
                // Setelah data disimpan ke DataStorage, tambahkan ke history
                if (!window.historyManager) {
                    window.historyManager = new window.HistoryManager();
                }
                window.historyManager.addEntry('create', response);
            } catch (error) {
                this.updateStatus('Gagal menyimpan emosi ke server', 'error');
            }
        }

        updateResults(emotions) {
            // Store emotions for later use
            this.lastEmotions = emotions;
            
            // Find dominant emotion
            const dominantEmotion = Object.entries(emotions).reduce(
                (a, b) => a[1] > b[1] ? a : b
            );
            
            // Update primary emotion display
            if (this.primaryEmotion) {
                const emotionMap = {
                    'happy': { icon: '😊', label: 'Senang' },
                    'sad': { icon: '😢', label: 'Sedih' },
                    'angry': { icon: '😠', label: 'Marah' },
                    'fearful': { icon: '😨', label: 'Takut' },
                    'surprised': { icon: '😲', label: 'Terkejut' },
                    'surprise': { icon: '😲', label: 'Terkejut' },
                    'disgusted': { icon: '🤢', label: 'Jijik' },
                    'neutral': { icon: '😐', label: 'Netral' },
                    'excited': { icon: '🤩', label: 'Bersemangat' },
                    'confused': { icon: '😕', label: 'Bingung' },
                    'anxious': { icon: '😰', label: 'Cemas' },
                    'contempt': { icon: '😏', label: 'Meremehkan' },
                    'embarrassed': { icon: '😳', label: 'Malu' },
                    'proud': { icon: '😌', label: 'Bangga' },
                    'relieved': { icon: '😌', label: 'Lega' },
                    'satisfied': { icon: '😊', label: 'Puas' },
                    'amused': { icon: '😄', label: 'Terhibur' },
                    'inspired': { icon: '🤔', label: 'Terinspirasi' },
                    'determined': { icon: '😤', label: 'Bertekad' },
                    'focused': { icon: '🤨', label: 'Fokus' },
                    'thoughtful': { icon: '🤔', label: 'Bijaksana' },
                    'peaceful': { icon: '😌', label: 'Tenang' },
                    'grateful': { icon: '🙏', label: 'Bersyukur' },
                    'hopeful': { icon: '🤗', label: 'Berharap' },
                    'confident': { icon: '😎', label: 'Percaya Diri' },
                    'curious': { icon: '🤔', label: 'Penasaran' },
                    'worried': { icon: '😟', label: 'Khawatir' },
                    'frustrated': { icon: '😤', label: 'Frustrasi' },
                    'lonely': { icon: '🥺', label: 'Kesepian' },
                    'overwhelmed': { icon: '😵', label: 'Kewalahan' },
                    'stressed': { icon: '😰', label: 'Stres' },
                    'tired': { icon: '😴', label: 'Lelah' },
                    'bored': { icon: '🥱', label: 'Bosan' },
                    'irritated': { icon: '😤', label: 'Kesal' },
                    'jealous': { icon: '😒', label: 'Cemburu' },
                    'guilty': { icon: '😔', label: 'Bersalah' },
                    'ashamed': { icon: '😞', label: 'Malu' },
                    'disappointed': { icon: '😞', label: 'Kecewa' },
                    'hurt': { icon: '🥺', label: 'Sakit Hati' },
                    'vulnerable': { icon: '🥺', label: 'Rentan' },
                    'insecure': { icon: '😰', label: 'Tidak Aman' },
                    'defensive': { icon: '😤', label: 'Defensif' },
                    'aggressive': { icon: '😠', label: 'Agresif' },
                    'hostile': { icon: '😡', label: 'Memusuhi' },
                    'contemptuous': { icon: '😏', label: 'Meremehkan' },
                    'revolted': { icon: '🤮', label: 'Jijik' },
                    'appalled': { icon: '😱', label: 'Terkejut' },
                    'horrified': { icon: '😱', label: 'Ngeri' },
                    'terrified': { icon: '😨', label: 'Ketakutan' },
                    'panicked': { icon: '😰', label: 'Panik' },
                    'hysterical': { icon: '😵', label: 'Histeris' },
                    'overjoyed': { icon: '🤩', label: 'Sangat Senang' },
                    'ecstatic': { icon: '🤩', label: 'Ekstasi' },
                    'elated': { icon: '😊', label: 'Gembira' },
                    'euphoric': { icon: '🤩', label: 'Euforia' },
                    'thrilled': { icon: '🤩', label: 'Tergugah' },
                    'exhilarated': { icon: '🤩', label: 'Bersemangat' },
                    'jubilant': { icon: '🎉', label: 'Bergembira' },
                    'triumphant': { icon: '🏆', label: 'Menang' },
                    'victorious': { icon: '🏆', label: 'Menang' },
                    'accomplished': { icon: '😌', label: 'Berhasil' },
                    'fulfilled': { icon: '😊', label: 'Terpenuhi' },
                    'content': { icon: '😌', label: 'Puas' },
                    'serene': { icon: '😌', label: 'Tenteram' },
                    'tranquil': { icon: '😌', label: 'Tenteram' },
                    'calm': { icon: '😌', label: 'Tenang' },
                    'relaxed': { icon: '😌', label: 'Santai' },
                    'at_ease': { icon: '😌', label: 'Nyaman' },
                    'comfortable': { icon: '😌', label: 'Nyaman' },
                    'secure': { icon: '😊', label: 'Aman' },
                    'safe': { icon: '😊', label: 'Aman' },
                    'protected': { icon: '😊', label: 'Terlindungi' },
                    'supported': { icon: '🤗', label: 'Didukung' },
                    'loved': { icon: '🥰', label: 'Dicintai' },
                    'cherished': { icon: '🥰', label: 'Disayangi' },
                    'valued': { icon: '😊', label: 'Dihargai' },
                    'appreciated': { icon: '😊', label: 'Dihargai' },
                    'respected': { icon: '😊', label: 'Dihormati' },
                    'admired': { icon: '😊', label: 'Dikagumi' },
                    'esteemed': { icon: '😊', label: 'Dihormati' },
                    'honored': { icon: '😊', label: 'Dihormati' },
                    'revered': { icon: '🙏', label: 'Dihormati' },
                    'worshiped': { icon: '🙏', label: 'Disembah' },
                    'adored': { icon: '🥰', label: 'Disembah' },
                    'idolized': { icon: '🤩', label: 'Dipuja' },
                    'worshipped': { icon: '🙏', label: 'Disembah' }
                };
                
                const emotion = emotionMap[dominantEmotion[0]] || emotionMap['neutral'];
                const confidence = Math.round(dominantEmotion[1] * 100);
                
                this.primaryEmotion.innerHTML = `
                    <span class="emotion-icon">${emotion.icon}</span>
                    <span class="emotion-label">${emotion.label}</span>
                `;
                
                // Update confidence bar
                if (this.confidenceBar && this.confidenceText) {
                    this.confidenceBar.style.width = `${confidence}%`;
                    this.confidenceText.textContent = `${confidence}%`;
                }
                
                // Update mood score (simple calculation)
                if (this.moodScore) {
                    const moodScore = Math.round((emotions.happy * 0.4 + emotions.neutral * 0.3 + (1 - emotions.sad - emotions.angry) * 0.3) * 10);
                    this.moodScore.textContent = `${moodScore}/10`;
                }
                
                // Update stress indicator
                if (this.stressIndicator) {
                    const stressLevel = emotions.angry + emotions.sad;
                    if (stressLevel > 0.7) {
                        this.stressIndicator.textContent = 'High';
                        this.stressIndicator.className = 'stress-indicator high';
                    } else if (stressLevel > 0.4) {
                        this.stressIndicator.textContent = 'Medium';
                        this.stressIndicator.className = 'stress-indicator medium';
                    } else {
                        this.stressIndicator.textContent = 'Low';
                        this.stressIndicator.className = 'stress-indicator low';
                    }
                }
                
                // Update emotion breakdown bars
                if (this.emotionBars) {
                    this.emotionBars.innerHTML = '';
                    
                    Object.entries(emotions).forEach(([emotion, value]) => {
                        const percentage = Math.round(value * 100);
                        const bar = document.createElement('div');
                        bar.className = 'emotion-bar';
                        bar.innerHTML = `
                            <div class="emotion-bar-label">${emotion.charAt(0).toUpperCase() + emotion.slice(1)}</div>
                            <div class="emotion-bar-container">
                                <div class="emotion-bar-fill" style="width: ${percentage}%"></div>
                                <span class="emotion-bar-value">${percentage}%</span>
                            </div>
                        `;
                        this.emotionBars.appendChild(bar);
                    });
                }
            }
        }

        convertFaceApiEmotions(expressions) {
            // Convert face-api.js emotions to our format with comprehensive mapping
            return {
                happy: expressions.happy || 0,
                sad: expressions.sad || 0,
                angry: expressions.angry || 0,
                fearful: expressions.fearful || 0,
                surprised: expressions.surprised || 0,
                surprise: expressions.surprised || expressions.surprise || 0,
                disgusted: expressions.disgusted || 0,
                neutral: expressions.neutral || 0,
                contempt: expressions.contempt || 0,
                // Map additional emotions that might be detected
                confused: expressions.confused || 0,
                anxious: expressions.anxious || expressions.fearful || 0,
                embarrassed: expressions.embarrassed || 0,
                proud: expressions.proud || 0,
                relieved: expressions.relieved || 0,
                satisfied: expressions.satisfied || expressions.happy || 0,
                amused: expressions.amused || expressions.happy || 0,
                inspired: expressions.inspired || 0,
                determined: expressions.determined || 0,
                focused: expressions.focused || expressions.neutral || 0,
                thoughtful: expressions.thoughtful || expressions.neutral || 0,
                peaceful: expressions.peaceful || expressions.neutral || 0,
                grateful: expressions.grateful || 0,
                hopeful: expressions.hopeful || 0,
                confident: expressions.confident || 0,
                curious: expressions.curious || 0,
                worried: expressions.worried || expressions.fearful || 0,
                frustrated: expressions.frustrated || expressions.angry || 0,
                lonely: expressions.lonely || expressions.sad || 0,
                overwhelmed: expressions.overwhelmed || 0,
                stressed: expressions.stressed || expressions.angry || expressions.fearful || 0,
                tired: expressions.tired || 0,
                bored: expressions.bored || expressions.neutral || 0,
                irritated: expressions.irritated || expressions.angry || 0,
                jealous: expressions.jealous || 0,
                guilty: expressions.guilty || expressions.sad || 0,
                ashamed: expressions.ashamed || expressions.sad || 0,
                disappointed: expressions.disappointed || expressions.sad || 0,
                hurt: expressions.hurt || expressions.sad || 0,
                vulnerable: expressions.vulnerable || expressions.fearful || 0,
                insecure: expressions.insecure || expressions.fearful || 0,
                defensive: expressions.defensive || expressions.angry || 0,
                aggressive: expressions.aggressive || expressions.angry || 0,
                hostile: expressions.hostile || expressions.angry || 0,
                contemptuous: expressions.contemptuous || expressions.contempt || 0,
                revolted: expressions.revolted || expressions.disgusted || 0,
                appalled: expressions.appalled || expressions.surprised || 0,
                horrified: expressions.horrified || expressions.fearful || 0,
                terrified: expressions.terrified || expressions.fearful || 0,
                panicked: expressions.panicked || expressions.fearful || 0,
                hysterical: expressions.hysterical || 0,
                overjoyed: expressions.overjoyed || expressions.happy || 0,
                ecstatic: expressions.ecstatic || expressions.happy || 0,
                elated: expressions.elated || expressions.happy || 0,
                euphoric: expressions.euphoric || expressions.happy || 0,
                thrilled: expressions.thrilled || expressions.happy || 0,
                exhilarated: expressions.exhilarated || expressions.happy || 0,
                jubilant: expressions.jubilant || expressions.happy || 0,
                triumphant: expressions.triumphant || expressions.happy || 0,
                victorious: expressions.victorious || expressions.happy || 0,
                accomplished: expressions.accomplished || expressions.happy || 0,
                fulfilled: expressions.fulfilled || expressions.happy || 0,
                content: expressions.content || expressions.neutral || 0,
                serene: expressions.serene || expressions.neutral || 0,
                tranquil: expressions.tranquil || expressions.neutral || 0,
                calm: expressions.calm || expressions.neutral || 0,
                relaxed: expressions.relaxed || expressions.neutral || 0,
                at_ease: expressions.at_ease || expressions.neutral || 0,
                comfortable: expressions.comfortable || expressions.neutral || 0,
                secure: expressions.secure || expressions.neutral || 0,
                safe: expressions.safe || expressions.neutral || 0,
                protected: expressions.protected || expressions.neutral || 0,
                supported: expressions.supported || 0,
                loved: expressions.loved || expressions.happy || 0,
                cherished: expressions.cherished || expressions.happy || 0,
                valued: expressions.valued || expressions.happy || 0,
                appreciated: expressions.appreciated || expressions.happy || 0,
                respected: expressions.respected || 0,
                admired: expressions.admired || expressions.happy || 0,
                esteemed: expressions.esteemed || 0,
                honored: expressions.honored || 0,
                revered: expressions.revered || 0,
                worshiped: expressions.worshiped || 0,
                adored: expressions.adored || expressions.happy || 0,
                idolized: expressions.idolized || expressions.happy || 0,
                worshipped: expressions.worshipped || 0
            };
        }

        async drawFaceOverlay(emotions) {
            if (!this.videoElement || !this.canvasElement) return;
            const ctx = this.canvasElement.getContext('2d');
            ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
            try {
                // Tidak perlu resizeResults jika emotions bukan hasil deteksi face-api.js
                // (karena sekarang emotions hanya hasil ekspresi saja)
                // Jika ingin overlay box, harus ambil dari deteksi asli (bisa dikembangkan)
                // Untuk sekarang, skip overlay jika tidak ada deteksi
            } catch (error) {
                console.error('Error drawing face overlay:', error);
            }
        }

        visualizeAudio() {
            try {
                if (!this.audioCanvas) {
                    console.warn('Audio canvas element not found for visualization');
                    return;
                }
                
                // Check if canvas is properly initialized
                if (!this.audioCanvas.getContext) {
                    console.error('Canvas getContext method not available for visualization');
                    return;
                }
                
                const canvas = this.audioCanvas;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error('Failed to get 2D context from canvas for visualization');
                    return;
                }
                
                canvas.width = this.audioVisualizer ? this.audioVisualizer.clientWidth : 600;
                canvas.height = this.audioVisualizer ? this.audioVisualizer.clientHeight : 200;

                const bufferLength = this.analyser ? this.analyser.frequencyBinCount : 256;
                const dataArray = new Uint8Array(bufferLength);

                const draw = () => {
                    if (this.mediaRecorder?.state === 'recording') {
                        requestAnimationFrame(draw);
                        if (this.analyser) {
                            this.analyser.getByteFrequencyData(dataArray);
                        }

                        // Clear canvas
                        ctx.fillStyle = '#f5f6fa';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        // Draw frequency bars
                        const barWidth = (canvas.width / bufferLength) * 2.5;
                        let x = 0;

                        // Draw frequency spectrum
                        for (let i = 0; i < bufferLength; i++) {
                            const barHeight = dataArray[i] / 2;
                            
                            // Convert to dB and map to color
                            const db = 20 * Math.log10(dataArray[i] / 255);
                            const normalizedDb = Math.max(0, Math.min(1, (db + 100) / 100));
                            
                            // Color based on dB level
                            const hue = normalizedDb * 120; // 0 (red) to 120 (green)
                            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                            
                            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                            x += barWidth + 1;
                        }

                        // Draw dB meter
                        const db = this.emotionAnalyzer?.currentDb || -100;
                        const normalizedDb = Math.max(0, Math.min(1, (db + 100) / 100));
                        
                        // Draw dB background
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                        ctx.fillRect(10, 10, 200, 30);
                        
                        // Draw dB text
                        ctx.font = '16px Arial';
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(`Volume: ${db.toFixed(1)} dB`, 20, 30);

                        // Draw emotion indicators
                        const emotions = this.getEmotionFromDb(db);
                        ctx.fillText(`Detected: ${emotions}`, 20, 60);
                    }
                };

                draw();
                console.log('Audio visualization started successfully');
                
            } catch (error) {
                console.error('Error in audio visualization:', error);
            }
        }

        getEmotionFromDb(db) {
            if (db < -60) return "Silent";
            if (db < -40) return "Quiet";
            if (db < -20) return "Moderate";
            if (db < 0) return "Loud";
            return "Very Loud";
        }

        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        async takeSnapshot() {
            if (!this.videoElement) return;
            
            try {
                this.updateStatus('Analyzing snapshot...', 'info');
                // Tampilkan canvas saat snapshot
                this.showCameraCanvas();
                // Create temporary canvas for snapshot
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = this.videoElement.videoWidth;
                canvas.height = this.videoElement.videoHeight;
                context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
                const detections = await this.emotionAnalyzer.analyzeVideo(this.videoElement);
                if (detections && detections.expressions) {
                    const emotions = this.convertFaceApiEmotions(detections.expressions);
                    this.updateResults(emotions);
                    this.currentSnapshot = {
                        imageData: canvas.toDataURL('image/png'),
                        emotions: emotions,
                        timestamp: new Date()
                    };
                    this.showResultsSection();
                    this.updateStatus('Snapshot analyzed successfully!', 'success');
                } else {
                    this.updateStatus('No face detected in snapshot', 'error');
                }
                // Sembunyikan canvas setelah selesai (opsional, tergantung UX)
                setTimeout(() => this.hideCameraCanvas(), 1000);
            } catch (error) {
                console.error('Error taking snapshot:', error);
                this.updateStatus('Error analyzing snapshot: ' + error.message, 'error');
                this.hideCameraCanvas();
            }
        }
        
        deleteSnapshot() {
            const container = document.getElementById('snapshotContainer');
            const emotionElement = document.getElementById('snapshotEmotion');
            const timestampElement = document.getElementById('snapshotTimestamp');
            
            // Hide the snapshot container
            if (container) {
                container.style.display = 'none';
            }
            
            // Reset snapshot data
            this.currentSnapshot = null;
            
            // Disable buttons
            document.getElementById('downloadSnapshot').disabled = true;
            document.getElementById('deleteSnapshot').disabled = true;
            
            this.updateStatus('Gambar berhasil dihapus', 'info');
        }

        downloadSnapshot() {
            if (!this.snapshotCanvas) return;
            const link = document.createElement('a');
            link.download = `emotion-snapshot-${new Date().getTime()}.png`;
            link.href = this.snapshotCanvas.toDataURL('image/png');
            link.click();
        }

        // Reset analysis state
        resetAnalysis() {
            this.lastEmotions = null;
            this.isAnalyzing = false;
            if (this.videoStream) {
                this.stopVideo();
            }
            if (this.audioStream) {
                this.stopAudioAnalysis();
            }
            if (this.emotionText) {
                this.emotionText.value = '';
            }
            this.updateStatus('Ready for new analysis');
            // Sembunyikan canvas saat reset
            this.hideCameraCanvas();
        }

        // Share results method
        shareResults() {
            if (navigator.share && this.lastEmotions) {
                const emotionText = Object.entries(this.lastEmotions)
                    .map(([emotion, value]) => `${emotion}: ${Math.round(value * 100)}%`)
                    .join('\n');
                
                navigator.share({
                    title: 'My Emotion Analysis Results',
                    text: `Emotion Analysis Results:\n${emotionText}`,
                    url: window.location.href
                }).catch(error => {
                    console.log('Error sharing:', error);
                    this.copyToClipboard(emotionText);
                });
            } else {
                this.copyToClipboard(JSON.stringify(this.lastEmotions, null, 2));
            }
        }

        // Copy to clipboard method
        copyToClipboard(text) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    this.updateStatus('Results copied to clipboard!', 'success');
                }).catch(() => {
                    this.fallbackCopyToClipboard(text);
                });
            } else {
                this.fallbackCopyToClipboard(text);
            }
        }

        // Fallback copy method
        fallbackCopyToClipboard(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.updateStatus('Results copied to clipboard!', 'success');
            } catch (err) {
                this.updateStatus('Failed to copy results', 'error');
            }
            
            document.body.removeChild(textArea);
        }

        // Tampilkan canvas hanya saat dibutuhkan (misal: saat snapshot atau overlay deteksi)
        showCameraCanvas() {
            if (this.canvasElement) this.canvasElement.style.display = 'block';
        }
        hideCameraCanvas() {
            if (this.canvasElement) this.canvasElement.style.display = 'none';
        }

        // Tambahan properti untuk loop deteksi
        startFaceDetectionLoop() {
            if (!this.videoElement || !this.canvasElement || !(this.canvasElement instanceof HTMLCanvasElement)) {
                const errorText = document.getElementById('errorText');
                if (errorText) errorText.textContent = 'Error: Canvas element is not valid. Face detection cannot start.';
                const errorMessage = document.getElementById('errorMessage');
                if (errorMessage) errorMessage.style.display = 'block';
                return;
            }
            this.isDetecting = true;
            const runDetection = async () => {
                if (!this.isDetecting) return;
                if (this.videoElement.readyState === 4 && window.faceapi && faceapi.nets.tinyFaceDetector.params) {
                    this.canvasElement.width = this.videoElement.videoWidth;
                    this.canvasElement.height = this.videoElement.videoHeight;
                    if (!(this.canvasElement instanceof HTMLCanvasElement) || !this.canvasElement.getContext) {
                        const errorText = document.getElementById('errorText');
                        if (errorText) errorText.textContent = 'Error: Canvas element is not valid. Face detection cannot run.';
                        const errorMessage = document.getElementById('errorMessage');
                        if (errorMessage) errorMessage.style.display = 'block';
                        return;
                    }
                    const detections = await faceapi.detectSingleFace(this.videoElement, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions().withFaceLandmarks();
                    const ctx = this.canvasElement.getContext('2d');
                    ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
                    if (detections) {
                        const box = detections.detection.box;
                        ctx.strokeStyle = '#00ff00';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(box.x, box.y, box.width, box.height);
                        if (detections.landmarks) {
                            ctx.fillStyle = '#00ff00';
                            detections.landmarks.positions.forEach(pt => {
                                ctx.beginPath();
                                ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
                                ctx.fill();
                            });
                        }
                        const expressions = detections.expressions;
                        let dominant = {emotion: 'neutral', value: 0};
                        for (const [emo, val] of Object.entries(expressions)) {
                            if (val > dominant.value) dominant = {emotion: emo, value: val};
                        }
                        this.updateDominantEmotionUI(dominant.emotion, dominant.value);
                    } else {
                        ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
                        this.updateDominantEmotionUI('Tidak', 0);
                    }
                }
                if (this.isDetecting) requestAnimationFrame(runDetection);
            };
            runDetection();
        }
        stopFaceDetectionLoop() {
            this.isDetecting = false;
            if (this.canvasElement && this.canvasElement.getContext) {
                const ctx = this.canvasElement.getContext('2d');
                ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
            } else {
                console.error('canvasElement is not a canvas or getContext not available');
            }
        }
        updateDominantEmotionUI(emotion, value) {
            const emotionMap = {
                happy: { icon: '😊', label: 'Senang' },
                sad: { icon: '😢', label: 'Sedih' },
                angry: { icon: '😠', label: 'Marah' },
                fearful: { icon: '😨', label: 'Takut' },
                surprised: { icon: '😲', label: 'Terkejut' },
                disgusted: { icon: '🤢', label: 'Jijik' },
                neutral: { icon: '😐', label: 'Netral' },
                Tidak: { icon: '❓', label: 'Tidak terdeteksi' }
            };
            const e = emotionMap[emotion] || { icon: '😐', label: emotion };
            if (this.primaryEmotion) {
                this.primaryEmotion.innerHTML = `<span class="emotion-icon">${e.icon}</span><span class="emotion-label">${e.label}</span>`;
            }
            if (this.confidenceBar && this.confidenceText) {
                const percent = Math.round(value * 100);
                this.confidenceBar.style.width = percent + '%';
                this.confidenceText.textContent = percent + '%';
            }
            if (this.emotionBars) this.emotionBars.style.display = 'none';
        }
    }
}
    