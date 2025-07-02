-- TeamPulse NTG 1.2 - Database Initialization Script

CREATE DATABASE IF NOT EXISTS teampulse_db;
USE teampulse_db;

-- Users table
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emotions table
DROP TABLE IF EXISTS emotions;
CREATE TABLE emotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    emotion VARCHAR(50) NOT NULL,
    confidence FLOAT,
    source VARCHAR(20), -- camera, audio, text, snapshot
    data TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Feedback table
DROP TABLE IF EXISTS feedback;
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    message TEXT,
    emotion VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Snapshots table
DROP TABLE IF EXISTS snapshots;
CREATE TABLE snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    image_url VARCHAR(255),
    detected_emotion VARCHAR(50),
    confidence FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Dummy user for testing (id=1)
INSERT INTO users (id, username, password, email) VALUES (1, 'dummy', 'dummy', 'dummy@dummy.com')
    ON DUPLICATE KEY UPDATE username='dummy';
