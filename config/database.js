const { Sequelize } = require('sequelize');

// Database configuration with fallbacks
const dbConfig = {
    database: process.env.DB_NAME || 'teampulse_db',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    retry: {
        max: 3,
        timeout: 10000
    }
};

const sequelize = new Sequelize(dbConfig);

// Test connection function
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection has been established successfully.');
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error.message);
        return false;
    }
};

module.exports = { 
    sequelize, 
    testConnection,
    dbConfig 
}; 