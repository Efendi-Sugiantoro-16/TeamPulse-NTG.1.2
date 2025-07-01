/**
 * Data Import Manager
 * Handles importing emotion data from JSON and CSV files
 */

class DataImportManager {
    constructor() {
        this.dataStorage = null;
        this.supportedFormats = ['json', 'csv'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
    }

    async init() {
        try {
            console.log('Initializing Data Import Manager...');
            
            // Initialize DataStorage
            this.dataStorage = new DataStorage();
            await this.dataStorage.init();
            
            console.log('Data Import Manager initialized successfully');
        } catch (error) {
            console.error('Error initializing Data Import Manager:', error);
            throw error;
        }
    }

    /**
     * Import data from file
     */
    async importFromFile(file) {
        try {
            console.log('Importing file:', file.name);
            
            // Validate file
            this.validateFile(file);
            
            // Read file content
            const content = await this.readFile(file);
            
            // Parse based on file type
            const data = await this.parseFile(content, file.name);
            
            // Validate and transform data
            const transformedData = this.transformData(data);
            
            // Import data
            const result = await this.importData(transformedData);
            
            console.log('Import completed:', result);
            return result;
            
        } catch (error) {
            console.error('Import error:', error);
            throw error;
        }
    }

    /**
     * Validate file before import
     */
    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            throw new Error(`File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`);
        }

