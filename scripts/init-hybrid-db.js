/**
 * Initialize Hybrid Storage Database
 * 
 * This script creates the necessary database tables for the hybrid storage system
 */

const mysql = require('mysql2/promise');
const config = require('../config/hybrid-storage.js');

async function initDatabase() {
    let connection;
    
    try {
        console.log('🚀 Initializing Hybrid Storage Database...');
        
        // Create connection without database
        connection = await mysql.createConnection({
            host: config.mysql.host,
            user: config.mysql.user,
            password: config.mysql.password,
            port: config.mysql.port
        });
        
        // Create database if not exists
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${config.mysql.database}`);
        console.log(`✅ Database '${config.mysql.database}' ready`);
        
        // Close connection and reconnect with database
        await connection.end();
        
        // Reconnect with database specified
        connection = await mysql.createConnection({
            host: config.mysql.host,
            user: config.mysql.user,
            password: config.mysql.password,
            port: config.mysql.port,
            database: config.mysql.database
        });
        
        // Create emotions table
        const emotionsTableSQL = `
            CREATE TABLE IF NOT EXISTS emotions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255),
                emotion_type VARCHAR(50) NOT NULL,
                confidence_level DECIMAL(5,2) DEFAULT 0.00,
                source VARCHAR(50) DEFAULT 'manual',
                data JSON,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_emotion_type (emotion_type),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        await connection.execute(emotionsTableSQL);
        console.log('✅ Emotions table created');
        
        // Create users table
        const usersTableSQL = `
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                settings JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_email (email),
                INDEX idx_role (role)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        await connection.execute(usersTableSQL);
        console.log('✅ Users table created');
        
        // Create analytics table
        const analyticsTableSQL = `
            CREATE TABLE IF NOT EXISTS analytics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255),
                type VARCHAR(50) NOT NULL,
                data JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_type (type),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        await connection.execute(analyticsTableSQL);
        console.log('✅ Analytics table created');
        
        // Create sessions table for WebSocket connections
        const sessionsTableSQL = `
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255),
                client_id VARCHAR(255),
                token TEXT,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_client_id (client_id),
                INDEX idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        await connection.execute(sessionsTableSQL);
        console.log('✅ Sessions table created');
        
        // Insert sample data if tables are empty
        const [emotionsCount] = await connection.execute('SELECT COUNT(*) as count FROM emotions');
        if (emotionsCount[0].count === 0) {
            console.log('📝 Inserting sample emotion data...');
            
            const sampleEmotions = [
                {
                    user_id: 'demo_user',
                    emotion_type: 'happy',
                    confidence_level: 85.5,
                    source: 'face_analysis',
                    data: JSON.stringify({
                        face_confidence: 85.5,
                        voice_confidence: 0,
                        text_confidence: 0,
                        combined_confidence: 85.5
                    }),
                    notes: 'Sample happy emotion from face analysis'
                },
                {
                    user_id: 'demo_user',
                    emotion_type: 'neutral',
                    confidence_level: 72.3,
                    source: 'voice_analysis',
                    data: JSON.stringify({
                        face_confidence: 0,
                        voice_confidence: 72.3,
                        text_confidence: 0,
                        combined_confidence: 72.3
                    }),
                    notes: 'Sample neutral emotion from voice analysis'
                },
                {
                    user_id: 'demo_user',
                    emotion_type: 'sad',
                    confidence_level: 68.9,
                    source: 'manual',
                    data: JSON.stringify({
                        face_confidence: 0,
                        voice_confidence: 0,
                        text_confidence: 0,
                        combined_confidence: 68.9
                    }),
                    notes: 'Sample sad emotion from manual input'
                }
            ];
            
            for (const emotion of sampleEmotions) {
                await connection.execute(
                    'INSERT INTO emotions (user_id, emotion_type, confidence_level, source, data, notes) VALUES (?, ?, ?, ?, ?, ?)',
                    [emotion.user_id, emotion.emotion_type, emotion.confidence_level, emotion.source, emotion.data, emotion.notes]
                );
            }
            
            console.log('✅ Sample emotion data inserted');
        }
        
        // Insert sample user if users table is empty
        const [usersCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
        if (usersCount[0].count === 0) {
            console.log('📝 Inserting sample user...');
            
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('demo123', 10);
            
            await connection.execute(
                'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
                ['demo_user', 'demo', 'demo@teampulse.com', hashedPassword, 'user']
            );
            
            console.log('✅ Sample user created (username: demo, password: demo123)');
        }
        
        console.log('🎉 Hybrid Storage Database initialization completed successfully!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run initialization if this file is executed directly
if (require.main === module) {
    initDatabase()
        .then(() => {
            console.log('✅ Database initialization completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Database initialization failed:', error);
            process.exit(1);
        });
}

module.exports = { initDatabase }; 