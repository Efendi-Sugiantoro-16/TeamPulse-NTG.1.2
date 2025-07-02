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

// Database connection test endpoint
app.get('/api/db-test', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({ 
            success: true, 
            message: 'Database connection successful',
            database: process.env.DB_NAME || 'teampulse_db'
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database connection failed',
            error: error.message,
            config: {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                database: process.env.DB_NAME || 'teampulse_db',
                user: process.env.DB_USER || 'root'
            }
        });
    }
});

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

// Initialize database and start server
const initializeServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully');
        
        // Sync database models
        await sequelize.sync({ alter: true });
        console.log('✅ Database models synchronized');
        
        const PORT = process.env.PORT || 8080;
        app.listen(PORT, () => {
            console.log(`🚀 TeamPulse server running on port ${PORT}`);
            console.log(`🔗 Home: http://localhost:${PORT}`);
            console.log(`🔗 Login: http://localhost:${PORT}/login`);
            console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
            console.log(`🎭 Emotion Input: http://localhost:${PORT}/emotion-input`);
            console.log(`🔗 API Base: http://localhost:${PORT}/api`);
            console.log(`🔗 DB Test: http://localhost:${PORT}/api/db-test`);
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        console.log('⚠️  Starting server in offline mode...');
        console.log('📝 Please ensure MySQL is running and .env file is configured');
        console.log('📝 Database config needed: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME');
        
        const PORT = process.env.PORT || 8080;
        app.listen(PORT, () => {
            console.log(`🚀 TeamPulse server running on port ${PORT} (offline mode)`);
            console.log(`🔗 Home: http://localhost:${PORT}`);
            console.log(`🔗 Login: http://localhost:${PORT}/login`);
            console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
            console.log(`🎭 Emotion Input: http://localhost:${PORT}/emotion-input`);
            console.log(`🔗 API Base: http://localhost:${PORT}/api`);
            console.log(`🔗 DB Test: http://localhost:${PORT}/api/db-test`);
        });
    }
};

initializeServer(); 