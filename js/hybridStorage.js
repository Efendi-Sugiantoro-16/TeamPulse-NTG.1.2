/**
 * Hybrid Storage System
 * Supports both MySQL database and localStorage with JSON/CSV export
 */

function isLocalStorageAvailable() {
    try {
        const testKey = '__test__';
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

class HybridStorage {
    constructor() {
        this.storageMode = 'local'; // 'local' or 'database'
        this.apiEndpoint = '/api/emotions';
        this.isOnline = navigator.onLine;
        this.localStorageKey = 'aiEmotionData';
        
        // Cek localStorage di awal
        if (!isLocalStorageAvailable()) {
            alert('Sistem penyimpanan tidak tersedia di browser Anda!');
        }
        
        // Event listeners for online/offline status
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
        
        console.log('Hybrid Storage initialized');
    }

    async init() {
        try {
            // Cek apakah server database aktif
            let dbAvailable = false;
            try {
                const resp = await fetch(this.apiEndpoint, { method: 'GET' });
                if (resp.ok) dbAvailable = true;
            } catch (e) {
                dbAvailable = false;
            }
            if (dbAvailable) {
                this.storageMode = 'database';
                localStorage.setItem('teamPulseStorageMode', 'database');
                console.log('Database server detected, storageMode set to database');
            } else {
                this.storageMode = 'local';
                localStorage.setItem('teamPulseStorageMode', 'local');
                console.log('Database server not available, storageMode set to local');
            }
            return true;
        } catch (error) {
            console.error('Failed to initialize Hybrid Storage:', error);
            throw error;
        }
    }

    handleOnlineStatus(isOnline) {
        this.isOnline = isOnline;
        console.log(`Network status: ${isOnline ? 'Online' : 'Offline'}`);
        
        if (isOnline) {
            this.syncOfflineData();
        }
    }

    async setStorageMode(mode) {
        this.storageMode = mode;
        localStorage.setItem('teamPulseStorageMode', mode);
        console.log(`Storage mode set to: ${mode}`);
        // Trigger custom event agar dashboard/history bisa auto-refresh
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('storageModeChanged', { detail: { mode } }));
        }
    }

    async getStorageMode() {
        return localStorage.getItem('teamPulseStorageMode') || 'local';
    }

    // Validasi struktur data emosi sebelum simpan ke database
    validateEmotionData(data) {
        const requiredFields = ['dominantEmotion', 'source'];
        const validSources = ['camera', 'audio', 'text', 'camera_snapshot', 'manual_submission'];
        const validEmotions = ['happy', 'sad', 'angry', 'excited', 'fearful', 'surprised', 'neutral', 'confused', 'fear', 'disgust', 'surprise'];
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

    async saveEmotionData(data) {
        try {
            const timestamp = new Date().toISOString();
            const emotionData = {
                ...data,
                timestamp,
                id: data.id || Date.now().toString(),
                storageMode: this.storageMode
            };

            // Validasi sebelum simpan ke database
            if (this.storageMode === 'database' && this.isOnline) {
                if (!this.validateEmotionData(emotionData)) {
                    throw new Error('Invalid emotion data structure. Pastikan field emosi, source, dan confidence benar.');
                }
                return await this.saveToDatabase(emotionData);
            } else {
                return await this.saveToLocalStorage(emotionData);
            }
        } catch (error) {
            console.error('Error saving emotion data:', error);
            // Fallback to localStorage
            return await this.saveToLocalStorage(data);
        }
    }

    // Alias for saveEmotionData for compatibility
    async addEmotionData(data) {
        return await this.saveEmotionData(data);
    }

    async saveToDatabase(data) {
        // Pastikan payload sesuai backend
        const payload = {
            user_id: data.user_id || 1, // default user
            emotion: data.dominantEmotion || data.emotion,
            confidence: data.confidence || data.score || 0,
            source: data.source,
            data: JSON.stringify(data), // simpan semua data analisis
            notes: data.notes || ''
        };
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            body: JSON.stringify(payload)
            });

            if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Database save failed');
            }

            const result = await response.json();
            console.log('Data saved to database:', result);
            return result;
    }

    async saveToLocalStorage(data) {
        if (!isLocalStorageAvailable()) {
            alert('Sistem penyimpanan tidak tersedia di browser Anda!');
            throw new Error('localStorage not available');
        }
        try {
            if (!data || typeof data !== 'object') {
                alert('Data tidak valid untuk disimpan!');
                throw new Error('Invalid data for localStorage');
            }
            let existingData;
            try {
                existingData = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
                if (!Array.isArray(existingData)) throw new Error('Corrupt data');
            } catch (e) {
                alert('Data local corrupt, akan direset.');
                existingData = [];
                localStorage.setItem(this.localStorageKey, JSON.stringify(existingData));
            }
            // Pastikan ID unik
            if (!data.id) data.id = Date.now().toString();
            const idx = existingData.findIndex(item => item.id === data.id);
            if (idx !== -1) {
                existingData[idx] = data;
            } else {
                existingData.push(data);
            }
            try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(existingData));
            } catch (e) {
                alert('Penyimpanan lokal penuh! Silakan hapus data lama atau export data.');
                throw e;
            }
            return data;
        } catch (error) {
            alert('Gagal menyimpan data ke localStorage!');
            console.error('Error saving to localStorage:', error);
            throw error;
        }
    }

    async getEmotionData(filters = {}) {
        try {
            // Selalu baca mode terbaru dari localStorage
            this.storageMode = await this.getStorageMode();
            if (this.storageMode === 'database' && this.isOnline) {
                return await this.getFromDatabase(filters);
            } else {
                return await this.getFromLocalStorage(filters);
            }
        } catch (error) {
            console.error('Error getting emotion data:', error);
            // Fallback to localStorage
            return await this.getFromLocalStorage(filters);
        }
    }

    async getFromDatabase(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`${this.apiEndpoint}?${queryParams}`);
            
            if (!response.ok) {
                throw new Error(`Database fetch failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('Raw data from API:', data);
            // Jika response {success:true, data:[...]} maka return data.data
            let arr = [];
            if (data && Array.isArray(data.data)) arr = data.data;
            else if (Array.isArray(data)) arr = data;
            else arr = [];
            // Normalisasi agar field konsisten dengan DataStorage
            return arr.map(item => {
                let confidence = (typeof item.confidence === 'number') ? item.confidence :
                                 (typeof item.score === 'number') ? item.score : 0;
                // Fallback: coba parse dari item.data jika ada
                if ((!confidence || confidence === 0) && item.data) {
                    try {
                        const parsed = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
                        if (parsed && typeof parsed.confidence === 'number') confidence = parsed.confidence;
                    } catch (e) { /* ignore */ }
                }
                return {
                    id: item.id,
                    dominantEmotion: item.dominantEmotion || item.emotion || item.emotion_type || '-',
                    confidence,
                    source: item.source || '-',
                    timestamp: item.createdAt || item.created_at || item.timestamp || new Date().toISOString(),
                    notes: item.notes || '',
                    userId: item.userId || item.user_id || null,
                    data: item.data || null,
                    createdAt: item.createdAt || item.created_at || null,
                    updatedAt: item.updatedAt || item.updated_at || null
                };
            });
        } catch (error) {
            console.error('Database fetch error:', error);
            throw error;
        }
    }

    async getFromLocalStorage(filters = {}) {
        if (!isLocalStorageAvailable()) {
            alert('Sistem penyimpanan tidak tersedia di browser Anda!');
            throw new Error('localStorage not available');
        }
        try {
            let data;
            try {
                data = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
                if (!Array.isArray(data)) throw new Error('Corrupt data');
            } catch (e) {
                alert('Data local corrupt, akan direset.');
                data = [];
                localStorage.setItem(this.localStorageKey, JSON.stringify(data));
            }
            // Apply filters
            if (filters.startDate) {
                data = data.filter(item => new Date(item.timestamp) >= new Date(filters.startDate));
            }
            if (filters.endDate) {
                data = data.filter(item => new Date(item.timestamp) <= new Date(filters.endDate));
            }
            if (filters.emotion) {
                data = data.filter(item => item.dominantEmotion === filters.emotion);
            }
            if (filters.source) {
                data = data.filter(item => item.source === filters.source);
            }
            return data;
        } catch (error) {
            alert('Gagal membaca data dari localStorage!');
            console.error('LocalStorage fetch error:', error);
            throw error;
        }
    }

    async updateEmotionData(id, newData) {
        try {
            if (this.storageMode === 'database' && this.isOnline) {
                return await this.updateInDatabase(id, newData);
            } else {
                return await this.updateInLocalStorage(id, newData);
            }
        } catch (error) {
            console.error('Error updating emotion data:', error);
            return await this.updateInLocalStorage(id, newData);
        }
    }

    async updateInDatabase(id, newData) {
        try {
            const response = await fetch(`${this.apiEndpoint}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newData)
            });

            if (!response.ok) {
                throw new Error(`Database update failed: ${response.status}`);
            }

            const result = await response.json();
            console.log('Data updated in database:', result);
            return result;
        } catch (error) {
            console.error('Database update error:', error);
            throw error;
        }
    }

    async updateInLocalStorage(id, newData) {
        if (!isLocalStorageAvailable()) {
            alert('Sistem penyimpanan tidak tersedia di browser Anda!');
            throw new Error('localStorage not available');
        }
        try {
            let data;
            try {
                data = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
                if (!Array.isArray(data)) throw new Error('Corrupt data');
            } catch (e) {
                alert('Data local corrupt, akan direset.');
                data = [];
                localStorage.setItem(this.localStorageKey, JSON.stringify(data));
            }
            const idx = data.findIndex(item => item.id === id);
            if (idx !== -1) {
                data[idx] = { ...data[idx], ...newData };
                try {
                localStorage.setItem(this.localStorageKey, JSON.stringify(data));
                } catch (e) {
                    alert('Penyimpanan lokal penuh! Silakan hapus data lama atau export data.');
                    throw e;
                }
                return data[idx];
            } else {
                alert('Data tidak ditemukan untuk update!');
                throw new Error('Data not found for update');
            }
        } catch (error) {
            alert('Gagal update data di localStorage!');
            console.error('LocalStorage update error:', error);
            throw error;
        }
    }

    async deleteEmotionData(id) {
        try {
            // Validasi ID: harus number (MySQL)
            if (!id || id === '' || id === undefined || id === null) {
                console.error('ID tidak valid untuk deleteEmotionData:', id);
                alert('Gagal menghapus: ID entry tidak valid.');
                return false;
            }
            if (this.storageMode === 'database' && this.isOnline) {
                // Hanya izinkan ID number (MySQL)
                if (typeof id === 'string' && /^\d+$/.test(id)) id = Number(id);
                if (typeof id !== 'number' || isNaN(id)) {
                    alert('Gagal menghapus: ID entry bukan ID database yang valid.');
                    console.error('[HybridStorage] Gagal hapus: ID bukan number:', id, typeof id);
                    return false;
                }
                console.log('[HybridStorage] Menghapus entry dari database dengan ID:', id, '(as', typeof id, ')');
                return await this.deleteFromDatabase(id);
            } else {
                return await this.deleteFromLocalStorage(id);
            }
        } catch (error) {
            console.error('Error deleting emotion data:', error);
            return await this.deleteFromLocalStorage(id);
        }
    }

    async deleteFromDatabase(id) {
        try {
            const response = await fetch(`${this.apiEndpoint}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Database delete failed: ${response.status}`);
            }

            console.log('Data deleted from database:', id);
            return true;
        } catch (error) {
            console.error('Database delete error:', error);
            throw error;
        }
    }

    async deleteFromLocalStorage(id) {
        if (!isLocalStorageAvailable()) {
            alert('Sistem penyimpanan tidak tersedia di browser Anda!');
            throw new Error('localStorage not available');
        }
        try {
            let data;
            try {
                data = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
                if (!Array.isArray(data)) throw new Error('Corrupt data');
            } catch (e) {
                alert('Data local corrupt, akan direset.');
                data = [];
                localStorage.setItem(this.localStorageKey, JSON.stringify(data));
            }
            const newData = data.filter(item => item.id !== id);
            try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(newData));
            } catch (e) {
                alert('Penyimpanan lokal penuh! Silakan hapus data lama atau export data.');
                throw e;
            }
            return true;
        } catch (error) {
            alert('Gagal menghapus data dari localStorage!');
            console.error('LocalStorage delete error:', error);
            throw error;
        }
    }

    // Offline queue management
    async addToOfflineQueue(data) {
        try {
            const queue = JSON.parse(localStorage.getItem('teamPulseOfflineQueue') || '[]');
            queue.push({
                ...data,
                queueTimestamp: new Date().toISOString(),
                action: 'create'
            });
            localStorage.setItem('teamPulseOfflineQueue', JSON.stringify(queue));
        } catch (error) {
            console.error('Error adding to offline queue:', error);
        }
    }

    async syncOfflineData() {
        try {
            const queue = JSON.parse(localStorage.getItem('teamPulseOfflineQueue') || '[]');
            if (queue.length === 0) return;

            console.log(`Syncing ${queue.length} offline records...`);

            for (const item of queue) {
                try {
                    if (item.action === 'create') {
                        await this.saveToDatabase(item);
                    } else if (item.action === 'update') {
                        await this.updateInDatabase(item.id, item);
                    } else if (item.action === 'delete') {
                        await this.deleteFromDatabase(item.id);
                    }
                } catch (error) {
                    console.error(`Failed to sync item ${item.id}:`, error);
                }
            }

            // Clear queue after successful sync
            localStorage.removeItem('teamPulseOfflineQueue');
            console.log('Offline data sync completed');
        } catch (error) {
            console.error('Error syncing offline data:', error);
        }
    }

    // Export functionality
    async exportToJSON() {
        try {
            const data = await this.getEmotionData();
            const exportData = {
                exportInfo: {
                    timestamp: new Date().toISOString(),
                    totalRecords: data.length,
                    format: 'json',
                    version: '1.0'
                },
                data: data
            };
            
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            return {
                blob: blob,
                filename: `emotion-data-${new Date().toISOString().split('T')[0]}.json`
            };
        } catch (error) {
            console.error('Error exporting to JSON:', error);
            throw error;
        }
    }

    async exportToCSV() {
        try {
            const data = await this.getEmotionData();
            
            if (data.length === 0) {
                throw new Error('No data to export');
            }

            // Define CSV headers
            const headers = ['id', 'timestamp', 'dominantEmotion', 'confidence', 'source', 'sessionId', 'notes'];
            
            // Create CSV content
            let csvContent = headers.join(',') + '\n';
            
            data.forEach(item => {
                const row = headers.map(header => {
                    const value = item[header] || '';
                    // Escape commas and quotes
                    return `"${String(value).replace(/"/g, '""')}"`;
                });
                csvContent += row.join(',') + '\n';
            });

            const blob = new Blob([csvContent], { type: 'text/csv' });
            
            return {
                blob: blob,
                filename: `emotion-data-${new Date().toISOString().split('T')[0]}.csv`
            };
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            throw error;
        }
    }

    async importFromJSON(file) {
        try {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        let importedCount = 0;
                        
                        for (const item of data) {
                            await this.saveEmotionData(item);
                            importedCount++;
                        }
                        
                        console.log(`Imported ${importedCount} records`);
                        resolve(importedCount);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = reject;
                reader.readAsText(file);
            });
        } catch (error) {
            console.error('Error importing from JSON:', error);
            throw error;
        }
    }

    async importFromCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split(/\r?\n/).filter(Boolean);
                    if (lines.length < 2) throw new Error('CSV tidak berisi data.');
                    // Robust CSV parse (handle quoted commas)
                    const parseCSVRow = (row) => {
                        const result = [];
                        let current = '', inQuotes = false;
                        for (let i = 0; i < row.length; i++) {
                            const char = row[i];
                            if (char === '"') inQuotes = !inQuotes;
                            else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
                            else current += char;
                        }
                        result.push(current);
                        return result.map(cell => cell.replace(/^"|"$/g, ''));
                    };
                    const headers = parseCSVRow(lines[0]).map(h => h.trim());
                    let imported = 0;
                    for (let i = 1; i < lines.length; i++) {
                        const row = parseCSVRow(lines[i]);
                        let obj = {};
                        headers.forEach((h, idx) => { obj[h] = row[idx]; });
                        // Normalisasi dan validasi
                        if (!obj.dominantEmotion && obj.emotion) obj.dominantEmotion = obj.emotion;
                        if (!obj.source && obj.inputType) obj.source = obj.inputType;
                        if (!obj.timestamp) obj.timestamp = new Date().toISOString();
                        if (!obj.id) obj.id = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
                        if (!obj.dominantEmotion || !obj.source) continue;
                        await this.saveEmotionData(obj);
                        imported++;
                    }
                    resolve(imported);
                } catch (err) {
                    reject(new Error('File CSV tidak valid atau rusak.'));
                }
            };
            reader.onerror = () => reject(new Error('Gagal membaca file CSV.'));
            reader.readAsText(file);
        });
    }

    async importData(file, format = null) {
        if (!format) {
            if (file.name && file.name.endsWith('.json')) format = 'json';
            else if (file.name && file.name.endsWith('.csv')) format = 'csv';
            else throw new Error('Unknown file format');
        }
        if (format === 'json' && this.importFromJSON) return await this.importFromJSON(file);
        if (format === 'csv' && this.importFromCSV) return await this.importFromCSV(file);
        throw new Error('Unsupported import format');
    }

    // Storage statistics
    async getStorageStats() {
        try {
            const offlineQueue = JSON.parse(localStorage.getItem('teamPulseOfflineQueue') || '[]');
            
            return {
                storageMode: this.storageMode,
                isOnline: this.isOnline,
                offlineQueueSize: offlineQueue.length,
                lastSync: localStorage.getItem('teamPulseLastSync') || 'Never'
            };
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return null;
        }
    }

    // Cleanup
    async cleanup() {
        try {
            await this.syncOfflineData();
            console.log('Hybrid Storage cleanup completed');
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

window.HybridStorage = HybridStorage;

// Inisialisasi otomatis hybridStorage jika belum ada
if (!window.hybridStorage && typeof HybridStorage !== 'undefined') {
    window.hybridStorage = new HybridStorage();
    if (typeof window.hybridStorage.init === 'function') {
        window.hybridStorage.init();
    }
}
