/**
 * Dashboard CRUD Operations
 * Handles Create, Read, Update, Delete operations for emotion data
 */

class DashboardCRUD {
    constructor() {
        this.currentData = [];
        this.filteredData = [];
        this.selectedEntries = new Set();
        this.currentTab = 'entries';
        this.dataStorage = new DataStorage();
        
        this.initializeEventListeners();
        this.loadData();
    }

    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAll');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        // Entry edit form
        const entryEditForm = document.getElementById('entryEditForm');
        if (entryEditForm) {
            entryEditForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEntryEdit();
            });
        }

        // Confidence slider
        const confidenceSlider = document.getElementById('editConfidence');
        if (confidenceSlider) {
            confidenceSlider.addEventListener('input', (e) => {
                document.getElementById('confidenceValue').textContent = e.target.value + '%';
            });
        }
    }

    async loadData() {
        try {
            this.showLoading(true);
            
            // Initialize DataStorage if not already done
            if (!this.dataStorage.isInitialized) {
                await this.dataStorage.init();
            }
            
            this.currentData = await this.dataStorage.getEmotionData();
            this.filteredData = [...this.currentData];
            this.renderData();
            this.updateAnalytics();
            
            console.log('Dashboard data loaded:', this.currentData.length, 'entries');
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load data: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    renderData() {
        this.renderRecentEntries();
        this.renderDataManagerTable();
        this.updateStats();
    }

    renderRecentEntries() {
        const tbody = document.getElementById('recentEntriesBody');
        if (!tbody) return;

        const recentData = this.currentData
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        tbody.innerHTML = recentData.map(entry => `
            <tr>
                <td>${this.formatDate(entry.timestamp)}</td>
                <td>
                    <span class="emotion-badge ${entry.dominantEmotion}">
                        ${this.getEmotionIcon(entry.dominantEmotion)} ${entry.dominantEmotion}
                    </span>
                </td>
                <td>${Math.round(entry.confidence * 100)}%</td>
                <td>
                    <button class="btn btn-sm" onclick="dashboard.editEntry('${entry.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="dashboard.deleteEntry('${entry.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderDataManagerTable() {
        const tbody = document.getElementById('dataManagerBody');
        if (!tbody) return;

        tbody.innerHTML = this.filteredData.map(entry => `
            <tr data-id="${entry.id}">
                <td>
                    <input type="checkbox" class="entry-checkbox" value="${entry.id}" 
                           ${this.selectedEntries.has(entry.id) ? 'checked' : ''}>
                </td>
                <td>${this.formatDate(entry.timestamp)}</td>
                <td>${this.formatTime(entry.timestamp)}</td>
                <td>
                    <span class="emotion-badge ${entry.dominantEmotion}">
                        ${this.getEmotionIcon(entry.dominantEmotion)} ${entry.dominantEmotion}
                    </span>
                </td>
                <td>${Math.round(entry.confidence * 100)}%</td>
                <td>${entry.source || 'Manual'}</td>
                <td>
                    <button class="btn btn-sm" onclick="dashboard.editEntry('${entry.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="dashboard.deleteEntry('${entry.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="dashboard.viewEntryDetails('${entry.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Add event listeners to checkboxes
        tbody.querySelectorAll('.entry-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleEntrySelection(e.target.value, e.target.checked);
            });
        });
    }

    updateStats() {
        const totalEntries = this.currentData.length;
        const validEntries = this.currentData.filter(entry => entry.confidence > 0.5).length;
        const highStressCount = this.currentData.filter(entry => 
            entry.dominantEmotion === 'angry' || entry.dominantEmotion === 'sad'
        ).length;
        const uniqueUsers = new Set(this.currentData.map(entry => entry.userId || 'anonymous')).size;

        // Update stat elements
        const elements = {
            'totalEntries': totalEntries,
            'validEntries': validEntries,
            'highStressCount': highStressCount,
            'activeUsers': uniqueUsers
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        // Update data quality
        const dataQualityElement = document.getElementById('dataQuality');
        if (dataQualityElement) {
            const qualityPercentage = totalEntries > 0 ? Math.round((validEntries / totalEntries) * 100) : 0;
            dataQualityElement.textContent = qualityPercentage >= 90 ? 'Excellent' : 
                                           qualityPercentage >= 80 ? 'Good' : 
                                           qualityPercentage >= 70 ? 'Fair' : 'Poor';
        }
    }

    updateAnalytics() {
        this.updateDataQualityMetrics();
        this.updateEmotionDistribution();
        this.updateTrendAnalysis();
        this.updateAnomalyDetection();
    }

    updateDataQualityMetrics() {
        const metric = document.getElementById('dataQualityMetric');
        if (!metric) return;

        const totalEntries = this.currentData.length;
        const validEntries = this.currentData.filter(entry => entry.confidence > 0.5).length;
        const qualityPercentage = totalEntries > 0 ? Math.round((validEntries / totalEntries) * 100) : 0;

        metric.innerHTML = `
            <div class="metric-item">
                <span class="metric-label">Data Quality:</span>
                <span class="metric-value ${qualityPercentage >= 90 ? 'excellent' : qualityPercentage >= 80 ? 'good' : 'poor'}">
                    ${qualityPercentage}%
                </span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Total Entries:</span>
                <span class="metric-value">${totalEntries}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Valid Entries:</span>
                <span class="metric-value">${validEntries}</span>
            </div>
        `;
    }

    updateEmotionDistribution() {
        const metric = document.getElementById('emotionDistributionMetric');
        if (!metric) return;

        const emotionCounts = {};
        this.currentData.forEach(entry => {
            emotionCounts[entry.dominantEmotion] = (emotionCounts[entry.dominantEmotion] || 0) + 1;
        });

        const total = this.currentData.length;
        const distribution = Object.entries(emotionCounts).map(([emotion, count]) => ({
            emotion,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
        }));

        metric.innerHTML = distribution.map(item => `
            <div class="metric-item">
                <span class="metric-label">${item.emotion}:</span>
                <span class="metric-value">${item.count} (${item.percentage}%)</span>
            </div>
        `).join('');
    }

    updateTrendAnalysis() {
        const metric = document.getElementById('trendAnalysisMetric');
        if (!metric) return;

        // Group data by day
        const dailyData = {};
        this.currentData.forEach(entry => {
            const date = new Date(entry.timestamp).toDateString();
            if (!dailyData[date]) dailyData[date] = [];
            dailyData[date].push(entry);
        });

        const trends = Object.entries(dailyData).map(([date, entries]) => {
            const avgConfidence = entries.reduce((sum, entry) => sum + entry.confidence, 0) / entries.length;
            const dominantEmotion = this.getMostFrequentEmotion(entries);
            return { date, entries: entries.length, avgConfidence, dominantEmotion };
        });

        const recentTrend = trends.slice(-3);
        const trendDirection = recentTrend.length >= 2 ? 
            (recentTrend[recentTrend.length - 1].avgConfidence > recentTrend[recentTrend.length - 2].avgConfidence ? 'up' : 'down') : 'stable';

        metric.innerHTML = `
            <div class="metric-item">
                <span class="metric-label">Trend Direction:</span>
                <span class="metric-value ${trendDirection === 'up' ? 'positive' : trendDirection === 'down' ? 'negative' : 'neutral'}">
                    ${trendDirection.toUpperCase()}
                </span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Recent Entries:</span>
                <span class="metric-value">${recentTrend.reduce((sum, day) => sum + day.entries, 0)}</span>
            </div>
        `;
    }

    updateAnomalyDetection() {
        const metric = document.getElementById('anomalyDetectionMetric');
        if (!metric) return;

        // Simple anomaly detection based on confidence outliers
        const confidences = this.currentData.map(entry => entry.confidence);
        const mean = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
        const variance = confidences.reduce((sum, conf) => sum + Math.pow(conf - mean, 2), 0) / confidences.length;
        const stdDev = Math.sqrt(variance);

        const anomalies = this.currentData.filter(entry => 
            Math.abs(entry.confidence - mean) > 2 * stdDev
        );

        metric.innerHTML = `
            <div class="metric-item">
                <span class="metric-label">Anomalies Detected:</span>
                <span class="metric-value ${anomalies.length > 0 ? 'warning' : 'success'}">
                    ${anomalies.length}
                </span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Avg Confidence:</span>
                <span class="metric-value">${Math.round(mean * 100)}%</span>
            </div>
        `;
    }

    // CRUD Operations
    async createEntry(entryData) {
        try {
            const newEntry = {
                id: this.generateId(),
                timestamp: new Date().toISOString(),
                ...entryData
            };

            await this.dataStorage.saveEmotionData(newEntry);
            this.currentData.push(newEntry);
            this.renderData();
            this.showSuccess('Entry created successfully');
            return newEntry;
        } catch (error) {
            console.error('Error creating entry:', error);
            this.showError('Failed to create entry');
            throw error;
        }
    }

    async updateEntry(id, updates) {
        try {
            const index = this.currentData.findIndex(entry => entry.id === id);
            if (index === -1) throw new Error('Entry not found');

            const updatedEntry = { ...this.currentData[index], ...updates };
            await this.dataStorage.updateEmotionData(id, updatedEntry);
            
            this.currentData[index] = updatedEntry;
            this.renderData();
            this.showSuccess('Entry updated successfully');
            return updatedEntry;
        } catch (error) {
            console.error('Error updating entry:', error);
            this.showError('Failed to update entry');
            throw error;
        }
    }

    async deleteEntry(id) {
        try {
            if (!confirm('Are you sure you want to delete this entry?')) return;

            await this.dataStorage.deleteEmotionData(id);
            this.currentData = this.currentData.filter(entry => entry.id !== id);
            this.selectedEntries.delete(id);
            this.renderData();
            this.showSuccess('Entry deleted successfully');
        } catch (error) {
            console.error('Error deleting entry:', error);
            this.showError('Failed to delete entry');
        }
    }

    async deleteSelected() {
        try {
            if (this.selectedEntries.size === 0) {
                this.showWarning('No entries selected');
                return;
            }

            if (!confirm(`Are you sure you want to delete ${this.selectedEntries.size} selected entries?`)) return;

            const deletePromises = Array.from(this.selectedEntries).map(id => 
                this.dataStorage.deleteEmotionData(id)
            );
            await Promise.all(deletePromises);

            this.currentData = this.currentData.filter(entry => !this.selectedEntries.has(entry.id));
            this.selectedEntries.clear();
            this.renderData();
            this.showSuccess(`${this.selectedEntries.size} entries deleted successfully`);
        } catch (error) {
            console.error('Error deleting selected entries:', error);
            this.showError('Failed to delete selected entries');
        }
    }

    // Filtering and Search
    filterData() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const emotionFilter = document.getElementById('emotionFilter').value;

        this.filteredData = this.currentData.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            const matchesDateRange = (!startDate || entryDate >= new Date(startDate)) &&
                                   (!endDate || entryDate <= new Date(endDate));
            const matchesEmotion = !emotionFilter || entry.dominantEmotion === emotionFilter;

            return matchesDateRange && matchesEmotion;
        });

        this.renderDataManagerTable();
        this.showSuccess(`Filtered ${this.filteredData.length} entries`);
    }

    clearFilters() {
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('emotionFilter').value = '';
        this.filteredData = [...this.currentData];
        this.renderDataManagerTable();
        this.showSuccess('Filters cleared');
    }

    // Export functionality
    async exportData() {
        try {
            const format = document.getElementById('exportFormat').value;
            const startDate = document.getElementById('exportStartDate').value;
            const endDate = document.getElementById('exportEndDate').value;

            let dataToExport = this.currentData;

            if (startDate || endDate) {
                dataToExport = this.currentData.filter(entry => {
                    const entryDate = new Date(entry.timestamp);
                    return (!startDate || entryDate >= new Date(startDate)) &&
                           (!endDate || entryDate <= new Date(endDate));
                });
            }

            switch (format) {
                case 'json':
                    this.exportAsJSON(dataToExport);
                    break;
                case 'csv':
                    this.exportAsCSV(dataToExport);
                    break;
                case 'excel':
                    await this.exportAsExcel(dataToExport);
                    break;
                case 'pdf':
                    await this.exportAsPDF(dataToExport);
                    break;
            }

            this.showSuccess(`Data exported as ${format.toUpperCase()}`);
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showError('Failed to export data');
        }
    }

    exportAsJSON(data) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emotion-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportAsCSV(data) {
        const headers = ['Date', 'Time', 'Emotion', 'Confidence', 'Source', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...data.map(entry => [
                this.formatDate(entry.timestamp),
                this.formatTime(entry.timestamp),
                entry.dominantEmotion,
                Math.round(entry.confidence * 100) + '%',
                entry.source || 'Manual',
                entry.notes || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emotion-data-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async exportAsExcel(data) {
        // This would require a library like SheetJS
        // For now, we'll export as CSV with .xlsx extension
        this.exportAsCSV(data);
    }

    async exportAsPDF(data) {
        // This would require a library like jsPDF
        // For now, we'll show a message
        this.showInfo('PDF export requires additional libraries. Please use JSON or CSV export.');
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString();
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString();
    }

    getEmotionIcon(emotion) {
        const icons = {
            happy: '😊',
            sad: '😢',
            angry: '😠',
            neutral: '😐',
            fearful: '😨',
            surprised: '😲',
            disgusted: '🤢'
        };
        return icons[emotion] || '😐';
    }

    getMostFrequentEmotion(entries) {
        const emotionCounts = {};
        entries.forEach(entry => {
            emotionCounts[entry.dominantEmotion] = (emotionCounts[entry.dominantEmotion] || 0) + 1;
        });
        return Object.entries(emotionCounts)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Tab');
        });

        this.currentTab = tabName;

        if (tabName === 'analytics') {
            this.updateAnalytics();
        }
    }

    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.entry-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            this.toggleEntrySelection(checkbox.value, checked);
        });
    }

    toggleEntrySelection(id, selected) {
        if (selected) {
            this.selectedEntries.add(id);
        } else {
            this.selectedEntries.delete(id);
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize dashboard CRUD when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardCRUD = new DashboardCRUD();
});
