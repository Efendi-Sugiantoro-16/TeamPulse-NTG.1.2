/**
 * Text Analyzer Component
 * Handles text sentiment and emotion analysis
 */

let emotionPipelineEN = null;
let emotionPipelineID = null;
let emotionModelLoadedEN = false;
let emotionModelLoadedID = false;

async function loadEmotionModels() {
    if (window.transformers) {
        if (!emotionModelLoadedEN) {
            emotionPipelineEN = await window.transformers.pipeline('text-classification', 'j-hartmann/emotion-english-distilroberta-base', { quantized: true });
            emotionModelLoadedEN = true;
            console.log('AI English Emotion Model loaded!');
        }
        if (!emotionModelLoadedID) {
            emotionPipelineID = await window.transformers.pipeline('text-classification', 'indobenchmark/indobert-base-p1', { quantized: true });
            emotionModelLoadedID = true;
            console.log('AI IndoBERT Sentiment Model loaded!');
        }
    }
}

// Panggil loadEmotionModel saat file di-load
loadEmotionModels();

function detectLang(text) {
    if (window.franc) {
        const lang = window.franc(text);
        if (lang === 'ind') return 'id';
        if (lang === 'eng') return 'en';
    }
    // fallback simple heuristic
    if (/\b(saya|aku|kamu|tidak|dan|yang|ini|itu|akan|dengan|karena|adalah|untuk|pada|dari|ke)\b/i.test(text)) return 'id';
    return 'en';
}

class TextAnalyzer {
    constructor(config = {}) {
        this.config = {
            confidenceThreshold: 0.6,
            ...config
        };
        
        this.eventListeners = new Map();
        
        console.log('TextAnalyzer: Initialized');
    }

    async analyzeText(text) {
        try {
            console.log('TextAnalyzer: Analyzing text...');
            
            if (!text || typeof text !== 'string') {
                throw new Error('Invalid text input');
            }
            
            const cleanedText = text.trim();
            const lang = detectLang(cleanedText);
            let result = null;
            // ======== AI EMOTION MODEL (transformers.js) ========
            if (lang === 'id' && emotionModelLoadedID && emotionPipelineID) {
                const aiResult = await emotionPipelineID(cleanedText, { topk: 1 });
                if (Array.isArray(aiResult) && aiResult.length > 0) {
                    const label = aiResult[0].label.toLowerCase();
                    const score = aiResult[0].score;
                    result = {
                        emotion: label,
                        confidence: score,
                        sentiment: label, // IndoBERT: label = sentiment
                        keywords: [],
                        textLength: text.length,
                        wordCount: cleanedText.split(/\s+/).length,
                        source: 'text',
                        timestamp: new Date().toISOString(),
                        ai: true,
                        lang: 'id'
                    };
                }
            } else if (lang === 'en' && emotionModelLoadedEN && emotionPipelineEN) {
                const aiResult = await emotionPipelineEN(cleanedText, { topk: 1 });
                if (Array.isArray(aiResult) && aiResult.length > 0) {
                    const label = aiResult[0].label.toLowerCase();
                    const score = aiResult[0].score;
                    result = {
                        emotion: label,
                        confidence: score,
                        sentiment: (['joy', 'happy', 'love', 'surprise', 'excited'].includes(label) ? 'positive' : (['anger', 'sadness', 'fear', 'disgust'].includes(label) ? 'negative' : 'neutral')),
                        keywords: [],
                        textLength: text.length,
                        wordCount: cleanedText.split(/\s+/).length,
                        source: 'text',
                        timestamp: new Date().toISOString(),
                        ai: true,
                        lang: 'en'
                    };
                }
            }
            // =====================================================
            if (!result) {
                // fallback: netralkan jika model tidak tersedia
                result = {
                    emotion: 'neutral',
                    confidence: 0.5,
                    sentiment: 'neutral',
                    keywords: [],
                    textLength: text.length,
                    wordCount: cleanedText.split(/\s+/).length,
                    source: 'text',
                    timestamp: new Date().toISOString(),
                    ai: false,
                    lang
                };
            }
            this.emit('analysisComplete', result);
            return result;
        } catch (error) {
            console.error('TextAnalyzer: Analysis failed:', error);
            this.emit('analysisError', error);
            throw error;
        }
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
