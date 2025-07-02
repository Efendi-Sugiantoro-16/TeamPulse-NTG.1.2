// Enhanced DataStorage for AI-Powered Emotion Analysis
class DataStorage {
    constructor() {
        this.storageKey = 'aiEmotionData';
        this.hybridStorage = null;
        this.isInitialized = false;
        this.storageMode = 'local'; // Default to local storage
    }

    async init() {
        try {
            console.log('Initializing AI DataStorage...');
            
            // Try to initialize hybrid storage if available
            if (typeof HybridStorage !== 'undefined') {
                try {
                    this.hybridStorage = new HybridStorage();
                    await this.hybridStorage.init();
                    this.storageMode = await this.hybridStorage.getStorageMode();
                    console.log('HybridStorage initialized successfully');
                } catch (error) {
                    console.warn('Failed to initialize HybridStorage, using local mode:', error);
                    this.hybridStorage = null;
                    this.storageMode = 'local';
                }
            } else {
                console.warn('HybridStorage not available, using local mode');
                this.storageMode = 'local';
            }
            
            this.isInitialized = true;
            console.log('AI DataStorage initialized successfully');
            
        } catch (error) {
            console.error('Error initializing AI DataStorage:', error);
            // Fallback to local mode
            this.isInitialized = true;
            this.storageMode = 'local';
            console.log('DataStorage initialized in fallback mode');
        }
    }

    async saveEmotionData(emotionData) {
        try {
            if (!this.isInitialized) {
                throw new Error('DataStorage not initialized');
            }

            // Validate emotion data
            if (!this.validateEmotionData(emotionData)) {
                throw new Error('Invalid emotion data structure');
            }

            // Create enhanced data structure for AI analysis
            const enhancedData = {
                id: this.generateId(),
                timestamp: emotionData.timestamp || new Date().toISOString(),
                dominantEmotion: emotionData.dominantEmotion,
                confidence: emotionData.confidence || 0,
                source: emotionData.source, // 'camera', 'audio', 'text', 'camera_snapshot', 'manual_submission'
                analysisType: this.getAnalysisType(emotionData.source),
                
                // AI Analysis Details
                aiAnalysis: {
                    model: this.getAIModel(emotionData.source),
                    confidence: emotionData.confidence,
                    processingTime: emotionData.processingTime || 0,
                    features: emotionData.features || {}
                },
                
                // Source-specific data
                facialExpressions: emotionData.facialExpressions || null,
                audioFeatures: emotionData.audioFeatures || null,
                textAnalysis: emotionData.textAnalysis || null,
                
                // Additional metadata
                notes: emotionData.notes || '',
                tags: emotionData.tags || [],
                sessionId: emotionData.sessionId || null,
                
                // System metadata
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: '1.0'
            };

            // Simpan ke MySQL via API
            try {
                await this.saveEmotionDataToMySQL(enhancedData);
                console.log('AI emotion data saved to MySQL via API');
            } catch (err) {
                console.warn('Gagal simpan ke MySQL, fallback ke localStorage:', err);
                const savedData = await this.saveToLocalStorage(enhancedData);
                return savedData;
            }
            return enhancedData;
        } catch (error) {
            console.error('Error saving AI emotion data:', error);
            throw error;
        }
    }

