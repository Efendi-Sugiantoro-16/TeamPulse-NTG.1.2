/**
 * Audio Recorder with Real-time Spectrogram
 * Complete microphone system with audio visualization
 */

class AudioRecorder {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.mediaStream = null;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordedAudio = null;
        
        // Spectrogram
        this.spectrogramCanvas = null;
        this.spectrogramCtx = null;
        this.spectrogramData = [];
        this.maxSpectrogramLength = 200;
        
        // Audio level
        this.audioLevel = 0;
        this.silenceThreshold = -50;
        
        // Configuration
        this.config = {
            sampleRate: 44100,
            fftSize: 2048,
            spectrogramHeight: 200,
            spectrogramWidth: 400
        };
        
        // Callbacks
        this.callbacks = {};
        
        console.log('Audio Recorder initialized');
    }

    async initialize() {
        try {
            console.log('Initializing Audio Recorder...');
            
            // Initialize audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.config.fftSize;
            this.analyser.smoothingTimeConstant = 0.8;
            
            // Initialize spectrogram canvas
            this.initializeSpectrogram();
            
            console.log('Audio Recorder ready');
            return true;
        } catch (error) {
            console.error('Audio Recorder initialization failed:', error);
            return false;
        }
    }

    initializeSpectrogram() {
        this.spectrogramCanvas = document.getElementById('spectrogramCanvas');
        if (this.spectrogramCanvas) {
            this.spectrogramCtx = this.spectrogramCanvas.getContext('2d');
            this.spectrogramCanvas.width = this.config.spectrogramWidth;
            this.spectrogramCanvas.height = this.config.spectrogramHeight;
            this.clearSpectrogram();
        }
    }

    clearSpectrogram() {
        if (this.spectrogramCtx) {
            this.spectrogramCtx.fillStyle = '#000';
            this.spectrogramCtx.fillRect(0, 0, this.spectrogramCanvas.width, this.spectrogramCanvas.height);
        }
    }

    async startRecording() {
        if (this.isRecording) return;
        
        try {
            // Request microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: this.config.sampleRate,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Connect to audio context
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);
            
            // Initialize MediaRecorder for recording
            this.mediaRecorder = new MediaRecorder(this.mediaStream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.recordedAudio = URL.createObjectURL(audioBlob);
                console.log('Audio recording completed');
                
                if (this.callbacks.onRecordingComplete) {
                    this.callbacks.onRecordingComplete(this.recordedAudio);
                }
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            this.startAnalysisLoop();
            
            console.log('Audio recording started');
            
            if (this.callbacks.onRecordingStart) {
                this.callbacks.onRecordingStart();
            }
        } catch (error) {
            console.error('Recording failed:', error);
            throw error;
        }
    }

    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        console.log('Audio recording stopped');
        
        if (this.callbacks.onRecordingStop) {
            this.callbacks.onRecordingStop();
        }
    }

    startAnalysisLoop() {
        const analyze = () => {
            if (!this.isRecording) return;
            
            try {
                this.updateSpectrogram();
                this.updateAudioLevel();
            } catch (error) {
                console.error('Analysis error:', error);
            }
            
            requestAnimationFrame(analyze);
        };
        
        analyze();
    }

    updateSpectrogram() {
        if (!this.spectrogramCtx) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const frequencyData = new Float32Array(bufferLength);
        this.analyser.getFloatFrequencyData(frequencyData);
        
        // Add new frequency data to spectrogram
        this.spectrogramData.push(frequencyData);
        if (this.spectrogramData.length > this.maxSpectrogramLength) {
            this.spectrogramData.shift();
        }
        
        // Clear canvas
        this.spectrogramCtx.fillStyle = '#000';
        this.spectrogramCtx.fillRect(0, 0, this.spectrogramCanvas.width, this.spectrogramCanvas.height);
        
        // Draw spectrogram
        const sliceWidth = this.spectrogramCanvas.width / this.spectrogramData.length;
        const binHeight = this.spectrogramCanvas.height / frequencyData.length;
        
        for (let i = 0; i < this.spectrogramData.length; i++) {
            const slice = this.spectrogramData[i];
            const x = i * sliceWidth;
            
            for (let j = 0; j < slice.length; j++) {
                const y = this.spectrogramCanvas.height - (j * binHeight);
                const magnitude = (slice[j] + 140) / 140; // Normalize to 0-1
                const intensity = Math.max(0, Math.min(1, magnitude));
                
                // Color mapping based on frequency and intensity
                const hue = (j / slice.length) * 360;
                const saturation = 100;
                const lightness = 50 + (intensity * 50);
                
                this.spectrogramCtx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                this.spectrogramCtx.fillRect(x, y, sliceWidth, binHeight);
            }
        }
    }

    updateAudioLevel() {
        const bufferLength = this.analyser.frequencyBinCount;
        const timeData = new Float32Array(bufferLength);
        this.analyser.getFloatTimeDomainData(timeData);
        
        // Calculate RMS (Root Mean Square) for audio level
        let sum = 0;
        for (let i = 0; i < timeData.length; i++) {
            sum += timeData[i] * timeData[i];
        }
        const rms = Math.sqrt(sum / timeData.length);
        
        // Convert to dB
        this.audioLevel = 20 * Math.log10(rms);
        
        // Update UI if callback exists
        if (this.callbacks.onAudioLevel) {
            this.callbacks.onAudioLevel(this.audioLevel);
        }
    }

    getAudioLevel() {
        return this.audioLevel;
    }

    getRecordedAudio() {
        return this.recordedAudio;
    }

    playRecording() {
        if (!this.recordedAudio) return;
        
        const audio = new Audio(this.recordedAudio);
        audio.play().catch(error => {
            console.error('Failed to play recording:', error);
        });
    }

    downloadRecording(filename = 'recording.wav') {
        if (!this.recordedAudio) return;
        
        const link = document.createElement('a');
        link.href = this.recordedAudio;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    cleanup() {
        this.stopRecording();
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        if (this.recordedAudio) {
            URL.revokeObjectURL(this.recordedAudio);
        }
        
        console.log('Audio Recorder cleaned up');
    }
}

window.AudioRecorder = AudioRecorder; 