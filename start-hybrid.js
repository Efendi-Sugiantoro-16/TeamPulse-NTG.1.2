/**
 * Start Hybrid Storage Server
 * 
 * This script starts the hybrid storage server that provides
 * WebSocket bridge for direct MySQL connection from client-side JavaScript
 */

const HybridStorageServer = require('./systems/server.js');

console.log('🚀 Starting TeamPulse Hybrid Storage Server...');

// Create and start the server
const server = new HybridStorageServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Hybrid Storage Server...');
    await server.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down Hybrid Storage Server...');
    await server.stop();
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
}); 