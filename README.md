# TeamPulse-NTG.1.2
RPL 2 PROJECT D4TI ULBI

<div align="center">
  <img src="images/logo.jpg" alt="TeamPulse Logo" width="200">
  <h3>Your Team's Emotional Radar</h3>
  <p>Track, understand, and improve your team's emotional well-being in real-time</p>
</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

TeamPulse-NTG.1.2 is an advanced team emotional intelligence platform that combines AI-powered emotion detection with real-time analytics to help organizations understand and improve their team's emotional well-being. The system uses facial expression analysis and audio emotion recognition to provide insights into team dynamics, stress levels, and overall workplace satisfaction.

### Key Benefits

- **Real-time Emotion Tracking**: Monitor team emotions using AI-powered facial and audio analysis
- **Conflict Prevention**: Early warning system to identify potential team conflicts
- **Data-Driven Insights**: Comprehensive analytics and reporting for informed decision-making
- **Privacy-First Approach**: Secure handling of sensitive emotional data
- **User-Friendly Interface**: Intuitive dashboard for easy monitoring and management

## ✨ Features

### 🎭 Emotion Detection
- **Facial Expression Analysis**: Real-time emotion detection using face-api.js
- **Audio Emotion Recognition**: Voice-based emotion analysis using TensorFlow.js
- **Multi-modal Input**: Support for both camera and microphone inputs
- **Emotion Classification**: Detects 7 basic emotions (Happy, Sad, Angry, Fear, Surprise, Disgust, Neutral)

### 📊 Analytics & Reporting
- **Real-time Dashboard**: Live monitoring of team emotional states
- **Historical Analysis**: Track emotional trends over time
- **Team Insights**: Identify patterns and correlations in team dynamics
- **Custom Reports**: Generate detailed reports for stakeholders

### 🔔 Smart Notifications
- **Alert System**: Automated notifications for concerning emotional patterns
- **Conflict Detection**: Early warning for potential team conflicts
- **Engagement Monitoring**: Track team engagement levels

### 🔐 Security & Privacy
- **JWT Authentication**: Secure user authentication and session management
- **Data Encryption**: Encrypted storage of sensitive emotional data
- **Privacy Controls**: User-controlled data sharing and visibility

## 🛠 Technology Stack

### Frontend
- **HTML5/CSS3**: Modern, responsive web interface
- **JavaScript (ES6+)**: Dynamic client-side functionality
- **TensorFlow.js**: AI-powered emotion detection
- **Face-api.js**: Facial expression analysis
- **Chart.js**: Data visualization and analytics

### Backend
- **Node.js**: Server-side runtime environment
- **Express.js**: Web application framework
- **MySQL**: Relational database management
- **Sequelize**: Object-Relational Mapping (ORM)
- **JWT**: JSON Web Token authentication

### AI/ML
- **TensorFlow.js**: Machine learning framework
- **Face-api.js**: Pre-trained facial recognition models
- **Custom Audio Models**: Emotion detection from voice

### Development Tools
- **Nodemon**: Development server with auto-reload
- **bcryptjs**: Password hashing
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management

## 🚀 Installation

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- Modern web browser with camera/microphone support

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/TeamPulse-NTG.1.2.git
cd TeamPulse-NTG.1.2
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE teampulse_ntg;
```

2. Run the initialization script:
```bash
mysql -u root -p teampulse_ntg < database/init.sql
```

### Step 4: Environment Configuration

1. Copy the environment template:
```bash
cp env.example .env
```

2. Edit `.env` with your configuration:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=teampulse_ntg

# Server Configuration
PORT=8080

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Environment
ENV=development
```

### Step 5: Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:8080`

## ⚙️ Configuration

### Database Configuration

The application uses MySQL with the following default settings:
- **Host**: localhost
- **Port**: 3306
- **Database**: teampulse_ntg
- **Character Set**: utf8mb4

### Security Settings

- **JWT Secret**: Change the default JWT secret in production
- **Password Hashing**: Uses bcrypt with salt rounds of 10
- **Session Management**: JWT-based authentication with configurable expiration

### AI Model Configuration

- **Face Detection**: Uses Tiny Face Detector model
- **Facial Landmarks**: 68-point facial landmark detection
- **Expression Recognition**: 7-class emotion classification
- **Audio Processing**: Real-time audio emotion analysis

## 📖 Usage

### Getting Started

1. **Registration**: Create a new account at `/signup.html`
2. **Login**: Access your dashboard at `/login.html`
3. **Dashboard**: View team analytics at `/dashboard.html`
4. **Emotion Input**: Record emotions at `/emotion-input.html`

### Dashboard Features

- **Team Overview**: Real-time team mood statistics
- **Emotion Charts**: Visual representation of emotional trends
- **Insights**: AI-generated insights about team dynamics
- **Alerts**: Notifications for concerning patterns

### Emotion Recording

1. Navigate to the Emotion Input page
2. Grant camera/microphone permissions
3. Choose input method (facial or audio)

## 🎥 Emotion Input System

The Emotion Input System is a comprehensive AI-powered emotion analysis tool that provides three main analysis methods:

### Camera Analysis
- **Real-time Facial Detection**: Uses face-api.js for instant emotion recognition
- **7 Emotion Categories**: Happy, sad, angry, excited, fearful, surprised, neutral, confused
- **Confidence Scoring**: Each detection includes a confidence percentage
- **Snapshot Capture**: Save specific moments for later analysis

