/**
 * Hybrid Storage Initialization
 * Properly initializes the hybrid storage system with user feedback
 */

class HybridStorageInitializer {
    constructor() {
        this.storage = null;
        this.isInitialized = false;
        this.initPromise = null;
    }

    async initialize() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._doInitialize();
        return this.initPromise;
    }

    async _doInitialize() {
        try {
            console.log('🚀 Initializing Hybrid Storage System...');
            
            // Create hybrid storage instance
            this.storage = new HybridStorage();
            
            // Initialize with proper error handling
            await this.storage.init();
            
            // Make it globally available
            window.hybridStorage = this.storage;
            
            this.isInitialized = true;
            
            console.log('✅ Hybrid Storage initialized successfully');
            console.log('📊 Storage Mode:', this.storage.storageMode);
            console.log('🌐 Database Available:', this.storage.isDatabaseAvailable());
            
            // Show user feedback
            this.showStorageStatus();
            
            // Trigger custom event for other components
            window.dispatchEvent(new CustomEvent('hybridStorageReady', { 
                detail: { 
                    storage: this.storage,
                    mode: this.storage.storageMode,
                    dbAvailable: this.storage.isDatabaseAvailable()
                } 
            }));
            
            return this.storage;
            
        } catch (error) {
            console.error('❌ Failed to initialize Hybrid Storage:', error);
            
            // Create fallback storage
            this.storage = new HybridStorage();
            this.storage.storageMode = 'local';
            window.hybridStorage = this.storage;
            
            this.showError('Failed to initialize storage system. Using local mode only.');
            
            return this.storage;
        }
    }

    showStorageStatus() {
        const status = this.storage.storageMode;
        const dbAvailable = this.storage.isDatabaseAvailable();
        
        let message = `Storage initialized: ${status}`;
        let type = 'info';
        
        if (status === 'database' && dbAvailable) {
            message = '✅ Connected to database server';
            type = 'success';
        } else if (status === 'database' && !dbAvailable) {
            message = '⚠️ Database mode selected but server unavailable. Using local storage.';
            type = 'warning';
        } else {
            message = '📱 Using local storage mode';
            type = 'info';
        }
        
        this.showMessage(message, type);
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `storage-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <span class="notification-text">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : type === 'warning' ? '#ffeaa7' : '#bee5eb'};
            border-radius: 4px;
            padding: 12px 16px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .storage-notification .notification-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .storage-notification .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                margin-left: auto;
                opacity: 0.7;
            }
            .storage-notification .notification-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getStorage() {
        return this.storage;
    }

    isReady() {
        return this.isInitialized && this.storage !== null;
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.hybridStorageInitializer = new HybridStorageInitializer();
    window.hybridStorageInitializer.initialize();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HybridStorageInitializer;
} 