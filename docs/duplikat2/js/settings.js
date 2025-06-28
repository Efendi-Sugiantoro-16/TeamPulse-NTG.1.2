/**
 * Settings Page JavaScript
 * Handles settings page functionality and form interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Settings tab switching
    const settingsTabs = document.querySelectorAll('.settings-tab');
    const settingsPanels = document.querySelectorAll('.settings-panel');

    settingsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and panels
            settingsTabs.forEach(t => t.classList.remove('active'));
            settingsPanels.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and target panel
            tab.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Profile picture change
    const changePictureBtn = document.getElementById('changePicture');
    const profilePictureInput = document.getElementById('profilePictureInput');
    const profileImage = document.getElementById('profileImage');

    if (changePictureBtn && profilePictureInput) {
        changePictureBtn.addEventListener('click', () => {
            profilePictureInput.click();
        });

        profilePictureInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    profileImage.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Form submissions
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Handle profile form submission
            console.log('Profile form submitted');
            showNotification('Profile updated successfully!', 'success');
        });
    }

    // Theme switching
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            themeOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            
            const theme = option.querySelector('span').textContent.toLowerCase();
            applyTheme(theme);
        });
    });

    // Color switching
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            colorOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            
            const color = option.getAttribute('data-color');
            applyAccentColor(color);
        });
    });

    // Switch toggles
    const switches = document.querySelectorAll('.switch input[type="checkbox"]');
    switches.forEach(switchInput => {
        switchInput.addEventListener('change', (e) => {
            const setting = e.target.closest('.notification-item, .privacy-item, .permission-item');
            if (setting) {
                const settingName = setting.querySelector('h5').textContent;
                console.log(`${settingName} changed to: ${e.target.checked}`);
            }
        });
    });

    // Export buttons
    const exportButtons = document.querySelectorAll('.export-options .btn');
    exportButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const action = button.textContent.trim();
            console.log(`Export action: ${action}`);
            showNotification(`${action} started...`, 'info');
        });
    });

    // Delete buttons
    const deleteButtons = document.querySelectorAll('.btn-danger');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const action = button.textContent.trim();
            if (confirm(`Are you sure you want to ${action.toLowerCase()}? This action cannot be undone.`)) {
                console.log(`Delete action: ${action}`);
                showNotification(`${action} completed.`, 'warning');
            }
        });
    });
});

// Theme application
function applyTheme(theme) {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('teamPulse-theme', theme);
    console.log(`Theme applied: ${theme}`);
}

// Accent color application
function applyAccentColor(color) {
    document.documentElement.style.setProperty('--primary-color', color);
    localStorage.setItem('teamPulse-accent-color', color);
    console.log(`Accent color applied: ${color}`);
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Auto hide after 5 seconds
    setTimeout(() => {
        hideNotification(notification);
    }, 5000);

    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        hideNotification(notification);
    });
}

function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Load saved settings
function loadSavedSettings() {
    const savedTheme = localStorage.getItem('teamPulse-theme');
    const savedColor = localStorage.getItem('teamPulse-accent-color');
    
    if (savedTheme) {
        applyTheme(savedTheme);
    }
    
    if (savedColor) {
        applyAccentColor(savedColor);
    }
}

// Initialize settings
loadSavedSettings();
