// Tambahkan di bawah class AIEmotionAnalyzer atau di bagian bawah file

// Fungsi AI deteksi emosi suara berbasis fitur audio (pitch, energy, dsb)
window.analyzeAudioEmotionAI = function(audioBuffer, audioContext) {
    if (!window.Meyda) {
        console.warn('Meyda not loaded');
        return { emotion: 'neutral', confidence: 0.5 };
    }
    // Ekstrak fitur utama
    const features = Meyda.extract(['rms', 'energy', 'spectralCentroid', 'spectralFlatness', 'perceptualSpread', 'perceptualSharpness', 'mfcc', 'chroma', 'zcr', 'loudness', 'pitch'], audioBuffer);
    // Decision tree/rule-based sederhana (bisa diupgrade ke ML model)
    let emotion = 'neutral';
    let confidence = 0.5;
    // Contoh rule:
    if (features.rms > 0.15 && features.spectralCentroid > 2000) {
        emotion = 'excited'; confidence = 0.8;
    } else if (features.rms < 0.07 && features.spectralCentroid < 1200) {
        emotion = 'sad'; confidence = 0.7;
    } else if (features.spectralFlatness > 0.4 && features.rms > 0.12) {
        emotion = 'angry'; confidence = 0.75;
    } else if (features.zcr > 0.15 && features.spectralCentroid > 2500) {
        emotion = 'surprised'; confidence = 0.7;
    } else if (features.perceptualSpread < 2.5 && features.rms < 0.09) {
        emotion = 'fearful'; confidence = 0.65;
    } else if (features.rms > 0.09 && features.spectralCentroid > 1500 && features.perceptualSharpness > 2.5) {
        emotion = 'happy'; confidence = 0.7;
    }
    return { emotion, confidence, features };
}

// AI deteksi emosi suara berbasis pitch, energi, dan variasi pitch (tanpa random, lebih fleksibel)
window.analyzeAudioEmotionIntonation = function(buffer, sampleRate) {
    function estimatePitch(buf, sr) {
        let maxCorr = 0, bestLag = 0;
        for (let lag = 32; lag < 512; lag++) {
            let corr = 0;
            for (let i = 0; i < buf.length - lag; i++) {
                corr += buf[i] * buf[i + lag];
            }
            if (corr > maxCorr) {
                maxCorr = corr;
                bestLag = lag;
            }
        }
        return bestLag > 0 ? sr / bestLag : 0;
    }
    function getRMS(buf) {
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        return Math.sqrt(sum / buf.length);
    }
    function getPitchVariation(buf, sr) {
        const windowSize = 256;
        let pitches = [];
        for (let i = 0; i < buf.length - windowSize; i += windowSize) {
            const p = estimatePitch(buf.slice(i, i + windowSize), sr);
            if (p > 50 && p < 500) pitches.push(p); // filter noise
        }
        if (pitches.length === 0) return 0;
        const mean = pitches.reduce((a, b) => a + b, 0) / pitches.length;
        const std = Math.sqrt(pitches.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pitches.length);
        return std;
    }
    function getSpectralCentroid(buf, sr) {
        let N = buf.length;
        let mag = [];
        for (let k = 0; k < N/2; k++) {
            let sumRe = 0, sumIm = 0;
            for (let n = 0; n < N; n++) {
                let angle = 2 * Math.PI * k * n / N;
                sumRe += buf[n] * Math.cos(angle);
                sumIm -= buf[n] * Math.sin(angle);
            }
            mag[k] = Math.sqrt(sumRe*sumRe + sumIm*sumIm);
        }
        let num = 0, denom = 0;
        for (let k = 0; k < mag.length; k++) {
            num += k * mag[k];
            denom += mag[k];
        }
        return denom > 0 ? (num / denom) * (sr / N) : 0;
    }
    function getZCR(buf) {
        let zcr = 0;
        for (let i = 1; i < buf.length; i++) {
            if ((buf[i-1] >= 0 && buf[i] < 0) || (buf[i-1] < 0 && buf[i] >= 0)) zcr++;
        }
        return zcr / buf.length;
    }
    const pitch = estimatePitch(buffer, sampleRate);
    const rms = getRMS(buffer);
    const pitchVar = getPitchVariation(buffer, sampleRate);
    const centroid = getSpectralCentroid(buffer, sampleRate);
    const zcr = getZCR(buffer);
    // Rule AI lebih kompleks
    let emotion = 'neutral', confidence = 0.5;
    if (pitch > 180 && rms > 0.10 && centroid > 2000 && pitchVar > 18 && zcr > 0.08) {
        emotion = 'excited'; confidence = 0.9;
    } else if (pitch < 120 && rms < 0.07 && centroid < 1200 && pitchVar < 8 && zcr < 0.04) {
        emotion = 'sad'; confidence = 0.85;
    } else if (pitch > 170 && rms > 0.13 && centroid > 2200 && zcr > 0.10) {
        emotion = 'angry'; confidence = 0.85;
    } else if (pitch > 130 && pitch < 170 && rms > 0.08 && centroid > 1500 && pitchVar > 12) {
        emotion = 'happy'; confidence = 0.8;
    } else if (pitch > 100 && pitch < 140 && rms < 0.09 && pitchVar > 10 && zcr > 0.07) {
        emotion = 'fearful'; confidence = 0.75;
    } else if (pitch > 120 && pitch < 180 && rms > 0.07 && centroid > 1300 && pitchVar < 10) {
        emotion = 'neutral'; confidence = 0.7;
    }
    return {
        emotion, confidence,
        features: {
            pitch: Math.round(pitch),
            rms: rms.toFixed(3),
            pitchVar: pitchVar.toFixed(2),
            centroid: Math.round(centroid),
            zcr: zcr.toFixed(3)
        }
    };
}
