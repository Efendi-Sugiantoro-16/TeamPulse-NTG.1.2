/**
 * Hybrid Storage Configuration
 * 
 * Configuration for the hybrid storage system that provides
 * direct MySQL connection via WebSocket bridge
 */

module.exports = {
    // Server configuration
    server: {
        port: process.env.HYBRID_SERVER_PORT || 3001,
        host: process.env.HYBRID_SERVER_HOST || 'localhost',
        path: '/hybrid-storage'
    },
    
    // MySQL configuration
    mysql: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'teampulse',
        port: process.env.DB_PORT || 3306,
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
    },
    
    // Security configuration
    security: {
        enableAuth: process.env.HYBRID_ENABLE_AUTH !== 'false',
        secretKey: process.env.SECRET_KEY || 'teampulse-hybrid-storage-secret',
        tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            headers: ['Content-Type', 'Authorization']
        }
    },
    
    // Client configuration
    client: {
        autoReconnect: true,
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        timeout: 30000
    },
    
    // Database schema
    schema: {
        emotions: {
            table: 'emotions',
            columns: [
                'id INT AUTO_INCREMENT PRIMARY KEY',
                'user_id VARCHAR(255)',
                'emotion_type VARCHAR(50)',
                'confidence_level DECIMAL(5,2)',
                'source VARCHAR(50)',
                'data JSON',
                'notes TEXT',
                'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
                'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
            ]
        },
        users: {
            table: 'users',
            columns: [
                'id VARCHAR(255) PRIMARY KEY',
                'username VARCHAR(100) UNIQUE',
                'email VARCHAR(255) UNIQUE',
                'password_hash VARCHAR(255)',
                'role VARCHAR(50) DEFAULT "user"',
                'settings JSON',
                'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
                'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
            ]
        },
        analytics: {
            table: 'analytics',
            columns: [
                'id INT AUTO_INCREMENT PRIMARY KEY',
                'user_id VARCHAR(255)',
                'type VARCHAR(50)',
                'data JSON',
                'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
            ]
        }
    },
    
    // Logging configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableConsole: true,
        enableFile: false,
        logFile: 'logs/hybrid-storage.log'
    }
}; 