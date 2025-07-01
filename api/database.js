/**
 * Database API Routes
 * Handles database server management and operations
 */

const express = require('express');
const mysql = require('mysql2/promise');
const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Database server process management
let mysqlProcess = null;
let mysqlConnection = null;

// Database configuration
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'teampulse_db',
    dataDir: './database/data',
    logFile: './database/mysql.log',
    errorLogFile: './database/mysql-error.log',
    pidFile: './database/mysql.pid',
    socketFile: './database/mysql.sock'
};

// Test database connection
router.post('/test', async (req, res) => {
    try {
        const { host, port, database, user, password } = req.body;
        
        const connection = await mysql.createConnection({
            host,
            port,
            user,
            password,
            database
        });
        
        await connection.ping();
        await connection.end();
        
        res.json({ success: true, message: 'Database connection successful' });
    } catch (error) {
        console.error('Database connection test failed:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database connection failed',
            error: error.message 
        });
    }
});

// Execute database query
router.post('/query', async (req, res) => {
    try {
        const { query, params, host, port, database, user, password } = req.body;
        
        const connection = await mysql.createConnection({
            host,
            port,
            user,
            password,
            database
        });
        
        const [rows] = await connection.execute(query, params);
        await connection.end();
        
        res.json({ success: true, rows });
    } catch (error) {
        console.error('Database query failed:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database query failed',
            error: error.message 
        });
    }
});

