# TeamPulse Hybrid Storage System

## Overview

The TeamPulse Hybrid Storage System provides **direct MySQL connection from client-side JavaScript** through a WebSocket bridge, eliminating the need for REST API calls. This system allows real-time database operations directly from the browser.

## Architecture

```
┌─────────────────┐    WebSocket    ┌──────────────────┐    MySQL    ┌─────────────┐
│   Browser JS    │ ◄─────────────► │  Hybrid Storage  │ ◄─────────► │ MySQL Server│
│                 │                 │     Server       │             │             │
│ - hybridStorage │                 │ - WebSocket      │             │ - Database  │
│ - Real-time     │                 │ - MySQL Pool     │             │ - Tables    │
│ - Direct DB     │                 │ - Bridge Logic   │             │ - Data      │
└─────────────────┘                 └──────────────────┘             └─────────────┘
```

## Features

- ✅ **Direct MySQL Connection**: Client-side JS connects directly to MySQL via WebSocket
- ✅ **Real-time Operations**: Instant database operations without HTTP overhead
- ✅ **Automatic Reconnection**: Handles connection drops gracefully
- ✅ **Authentication Support**: Optional token-based authentication
- ✅ **Transaction Support**: Multi-operation transactions
- ✅ **Error Handling**: Comprehensive error handling and recovery
- ✅ **Performance Optimized**: Connection pooling and efficient queries

## Quick Start

### 1. Install Dependencies

```bash
npm install ws mysql2
```

### 2. Initialize Database

```bash
node scripts/init-hybrid-db.js
```

### 3. Start Hybrid Storage Server

```bash
node start-hybrid.js
```

### 4. Use in Browser

```javascript
// The hybrid storage client is automatically available
// as window.HybridStorage

// Save emotion data
const result = await window.HybridStorage.saveEmotion({
    user_id: 'user123',
    emotion_type: 'happy',
    confidence_level: 85.5,
    source: 'face_analysis',
    data: {
        face_confidence: 85.5,
        voice_confidence: 0,
        text_confidence: 0
    },
    notes: 'Detected from camera'
});

// Get emotions
const emotions = await window.HybridStorage.getEmotions(50, 0);
```

## Configuration

### Environment Variables

```bash
# Server Configuration
HYBRID_SERVER_PORT=3001
HYBRID_SERVER_HOST=localhost

# MySQL Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=teampulse
DB_PORT=3306

# Security Configuration
HYBRID_ENABLE_AUTH=false
SECRET_KEY=your_secret_key
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
```

### Client Configuration

```javascript
// Custom configuration
window.HybridStorage = new HybridStorageClient({
    serverUrl: 'ws://localhost:3001/hybrid-storage',
    autoReconnect: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    timeout: 30000,
    enableAuth: false,
    token: 'your_auth_token'
});
```

## API Reference

### Connection Management

```javascript
// Connect to server
await window.HybridStorage.connect();

// Disconnect
window.HybridStorage.disconnect();

// Check status
const status = window.HybridStorage.getStatus();
console.log(status);
// {
//   isConnected: true,
//   isAuthenticated: false,
//   clientId: "uuid",
//   reconnectAttempts: 0,
//   pendingRequests: 0
// }

// Ping server
await window.HybridStorage.ping();
```

### Database Operations

#### Raw SQL Query

```javascript
const result = await window.HybridStorage.query(
    'SELECT * FROM emotions WHERE user_id = ? AND emotion_type = ?',
    ['user123', 'happy']
);
```

#### Insert Data

```javascript
const result = await window.HybridStorage.insert('emotions', {
    user_id: 'user123',
    emotion_type: 'happy',
    confidence_level: 85.5,
    source: 'face_analysis',
    data: JSON.stringify({ confidence: 85.5 }),
    notes: 'Detected from camera'
});

console.log(result.insertId); // New record ID
```

#### Update Data

```javascript
const result = await window.HybridStorage.update(
    'emotions',
    { confidence_level: 90.0, notes: 'Updated confidence' },
    { id: 123 }
);

console.log(result.affectedRows); // Number of updated rows
```

#### Delete Data

```javascript
const result = await window.HybridStorage.delete('emotions', { id: 123 });
console.log(result.affectedRows); // Number of deleted rows
```

#### Select Data

```javascript
// Select all columns
const emotions = await window.HybridStorage.select('emotions');

// Select specific columns
const emotions = await window.HybridStorage.select(
    'emotions',
    'id, emotion_type, confidence_level',
    { user_id: 'user123' },
    10, // limit
    0   // offset
);
```

#### Transactions

```javascript
const result = await window.HybridStorage.transaction([
    {
        action: 'insert',
        table: 'emotions',
        data: {
            user_id: 'user123',
            emotion_type: 'happy',
            confidence_level: 85.5
        }
    },
    {
        action: 'insert',
        table: 'analytics',
        data: {
            user_id: 'user123',
            type: 'emotion_recorded',
            data: JSON.stringify({ emotion: 'happy' })
        }
    }
]);
```

### Convenience Methods

#### Emotion Operations

```javascript
// Save emotion
await window.HybridStorage.saveEmotion({
    user_id: 'user123',
    emotion_type: 'happy',
    confidence_level: 85.5,
    source: 'face_analysis',
    data: { confidence: 85.5 },
    notes: 'Detected from camera'
});

// Get emotions
const emotions = await window.HybridStorage.getEmotions(100, 0);

// Get emotions by user
const userEmotions = await window.HybridStorage.getEmotionsByUser('user123', 50, 0);

// Get emotions by date range
const rangeEmotions = await window.HybridStorage.getEmotionsByDateRange(
    '2024-01-01',
    '2024-01-31',
    100,
    0
);

// Update emotion
await window.HybridStorage.updateEmotion(123, {
    confidence_level: 90.0,
    notes: 'Updated confidence'
});

// Delete emotion
await window.HybridStorage.deleteEmotion(123);
```

