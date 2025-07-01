/**
 * Face API Manager - Handles face detection and wireframe drawing
 */
class FaceApiManager {
    constructor() {
        this.isLoaded = false;
        this.isLoading = false;
        this.modelsPath = './models';
        this.canvas = null;
        this.video = null;
        this.ctx = null;
        this.detectionInterval = null;
        this.onFaceDetected = null;
        this.onNoFaceDetected = null;
        this.tensorFlowInit = null;
    }

    /**
     * Initialize face-api.js with proper error handling
     */
    async init() {
        try {
            console.log('Initializing Face API Manager...');
            
            if (this.isLoaded) {
                console.log('Face API already loaded');
                return true;
            }

            if (this.isLoading) {
                console.log('Face API is already loading...');
                return false;
            }

            this.isLoading = true;

            // Check if face-api.js is available
            if (typeof faceapi === 'undefined') {
                throw new Error('face-api.js not loaded');
            }

            // Initialize TensorFlow.js first
            await this.initializeTensorFlow();

            // Load face detection models
            await this.loadModels();

            this.isLoaded = true;
            this.isLoading = false;
            console.log('Face API Manager initialized successfully');
            return true;

        } catch (error) {
            console.error('Failed to initialize Face API Manager:', error);
            this.isLoading = false;
            return false;
        }
    }

    /**
     * Initialize TensorFlow.js using TensorFlowInit
     */
    async initializeTensorFlow() {
        try {
            console.log('Initializing TensorFlow.js...');
            
            // Check if TensorFlowInit is available
            if (typeof TensorFlowInit === 'undefined') {
                throw new Error('TensorFlowInit not loaded');
            }
            
            // Create TensorFlowInit instance
            this.tensorFlowInit = new TensorFlowInit();
            
            // Initialize TensorFlow.js
            await this.tensorFlowInit.init();
            
            console.log('TensorFlow.js initialized successfully');
            
        } catch (error) {
            console.error('TensorFlow.js initialization failed:', error);
            throw error;
        }
    }

    /**
     * Load face detection models
     */
    async loadModels() {
        try {
            console.log('Loading face detection models...');

            // Load models in parallel
            const modelPromises = [
                faceapi.nets.tinyFaceDetector.loadFromUri(this.modelsPath),
                faceapi.nets.faceLandmark68Net.loadFromUri(this.modelsPath),
                faceapi.nets.faceExpressionNet.loadFromUri(this.modelsPath)
            ];

            await Promise.all(modelPromises);
            console.log('All face detection models loaded successfully');

        } catch (error) {
            console.error('Failed to load face detection models:', error);
            throw error;
        }
    }

    /**
     * Set up video and canvas for face detection
     */
    setupVideoAndCanvas(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');

        // Wait for video to be ready before setting canvas size
        const setupCanvas = () => {
            if (this.video.videoWidth && this.video.videoHeight) {
                // Set canvas size to match video
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                console.log('Video and canvas setup complete:', this.canvas.width, 'x', this.canvas.height);
            } else {
                // Retry after a short delay
                setTimeout(setupCanvas, 100);
            }
        };

        setupCanvas();
    }

    /**
     * Start face detection with wireframe drawing
     */
    startDetection(options = {}) {
        if (!this.isLoaded || !this.video || !this.canvas) {
            console.error('Face API not ready or video/canvas not set');
            return false;
        }

        const {
            interval = 100,
            drawWireframe = true,
            drawLandmarks = true,
            drawExpressions = true
        } = options;

        console.log('Starting face detection...');

        this.detectionInterval = setInterval(async () => {
            try {
                await this.detectAndDraw();
            } catch (error) {
                console.error('Face detection error:', error);
            }
        }, interval);

        return true;
    }

