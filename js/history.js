/**
 * History Page JavaScript
 * Handles history page functionality and data management
 */

const emotionChannel = ('BroadcastChannel' in window) ? new BroadcastChannel('emotion-data') : null;
if (emotionChannel) {
    emotionChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'new-emotion') {
            const currentFilters = getCurrentFilters();
            loadHistoryData().then(() => {
                applyCurrentFilters(currentFilters);
                showNotification('Data emosi baru masuk', 'success');
                // Scroll ke atas dan highlight baris terbaru
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    const tbody = document.getElementById('historyTableBody');
                    if (tbody && tbody.firstChild && tbody.firstChild.nodeType === 1) {
                        tbody.firstChild.classList.add('highlight-new');
                        setTimeout(() => {
                            tbody.firstChild.classList.remove('highlight-new');
                        }, 2000);
                    }
                }, 100);
            });
        }
    };
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize history page
    initializeHistory();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    loadHistoryData();
    
    // Event listener untuk tombol Tampilkan Semua
    const showAllBtn = document.getElementById('showAllHistory');
    if (showAllBtn) {
        showAllBtn.addEventListener('click', showAllHistory);
    }
});

function initializeHistory() {
    console.log('History page initialized');
    
    // Set default date range
    const dateRange = document.getElementById('dateRange');
    if (dateRange) {
        dateRange.value = '30';
    }
}

function setupEventListeners() {
    // Filter controls
    const applyFiltersBtn = document.getElementById('applyFilters');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const exportDataBtn = document.getElementById('exportData');
    const refreshTableBtn = document.getElementById('refreshTable');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    }
    
    if (refreshTableBtn) {
        refreshTableBtn.addEventListener('click', refreshTable);
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Pagination
    const paginationButtons = document.querySelectorAll('.pagination-controls button');
    paginationButtons.forEach(button => {
        button.addEventListener('click', handlePagination);
    });
    
    // Page size selector
    const pageSizeSelect = document.getElementById('pageSize');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', handlePageSizeChange);
    }
    
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', handleSelectAll);
    }
    
    // Row checkboxes
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    rowCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleRowSelection);
    });
    
    // Action buttons
    const actionButtons = document.querySelectorAll('.action-buttons button');
    actionButtons.forEach(button => {
        button.addEventListener('click', handleAction);
    });
}

async function loadHistoryData() {
    // Ambil semua data dari hybridStorage/dataStorage tanpa limit
    const storage = window.hybridStorage || window.dataStorage;
    let data = [];
    let mode = 'local';
    try {
        if (storage && typeof storage.getEmotionData === 'function') {
            data = await storage.getEmotionData({ limit: 10000, sortBy: 'timestamp', sortOrder: 'desc' });
            if (typeof storage.getStorageMode === 'function') {
                mode = await storage.getStorageMode();
            }
        }
        // Fallback: jika data bukan array, coba parse manual
        if (!Array.isArray(data)) {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error('[HISTORY] Data in storage is not valid JSON array:', data);
                data = [];
            }
        }
        // MIGRASI OTOMATIS: pastikan setiap entry punya field utama
        let migrated = false;
        data = data.map(entry => {
            let changed = false;
            let dominantEmotion = entry.dominantEmotion || entry.emotion || entry.feeling || entry.mood || 'neutral';
            let source = entry.source || entry.inputType || entry.type || 'camera';
            let confidence = (typeof entry.confidence === 'number') ? entry.confidence : (entry.confidence ? parseFloat(entry.confidence) : (entry.score ? parseFloat(entry.score) : 0.8));
            if (isNaN(confidence) || confidence < 0 || confidence > 1) confidence = 0.8;
            let timestamp = entry.timestamp || entry.createdAt || entry.date || new Date().toISOString();
            if (!entry.dominantEmotion) { entry.dominantEmotion = dominantEmotion; changed = true; }
            if (!entry.source) { entry.source = source; changed = true; }
            if (!entry.timestamp) { entry.timestamp = timestamp; changed = true; }
            if (entry.confidence === undefined || entry.confidence === null || isNaN(entry.confidence)) { entry.confidence = confidence; changed = true; }
            if (changed) migrated = true;
            return entry;
        });
        // Jika ada migrasi, simpan ulang ke localStorage
        if (migrated && mode === 'local') {
            try {
                localStorage.setItem('aiEmotionData', JSON.stringify(data));
                console.log('[HISTORY] Migrated and fixed data saved to localStorage.');
            } catch (e) {
                console.error('[HISTORY] Failed to save migrated data:', e);
            }
        }
    } catch (err) {
        console.error('[HISTORY] Error loading data from storage:', err);
        data = [];
    }
    console.log('[HISTORY] Data loaded from storage:', data);
    window._historyData = data;
    updateStatistics(data);
    updateTableData(data);
    // Sembunyikan pagination
    const pagination = document.querySelector('.pagination-controls');
    if (pagination) pagination.style.display = 'none';
    // Update status mode penyimpanan di UI
    const modeText = mode === 'database' ? 'Database (MySQL)' : 'Local Storage';
    const el = document.getElementById('storageModeStatus');
    if (el) el.textContent = modeText;
    // Update storage info section
    updateStorageInfo(data, storage);
}

