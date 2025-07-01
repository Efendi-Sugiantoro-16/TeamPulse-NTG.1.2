/**
 * Database Server Manager
 * Manages MySQL database server using JavaScript
 * Can run automatically without external dependencies
 */

class DatabaseServer {
    constructor() {
        this.server = null;
        this.connection = null;
        this.isRunning = false;
        this.port = 3306;
        this.host = 'localhost';
        this.processId = null;
        
        this.config = {
            mysqlPath: 'mysql',
            dataDir: './database/data',
            logFile: './database/mysql.log',
            errorLogFile: './database/mysql-error.log',
            pidFile: './database/mysql.pid',
            socketFile: './database/mysql.sock',
            port: 3306,
            rootPassword: '',
            autoStart: true,
            autoCreateDatabase: true,
            databaseName: 'teampulse_db'
        };
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Database Server...');
            
            // Load configuration
            await this.loadConfig();
            
            // Create necessary directories
            await this.createDirectories();
            
            // Initialize MySQL if needed
            await this.initializeMySQL();
            
            // Start server if auto-start is enabled
            if (this.config.autoStart) {
                await this.start();
            }
            
            console.log('Database Server initialized successfully');
        } catch (error) {
            console.error('Error initializing Database Server:', error);
        }
    }

    async loadConfig() {
        try {
            const savedConfig = localStorage.getItem('databaseServerConfig');
            if (savedConfig) {
                this.config = { ...this.config, ...JSON.parse(savedConfig) };
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    async saveConfig() {
        try {
            localStorage.setItem('databaseServerConfig', JSON.stringify(this.config));
        } catch (error) {
            console.error('Error saving config:', error);
        }
    }

    async createDirectories() {
        try {
            const directories = [
                this.config.dataDir,
                './database/logs',
                './database/temp',
                './database/backup'
            ];

            for (const dir of directories) {
                await this.createDirectory(dir);
            }
        } catch (error) {
            console.error('Error creating directories:', error);
        }
    }

    async createDirectory(path) {
        try {
            // This would typically use Node.js fs module
            // For now, we'll simulate directory creation
            console.log(`Creating directory: ${path}`);
        } catch (error) {
            console.error(`Error creating directory ${path}:`, error);
        }
    }

    async initializeMySQL() {
        try {
            console.log('Initializing MySQL...');
            
            // Check if MySQL is already initialized
            const isInitialized = await this.checkMySQLInitialized();
            
            if (!isInitialized) {
                await this.runMySQLInstall();
            }
            
            console.log('MySQL initialization completed');
        } catch (error) {
            console.error('Error initializing MySQL:', error);
            throw error;
        }
    }

    async checkMySQLInitialized() {
        try {
            // Check if data directory exists and has MySQL files
            const response = await fetch('/api/database/check-initialized', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dataDir: this.config.dataDir
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.initialized;
            }
            
            return false;
        } catch (error) {
            console.error('Error checking MySQL initialization:', error);
            return false;
        }
    }

    async runMySQLInstall() {
        try {
            console.log('Running MySQL installation...');
            
            const response = await fetch('/api/database/install', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mysqlPath: this.config.mysqlPath,
                    dataDir: this.config.dataDir,
                    rootPassword: this.config.rootPassword
                })
            });
            
            if (!response.ok) {
                throw new Error('MySQL installation failed');
            }
            
            const result = await response.json();
            console.log('MySQL installation completed:', result);
        } catch (error) {
            console.error('Error running MySQL installation:', error);
            throw error;
        }
    }

    async start() {
        try {
            if (this.isRunning) {
                console.log('Database server is already running');
                return;
            }

            console.log('Starting MySQL database server...');
            
            // Start MySQL server process
            this.server = await this.startMySQLProcess();
            
            // Wait for server to be ready
            await this.waitForServer();
            
            // Create database if needed
            if (this.config.autoCreateDatabase) {
                await this.createDatabase();
            }
            
            this.isRunning = true;
            console.log('MySQL database server started successfully');
            
            // Start health monitoring
            this.startHealthMonitoring();
            
        } catch (error) {
            console.error('Error starting database server:', error);
            throw error;
        }
    }

    async startMySQLProcess() {
        try {
            const response = await fetch('/api/database/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mysqlPath: this.config.mysqlPath,
                    dataDir: this.config.dataDir,
                    port: this.config.port,
                    socketFile: this.config.socketFile,
                    logFile: this.config.logFile,
                    errorLogFile: this.config.errorLogFile,
                    pidFile: this.config.pidFile
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to start MySQL server');
            }
            
            const result = await response.json();
            this.processId = result.pid;
            
            return {
                pid: result.pid,
                status: 'running',
                port: this.config.port,
                socket: this.config.socketFile
            };
        } catch (error) {
            console.error('Error starting MySQL process:', error);
            throw error;
        }
    }

    async waitForServer() {
        return new Promise((resolve, reject) => {
            const maxAttempts = 30;
            let attempts = 0;
            
            const checkServer = async () => {
                try {
                    attempts++;
                    
                    const response = await fetch('/api/database/health', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            host: this.host,
                            port: this.config.port,
                            socket: this.config.socketFile
                        })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (result.status === 'running') {
                            resolve();
                            return;
                        }
                    }
                    
                    if (attempts >= maxAttempts) {
                        reject(new Error('Database server failed to start within timeout'));
                        return;
                    }
                    
                    setTimeout(checkServer, 2000);
                } catch (error) {
                    if (attempts >= maxAttempts) {
                        reject(error);
                        return;
                    }
                    setTimeout(checkServer, 2000);
                }
            };
            
            checkServer();
        });
    }

    async createDatabase() {
        try {
            console.log(`Creating database: ${this.config.databaseName}`);
            
            const response = await fetch('/api/database/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    host: this.host,
                    port: this.config.port,
                    socket: this.config.socketFile,
                    databaseName: this.config.databaseName,
                    rootPassword: this.config.rootPassword
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create database');
            }
            
            const result = await response.json();
            console.log('Database created successfully:', result);
        } catch (error) {
            console.error('Error creating database:', error);
            throw error;
        }
    }

    async stop() {
        try {
            if (!this.isRunning) {
                console.log('Database server is not running');
                return;
            }

            console.log('Stopping MySQL database server...');
            
            const response = await fetch('/api/database/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pid: this.processId,
                    socket: this.config.socketFile
                })
            });
            
            if (response.ok) {
                this.isRunning = false;
                this.server = null;
                this.processId = null;
                console.log('MySQL database server stopped successfully');
            } else {
                throw new Error('Failed to stop database server');
            }
        } catch (error) {
            console.error('Error stopping database server:', error);
            throw error;
        }
    }

    async restart() {
        try {
            console.log('Restarting MySQL database server...');
            await this.stop();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.start();
            console.log('MySQL database server restarted successfully');
        } catch (error) {
            console.error('Error restarting database server:', error);
            throw error;
        }
    }

    async getStatus() {
        try {
            const response = await fetch('/api/database/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pid: this.processId,
                    socket: this.config.socketFile
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                return {
                    isRunning: this.isRunning,
                    pid: this.processId,
                    port: this.config.port,
                    socket: this.config.socketFile,
                    uptime: result.uptime,
                    connections: result.connections,
                    memoryUsage: result.memoryUsage,
                    cpuUsage: result.cpuUsage
                };
            }
            
            return {
                isRunning: false,
                error: 'Failed to get status'
            };
        } catch (error) {
            console.error('Error getting database status:', error);
            return {
                isRunning: false,
                error: error.message
            };
        }
    }

    startHealthMonitoring() {
        // Monitor database health every 30 seconds
        this.healthInterval = setInterval(async () => {
            try {
                const status = await this.getStatus();
                
                if (!status.isRunning && this.isRunning) {
                    console.warn('Database server appears to have stopped, attempting restart...');
                    await this.restart();
                }
                
                // Log health metrics
                if (status.isRunning) {
                    console.log('Database health check:', {
                        uptime: status.uptime,
                        connections: status.connections,
                        memoryUsage: status.memoryUsage
                    });
                }
            } catch (error) {
                console.error('Error during health monitoring:', error);
            }
        }, 30000);
    }

    async backup() {
        try {
            console.log('Creating database backup...');
            
            const response = await fetch('/api/database/backup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    host: this.host,
                    port: this.config.port,
                    socket: this.config.socketFile,
                    databaseName: this.config.databaseName,
                    backupDir: './database/backup',
                    rootPassword: this.config.rootPassword
                })
            });
            
            if (!response.ok) {
                throw new Error('Backup failed');
            }
            
            const result = await response.json();
            console.log('Database backup completed:', result);
            return result;
        } catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    }

    async restore(backupFile) {
        try {
            console.log('Restoring database from backup...');
            
            const response = await fetch('/api/database/restore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    host: this.host,
                    port: this.config.port,
                    socket: this.config.socketFile,
                    databaseName: this.config.databaseName,
                    backupFile: backupFile,
                    rootPassword: this.config.rootPassword
                })
            });
            
            if (!response.ok) {
                throw new Error('Restore failed');
            }
            
            const result = await response.json();
            console.log('Database restore completed:', result);
            return result;
        } catch (error) {
            console.error('Error restoring database:', error);
            throw error;
        }
    }

    async getLogs(lines = 100) {
        try {
            const response = await fetch('/api/database/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    logFile: this.config.logFile,
                    errorLogFile: this.config.errorLogFile,
                    lines: lines
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                return {
                    general: result.general,
                    error: result.error
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error getting logs:', error);
            return null;
        }
    }

    // Configuration methods
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
    }

    getConfig() {
        return { ...this.config };
    }

    // Cleanup
    async cleanup() {
        try {
            if (this.healthInterval) {
                clearInterval(this.healthInterval);
            }
            
            if (this.isRunning) {
                await this.stop();
            }
            
            console.log('Database Server cleaned up');
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

// Initialize database server when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.databaseServer = new DatabaseServer();
});

// Export for use in other modules
window.DatabaseServer = DatabaseServer;
