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
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, 30000);
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
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

        // Mobile menu functionality
        this.setupMobileMenu();
    }

    setupMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const sidebarClose = document.getElementById('sidebarClose');

        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.add('active');
                sidebarOverlay.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent background scrolling
            });
        }

        if (sidebarClose) {
            sidebarClose.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }

        // Close menu when clicking on navigation links
        const navLinks = sidebar.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 991) {
                this.closeMobileMenu();
            }
        });
    }

    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) sidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
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
            let emotionData = await storage.getEmotionData();
            
            // If no data exists, create some sample data for demonstration
            if (!emotionData || emotionData.length === 0) {
                console.log('No emotion data found, creating sample data for demonstration');
                emotionData = this.generateSampleData();
                
                // Save sample data to storage
                for (const sample of emotionData) {
                    await storage.saveEmotionData(sample);
                }
            }
            
            const stats = this.calculateStats(emotionData);
            this.updateStats(stats);
            this.initializeCharts(emotionData);
            this.updateActivityFeed(emotionData);
            this.updateAlerts(emotionData);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data. Please try again later.');
        } finally {
            this.showLoading(false);
        }
    }

    generateSampleData() {
        const sampleData = [];
        const now = new Date();
        
        // Generate data for the last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Create 2-4 entries per day
            const entriesPerDay = Math.floor(Math.random() * 3) + 2;
            
            for (let j = 0; j < entriesPerDay; j++) {
                const timestamp = new Date(date);
                timestamp.setHours(9 + Math.floor(Math.random() * 8)); // Random hour between 9-17
                timestamp.setMinutes(Math.floor(Math.random() * 60));
                
                // Generate more realistic emotion patterns
                let emotions;
                
                // Different patterns for different times of day
                const hour = timestamp.getHours();
                if (hour < 12) {
                    // Morning: generally more positive
                    emotions = {
                        happy: 0.6 + Math.random() * 0.3,
                        sad: Math.random() * 0.2,
                        angry: Math.random() * 0.1,
                        neutral: 0.2 + Math.random() * 0.3,
                        surprised: Math.random() * 0.2,
                        fearful: Math.random() * 0.1,
                        disgusted: Math.random() * 0.05
                    };
                } else if (hour < 17) {
                    // Afternoon: mixed emotions
                    emotions = {
                        happy: 0.3 + Math.random() * 0.4,
                        sad: 0.1 + Math.random() * 0.3,
                        angry: 0.1 + Math.random() * 0.2,
                        neutral: 0.3 + Math.random() * 0.4,
                        surprised: Math.random() * 0.3,
                        fearful: Math.random() * 0.2,
                        disgusted: Math.random() * 0.1
                    };
                } else {
                    // Evening: more tired/neutral
                    emotions = {
                        happy: 0.2 + Math.random() * 0.3,
                        sad: 0.2 + Math.random() * 0.3,
                        angry: Math.random() * 0.2,
                        neutral: 0.4 + Math.random() * 0.4,
                        surprised: Math.random() * 0.1,
                        fearful: Math.random() * 0.1,
                        disgusted: Math.random() * 0.05
                    };
                }
                
                // Normalize emotions to sum to 1
                const total = Object.values(emotions).reduce((sum, val) => sum + val, 0);
                Object.keys(emotions).forEach(key => {
                    emotions[key] = emotions[key] / total;
                });
                
                // Add metadata
                emotions.id = Date.now().toString() + '_' + i + '_' + j;
                emotions.timestamp = timestamp.toISOString();
                emotions.source = 'sample_data';
                
                sampleData.push(emotions);
            }
        }
        
        return sampleData;
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
                emotionData = emotionData.filter(item => now - new Date(item.timestamp).getTime() <= range);
            }
            
            // Update chart and stats
            this.initializeCharts(emotionData);
            const stats = this.calculateStats(emotionData);
            this.updateStats(stats);
            this.updateActivityFeed(emotionData);
            this.updateAlerts(emotionData);
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
        let sumMood = 0;
        let sumStress = 0;
        let sumEngagement = 0;
        
        emotionData.forEach(entry => {
            // Calculate mood level from emotion scores
            // Positive emotions (happy, surprised) contribute positively
            // Negative emotions (sad, angry, fearful, disgusted) contribute negatively
            const positiveScore = (entry.happy || 0) + (entry.surprised || 0);
            const negativeScore = (entry.sad || 0) + (entry.angry || 0) + (entry.fearful || 0) + (entry.disgusted || 0);
            const neutralScore = entry.neutral || 0;
            
            // Mood level calculation: positive emotions boost mood, negative emotions reduce it
            const moodLevel = Math.max(0, Math.min(100, 
                (positiveScore * 100) - (negativeScore * 50) + (neutralScore * 50)
            ));
            
            // Stress level calculation: based on negative emotions
            const stressLevel = Math.max(0, Math.min(100, negativeScore * 100));
            
            // Engagement calculation: based on intensity of any emotion (not neutral)
            const totalEmotionIntensity = positiveScore + negativeScore;
            const engagement = Math.max(0, Math.min(100, totalEmotionIntensity * 100));
            
            sumMood += moodLevel;
            sumStress += stressLevel;
            sumEngagement += engagement;
        });
        
        const average_mood = sumMood / total;
        const stress_level = sumStress / total;
        const engagement = sumEngagement / total;
        
        // Trend: selisih jumlah data hari ini dan kemarin
        const now = new Date();
        const today = emotionData.filter(d => new Date(d.timestamp).toDateString() === now.toDateString()).length;
        const yesterday = emotionData.filter(d => {
            const date = new Date(d.timestamp);
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
        if (!this.chart || !this.moodChart) return;
        
        try {
            const chartType = this.chartTypeSelect.value;
            
            // Store chart data before destroying
            const chartData = this.chart.data;
            const chartOptions = this.chart.options;
            
            // Destroy existing chart
            this.chart.destroy();
            this.chart = null;
            
            // Clear canvas
            const ctx = this.moodChart.getContext('2d');
            ctx.clearRect(0, 0, this.moodChart.width, this.moodChart.height);
            
            // Configure datasets based on chart type
            const datasets = chartData.datasets.map(dataset => {
                const newDataset = { ...dataset };
                
                if (chartType === 'bar') {
                    // Remove line-specific properties
                    delete newDataset.tension;
                    delete newDataset.fill;
                    // Set bar-specific properties
                    newDataset.backgroundColor = dataset.label === 'Mood Level' 
                        ? 'rgba(76, 175, 80, 0.8)' 
                        : 'rgba(244, 67, 54, 0.8)';
                    newDataset.borderWidth = 1;
                } else if (chartType === 'line') {
                    // Add line-specific properties
                    newDataset.tension = 0.3;
                    newDataset.fill = true;
                    newDataset.backgroundColor = dataset.label === 'Mood Level' 
                        ? 'rgba(76, 175, 80, 0.1)' 
                        : 'rgba(244, 67, 54, 0.1)';
                    delete newDataset.borderWidth;
                }
                
                return newDataset;
            });
            
            // Recreate chart with new type
            setTimeout(() => {
                try {
                    this.chart = new Chart(ctx, {
                        type: chartType,
                        data: {
                            labels: chartData.labels,
                            datasets: datasets
                        },
                        options: chartOptions
                    });
                    console.log('Chart type updated successfully to:', chartType);
                } catch (error) {
                    console.error('Error recreating chart:', error);
                    this.showError('Failed to update chart type');
                }
            }, 100);
            
        } catch (error) {
            console.error('Error updating chart type:', error);
            this.showError('Failed to update chart type');
        }
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
        if (!this.moodChart) {
            console.error('Mood chart canvas not found');
            return;
        }

        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            this.showError('Chart library not loaded. Please refresh the page.');
            return;
        }

        try {
            // Destroy existing chart if it exists
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
            
            // Clear the canvas completely
            const ctx = this.moodChart.getContext('2d');
            if (!ctx) {
                console.error('Could not get canvas context');
                this.showError('Chart canvas error. Please refresh the page.');
                return;
            }
            
            ctx.clearRect(0, 0, this.moodChart.width, this.moodChart.height);
            
            // Validate input data
            if (!historyData || !Array.isArray(historyData) || historyData.length === 0) {
                console.warn('No history data available for chart');
                this.showError('No data available for chart');
                return;
            }
            
            // Process data for charting
            const processedData = historyData.map(entry => {
                // Calculate mood level from emotion scores
                const positiveScore = (entry.happy || 0) + (entry.surprised || 0);
                const negativeScore = (entry.sad || 0) + (entry.angry || 0) + (entry.fearful || 0) + (entry.disgusted || 0);
                const neutralScore = entry.neutral || 0;
                
                const moodLevel = Math.max(0, Math.min(100, 
                    (positiveScore * 100) - (negativeScore * 50) + (neutralScore * 50)
                ));
                
                const stressLevel = Math.max(0, Math.min(100, negativeScore * 100));
                
                return {
                    timestamp: entry.timestamp,
                    mood_level: moodLevel,
                    stress_level: stressLevel
                };
            });
            
            // Sort by timestamp
            processedData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            const labels = processedData.map(entry => new Date(entry.timestamp).toLocaleDateString());
            const moodData = processedData.map(entry => entry.mood_level);
            const stressData = processedData.map(entry => entry.stress_level);
            
            // Create new chart with a small delay to ensure canvas is ready
            setTimeout(() => {
                try {
                    const chartType = this.chartTypeSelect?.value || 'bar';
                    
                    // Configure chart options based on type
                    const chartOptions = {
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
                    };
                    
                    // Configure datasets based on chart type
                    const datasets = [
                        {
                            label: 'Mood Level',
                            data: moodData,
                            backgroundColor: 'rgba(76, 175, 80, 0.8)',
                            borderColor: '#4CAF50',
                            borderWidth: 1
                        },
                        {
                            label: 'Stress Level',
                            data: stressData,
                            backgroundColor: 'rgba(244, 67, 54, 0.8)',
                            borderColor: '#F44336',
                            borderWidth: 1
                        }
                    ];
                    
                    // Add specific properties for line chart
                    if (chartType === 'line') {
                        datasets[0].tension = 0.3;
                        datasets[0].fill = true;
                        datasets[0].backgroundColor = 'rgba(76, 175, 80, 0.1)';
                        datasets[1].tension = 0.3;
                        datasets[1].fill = true;
                        datasets[1].backgroundColor = 'rgba(244, 67, 54, 0.1)';
                    }
                    
                    this.chart = new Chart(ctx, {
                        type: chartType,
                        data: {
                            labels: labels,
                            datasets: datasets
                        },
                        options: chartOptions
                    });
                    
                    console.log('Chart created successfully with type:', chartType);
                } catch (chartError) {
                    console.error('Error creating chart:', chartError);
                    this.showError('Failed to create chart. Please refresh the page.');
                }
            }, 200);
            
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
            
            // Process data for activity feed
            const processedData = historyData.map(entry => {
                // Calculate mood level from emotion scores
                const positiveScore = (entry.happy || 0) + (entry.surprised || 0);
                const negativeScore = (entry.sad || 0) + (entry.angry || 0) + (entry.fearful || 0) + (entry.disgusted || 0);
                const neutralScore = entry.neutral || 0;
                
                const moodLevel = Math.max(0, Math.min(100, 
                    (positiveScore * 100) - (negativeScore * 50) + (neutralScore * 50)
                ));
                
                // Find dominant emotion
                const emotions = {
                    happy: entry.happy || 0,
                    sad: entry.sad || 0,
                    angry: entry.angry || 0,
                    neutral: entry.neutral || 0,
                    surprised: entry.surprised || 0,
                    fearful: entry.fearful || 0,
                    disgusted: entry.disgusted || 0
                };
                
                const dominantEmotion = Object.entries(emotions).reduce((a, b) => a[1] > b[1] ? a : b);
                
                return {
                    ...entry,
                    mood_level: moodLevel,
                    dominant_emotion: dominantEmotion[0],
                    dominant_score: dominantEmotion[1]
                };
            });
            
            // Sort by timestamp (newest first)
            processedData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            this.activityList.innerHTML = processedData
                .slice(0, 5) // Show only the 5 most recent entries
                .map(entry => {
                    const date = new Date(entry.timestamp);
                    const moodIcon = this.getMoodIcon(entry.mood_level);
                    const timeAgo = this.formatTimeAgo(date);
                    const emotionName = entry.dominant_emotion.charAt(0).toUpperCase() + entry.dominant_emotion.slice(1);
                    const emotionPercentage = Math.round(entry.dominant_score * 100);
                    
                    return `
                        <li class="activity-item">
                            <div class="activity-icon ${entry.mood_level >= 70 ? 'positive' : entry.mood_level >= 40 ? 'neutral' : 'negative'}">
                                <i class="fas ${moodIcon}"></i>
                            </div>
                            <div class="activity-details">
                                <p class="activity-text">
                                    <strong>Emotion recorded</strong>: 
                                    <span class="mood-level">${emotionName} (${emotionPercentage}%)</span>
                                    <br>
                                    <span class="overall-mood">Overall mood: ${Math.round(entry.mood_level)}%</span>
                                    ${entry.source ? `<span class="activity-source">via ${entry.source}</span>` : ''}
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

    updateAlerts(emotionData) {
        if (!this.alertsList) return;

        try {
            const alerts = this.generateAlerts(emotionData);
            
            this.alertsList.innerHTML = alerts
                .map(alert => `
                    <div class="alert-item ${alert.level}">
                        <strong>${alert.title}</strong>
                        <p>${alert.message}</p>
                        <small>${alert.time}</small>
                    </div>
                `)
                .join('');
        } catch (error) {
            console.error('Error updating alerts:', error);
            this.alertsList.innerHTML = '<div class="alert-item low">No alerts at this time</div>';
        }
    }

    generateAlerts(emotionData) {
        const alerts = [];
        const now = new Date();
        
        // Analyze recent data for alerts
        const recentData = emotionData.filter(entry => {
            const entryTime = new Date(entry.timestamp);
            return now - entryTime < 24 * 60 * 60 * 1000; // Last 24 hours
        });
        
        if (recentData.length === 0) {
            alerts.push({
                level: 'low',
                title: 'No Recent Activity',
                message: 'No emotion data recorded in the last 24 hours.',
                time: 'Just now'
            });
            return alerts;
        }
        
        // Calculate average stress level
        const avgStress = recentData.reduce((sum, entry) => {
            const negativeScore = (entry.sad || 0) + (entry.angry || 0) + (entry.fearful || 0) + (entry.disgusted || 0);
            return sum + (negativeScore * 100);
        }, 0) / recentData.length;
        
        if (avgStress > 60) {
            alerts.push({
                level: 'high',
                title: 'High Stress Detected',
                message: `Average stress level is ${Math.round(avgStress)}%. Consider team wellness activities.`,
                time: '5 minutes ago'
            });
        } else if (avgStress > 40) {
            alerts.push({
                level: 'medium',
                title: 'Moderate Stress Level',
                message: `Stress level is ${Math.round(avgStress)}%. Monitor team mood closely.`,
                time: '10 minutes ago'
            });
        }
        
        // Check for engagement patterns
        const avgEngagement = recentData.reduce((sum, entry) => {
            const totalEmotionIntensity = (entry.happy || 0) + (entry.sad || 0) + (entry.angry || 0) + (entry.fearful || 0) + (entry.disgusted || 0) + (entry.surprised || 0);
            return sum + (totalEmotionIntensity * 100);
        }, 0) / recentData.length;
        
        if (avgEngagement < 30) {
            alerts.push({
                level: 'medium',
                title: 'Low Team Engagement',
                message: 'Team shows low emotional engagement. Consider team building activities.',
                time: '15 minutes ago'
            });
        }
        
        // Add positive alert if conditions are good
        if (alerts.length === 0) {
            alerts.push({
                level: 'low',
                title: 'Team Mood Stable',
                message: 'Team emotional well-being is within normal ranges.',
                time: 'Just now'
            });
        }
        
        return alerts;
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

    cleanup() {
        try {
            // Destroy chart to prevent memory leaks
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
            
            // Remove event listeners
            if (this.chartTypeSelect) {
                this.chartTypeSelect.removeEventListener('change', this.updateChartType);
            }
            
            this.periodButtons.forEach(button => {
                button.removeEventListener('click', this.updateTimePeriod);
            });
            
            // Remove mobile menu event listeners
            const menuToggle = document.getElementById('menuToggle');
            const sidebarClose = document.getElementById('sidebarClose');
            const sidebarOverlay = document.getElementById('sidebarOverlay');
            
            if (menuToggle) {
                menuToggle.removeEventListener('click', this.setupMobileMenu);
            }
            
            if (sidebarClose) {
                sidebarClose.removeEventListener('click', this.closeMobileMenu);
            }
            
            if (sidebarOverlay) {
                sidebarOverlay.removeEventListener('click', this.closeMobileMenu);
            }
            
            console.log('Dashboard cleanup completed');
        } catch (error) {
            console.error('Error during cleanup:', error);
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