function applyFilters() {
    const dateRange = document.getElementById('dateRange').value;
    const emotionFilter = document.getElementById('emotionFilter').value;
    const inputType = document.getElementById('inputType').value;
    const searchTerm = document.getElementById('searchInput').value;
    
    console.log('Applying filters:', {
        dateRange,
        emotionFilter,
        inputType,
        searchTerm
    });
    
    // Simulate API call with filters
    showNotification('Filters applied successfully', 'success');
    
    // Reload data with filters
    loadHistoryData();
}

function clearFilters() {
    // Reset all filter inputs
    document.getElementById('dateRange').value = '30';
    document.getElementById('emotionFilter').value = 'all';
    document.getElementById('inputType').value = 'all';
    document.getElementById('searchInput').value = '';
    
    console.log('Filters cleared');
    showNotification('Filters cleared', 'info');
    
    // Reload data without filters
    loadHistoryData();
}

function exportData() {
    console.log('Exporting data...');
    
    // Simulate export process
    showNotification('Exporting data...', 'info');
    
    setTimeout(() => {
        showNotification('Data exported successfully!', 'success');
        
        // Create and download CSV file
        const csvContent = generateCSV();
        downloadCSV(csvContent, 'emotion_history.csv');
    }, 2000);
}

function refreshTable() {
    console.log('Refreshing table...');
    showNotification('Refreshing data...', 'info');
    
    // Reload data
    loadHistoryData();
    
    setTimeout(() => {
        showNotification('Data refreshed successfully', 'success');
    }, 1000);
}

function handleSearch(event) {
    const searchTerm = event.target.value;
    console.log('Searching for:', searchTerm);
    
    // Filter table rows based on search term
    filterTableRows(searchTerm);
}

function handlePagination(event) {
    const button = event.target.closest('button');
    const action = button.id;
    
    console.log('Pagination action:', action);
    
    // Handle different pagination actions
    switch(action) {
        case 'firstPage':
            goToPage(1);
            break;
        case 'prevPage':
            goToPreviousPage();
            break;
        case 'nextPage':
            goToNextPage();
            break;
        case 'lastPage':
            goToLastPage();
            break;
        default:
            // Page number button
            const pageNumber = parseInt(button.textContent);
            if (!isNaN(pageNumber)) {
                goToPage(pageNumber);
            }
    }
}

function handlePageSizeChange(event) {
    const pageSize = event.target.value;
    console.log('Page size changed to:', pageSize);
    
    // Update pagination with new page size
    updatePagination();
    loadHistoryData();
}

function handleSelectAll(event) {
    const isChecked = event.target.checked;
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    
    rowCheckboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
    });
    
    updateBulkActions();
}

function handleRowSelection(event) {
    updateBulkActions();
    updateSelectAllCheckbox();
}

function handleAction(event) {
    const button = event.target.closest('button');
    const action = button.title || button.textContent.trim();
    const row = button.closest('tr');
    
    console.log('Action:', action, 'on row:', row);
    
    switch(action.toLowerCase()) {
        case 'view details':
            viewDetails(row);
            break;
        case 'edit':
            editRow(row);
            break;
        case 'delete':
            deleteRow(row);
            break;
        default:
            console.log('Unknown action:', action);
    }
}

function updateStatistics(data = window._historyData || []) {
    // Contoh: total entries
    const totalEntries = data.length;
    const el = document.getElementById('totalEntries');
    if (el) el.textContent = totalEntries;
    // (Tambahkan statistik lain sesuai kebutuhan)
}