    /**
     * Stop face detection
     */
    stopDetection() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
            console.log('Face detection stopped');
        }
    }

    /**
     * Detect faces and draw wireframe
     */
    async detectAndDraw() {
        if (!this.video || !this.canvas || !this.ctx) return;

        try {
            // Check if video is ready
            if (this.video.readyState !== 4) {
                return; // Video not ready yet
            }

            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Detect faces with landmarks and expressions
            const detections = await faceapi
                .detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions();

            if (detections.length > 0) {
                // Draw wireframe for each detected face
                detections.forEach(detection => {
                    this.drawFaceWireframe(detection);
                });

                // Get first face for emotion analysis
                const firstFace = detections[0];
                const emotion = this.analyzeEmotion(firstFace.expressions);
                
                if (this.onFaceDetected) {
                    this.onFaceDetected({
                        emotion: emotion.dominant,
                        confidence: emotion.confidence,
                        expressions: firstFace.expressions,
                        landmarks: firstFace.landmarks,
                        detection: firstFace.detection
                    });
                }
            } else {
                if (this.onNoFaceDetected) {
                    this.onNoFaceDetected();
                }
            }

        } catch (error) {
            console.error('Face detection and drawing error:', error);
            // Don't throw error, just log it to avoid breaking the detection loop
        }
    }

    /**
     * Draw face wireframe with landmarks
     */
    drawFaceWireframe(detection) {
        const { landmarks, detection: faceDetection } = detection;

        // Draw face detection box
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            faceDetection.box.x,
            faceDetection.box.y,
            faceDetection.box.width,
            faceDetection.box.height
        );

        // Draw face landmarks
        this.drawLandmarks(landmarks.positions);

        // Draw facial features
        this.drawFacialFeatures(landmarks);
    }

    /**
     * Draw face landmarks
     */
    drawLandmarks(positions) {
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = '#ff0000';

        // Draw all landmark points
        positions.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            this.ctx.fill();
        });

        // Draw landmark connections
        this.drawLandmarkConnections(positions);
    }

    /**
     * Draw connections between landmarks
     */
    drawLandmarkConnections(positions) {
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 1;

        // Face outline (landmarks 0-16)
        this.drawLandmarkLine(positions, 0, 16);

        // Left eyebrow (landmarks 17-21)
        this.drawLandmarkLine(positions, 17, 21);

        // Right eyebrow (landmarks 22-26)
        this.drawLandmarkLine(positions, 22, 26);

        // Nose bridge (landmarks 27-30)
        this.drawLandmarkLine(positions, 27, 30);

        // Nose bottom (landmarks 31-35)
        this.drawLandmarkLine(positions, 31, 35);

        // Left eye (landmarks 36-41)
        this.drawLandmarkLine(positions, 36, 41);
        this.ctx.lineTo(positions[36].x, positions[36].y);

        // Right eye (landmarks 42-47)
        this.drawLandmarkLine(positions, 42, 47);
        this.ctx.lineTo(positions[42].x, positions[42].y);

        // Outer mouth (landmarks 48-59)
        this.drawLandmarkLine(positions, 48, 59);
        this.ctx.lineTo(positions[48].x, positions[48].y);

        // Inner mouth (landmarks 60-67)
        this.drawLandmarkLine(positions, 60, 67);
        this.ctx.lineTo(positions[60].x, positions[60].y);
    }

    /**
     * Draw line between landmark points
     */
    drawLandmarkLine(positions, start, end) {
        this.ctx.beginPath();
        this.ctx.moveTo(positions[start].x, positions[start].y);
        
        for (let i = start + 1; i <= end; i++) {
            this.ctx.lineTo(positions[i].x, positions[i].y);
        }
        
        this.ctx.stroke();
    }

    /**
     * Draw facial features (eyes, nose, mouth)
     */
    drawFacialFeatures(landmarks) {
        // Draw eyes
        this.drawEye(landmarks.getLeftEye(), '#ffff00');
        this.drawEye(landmarks.getRightEye(), '#ffff00');

        // Draw mouth
        this.drawMouth(landmarks.getMouth(), '#ff00ff');
    }

    /**
     * Draw eye outline
     */
    drawEye(eyePoints, color) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(eyePoints[0].x, eyePoints[0].y);
        
        for (let i = 1; i < eyePoints.length; i++) {
            this.ctx.lineTo(eyePoints[i].x, eyePoints[i].y);
        }
        
        this.ctx.closePath();
        this.ctx.stroke();
    }

    /**
     * Draw mouth outline
     */
    drawMouth(mouthPoints, color) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(mouthPoints[0].x, mouthPoints[0].y);
        
        for (let i = 1; i < mouthPoints.length; i++) {
            this.ctx.lineTo(mouthPoints[i].x, mouthPoints[i].y);
        }
        
        this.ctx.closePath();
        this.ctx.stroke();
    }

    /**
     * Analyze emotion from facial expressions
     */
    analyzeEmotion(expressions) {
        const emotionEntries = Object.entries(expressions);
        const dominantEmotion = emotionEntries.reduce((a, b) => a[1] > b[1] ? a : b);
        
        return {
            dominant: dominantEmotion[0],
            confidence: dominantEmotion[1],
            allExpressions: expressions
        };
    }

    /**
     * Set callbacks for face detection events
     */
    setCallbacks(onFaceDetected, onNoFaceDetected) {
        this.onFaceDetected = onFaceDetected;
        this.onNoFaceDetected = onNoFaceDetected;
    }

    /**
     * Check if face-api.js is ready
     */
    isReady() {
        return this.isLoaded && 
               typeof faceapi !== 'undefined' && 
               this.tensorFlowInit && 
               this.tensorFlowInit.isReady();
    }

    /**
     * Get loading status
     */
    getLoadingStatus() {
        return {
            isLoaded: this.isLoaded,
            isLoading: this.isLoading,
            tensorFlowReady: this.tensorFlowInit ? this.tensorFlowInit.isReady() : false,
            tensorFlowBackend: this.tensorFlowInit ? this.tensorFlowInit.getBackend() : null
        };
    }
}

// Global instance
window.FaceApiManager = FaceApiManager; 