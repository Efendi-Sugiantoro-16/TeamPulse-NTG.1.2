// API Configuration
const API_BASE_URL = 'http://localhost:8080/api';

// UserStorage untuk CRUD user di localStorage
class UserStorage {
    constructor() {
        this.key = 'teamPulseUsers';
    }
    getAllUsers() {
        const users = localStorage.getItem(this.key);
        return users ? JSON.parse(users) : [];
    }
    saveAllUsers(users) {
        localStorage.setItem(this.key, JSON.stringify(users));
    }
    addUser(user) {
        const users = this.getAllUsers();
        users.push(user);
        this.saveAllUsers(users);
    }
    findUserByEmail(email) {
        return this.getAllUsers().find(u => u.email === email);
    }
    updateUser(email, newData) {
        let users = this.getAllUsers();
        users = users.map(u => u.email === email ? { ...u, ...newData } : u);
        this.saveAllUsers(users);
    }
    deleteUser(email) {
        let users = this.getAllUsers();
        users = users.filter(u => u.email !== email);
        this.saveAllUsers(users);
    }
}

const userStorage = new UserStorage();

/**
 * AuthService handles all authentication-related API calls
 */
class AuthService {
    static async register({ name, email, password }) {
        if (!name || !email || !password) throw new Error('All fields required');
        if (userStorage.findUserByEmail(email)) throw new Error('Email already registered');
        const user = { name, email, password };
        userStorage.addUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', btoa(email));
        return user;
    }
    
    static async login(email, password) {
        const user = userStorage.findUserByEmail(email);
        if (!user || user.password !== password) throw new Error('Invalid credentials');
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', btoa(email));
        return user;
    }
    
    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
    
    static isAuthenticated() {
        return !!localStorage.getItem('token');
    }
    
    static getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
    
    static updateProfile(newData) {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        userStorage.updateUser(user.email, newData);
        const updatedUser = { ...user, ...newData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
    }
    
    static deleteProfile() {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        userStorage.deleteUser(user.email);
        this.logout();
    }
}

// Auth Manager for UI interactions
/**
 * AuthManager handles the UI interactions for authentication
 */
class AuthManager {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.signupForm = document.getElementById('signupForm');
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (this.signupForm) {
            this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));
            this.setupPasswordValidation();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('errorMessage');
        
        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }
        
        try {
            // Show loading state
            loadingElement.style.display = 'block';
            errorElement.style.display = 'none';
            
            // Call login API
            await AuthService.login(email, password);
            
            // Redirect to dashboard on success
            window.location.href = 'dashboard.html';
        } catch (error) {
            this.showError(error.message || 'Login failed. Please try again.');
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    async handleSignup(e) {
        e.preventDefault();

        const fullName = document.getElementById('fullName')?.value;
        const email = document.getElementById('email')?.value;
        const username = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const terms = document.querySelector('input[name="terms"]')?.checked;
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('errorMessage');

        try {
            // Validate inputs
            if (!fullName || !email || !username || !password || !confirmPassword) {
                throw new Error('Please fill in all fields');
            }

            if (!validateEmail(email)) {
                throw new Error('Please enter a valid email address');
            }

            if (!this.validatePassword(password)) {
                throw new Error('Password must be at least 8 characters long and include a number and special character');
            }

            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            if (!terms) {
                throw new Error('You must accept the terms and conditions');
            }

            // Show loading state
            loadingElement.style.display = 'block';
            errorElement.style.display = 'none';

            // Call register API
            await AuthService.register({
                name: fullName,
                email,
                password
            });


            // Auto-login after successful registration
            await AuthService.login(email, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            this.showError(error.message || 'Registration failed. Please try again.');
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    setupPasswordValidation() {
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            // Add password strength validation here if needed
            passwordInput.addEventListener('input', () => {
                this.validatePassword(passwordInput.value);
            });
        }
    }

    validatePassword(password) {
        // Simple validation - at least 8 chars with number and special char
        return /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/.test(password);
    }

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        } else {
            alert(message);
        }
    }
}

// Helper function to validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    if (AuthService.isAuthenticated() && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'dashboard.html';
    }
    
    // Initialize auth manager if we're on a page with auth forms
    if (document.getElementById('loginForm') || document.getElementById('signupForm')) {
        window.authManager = new AuthManager();
    }
});

window.UserStorage = UserStorage;
window.AuthService = AuthService;