        // Check file extension
        const extension = file.name.split('.').pop().toLowerCase();
        if (!this.supportedFormats.includes(extension)) {
            throw new Error(`Unsupported file format. Supported formats: ${this.supportedFormats.join(', ')}`);
        }
    }

    /**
     * Read file content
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = (e) => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Parse file content based on format
     */
    async parseFile(content, filename) {
        const extension = filename.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'json':
                return this.parseJSON(content);
            case 'csv':
                return this.parseCSV(content);
            default:
                throw new Error(`Unsupported file format: ${extension}`);
        }
    }

    /**
     * Parse JSON content
     */
    parseJSON(content) {
        try {
            const data = JSON.parse(content);
            
            // Handle different JSON structures
            if (data.data && Array.isArray(data.data)) {
                // Export format with metadata
                return data.data;
            } else if (Array.isArray(data)) {
                // Direct array format
                return data;
            } else {
                throw new Error('Invalid JSON structure. Expected array or object with data property');
            }
        } catch (error) {
            throw new Error('Invalid JSON format: ' + error.message);
        }
    }

    /**
     * Parse CSV content
     */
    parseCSV(content) {
        try {
            const lines = content.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                throw new Error('CSV file must have at least header and one data row');
            }

            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const data = [];

            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length === headers.length) {
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index];
                    });
                    data.push(row);
                }
            }

            return data;
        } catch (error) {
            throw new Error('Invalid CSV format: ' + error.message);
        }
    }

    /**
     * Parse CSV line with proper handling of quoted values
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    }

    /**
     * Transform imported data to standard format
     */
    transformData(data) {
        if (!Array.isArray(data)) {
            throw new Error('Data must be an array');
        }

        return data.map((item, index) => {
            // Create standard emotion data structure
            const transformed = {
                id: item.id || this.generateId(),
                timestamp: this.parseTimestamp(item.timestamp || item.Timestamp || item.createdAt),
                dominantEmotion: item.dominantEmotion || item.emotion || item.DominantEmotion || 'neutral',
                confidence: this.parseConfidence(item.confidence || item.Confidence),
                source: item.source || item.Source || 'imported',
                analysisType: item.analysisType || item.AnalysisType || 'imported_data',
                aiAnalysis: {
                    model: item.aiAnalysis?.model || item.model || 'imported',
                    confidence: this.parseConfidence(item.confidence || item.Confidence),
                    processingTime: item.processingTime || 0
                },
                notes: item.notes || item.Notes || 'Imported data',
                tags: item.tags || ['imported'],
                sessionId: item.sessionId || item.SessionId || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: '1.0'
            };

            // Add source-specific data if available
            if (item.facialExpressions) transformed.facialExpressions = item.facialExpressions;
            if (item.audioFeatures) transformed.audioFeatures = item.audioFeatures;
            if (item.textAnalysis) transformed.textAnalysis = item.textAnalysis;

            return transformed;
        });
    }

    /**
     * Parse timestamp from various formats
     */
    parseTimestamp(timestamp) {
        if (!timestamp) return new Date().toISOString();
        
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid date');
            }
            return date.toISOString();
        } catch (error) {
            console.warn('Invalid timestamp, using current time:', timestamp);
            return new Date().toISOString();
        }
    }

    /**
     * Parse confidence value
     */
    parseConfidence(confidence) {
        if (confidence === undefined || confidence === null) return 0.5;
        
        const num = parseFloat(confidence);
        if (isNaN(num)) return 0.5;
        
        // Handle percentage format
        if (num > 1) return num / 100;
        return Math.max(0, Math.min(1, num));
    }

    /**
     * Import transformed data to storage
     */
    async importData(data) {
        try {
            const results = {
                total: data.length,
                imported: 0,
                skipped: 0,
                errors: []
            };

            for (const item of data) {
                try {
                    // Validate item
                    if (!this.validateEmotionData(item)) {
                        results.skipped++;
                        results.errors.push(`Invalid data structure: ${item.id || 'unknown'}`);
                        continue;
                    }

                    // Save to storage
                    await this.dataStorage.saveEmotionData(item);
                    results.imported++;

                } catch (error) {
                    results.skipped++;
                    results.errors.push(`Error importing ${item.id || 'unknown'}: ${error.message}`);
                }
            }

            console.log('Import results:', results);
            return results;

        } catch (error) {
            console.error('Import data error:', error);
            throw error;
        }
    }

    /**
     * Validate emotion data structure
     */
    validateEmotionData(data) {
        const requiredFields = ['dominantEmotion', 'timestamp'];
        const validEmotions = ['happy', 'sad', 'angry', 'excited', 'fearful', 'surprised', 'neutral', 'confused'];
        
        // Check required fields
        for (const field of requiredFields) {
            if (!data[field]) {
                return false;
            }
        }
        
        // Validate emotion
        if (!validEmotions.includes(data.dominantEmotion)) {
            return false;
        }
        
        // Validate confidence
        if (data.confidence !== undefined && (data.confidence < 0 || data.confidence > 1)) {
            return false;
        }
        
        return true;
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'imported_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get import statistics
     */
    async getImportStats() {
        try {
            const data = await this.dataStorage.getEmotionData();
            const importedData = data.filter(item => item.tags && item.tags.includes('imported'));
            
            return {
                totalImported: importedData.length,
                lastImport: importedData.length > 0 ? 
                    new Date(Math.max(...importedData.map(d => new Date(d.createdAt)))) : null,
                importSources: [...new Set(importedData.map(d => d.source))]
            };
        } catch (error) {
            console.error('Error getting import stats:', error);
            return { totalImported: 0, lastImport: null, importSources: [] };
        }
    }

    /**
     * Clear imported data
     */
    async clearImportedData() {
        try {
            const data = await this.dataStorage.getEmotionData();
            const importedData = data.filter(item => item.tags && item.tags.includes('imported'));
            
            let deletedCount = 0;
            for (const item of importedData) {
                try {
                    await this.dataStorage.deleteEntry(item.id);
                    deletedCount++;
                } catch (error) {
                    console.error('Error deleting imported item:', error);
                }
            }
            
            console.log(`Cleared ${deletedCount} imported records`);
            return deletedCount;
            
        } catch (error) {
            console.error('Error clearing imported data:', error);
            throw error;
        }
    }
}

// Global instance
window.DataImportManager = DataImportManager;
