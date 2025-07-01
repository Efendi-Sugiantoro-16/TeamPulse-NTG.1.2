/**
 * Dashboard Management System
 * Comprehensive dashboard with data visualization, statistics, and interactive features
 */

class Dashboard {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentPeriod = 'day';
        this.charts = {};
        this.storage = null;
        this.isLoading = false;
        this.chartType = 'bar'; // default
        // BroadcastChannel listener untuk realtime update
        if ('BroadcastChannel' in window) {
            this.channel = new BroadcastChannel('emotion-data');
            this.channel.onmessage = (event) => {
                if (event.data && event.data.type === 'new-emotion') {
                    this.refreshData();
                }
            };
        } else if (window.addEventListener) {
            // Fallback: listen to storage event
            window.addEventListener('storage', (event) => {
                if (event.key && event.key.includes('emotion')) {
                    this.refreshData();
                }
            });
        }
        // Initialize components
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Dashboard...');
            
            // Wait for storage to be available
            await this.waitForStorage();
            
            // Verify storage is properly initialized
            if (!this.storage) {
                throw new Error('Storage system failed to initialize');
            }
            
            console.log('Storage system initialized:', {
                storageType: this.storage.constructor.name,
                hasGetEmotionData: typeof this.storage.getEmotionData === 'function',
                hasDeleteEmotionData: typeof this.storage.deleteEmotionData === 'function',
                hasAddEmotionData: typeof this.storage.addEmotionData === 'function'
            });
            
            // Initialize event listeners
            this.initEventListeners();
            
            // Load initial data
            await this.loadData();
            
            // Render all components
            this.renderStatistics();
            this.renderCharts();
            this.renderRecentEntries();
            this.renderActivityFeed();
            this.renderStorageStatus();
            this.renderRecentSummary();
            
            // Add dummy data button for testing
            this.addDummyDataButton();
            