function updateTableData(data) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No history data available.</td></tr>';
        return;
    }
    // Pastikan data diurutkan terbaru di atas
    data.sort((a, b) => new Date(b.timestamp || b.createdAt || b.date || 0) - new Date(a.timestamp || a.createdAt || a.date || 0));
    data.forEach((entry, idx) => {
        // Ambil field dari berbagai kemungkinan format data
        const dateRaw = entry.timestamp || entry.createdAt || entry.date || Date.now();
        let dateObj;
        try { dateObj = new Date(dateRaw); } catch { dateObj = new Date(); }
        const dateStr = dateObj.toLocaleDateString();
        const timeStr = dateObj.toLocaleTimeString();
        const emotion = entry.emotion || entry.dominantEmotion || entry.feeling || entry.mood || '-';
        const confidence = (entry.confidence !== undefined && entry.confidence !== null) ? ((entry.confidence * 100).toFixed(1) + '%') : (entry.score !== undefined ? ((entry.score * 100).toFixed(1) + '%') : '-');
        const source = entry.source || entry.inputType || entry.type || '-';
        const notes = entry.notes || entry.comment || entry.text || '';
        const status = entry.status || entry.state || 'Recorded';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="row-checkbox"></td>
            <td><div class="datetime-cell"><div class="date">${dateStr}</div><div class="time">${timeStr}</div></div></td>
            <td><div class="emotion-cell"><span class="emotion-icon">${getEmotionIcon(emotion)}</span> <span>${capitalizeFirst(emotion)}</span></div></td>
            <td>${confidence}</td>
            <td>${capitalizeFirst(source)}</td>
            <td>${notes}</td>
            <td>${status}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-outline" title="View"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-outline" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getEmotionIcon(emotion) {
    const icons = {
        happy: '😊', sad: '😢', angry: '😠', neutral: '😐', surprised: '😲', fearful: '😨', disgust: '🤢', excited: '🤩', confused: '😕', '-': '❓'
    };
    return icons[emotion?.toLowerCase()] || '❓';
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function updatePagination() {
    // Update pagination controls
    const currentPage = 1;
    const totalPages = 125;
    const pageSize = document.getElementById('pageSize').value;
    
    // Update pagination info
    const startIndex = document.getElementById('startIndex');
    const endIndex = document.getElementById('endIndex');
    const totalItems = document.getElementById('totalItems');
    
    if (startIndex) startIndex.textContent = '1';
    if (endIndex) endIndex.textContent = pageSize;
    if (totalItems) totalItems.textContent = '1,247';
    
    // Update pagination buttons
    updatePaginationButtons(currentPage, totalPages);
}

function filterTableRows(searchTerm) {
    const tableRows = document.querySelectorAll('#historyTableBody tr');
    
    tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const matches = text.includes(searchTerm.toLowerCase());
        row.style.display = matches ? '' : 'none';
    });
}

function updateBulkActions() {
    const selectedRows = document.querySelectorAll('.row-checkbox:checked');
    const bulkActionsBtn = document.getElementById('bulkActions');
    
    if (bulkActionsBtn) {
        bulkActionsBtn.disabled = selectedRows.length === 0;
        bulkActionsBtn.textContent = `Bulk Actions (${selectedRows.length})`;
    }
}

function updateSelectAllCheckbox() {
    const allCheckboxes = document.querySelectorAll('.row-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
    const selectAllCheckbox = document.getElementById('selectAll');
    
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = checkedCheckboxes.length === allCheckboxes.length;
        selectAllCheckbox.indeterminate = checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
    }
}

function viewDetails(row) {
    const emotion = row.querySelector('.emotion-label').textContent;
    const date = row.querySelector('.date').textContent;
    
    console.log('Viewing details for:', emotion, 'on', date);
    showNotification(`Viewing details for ${emotion} on ${date}`, 'info');
}

function editRow(row) {
    const emotion = row.querySelector('.emotion-label').textContent;
    const date = row.querySelector('.date').textContent;
    
    console.log('Editing row for:', emotion, 'on', date);
    showNotification(`Editing ${emotion} entry from ${date}`, 'info');
}

function deleteRow(row) {
    const emotion = row.querySelector('.emotion-label').textContent;
    const date = row.querySelector('.date').textContent;
    
    if (confirm(`Are you sure you want to delete the ${emotion} entry from ${date}?`)) {
        console.log('Deleting row for:', emotion, 'on', date);
        row.remove();
        showNotification(`Deleted ${emotion} entry from ${date}`, 'success');
        updateStatistics();
    }
}

function generateCSV() {
    // Generate CSV content from table data
    const headers = ['Date', 'Time', 'Emotion', 'Confidence', 'Input Type', 'Notes', 'Status'];
    const rows = [];
    
    // Get data from table rows
    const tableRows = document.querySelectorAll('#historyTableBody tr');
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 1) {
            const rowData = [
                cells[1].querySelector('.date')?.textContent || '',
                cells[1].querySelector('.time')?.textContent || '',
                cells[2].querySelector('.emotion-label')?.textContent || '',
                cells[3].querySelector('span')?.textContent || '',
                cells[4].textContent || '',
                cells[5].textContent || '',
                cells[6].textContent || ''
            ];
            rows.push(rowData);
        }
    });
    
    // Create CSV content
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    
    return csvContent;
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Auto hide after 5 seconds
    setTimeout(() => {
        hideNotification(notification);
    }, 5000);

    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        hideNotification(notification);
    });
}

