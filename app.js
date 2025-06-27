require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/database');
const authRoutes = require('./routes/auth');
const emotionRoutes = require('./routes/emotion');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/emotions', emotionRoutes);

// Health check
app.get('/api/ping', (req, res) => res.json({ status: 'ok' }));

sequelize.sync().then(() => {
  app.listen(8080, () => console.log('Node.js server running on :8080'));
}); 