            console.log('Dashboard initialization completed successfully');
            
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.showError('Gagal menginisialisasi dashboard: ' + error.message);
        }
    }

    async waitForStorage() {
        return new Promise((resolve) => {
            const checkStorage = () => {
                // Check for HybridStorage first (preferred)
                if (window.hybridStorage && 
                    typeof window.hybridStorage.getEmotionData === 'function' &&
                    typeof window.hybridStorage.deleteEmotionData === 'function') {
                    this.storage = window.hybridStorage;
                    console.log('Using HybridStorage for data management');
                    resolve();
                } 
                // Fallback to DataStorage
                else if (window.dataStorage && 
                         typeof window.dataStorage.getEmotionData === 'function' &&
                         typeof window.dataStorage.deleteEmotionData === 'function') {
                    this.storage = window.dataStorage;
                    console.log('Using DataStorage for data management');
                    resolve();
                } 
                // Check if any storage is available but missing delete method
                else if (window.hybridStorage || window.dataStorage) {
                    console.warn('Storage found but missing required methods, waiting...');
                    setTimeout(checkStorage, 100);
                } 
                else {
                    console.log('Waiting for storage system to be available...');
                    setTimeout(checkStorage, 100);
                }
            };
            checkStorage();
        });
    }

    initEventListeners() {
        // Period selector
        const periodButtons = document.querySelectorAll('.period-btn');
        periodButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setPeriod(e.target.dataset.period);
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // Export buttons
        const exportButtons = document.querySelectorAll('.dropdown-item[data-export]');
        exportButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.exportData(e.target.dataset.export);
            });
        });

        // Auto refresh every 30 seconds
        setInterval(() => this.refreshData(), 30000);

        // Tambahkan event listener untuk chart type selector
        const chartTypeSelector = document.getElementById('chartTypeSelector');
        if (chartTypeSelector) {
            chartTypeSelector.addEventListener('change', (e) => {
                this.chartType = e.target.value;
                this.renderEmotionDistributionChart();
            });
        }
    }

    async loadData() {
        this.isLoading = true;
        this.showLoading();

        try {
            // Get data from storage
            this.data = await this.storage.getEmotionData({ limit: 1000 });
            
            // Filter data based on current period
            this.filterDataByPeriod();
            
        } catch (error) {
            console.error('Failed to load data:', error);
            this.showError('Failed to load data');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    filterDataByPeriod() {
        const now = new Date();
        let startDate;

        switch (this.currentPeriod) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(0);
        }

        this.filteredData = this.data.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= startDate;
        });
    }

    setPeriod(period) {
        this.currentPeriod = period;
        
        // Update active button
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
        
        // Re-filter and re-render
        this.filterDataByPeriod();
        this.renderStatistics();
        this.renderCharts();
        this.renderRecentEntries();
        this.renderActivityFeed();
        this.renderRecentSummary();
    }

    async refreshData() {
        await this.loadData();
        this.renderStatistics();
        this.renderCharts();
        this.renderRecentEntries();
        this.renderActivityFeed();
        this.renderStorageStatus();
        this.renderRecentSummary();
        this.renderEmotionDistributionChart();
        this.showSuccess('Data refreshed successfully');
    }

    renderRecentSummary() {
        const recentData = this.filteredData.slice(0, 10);
        const summaryContainer = document.getElementById('recentSummary');
        
        if (!summaryContainer) {
            // Buat container jika belum ada
            const dashboardContent = document.querySelector('.dashboard-content');
            if (dashboardContent) {
                const summaryDiv = document.createElement('div');
                summaryDiv.id = 'recentSummary';
                summaryDiv.className = 'recent-summary mb-4';
                dashboardContent.insertBefore(summaryDiv, dashboardContent.firstChild);
            }
        }

        if (recentData.length === 0) {
            if (summaryContainer) {
                summaryContainer.innerHTML = '<div class="message info">Belum ada data recent entries. Silakan tambah data emosi terlebih dahulu.</div>';
            }
            return;
        }

        const emotionCounts = {};
        const avgConfidence = recentData.reduce((sum, item) => sum + (item.confidence || 0), 0) / recentData.length;
        
        recentData.forEach(item => {
            const emotion = item.dominantEmotion || 'unknown';
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });

        const dominantEmotion = Object.entries(emotionCounts).reduce((a, b) => 
            emotionCounts[a] > emotionCounts[b] ? a : b);

        const summaryHTML = `
            <div class="summary-card">
                <div class="summary-header">
                    <h3><i class="fas fa-chart-line"></i> Ringkasan Recent Entries (10 Terbaru)</h3>
                </div>
                <div class="summary-content">
                    <div class="summary-item">
                        <span class="summary-label">Total Entries:</span>
                        <span class="summary-value">${recentData.length}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Emosi Dominan:</span>
                        <span class="summary-value emotion-badge ${dominantEmotion}">${dominantEmotion}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Rata-rata Confidence:</span>
                        <span class="summary-value">${(avgConfidence * 100).toFixed(1)}%</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Rentang Waktu:</span>
                        <span class="summary-value">${this.getTimeRange(recentData)}</span>
                    </div>
                </div>
            </div>
        `;

        if (summaryContainer) {
            summaryContainer.innerHTML = summaryHTML;
        }
    }

    getTimeRange(data) {
        if (data.length < 2) return 'N/A';
        
        const firstTime = new Date(data[data.length - 1].timestamp);
        const lastTime = new Date(data[0].timestamp);
        const diffHours = Math.abs(lastTime - firstTime) / (1000 * 60 * 60);
        
        if (diffHours < 1) {
            const diffMinutes = Math.abs(lastTime - firstTime) / (1000 * 60);
            return `${diffMinutes.toFixed(0)} menit`;
        } else if (diffHours < 24) {
            return `${diffHours.toFixed(1)} jam`;
        } else {
            const diffDays = diffHours / 24;
            return `${diffDays.toFixed(1)} hari`;
        }
    }

    renderStatistics() {
        const stats = this.calculateStatistics();
        const recentStats = this.calculateRecentStatistics();
        
        // Update stat cards
        this.updateStatCard('totalEntries', stats.totalEntries);
        this.updateStatCard('overallMood', recentStats.overallMood); // Gunakan data recent untuk mood
        this.updateStatCard('stressLevel', recentStats.stressLevel); // Gunakan data recent untuk stress
        this.updateStatCard('engagement', stats.engagement);
        this.updateStatCard('dataQuality', recentStats.dataQuality); // Gunakan data recent untuk quality
        this.updateStatCard('activeUsers', stats.activeUsers);
    }

    calculateRecentStatistics() {
        const recentData = this.filteredData.slice(0, 10);
        const totalRecent = recentData.length;
        
        if (totalRecent === 0) {
            return {
                overallMood: 'Neutral',
                stressLevel: 'Low',
                dataQuality: 'Poor'
            };
        }

        // Emotion distribution dari recent data
        const emotionCounts = {};
        recentData.forEach(item => {
            const emotion = item.dominantEmotion || 'unknown';
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });

        // Overall mood (most frequent emotion dari recent data)
        const overallMood = Object.keys(emotionCounts).length > 0 
            ? Object.entries(emotionCounts).reduce((a, b) => emotionCounts[a] > emotionCounts[b] ? a : b)
            : 'Neutral';

        // Stress level berdasarkan negative emotions dari recent data
        const negativeEmotions = ['sad', 'angry', 'fear', 'disgust'];
        const negativeCount = negativeEmotions.reduce((sum, emotion) => 
            sum + (emotionCounts[emotion] || 0), 0);
        const stressPercentage = totalRecent > 0 ? (negativeCount / totalRecent) * 100 : 0;
        
        let stressLevel = 'Low';
        if (stressPercentage > 50) stressLevel = 'High';
        else if (stressPercentage > 25) stressLevel = 'Medium';

        // Data quality berdasarkan confidence scores dari recent data
        const avgConfidence = recentData.length > 0 
            ? recentData.reduce((sum, item) => sum + (item.confidence || 0), 0) / recentData.length
            : 0;
        
        let dataQuality = 'Poor';
        if (avgConfidence > 0.8) dataQuality = 'Excellent';
        else if (avgConfidence > 0.6) dataQuality = 'Good';
        else if (avgConfidence > 0.4) dataQuality = 'Fair';

        return {
            overallMood,
            stressLevel,
            dataQuality
        };
    }

    calculateStatistics() {
        const totalEntries = this.filteredData.length;
        
        // Emotion distribution
        const emotionCounts = {};
        this.filteredData.forEach(item => {
            const emotion = item.dominantEmotion || 'unknown';
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });

        // Overall mood (most frequent emotion)
        const overallMood = Object.keys(emotionCounts).length > 0 
            ? Object.entries(emotionCounts).reduce((a, b) => emotionCounts[a] > emotionCounts[b] ? a : b)
            : 'Neutral';

        // Stress level based on negative emotions
        const negativeEmotions = ['sad', 'angry', 'fear', 'disgust'];
        const negativeCount = negativeEmotions.reduce((sum, emotion) => 
            sum + (emotionCounts[emotion] || 0), 0);
        const stressPercentage = totalEntries > 0 ? (negativeCount / totalEntries) * 100 : 0;
        
        let stressLevel = 'Low';
        if (stressPercentage > 50) stressLevel = 'High';
        else if (stressPercentage > 25) stressLevel = 'Medium';

        // Engagement (based on data frequency)
        let engagement = 'Low';
        if (totalEntries > 50) engagement = 'High';
        else if (totalEntries > 20) engagement = 'Medium';

        // Data quality (based on confidence scores)
        const avgConfidence = this.filteredData.length > 0 
            ? this.filteredData.reduce((sum, item) => sum + (item.confidence || 0), 0) / this.filteredData.length
            : 0;
        
        let dataQuality = 'Poor';
        if (avgConfidence > 0.8) dataQuality = 'Excellent';
        else if (avgConfidence > 0.6) dataQuality = 'Good';
        else if (avgConfidence > 0.4) dataQuality = 'Fair';

        // Active users (unique user IDs)
        const uniqueUsers = new Set(this.filteredData.map(item => item.userId).filter(Boolean));
        const activeUsers = uniqueUsers.size;

        return {
            totalEntries,
            overallMood,
            stressLevel,
            engagement,
            dataQuality,
            activeUsers
        };
    }

    updateStatCard(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    renderCharts() {
        this.renderEmotionDistributionChart();
        this.renderTimeAnalysisChart();
        this.renderConfidenceChart();
        this.renderEmotionTrendChart();
    }

    renderEmotionDistributionChart() {
        const ctx = document.getElementById('emotionDistributionChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.emotionDistribution) {
            this.charts.emotionDistribution.destroy();
        }

        // Get recent entries for chart
        const recentEntries = this.data.slice(0, 10);
        if (recentEntries.length === 0) return;

        // Count emotions
        const emotionCounts = {};
        recentEntries.forEach(entry => {
            const emotion = entry.dominantEmotion || entry.emotion || 'unknown';
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
        const emotions = Object.keys(emotionCounts);
        const counts = emotions.map(emotion => emotionCounts[emotion]);
        const total = recentEntries.length;
        const avgEmotions = counts.map(count => (count / total) * 100); // proporsi emosi dalam %

        // Color mapping for emotions
        const emotionColors = {
            'happy': '#10b981',
            'sad': '#3b82f6',
            'angry': '#ef4444',
            'fear': '#f59e0b',
            'surprise': '#8b5cf6',
            'disgust': '#059669',
            'neutral': '#6b7280',
            'unknown': '#9ca3af'
        };
        const bgColors = emotions.map(emotion => emotionColors[emotion] || '#9ca3af');

        if (this.chartType === 'pie') {
            this.charts.emotionDistribution = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: emotions,
                    datasets: [{
                        data: counts,
                        backgroundColor: bgColors,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: { enabled: true }
                    }
                }
            });
        } else {
            // Bar chart: jumlah emosi & rata-rata emosi (%)
            this.charts.emotionDistribution = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: emotions,
                    datasets: [
                        {
                            label: 'Jumlah Emosi',
                            data: counts,
                            backgroundColor: bgColors,
                            yAxisID: 'y',
                        },
                        {
                            label: 'Rata-rata Emosi (%)',
                            data: avgEmotions,
                            backgroundColor: 'rgba(59,130,246,0.2)',
                            borderColor: '#3b82f6',
                            type: 'line',
                            yAxisID: 'y1',
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    if (context.dataset.label === 'Jumlah Emosi') {
                                        return `${context.dataset.label}: ${context.parsed.y}`;
                                    } else if (context.dataset.label === 'Rata-rata Emosi (%)') {
                                        return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                                    }
                                    return context.label;
                                }
                            }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Jumlah' } },
                        y1: {
                            beginAtZero: true,
                            position: 'right',
                            title: { display: true, text: 'Rata-rata Emosi (%)' },
                            grid: { drawOnChartArea: false },
                            min: 0,
                            max: 100
                        }
                    }
                }
            });
        }
    }

    renderTimeAnalysisChart() {
        const ctx = document.getElementById('timeAnalysisChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.timeAnalysis) {
            this.charts.timeAnalysis.destroy();
        }

        // Group data by hour
        const hourlyData = {};
        for (let i = 0; i < 24; i++) {
            hourlyData[i] = 0;
        }

        this.filteredData.forEach(item => {
            const hour = new Date(item.timestamp).getHours();
            hourlyData[hour]++;
        });

        const labels = Array.from({length: 24}, (_, i) => `${i}:00`);
        const data = Object.values(hourlyData);

        // Create gradient
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');

        this.charts.timeAnalysis = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
            datasets: [{
                    label: 'Jumlah Entries per Jam',
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: gradient,
                    borderWidth: 4,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 3,
                    pointRadius: 8,
                    pointHoverRadius: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '🕐 Aktivitas per Jam',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        color: '#1e293b',
                        padding: 20
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `📊 Entries: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Jam',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Jumlah Entries',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            stepSize: 1,
                            beginAtZero: true
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    renderConfidenceChart() {
        const ctx = document.getElementById('confidenceChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.confidence) {
            this.charts.confidence.destroy();
        }

        // Get recent data
        const recentData = this.filteredData.slice(0, 20);
        
        // Prepare data for confidence chart
        const labels = recentData.map((item, index) => `Entry ${index + 1}`);
        const confidenceData = recentData.map(item => (item.confidence || 0) * 100);
        const emotionData = recentData.map(item => item.dominantEmotion || 'unknown');

        // Color mapping for emotions
        const emotionColors = {
            'happy': '#10b981',
            'sad': '#3b82f6',
            'angry': '#ef4444',
            'fear': '#f59e0b',
            'surprise': '#8b5cf6',
            'disgust': '#059669',
            'neutral': '#6b7280',
            'unknown': '#9ca3af'
        };

        const colors = emotionData.map(emotion => emotionColors[emotion] || '#9ca3af');

        this.charts.confidence = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Confidence Score (%)',
                    data: confidenceData,
                    backgroundColor: colors,
                    borderColor: colors.map(color => this.adjustBrightness(color, -20)),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '🎯 Confidence Score per Entry (20 Terbaru)',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        color: '#1e293b',
                        padding: 20
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#10b981',
                        borderWidth: 2,
                        cornerRadius: 8,
                        callbacks: {
                            title: function(context) {
                                const index = context[0].dataIndex;
                                const emotion = emotionData[index];
                                return `Entry ${index + 1} - ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}`;
                            },
                            label: function(context) {
                                return `Confidence: ${context.parsed.y.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Entry',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Confidence (%)',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        min: 0,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    renderEmotionTrendChart() {
        const ctx = document.getElementById('emotionTrendChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.emotionTrend) {
            this.charts.emotionTrend.destroy();
        }

        // Get recent data and group by day
        const recentData = this.filteredData.slice(0, 50);
        const dailyData = {};
        
        recentData.forEach(item => {
            const date = new Date(item.timestamp).toLocaleDateString();
            if (!dailyData[date]) {
                dailyData[date] = {
                    happy: 0, sad: 0, angry: 0, fear: 0, 
                    surprise: 0, disgust: 0, neutral: 0, unknown: 0
                };
            }
            const emotion = item.dominantEmotion || 'unknown';
            dailyData[date][emotion]++;
        });

        const dates = Object.keys(dailyData);
        const emotions = ['happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral', 'unknown'];
        
        const datasets = emotions.map(emotion => ({
            label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
            data: dates.map(date => dailyData[date][emotion] || 0),
            borderColor: this.getEmotionColor(emotion),
            backgroundColor: this.getEmotionColor(emotion, 0.1),
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 10
        }));

        this.charts.emotionTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '📈 Trend Emosi per Hari (50 Entries Terbaru)',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        color: '#1e293b',
                        padding: 20
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#8b5cf6',
                        borderWidth: 2,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Tanggal',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Jumlah Entries',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            stepSize: 1,
                            beginAtZero: true
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    getEmotionColor(emotion, alpha = 1) {
        const colors = {
            'happy': `rgba(16, 185, 129, ${alpha})`,
            'sad': `rgba(59, 130, 246, ${alpha})`,
            'angry': `rgba(239, 68, 68, ${alpha})`,
            'fear': `rgba(245, 158, 11, ${alpha})`,
            'surprise': `rgba(139, 92, 246, ${alpha})`,
            'disgust': `rgba(5, 150, 105, ${alpha})`,
            'neutral': `rgba(107, 114, 128, ${alpha})`,
            'unknown': `rgba(156, 163, 175, ${alpha})`
        };
        return colors[emotion] || colors.unknown;
    }

    adjustBrightness(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    renderRecentEntries() {
        const tbody = document.getElementById('recentEntriesBody');
        if (!tbody) return;

        const recentData = this.filteredData.slice(0, 10);
        
        if (recentData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada data tersedia</td></tr>';
            return;
        }

        tbody.innerHTML = recentData.map(item => `
            <tr>
                <td>${new Date(item.timestamp).toLocaleString()}</td>
                <td>
                    <span class="emotion-badge ${item.dominantEmotion}">
                        ${item.dominantEmotion || 'Unknown'}
                    </span>
                </td>
                <td>${item.confidence ? (item.confidence * 100).toFixed(1) + '%' : 'N/A'}</td>
                <td>
                    <span class="source-badge ${item.source}">
                        <i class="fas ${item.source === 'webcam' ? 'fa-video' : 'fa-microphone'}"></i>
                        ${item.source || 'Unknown'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="dashboard.viewEntry('${item.id}')" title="Lihat Detail">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="dashboard.deleteEntry('${item.id}')" title="Hapus Entry">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Update grafik setelah data Recent Entries berubah
        this.updateEmotionDistributionFromRecent();
    }

    updateEmotionDistributionFromRecent() {
        // Perbarui grafik Emotion Distribution berdasarkan data Recent Entries
        this.renderEmotionDistributionChart();
    }

    renderActivityFeed() {
        const feed = document.getElementById('activityFeed');
        if (!feed) return;

        const activities = this.generateActivityFeed();
        const recentAnalysis = this.generateRecentAnalysis();
        
        if (activities.length === 0 && recentAnalysis.length === 0) {
            feed.innerHTML = '<div class="activity-item"><div class="activity-text">Belum ada aktivitas terbaru</div></div>';
            return;
        }

        let feedHTML = '';

        // Tambahkan analisis recent entries
        if (recentAnalysis.length > 0) {
            feedHTML += '<div class="activity-item analysis-header"><div class="activity-text"><strong>Analisis Recent Entries</strong></div></div>';
            recentAnalysis.forEach(analysis => {
                feedHTML += `
                    <div class="activity-item analysis-item">
                        <div class="activity-icon">
                            <i class="${analysis.icon}"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-text">${analysis.text}</div>
                            <div class="activity-time">${analysis.time}</div>
                        </div>
                    </div>
                `;
            });
        }

        // Tambahkan aktivitas biasa
        if (activities.length > 0) {
            feedHTML += '<div class="activity-item analysis-header"><div class="activity-text"><strong>Recent Activities</strong></div></div>';
            activities.forEach(activity => {
                feedHTML += `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <i class="${activity.icon}"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-text">${activity.text}</div>
                            <div class="activity-time">${activity.time}</div>
                        </div>
                    </div>
                `;
            });
        }

        feed.innerHTML = feedHTML;
    }

    generateRecentAnalysis() {
        const recentData = this.filteredData.slice(0, 10);
        const analysis = [];

        if (recentData.length === 0) return analysis;

        // Analisis distribusi emosi
        const emotionCounts = {};
        recentData.forEach(item => {
            const emotion = item.dominantEmotion || 'unknown';
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });

        const dominantEmotion = Object.entries(emotionCounts).reduce((a, b) => 
            emotionCounts[a] > emotionCounts[b] ? a : b);
        
        analysis.push({
            icon: 'fas fa-chart-bar',
            text: `Emosi dominan: ${dominantEmotion} (${emotionCounts[dominantEmotion]} entries)`,
            time: 'Berdasarkan 10 entries terbaru'
        });

        // Analisis confidence
        const avgConfidence = recentData.reduce((sum, item) => sum + (item.confidence || 0), 0) / recentData.length;
        const confidenceLevel = avgConfidence > 0.8 ? 'Tinggi' : avgConfidence > 0.6 ? 'Sedang' : 'Rendah';
        
        analysis.push({
            icon: 'fas fa-bullseye',
            text: `Rata-rata confidence: ${(avgConfidence * 100).toFixed(1)}% (${confidenceLevel})`,
            time: 'Berdasarkan 10 entries terbaru'
        });

        // Analisis trend waktu
        const timeRange = recentData.length > 1 ? 
            Math.abs(new Date(recentData[0].timestamp) - new Date(recentData[recentData.length - 1].timestamp)) / (1000 * 60 * 60) : 0;
        
        if (timeRange > 0) {
            analysis.push({
                icon: 'fas fa-clock',
                text: `Rentang waktu: ${timeRange.toFixed(1)} jam`,
                time: 'Dari entries terbaru'
            });
        }

        // Analisis sumber data
        const sources = {};
        recentData.forEach(item => {
            const source = item.source || 'unknown';
            sources[source] = (sources[source] || 0) + 1;
        });

        const dominantSource = Object.entries(sources).reduce((a, b) => 
            sources[a] > sources[b] ? a : b);
        
        analysis.push({
            icon: 'fas fa-microchip',
            text: `Sumber dominan: ${dominantSource} (${sources[dominantSource]} entries)`,
            time: 'Berdasarkan 10 entries terbaru'
        });

        return analysis;
    }

    generateActivityFeed() {
        const activities = [];
        const now = new Date();

        // Recent entries
        this.filteredData.slice(0, 5).forEach(item => {
            const timeAgo = this.getTimeAgo(new Date(item.timestamp));
            activities.push({
                icon: 'fas fa-plus-circle',
                text: `New ${item.dominantEmotion} emotion recorded`,
                time: timeAgo
            });
        });

        // System activities
        if (this.filteredData.length > 0) {
            activities.push({
                icon: 'fas fa-sync-alt',
                text: 'Data synchronized successfully',
                time: this.getTimeAgo(now)
            });
        }

        return activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    }

    renderStorageStatus() {
        const status = document.getElementById('storageStatus');
        if (!status) return;

        const storageInfo = this.getStorageInfo();
        
        status.innerHTML = `
            <div class="status-item">
                <span class="status-label">Records:</span>
                <span class="status-value">${storageInfo.records}</span>
            </div>
            <div class="status-item">
                <span class="status-label">Storage:</span>
                <span class="status-value">${storageInfo.storage}</span>
            </div>
            <div class="status-item">
                <span class="status-label">Last Update:</span>
                <span class="status-value">${storageInfo.lastUpdate}</span>
            </div>
        `;
    }

    getStorageInfo() {
        const records = this.data.length;
        const storage = this.storage.getStorageMode ? this.storage.getStorageMode() : 'Local';
        const lastUpdate = this.data.length > 0 
            ? this.getTimeAgo(new Date(this.data[0].timestamp))
            : 'Never';

        return { records, storage, lastUpdate };
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    async exportData(format) {
        try {
            let data, filename, mimeType;

            switch (format) {
                case 'json':
                    data = JSON.stringify(this.data, null, 2);
                    filename = `emotion-data-${new Date().toISOString().split('T')[0]}.json`;
                    mimeType = 'application/json';
                    break;
                case 'csv':
                    data = this.convertToCSV(this.data);
                    filename = `emotion-data-${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv';
                    break;
                default:
                    throw new Error('Unsupported format');
            }

            const blob = new Blob([data], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showSuccess(`Data exported as ${format.toUpperCase()}`);
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Export failed');
        }
    }

    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        data.forEach(item => {
            const values = headers.map(header => {
                const value = item[header];
                return typeof value === 'string' ? `"${value}"` : value;
            });
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }

    async viewEntry(id) {
        const entry = this.data.find(item => item.id === id);
        if (!entry) {
            this.showError('Entry not found');
            return;
        }

        const details = `
            ID: ${entry.id}
            Timestamp: ${new Date(entry.timestamp).toLocaleString()}
            Emotion: ${entry.dominantEmotion}
            Confidence: ${entry.confidence ? (entry.confidence * 100).toFixed(1) + '%' : 'N/A'}
            Source: ${entry.source || 'Unknown'}
            User ID: ${entry.userId || 'Unknown'}
        `;

        alert(details);
    }

    async deleteEntry(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus entry ini?')) return;

        try {
            console.log(`Attempting to delete entry with ID: ${id}`);
            
            // Check if storage is available
            if (!this.storage) {
                throw new Error('Storage system not available');
            }

            // Check if deleteEmotionData method exists
            if (typeof this.storage.deleteEmotionData !== 'function') {
                throw new Error('Delete method not available in storage system');
            }

            // Debug: Check data before deletion
            const beforeData = await this.storage.getEmotionData({ limit: 1000 });
            const targetEntry = beforeData.find(item => item.id === id);
            
            if (!targetEntry) {
                throw new Error('Entry not found or already deleted');
            }
            
            console.log('Found entry to delete:', targetEntry);
            console.log(`Total entries before deletion: ${beforeData.length}`);

            // Attempt to delete the entry
            const result = await this.storage.deleteEmotionData(id);
            
            if (result === false) {
                throw new Error('Delete operation returned false');
            }

            // Debug: Check data after deletion
            const afterData = await this.storage.getEmotionData({ limit: 1000 });
            console.log(`Total entries after deletion: ${afterData.length}`);
            
            const stillExists = afterData.find(item => item.id === id);
            if (stillExists) {
                throw new Error('Entry still exists after deletion');
            }

            console.log(`Successfully deleted entry with ID: ${id}`);
            
            // Refresh the dashboard data
            await this.refreshData();
            
            this.showSuccess('Entry berhasil dihapus');
        } catch (error) {
            console.error('Delete failed:', error);
            
            // Provide more specific error messages
            let errorMessage = 'Gagal menghapus entry';
            
            if (error.message.includes('not found')) {
                errorMessage = 'Entry tidak ditemukan atau sudah dihapus';
            } else if (error.message.includes('not available')) {
                errorMessage = 'Sistem penyimpanan tidak tersedia';
            } else if (error.message.includes('Delete method')) {
                errorMessage = 'Metode hapus tidak tersedia';
            } else if (error.message.includes('returned false')) {
                errorMessage = 'Operasi hapus gagal';
            } else if (error.message.includes('still exists')) {
                errorMessage = 'Entry masih ada setelah operasi hapus';
            }
            
            this.showError(errorMessage);
        }
    }

    addDummyDataButton() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;

        const dummyBtn = document.createElement('button');
        dummyBtn.className = 'btn btn-outline';
        dummyBtn.innerHTML = '<i class="fas fa-database"></i> Add Dummy Data';
        dummyBtn.onclick = () => this.insertDummyData();
        
        headerActions.appendChild(dummyBtn);
    }

    async insertDummyData() {
        const dummyData = [
            { id: "1", timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), dominantEmotion: "happy", confidence: 0.92, userId: "user1", source: "webcam" },
            { id: "2", timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(), dominantEmotion: "sad", confidence: 0.81, userId: "user2", source: "microphone" },
            { id: "3", timestamp: new Date(Date.now() - 3600 * 1000 * 8).toISOString(), dominantEmotion: "angry", confidence: 0.77, userId: "user3", source: "webcam" },
            { id: "4", timestamp: new Date(Date.now() - 3600 * 1000 * 12).toISOString(), dominantEmotion: "neutral", confidence: 0.65, userId: "user1", source: "webcam" },
            { id: "5", timestamp: new Date(Date.now() - 3600 * 1000 * 15).toISOString(), dominantEmotion: "happy", confidence: 0.88, userId: "user2", source: "microphone" },
            { id: "6", timestamp: new Date(Date.now() - 3600 * 1000 * 20).toISOString(), dominantEmotion: "surprise", confidence: 0.73, userId: "user3", source: "webcam" },
            { id: "7", timestamp: new Date(Date.now() - 3600 * 1000 * 22).toISOString(), dominantEmotion: "fear", confidence: 0.69, userId: "user1", source: "microphone" }
        ];

        try {
            console.log('Inserting dummy data...');
            
            // Check if storage has the required method
            const saveMethod = this.storage.addEmotionData || this.storage.saveEmotionData;
            if (!saveMethod) {
                throw new Error('No save method available in storage');
            }

            for (const entry of dummyData) {
                console.log(`Inserting entry: ${entry.id}`);
                await saveMethod.call(this.storage, entry);
            }
            
            console.log('Dummy data inserted successfully');
            await this.refreshData();
            this.showSuccess('Data dummy berhasil ditambahkan!');
        } catch (error) {
            console.error('Failed to insert dummy data:', error);
            this.showError('Gagal menambahkan data dummy: ' + error.message);
        }
    }

    showLoading() {
        document.body.classList.add('loading');
    }

    hideLoading() {
        document.body.classList.remove('loading');
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type} fade-in`;
        messageDiv.textContent = message;
        
        const container = document.querySelector('.dashboard-content');
        if (container) {
            container.insertBefore(messageDiv, container.firstChild);
            
            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        }
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showWarning(message) {
        this.showMessage(message, 'warning');
    }

    showInfo(message) {
        this.showMessage(message, 'info');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});

// Export for global access
window.Dashboard = Dashboard;