function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Pagination helper functions
function goToPage(pageNumber) {
    console.log('Going to page:', pageNumber);
    // Implement page navigation logic
}

function goToPreviousPage() {
    console.log('Going to previous page');
    // Implement previous page logic
}

function goToNextPage() {
    console.log('Going to next page');
    // Implement next page logic
}

function goToLastPage() {
    console.log('Going to last page');
    // Implement last page logic
}

function updatePaginationButtons(currentPage, totalPages) {
    // Update pagination button states
    const firstPageBtn = document.getElementById('firstPage');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const lastPageBtn = document.getElementById('lastPage');
    
    if (firstPageBtn) firstPageBtn.disabled = currentPage === 1;
    if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;
    if (lastPageBtn) lastPageBtn.disabled = currentPage === totalPages;
}

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

// Fungsi bantu untuk mengambil filter/search aktif
function getCurrentFilters() {
    return {
        dateRange: document.getElementById('dateRange')?.value || '',
        emotionFilter: document.getElementById('emotionFilter')?.value || '',
        inputType: document.getElementById('inputType')?.value || '',
        searchTerm: document.getElementById('searchInput')?.value || ''
    };
}

// Fungsi bantu untuk menerapkan filter/search setelah reload data
function applyCurrentFilters(filters) {
    if (!filters) return;
    if (document.getElementById('dateRange')) document.getElementById('dateRange').value = filters.dateRange;
    if (document.getElementById('emotionFilter')) document.getElementById('emotionFilter').value = filters.emotionFilter;
    if (document.getElementById('inputType')) document.getElementById('inputType').value = filters.inputType;
    if (document.getElementById('searchInput')) document.getElementById('searchInput').value = filters.searchTerm;
    // Terapkan filter/search ke tabel
    if (filters.searchTerm) filterTableRows(filters.searchTerm);
}

function showAllHistory() {
    // Clear semua filter
    if (document.getElementById('dateRange')) document.getElementById('dateRange').value = '365';
    if (document.getElementById('emotionFilter')) document.getElementById('emotionFilter').value = 'all';
    if (document.getElementById('inputType')) document.getElementById('inputType').value = 'all';
    if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
    // Load semua data tanpa filter
    loadHistoryData();
}

// Tambahkan CSS highlight di JS jika belum ada
(function addHighlightStyle() {
    if (!document.getElementById('highlightNewStyle')) {
        const style = document.createElement('style');
        style.id = 'highlightNewStyle';
        style.innerHTML = `.highlight-new { background: #d1ffe6 !important; transition: background 1s; }`;
        document.head.appendChild(style);
    }
})();

function updateStorageInfo(data, storage) {
    const el = document.getElementById('storageInfo');
    if (!el) return;
    const total = data && Array.isArray(data) ? data.length : 0;
    let storageType = 'Unknown';
    let hasAdd = false, hasGet = false, hasDelete = false;
    if (storage) {
        if (storage.constructor && storage.constructor.name) {
            storageType = storage.constructor.name;
        } else if (storage.storageType) {
            storageType = storage.storageType;
        }
        hasAdd = typeof storage.addEmotionData === 'function' || typeof storage.saveEmotionData === 'function';
        hasGet = typeof storage.getEmotionData === 'function';
        hasDelete = typeof storage.deleteEmotionData === 'function';
    }
    el.innerHTML = `
        <b>Storage Info:</b> &nbsp; 
        <span>Total Entries: <b>${total}</b></span> &nbsp; | &nbsp;
        <span>Storage Type: <b>${storageType}</b></span> &nbsp; | &nbsp;
        <span>Add Data: ${hasAdd ? '✅' : '❌'}</span> &nbsp; | &nbsp;
        <span>Get Data: ${hasGet ? '✅' : '❌'}</span> &nbsp; | &nbsp;
        <span>Delete Data: ${hasDelete ? '✅' : '❌'}</span>
    `;
}
