/**
 * Data Manager Component
 * Handles all data storage and retrieval operations
 */

class DataManager {
    constructor() {
        this.storage = null;
        this.storageMode = 'local';
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('DataManager: Initializing...');
            
            // Try to use enhanced DataStorage if available
            if (typeof DataStorage !== 'undefined') {
                this.storage = new DataStorage();
                await this.storage.init();
                this.storageMode = await this.storage.getStorageMode();
                console.log('DataManager: Using enhanced DataStorage');
            } else {
                // Fallback to simple storage
                this.storage = new SimpleDataStorage();
                await this.storage.init();
                this.storageMode = 'local';
                console.log('DataManager: Using SimpleDataStorage fallback');
            }
            
            this.isInitialized = true;
            console.log('DataManager: Initialized successfully');
            
        } catch (error) {
            console.error('DataManager: Initialization failed:', error);
            throw error;
        }
    }

    normalizeEmotionData(raw) {
        const validEmotions = ['happy', 'sad', 'angry', 'excited', 'fearful', 'surprised', 'neutral', 'confused'];
        const validSources = ['camera', 'audio', 'text', 'camera_snapshot'];
        let dominantEmotion = raw.dominantEmotion || raw.emotion || 'neutral';
        if (!validEmotions.includes(dominantEmotion)) dominantEmotion = 'neutral';
        let source = raw.source || raw.emotionSource || 'camera';
        if (!validSources.includes(source)) source = 'camera';
        let confidence = typeof raw.confidence === 'number' ? raw.confidence : (raw.confidence ? parseFloat(raw.confidence) : 0.8);
        if (isNaN(confidence) || confidence < 0 || confidence > 1) confidence = 0.8;
        let timestamp = raw.timestamp || new Date().toISOString();
        return {
            ...raw,
            dominantEmotion,
            source,
            confidence,
            timestamp
        };
    }

    async getEmotionData(options = {}) {
        if (!this.isInitialized) {
            throw new Error('DataManager not initialized');
        }
        
        return await this.storage.getEmotionData(options);
    }

    async exportData(format = 'json', filters = {}) {
        if (!this.isInitialized) {
            throw new Error('DataManager not initialized');
        }
        
        return await this.storage.exportData(format, filters);
    }

    async setStorageMode(mode) {
        if (this.storage && this.storage.setStorageMode) {
            await this.storage.setStorageMode(mode);
        }
        this.storageMode = mode;
        localStorage.setItem('teamPulseStorageMode', mode);
    }

    async getStorageMode() {
        if (this.storage && this.storage.getStorageMode) {
            return await this.storage.getStorageMode();
        }
        return this.storageMode || localStorage.getItem('teamPulseStorageMode') || 'local';
    }

    async getStorageStats() {
        if (!this.isInitialized) {
            return null;
        }
        
        if (this.storage && this.storage.getStorageStats) {
            return await this.storage.getStorageStats();
        }
        
        // Fallback stats
        const data = await this.getEmotionData();
        return {
            storageMode: this.storageMode,
            isOnline: navigator.onLine,
            emotionRecords: data.length,
            lastEmotionRecord: data.length > 0 ? data[0].timestamp : null,
            offlineQueueSize: 0,
            lastSync: 'N/A (Local Mode)'
        };
    }

    destroy() {
        this.storage = null;
        this.isInitialized = false;
    }
}

// Simple Data Storage Fallback
class SimpleDataStorage {
    constructor() {
        this.storageKey = 'aiEmotionData';
        this.isInitialized = false;
    }

    async init() {
        this.isInitialized = true;
    }

    async saveEmotionData(data) {
        const normalized = this.normalizeEmotionData(data);
        const existingData = this.getStoredData();
        const newData = {
            id: this.generateId(),
            ...normalized,
            createdAt: new Date().toISOString()
        };
        
        existingData.push(newData);
        localStorage.setItem(this.storageKey, JSON.stringify(existingData));
        
        return newData;
    }

    async getEmotionData(options = {}) {
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
    }

    async exportData(format = 'json', filters = {}) {
        const data = await this.getEmotionData(filters);
        
        if (format === 'json') {
            return this.exportAsJSON(data);
        } else if (format === 'csv') {
            return this.exportAsCSV(data);
        }
        
        throw new Error(`Unsupported format: ${format}`);
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
            'Session ID',
            'Created At'
        ];

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

    getStoredData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }

    generateId() {
        return 'emotion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// OVERRIDE: Integrasi realtime broadcast ke dashboard
(function() {
    const _originalSaveEmotionData = DataManager.prototype.saveEmotionData;
    DataManager.prototype.saveEmotionData = async function(data) {
        const normalized = this.normalizeEmotionData(data);
        return await this.storage.saveEmotionData(normalized);
    };
})();

window.DataManager = DataManager;
window.SimpleDataStorage = SimpleDataStorage; 