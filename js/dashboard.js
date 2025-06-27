/**
 * Dashboard class to manage the dashboard functionality
 * Handles data loading, chart rendering, and UI updates
 */
class Dashboard {
    constructor() {
        this.chart = null;
        this.currentPeriod = 'week'; // Default period
        this.initializeElements();
        this.setupEventListeners();
        this.checkAuthAndLoadData();
        
        // Auto refresh data setiap 30 detik
        setInterval(() => {
            this.refreshData();
        }, 30000);
    }

    initializeElements() {
        // Stats elements
        this.avgMoodElement = document.getElementById('avgMood');
        this.stressLevelElement = document.getElementById('stressLevel');
        this.engagementElement = document.getElementById('engagement');
        this.responsesElement = document.getElementById('responses');

        // Chart elements
        this.chartTypeSelect = document.getElementById('chartType');
        this.periodButtons = document.querySelectorAll('.chart-controls .btn');
        this.moodChart = document.getElementById('moodChart');

        // Activity and alerts
        this.activityList = document.getElementById('activityList');
        this.alertsList = document.getElementById('alertsList');
        
        // User info
        this.userNameElement = document.getElementById('userName');
        this.userInitialsElement = document.getElementById('userInitials');
    }

    setupEventListeners() {
        // Chart type change
        if (this.chartTypeSelect) {
            this.chartTypeSelect.addEventListener('change', () => this.updateChartType());
        }

        // Time period buttons
        this.periodButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.currentPeriod = button.dataset.period;
                this.updateTimePeriod(this.currentPeriod);
                this.setActiveButton(button);
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                AuthService.logout();
            });
        }
    }

    async checkAuthAndLoadData() {
        if (!AuthService.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        
        await this.loadUserData();
        await this.loadDashboardData();
    }
    
    async loadUserData() {
        try {
            const user = AuthService.getCurrentUser();
            if (user) {
                if (this.userNameElement) this.userNameElement.textContent = user.full_name || user.username;
                if (this.userInitialsElement) {
                    const initials = user.full_name 
                        ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                        : user.username.substring(0, 2).toUpperCase();
                    this.userInitialsElement.textContent = initials;
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showError('Failed to load user data');
        }
    }
    
    async loadDashboardData() {
        try {
            this.showLoading(true);
            const storage = new window.DataStorage();
            const emotionData = await storage.getEmotionData();
            const stats = this.calculateStats(emotionData);
            this.updateStats(stats);
            this.initializeCharts(emotionData);
            this.updateActivityFeed(emotionData);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data. Please try again later.');
        } finally {
            this.showLoading(false);
        }
    }

    async updateTimePeriod(period) {
        try {
            this.showLoading(true);
            const storage = new window.DataStorage();
            let emotionData = await storage.getEmotionData();
            // Filter data sesuai period (day/week/month/all)
            if (period !== 'all') {
                const now = Date.now();
                let range = 0;
                if (period === 'day') range = 24 * 60 * 60 * 1000;
                if (period === 'week') range = 7 * 24 * 60 * 60 * 1000;
                if (period === 'month') range = 30 * 24 * 60 * 60 * 1000;
                emotionData = emotionData.filter(item => now - Number(item.id) <= range);
            }
            this.initializeCharts(emotionData);
            const stats = this.calculateStats(emotionData);
            this.updateStats(stats);
        } catch (error) {
            console.error('Error updating time period:', error);
            this.showError('Failed to update time period');
        } finally {
            this.showLoading(false);
        }
    }

    calculateStats(emotionData) {
        if (!emotionData || emotionData.length === 0) {
            return {
                average_mood: 50,
                stress_level: 30,
                engagement: 70,
                total_responses: 0,
                trend: 0
            };
        }
        const total = emotionData.length;
        const sumMood = emotionData.reduce((sum, d) => sum + (d.mood_level || 0), 0);
        const sumStress = emotionData.reduce((sum, d) => sum + (d.stress_level || 0), 0);
        const sumEngagement = emotionData.reduce((sum, d) => sum + (d.engagement || 0), 0);
        const average_mood = sumMood / total;
        const stress_level = sumStress / total;
        const engagement = sumEngagement / total;
        // Trend: selisih jumlah data hari ini dan kemarin
        const now = new Date();
        const today = emotionData.filter(d => new Date(Number(d.id)).toDateString() === now.toDateString()).length;
        const yesterday = emotionData.filter(d => {
            const date = new Date(Number(d.id));
            const yest = new Date(now);
            yest.setDate(now.getDate() - 1);
            return date.toDateString() === yest.toDateString();
        }).length;
        const trend = today - yesterday;
        return {
            average_mood,
            stress_level,
            engagement,
            total_responses: total,
            trend
        };
    }

    updateChartType() {
        if (!this.chart) return;
        
        const chartType = this.chartTypeSelect.value;
        this.chart.config.type = chartType;
        this.chart.update();
    }

    setActiveButton(activeButton) {
        this.periodButtons.forEach(btn => {
            btn.classList.toggle('active', btn === activeButton);
        });
    }

    updateStats(stats) {
        if (!stats) return;

        try {
            if (this.avgMoodElement) {
                const avgMood = stats.average_mood || 50;
                this.avgMoodElement.textContent = `${Math.round(avgMood)}%`;
                const moodFill = this.avgMoodElement.closest('.stat-card')?.querySelector('.meter-fill');
                if (moodFill) {
                    moodFill.style.width = `${avgMood}%`;
                    moodFill.style.backgroundColor = this.getMoodColor(avgMood);
                }
            }
            
            if (this.stressLevelElement) {
                const stressLevel = stats.stress_level || 30;
                this.stressLevelElement.textContent = this.getStressLevelText(stressLevel);
                const stressFill = this.stressLevelElement.closest('.stat-card')?.querySelector('.meter-fill');
                if (stressFill) {
                    stressFill.style.width = `${stressLevel}%`;
                    stressFill.style.backgroundColor = this.getStressColor(stressLevel);
                }
            }
            
            if (this.engagementElement) {
                const engagement = stats.engagement || 70;
                this.engagementElement.textContent = this.getEngagementText(engagement);
                const engagementFill = this.engagementElement.closest('.stat-card')?.querySelector('.meter-fill');
                if (engagementFill) {
                    engagementFill.style.width = `${engagement}%`;
                    engagementFill.style.backgroundColor = this.getEngagementColor(engagement);
                }
            }
            
            if (this.responsesElement) {
                this.responsesElement.textContent = stats.total_responses || 0;
                const trendElement = this.responsesElement.nextElementSibling;
                if (trendElement?.classList?.contains('stat-trend')) {
                    const trend = stats.trend || 0;
                    trendElement.textContent = trend >= 0 ? `↑ ${trend} today` : `↓ ${Math.abs(trend)} today`;
                    trendElement.className = `stat-trend ${trend >= 0 ? 'positive' : 'negative'}`;
                }
            }
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    initializeCharts(historyData) {
        if (!this.moodChart) return;

        try {
            if (this.chart) {
                this.chart.destroy();
            }
            
            const ctx = this.moodChart.getContext('2d');
            const labels = historyData.map(entry => new Date(entry.timestamp).toLocaleDateString());
            const moodData = historyData.map(entry => entry.mood_level);
            const stressData = historyData.map(entry => entry.stress_level);
            
            this.chart = new Chart(ctx, {
                type: this.chartTypeSelect?.value || 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Mood Level',
                            data: moodData,
                            borderColor: '#4CAF50',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            tension: 0.3,
                            fill: true
                        },
                        {
                            label: 'Stress Level',
                            data: stressData,
                            borderColor: '#F44336',
                            backgroundColor: 'rgba(244, 67, 54, 0.1)',
                            tension: 0.3,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.raw}%`;
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: 'Team Mood & Stress Levels Over Time'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Level (%)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing charts:', error);
            this.showError('Failed to load charts. Please refresh the page.');
        }
    }

    updateActivityFeed(historyData) {
        if (!this.activityList) return;

        try {
            if (!historyData || historyData.length === 0) {
                this.activityList.innerHTML = '<li class="no-activity">No recent activity to display</li>';
                return;
            }
            
            this.activityList.innerHTML = historyData
                .slice(0, 5) // Show only the 5 most recent entries
                .map(entry => {
                    const date = new Date(entry.timestamp);
                    const moodIcon = this.getMoodIcon(entry.mood_level);
                    const timeAgo = this.formatTimeAgo(date);
                    
                    return `
                        <li class="activity-item">
                            <div class="activity-icon ${entry.mood_level >= 70 ? 'positive' : entry.mood_level >= 40 ? 'neutral' : 'negative'}">
                                <i class="fas ${moodIcon}"></i>
                            </div>
                            <div class="activity-details">
                                <p class="activity-text">
                                    <strong>${entry.user_name || 'Anonymous'}</strong> reported 
                                    <span class="mood-level">${entry.mood_level}% mood</span>
                                    ${entry.note ? `<span class="activity-note">"${entry.note}"</span>` : ''}
                                </p>
                                <p class="activity-time" title="${date.toLocaleString()}">
                                    ${timeAgo}
                                </p>
                            </div>
                        </li>
                    `;
                })
                .join('');
        } catch (error) {
            console.error('Error updating activity feed:', error);
            this.activityList.innerHTML = '<li class="error">Failed to load activity feed</li>';
        }
    }

    // Helper methods
    getMoodColor(value) {
        if (value >= 70) return '#4CAF50'; // Green
        if (value >= 40) return '#FFC107'; // Yellow
        return '#F44336'; // Red
    }
    
    getStressColor(value) {
        if (value < 30) return '#4CAF50'; // Green
        if (value < 70) return '#FFC107'; // Yellow
        return '#F44336'; // Red
    }
    
    getEngagementColor(value) {
        if (value >= 70) return '#4CAF50'; // Green
        if (value >= 40) return '#2196F3'; // Blue
        return '#9E9E9E'; // Grey
    }
    
    getMoodIcon(moodLevel) {
        if (moodLevel >= 70) return 'fa-smile-beam';
        if (moodLevel >= 40) return 'fa-meh';
        return 'fa-frown';
    }
    
    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = Math.floor(seconds / 31536000);
        
        if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
        return 'just now';
    }
    
    getStressLevelText(level) {
        if (level < 30) return 'Low';
        if (level < 70) return 'Medium';
        return 'High';
    }
    
    getEngagementText(level) {
        if (level >= 70) return 'High';
        if (level >= 40) return 'Medium';
        return 'Low';
    }
    
    showLoading(show) {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(el => {
            el.style.display = show ? 'block' : 'none';
        });
    }
    
    showError(message) {
        console.error(message);
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        // Insert at the top of the main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(errorElement, mainContent.firstChild);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                errorElement.style.opacity = '0';
                setTimeout(() => errorElement.remove(), 300);
            }, 5000);
        }
    }

    async refreshData() {
        try {
            await this.loadDashboardData();
        } catch (error) {
            console.error('Error refreshing dashboard data:', error);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (AuthService.isAuthenticated()) {
        window.dashboard = new Dashboard();
    } else {
        window.location.href = 'login.html';
    }
});
