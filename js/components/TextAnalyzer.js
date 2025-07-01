/**
 * Text Analyzer Component
 * Handles text sentiment and emotion analysis
 */

class TextAnalyzer {
    constructor(config = {}) {
        this.config = {
            confidenceThreshold: 0.6,
            ...config
        };
        
        this.eventListeners = new Map();
        
        // Simple emotion words for basic analysis
        this.emotionWords = {
            happy: ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'love', 'good', 'positive'],
            sad: ['sad', 'angry', 'fear', 'hate', 'terrible', 'awful', 'bad', 'negative', 'depressed'],
            excited: ['excited', 'thrilled', 'ecstatic', 'elated', 'energetic', 'passionate', 'enthusiastic'],
            fearful: ['afraid', 'scared', 'terrified', 'frightened', 'anxious', 'worried', 'nervous'],
            angry: ['angry', 'furious', 'mad', 'irritated', 'annoyed', 'frustrated', 'enraged'],
            neutral: ['neutral', 'calm', 'peaceful', 'serene', 'normal', 'ordinary', 'regular']
        };
        
        console.log('TextAnalyzer: Initialized');
    }

    async analyzeText(text) {
        try {
            console.log('TextAnalyzer: Analyzing text...');
            
            if (!text || typeof text !== 'string') {
                throw new Error('Invalid text input');
            }
            
            // Clean and normalize text
            const cleanedText = this.cleanText(text);
            
            // Analyze sentiment and emotions
            const analysis = this.performAnalysis(cleanedText);
            
            // Extract keywords
            const keywords = this.extractKeywords(cleanedText);
            
            const result = {
                emotion: analysis.dominantEmotion,
                confidence: analysis.confidence,
                sentiment: analysis.sentiment,
                keywords: keywords,
                textLength: text.length,
                wordCount: cleanedText.split(/\s+/).length,
                source: 'text',
                timestamp: new Date().toISOString()
            };
            
            console.log('TextAnalyzer: Analysis complete:', result);
            this.emit('analysisComplete', result);
            
            return result;
            
        } catch (error) {
            console.error('TextAnalyzer: Analysis failed:', error);
            this.emit('analysisError', error);
            throw error;
        }
    }

    cleanText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    performAnalysis(text) {
        const words = text.split(/\s+/);
        const emotionScores = {};
        
        // Initialize scores
        Object.keys(this.emotionWords).forEach(emotion => {
            emotionScores[emotion] = 0;
        });
        
        // Count emotion words
        words.forEach(word => {
            Object.entries(this.emotionWords).forEach(([emotion, emotionWords]) => {
                if (emotionWords.includes(word)) {
                    emotionScores[emotion]++;
                }
            });
        });
        
        // Calculate total emotion words
        const totalEmotionWords = Object.values(emotionScores).reduce((sum, score) => sum + score, 0);
        
        if (totalEmotionWords === 0) {
            return {
                dominantEmotion: 'neutral',
                confidence: 0.5,
                sentiment: 'neutral'
            };
        }
        
        // Normalize scores
        Object.keys(emotionScores).forEach(emotion => {
            emotionScores[emotion] = emotionScores[emotion] / totalEmotionWords;
        });
        
        // Find dominant emotion
        const dominantEmotion = Object.entries(emotionScores)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        const confidence = emotionScores[dominantEmotion];
        
        // Determine sentiment
        let sentiment = 'neutral';
        if (['happy', 'excited'].includes(dominantEmotion)) {
            sentiment = 'positive';
        } else if (['sad', 'fearful', 'angry'].includes(dominantEmotion)) {
            sentiment = 'negative';
        }
        
        return {
            dominantEmotion: dominantEmotion,
            confidence: confidence,
            sentiment: sentiment
        };
    }

    extractKeywords(text) {
        const words = text.split(/\s+/);
        const keywords = [];
        
        words.forEach(word => {
            Object.values(this.emotionWords).flat().forEach(emotionWord => {
                if (emotionWord === word && !keywords.includes(word)) {
                    keywords.push(word);
                }
            });
        });
        
        return keywords;
    }

    // Event system
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('TextAnalyzer: Event callback error:', error);
                }
            });
        }
    }

    destroy() {
        this.eventListeners.clear();
    }
}

window.TextAnalyzer = TextAnalyzer;
