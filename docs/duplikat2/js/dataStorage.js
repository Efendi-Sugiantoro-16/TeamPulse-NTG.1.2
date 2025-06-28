class DataStorage {
    constructor() {
        this.storageKey = 'teamPulseEmotionData';
    }

    async saveEmotionData(data) {
        try {
            const existingData = await this.getEmotionData();
            // Tambahkan id unik jika belum ada
            if (!data.id) data.id = Date.now().toString();
            existingData.push(data);
            localStorage.setItem(this.storageKey, JSON.stringify(existingData));
            return data;
        } catch (error) {
            console.error('Error saving emotion data:', error);
            return null;
        }
    }

    async getEmotionData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting emotion data:', error);
            return [];
        }
    }

    async updateEmotionData(id, newData) {
        try {
            let data = await this.getEmotionData();
            data = data.map(item => item.id === id ? { ...item, ...newData, id } : item);
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error updating emotion data:', error);
            return false;
        }
    }

    async deleteEmotionData(id) {
        try {
            let data = await this.getEmotionData();
            data = data.filter(item => item.id !== id);
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error deleting emotion data:', error);
            return false;
        }
    }

    async clearEmotionData() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Error clearing emotion data:', error);
            return false;
        }
    }
}

window.DataStorage = DataStorage; 