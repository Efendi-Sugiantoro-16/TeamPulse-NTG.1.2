const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api',
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register'
        },
        EMOTIONS: {
            TRACK: '/emotions',
            HISTORY: '/emotions/history',
            STATS: '/emotions/stats'
        }
    },
    getFullUrl: function(endpoint) {
        return this.BASE_URL + endpoint;
    }
};

// Auth service
class AuthService {
    static async login(email, password) {
        try {
            const response = await fetch(API_CONFIG.getFullUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
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
}

// Emotion service
class EmotionService {
    static async trackEmotion(emotionData) {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(API_CONFIG.getFullUrl(API_CONFIG.ENDPOINTS.EMOTIONS.TRACK), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(emotionData)
        });
        return await response.json();
    }

    static async getEmotions() {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(API_CONFIG.getFullUrl(API_CONFIG.ENDPOINTS.EMOTIONS.TRACK), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    }

    static async updateEmotion(id, data) {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(`${API_CONFIG.getFullUrl(API_CONFIG.ENDPOINTS.EMOTIONS.TRACK)}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    }

    static async deleteEmotion(id) {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(`${API_CONFIG.getFullUrl(API_CONFIG.ENDPOINTS.EMOTIONS.TRACK)}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    }

    static async getEmotionHistory(limit = 10) {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(`${API_CONFIG.getFullUrl(API_CONFIG.ENDPOINTS.EMOTIONS.HISTORY)}?limit=${limit}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    }

    static async getEmotionStats() {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(API_CONFIG.getFullUrl(API_CONFIG.ENDPOINTS.EMOTIONS.STATS), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    }
}

window.AuthService = AuthService;
window.EmotionService = EmotionService;
