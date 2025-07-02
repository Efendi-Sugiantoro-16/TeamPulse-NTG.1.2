/**
 * Camera Manager Component
 * Handles camera operations and face detection
 */

class CameraManager {
    constructor(config = {}) {
        this.config = {
            faceDetectionInterval: 200,
            confidenceThreshold: 0.6,
            ...config
        };
        
        this.cameraStream = null;
        this.analysisInterval = null;
        this.isActive = false;
        this.eventListeners = new Map();
        
        // Face detection state
        this.faceApiLoaded = false;
        this.lastDetection = null;
        
        console.log('CameraManager: Initialized');
    }

    async start() {
        try {
            console.log('CameraManager: Starting camera...');
            
            // Get camera stream
            this.cameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                }
            });
            
            // Setup video element
            const video = document.getElementById('cameraVideo');
            if (video) {
                video.srcObject = this.cameraStream;
                video.style.transform = 'scaleX(1)';
                try {
                    await video.play();
                } catch (err) {
                    console.warn('CameraManager: video.play() failed:', err);
                }
            }
            
            // Initialize face detection
            await this.initializeFaceDetection();
            
            // Start analysis
            this.startFaceDetection();
            
            this.isActive = true;
            
            // Emit camera started event
            this.emit('cameraStarted');
            
            console.log('CameraManager: Camera started successfully');
            
            // Setelah video.play() berhasil di fungsi start(), tambahkan event listener agar canvas selalu mengikuti ukuran video
            if (video) {
                video.addEventListener('loadedmetadata', () => {
                    const canvas = document.getElementById('cameraCanvas');
                    if (canvas) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        canvas.style.width = video.videoWidth + 'px';
                        canvas.style.height = video.videoHeight + 'px';
                        video.style.width = video.videoWidth + 'px';
                        video.style.height = video.videoHeight + 'px';
                    }
                });
            }
            
        } catch (error) {
            console.error('CameraManager: Failed to start camera:', error);
            throw error;
        }
    }

    stop() {
        console.log('CameraManager: Stopping camera...');
        
        // Stop camera stream
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        
        // Stop analysis
        this.stopFaceDetection();
        
        // Clear video
        const video = document.getElementById('cameraVideo');
        if (video) {
            video.srcObject = null;
        }
        
        // Clear canvas
        const canvas = document.getElementById('cameraCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        this.isActive = false;
        
        // Emit camera stopped event
        this.emit('cameraStopped');
        
        console.log('CameraManager: Camera stopped');
    }

    async initializeFaceDetection() {
        try {
            console.log('CameraManager: Initializing face detection...');
            
            // Check if face-api.js is available
            if (typeof faceapi === 'undefined') {
                throw new Error('face-api.js not loaded');
            }
            
            // Check if we're running on a local file system
            if (window.location.protocol === 'file:') {
                throw new Error('face-api.js requires a web server. Please use a local server like Python http.server or Live Server VSCode.');
            }
            
            const modelPath = './models';
            
            // Load models with timeout
            const modelLoadPromises = [
                faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
                faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
                faceapi.nets.faceExpressionNet.loadFromUri(modelPath)
            ];
            
            await Promise.allSettled(modelLoadPromises);
            
            // Check if models loaded successfully (kompatibel semua versi)
            const modelsLoaded = [
                faceapi.nets.tinyFaceDetector && (typeof faceapi.nets.tinyFaceDetector.isLoaded === 'function'
                    ? faceapi.nets.tinyFaceDetector.isLoaded()
                    : !!faceapi.nets.tinyFaceDetector.params),
                faceapi.nets.faceLandmark68Net && (typeof faceapi.nets.faceLandmark68Net.isLoaded === 'function'
                    ? faceapi.nets.faceLandmark68Net.isLoaded()
                    : !!faceapi.nets.faceLandmark68Net.params),
                faceapi.nets.faceExpressionNet && (typeof faceapi.nets.faceExpressionNet.isLoaded === 'function'
                    ? faceapi.nets.faceExpressionNet.isLoaded()
                    : !!faceapi.nets.faceExpressionNet.params)
            ];
            
            if (modelsLoaded.every(Boolean)) {
                this.faceApiLoaded = true;
                console.log('CameraManager: Face detection initialized successfully');
            } else {
                throw new Error('Some face-api.js models failed to load');
            }
            
        } catch (error) {
            console.error('CameraManager: Face detection initialization failed:', error);
            throw error;
        }
    }

    startFaceDetection() {
        if (!this.faceApiLoaded) {
            console.warn('CameraManager: Face detection not available, using simulation');
            this.startSimulation();
            return;
        }
        
        console.log('CameraManager: Starting face detection...');
        
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        
        if (!video || !canvas) {
            console.error('CameraManager: Video or canvas element not found');
            return;
        }
        
        // Set canvas size
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        const detectFaces = async () => {
            if (!this.isActive || !this.cameraStream || video.readyState < 2) return;
            
            try {
                const detections = await faceapi.detectAllFaces(
                    video,
                    new faceapi.TinyFaceDetectorOptions({ 
                        inputSize: 224, 
                        scoreThreshold: 0.5 
                    })
                ).withFaceLandmarks().withFaceExpressions();
                
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                if (detections.length > 0) {
                    const resizedDetections = faceapi.resizeResults(detections, {
                        width: canvas.width,
                        height: canvas.height
                    });
                    
                    faceapi.draw.drawDetections(canvas, resizedDetections);
                    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
                    
                    const face = detections[0];
                    const expressions = face.expressions;
                    const dominantExpression = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b);
                    
                    const emotion = this.mapExpressionToEmotion(dominantExpression[0]);
                    const confidence = dominantExpression[1];
                    
                    const detectionData = {
                        emotion: emotion,
                        dominantEmotion: emotion,
                        confidence: confidence,
                        expressions: expressions,
                        source: 'camera',
                        timestamp: new Date().toISOString()
                    };
                    
                    this.lastDetection = detectionData;
                    this.emit('emotionDetected', detectionData);
                    
                } else {
                    this.emit('noFaceDetected');
                }
                
            } catch (error) {
                console.error('CameraManager: Face detection error:', error);
                this.emit('detectionError', error);
            }
        };
        
        this.analysisInterval = setInterval(detectFaces, this.config.faceDetectionInterval);
    }

    startSimulation() {
        console.log('CameraManager: Starting simulation mode...');
        
        const simulateDetection = () => {
            if (!this.isActive) return;
            
            const emotions = ['happy', 'sad', 'angry', 'excited', 'fearful', 'surprised', 'neutral', 'confused'];
            const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
            const confidence = 0.5 + Math.random() * 0.5;
            
            const detectionData = {
                emotion: randomEmotion,
                dominantEmotion: randomEmotion,
                confidence: confidence,
                expressions: {},
                source: 'camera_simulation',
                timestamp: new Date().toISOString()
            };
            
            this.lastDetection = detectionData;
            this.emit('emotionDetected', detectionData);
        };
        
        this.analysisInterval = setInterval(simulateDetection, 2000);
    }

    stopFaceDetection() {
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }
    }

    async captureSnapshot() {
        try {
            console.log('CameraManager: Capturing snapshot...');
            
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
                        new faceapi.TinyFaceDetectorOptions()
                    ).withFaceLandmarks().withFaceExpressions();
                    
                    if (detections.length > 0) {
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
                    console.warn('CameraManager: Snapshot analysis failed:', error);
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
            
            console.log('CameraManager: Snapshot captured');
            return detectionData;
            
        } catch (error) {
            console.error('CameraManager: Snapshot failed:', error);
            throw error;
        }
    }

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

    isActive() {
        return this.isActive;
    }

    getLastDetection() {
        return this.lastDetection;
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
                    console.error('CameraManager: Event callback error:', error);
                }
            });
        }
    }

    destroy() {
        this.stop();
        this.eventListeners.clear();
        this.faceApiLoaded = false;
        this.lastDetection = null;
    }
}

window.CameraManager = CameraManager; 