### Voice Analysis  
- **Real-time Voice Monitoring**: Continuous audio level and pattern analysis
- **Spectrogram Visualization**: Visual representation of voice patterns
- **Voice Quality Assessment**: Automatic quality evaluation
- **Audio Recording**: Save voice clips for detailed analysis

### Text Analysis
- **AI Sentiment Analysis**: Advanced text emotion classification
- **Keyword Extraction**: Identify emotional keywords in text
- **Confidence Scoring**: Reliability metrics for each analysis
- **Multi-language Support**: Analyze text in various languages

### Data Management
- **Hybrid Storage**: Choose between local browser storage or MySQL database
- **Offline Support**: Automatic data queuing when database is unavailable
- **Export Functionality**: Download data in JSON or CSV format with filtering
- **Real-time History**: View recent analysis results

### Quick Start for Emotion Input

1. **Start Local Server**:
   ```bash
   # Windows
   start-server.bat
   
   # Linux/Mac  
   ./start-server.sh
   
   # Manual
   python -m http.server 8000
   ```

2. **Access Application**:
   ```
   http://localhost:8000/emotion-input.html
   ```

3. **Grant Permissions**: Allow camera and microphone access

4. **Choose Analysis Method**:
   - Click "Camera Analysis" for facial detection
   - Click "Voice Analysis" for audio processing  
   - Click "AI Text Analysis" for text sentiment

5. **Monitor Results**: View real-time emotion detection and confidence scores

6. **Save Data**: Use "Submit Data" to save analysis results

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
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

#### POST `/api/auth/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword"
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

### Emotion Endpoints

#### POST `/api/emotions/record`
Record a new emotion entry.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "emotion_type": "happy",
  "intensity": 0.85,
  "notes": "Great team meeting today!"
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

#### GET `/api/emotions/history`
Retrieve emotion history for the authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `start_date`: Start date for filtering (YYYY-MM-DD)
- `end_date`: End date for filtering (YYYY-MM-DD)
- `limit`: Number of records to return (default: 50)

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
  "total": 1
}
```

## 📁 Project Structure

```
TeamPulse-NTG.1.2/
├── api/                    # API endpoints and controllers
│   ├── auth/              # Authentication controllers
│   ├── controllers/       # Business logic controllers
│   └── emotions/          # Emotion-related controllers
├── config/                # Configuration files
│   └── database.js        # Database configuration
├── controllers/           # Additional controllers
├── css/                   # Stylesheets
│   ├── auth.css          # Authentication page styles
│   ├── dashboard.css     # Dashboard styles
│   ├── history.css       # History page styles
│   └── style.css         # Global styles
├── database/              # Database files
│   └── init.sql          # Database initialization script
├── docs/                  # Documentation
│   └── workflow.png      # System workflow diagram
├── images/                # Static images
│   ├── hero-image.jpg    # Landing page hero image
│   └── logo.jpg          # Application logo
├── js/                    # JavaScript files
│   ├── auth.js           # Authentication logic
│   ├── config.js         # Client-side configuration
│   ├── dashboard.js      # Dashboard functionality
│   ├── data-services.js  # Data service layer
│   ├── dataStorage.js    # Local storage management
│   ├── emotion-input.js  # Emotion input handling
│   ├── emotionAnalyzer.js # AI emotion analysis
│   ├── feedback.js       # Feedback system
│   ├── history.js        # History page logic
│   ├── interventionBot.js # Intervention system
│   ├── main.js           # Main application logic
│   └── settings.js       # Settings management
├── middleware/            # Express middleware
│   └── auth.js           # Authentication middleware
├── models/                # Data models
│   ├── audio_emotion_model/ # Audio emotion detection model
│   ├── emotion.js        # Emotion model
│   ├── user.js           # User model
│   └── face_expression_model-* # Facial expression models
├── routes/                # API routes
│   ├── auth.js           # Authentication routes
│   └── emotion.js        # Emotion routes
├── app.js                 # Main application file
├── package.json           # Node.js dependencies
├── env.example           # Environment variables template
├── train_audio_model.py  # Audio model training script
└── HTML files            # Frontend pages
    ├── index.html        # Landing page
    ├── login.html        # Login page
    ├── signup.html       # Registration page
    ├── dashboard.html    # Main dashboard
    ├── emotion-input.html # Emotion recording page
    ├── history.html      # History view
    ├── feedback.html     # Feedback system
    ├── settings.html     # User settings
    └── testkamera.html   # Camera testing page
```

## 🤝 Contributing

We welcome contributions to TeamPulse-NTG.1.2! Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Follow JavaScript ES6+ standards
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure proper error handling
- Write unit tests for new features

### Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**TeamPulse-NTG.1.2** is developed by the D4TI ULBI team as part of the RPL 2 project.

### Contact

- **Project Repository**: [GitHub Repository URL]
- **Documentation**: [Documentation URL]
- **Support**: [Support Email]

---

<div align="center">
  <p>Made with ❤️ by TeamPulse Development Team</p>
  <p>© 2025 TeamPulse By Efendi & JombloKurangTuru.com. All rights reserved.</p>
</div>
