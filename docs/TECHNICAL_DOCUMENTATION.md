# TeamPulse-NTG.1.2 Technical Documentation

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Design](#database-design)
3. [API Reference](#api-reference)
4. [Frontend Architecture](#frontend-architecture)
5. [AI/ML Implementation](#aiml-implementation)
6. [Security Implementation](#security-implementation)
7. [Deployment Guide](#deployment-guide)
8. [Troubleshooting](#troubleshooting)

## System Architecture

### Overview

TeamPulse-NTG.1.2 follows a modern web application architecture with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (HTML/CSS/JS) │◄──►│   (Node.js/     │◄──►│   (MySQL)       │
│                 │    │    Express)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Models     │    │   JWT Auth      │    │   Data Storage  │
│   (TensorFlow/  │    │   Middleware    │    │   & Analytics   │
│    Face-api)    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend Layer
- **HTML5**: Semantic markup and structure
- **CSS3**: Responsive design and styling
- **JavaScript (ES6+)**: Client-side logic and interactivity
- **TensorFlow.js**: AI model inference in browser
- **Face-api.js**: Facial expression analysis
- **Chart.js**: Data visualization

#### Backend Layer
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **Sequelize**: ORM for database operations
- **JWT**: Authentication and authorization
- **bcryptjs**: Password hashing
- **CORS**: Cross-origin resource sharing

#### Database Layer
- **MySQL**: Relational database management system
- **InnoDB**: Storage engine for ACID compliance

#### AI/ML Layer
- **TensorFlow.js**: Machine learning framework
- **Face-api.js**: Pre-trained facial recognition models
- **Custom Audio Models**: Emotion detection from voice

## Database Design

### Entity Relationship Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    users    │    │   emotions  │    │   sessions  │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │
│ username    │    │ user_id (FK)│    │ user_id (FK)│
│ email       │    │ emotion_type│    │ token       │
│ password    │    │ intensity   │    │ expires_at  │
│ full_name   │    │ notes       │    │ created_at  │
│ created_at  │    │ created_at  │    └─────────────┘
│ updated_at  │    └─────────────┘
└─────────────┘
```

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Indexes:**
- Primary Key: `id`
- Unique Index: `username`
- Unique Index: `email`

#### Emotions Table
```sql
CREATE TABLE emotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    emotion_type VARCHAR(50) NOT NULL,
    intensity FLOAT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- Primary Key: `id`
- Foreign Key: `user_id` → `users.id`
- Index: `created_at` (for time-based queries)

#### Sessions Table
```sql
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- Primary Key: `id`
- Foreign Key: `user_id` → `users.id`
- Index: `token` (for JWT validation)
- Index: `expires_at` (for cleanup operations)

## API Reference

### Base URL
```
http://localhost:8080/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string",
  "full_name": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `409 Conflict`: Username or email already exists

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid credentials
- `401 Unauthorized`: Authentication failed

### Emotion Endpoints

#### Record Emotion
```http
POST /emotions/record
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "emotion_type": "happy|sad|angry|fear|surprise|disgust|neutral",
  "intensity": 0.85,
  "notes": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Emotion recorded successfully",
  "emotion": {
    "id": 1,
    "emotion_type": "happy",
    "intensity": 0.85,
    "notes": "Great team meeting today!",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Get Emotion History
```http
GET /emotions/history?start_date=2024-01-01&end_date=2024-01-31&limit=50
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "emotions": [
    {
      "id": 1,
      "emotion_type": "happy",
      "intensity": 0.85,
      "notes": "Great team meeting today!",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "pagination": {
    "page": 1,
    "limit": 50,
    "total_pages": 1
  }
}
```

#### Get Team Analytics
```http
GET /emotions/analytics?period=week&team_id=1
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "average_mood": 0.75,
    "stress_level": "low",
    "engagement": "high",
    "emotion_distribution": {
      "happy": 0.4,
      "neutral": 0.3,
      "sad": 0.1,
      "angry": 0.05,
      "fear": 0.05,
      "surprise": 0.05,
      "disgust": 0.05
    },
    "trends": {
      "daily": [...],
      "weekly": [...],
      "monthly": [...]
    }
  }
}
```

### Health Check
```http
GET /ping
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

## Frontend Architecture

### Component Structure

```
Frontend/
├── Pages/
│   ├── Landing (index.html)
│   ├── Authentication (login.html, signup.html)
│   ├── Dashboard (dashboard.html)
│   ├── Emotion Input (emotion-input.html)
│   ├── History (history.html)
│   ├── Feedback (feedback.html)
│   └── Settings (settings.html)
├── Components/
│   ├── Navigation
│   ├── Charts
│   ├── Forms
│   └── Modals
├── Services/
│   ├── AuthService
│   ├── EmotionService
│   ├── DataService
│   └── StorageService
└── Utils/
    ├── Config
    ├── Validators
    └── Helpers
```

### Key JavaScript Modules

#### AuthService (auth.js)
```javascript
class AuthService {
    static async login(username, password) { ... }
    static async register(userData) { ... }
    static logout() { ... }
    static isAuthenticated() { ... }
    static getToken() { ... }
}
```

#### EmotionAnalyzer (emotionAnalyzer.js)
```javascript
class EmotionAnalyzer {
    static async analyzeFacialExpression(videoElement) { ... }
    static async analyzeAudio(audioBlob) { ... }
    static preprocessImage(imageData) { ... }
    static classifyEmotion(predictions) { ... }
}
```

#### Dashboard (dashboard.js)
```javascript
class Dashboard {
    constructor() { ... }
    async initialize() { ... }
    async loadAnalytics() { ... }
    async updateCharts() { ... }
    async loadRecentActivity() { ... }
}
```

### State Management

The application uses a combination of:
- **Local Storage**: For persistent user preferences and session data
- **Session Storage**: For temporary session information
- **DOM State**: For UI component state
- **Server State**: For real-time data synchronization

## AI/ML Implementation

### Facial Expression Analysis

#### Model Architecture
- **Face Detection**: Tiny Face Detector
- **Landmark Detection**: 68-point facial landmarks
- **Expression Recognition**: 7-class emotion classifier

#### Implementation Flow
```javascript
// 1. Load models
await faceapi.loadTinyFaceDetectorModel('/models/');
await faceapi.loadFaceLandmarkTinyModel('/models/');
await faceapi.loadFaceExpressionModel('/models/');

// 2. Detect faces
const detections = await faceapi.detectAllFaces(video, 
    new faceapi.TinyFaceDetectorOptions());

// 3. Extract landmarks
const landmarks = await faceapi.detectFaceLandmarks(video);

// 4. Classify expressions
const expressions = await faceapi.detectFaceExpressions(video);

// 5. Process results
const emotion = this.classifyEmotion(expressions);
```

### Audio Emotion Recognition

#### Model Architecture
- **Input**: Mel-frequency cepstral coefficients (MFCC)
- **Architecture**: Convolutional Neural Network (CNN)
- **Output**: 7-class emotion probabilities

#### Implementation Flow
```javascript
// 1. Audio preprocessing
const audioFeatures = await this.extractMFCC(audioBlob);

// 2. Model inference
const predictions = await this.audioModel.predict(audioFeatures);

// 3. Post-processing
const emotion = this.classifyAudioEmotion(predictions);
```

### Model Training

#### Facial Expression Model
- **Dataset**: FER2013, AffectNet
- **Architecture**: CNN with transfer learning
- **Accuracy**: ~85% on test set

#### Audio Emotion Model
- **Dataset**: RAVDESS, CREMA-D
- **Architecture**: CNN with attention mechanism
- **Accuracy**: ~78% on test set

## Security Implementation

### Authentication & Authorization

#### JWT Implementation
```javascript
// Token generation
const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);

// Token verification
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

#### Password Security
```javascript
// Password hashing
const hashedPassword = await bcrypt.hash(password, 10);

// Password verification
const isValid = await bcrypt.compare(password, hashedPassword);
```

### Data Protection

#### Input Validation
- **Sanitization**: HTML entity encoding
- **Validation**: Schema-based validation
- **Rate Limiting**: Request throttling

#### Data Encryption
- **At Rest**: Database encryption
- **In Transit**: HTTPS/TLS
- **Sensitive Data**: Field-level encryption

### Privacy Controls

#### Data Minimization
- Collect only necessary emotional data
- Anonymize data for analytics
- Implement data retention policies

#### User Consent
- Clear privacy policy
- Granular consent controls
- Right to data deletion

## Deployment Guide

### Development Environment

#### Prerequisites
```bash
# Install Node.js (v14+)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt-get install mysql-server

# Install Git
sudo apt-get install git
```

#### Setup
```bash
# Clone repository
git clone <repository-url>
cd TeamPulse-NTG.1.2

# Install dependencies
npm install

# Setup database
mysql -u root -p < database/init.sql

# Configure environment
cp env.example .env
# Edit .env with your settings

# Start development server
npm run dev
```

### Production Environment

#### Server Requirements
- **CPU**: 2+ cores
- **RAM**: 4GB+
- **Storage**: 20GB+
- **OS**: Ubuntu 20.04 LTS

#### Deployment Steps
```bash
# 1. Server setup
sudo apt update && sudo apt upgrade -y
sudo apt install nginx mysql-server nodejs npm -y

# 2. Application deployment
git clone <repository-url> /var/www/teampulse
cd /var/www/teampulse
npm install --production

# 3. Database setup
mysql -u root -p < database/init.sql

# 4. Environment configuration
cp env.example .env
# Configure production settings

# 5. Process management
sudo npm install -g pm2
pm2 start app.js --name "teampulse"

# 6. Nginx configuration
sudo nano /etc/nginx/sites-available/teampulse
# Add reverse proxy configuration

# 7. SSL certificate
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

#### Environment Variables
```env
# Production settings
NODE_ENV=production
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_USER=teampulse_user
DB_PASSWORD=secure_password
DB_NAME=teampulse_ntg
JWT_SECRET=super_secret_production_key
CORS_ORIGIN=https://yourdomain.com
```

### Monitoring & Logging

#### Application Monitoring
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});
```

#### Error Logging
```javascript
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check MySQL service
sudo systemctl status mysql

# Test connection
mysql -u root -p -e "SHOW DATABASES;"

# Check firewall
sudo ufw status
```

#### Port Conflicts
```bash
# Check port usage
sudo netstat -tulpn | grep :8080

# Kill process using port
sudo kill -9 <PID>
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER /var/www/teampulse
sudo chmod -R 755 /var/www/teampulse
```

### Performance Optimization

#### Database Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_emotions_user_date ON emotions(user_id, created_at);
CREATE INDEX idx_emotions_type_date ON emotions(emotion_type, created_at);

-- Optimize queries
EXPLAIN SELECT * FROM emotions WHERE user_id = ? AND created_at >= ?;
```

#### Frontend Optimization
```javascript
// Lazy load components
const EmotionAnalyzer = lazy(() => import('./emotionAnalyzer.js'));

// Optimize images
<img src="image.jpg" loading="lazy" alt="Description">

// Minify assets
npm run build
```

### Debug Mode

#### Enable Debug Logging
```javascript
// Set debug environment variable
DEBUG=teampulse:* npm start

// Add debug statements
debug('Processing emotion data:', emotionData);
```

#### Browser Developer Tools
```javascript
// Enable console logging
console.log('Debug info:', data);

// Use browser dev tools
// - Network tab for API calls
// - Console for errors
// - Performance for bottlenecks
```

---

*This documentation is maintained by the TeamPulse Development Team. For questions or contributions, please contact the development team.* 