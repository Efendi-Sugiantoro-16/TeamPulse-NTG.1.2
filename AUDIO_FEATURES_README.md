# Audio Features & Hybrid Storage System

## Overview
Sistem audio microphone telah diperbaiki dan ditingkatkan dengan fitur-fitur baru yang mencakup:
- Spektogram real-time untuk visualisasi frekuensi audio
- Sistem penyimpanan hybrid (MySQL + localStorage)
- Export data ke JSON dan CSV
- Analisis emosi dari suara dengan AI

## Fitur Audio Baru

### 1. Spektogram Real-time
- **Visualisasi frekuensi**: Menampilkan distribusi frekuensi audio secara real-time
- **Color mapping**: Menggunakan warna HSL untuk membedakan intensitas dan frekuensi
- **Responsive**: Menyesuaikan dengan ukuran layar
- **Performance optimized**: Menggunakan requestAnimationFrame untuk smooth rendering

### 2. Audio Level Meter
- **Real-time monitoring**: Menampilkan level audio dalam dB
- **Visual indicator**: Bar meter dengan gradien warna (hijau-kuning-merah)
- **Threshold detection**: Mendeteksi silence dan audio aktif

### 3. Waveform Visualization
- **Real-time waveform**: Menampilkan bentuk gelombang audio
- **Scrolling display**: Waveform bergerak dari kanan ke kiri
- **Audio level indicator**: Garis hijau menunjukkan level audio

### 4. Audio Recording
- **High-quality recording**: Menggunakan MediaRecorder API
- **Multiple formats**: Mendukung WAV, MP3, dan format lainnya
- **Playback support**: Dapat memutar ulang rekaman
- **Download capability**: Menyimpan rekaman ke file lokal

## Sistem Penyimpanan Hybrid

### 1. HybridStorage Class
```javascript
const hybridStorage = new HybridStorage();
```

**Fitur:**
- **Dual storage**: MySQL database + localStorage
- **Auto-sync**: Sinkronisasi otomatis saat online
- **Offline support**: Queue data saat offline
- **Fallback mechanism**: Otomatis fallback ke localStorage jika database tidak tersedia

### 2. Storage Modes
- **Local mode**: Hanya menggunakan localStorage
- **Database mode**: Menggunakan MySQL database
- **Hybrid mode**: Kombinasi keduanya dengan auto-sync

### 3. Data Export
- **JSON export**: Export data dengan metadata lengkap
- **CSV export**: Format spreadsheet yang kompatibel dengan Excel
- **Filtered export**: Export berdasarkan tanggal, emosi, dll
- **Batch processing**: Export data dalam jumlah besar

## Voice Emotion Analyzer

### 1. Advanced Features
- **7 emotions**: Happy, Sad, Angry, Neutral, Surprise, Fear, Disgust
- **Real-time analysis**: Analisis emosi secara real-time
- **Confidence scoring**: Skor kepercayaan untuk setiap prediksi
- **Feature extraction**: RMS, ZCR, Spectral Centroid, dll

### 2. AI Model Integration
- **TensorFlow.js**: Model AI untuk analisis emosi
- **Fallback model**: Model sederhana jika model utama tidak tersedia
- **Meyda.js**: Library untuk ekstraksi fitur audio lanjutan

### 3. Callback System
```javascript
voiceAnalyzer.setCallbacks({
    onAudioLevel: (level) => updateAudioLevel(level),
    onEmotionDetected: (emotion) => updateVoiceEmotion(emotion),
    onEmotionUpdate: (emotion) => updateVoiceEmotion(emotion)
});
```

## Cara Penggunaan

### 1. Memulai Voice Analysis
1. Buka halaman `emotion-input.html`
2. Klik tab "Voice Analysis"
3. Klik "Start Recording" untuk memulai
4. Spektogram dan waveform akan muncul secara real-time
5. Klik "Stop Recording" untuk menghentikan

### 2. Export Data
1. Klik tombol "Export Data" di header
2. Pilih format (JSON/CSV/Excel)
3. Set filter tanggal dan emosi jika diperlukan
4. Klik "Export" untuk mengunduh file

### 3. Generate Report
1. Klik tombol "Generate Report"
2. Sistem akan membuat laporan statistik
3. File JSON akan diunduh otomatis

## File Structure

```
js/
├── voiceEmotionAnalyzer.js    # Voice analysis engine
├── hybridStorage.js           # Hybrid storage system
├── dataExport.js             # Export utilities
├── emotion-input.js          # Main controller
└── dataStorage.js            # Local storage handler

css/
└── emotion-input.css         # Audio UI styles

models/
└── audio_emotion_model/      # AI model files
```

## Technical Details

### 1. Audio Processing
- **Sample Rate**: 44.1 kHz
- **FFT Size**: 2048 points
- **Analysis Interval**: 50ms (real-time)
- **Channels**: Mono (1 channel)

### 2. Spectrogram
- **Width**: 400px (configurable)
- **Height**: 200px (configurable)
- **Time slices**: 200 frames
- **Color mapping**: HSL color space

### 3. Storage
- **LocalStorage limit**: ~5-10MB
- **Database**: MySQL dengan tabel emotions
- **Sync interval**: Real-time saat online
- **Offline queue**: Unlimited (dengan cleanup)

## Troubleshooting

### 1. Microphone tidak berfungsi
- Pastikan browser mendukung getUserMedia
- Cek permission microphone
- Refresh halaman dan coba lagi

### 2. Spektogram tidak muncul
- Pastikan canvas element ada di HTML
- Cek console untuk error JavaScript
- Pastikan audio context berhasil dibuat

### 3. Export gagal
- Cek koneksi internet untuk database mode
- Pastikan ada data untuk di-export
- Cek permission download browser

### 4. Storage error
- Cek localStorage quota
- Pastikan database connection
- Restart aplikasi jika diperlukan

## Performance Tips

1. **Close unused tabs**: Browser membatasi audio context per tab
2. **Use headphones**: Mengurangi feedback audio
3. **Limit recording time**: Rekaman panjang memakan memori
4. **Regular cleanup**: Export dan hapus data lama

## Future Enhancements

1. **WebSocket support**: Real-time sync dengan server
2. **Advanced AI models**: Model yang lebih akurat
3. **Multi-language support**: Analisis emosi multi-bahasa
4. **Cloud storage**: Backup ke cloud storage
5. **Mobile optimization**: Optimasi untuk perangkat mobile 