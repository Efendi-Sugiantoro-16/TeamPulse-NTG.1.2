/**
 * UI Manager Component
 * Handles all UI interactions and updates
 */

class UIManager {
    constructor() {
        this.elements = {};
        this.eventListeners = new Map();
        this.isInitialized = false;
    }

    init() {
        try {
            console.log('UIManager: Initializing...');
            
            this.initializeElements();
            this.setupEventListeners();
            this.initializeTabs();
            
            this.isInitialized = true;
            console.log('UIManager: Initialized successfully');
            
        } catch (error) {
            console.error('UIManager: Initialization failed:', error);
            throw error;
        }
    }

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
        
        // Export elements
        this.elements.exportBtn = document.getElementById('exportBtn');
        this.elements.exportModal = document.getElementById('exportModal');
        
        // Snapshot elements
        this.elements.startSnapshotCameraBtn = document.getElementById('startSnapshotCameraBtn');
        this.elements.stopSnapshotCameraBtn = document.getElementById('stopSnapshotCameraBtn');
        this.elements.captureSnapshotBtn2 = document.getElementById('captureSnapshotBtn2');
        this.elements.snapshotCameraStatus = document.getElementById('snapshotCameraStatus');
        this.elements.snapshotCameraVideo = document.getElementById('snapshotCameraVideo');
        this.elements.snapshotCameraCanvas = document.getElementById('snapshotCameraCanvas');
        this.elements.snapshotPreview = document.getElementById('snapshotPreview');
        this.elements.snapshotEmotion = document.getElementById('snapshotEmotion');
        this.elements.snapshotConfidenceMeter = document.getElementById('snapshotConfidenceMeter');
        this.elements.snapshotFaceDetected = document.getElementById('snapshotFaceDetected');
        
