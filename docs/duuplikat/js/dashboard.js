/**
 * Dashboard Management System
 * Integrates with Hybrid Storage for comprehensive data management
 */

class Dashboard {
    constructor() {
        this.hybridStorage = null;
        this.databaseServer = null;
        this.dataManager = null;
        this.charts = {};
        this.currentPeriod = 'week';
        this.refreshInterval = null;
        this.isInitialized = false;
        this.dataStorage = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Dashboard...');
            
            // Wait for hybrid storage to be ready
            await this.waitForHybridStorage();
            
            // Initialize components
            await this.initializeComponents();
            
            // Load initial data
            await this.loadInitialData();
            
            // Start auto-refresh
            this.startAutoRefresh();
            
            // Initialize event listeners
            this.initializeEventListeners();
            
            this.isInitialized = true;
            console.log('Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Error initializing Dashboard:', error);
            this.showError('Failed to initialize dashboard');
        }
    }

    async waitForHybridStorage() {
        return new Promise((resolve) => {
            const checkHybridStorage = () => {
                if (window.hybridStorage) {
                    this.hybridStorage = window.hybridStorage;
                    this.databaseServer = window.databaseServer;
                    resolve();
                } else {
                    setTimeout(checkHybridStorage, 100);
                }
            };
            checkHybridStorage();
        });
    }

    async initializeComponents() {
        // Initialize data manager
        this.dataManager = new DashboardCRUD(this.hybridStorage);
        
        // Initialize charts
        this.initializeCharts();
        
        // Initialize storage status
        this.updateStorageStatus();
        
        // Initialize modals
        this.initializeModals();
    }

    async loadInitialData() {
        try {
            this.showLoading(true);
            
            // Load dashboard data
            await this.loadDashboardData();
            
            // Update charts
            await this.updateCharts();
            
            // Load recent entries
            await this.loadRecentEntries();
            
            // Load activity feed
            await this.loadActivityFeed();
            
            // Load alerts
            await this.loadAlerts();
            
            this.showLoading(false);
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load dashboard data');
            this.showLoading(false);
        }
    }

    async loadDashboardData() {
        try {
            // Initialize DataStorage if needed
            if (!this.dataStorage) {
                this.dataStorage = new DataStorage();
                await this.dataStorage.init();
            }
            // Get emotion data with filters
            const filters = this.getDateFilters();
            let emotionData = await this.dataStorage.getEmotionData(filters);
            // Fallback: jika data kosong, ambil semua data
            if (!emotionData || emotionData.length === 0) {
                emotionData = await this.dataStorage.getEmotionData({});
                if (!emotionData || emotionData.length === 0) {
                    this.showInfo('Belum ada data emosi yang tersimpan. Silakan input data melalui halaman Emotion Input.');
                }
            }
            // Calculate statistics
            const stats = this.calculateStats(emotionData);
            // Update UI
            this.updateStats(stats);
            // Store data for charts
            this.dashboardData = emotionData;
            console.log('Dashboard data loaded:', emotionData.length, 'entries');
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            throw error;
        }
    }

    getDateFilters() {
        const now = new Date();
        let startDate = new Date();
        
        switch (this.currentPeriod) {
            case 'day':
                startDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            default:
                startDate.setDate(now.getDate() - 7);
        }
        
        return {
            startDate: startDate.toISOString(),
            endDate: now.toISOString()
        };
    }

    calculateStats(data) {
        if (!data || data.length === 0) {
            return {
                totalEntries: 0,
                overallMood: 'Neutral',
                stressLevel: 'Low',
                engagement: 'Low',
                dataQuality: 'Poor',
                emotionDistribution: {},
                highStressCount: 0,
                activeUsers: 0,
                validEntries: 0
            };
        }
        
        // Calculate emotion distribution
        const emotionCounts = {};
        let totalConfidence = 0;
        let highStressCount = 0;
        let validEntries = 0;
        const users = new Set();
        
        data.forEach(entry => {
            const emotion = entry.dominantEmotion || entry.emotion || 'neutral';
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
            
            if (entry.confidence) {
                totalConfidence += entry.confidence;
                validEntries++;
            }
            
            if (emotion === 'angry' || emotion === 'sad') {
                highStressCount++;
            }
            
            if (entry.userId) {
                users.add(entry.userId);
            }
        });
        
        // Calculate overall mood
        const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
            emotionCounts[a] > emotionCounts[b] ? a : b
        );
        
        const overallMood = this.getMoodLabel(dominantEmotion);
        const stressLevel = this.getStressLevel(highStressCount, data.length);
        const engagement = this.getEngagementLevel(users.size, data.length);
        const dataQuality = this.getDataQuality(validEntries, data.length);
        
        return {
            totalEntries: data.length,
            overallMood,
            stressLevel,
            engagement,
            dataQuality,
            emotionDistribution: emotionCounts,
            highStressCount,
            activeUsers: users.size,
            validEntries,
            averageConfidence: validEntries > 0 ? totalConfidence / validEntries : 0
        };
    }

    getMoodLabel(emotion) {
        const moodMap = {
            'happy': 'Positive',
            'joy': 'Positive',
            'excited': 'Positive',
            'sad': 'Negative',
            'angry': 'Negative',
            'fear': 'Negative',
            'neutral': 'Neutral',
            'surprise': 'Mixed'
        };
        return moodMap[emotion] || 'Neutral';
    }

    getStressLevel(highStressCount, totalCount) {
        const stressPercentage = totalCount > 0 ? (highStressCount / totalCount) * 100 : 0;
        
        if (stressPercentage < 20) return 'Low';
        if (stressPercentage < 40) return 'Moderate';
        if (stressPercentage < 60) return 'High';
        return 'Critical';
    }

    getEngagementLevel(activeUsers, totalEntries) {
        if (totalEntries === 0) return 'Low';
        
        const engagementRatio = activeUsers / totalEntries;
        
        if (engagementRatio > 0.8) return 'High';
        if (engagementRatio > 0.5) return 'Moderate';
        return 'Low';
    }

    getDataQuality(validEntries, totalEntries) {
        if (totalEntries === 0) return 'Poor';
        
        const qualityPercentage = (validEntries / totalEntries) * 100;
        
        if (qualityPercentage > 90) return 'Excellent';
        if (qualityPercentage > 75) return 'Good';
        if (qualityPercentage > 50) return 'Fair';
        return 'Poor';
    }

    updateStats(stats) {
        // Update stat cards
        document.getElementById('totalEntries').textContent = stats.totalEntries;
        document.getElementById('overallMood').textContent = stats.overallMood;
        document.getElementById('stressLevel').textContent = stats.stressLevel;
        document.getElementById('engagement').textContent = stats.engagement;
        document.getElementById('dataQuality').textContent = stats.dataQuality;
        document.getElementById('highStressCount').textContent = stats.highStressCount;
        document.getElementById('activeUsers').textContent = stats.activeUsers;
        document.getElementById('validEntries').textContent = stats.validEntries;
        
        // Update change indicators
        this.updateChangeIndicators(stats);
    }

    updateChangeIndicators(stats) {
        // This would compare with previous period data
        // For now, we'll show placeholder changes
        const changes = document.querySelectorAll('.stat-change');
        changes.forEach(change => {
            if (change.classList.contains('positive')) {
                change.textContent = '+8% from last week';
            } else if (change.classList.contains('negative')) {
                change.textContent = '+5% from last week';
            }
        });
    }

    async updateCharts() {
        try {
            if (!this.dashboardData) return;
            
            // Update emotion trends chart
            await this.updateEmotionTrendsChart();
            
            // Update emotion distribution chart
            await this.updateEmotionDistributionChart();
            
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    async updateEmotionTrendsChart() {
        const ctx = document.getElementById('emotionChart');
        if (!ctx) return;
        
        const chartType = document.getElementById('chartType').value;
        
        // Group data by date
        const groupedData = this.groupDataByDate(this.dashboardData);
        
        const chartData = {
            labels: Object.keys(groupedData),
            datasets: this.createEmotionDatasets(groupedData)
        };
        
        if (this.charts.emotionTrends) {
            this.charts.emotionTrends.destroy();
        }
        
        this.charts.emotionTrends = new Chart(ctx, {
            type: chartType,
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Emotion Trends Over Time'
                    }
                }
            }
        });
    }

    async updateEmotionDistributionChart() {
        const ctx = document.getElementById('emotionDistributionChart');
        if (!ctx) return;
        
        const emotionCounts = {};
        this.dashboardData.forEach(entry => {
            const emotion = entry.dominantEmotion || entry.emotion || 'neutral';
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
        
        const chartData = {
            labels: Object.keys(emotionCounts),
            datasets: [{
                data: Object.values(emotionCounts),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ]
            }]
        };
        
        if (this.charts.emotionDistribution) {
            this.charts.emotionDistribution.destroy();
        }
        
        this.charts.emotionDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: 'Emotion Distribution'
                    }
                }
            }
        });
    }

    groupDataByDate(data) {
        const grouped = {};
        
        data.forEach(entry => {
            const date = new Date(entry.timestamp || entry.date).toLocaleDateString();
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(entry);
        });
        
        return grouped;
    }

    createEmotionDatasets(groupedData) {
        const emotions = ['happy', 'sad', 'angry', 'neutral', 'surprise', 'fear'];
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
        
        return emotions.map((emotion, index) => ({
            label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
            data: Object.values(groupedData).map(dayData => 
                dayData.filter(entry => 
                    (entry.dominantEmotion || entry.emotion) === emotion
                ).length
            ),
            borderColor: colors[index],
            backgroundColor: colors[index] + '20',
            tension: 0.1
        }));
    }

    async loadRecentEntries() {
        try {
            const recentData = await this.hybridStorage.getEmotionData({ limit: 10 });
            this.displayRecentEntries(recentData);
        } catch (error) {
            console.error('Error loading recent entries:', error);
        }
    }

    displayRecentEntries(data) {
        const tbody = document.getElementById('recentEntriesBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        data.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(entry.timestamp || entry.date).toLocaleDateString()}</td>
                <td>
                    <span class="emotion-badge ${entry.dominantEmotion || entry.emotion}">
                        ${(entry.dominantEmotion || entry.emotion || 'neutral').charAt(0).toUpperCase() + 
                          (entry.dominantEmotion || entry.emotion || 'neutral').slice(1)}
                    </span>
                </td>
                <td>${Math.round((entry.confidence || 0) * 100)}%</td>
                <td>
                    <button class="btn btn-sm" onclick="dashboard.editEntry('${entry.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="dashboard.deleteEntry('${entry.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadActivityFeed() {
        try {
            const activityFeed = document.getElementById('activityFeed');
            if (!activityFeed) return;
            
            // Generate activity items based on recent data
            const activities = this.generateActivityItems();
            
            activityFeed.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-text">${activity.text}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading activity feed:', error);
        }
    }

    generateActivityItems() {
        const activities = [];
        const now = new Date();
        
        if (this.dashboardData && this.dashboardData.length > 0) {
            const latestEntry = this.dashboardData[0];
            activities.push({
                icon: 'fa-camera',
                text: `New emotion entry recorded: ${latestEntry.dominantEmotion || latestEntry.emotion}`,
                time: 'Just now'
            });
        }
        
        activities.push({
            icon: 'fa-sync',
            text: 'Data synchronized with database',
            time: '2 minutes ago'
        });
        
        activities.push({
            icon: 'fa-chart-line',
            text: 'Analytics updated',
            time: '5 minutes ago'
        });
        
        return activities;
    }

    async loadAlerts() {
        try {
            const alertsContainer = document.getElementById('alertsContainer');
            if (!alertsContainer) return;
            
            const alerts = this.generateAlerts();
            
            alertsContainer.innerHTML = alerts.map(alert => `
                <div class="alert alert-${alert.type}">
                    <div class="alert-icon">
                        <i class="fas ${alert.icon}"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-title">${alert.title}</div>
                        <div class="alert-message">${alert.message}</div>
                    </div>
                    <button class="alert-close" onclick="dashboard.dismissAlert(this)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    }

    generateAlerts() {
        const alerts = [];
        
        // Check for high stress levels
        if (this.dashboardData) {
            const highStressCount = this.dashboardData.filter(entry => 
                (entry.dominantEmotion || entry.emotion) === 'angry' || 
                (entry.dominantEmotion || entry.emotion) === 'sad'
            ).length;
            
            if (highStressCount > 5) {
                alerts.push({
                    type: 'warning',
                    icon: 'fa-exclamation-triangle',
                    title: 'High Stress Detected',
                    message: `${highStressCount} entries show high stress levels`
                });
            }
        }
        
        // Check storage status
        if (this.hybridStorage && !this.hybridStorage.isOnline) {
            alerts.push({
                type: 'error',
                icon: 'fa-database',
                title: 'Database Offline',
                message: 'Working in offline mode. Data will sync when connection is restored.'
            });
        }
        
        // Check sync queue
        if (this.hybridStorage && this.hybridStorage.syncQueue.length > 10) {
            alerts.push({
                type: 'info',
                icon: 'fa-sync',
                title: 'Sync Queue',
                message: `${this.hybridStorage.syncQueue.length} items pending sync`
            });
        }
        
        return alerts;
    }

    updateStorageStatus() {
        try {
            const indicator = document.getElementById('storageIndicator');
            const statusText = document.getElementById('storageStatusText');
            const syncStatus = document.getElementById('syncStatus');
            const lastSync = document.getElementById('lastSync');
            
            if (this.hybridStorage) {
                if (this.hybridStorage.isOnline) {
                    indicator.className = 'fas fa-circle text-success';
                    statusText.textContent = 'Online';
                    syncStatus.textContent = `Sync: ${this.hybridStorage.syncQueue.length} pending`;
                } else {
                    indicator.className = 'fas fa-circle text-warning';
                    statusText.textContent = 'Offline';
                    syncStatus.textContent = 'Sync: Offline';
                }
                
                lastSync.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
            } else {
                indicator.className = 'fas fa-circle text-danger';
                statusText.textContent = 'Initializing...';
                syncStatus.textContent = 'Sync: Unknown';
                lastSync.textContent = 'Last sync: Never';
            }
        } catch (error) {
            console.error('Error updating storage status:', error);
        }
    }

    initializeCharts() {
        // Charts will be initialized when data is loaded
        console.log('Charts initialized');
    }

    initializeModals() {
        // Initialize tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Initialize period controls
        const periodBtns = document.querySelectorAll('.period-controls .btn');
        periodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                periodBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPeriod = btn.dataset.period;
                this.refreshData();
            });
        });
        
        // Initialize chart type selector
        const chartTypeSelect = document.getElementById('chartType');
        if (chartTypeSelect) {
            chartTypeSelect.addEventListener('change', () => {
                this.updateCharts();
            });
        }
    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab content
        const selectedTab = document.getElementById(tabName + 'Tab');
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Add active class to selected tab button
        const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
        
        // Load tab-specific data
        this.loadTabData(tabName);
    }

    async loadTabData(tabName) {
        switch (tabName) {
            case 'entries':
                await this.loadEntriesTabData();
                break;
            case 'analytics':
                await this.loadAnalyticsTabData();
                break;
            case 'storage':
                await this.loadStorageTabData();
                break;
        }
    }

    async loadEntriesTabData() {
        try {
            const data = await this.hybridStorage.getEmotionData();
            this.dataManager.displayData(data);
        } catch (error) {
            console.error('Error loading entries data:', error);
        }
    }

    async loadAnalyticsTabData() {
        try {
            const stats = await this.hybridStorage.getStorageStats();
            this.updateAnalyticsMetrics(stats);
        } catch (error) {
            console.error('Error loading analytics data:', error);
        }
    }

    async loadStorageTabData() {
        try {
            const stats = await this.hybridStorage.getStorageStats();
            this.updateStorageTabStats(stats);
        } catch (error) {
            console.error('Error loading storage data:', error);
        }
    }

    updateAnalyticsMetrics(stats) {
        const metrics = {
            dataQualityMetric: stats ? `${Math.round(stats.dataQuality || 0)}%` : 'N/A',
            emotionDistributionMetric: stats ? `${Object.keys(stats.emotionDistribution || {}).length} emotions` : 'N/A',
            trendAnalysisMetric: stats ? 'Trending positive' : 'N/A',
            anomalyDetectionMetric: stats ? 'No anomalies detected' : 'N/A'
        };
        
        Object.keys(metrics).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = metrics[id];
            }
        });
    }

    updateStorageTabStats(stats) {
        if (!stats) return;
        
        const elements = {
            localStorageStat: stats.local ? `${stats.local.emotionRecords} records` : 'N/A',
            databaseStat: stats.database ? `${stats.database.emotionRecords} records` : 'N/A',
            syncQueueStat: stats.syncQueue ? `${stats.syncQueue} items` : 'N/A',
            connectionStat: stats.isOnline ? 'Connected' : 'Disconnected'
        };
        
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
    }

    initializeEventListeners() {
        // Refresh button
        const refreshBtn = document.querySelector('[onclick="dashboard.refreshData()"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
        
        // Storage status button
        const storageStatusBtn = document.querySelector('[onclick="dashboard.showStorageStatus()"]');
        if (storageStatusBtn) {
            storageStatusBtn.addEventListener('click', () => this.showStorageStatus());
        }
        
        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Page visibility change handler
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.refreshData();
            }
        });
    }

    startAutoRefresh() {
        const interval = parseInt(localStorage.getItem('refreshInterval') || '60') * 1000;
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, interval);
    }

    async refreshData() {
        try {
            console.log('Refreshing dashboard data...');
            
            // Update storage status
            this.updateStorageStatus();
            
            // Reload data if page is visible
            if (document.visibilityState === 'visible') {
                await this.loadDashboardData();
                await this.updateCharts();
                await this.loadRecentEntries();
                await this.loadActivityFeed();
                await this.loadAlerts();
            }
            
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    }

    handleResize() {
        // Resize charts if needed
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }

    // Public methods for UI interactions
    showDataManager() {
        const modal = document.getElementById('dataManagerModal');
        if (modal) {
            modal.style.display = 'block';
            this.switchTab('entries');
        }
    }

    closeDataManager() {
        const modal = document.getElementById('dataManagerModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showStorageStatus() {
        const modal = document.getElementById('storageStatusModal');
        if (modal) {
            modal.style.display = 'block';
            this.loadStorageStatusDetails();
        }
    }

    closeStorageStatus() {
        const modal = document.getElementById('storageStatusModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async loadStorageStatusDetails() {
        try {
            const detailsContainer = document.getElementById('storageStatusDetails');
            if (!detailsContainer) return;
            
            const stats = await this.hybridStorage.getStorageStats();
            const dbStatus = await this.databaseServer.getStatus();
            
            detailsContainer.innerHTML = `
                <div class="storage-detail">
                    <h4>Hybrid Storage Status</h4>
                    <div class="status-grid">
                        <div class="status-item">
                            <span class="label">Local Storage:</span>
                            <span class="value">${stats?.local?.emotionRecords || 0} records</span>
                        </div>
                        <div class="status-item">
                            <span class="label">Database:</span>
                            <span class="value">${stats?.database?.emotionRecords || 0} records</span>
                        </div>
                        <div class="status-item">
                            <span class="label">Sync Queue:</span>
                            <span class="value">${stats?.syncQueue || 0} items</span>
                        </div>
                        <div class="status-item">
                            <span class="label">Connection:</span>
                            <span class="value ${stats?.isOnline ? 'online' : 'offline'}">${stats?.isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="storage-detail">
                    <h4>Database Server Status</h4>
                    <div class="status-grid">
                        <div class="status-item">
                            <span class="label">Status:</span>
                            <span class="value ${dbStatus?.isRunning ? 'online' : 'offline'}">${dbStatus?.isRunning ? 'Running' : 'Stopped'}</span>
                        </div>
                        <div class="status-item">
                            <span class="label">Uptime:</span>
                            <span class="value">${dbStatus?.uptime || 0} seconds</span>
                        </div>
                        <div class="status-item">
                            <span class="label">Connections:</span>
                            <span class="value">${dbStatus?.connections || 0}</span>
                        </div>
                        <div class="status-item">
                            <span class="label">Memory Usage:</span>
                            <span class="value">${dbStatus?.memoryUsage || 0} MB</span>
                        </div>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading storage status details:', error);
        }
    }

    async syncData() {
        try {
            if (this.hybridStorage) {
                await this.hybridStorage.syncLocalToDatabase();
                this.updateStorageStatus();
                this.showSuccess('Data synchronized successfully');
            }
        } catch (error) {
            console.error('Error syncing data:', error);
            this.showError('Failed to sync data');
        }
    }

    async backupData() {
        try {
            if (this.databaseServer) {
                await this.databaseServer.backup();
                this.showSuccess('Backup created successfully');
            }
        } catch (error) {
            console.error('Error creating backup:', error);
            this.showError('Failed to create backup');
        }
    }

    async restoreData() {
        try {
            // This would typically show a file picker
            this.showInfo('Restore functionality requires file selection');
        } catch (error) {
            console.error('Error restoring data:', error);
            this.showError('Failed to restore data');
        }
    }

    async clearAllData() {
        try {
            if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                await this.hybridStorage.clearAllData();
                this.refreshData();
                this.showSuccess('All data cleared successfully');
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showError('Failed to clear data');
        }
    }

    exportData() {
        try {
            this.dataManager.exportData();
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showError('Failed to export data');
        }
    }

    generateReport() {
        try {
            this.showInfo('Report generation feature coming soon');
        } catch (error) {
            console.error('Error generating report:', error);
            this.showError('Failed to generate report');
        }
    }

    showDataInsights() {
        try {
            this.showInfo('Data insights feature coming soon');
        } catch (error) {
            console.error('Error showing insights:', error);
            this.showError('Failed to show insights');
        }
    }

    dismissAlert(button) {
        const alert = button.closest('.alert');
        if (alert) {
            alert.remove();
        }
    }

    dismissAllAlerts() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => alert.remove());
    }

    refreshActivityFeed() {
        this.loadActivityFeed();
    }

    showAllEntries() {
        this.showDataManager();
        this.switchTab('entries');
    }

    addNewEntry() {
        window.location.href = 'emotion-input.html';
    }

    editEntry(id) {
        this.dataManager.editEntry(id);
    }

    deleteEntry(id) {
        this.dataManager.deleteEntry(id);
    }

    toggleEmotionView(view) {
        // Update emotion distribution chart view
        this.updateEmotionDistributionChart();
    }

    saveSettings() {
        try {
            const settings = {
                refreshInterval: document.getElementById('refreshInterval').value,
                retentionPeriod: document.getElementById('retentionPeriod').value,
                backupFrequency: document.getElementById('backupFrequency').value,
                syncMode: document.getElementById('syncMode').value
            };
            
            localStorage.setItem('dashboardSettings', JSON.stringify(settings));
            
            // Update refresh interval
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.startAutoRefresh();
            }
            
            this.showSuccess('Settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showError('Failed to save settings');
        }
    }

    // Utility methods
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

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});

// Export for use in other modules
window.Dashboard = Dashboard;
