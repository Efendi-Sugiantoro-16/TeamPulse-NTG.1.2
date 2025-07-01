/**
 * TeamPulse Settings Management
 * Clean, responsive settings with sidebar integration
 */

class SettingsManager {
    constructor() {
        this.currentTab = 'profile';
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.setupResponsiveBehavior();
        this.initializeFormValidation();
        this.setupAutoSave();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = tab.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });

        // Form submissions
        document.querySelectorAll('.settings-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit(form);
            });
        });

        // Profile picture upload
        const profileUpload = document.getElementById('profile-upload');
        if (profileUpload) {
            profileUpload.addEventListener('change', (e) => {
                this.handleProfilePictureUpload(e);
            });
        }

        // Theme selection
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.handleThemeSelection(e);
            });
        });

        // Notification toggles
        document.querySelectorAll('.notification-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                this.handleNotificationToggle(e);
            });
        });

        // Privacy toggles
        document.querySelectorAll('.privacy-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                this.handlePrivacyToggle(e);
            });
        });

        // Export buttons
        document.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleDataExport(e);
            });
        });

        // Delete account
        const deleteAccountBtn = document.getElementById('delete-account-btn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', (e) => {
                this.handleAccountDeletion(e);
            });
        }

        // Password change
        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', (e) => {
                this.handlePasswordChange(e);
            });
        }

        // Responsive sidebar toggle
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
    }

    switchTab(tabName) {
        // Remove active class from all tabs and panels
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Add active class to selected tab and panel
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        const activePanel = document.getElementById(`${tabName}-panel`);

        if (activeTab && activePanel) {
            activeTab.classList.add('active');
            activePanel.classList.add('active');
            this.currentTab = tabName;
            
            // Update URL without page reload
            const url = new URL(window.location);
            url.searchParams.set('tab', tabName);
            window.history.pushState({}, '', url);
        }
    }

    async handleFormSubmit(form) {
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

            await this.simulateApiCall(formData);
            this.showNotification('Pengaturan berhasil disimpan!', 'success');
            this.saveSettings(formData);

        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Gagal menyimpan pengaturan. Silakan coba lagi.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    async handleProfilePictureUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showNotification('Pilih file gambar yang valid.', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Ukuran file terlalu besar. Maksimal 5MB.', 'error');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const profilePic = document.querySelector('.profile-picture img');
                if (profilePic) {
                    profilePic.src = e.target.result;
                }
                this.showNotification('Foto profil berhasil diperbarui!', 'success');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            this.showNotification('Gagal mengunggah foto profil.', 'error');
        }
    }

    handleThemeSelection(event) {
        const themeOption = event.currentTarget;
        const theme = themeOption.getAttribute('data-theme');

        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
        });

        themeOption.classList.add('active');
        this.applyTheme(theme);
        this.showNotification(`Tema ${theme} diterapkan!`, 'success');
    }

    handleNotificationToggle(event) {
        const toggle = event.target;
        const notificationType = toggle.getAttribute('data-notification');
        const isEnabled = toggle.checked;

        this.settings.notifications[notificationType] = isEnabled;
        this.saveSettings();

        this.showNotification(
            `${notificationType} ${isEnabled ? 'diaktifkan' : 'dinonaktifkan'}.`,
            'success'
        );
    }

    handlePrivacyToggle(event) {
        const toggle = event.target;
        const privacySetting = toggle.getAttribute('data-privacy');
        const isEnabled = toggle.checked;

        this.settings.privacy[privacySetting] = isEnabled;
        this.saveSettings();

        this.showNotification(
            `Pengaturan privasi ${privacySetting} ${isEnabled ? 'diaktifkan' : 'dinonaktifkan'}.`,
            'success'
        );
    }

    async handleDataExport(event) {
        const exportType = event.target.getAttribute('data-export');
        const exportBtn = event.target;
        const originalText = exportBtn.textContent;

        try {
            exportBtn.disabled = true;
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengekspor...';

            await this.simulateApiCall({ type: 'export', format: exportType });
            this.showNotification(`Data berhasil diekspor dalam format ${exportType.toUpperCase()}!`, 'success');

        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('Gagal mengekspor data.', 'error');
        } finally {
            exportBtn.disabled = false;
            exportBtn.textContent = originalText;
        }
    }

    async handleAccountDeletion(event) {
        event.preventDefault();

        const confirmed = confirm(
            'Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan dan semua data akan hilang.'
        );

        if (!confirmed) return;

        try {
            const deleteBtn = event.target;
            const originalText = deleteBtn.textContent;
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';

            await this.simulateApiCall({ type: 'delete-account' });

            this.showNotification('Akun berhasil dihapus. Anda akan dialihkan ke halaman login.', 'success');
            
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);

        } catch (error) {
            console.error('Error deleting account:', error);
            this.showNotification('Gagal menghapus akun.', 'error');
        }
    }

    async handlePasswordChange(event) {
        event.preventDefault();

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showNotification('Semua field password harus diisi.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('Password baru tidak cocok.', 'error');
            return;
        }

        if (newPassword.length < 8) {
            this.showNotification('Password baru minimal 8 karakter.', 'error');
            return;
        }

        try {
            const changeBtn = event.target;
            const originalText = changeBtn.textContent;
            changeBtn.disabled = true;
            changeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengubah...';

            await this.simulateApiCall({
                type: 'change-password',
                currentPassword,
                newPassword
            });

            this.showNotification('Password berhasil diubah!', 'success');
            
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';

        } catch (error) {
            console.error('Error changing password:', error);
            this.showNotification('Gagal mengubah password.', 'error');
        } finally {
            const changeBtn = event.target;
            changeBtn.disabled = false;
            changeBtn.textContent = originalText;
        }
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const container = document.querySelector('.settings-container');
        
        if (sidebar && container) {
            sidebar.classList.toggle('collapsed');
            container.classList.toggle('sidebar-collapsed');
        }
    }

    setupResponsiveBehavior() {
        window.addEventListener('resize', () => {
            this.adjustLayout();
        });

        this.adjustLayout();

        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
    }

    adjustLayout() {
        const width = window.innerWidth;
        const container = document.querySelector('.settings-container');
        const sidebar = document.querySelector('.sidebar');

        if (width <= 768) {
            if (container) container.style.marginLeft = '0';
            if (sidebar) sidebar.classList.add('mobile-hidden');
        } else {
            if (container) container.style.marginLeft = '280px';
            if (sidebar) sidebar.classList.remove('mobile-hidden');
        }
    }

    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('mobile-visible');
        }
    }

    initializeFormValidation() {
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                this.validateEmail(emailInput.value);
            });
        }

        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('blur', () => {
                this.validatePhone(phoneInput.value);
            });
        }

        const newPasswordInput = document.getElementById('new-password');
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', () => {
                this.checkPasswordStrength(newPasswordInput.value);
            });
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        
        const emailInput = document.getElementById('email');
        if (emailInput) {
            if (isValid) {
                emailInput.classList.remove('error');
                emailInput.classList.add('valid');
            } else {
                emailInput.classList.remove('valid');
                emailInput.classList.add('error');
            }
        }
        
        return isValid;
    }

    validatePhone(phone) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        const isValid = phoneRegex.test(phone);
        
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            if (isValid) {
                phoneInput.classList.remove('error');
                phoneInput.classList.add('valid');
            } else {
                phoneInput.classList.remove('valid');
                phoneInput.classList.add('error');
            }
        }
        
        return isValid;
    }

    checkPasswordStrength(password) {
        const strengthIndicator = document.getElementById('password-strength');
        if (!strengthIndicator) return;

        let strength = 0;
        let feedback = '';

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        switch (strength) {
            case 0:
            case 1:
                feedback = 'Sangat Lemah';
                strengthIndicator.className = 'password-strength very-weak';
                break;
            case 2:
                feedback = 'Lemah';
                strengthIndicator.className = 'password-strength weak';
                break;
            case 3:
                feedback = 'Sedang';
                strengthIndicator.className = 'password-strength medium';
                break;
            case 4:
                feedback = 'Kuat';
                strengthIndicator.className = 'password-strength strong';
                break;
            case 5:
                feedback = 'Sangat Kuat';
                strengthIndicator.className = 'password-strength very-strong';
                break;
        }

        strengthIndicator.textContent = feedback;
    }

    setupAutoSave() {
        setInterval(() => {
            this.autoSaveFormData();
        }, 30000);

        document.querySelectorAll('.settings-form input, .settings-form select, .settings-form textarea').forEach(input => {
            input.addEventListener('change', () => {
                this.autoSaveFormData();
            });
        });
    }

    autoSaveFormData() {
        const forms = document.querySelectorAll('.settings-form');
        forms.forEach(form => {
            const formData = new FormData(form);
            const formId = form.id || 'default';
            
            const formObject = {};
            for (let [key, value] of formData.entries()) {
                formObject[key] = value;
            }
            
            localStorage.setItem(`settings_${formId}`, JSON.stringify(formObject));
        });
    }

    loadUserData() {
        const userData = this.getUserData();
        if (userData) {
            this.populateUserData(userData);
        }

        const savedSettings = this.loadSettings();
        if (savedSettings) {
            this.populateSettings(savedSettings);
        }

        this.restoreAutoSavedData();
    }

    getUserData() {
        return {
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+62 812-3456-7890',
            bio: 'Software Developer passionate about creating amazing user experiences.',
            location: 'Jakarta, Indonesia',
            timezone: 'Asia/Jakarta',
            language: 'id',
            theme: 'light'
        };
    }

    populateUserData(userData) {
        const nameInput = document.getElementById('name');
        if (nameInput) nameInput.value = userData.name;

        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = userData.email;

        const phoneInput = document.getElementById('phone');
        if (phoneInput) phoneInput.value = userData.phone;

        const bioInput = document.getElementById('bio');
        if (bioInput) bioInput.value = userData.bio;

        const locationInput = document.getElementById('location');
        if (locationInput) locationInput.value = userData.location;

        const timezoneSelect = document.getElementById('timezone');
        if (timezoneSelect) timezoneSelect.value = userData.timezone;

        const languageSelect = document.getElementById('language');
        if (languageSelect) languageSelect.value = userData.language;
    }

    populateSettings(settings) {
        Object.keys(settings.notifications || {}).forEach(key => {
            const toggle = document.querySelector(`[data-notification="${key}"]`);
            if (toggle) {
                toggle.checked = settings.notifications[key];
            }
        });

        Object.keys(settings.privacy || {}).forEach(key => {
            const toggle = document.querySelector(`[data-privacy="${key}"]`);
            if (toggle) {
                toggle.checked = settings.privacy[key];
            }
        });

        const themeOption = document.querySelector(`[data-theme="${settings.theme}"]`);
        if (themeOption) {
            themeOption.classList.add('active');
        }
    }

    restoreAutoSavedData() {
        const forms = document.querySelectorAll('.settings-form');
        forms.forEach(form => {
            const formId = form.id || 'default';
            const savedData = localStorage.getItem(`settings_${formId}`);
            
            if (savedData) {
                try {
                    const formObject = JSON.parse(savedData);
                    Object.keys(formObject).forEach(key => {
                        const input = form.querySelector(`[name="${key}"]`);
                        if (input && !input.value) {
                            input.value = formObject[key];
                        }
                    });
                } catch (error) {
                    console.error('Error restoring auto-saved data:', error);
                }
            }
        });
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('teamPulseSettings');
            return saved ? JSON.parse(saved) : this.getDefaultSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            return this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            notifications: {
                email: true,
                push: true,
                sms: false,
                weekly: true,
                monthly: false
            },
            privacy: {
                profileVisible: true,
                dataSharing: false,
                analytics: true,
                marketing: false
            },
            theme: 'light',
            language: 'id',
            timezone: 'Asia/Jakarta'
        };
    }

    saveSettings(data = null) {
        try {
            if (data) {
                Object.keys(data).forEach(key => {
                    this.settings[key] = data.get(key);
                });
            }
            
            localStorage.setItem('teamPulseSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.settings.theme = theme;
        this.saveSettings();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }

    async simulateApiCall(data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('API call simulated:', data);
                resolve({ success: true });
            }, 1000 + Math.random() * 2000);
        });
    }
}

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const settingsManager = new SettingsManager();
    window.settingsManager = settingsManager;
    
    window.addEventListener('popstate', () => {
        const url = new URL(window.location);
        const tab = url.searchParams.get('tab') || 'profile';
        settingsManager.switchTab(tab);
    });
    
    const url = new URL(window.location);
    const initialTab = url.searchParams.get('tab') || 'profile';
    settingsManager.switchTab(initialTab);
});

