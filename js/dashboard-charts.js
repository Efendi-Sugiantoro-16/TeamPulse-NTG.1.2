// dashboard-charts.js
// Use dashboard's local data for charts

async function reloadDashboardData() {
    if (window.dashboard && window.dashboard.dataStorage) {
        // Reload data from DataStorage
        window.dashboard.dashboardData = await window.dashboard.dataStorage.getEmotionData({});
    }
}

function fetchLogs() {
    // Ambil data dari dashboard yang sudah di-load dari DataStorage/HybridStorage
    return window.dashboard && window.dashboard.dashboardData ? window.dashboard.dashboardData : [];
}

function processEmotionData(logs) {
    const emotionCount = {};
    const hourCount = Array(24).fill(0);

    logs.forEach(log => {
        // Donut: count by emotion
        const emotion = log.dominantEmotion || log.type || 'Undefined';
        emotionCount[emotion] = (emotionCount[emotion] || 0) + 1;

        // Bar: count by hour
        if (log.timestamp) {
            const date = new Date(log.timestamp);
            const hour = date.getHours();
            hourCount[hour]++;
        }
    });

    return { emotionCount, hourCount };
}

function renderDonutChart(ctx, emotionCount) {
    const labels = Object.keys(emotionCount);
    const data = Object.values(emotionCount);
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: [
                    '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796', '#a569bd', '#f1948a'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function renderBarChart(ctx, hourCount) {
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 24}, (_, i) => i + ':00'),
            datasets: [{
                label: 'Entries per Hour',
                data: hourCount,
                backgroundColor: '#4e73df'
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Hour' } },
                y: { title: { display: true, text: 'Entries' }, beginAtZero: true }
            }
        }
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    async function renderChartsWhenReady() {
        if (window.dashboard && window.dashboard.dataStorage) {
            await reloadDashboardData();
            const logs = fetchLogs();
            const { emotionCount, hourCount } = processEmotionData(logs);

            const donut = document.getElementById('emotionDistributionChart');
            if (donut) {
                renderDonutChart(donut.getContext('2d'), emotionCount);
            }
            const bar = document.getElementById('timeAnalysisChart');
            if (bar) {
                renderBarChart(bar.getContext('2d'), hourCount);
            }
        } else {
            setTimeout(renderChartsWhenReady, 200);
        }
    }
    renderChartsWhenReady();
});

Chart.defaults.color = '#2c3e50';
Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
Chart.defaults.plugins.legend.labels.boxWidth = 18;