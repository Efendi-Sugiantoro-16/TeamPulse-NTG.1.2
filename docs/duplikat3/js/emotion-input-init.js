// emotion-input-init.js
// Inisialisasi dan helper untuk emotion-input.html agar mudah maintenance

// Function to check if all dependencies are loaded
function checkDependencies() {
    const requiredDeps = [
        'DataManager', 
        'UIManager', 
        'CameraManager', 
        'AudioManager', 
        'TextAnalyzer', 
        'EmotionController'
    ];
    const missingDeps = [];
    const loadedDeps = [];
    for (const dep of requiredDeps) {
        if (typeof window[dep] === 'undefined') {
            missingDeps.push(dep);
        } else {
            loadedDeps.push(dep);
        }
    }
    console.log('Loaded dependencies:', loadedDeps);
    console.log('Missing dependencies:', missingDeps);
    return {
        allLoaded: missingDeps.length === 0,
        missing: missingDeps,
        loaded: loadedDeps
    };
}

// Function to wait for dependencies to load
function waitForDependencies() {
    return new Promise((resolve) => {
        const check = () => {
            const result = checkDependencies();
            if (result.allLoaded) {
                resolve(result);
            } else {
                setTimeout(check, 200);
            }
        };
        check();
    });
}

// Inisialisasi controller dan mode penyimpanan setelah DOM siap
// (Panggil EmotionController dari global window)
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('=== Emotion Input System Initialization ===');
        console.log('DOM loaded, checking dependencies...');
        // Initial dependency check
        const initialCheck = checkDependencies();
        console.log('Initial dependency check:', initialCheck);
        // Wait for all dependencies to load
        console.log('Waiting for dependencies to load...');
        const dependencyResult = await waitForDependencies();
        console.log('All dependencies loaded successfully:', dependencyResult);
        // Initialize controller
        console.log('Creating EmotionController instance...');
        window.emotionController = new EmotionController();
        console.log('Initializing EmotionController...');
        await window.emotionController.init();
        console.log('=== Emotion Input System Initialized Successfully ===');
        // Show success notification
        showNotification('Emotion Input System berhasil diinisialisasi!', 'success');
    } catch (error) {
        console.error('=== Emotion Input System Initialization Failed ===');
        console.error('Error details:', error);
        // Show detailed error notification
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>Failed to initialize system: ${error.message}</span>
            <br><small>Please check browser console for details</small>
        `;
        document.body.appendChild(notification);
        setTimeout(() => { 
            if (notification.parentNode) {
                notification.remove(); 
            }
        }, 15000);
        // Debug information
        console.error('Current window objects:', Object.keys(window).filter(key => 
            ['DataManager', 'UIManager', 'CameraManager', 'AudioManager', 'TextAnalyzer', 'EmotionController'].includes(key)
        ));
        // Check if scripts are loaded
        const scripts = document.querySelectorAll('script[src]');
        console.log('Loaded scripts:', Array.from(scripts).map(s => s.src));
    }
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('exportModal');
    if (e.target === modal) {
        closeExportModal();
    }
});

// Global functions for modal
function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function performExport() {
    if (window.emotionController) {
        window.emotionController.performExport();
    }
}

// Global notification functions
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

function showError(message) {
    showNotification(message, 'error');
}

// ... END emotion-input-init.js ... 