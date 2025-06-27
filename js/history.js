// HistoryManager class untuk mengelola riwayat operasi CRUD
class HistoryManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistoryLength = 100; // Maximum number of history entries to keep
        this.observers = [];
        this.initializeFromLocalStorage();
    }

    // Initialize history from localStorage
    initializeFromLocalStorage() {
        const savedHistory = localStorage.getItem('historyData');
        if (savedHistory) {
            try {
                const data = JSON.parse(savedHistory);
                this.history = data.history;
                this.currentIndex = data.currentIndex;
                this.notifyObservers();
            } catch (error) {
                console.error('Error loading history from localStorage:', error);
            }
        }
    }

    // Save history to localStorage
    saveToLocalStorage() {
        try {
            localStorage.setItem('historyData', JSON.stringify({
                history: this.history,
                currentIndex: this.currentIndex
            }));
        } catch (error) {
            console.error('Error saving history to localStorage:', error);
        }
    }

    // Add observer for history changes
    addObserver(observer) {
        this.observers.push(observer);
    }

    // Remove observer
    removeObserver(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    // Notify all observers of changes
    notifyObservers() {
        this.observers.forEach(observer => observer(this.getHistoryStats()));
    }

    // Add a new entry to history
    addEntry(action, data, metadata = {}) {
        const entry = {
            id: this.generateUniqueId(),
            timestamp: new Date().toISOString(),
            action, // 'create', 'update', 'delete', etc.
            data,
            metadata,
            previousState: this.currentIndex >= 0 ? this.history[this.currentIndex].data : null
        };

        // Remove any future entries if we're not at the end
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Add new entry
        this.history.push(entry);
        this.currentIndex++;

        // Trim history if it exceeds max length
        if (this.history.length > this.maxHistoryLength) {
            this.history.shift();
            this.currentIndex--;
        }

        // Save to localStorage and notify observers
        this.saveToLocalStorage();
        this.notifyObservers();

        return entry;
    }

    // Undo the last action
    undo() {
        if (this.currentIndex >= 0) {
            const entry = this.history[this.currentIndex];
            this.currentIndex--;
            return entry;
        }
        return null;
    }

    // Redo the last undone action
    redo() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            return this.history[this.currentIndex];
        }
        return null;
    }

    // Get current state
    getCurrentState() {
        return this.currentIndex >= 0 ? this.history[this.currentIndex].data : null;
    }

    // Get all history entries
    getAllHistory() {
        return this.history;
    }

    // Get history entries within a date range
    getHistoryByDateRange(startDate, endDate) {
        return this.history.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= startDate && entryDate <= endDate;
        });
    }

    // Get history entries by action type
    getHistoryByAction(action) {
        return this.history.filter(entry => entry.action === action);
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Get formatted history entries for display
    getFormattedHistory() {
        return this.history.map(entry => ({
            ...entry,
            formattedDate: this.formatDate(entry.timestamp),
            status: this.getStatusForAction(entry.action)
        }));
    }

    // Get status class for action
    getStatusForAction(action) {
        const statusMap = {
            'create': 'success',
            'update': 'warning',
            'delete': 'error'
        };
        return statusMap[action] || 'info';
    }

    // Get history entries for current page
    getHistoryPage(page, itemsPerPage = 10) {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return {
            entries: this.history.slice(start, end),
            totalPages: Math.ceil(this.history.length / itemsPerPage),
            currentPage: page
        };
    }

    // Filter history entries
    filterHistory(filters = {}) {
        return this.history.filter(entry => {
            let matches = true;
            
            if (filters.action && entry.action !== filters.action) {
                matches = false;
            }
            
            if (filters.startDate && new Date(entry.timestamp) < new Date(filters.startDate)) {
                matches = false;
            }
            
            if (filters.endDate && new Date(entry.timestamp) > new Date(filters.endDate)) {
                matches = false;
            }
            
            if (filters.searchTerm) {
                const searchLower = filters.searchTerm.toLowerCase();
                const dataString = JSON.stringify(entry.data).toLowerCase();
                const metadataString = JSON.stringify(entry.metadata).toLowerCase();
                
                if (!dataString.includes(searchLower) && !metadataString.includes(searchLower)) {
                    matches = false;
                }
            }
            
            return matches;
        });
    }

    // Get statistics about history
    getHistoryStats() {
        const actionCounts = this.getActionCounts();
        return {
            totalEntries: this.history.length,
            currentIndex: this.currentIndex,
            canUndo: this.currentIndex >= 0,
            canRedo: this.currentIndex < this.history.length - 1,
            actionCounts,
            lastAction: this.history[this.currentIndex] || null,
            lastActionTime: this.history[this.currentIndex] ? this.formatDate(this.history[this.currentIndex].timestamp) : null
        };
    }

    // Get count of each action type
    getActionCounts() {
        return this.history.reduce((acc, entry) => {
            acc[entry.action] = (acc[entry.action] || 0) + 1;
            return acc;
        }, {});
    }

    // Clear all history
    clearHistory() {
        this.history = [];
        this.currentIndex = -1;
        this.saveToLocalStorage();
        this.notifyObservers();
    }

    // Generate unique ID for history entries
    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Export history to JSON
    exportHistory() {
        return JSON.stringify({
            history: this.history,
            currentIndex: this.currentIndex
        });
    }

    // Import history from JSON
    importHistory(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            this.history = data.history;
            this.currentIndex = data.currentIndex;
            this.notifyObservers();
            return true;
        } catch (error) {
            console.error('Error importing history:', error);
            return false;
        }
    }
}

// Pastikan HistoryManager tersedia secara global segera
window.HistoryManager = HistoryManager;

// Buat instance global jika belum ada
if (!window.historyManager) {
    window.historyManager = new HistoryManager();
}

// Example usage:
/*
const historyManager = new HistoryManager();

// Create operation
historyManager.addEntry('create', { id: 1, name: 'Item 1' });

// Update operation
historyManager.addEntry('update', { id: 1, name: 'Updated Item 1' });

// Delete operation
historyManager.addEntry('delete', { id: 1 });

// Undo last operation
const lastAction = historyManager.undo();

// Redo last undone operation
const redoneAction = historyManager.redo();

// Get current state
const currentState = historyManager.getCurrentState();

// Get history statistics
const stats = historyManager.getHistoryStats();
*/

async function loadHistoryFromBackend() {
    try {
        const history = await EmotionService.getEmotionHistory();
        // Render history ke UI sesuai kebutuhan aplikasi
        renderHistory(history);
    } catch (error) {
        console.error('Gagal mengambil history dari backend:', error);
    }
}

// Panggil loadHistoryFromBackend() saat halaman/history siap