#### Analytics Operations

```javascript
// Get emotion statistics
const stats = await window.HybridStorage.getEmotionStats('user123', {
    start: '2024-01-01',
    end: '2024-01-31'
});

// Get daily emotion trends
const trends = await window.HybridStorage.getDailyEmotionTrend('user123', 30);

// Export data
const jsonData = await window.HybridStorage.exportData('user123', 'json');
const csvData = await window.HybridStorage.exportData('user123', 'csv');
```

### Event Handling

```javascript
// Listen for connection events
window.HybridStorage.on('connected', (data) => {
    console.log('Connected to hybrid storage server:', data);
});

window.HybridStorage.on('disconnected', () => {
    console.log('Disconnected from hybrid storage server');
});

window.HybridStorage.on('authenticated', (data) => {
    console.log('Authenticated:', data);
});

window.HybridStorage.on('error', (error) => {
    console.error('Hybrid storage error:', error);
});
```

## Database Schema

### Emotions Table

```sql
CREATE TABLE emotions (
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
);
```

### Users Table

```sql
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Analytics Table

```sql
CREATE TABLE analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security

### Authentication

The hybrid storage system supports optional token-based authentication:

```javascript
// Enable authentication
window.HybridStorage = new HybridStorageClient({
    enableAuth: true,
    token: 'your_jwt_token'
});

// Authenticate after connection
await window.HybridStorage.authenticate('your_jwt_token');
```

### CORS Configuration

```javascript
// In config/hybrid-storage.js
security: {
    cors: {
        origin: 'http://localhost:3000', // Your frontend URL
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        headers: ['Content-Type', 'Authorization']
    }
}
```

## Error Handling

```javascript
try {
    const result = await window.HybridStorage.saveEmotion(emotionData);
    console.log('Emotion saved:', result);
} catch (error) {
    if (error.message.includes('Not connected')) {
        console.error('Not connected to hybrid storage server');
        await window.HybridStorage.connect();
    } else if (error.message.includes('Authentication required')) {
        console.error('Authentication required');
        await window.HybridStorage.authenticate(token);
    } else {
        console.error('Database operation failed:', error);
    }
}
```

## Performance Optimization

### Connection Pooling

The server uses MySQL connection pooling for optimal performance:

```javascript
// In config/hybrid-storage.js
mysql: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
}
```

### Query Optimization

- Use indexes on frequently queried columns
- Limit result sets with LIMIT and OFFSET
- Use specific column selection instead of SELECT *
- Implement proper WHERE clauses

## Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "connections": 5,
    "mysql": "connected"
}
```

### Server Status

```bash
curl http://localhost:3001/status
```

Response:
```json
{
    "server": "Hybrid Storage Server",
    "version": "1.0.0",
    "status": "running",
    "port": 3001,
    "connections": 5,
    "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if MySQL server is running
   - Verify database credentials
   - Check firewall settings

2. **WebSocket Connection Failed**
   - Ensure hybrid storage server is running
   - Check port availability
   - Verify WebSocket URL

3. **Authentication Failed**
   - Check token validity
   - Verify authentication is enabled
   - Check token expiration

4. **Database Operation Failed**
   - Check table existence
   - Verify column names and types
   - Check SQL syntax

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug node start-hybrid.js
```

### Logs

Check server logs for detailed error information:

```bash
tail -f logs/hybrid-storage.log
```

## Integration Examples

### Emotion Input Integration

```javascript
// In emotion-input.js
class EmotionInput {
    async saveEmotion(emotionData) {
        try {
            const result = await window.HybridStorage.saveEmotion({
                user_id: this.currentUser.id,
                emotion_type: emotionData.type,
                confidence_level: emotionData.confidence,
                source: emotionData.source,
                data: JSON.stringify(emotionData.analysis),
                notes: emotionData.notes
            });
            
            console.log('Emotion saved with ID:', result.insertId);
            return result;
        } catch (error) {
            console.error('Failed to save emotion:', error);
            throw error;
        }
    }
}
```

### Dashboard Integration

```javascript
// In dashboard.js
class Dashboard {
    async loadEmotionStats() {
        try {
            const stats = await window.HybridStorage.getEmotionStats(
                this.currentUser.id,
                {
                    start: this.dateRange.start,
                    end: this.dateRange.end
                }
            );
            
            this.updateCharts(stats);
        } catch (error) {
            console.error('Failed to load emotion stats:', error);
        }
    }
}
```

## Migration from REST API

If you're migrating from REST API to hybrid storage:

1. **Replace fetch calls with hybrid storage methods**
2. **Update error handling for WebSocket-specific errors**
3. **Implement connection management**
4. **Update authentication flow**

Example migration:

```javascript
// Before (REST API)
const response = await fetch('/api/emotions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emotionData)
});
const result = await response.json();

// After (Hybrid Storage)
const result = await window.HybridStorage.saveEmotion(emotionData);
```

## Best Practices

1. **Always handle connection errors**
2. **Implement proper reconnection logic**
3. **Use transactions for related operations**
4. **Validate data before database operations**
5. **Implement proper error boundaries**
6. **Monitor connection status**
7. **Use appropriate indexes for performance**
8. **Implement proper authentication**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
