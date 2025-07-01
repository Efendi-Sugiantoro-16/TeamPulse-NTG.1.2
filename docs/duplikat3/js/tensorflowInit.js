/**
 * TensorFlow.js Initialization Manager
 * Handles TensorFlow.js backend initialization with proper error handling
 */

class TensorFlowInit {
    constructor() {
        this.isInitialized = false;
        this.currentBackend = null;
        this.initPromise = null;
    }

    /**
     * Initialize TensorFlow.js with proper error handling
     */
    async init() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._doInit();
        return this.initPromise;
    }

    async _doInit() {
        try {
            console.log('Initializing TensorFlow.js...');

            // Check if TensorFlow.js is available
            if (typeof tf === 'undefined') {
                throw new Error('TensorFlow.js not loaded');
            }

            // Wait for TensorFlow.js to be ready
            await this.waitForTensorFlow();

            // Try to initialize backend
            await this.initializeBackend();

            this.isInitialized = true;
            console.log('TensorFlow.js initialized successfully with backend:', this.currentBackend);
            return true;

        } catch (error) {
            console.error('TensorFlow.js initialization failed:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    /**
     * Wait for TensorFlow.js to be fully loaded
     */
    async waitForTensorFlow() {
        return new Promise((resolve, reject) => {
            const maxWaitTime = 10000; // 10 seconds
            const startTime = Date.now();

            const checkTensorFlow = () => {
                if (typeof tf !== 'undefined' && tf.ready) {
                    resolve();
                } else if (Date.now() - startTime > maxWaitTime) {
                    reject(new Error('TensorFlow.js load timeout'));
                } else {
                    setTimeout(checkTensorFlow, 100);
                }
            };

            checkTensorFlow();
        });
    }

    /**
     * Initialize TensorFlow.js backend
     */
    async initializeBackend() {
        const backends = ['webgl', 'cpu'];
        
        for (const backend of backends) {
            try {
                console.log(`Trying ${backend} backend...`);
                
                // Set backend
                await tf.setBackend(backend);
                
                // Wait for backend to be ready
                await tf.ready();
                
                // Test backend with a simple operation
                await this.testBackend(backend);
                
                this.currentBackend = backend;
                console.log(`Backend ${backend} initialized successfully`);
                return;
                
            } catch (error) {
                console.warn(`Backend ${backend} failed:`, error.message);
                continue;
            }
        }
        
        throw new Error('No TensorFlow.js backend available');
    }

    /**
     * Test backend with a simple operation
     */
    async testBackend(backend) {
        try {
            // Create a simple tensor
            const tensor = tf.tensor([1, 2, 3, 4]);
            
            // Perform a simple operation
            const result = tensor.square();
            
            // Get the result
            const data = await result.data();
            
            // Clean up
            tensor.dispose();
            result.dispose();
            
            console.log(`Backend ${backend} test passed`);
            
        } catch (error) {
            throw new Error(`Backend ${backend} test failed: ${error.message}`);
        }
    }

    /**
     * Check if TensorFlow.js is ready
     */
    isReady() {
        return this.isInitialized && typeof tf !== 'undefined';
    }

    /**
     * Get current backend
     */
    getBackend() {
        return this.currentBackend;
    }

    /**
     * Reset initialization
     */
    reset() {
        this.isInitialized = false;
        this.currentBackend = null;
        this.initPromise = null;
    }
}

// Global instance
window.TensorFlowInit = TensorFlowInit; 