/**
 * Database Setup Script
 * 
 * This script helps set up the MySQL database for TeamPulse
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'teampulse_db'
};

async function setupDatabase() {
    let connection;
    
    try {
        console.log('🚀 Starting database setup...');
        
        // Connect without database first
        connection = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password
        });
        
        console.log('✅ Connected to MySQL server');
        
        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
        console.log(`✅ Database '${dbConfig.database}' created/verified`);
        
        // Use the database
        await connection.query(`USE \`${dbConfig.database}\``);
        
        // Create tables manually (avoiding prepared statement issues)
        const createTables = [
            `DROP TABLE IF EXISTS emotions`,
            `DROP TABLE IF EXISTS feedback`,
            `DROP TABLE IF EXISTS snapshots`,
            `DROP TABLE IF EXISTS users`,
            `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS emotions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                emotion VARCHAR(50),
                confidence FLOAT,
                source VARCHAR(20),
                data TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                message TEXT,
                emotion VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS snapshots (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                image_url VARCHAR(255),
                detected_emotion VARCHAR(50),
                confidence FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];
        
        // Execute each table creation
        for (const createTable of createTables) {
            await connection.query(createTable);
            console.log(`✅ Table created successfully`);
        }
        
        // Insert dummy user jika belum ada
        const [users] = await connection.query("SELECT id FROM users WHERE id=1");
        if (!users.length) {
            await connection.query("INSERT INTO users (id, username, password, email) VALUES (1, 'dummy', 'dummy', 'dummy@dummy.com')");
            console.log('✅ Dummy user with id=1 created');
        }
        
        console.log('✅ Database setup completed successfully!');
        console.log('📊 Tables created: users, emotions, feedback, snapshots');
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.log('💡 Make sure MySQL is running and credentials are correct');
        console.log('💡 Check your .env file configuration');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run setup if this script is executed directly
if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase }; 