// Check if MySQL is initialized
router.post('/check-initialized', async (req, res) => {
    try {
        const { dataDir } = req.body;
        
        try {
            await fs.access(dataDir);
            const files = await fs.readdir(dataDir);
            const hasMySQLFiles = files.some(file => 
                file.includes('mysql') || file.includes('ibdata') || file.includes('ib_logfile')
            );
            
            res.json({ initialized: hasMySQLFiles });
        } catch (error) {
            res.json({ initialized: false });
        }
    } catch (error) {
        console.error('Error checking MySQL initialization:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Install MySQL
router.post('/install', async (req, res) => {
    try {
        const { mysqlPath, dataDir, rootPassword } = req.body;
        
        // Create data directory
        await fs.mkdir(dataDir, { recursive: true });
        
        // Initialize MySQL data directory
        const initCommand = `${mysqlPath} --initialize-insecure --user=mysql --datadir=${dataDir}`;
        
        exec(initCommand, (error, stdout, stderr) => {
            if (error) {
                console.error('MySQL initialization failed:', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message 
                });
                return;
            }
            
            console.log('MySQL initialized successfully');
            res.json({ success: true, message: 'MySQL initialized successfully' });
        });
    } catch (error) {
        console.error('Error installing MySQL:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Start MySQL server
router.post('/start', async (req, res) => {
    try {
        const { mysqlPath, dataDir, port, socketFile, logFile, errorLogFile, pidFile } = req.body;
        
        if (mysqlProcess) {
            return res.json({ success: true, message: 'MySQL server already running', pid: mysqlProcess.pid });
        }
        
        // Create log directories
        await fs.mkdir(path.dirname(logFile), { recursive: true });
        await fs.mkdir(path.dirname(errorLogFile), { recursive: true });
        await fs.mkdir(path.dirname(pidFile), { recursive: true });
        
        // Start MySQL server
        const mysqlArgs = [
            '--datadir=' + dataDir,
            '--port=' + port,
            '--socket=' + socketFile,
            '--log-error=' + errorLogFile,
            '--pid-file=' + pidFile,
            '--skip-grant-tables',
            '--skip-networking'
        ];
        
        mysqlProcess = spawn(mysqlPath, mysqlArgs);
        
        mysqlProcess.stdout.on('data', (data) => {
            console.log('MySQL stdout:', data.toString());
        });
        
        mysqlProcess.stderr.on('data', (data) => {
            console.log('MySQL stderr:', data.toString());
        });
        
        mysqlProcess.on('close', (code) => {
            console.log('MySQL process closed with code:', code);
            mysqlProcess = null;
        });
        
        mysqlProcess.on('error', (error) => {
            console.error('MySQL process error:', error);
            mysqlProcess = null;
        });
        
        // Wait a bit for server to start
        setTimeout(() => {
            res.json({ 
                success: true, 
                message: 'MySQL server started',
                pid: mysqlProcess ? mysqlProcess.pid : null
            });
        }, 2000);
        
    } catch (error) {
        console.error('Error starting MySQL server:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Check MySQL server health
router.post('/health', async (req, res) => {
    try {
        const { host, port, socket } = req.body;
        
        if (!mysqlProcess) {
            return res.json({ status: 'stopped' });
        }
        
        // Try to connect to MySQL
        try {
            const connection = await mysql.createConnection({
                host,
                port,
                user: 'root',
                password: '',
                socketPath: socket
            });
            
            await connection.ping();
            await connection.end();
            
            res.json({ status: 'running' });
        } catch (error) {
            res.json({ status: 'starting' });
        }
    } catch (error) {
        console.error('Error checking MySQL health:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Create database
router.post('/create', async (req, res) => {
    try {
        const { host, port, socket, databaseName, rootPassword } = req.body;
        
        const connection = await mysql.createConnection({
            host,
            port,
            user: 'root',
            password: rootPassword || '',
            socketPath: socket
        });
        
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${databaseName}`);
        await connection.end();
        
        res.json({ success: true, message: `Database ${databaseName} created successfully` });
    } catch (error) {
        console.error('Error creating database:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Stop MySQL server
router.post('/stop', async (req, res) => {
    try {
        const { pid, socket } = req.body;
        
        if (!mysqlProcess) {
            return res.json({ success: true, message: 'MySQL server not running' });
        }
        
        // Kill the process
        mysqlProcess.kill('SIGTERM');
        
        // Wait for process to terminate
        setTimeout(() => {
            if (mysqlProcess) {
                mysqlProcess.kill('SIGKILL');
            }
            mysqlProcess = null;
        }, 5000);
        
        res.json({ success: true, message: 'MySQL server stopped' });
    } catch (error) {
        console.error('Error stopping MySQL server:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get MySQL server status
router.post('/status', async (req, res) => {
    try {
        const { pid, socket } = req.body;
        
        if (!mysqlProcess) {
            return res.json({ 
                isRunning: false,
                uptime: 0,
                connections: 0,
                memoryUsage: 0,
                cpuUsage: 0
            });
        }
        
        // Get process info
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        
        // Try to get MySQL status
        try {
            const connection = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: '',
                socketPath: socket
            });
            
            const [rows] = await connection.execute('SHOW STATUS LIKE "Threads_connected"');
            const connections = rows[0] ? parseInt(rows[0].Value) : 0;
            
            await connection.end();
            
            res.json({
                isRunning: true,
                uptime: Math.floor(uptime),
                connections,
                memoryUsage: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                cpuUsage: 0 // Would need additional monitoring for CPU
            });
        } catch (error) {
            res.json({
                isRunning: false,
                uptime: 0,
                connections: 0,
                memoryUsage: 0,
                cpuUsage: 0
            });
        }
    } catch (error) {
        console.error('Error getting MySQL status:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Create database backup
router.post('/backup', async (req, res) => {
    try {
        const { host, port, socket, databaseName, backupDir, rootPassword } = req.body;
        
        // Create backup directory
        await fs.mkdir(backupDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `${databaseName}_${timestamp}.sql`);
        
        // Create backup command
        const backupCommand = `mysqldump --host=${host} --port=${port} --user=root --password=${rootPassword || ''} --socket=${socket} ${databaseName} > ${backupFile}`;
        
        exec(backupCommand, (error, stdout, stderr) => {
            if (error) {
                console.error('Backup failed:', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message 
                });
                return;
            }
            
            res.json({ 
                success: true, 
                message: 'Backup created successfully',
                backupFile 
            });
        });
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Restore database from backup
router.post('/restore', async (req, res) => {
    try {
        const { host, port, socket, databaseName, backupFile, rootPassword } = req.body;
        
        // Check if backup file exists
        try {
            await fs.access(backupFile);
        } catch (error) {
            return res.status(404).json({ 
                success: false, 
                error: 'Backup file not found' 
            });
        }
        
        // Create restore command
        const restoreCommand = `mysql --host=${host} --port=${port} --user=root --password=${rootPassword || ''} --socket=${socket} ${databaseName} < ${backupFile}`;
        
        exec(restoreCommand, (error, stdout, stderr) => {
            if (error) {
                console.error('Restore failed:', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message 
                });
                return;
            }
            
            res.json({ 
                success: true, 
                message: 'Database restored successfully' 
            });
        });
    } catch (error) {
        console.error('Error restoring database:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get MySQL logs
router.post('/logs', async (req, res) => {
    try {
        const { logFile, errorLogFile, lines } = req.body;
        
        let generalLog = '';
        let errorLog = '';
        
        try {
            const generalContent = await fs.readFile(logFile, 'utf8');
            const generalLines = generalContent.split('\n').slice(-lines).join('\n');
            generalLog = generalLines;
        } catch (error) {
            generalLog = 'Log file not found or empty';
        }
        
        try {
            const errorContent = await fs.readFile(errorLogFile, 'utf8');
            const errorLines = errorContent.split('\n').slice(-lines).join('\n');
            errorLog = errorLines;
        } catch (error) {
            errorLog = 'Error log file not found or empty';
        }
        
        res.json({
            success: true,
            general: generalLog,
            error: errorLog
        });
    } catch (error) {
        console.error('Error getting logs:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;
