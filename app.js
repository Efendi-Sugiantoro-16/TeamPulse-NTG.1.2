require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./config/database');
const authRoutes = require('./routes/auth');
const emotionRoutes = require('./routes/emotion');
const databaseRoutes = require('./api/database');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/database', databaseRoutes);

// Health check
app.get('/api/ping', (req, res) => res.json({ status: 'ok' }));

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/emotion-input', (req, res) => {
    res.sendFile(path.join(__dirname, 'emotion-input.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

sequelize.sync().then(() => {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`🚀 TeamPulse server running on port ${PORT}`);
        console.log(`🔗 Home: http://localhost:${PORT}`);
        console.log(`🔗 Login: http://localhost:${PORT}/login`);
        console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
        console.log(`🎭 Emotion Input: http://localhost:${PORT}/emotion-input`);
        console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    });
}).catch(err => {
    console.error('❌ Database connection failed:', err);
    console.log('⚠️  Starting server without database...');
    
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`🚀 TeamPulse server running on port ${PORT} (offline mode)`);
        console.log(`🔗 Home: http://localhost:${PORT}`);
        console.log(`🔗 Login: http://localhost:${PORT}/login`);
        console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
        console.log(`🎭 Emotion Input: http://localhost:${PORT}/emotion-input`);
        console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    });
}); 