    async saveEmotionDataToMySQL(data) {
        // Mapping ke struktur backend
        const payload = {
            user_id: 1, // Ganti dengan user_id dinamis jika sudah ada sistem login
            emotion: data.dominantEmotion,
            confidence: data.confidence,
            source: data.source,
            data: JSON.stringify(data), // kirim semua data analisis
            notes: data.notes || ''
        };
        const response = await fetch('/api/emotions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Gagal simpan ke MySQL');
        }
        return await response.json();
    }

    // Alias for saveEmotionData for compatibility
    async addEmotionData(emotionData) {
        return await this.saveEmotionData(emotionData);
    }

    async saveToLocalStorage(data) {
        try {
            const existingData = this.getStoredData();
            existingData.push(data);
            localStorage.setItem(this.storageKey, JSON.stringify(existingData));
            return data;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
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

    validateEmotionData(data) {
        const requiredFields = ['dominantEmotion', 'source'];
        const validSources = ['camera', 'audio', 'text', 'camera_snapshot'];
        const validEmotions = ['happy', 'sad', 'angry', 'excited', 'fearful', 'surprised', 'neutral', 'confused'];
        let valid = true;
        // Check required fields
        for (const field of requiredFields) {
            if (!data[field]) {
                console.error(`Missing required field: ${field}`);
                valid = false;
            }
        }
        // Validate source
        if (!validSources.includes(data.source)) {
            console.error(`Invalid source: ${data.source}`);
            valid = false;
        }
        // Validate emotion
        if (!validEmotions.includes(data.dominantEmotion)) {
            console.error(`Invalid emotion: ${data.dominantEmotion}`);
            valid = false;
        }
        // Validate confidence
        if (data.confidence !== undefined && (data.confidence < 0 || data.confidence > 1)) {
            console.error(`Invalid confidence value: ${data.confidence}`);
            valid = false;
        }
        if (!valid) {
            console.error('validateEmotionData: Data tidak valid:', data);
        }
        return valid;
    }

    getAnalysisType(source) {
        const typeMap = {
            'camera': 'facial_expression',
            'audio': 'voice_emotion',
            'text': 'sentiment_analysis',
            'camera_snapshot': 'facial_expression_snapshot',
            'manual_submission': 'manual_emotion_input'
        };
        return typeMap[source] || 'unknown';
    }

    getAIModel(source) {
        const modelMap = {
            'camera': 'face-api.js',
            'audio': 'voice_emotion_analyzer',
            'text': 'enhanced_sentiment_analyzer',
            'camera_snapshot': 'face-api.js',
            'manual_submission': 'user_input'
        };
        return modelMap[source] || 'unknown';
    }

    async getEmotionData(options = {}) {
        try {
            if (!this.isInitialized) {
                throw new Error('DataStorage not initialized');
            }
            // Coba ambil dari MySQL
            try {
                const data = await this.getEmotionDataFromMySQL(options);
                return data;
            } catch (err) {
                console.warn('Gagal ambil dari MySQL, fallback ke localStorage:', err);
                return this.getStoredData();
            }
        } catch (error) {
            console.error('Error getting AI emotion data:', error);
            throw error;
        }
    }

    async getEmotionDataFromMySQL(options = {}) {
        let url = '/api/emotions';
        if (options.user_id) {
            url += `?user_id=${options.user_id}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Gagal ambil data dari MySQL');
        }
        const data = await response.json();
        // Mapping ke format frontend jika perlu
        return data;
    }

    async getEmotionStats(options = {}) {
        try {
            const data = await this.getEmotionData(options);
            
            const stats = {
                totalRecords: data.length,
                emotionDistribution: {},
                sourceDistribution: {},
                confidenceStats: {
                    average: 0,
                    min: 1,
                    max: 0
                },
                timeStats: {
                    firstRecord: null,
                    lastRecord: null,
                    totalDuration: 0
                }
            };

            if (data.length === 0) {
                return stats;
            }

            let totalConfidence = 0;
            let minConfidence = 1;
            let maxConfidence = 0;
            let firstRecord = new Date(data[data.length - 1].timestamp);
            let lastRecord = new Date(data[0].timestamp);

            data.forEach(record => {
                // Emotion distribution
                const emotion = record.dominantEmotion;
                stats.emotionDistribution[emotion] = (stats.emotionDistribution[emotion] || 0) + 1;

                // Source distribution
                const source = record.source;
                stats.sourceDistribution[source] = (stats.sourceDistribution[source] || 0) + 1;

                // Confidence stats
                const confidence = record.confidence || 0;
                totalConfidence += confidence;
                minConfidence = Math.min(minConfidence, confidence);
                maxConfidence = Math.max(maxConfidence, confidence);
            });

            stats.confidenceStats.average = totalConfidence / data.length;
            stats.confidenceStats.min = minConfidence;
            stats.confidenceStats.max = maxConfidence;

            stats.timeStats.firstRecord = firstRecord.toISOString();
            stats.timeStats.lastRecord = lastRecord.toISOString();
            stats.timeStats.totalDuration = lastRecord.getTime() - firstRecord.getTime();

            return stats;
            
        } catch (error) {
            console.error('Error getting emotion stats:', error);
            return {
                totalRecords: 0,
                emotionDistribution: {},
                sourceDistribution: {},
                confidenceStats: { average: 0, min: 0, max: 0 },
                timeStats: { firstRecord: null, lastRecord: null, totalDuration: 0 }
            };
        }
    }

    async getEmotionTrends(options = {}) {
        try {
            const { days = 7, groupBy = 'day' } = options;
            
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const data = await this.getEmotionData({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                sortBy: 'timestamp',
                sortOrder: 'asc'
            });

            const trends = {
                timeGroups: {},
                emotionTrends: {},
                sourceTrends: {},
                confidenceTrends: []
            };

            data.forEach(record => {
                const date = new Date(record.timestamp);
                let timeKey;
                
                if (groupBy === 'hour') {
                    timeKey = date.toISOString().slice(0, 13) + ':00:00.000Z';
                } else if (groupBy === 'day') {
                    timeKey = date.toISOString().slice(0, 10);
                } else {
                    timeKey = date.toISOString().slice(0, 7); // month
                }

                // Initialize time group
                if (!trends.timeGroups[timeKey]) {
                    trends.timeGroups[timeKey] = {
                        count: 0,
                        emotions: {},
                        sources: {},
                        totalConfidence: 0
                    };
                }

                // Update time group stats
                trends.timeGroups[timeKey].count++;
                trends.timeGroups[timeKey].emotions[record.dominantEmotion] = 
                    (trends.timeGroups[timeKey].emotions[record.dominantEmotion] || 0) + 1;
                trends.timeGroups[timeKey].sources[record.source] = 
                    (trends.timeGroups[timeKey].sources[record.source] || 0) + 1;
                trends.timeGroups[timeKey].totalConfidence += record.confidence || 0;

                // Update emotion trends
                if (!trends.emotionTrends[record.dominantEmotion]) {
                    trends.emotionTrends[record.dominantEmotion] = {};
                }
                trends.emotionTrends[record.dominantEmotion][timeKey] = 
                    (trends.emotionTrends[record.dominantEmotion][timeKey] || 0) + 1;

                // Update source trends
                if (!trends.sourceTrends[record.source]) {
                    trends.sourceTrends[record.source] = {};
                }
                trends.sourceTrends[record.source][timeKey] = 
                    (trends.sourceTrends[record.source][timeKey] || 0) + 1;

                // Add confidence trend point
                trends.confidenceTrends.push({
                    timestamp: record.timestamp,
                    confidence: record.confidence || 0,
                    emotion: record.dominantEmotion,
                    source: record.source
                });
            });

            return trends;
            
        } catch (error) {
            console.error('Error getting emotion trends:', error);
            return {
                timeGroups: {},
                emotionTrends: {},
                sourceTrends: {},
                confidenceTrends: []
            };
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
            'Analysis Type',
            'AI Model',
            'Notes',
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
                record.analysisType,
                record.aiAnalysis.model,
                `"${(record.notes || '').replace(/"/g, '""')}"`,
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

    async getStorageStats() {
        try {
            if (!this.isInitialized) {
                return null;
            }

            if (this.hybridStorage) {
                const stats = await this.hybridStorage.getStorageStats();
                const emotionData = await this.getEmotionData({ limit: 1 });
                
                return {
                    ...stats,
                    emotionRecords: await this.getEmotionData().then(data => data.length),
                    lastEmotionRecord: emotionData.length > 0 ? emotionData[0].timestamp : null
                };
            } else {
                // Fallback stats for localStorage only
                const data = this.getStoredData();
                return {
                    storageMode: 'local',
                    isOnline: navigator.onLine,
                    emotionRecords: data.length,
                    lastEmotionRecord: data.length > 0 ? data[0].timestamp : null,
                    offlineQueueSize: 0,
                    lastSync: 'N/A (Local Mode)'
                };
            }
            
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return null;
        }
    }

    async clearData(options = {}) {
        try {
            if (!this.isInitialized) {
                throw new Error('DataStorage not initialized');
            }

            const { source = null, emotion = null, beforeDate = null } = options;
            
            if (source || emotion || beforeDate) {
                // Clear specific data
                const filters = {};
                if (source) filters.source = source;
                if (emotion) filters.dominantEmotion = emotion;
                if (beforeDate) filters.timestamp = { $lt: beforeDate };
                
                await this.hybridStorage.deleteData('emotion_analysis', filters);
            } else {
                // Clear all data
                await this.hybridStorage.clearAllData();
            }

            console.log('Data cleared successfully');
            return true;
            
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }

    generateId() {
        return 'emotion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Utility methods
    formatDate(date) {
        return new Date(date).toLocaleDateString();
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString();
    }

    getEmotionColor(emotion) {
        const colors = {
            happy: '#f39c12',
            sad: '#3498db',
            angry: '#e74c3c',
            excited: '#f1c40f',
            fearful: '#9b59b6',
            surprised: '#e67e22',
            neutral: '#95a5a6',
            confused: '#34495e'
        };
        return colors[emotion] || '#95a5a6';
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

    async setStorageMode(mode) {
        try {
            this.storageMode = mode;
            
            if (this.hybridStorage && this.hybridStorage.setStorageMode) {
                await this.hybridStorage.setStorageMode(mode);
            } else {
                // Store mode in localStorage for persistence
                localStorage.setItem('teamPulseStorageMode', mode);
            }
            
            console.log(`Storage mode set to: ${mode}`);
            return true;
        } catch (error) {
            console.error('Error setting storage mode:', error);
            throw error;
        }
    }

    async getStorageMode() {
        if (this.hybridStorage && this.hybridStorage.getStorageMode) {
            return await this.hybridStorage.getStorageMode();
        } else {
            return this.storageMode || localStorage.getItem('teamPulseStorageMode') || 'local';
        }
    }

    async deleteEmotionData(id) {
        try {
            if (!this.isInitialized) {
                throw new Error('DataStorage not initialized');
            }

            console.log(`Attempting to delete emotion data with ID: ${id}`);

            if (this.hybridStorage) {
                // Use hybrid storage for deletion
                const result = await this.hybridStorage.deleteEmotionData(id);
                console.log('Data deleted via HybridStorage:', result);
                return result;
            } else {
                // Fallback to localStorage deletion
                const result = await this.deleteFromLocalStorage(id);
                console.log('Data deleted from localStorage:', result);
                return result;
            }
        } catch (error) {
            console.error('Error deleting emotion data:', error);
            throw error;
        }
    }

    async deleteFromLocalStorage(id) {
        try {
            const data = this.getStoredData();
            const initialLength = data.length;
            
            // Filter out the item with the specified ID
            const filteredData = data.filter(item => item.id !== id);
            
            if (filteredData.length === initialLength) {
                console.warn(`No data found with ID: ${id}`);
                return false;
            }
            
            // Save the filtered data back to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(filteredData));
            
            console.log(`Successfully deleted data with ID: ${id}`);
            return true;
        } catch (error) {
            console.error('Error deleting from localStorage:', error);
            throw error;
        }
    }

    async updateEmotionData(id, newData) {
        try {
            if (!this.isInitialized) {
                throw new Error('DataStorage not initialized');
            }

            if (this.hybridStorage) {
                return await this.hybridStorage.updateEmotionData(id, newData);
            } else {
                return await this.updateInLocalStorage(id, newData);
            }
        } catch (error) {
            console.error('Error updating emotion data:', error);
            throw error;
        }
    }

    async updateInLocalStorage(id, newData) {
        try {
            const data = this.getStoredData();
            const index = data.findIndex(item => item.id === id);
            
            if (index === -1) {
                throw new Error(`No data found with ID: ${id}`);
            }
            
            // Update the data
            data[index] = {
                ...data[index],
                ...newData,
                updatedAt: new Date().toISOString()
            };
            
            // Save back to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            
            console.log(`Successfully updated data with ID: ${id}`);
            return data[index];
        } catch (error) {
            console.error('Error updating in localStorage:', error);
            throw error;
        }
    }
}

// Global instance
window.DataStorage = DataStorage; 