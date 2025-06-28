// Service to submit emotion data using DataStorage
window.submitEmotionData = async function(data) {
    const storage = new window.DataStorage();
    return await storage.saveEmotionData(data);
}
