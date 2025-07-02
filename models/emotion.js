const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user');

const Emotion = sequelize.define('Emotion', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  emotion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'confidence',
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional JSON data from emotion analysis'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes or comments'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
}, {
  tableName: 'emotions',
  timestamps: false,
  underscored: true
});

Emotion.belongsTo(User, { foreignKey: 'userId' });

module.exports = Emotion; 