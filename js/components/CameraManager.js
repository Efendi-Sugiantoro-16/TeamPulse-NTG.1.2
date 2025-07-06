/**
 * Camera Manager Component
 * Handles camera operations and face detection
 */

class CameraManager {
    constructor(config = {}) {
        this.config = {
            faceDetectionInterval: 150,
            confidenceThreshold: 0.7,
            ...config
        };
        
        this.cameraStream = null;
        this.analysisInterval = null;
        this.isActive = false;
        this.eventListeners = new Map();
        
        // Face detection state
        this.faceApiLoaded = false;
        this.lastDetection = null;
        this.detectionCount = 0;
        this.lastDetectionTime = 0;
        
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
                this.syncCanvasToVideo();
                video.addEventListener('loadedmetadata', () => this.syncCanvasToVideo());
                video.addEventListener('resize', () => this.syncCanvasToVideo());
            }
            
            // Initialize face detection
            await this.initializeFaceDetection();
            
            // Start analysis
            this.startFaceDetection();
            
            this.isActive = true;
            
            // Emit camera started event
            this.emit('cameraStarted');
            
            console.log('CameraManager: Camera started successfully');
            
        } catch (error) {
            console.error('CameraManager: Failed to start camera:', error);
            throw error;
        }
    }

    syncCanvasToVideo() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        if (video && canvas) {
            const w = video.videoWidth || 640;
            const h = video.videoHeight || 480;
            canvas.width = w;
            canvas.height = h;
            video.width = w;
            video.height = h;
            // Style for responsive display
            canvas.style.width = video.style.width = '100%';
            canvas.style.height = video.style.height = '100%';
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
            // Pastikan canvas sinkron dengan video
            this.syncCanvasToVideo();
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
            
            // Performance optimization: skip if too frequent
            const now = Date.now();
            if (now - this.lastDetectionTime < 50) return; // Max 20 FPS
            this.lastDetectionTime = now;
            
            try {
                // Sinkronisasi ukuran
                this.syncCanvasToVideo();
                // Clear canvas, jangan gambar video ke canvas
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Deteksi wajah dengan parameter yang lebih akurat
                const detections = await faceapi.detectAllFaces(
                    video,
                    new faceapi.TinyFaceDetectorOptions({ 
                        inputSize: 320,  // Increased for better accuracy
                        scoreThreshold: this.config.confidenceThreshold  // Use configurable threshold
                    })
                ).withFaceLandmarks().withFaceExpressions();
                
                if (detections.length > 0) {
                    this.detectionCount++;
                    
                    // Enhanced bounding box with gradient and better styling
                    detections.forEach(det => {
                        const box = det.detection.box;
                        
                        // Skip if detection confidence is too low
                        if (det.detection.score < this.config.confidenceThreshold) return;
                        
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
                        if (det.landmarks && det.detection.score >= this.config.confidenceThreshold) {
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
                    
                    // Hapus faceapi bawaan untuk menghindari duplikasi landmark
                    // faceapi.draw.drawDetections(canvas, detections);
                    // faceapi.draw.drawFaceLandmarks(canvas, detections);
                    
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
                        timestamp: new Date().toISOString(),
                        detectionScore: face.detection.score,
                        detectionCount: this.detectionCount
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