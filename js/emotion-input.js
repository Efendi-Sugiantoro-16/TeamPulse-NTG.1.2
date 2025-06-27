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
            this.initializeElements();
            this.setupEventListeners();
            this.setupTabNavigation();
            this.initializeAudioContext();
            this.initializeVisualizer();
            this.initializeEmotionDisplay();
            this.showResultsSection(); // Tampilkan section hasil analisis
        }

        async loadModels() {
            try {
                this.videoStatus.textContent = "Loading face detection models...";
                const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

                this.isModelLoaded = true;
                this.videoStatus.textContent = "Face detection ready";
                console.log("All models loaded successfully");
                this.startVideoBtn.disabled = false;
            } catch (error) {
                console.error('Error loading models:', error);
                this.videoStatus.textContent = "Error loading models. Please check console and refresh the page.";
                this.isModelLoaded = false;
                this.startVideoBtn.disabled = true;
            }
        }

        initializeElements() {
            // Video elements
            this.videoElement = document.getElementById('videoFeed');
            this.videoOverlay = document.getElementById('videoOverlay');
            this.startButton = document.getElementById('startVideo');
            this.stopButton = document.getElementById('stopVideo');
            this.takeSnapshotButton = document.getElementById('takeSnapshot');
            this.deleteSnapshotButton = document.getElementById('deleteSnapshot');
            this.statusElement = document.getElementById('videoStatus');
            
            // Audio elements
            this.audioVisualizer = document.getElementById('audioVisualizer');
            this.startAudioButton = document.getElementById('startAudio');
            this.stopAudioButton = document.getElementById('stopAudio');
            this.audioStatus = document.getElementById('audioStatus');
            
            // Text elements
            this.textInput = document.getElementById('textInput');
            this.analyzeTextButton = document.getElementById('analyzeText');
            this.textStatus = document.getElementById('textStatus');
            
            // Snapshot elements
            this.snapshotCanvas = document.getElementById('snapshotCanvas');
            this.snapshotContainer = document.getElementById('snapshotContainer');
            this.downloadSnapshotButton = document.getElementById('downloadSnapshot');
            
            // Results section
            this.resultsSection = document.getElementById('resultsSection');
        }

        // Method to update status message
        updateStatus(message, type = 'info') {
            if (this.statusElement) {
                this.statusElement.textContent = message;
                this.statusElement.className = 'status';
                if (type === 'error') {
                    this.statusElement.style.color = '#e74c3c';
                } else if (type === 'success') {
                    this.statusElement.style.color = '#2ecc71';
                } else {
                    this.statusElement.style.color = '#3498db';
                }
            }
        }

        // Setup tab navigation
        setupTabNavigation() {
            const tabButtons = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');

            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Remove active class from all buttons and contents
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabContents.forEach(content => content.style.display = 'none');

                    // Add active class to clicked button
                    button.classList.add('active');

                    // Show corresponding tab content
                    const tabId = button.getAttribute('data-tab');
                    const activeTab = document.getElementById(tabId);
                    if (activeTab) {
                        activeTab.style.display = 'block';
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
                fearful: emotion === 'fearful' ? confidence : 0,
                disgusted: 0
            };
            this.lastEmotions = audioEmotions;
        }

        // Initialize visualizer
        initializeVisualizer() {
            if (!this.audioVisualizer) return;
            
            const canvasCtx = this.audioVisualizer.getContext('2d');
            const WIDTH = this.audioVisualizer.width;
            const HEIGHT = this.audioVisualizer.height;
            
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
        }

        // Initialize emotion display
        initializeEmotionDisplay() {
            // Initialize with zero values
            const initialEmotions = {
                happy: 0,
                sad: 0,
                angry: 0,
                neutral: 0,
                surprised: 0,
                fearful: 0,
                disgusted: 0
            };
            this.updateEmotionResults(initialEmotions);
        }

        setupEventListeners() {
            // Video event listeners
            this.startButton.addEventListener('click', () => this.startVideo());
            this.stopButton.addEventListener('click', () => this.stopVideo());
            this.takeSnapshotButton.addEventListener('click', () => this.takeSnapshot());
            this.downloadSnapshotButton.addEventListener('click', () => this.downloadSnapshot());
            this.deleteSnapshotButton.addEventListener('click', () => this.deleteSnapshot());

            // Setup event listeners for audio tab
            const startAudioBtn = document.getElementById('startAudioAnalysis');
            const stopAudioBtn = document.getElementById('stopAudioAnalysis');
            
            if (startAudioBtn && stopAudioBtn) {
                startAudioBtn.addEventListener('click', async () => {
                    const started = await this.startAudioAnalysis();
                    if (started) {
                        startAudioBtn.disabled = true;
                        stopAudioBtn.disabled = false;
                        startAudioBtn.classList.add('recording-active');
                    }
                });
                
                stopAudioBtn.addEventListener('click', () => {
                    this.stopAudioAnalysis();
                    startAudioBtn.disabled = false;
                    stopAudioBtn.disabled = true;
                    startAudioBtn.classList.remove('recording-active');
                });
            }

            // Text event listener
            this.analyzeTextButton.addEventListener('click', () => this.analyzeTextInput());
            
            // Add input event for real-time text analysis
            this.textInput.addEventListener('input', this.debounce(() => {
                if (this.textInput.value.trim()) {
                    this.analyzeTextInput();
                }
            }, 500));

            // Event listener untuk tombol Submit Emotions
            const submitBtn = document.getElementById('submitEmotions');
            if (submitBtn) {
                submitBtn.addEventListener('click', async () => {
                    try {
                        // Disable tombol selama proses
                        submitBtn.disabled = true;
                        submitBtn.textContent = 'Menyimpan...';
                        
                        // Ambil hasil emosi terakhir dari UI (this.lastEmotions)
                        const emotions = this.lastEmotions || null;
                        if (!emotions) {
                            this.updateStatus('Tidak ada data emosi untuk disimpan. Silakan lakukan analisis emosi terlebih dahulu.', 'error');
                            return;
                        }
                        
                        // Validasi data emosi
                        const emotionValues = Object.values(emotions);
                        const hasValidData = emotionValues.some(value => value > 0);
                        if (!hasValidData) {
                            this.updateStatus('Data emosi tidak valid. Silakan lakukan analisis ulang.', 'error');
                            return;
                        }
                        
                        // Tambahkan id unik dan timestamp
                        const dataToSave = {
                            ...emotions,
                            id: Date.now().toString(),
                            timestamp: new Date().toISOString(),
                            source: 'manual_submit'
                        };
                        
                        // Simpan ke DataStorage
                        const storage = new window.DataStorage();
                        const saved = await storage.saveEmotionData(dataToSave);
                        
                        if (!saved) {
                            throw new Error('Gagal menyimpan data emosi');
                        }
                        
                        // Tambahkan ke history (dengan fallback)
                        try {
                            if (window.HistoryManager) {
                                if (!window.historyManager) {
                                    window.historyManager = new window.HistoryManager();
                                }
                                window.historyManager.addEntry('create', saved);
                            } else {
                                console.warn('HistoryManager tidak tersedia, history tidak dicatat');
                            }
                        } catch (historyError) {
                            console.warn('Error mencatat history:', historyError);
                            // Lanjutkan tanpa history jika ada error
                        }
                        
                        this.updateStatus('Data emosi berhasil disimpan!', 'success');
                        
                        // Reset tombol setelah 2 detik
                        setTimeout(() => {
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Submit Emotions';
                        }, 2000);
                        
                    } catch (error) {
                        console.error('Error saving emotion data:', error);
                        this.updateStatus('Gagal menyimpan data emosi: ' + error.message, 'error');
                        
                        // Reset tombol
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Submit Emotions';
                    }
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
                this.startButton.disabled = true;
                this.stopButton.disabled = false;
                this.takeSnapshotButton.disabled = false;
                this.updateStatus('Kamera aktif. Arahkan wajah Anda ke kamera.');
                
                // Start face detection and emotion analysis
                this.startFaceAnalysis();
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
                this.startButton.disabled = false;
                this.stopButton.disabled = true;
                this.takeSnapshotButton.disabled = true;
                this.updateStatus('Kamera dimatikan.');
                
                // Stop face detection and analysis
                this.stopFaceAnalysis();
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
                                this.updateEmotionResults(detections.expressions);
                                this.drawDetections(detections);
                                
                                // Update status dengan emosi dominan
                                const dominant = Object.entries(detections.expressions).reduce(
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
            // Map between face-api.js emotion names and our element IDs
            const emotionMap = {
                'happy': 'happinessResult',
                'sad': 'sadnessResult',
                'angry': 'angerResult',
                'neutral': 'neutralResult',
                'surprised': 'surpriseResult',
                'fearful': 'fearfulResult',
                'disgusted': 'disgustedResult'
            };
            
            // Reset all scores to 0 first
            Object.values(emotionMap).forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    const scoreElement = element.querySelector('.score');
                    const progressBar = element.querySelector('.progress-bar');
                    if (scoreElement) scoreElement.textContent = '0%';
                    if (progressBar) progressBar.style.width = '0%';
                }
            });
            
            // Update with actual scores
            if (!expressions) return;
            
            // Update each emotion score
            Object.entries(expressions).forEach(([emotion, score]) => {
                const elementId = emotionMap[emotion];
                if (!elementId) return;
                
                const element = document.getElementById(elementId);
                if (!element) return;
                
                const scoreElement = element.querySelector('.score');
                const progressBar = element.querySelector('.progress-bar');
                
                if (scoreElement && progressBar) {
                    const percentage = Math.round(score * 100);
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
            });
            
            // Show the results section if it's hidden
            this.showResultsSection();
            
            // Simpan hasil emosi terakhir dengan format yang konsisten
            this.lastEmotions = {
                happy: expressions.happy || 0,
                sad: expressions.sad || 0,
                angry: expressions.angry || 0,
                neutral: expressions.neutral || 0,
                surprised: expressions.surprised || 0,
                fearful: expressions.fearful || 0,
                disgusted: expressions.disgusted || 0
            };
        }

        // Draw face detections and expressions on canvas
        drawDetections(detections) {
            if (!this.videoOverlay || !detections || !detections.faces) return;

            const canvas = this.videoOverlay;
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
            const resultsSection = document.getElementById('resultsSection');
            if (resultsSection) {
                resultsSection.style.display = 'block';
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
                this.startAudioButton.disabled = true;
                this.stopAudioButton.disabled = false;
                this.audioStatus.textContent = "Recording...";
                
                // Start visualization
                this.visualizeAudio();
            } catch (error) {
                console.error('Error starting audio recording:', error);
                this.audioStatus.textContent = "Error: " + error.message;
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
                const ctx = this.audioVisualizer.getContext('2d');
                ctx.clearRect(0, 0, this.audioVisualizer.width, this.audioVisualizer.height);
                
                this.startAudioBtn.disabled = false;
                this.stopAudioBtn.disabled = true;
                this.audioStatus.textContent = "Stopped";
            }
        }

        async analyzeTextInput() {
            const text = this.textInput.value.trim();
            if (text) {
                try {
                    this.textStatus.textContent = "Analyzing...";
                    const emotions = await this.emotionAnalyzer.analyzeText(text);
                    if (emotions) {
                        await this.saveAndProcessEmotions(emotions, 'text');
                        this.updateResults(emotions);
                        this.textStatus.textContent = "Analysis complete";
                        
                        // Simpan hasil emosi text ke lastEmotions
                        this.lastEmotions = emotions;
                    }
                } catch (error) {
                    console.error('Error analyzing text:', error);
                    this.textStatus.textContent = "Error: " + error.message;
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
            // Update result cards, pastikan semua property ada
            this.happinessResult.querySelector('.score').textContent = 
                `${((emotions.happy || 0) * 100).toFixed(1)}%`;
            this.sadnessResult.querySelector('.score').textContent = 
                `${((emotions.sad || 0) * 100).toFixed(1)}%`;
            this.angerResult.querySelector('.score').textContent = 
                `${((emotions.angry || 0) * 100).toFixed(1)}%`;
            this.neutralResult.querySelector('.score').textContent = 
                `${((emotions.neutral || 0) * 100).toFixed(1)}%`;
            if (this.surpriseResult) {
                this.surpriseResult.querySelector('.score').textContent = 
                    `${((emotions.surprised || emotions.surprise || 0) * 100).toFixed(1)}%`;
            }
            if (this.fearfulResult) {
                this.fearfulResult.querySelector('.score').textContent = 
                    `${((emotions.fearful || 0) * 100).toFixed(1)}%`;
            }
            if (this.disgustedResult) {
                this.disgustedResult.querySelector('.score').textContent = 
                    `${((emotions.disgusted || 0) * 100).toFixed(1)}%`;
            }
        }

        convertFaceApiEmotions(expressions) {
            // Convert face-api.js emotions to our format, always include 'surprise'
            const surprise = (typeof expressions.surprise === 'number') ? expressions.surprise : 0;
            if (surprise === 0) {
                console.warn('Surprise value from face-api.js is 0 or undefined:', expressions);
            }
            return {
                happy: expressions.happy || 0,
                sad: expressions.sad || 0,
                angry: expressions.angry || 0,
                neutral: expressions.neutral || 0,
                surprise: surprise
            };
        }

        async drawFaceOverlay(emotions) {
            if (!this.videoFeed || !this.videoOverlay) return;
            const ctx = this.videoOverlay.getContext('2d');
            ctx.clearRect(0, 0, this.videoOverlay.width, this.videoOverlay.height);
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
            const canvas = this.audioVisualizer;
            const ctx = canvas.getContext('2d');
            canvas.width = this.audioVisualizer.clientWidth;
            canvas.height = this.audioVisualizer.clientHeight;

            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const draw = () => {
                if (this.mediaRecorder?.state === 'recording') {
                    requestAnimationFrame(draw);
                    this.analyser.getByteFrequencyData(dataArray);

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
                    const db = this.emotionAnalyzer.currentDb || -100;
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
            
            const canvas = document.getElementById('snapshotCanvas');
            const context = canvas.getContext('2d');
            const container = document.getElementById('snapshotContainer');
            const emotionElement = document.getElementById('snapshotEmotion');
            const timestampElement = document.getElementById('snapshotTimestamp');
            
            try {
                // Show loading state
                if (emotionElement) {
                    emotionElement.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>Menganalisis...</span>';
                }
                
                // Set canvas size to match video
                canvas.width = this.videoElement.videoWidth;
                canvas.height = this.videoElement.videoHeight;
                
                // Draw current video frame to canvas
                context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
                
                // Add flash effect
                container.classList.add('snapshot-flash');
                setTimeout(() => container.classList.remove('snapshot-flash'), 500);
                
                // Show the snapshot container
                if (container) {
                    container.style.display = 'block';
                }
                
                // Analyze the snapshot
                const detections = await this.emotionAnalyzer.analyzeVideo(this.videoElement);
                
                if (detections && detections.expressions) {
                    // Update emotion display
                    const dominantExpression = Object.entries(detections.expressions).reduce(
                        (a, b) => a[1] > b[1] ? a : b
                    );
                    
                    const emotionMap = {
                        'happy': { icon: 'smile', label: 'Senang' },
                        'sad': { icon: 'sad-tear', label: 'Sedih' },
                        'angry': { icon: 'angry', label: 'Marah' },
                        'fearful': { icon: 'surprise', label: 'Takut' },
                        'surprised': { icon: 'surprise', label: 'Terkejut' },
                        'disgusted': { icon: 'grimace', label: 'Jijik' },
                        'neutral': { icon: 'meh', label: 'Netral' }
                    };
                    
                    const emotion = emotionMap[dominantExpression[0]] || emotionMap['neutral'];
                    const confidence = Math.round(dominantExpression[1] * 100);
                    
                    if (emotionElement) {
                        emotionElement.innerHTML = `
                            <i class="fas fa-${emotion.icon}"></i>
                            <span>${emotion.label} (${confidence}%)</span>`;
                    }
                    
                    // Save snapshot data
                    this.currentSnapshot = {
                        imageData: canvas.toDataURL('image/png'),
                        emotion: dominantExpression[0],
                        confidence,
                        timestamp: new Date()
                    };
                    
                    // Update timestamp
                    if (timestampElement) {
                        timestampElement.textContent = `Diambil pada: ${this.currentSnapshot.timestamp.toLocaleString()}`;
                    }
                    
                    // Enable buttons
                    document.getElementById('downloadSnapshot').disabled = false;
                    document.getElementById('deleteSnapshot').disabled = false;
                }
                
            } catch (error) {
                console.error('Error taking snapshot:', error);
                if (emotionElement) {
                    emotionElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>Gagal menganalisis</span>';
                }
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
    }
}
    