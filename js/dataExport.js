/**
 * Comprehensive Data Export Utility
 * Supports PDF, CSV, JSON exports with advanced filtering and reporting
 */

class DataExportUtility {
    constructor(dataStorage) {
        this.dataStorage = dataStorage;
        this.exportFormats = ['json', 'csv', 'pdf'];
        this.reportTemplates = {
            daily: 'Daily Emotion Report',
            weekly: 'Weekly Emotion Summary',
            monthly: 'Monthly Emotion Analysis',
            custom: 'Custom Report'
        };
    }

    /**
     * Export data with comprehensive filtering and formatting
     */
    async exportData(options = {}) {
        try {
            const {
                format = 'json',
                filters = {},
                reportType = 'custom',
                includeAnalytics = true,
                includeCharts = false,
                dateRange = null,
                groupBy = null,
                sortBy = 'timestamp',
                sortOrder = 'desc'
            } = options;

            // Validate format
            if (!this.exportFormats.includes(format)) {
                throw new Error(`Unsupported format: ${format}`);
            }

            // Get filtered data
            const data = await this.getFilteredData(filters, dateRange);
            
            // Sort data
            const sortedData = this.sortData(data, sortBy, sortOrder);
            
            // Group data if requested
            const groupedData = groupBy ? this.groupData(sortedData, groupBy) : sortedData;

            // Generate analytics if requested
            let analytics = null;
            if (includeAnalytics) {
                analytics = await this.generateAnalytics(sortedData);
            }

            // Create export object
            const exportObject = {
                metadata: this.generateMetadata(reportType, filters, dateRange),
                data: groupedData,
                analytics: analytics,
                summary: this.generateSummary(sortedData),
                exportInfo: {
                    timestamp: new Date().toISOString(),
                    format: format,
                    totalRecords: sortedData.length,
                    filters: filters
                }
            };

            // Export based on format
            switch (format.toLowerCase()) {
                case 'json':
                    return this.exportToJSON(exportObject);
                case 'csv':
                    return this.exportToCSV(exportObject);
                case 'pdf':
                    return await this.exportToPDF(exportObject, includeCharts);
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }

        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    /**
     * Get filtered data from storage
     */
    async getFilteredData(filters, dateRange) {
        let data = await this.dataStorage.getEmotionData();

        // Apply date range filter
        if (dateRange) {
            data = data.filter(item => {
                const itemDate = new Date(item.timestamp);
                return itemDate >= dateRange.start && itemDate <= dateRange.end;
            });
        }

        // Apply custom filters
        if (filters.emotion) {
            data = data.filter(item => 
                item.dominantEmotion === filters.emotion || 
                item.emotions?.[filters.emotion]
            );
        }

        if (filters.source) {
            data = data.filter(item => item.source === filters.source);
        }

        if (filters.userId) {
            data = data.filter(item => item.userId === filters.userId);
        }

        if (filters.minConfidence) {
            data = data.filter(item => item.confidence >= filters.minConfidence);
        }

        if (filters.maxConfidence) {
            data = data.filter(item => item.confidence <= filters.maxConfidence);
        }

        return data;
    }

    /**
     * Sort data by specified field
     */
    sortData(data, sortBy, sortOrder) {
        return data.sort((a, b) => {
            let aValue = this.getNestedValue(a, sortBy);
            let bValue = this.getNestedValue(b, sortBy);

            // Handle different data types
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }

    /**
     * Group data by specified field
     */
    groupData(data, groupBy) {
        const groups = {};
        
        data.forEach(item => {
            const key = this.getNestedValue(item, groupBy);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
        });

        return groups;
    }

    /**
     * Generate comprehensive analytics
     */
    async generateAnalytics(data) {
        if (!data || data.length === 0) {
            return null;
        }

        const analytics = {
            overview: this.generateOverviewStats(data),
            emotionDistribution: this.generateEmotionDistribution(data),
            timeAnalysis: this.generateTimeAnalysis(data),
            sourceAnalysis: this.generateSourceAnalysis(data),
            userAnalysis: this.generateUserAnalysis(data),
            trends: this.generateTrends(data),
            insights: this.generateInsights(data)
        };

        return analytics;
    }

    /**
     * Generate overview statistics
     */
    generateOverviewStats(data) {
        const totalEntries = data.length;
        const uniqueUsers = new Set(data.map(item => item.userId)).size;
        const dateRange = {
            start: new Date(Math.min(...data.map(item => new Date(item.timestamp)))),
            end: new Date(Math.max(...data.map(item => new Date(item.timestamp))))
        };

        const averageConfidence = data.reduce((sum, item) => sum + (item.confidence || 0), 0) / totalEntries;

        return {
            totalEntries,
            uniqueUsers,
            dateRange,
            averageConfidence,
            dataQuality: this.calculateDataQuality(data)
        };
    }

    /**
     * Generate emotion distribution analysis
     */
    generateEmotionDistribution(data) {
        const emotionCounts = {};
        const emotionConfidence = {};

        data.forEach(item => {
            const emotion = item.dominantEmotion || 'unknown';
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
            
            if (!emotionConfidence[emotion]) {
                emotionConfidence[emotion] = [];
            }
            emotionConfidence[emotion].push(item.confidence || 0);
        });

        // Calculate average confidence per emotion
        Object.keys(emotionConfidence).forEach(emotion => {
            emotionConfidence[emotion] = emotionConfidence[emotion].reduce((a, b) => a + b, 0) / emotionConfidence[emotion].length;
        });

        return {
            counts: emotionCounts,
            percentages: this.calculatePercentages(emotionCounts, data.length),
            averageConfidence: emotionConfidence,
            dominantEmotion: Object.keys(emotionCounts).reduce((a, b) => 
                emotionCounts[a] > emotionCounts[b] ? a : b
            )
        };
    }

    /**
     * Generate time-based analysis
     */
    generateTimeAnalysis(data) {
        const hourlyDistribution = new Array(24).fill(0);
        const dailyDistribution = new Array(7).fill(0);
        const monthlyDistribution = new Array(12).fill(0);

        data.forEach(item => {
            const date = new Date(item.timestamp);
            hourlyDistribution[date.getHours()]++;
            dailyDistribution[date.getDay()]++;
            monthlyDistribution[date.getMonth()]++;
        });

        return {
            hourly: hourlyDistribution,
            daily: dailyDistribution,
            monthly: monthlyDistribution,
            peakHours: this.findPeakHours(hourlyDistribution),
            peakDays: this.findPeakDays(dailyDistribution)
        };
    }

    /**
     * Generate source analysis
     */
    generateSourceAnalysis(data) {
        const sourceCounts = {};
        const sourceEmotions = {};

        data.forEach(item => {
            const source = item.source || 'unknown';
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
            
            if (!sourceEmotions[source]) {
                sourceEmotions[source] = {};
            }
            
            const emotion = item.dominantEmotion || 'unknown';
            sourceEmotions[source][emotion] = (sourceEmotions[source][emotion] || 0) + 1;
        });

        return {
            counts: sourceCounts,
            percentages: this.calculatePercentages(sourceCounts, data.length),
            emotionBreakdown: sourceEmotions
        };
    }

    /**
     * Generate user analysis
     */
    generateUserAnalysis(data) {
        const userStats = {};
        const userEmotions = {};

        data.forEach(item => {
            const userId = item.userId || 'anonymous';
            
            if (!userStats[userId]) {
                userStats[userId] = {
                    totalEntries: 0,
                    averageConfidence: 0,
                    totalConfidence: 0,
                    firstEntry: item.timestamp,
                    lastEntry: item.timestamp
                };
            }

            userStats[userId].totalEntries++;
            userStats[userId].totalConfidence += item.confidence || 0;
            userStats[userId].averageConfidence = userStats[userId].totalConfidence / userStats[userId].totalEntries;
            
            if (new Date(item.timestamp) < new Date(userStats[userId].firstEntry)) {
                userStats[userId].firstEntry = item.timestamp;
            }
            if (new Date(item.timestamp) > new Date(userStats[userId].lastEntry)) {
                userStats[userId].lastEntry = item.timestamp;
            }

            if (!userEmotions[userId]) {
                userEmotions[userId] = {};
            }
            
            const emotion = item.dominantEmotion || 'unknown';
            userEmotions[userId][emotion] = (userEmotions[userId][emotion] || 0) + 1;
        });

        return {
            stats: userStats,
            emotions: userEmotions,
            mostActiveUser: Object.keys(userStats).reduce((a, b) => 
                userStats[a].totalEntries > userStats[b].totalEntries ? a : b
            )
        };
    }

    /**
     * Generate trends analysis
     */
    generateTrends(data) {
        // Group by date
        const dailyData = {};
        data.forEach(item => {
            const date = new Date(item.timestamp).toDateString();
            if (!dailyData[date]) {
                dailyData[date] = [];
            }
            dailyData[date].push(item);
        });

        // Calculate daily trends
        const trends = Object.keys(dailyData).map(date => {
            const dayData = dailyData[date];
            const emotionCounts = {};
            
            dayData.forEach(item => {
                const emotion = item.dominantEmotion || 'unknown';
                emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
            });

            return {
                date: date,
                totalEntries: dayData.length,
                dominantEmotion: Object.keys(emotionCounts).reduce((a, b) => 
                    emotionCounts[a] > emotionCounts[b] ? a : b
                ),
                averageConfidence: dayData.reduce((sum, item) => sum + (item.confidence || 0), 0) / dayData.length
            };
        });

        return trends.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    /**
     * Generate insights from data
     */
    generateInsights(data) {
        const insights = [];
        
        if (data.length === 0) {
            insights.push("No data available for analysis");
            return insights;
        }

        // Most common emotion
        const emotionDistribution = this.generateEmotionDistribution(data);
        insights.push(`Most common emotion: ${emotionDistribution.dominantEmotion} (${emotionDistribution.percentages[emotionDistribution.dominantEmotion].toFixed(1)}%)`);

        // Data quality insight
        const quality = this.calculateDataQuality(data);
        if (quality < 0.5) {
            insights.push("Data quality is low - consider improving input methods");
        } else if (quality > 0.8) {
            insights.push("Excellent data quality detected");
        }

        // Time patterns
        const timeAnalysis = this.generateTimeAnalysis(data);
        if (timeAnalysis.peakHours.length > 0) {
            insights.push(`Peak activity hours: ${timeAnalysis.peakHours.join(', ')}`);
        }

        // User engagement
        const userAnalysis = this.generateUserAnalysis(data);
        const uniqueUsers = Object.keys(userAnalysis.stats).length;
        if (uniqueUsers > 1) {
            insights.push(`Multiple users detected: ${uniqueUsers} unique users`);
        }

        return insights;
    }

    /**
     * Export to JSON format
     */
    exportToJSON(exportObject) {
        const jsonString = JSON.stringify(exportObject, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        return {
            blob,
            filename: this.generateFilename('json'),
            type: 'application/json'
        };
    }

    /**
     * Export to CSV format
     */
    exportToCSV(exportObject) {
        const { data, summary } = exportObject;
        
        // Flatten data for CSV
        const flattenedData = this.flattenDataForCSV(data);
        
        // Create CSV content
        const csvContent = this.createCSVContent(flattenedData, summary);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        
        return {
            blob,
            filename: this.generateFilename('csv'),
            type: 'text/csv'
        };
    }

    /**
     * Export to PDF format
     */
    async exportToPDF(exportObject, includeCharts = false) {
        try {
            // Check if jsPDF is available
            if (typeof jsPDF === 'undefined') {
                throw new Error('jsPDF library not available. Please include jsPDF for PDF export.');
            }

            const doc = new jsPDF();
            const { metadata, analytics, summary } = exportObject;

            // Add title
            doc.setFontSize(20);
            doc.text(metadata.title, 20, 20);

            // Add metadata
            doc.setFontSize(12);
            doc.text(`Generated: ${metadata.generatedAt}`, 20, 35);
            doc.text(`Total Records: ${metadata.totalRecords}`, 20, 45);
            doc.text(`Date Range: ${metadata.dateRange}`, 20, 55);

            // Add summary
            if (summary) {
                doc.setFontSize(14);
                doc.text('Summary', 20, 75);
                doc.setFontSize(10);
                let y = 85;
                Object.keys(summary).forEach(key => {
                    doc.text(`${key}: ${summary[key]}`, 20, y);
                    y += 7;
                });
            }

            // Add analytics
            if (analytics) {
                doc.setFontSize(14);
                doc.text('Analytics', 20, 120);
                doc.setFontSize(10);
                
                // Emotion distribution
                if (analytics.emotionDistribution) {
                    doc.text('Emotion Distribution:', 20, 135);
                    let y = 145;
                    Object.keys(analytics.emotionDistribution.counts).forEach(emotion => {
                        const count = analytics.emotionDistribution.counts[emotion];
                        const percentage = analytics.emotionDistribution.percentages[emotion];
                        doc.text(`${emotion}: ${count} (${percentage.toFixed(1)}%)`, 30, y);
                        y += 7;
                    });
                }

                // Insights
                if (analytics.insights) {
                    doc.setFontSize(14);
                    doc.text('Insights', 20, 180);
                    doc.setFontSize(10);
                    let y = 190;
                    analytics.insights.forEach(insight => {
                        doc.text(`• ${insight}`, 20, y);
                        y += 7;
                    });
                }
            }

            // Add charts if requested and Chart.js is available
            if (includeCharts && typeof Chart !== 'undefined') {
                // This would require additional implementation for chart generation
                doc.text('Charts would be included here', 20, 250);
            }

            const pdfBlob = doc.output('blob');
            
            return {
                blob: pdfBlob,
                filename: this.generateFilename('pdf'),
                type: 'application/pdf'
            };

        } catch (error) {
            console.error('Error generating PDF:', error);
            throw new Error('PDF generation failed. Please ensure jsPDF library is included.');
        }
    }

    /**
     * Generate metadata for export
     */
    generateMetadata(reportType, filters, dateRange) {
        return {
            title: this.reportTemplates[reportType] || 'Custom Report',
            generatedAt: new Date().toISOString(),
            reportType: reportType,
            filters: filters,
            dateRange: dateRange ? `${dateRange.start.toDateString()} - ${dateRange.end.toDateString()}` : 'All time',
            totalRecords: 0, // Will be updated later
            version: '1.0'
        };
    }

    /**
     * Generate summary statistics
     */
    generateSummary(data) {
        if (!data || data.length === 0) {
            return { message: 'No data available' };
        }

        const totalEntries = data.length;
        const uniqueUsers = new Set(data.map(item => item.userId)).size;
        const averageConfidence = data.reduce((sum, item) => sum + (item.confidence || 0), 0) / totalEntries;

        return {
            totalEntries,
            uniqueUsers,
            averageConfidence: averageConfidence.toFixed(2),
            dateRange: `${new Date(Math.min(...data.map(item => new Date(item.timestamp)))).toDateString()} - ${new Date(Math.max(...data.map(item => new Date(item.timestamp)))).toDateString()}`
        };
    }

    /**
     * Flatten data for CSV export
     */
    flattenDataForCSV(data) {
        if (Array.isArray(data)) {
            return data.map(item => this.flattenObject(item));
        } else if (typeof data === 'object') {
            // Handle grouped data
            const flattened = [];
            Object.keys(data).forEach(key => {
                data[key].forEach(item => {
                    flattened.push({
                        group: key,
                        ...this.flattenObject(item)
                    });
                });
            });
            return flattened;
        }
        return [];
    }

    /**
     * Flatten nested object for CSV
     */
    flattenObject(obj, prefix = '') {
        const flattened = {};
        
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            const newKey = prefix ? `${prefix}_${key}` : key;
            
            if (value === null || value === undefined) {
                flattened[newKey] = '';
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(flattened, this.flattenObject(value, newKey));
            } else if (Array.isArray(value)) {
                flattened[newKey] = value.join(', ');
            } else {
                flattened[newKey] = value;
            }
        });
        
        return flattened;
    }

    /**
     * Create CSV content
     */
    createCSVContent(data, summary) {
        if (!data || data.length === 0) {
            return 'No data available';
        }

        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Escape commas and quotes
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ];

        // Add summary at the end
        if (summary) {
            csvRows.push('');
            csvRows.push('Summary');
            Object.keys(summary).forEach(key => {
                csvRows.push(`${key},${summary[key]}`);
            });
        }

        return csvRows.join('\n');
    }

    /**
     * Generate filename for export
     */
    generateFilename(format) {
        const timestamp = new Date().toISOString().split('T')[0];
        return `emotion-data-${timestamp}.${format}`;
    }

    /**
     * Utility methods
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    calculatePercentages(counts, total) {
        const percentages = {};
        Object.keys(counts).forEach(key => {
            percentages[key] = (counts[key] / total) * 100;
        });
        return percentages;
    }

    calculateDataQuality(data) {
        if (!data || data.length === 0) return 0;
        
        const validEntries = data.filter(item => 
            item.confidence && item.confidence > 0.5 && 
            item.dominantEmotion && 
            item.timestamp
        ).length;
        
        return validEntries / data.length;
    }

    findPeakHours(hourlyDistribution) {
        const max = Math.max(...hourlyDistribution);
        return hourlyDistribution
            .map((count, hour) => ({ hour, count }))
            .filter(item => item.count === max)
            .map(item => item.hour);
    }

    findPeakDays(dailyDistribution) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const max = Math.max(...dailyDistribution);
        return dailyDistribution
            .map((count, day) => ({ day: days[day], count }))
            .filter(item => item.count === max)
            .map(item => item.day);
    }
}

// Export for use in other modules
window.DataExportUtility = DataExportUtility; 