        console.log('UIManager: Elements initialized');
    }

    setupEventListeners() {
        // Tab navigation
        this.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
                this.emit('tabChange', tabName);
            });
        });

        // Camera controls
        if (this.elements.startCameraBtn) {
            this.elements.startCameraBtn.addEventListener('click', () => {
                this.emit('startCamera');
            });
        }
        
        if (this.elements.stopCameraBtn) {
            this.elements.stopCameraBtn.addEventListener('click', () => {
                this.emit('stopCamera');
            });
        }
        
        if (this.elements.captureSnapshotBtn) {
            this.elements.captureSnapshotBtn.addEventListener('click', () => {
                this.emit('captureSnapshot');
            });
        }

        // Audio controls
        if (this.elements.startAudioBtn) {
            this.elements.startAudioBtn.addEventListener('click', () => {
                this.emit('startAudio');
            });
        }
        
        if (this.elements.stopAudioBtn) {
            this.elements.stopAudioBtn.addEventListener('click', () => {
                this.emit('stopAudio');
            });
        }
        
        if (this.elements.recordAudioBtn) {
            this.elements.recordAudioBtn.addEventListener('click', () => {
                this.emit('recordAudio');
            });
        }

        // Text analysis
        if (this.elements.analyzeTextBtn) {
            this.elements.analyzeTextBtn.addEventListener('click', () => {
                const text = this.elements.textInput?.value.trim();
                if (text) {
                    this.emit('analyzeText', text);
                }
            });
        }

        // Text input enter key
        if (this.elements.textInput) {
            this.elements.textInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const text = this.elements.textInput.value.trim();
                    if (text) {
                        this.emit('analyzeText', text);
                    }
                }
            });
        }

        // Data management
        if (this.elements.submitDataBtn) {
            this.elements.submitDataBtn.addEventListener('click', () => {
                this.emit('submitData');
            });
        }

        if (this.elements.exportBtn) {
            this.elements.exportBtn.addEventListener('click', () => {
                this.openExportModal();
            });
        }

        if (this.elements.viewDashboardBtn) {
            this.elements.viewDashboardBtn.addEventListener('click', () => {
                window.location.href = 'dashboard.html';
            });
        }

        // Export modal
        window.addEventListener('click', (e) => {
            if (e.target === this.elements.exportModal) {
                this.closeExportModal();
            }
        });

        // Snapshot controls
        if (this.elements.startSnapshotCameraBtn) {
            this.elements.startSnapshotCameraBtn.addEventListener('click', () => {
                this.emit('startSnapshotCamera');
            });
        }
        if (this.elements.stopSnapshotCameraBtn) {
            this.elements.stopSnapshotCameraBtn.addEventListener('click', () => {
                this.emit('stopSnapshotCamera');
            });
        }
        if (this.elements.captureSnapshotBtn2) {
            this.elements.captureSnapshotBtn2.addEventListener('click', () => {
                this.emit('captureSnapshot2');
            });
        }

        console.log('UIManager: Event listeners setup complete');
    }

    initializeTabs() {
        // Set initial tab
        this.switchTab('camera');
        this.clearAllEmotionDisplays();
    }

    clearAllEmotionDisplays() {
        // Kosongkan semua tampilan emosi dan confidence
        if (this.elements.cameraEmotion) this.elements.cameraEmotion.textContent = '-';
        if (this.elements.cameraConfidenceMeter) {
            this.elements.cameraConfidenceMeter.style.width = '0%';
            const confText = this.elements.cameraConfidenceMeter.parentElement?.querySelector('.confidence-text');
            if (confText) confText.textContent = '0%';
        }
        if (this.elements.faceDetected) this.elements.faceDetected.textContent = 'No';
        if (this.elements.audioEmotion) this.elements.audioEmotion.textContent = '-';
        if (this.elements.audioConfidenceMeter) {
            this.elements.audioConfidenceMeter.style.width = '0%';
            const confText = this.elements.audioConfidenceMeter.parentElement?.querySelector('.confidence-text');
            if (confText) confText.textContent = '0%';
        }
        if (this.elements.voiceQuality) this.elements.voiceQuality.textContent = 'Poor';
        // Jika ada text analysis, kosongkan juga
        if (this.elements.aiAnalysisResults) this.elements.aiAnalysisResults.innerHTML = '';
        if (this.elements.currentEmotion) this.elements.currentEmotion.textContent = '-';
        if (this.elements.emotionSource) this.elements.emotionSource.textContent = '';
        if (this.elements.submitDataBtn) this.elements.submitDataBtn.disabled = true;
    }

    switchTab(tabName) {
        console.log('UIManager: Switching to tab:', tabName);
        
        // Update tab buttons
        this.elements.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update input sections
        this.elements.inputSections.forEach(section => {
            section.classList.toggle('active', section.id === `${tabName}-section`);
        });
        
        // Update button states
        this.updateTabButtonStates(tabName);
    }

    updateTabButtonStates(tabName) {
        // Camera buttons
        if (this.elements.startCameraBtn) {
            this.elements.startCameraBtn.disabled = tabName !== 'camera';
        }
        if (this.elements.stopCameraBtn) {
            this.elements.stopCameraBtn.disabled = tabName !== 'camera';
        }
        if (this.elements.captureSnapshotBtn) {
            this.elements.captureSnapshotBtn.disabled = tabName !== 'camera';
        }
        
        // Audio buttons
        if (this.elements.startAudioBtn) {
            this.elements.startAudioBtn.disabled = tabName !== 'audio';
        }
        if (this.elements.stopAudioBtn) {
            this.elements.stopAudioBtn.disabled = tabName !== 'audio';
        }
        if (this.elements.recordAudioBtn) {
            this.elements.recordAudioBtn.disabled = tabName !== 'audio';
        }
        
        // Text button
        if (this.elements.analyzeTextBtn) {
            this.elements.analyzeTextBtn.disabled = tabName !== 'text';
        }

        // Snapshot buttons
        if (this.elements.startSnapshotCameraBtn) {
            this.elements.startSnapshotCameraBtn.disabled = tabName !== 'snapshot';
        }
        if (this.elements.stopSnapshotCameraBtn) {
            this.elements.stopSnapshotCameraBtn.disabled = tabName !== 'snapshot';
        }
        if (this.elements.captureSnapshotBtn2) {
            this.elements.captureSnapshotBtn2.disabled = tabName !== 'snapshot';
        }
    }

    // Update camera button states when camera is started/stopped
    updateCameraButtonStates(isActive) {
        if (this.elements.startCameraBtn) {
            this.elements.startCameraBtn.disabled = isActive;
        }
        if (this.elements.stopCameraBtn) {
            this.elements.stopCameraBtn.disabled = !isActive;
        }
        if (this.elements.captureSnapshotBtn) {
            this.elements.captureSnapshotBtn.disabled = !isActive;
        }
    }

    // Update audio button states when audio is started/stopped
    updateAudioButtonStates(isActive) {
        if (this.elements.startAudioBtn) {
            this.elements.startAudioBtn.disabled = isActive;
        }
        if (this.elements.stopAudioBtn) {
            this.elements.stopAudioBtn.disabled = !isActive;
        }
        if (this.elements.recordAudioBtn) {
            this.elements.recordAudioBtn.disabled = !isActive;
        }
    }

    updateTabUI(tabName) {
        // Reset UI for inactive tabs
        if (tabName !== 'camera') {
            this.updateCameraStatus('Camera not active');
            this.updateCameraEmotion('-');
            this.updateCameraConfidence(0);
            this.updateFaceDetected('No');
        }
        
        if (tabName !== 'audio') {
            this.updateAudioStatus('Audio analysis not active');
            this.updateAudioEmotion('-');
            this.updateAudioConfidence(0);
            this.updateVoiceQuality('Poor');
            this.updateAudioLevel(0);
        }
        
        if (tabName !== 'text') {
            this.clearTextResults();
        }

        if (tabName !== 'snapshot') {
            this.updateSnapshotUI('reset');
        }
    }

    // Camera UI updates
    updateCameraStatus(status) {
        if (this.elements.cameraStatus) {
            this.elements.cameraStatus.textContent = status;
        }
    }

    updateCameraEmotion(emotion) {
        if (this.elements.cameraEmotion) {
            this.elements.cameraEmotion.textContent = emotion;
        }
    }

    updateCameraConfidence(confidence) {
        if (this.elements.cameraConfidenceMeter) {
            this.elements.cameraConfidenceMeter.style.width = `${confidence * 100}%`;
        }
        
        const confidenceText = document.querySelector('#cameraConfidenceMeter + .confidence-text');
        if (confidenceText) {
            confidenceText.textContent = `${(confidence * 100).toFixed(0)}%`;
        }
    }

    updateFaceDetected(status) {
        if (this.elements.faceDetected) {
            this.elements.faceDetected.textContent = status;
        }
    }

    // Audio UI updates
    updateAudioStatus(status) {
        if (this.elements.audioStatus) {
            this.elements.audioStatus.textContent = status;
        }
    }

    updateAudioEmotion(emotion) {
        if (this.elements.audioEmotion) {
            this.elements.audioEmotion.textContent = emotion;
        }
    }

    updateAudioConfidence(confidence) {
        if (this.elements.audioConfidenceMeter) {
            this.elements.audioConfidenceMeter.style.width = `${confidence * 100}%`;
        }
        
        const confidenceText = document.querySelector('#audioConfidenceMeter + .confidence-text');
        if (confidenceText) {
            confidenceText.textContent = `${(confidence * 100).toFixed(0)}%`;
        }
    }

    updateVoiceQuality(quality) {
        if (this.elements.voiceQuality) {
            this.elements.voiceQuality.textContent = quality;
        }
    }

    updateAudioLevel(level) {
        if (this.elements.audioLevelFill) {
            this.elements.audioLevelFill.style.width = `${level * 100}%`;
        }
        
        if (this.elements.audioLevelText) {
            const db = 20 * Math.log10(level);
            this.elements.audioLevelText.textContent = `${db.toFixed(1)} dB`;
        }
    }

    // Text analysis UI updates
    clearTextResults() {
        if (this.elements.aiAnalysisResults) {
            this.elements.aiAnalysisResults.innerHTML = '';
        }
        
        if (this.elements.textInput) {
            this.elements.textInput.value = '';
        }
    }

    updateTextResults(analysis) {
        if (!this.elements.aiAnalysisResults) return;
        
        const resultHTML = `
            <div class="analysis-result">
                <h4>AI Analysis Results</h4>
                <div class="result-item">
                    <span class="label">Detected Emotion:</span>
                    <span class="value emotion-${analysis.emotion || analysis.dominantEmotion || '-'}">${analysis.emotion || analysis.dominantEmotion || '-'}</span>
                </div>
                <div class="result-item">
                    <span class="label">Confidence:</span>
                    <span class="value">${(analysis.confidence * 100).toFixed(1)}%</span>
                </div>
                <div class="result-item">
                    <span class="label">Sentiment:</span>
                    <span class="value sentiment-${analysis.sentiment}">${analysis.sentiment}</span>
                </div>
                ${analysis.keywords && analysis.keywords.length > 0 ? `
                    <div class="result-item">
                        <span class="label">Keywords:</span>
                        <span class="value">${analysis.keywords.join(', ')}</span>
                    </div>
                ` : ''}
            </div>
        `;
        
        this.elements.aiAnalysisResults.innerHTML = resultHTML;
    }

    // Emotion display updates
    updateEmotionDisplay(data) {
        if (this.elements.currentEmotion) {
            this.elements.currentEmotion.textContent = data.emotion || data.dominantEmotion || '-';
            this.elements.currentEmotion.className = `emotion-display ${data.emotion || data.dominantEmotion || '-'}`;
        }
        
        if (this.elements.emotionSource) {
            const sourceText = {
                camera: 'Camera Analysis',
                audio: 'Voice Analysis',
                text: 'AI Text Analysis',
                camera_snapshot: 'Camera Snapshot',
                manual_submission: 'Manual Submission'
            };
            this.elements.emotionSource.textContent = sourceText[data.source] || data.source;
        }
        
        // Enable/disable submit button - allow all emotions including neutral
        if (this.elements.submitDataBtn) {
            const hasValidEmotion = !!data.emotion; // Allow all emotions including neutral
            this.elements.submitDataBtn.disabled = !hasValidEmotion;
        }
    }

    updateSessionStats(session) {
        if (this.elements.analysisCount) {
            this.elements.analysisCount.textContent = session.analysisCount;
        }
        
        if (this.elements.storageStatus) {
            this.elements.storageStatus.textContent = 'Data saved';
        }
    }

    addToHistory(data, source) {
        if (!this.elements.emotionHistory) return;
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const time = new Date(data.timestamp).toLocaleTimeString();
        const sourceIcon = this.getSourceIcon(source);
        
        historyItem.innerHTML = `
            <div class="history-icon">
                <i class="${sourceIcon}"></i>
            </div>
            <div class="history-content">
                <div class="history-emotion emotion-${data.emotion || data.dominantEmotion || '-'}">
                    ${data.emotion || data.dominantEmotion || '-'}
                </div>
                <div class="history-details">
                    <span class="history-time">${time}</span>
                    <span class="history-source">${source}</span>
                    <span class="history-confidence">${(data.confidence * 100).toFixed(0)}%</span>
                </div>
            </div>
        `;
        
        // Add to beginning of history
        this.elements.emotionHistory.insertBefore(historyItem, this.elements.emotionHistory.firstChild);
        
        // Limit history items
        const items = this.elements.emotionHistory.querySelectorAll('.history-item');
        if (items.length > 20) {
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

    updateStorageModeStatus(mode) {
        const modeText = mode === 'database' ? 'Database (MySQL)' : 'Lokal (Browser)';
        const el = document.getElementById('storageModeStatus');
        if (el) {
            el.textContent = modeText;
        }
    }

    disableSubmitButton() {
        if (this.elements.submitDataBtn) {
            this.elements.submitDataBtn.disabled = true;
        }
    }

    // Export modal
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

    // Notification system
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
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
                    console.error('UIManager: Event callback error:', error);
                }
            });
        }
    }

    destroy() {
        this.eventListeners.clear();
        this.elements = {};
        this.isInitialized = false;
    }

    // Snapshot UI updates
    updateSnapshotUI(mode = 'reset', data = {}) {
        if (mode === 'reset') {
            this.updateSnapshotStatus('Camera not active');
            this.updateSnapshotEmotion('-');
            this.updateSnapshotConfidence(0);
            this.updateSnapshotFaceDetected('No');
            if (this.elements.snapshotPreview) {
                this.elements.snapshotPreview.src = '';
                this.elements.snapshotPreview.style.display = 'none';
            }
            if (this.elements.snapshotCameraVideo) this.elements.snapshotCameraVideo.style.display = 'none';
            if (this.elements.snapshotCameraCanvas) this.elements.snapshotCameraCanvas.style.display = 'none';
        } else if (mode === 'active') {
            this.updateSnapshotStatus('Camera active');
            if (this.elements.snapshotCameraVideo) this.elements.snapshotCameraVideo.style.display = '';
            if (this.elements.snapshotCameraCanvas) this.elements.snapshotCameraCanvas.style.display = 'none';
            if (this.elements.snapshotPreview) this.elements.snapshotPreview.style.display = 'none';
        } else if (mode === 'preview') {
            this.updateSnapshotStatus('Snapshot captured');
            if (this.elements.snapshotCameraVideo) this.elements.snapshotCameraVideo.style.display = 'none';
            if (this.elements.snapshotCameraCanvas) this.elements.snapshotCameraCanvas.style.display = 'none';
            if (this.elements.snapshotPreview) this.elements.snapshotPreview.style.display = '';
            if (data.imgSrc && this.elements.snapshotPreview) this.elements.snapshotPreview.src = data.imgSrc;
        }
        // Update emotion/confidence/face if provided
        if (data.emotion !== undefined) this.updateSnapshotEmotion(data.emotion);
        if (data.confidence !== undefined) this.updateSnapshotConfidence(data.confidence);
        if (data.faceDetected !== undefined) this.updateSnapshotFaceDetected(data.faceDetected);
    }

    updateSnapshotStatus(status) {
        if (this.elements.snapshotCameraStatus) this.elements.snapshotCameraStatus.textContent = status;
    }

    updateSnapshotEmotion(emotion) {
        if (this.elements.snapshotEmotion) this.elements.snapshotEmotion.textContent = emotion;
    }

    updateSnapshotConfidence(confidence) {
        if (this.elements.snapshotConfidenceMeter) {
            this.elements.snapshotConfidenceMeter.style.width = `${confidence * 100}%`;
            const confText = this.elements.snapshotConfidenceMeter.parentElement?.querySelector('.confidence-text');
            if (confText) confText.textContent = `${(confidence * 100).toFixed(0)}%`;
        }
    }

    updateSnapshotFaceDetected(status) {
        if (this.elements.snapshotFaceDetected) this.elements.snapshotFaceDetected.textContent = status;
    }
}

window.UIManager = UIManager; 