// Add notification styles
const notificationStyles = `
<style>
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
    max-width: 400px;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
}

.notification-close {
    background: none;
    border: none;
    cursor: pointer;
    color: #6c757d;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s;
}

.notification-close:hover {
    background: #f8f9fa;
    color: #495057;
}

.notification-success {
    border-left: 4px solid #27ae60;
}

.notification-success i {
    color: #27ae60;
}

.notification-error {
    border-left: 4px solid #e74c3c;
}

.notification-error i {
    color: #e74c3c;
}

.notification-warning {
    border-left: 4px solid #f39c12;
}

.notification-warning i {
    color: #f39c12;
}

.notification-info {
    border-left: 4px solid #3498db;
}

.notification-info i {
    color: #3498db;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.password-strength {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
    text-align: center;
    margin-top: 0.5rem;
}

.password-strength.very-weak {
    background: #fee;
    color: #c53030;
}

.password-strength.weak {
    background: #fef5e7;
    color: #d69e2e;
}

.password-strength.medium {
    background: #fef9e7;
    color: #d97706;
}

.password-strength.strong {
    background: #f0fff4;
    color: #38a169;
}

.password-strength.very-strong {
    background: #f0fff4;
    color: #2f855a;
}

.form-input.error {
    border-color: #e74c3c;
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.form-input.valid {
    border-color: #27ae60;
    box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1);
}

@media (max-width: 768px) {
    .notification {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', notificationStyles);
