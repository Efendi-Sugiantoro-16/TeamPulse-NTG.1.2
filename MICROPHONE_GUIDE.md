# 🎤 Panduan Microphone TeamPulse

## Overview
Sistem microphone TeamPulse telah diperbaiki dengan fitur lengkap termasuk:
- **Pengukur suara real-time** dengan visualisasi level audio
- **Spektogram real-time** untuk melihat distribusi frekuensi
- **Recording audio** dengan kemampuan play dan download
- **Sistem penyimpanan hybrid** (localStorage + database)

## File yang Tersedia

### 1. File Testing Sederhana
- `test-mic.html` - File testing paling sederhana
- `simple-microphone.html` - File testing dengan UI yang lebih baik
- `microphone-test.html` - File testing lengkap dengan semua fitur

### 2. File Utama
- `emotion-input.html` - Halaman utama dengan tab voice analysis
- `js/audioRecorder.js` - Engine audio recorder
- `js/hybridStorage.js` - Sistem penyimpanan hybrid
- `js/dataExport.js` - Export data ke JSON/CSV

## Cara Menggunakan

### 🚀 Quick Start - Testing Sederhana

1. **Buka file `test-mic.html`**
   ```bash
   # Buka di browser
   file:///path/to/TeamPulse-NTG.1.2/test-mic.html
   ```

2. **Klik "Start Recording"**
   - Browser akan meminta izin microphone
   - Klik "Allow" untuk memberikan izin

3. **Lihat hasilnya**
   - Audio level meter akan bergerak sesuai suara
   - Spektogram akan menampilkan visualisasi frekuensi real-time
   - Level audio ditampilkan dalam dB

4. **Klik "Stop Recording"**
   - Rekaman akan berhenti
   - Tombol "Play" dan "Download" akan aktif

5. **Test fitur**
   - Klik "Play" untuk memutar ulang rekaman
   - Klik "Download" untuk menyimpan file audio

### 🎯 Penggunaan Lengkap di Emotion Input

1. **Buka `emotion-input.html`**
2. **Klik tab "Voice Analysis"**
3. **Gunakan fitur yang sama seperti testing sederhana**

## Fitur Detail

### 📊 Audio Level Meter
- **Visual**: Bar meter dengan gradien warna (hijau-kuning-merah)
- **Numeric**: Level dalam dB (desibel)
- **Real-time**: Update setiap frame (60fps)

### 🌈 Spektogram Real-time
- **Color mapping**: HSL color space
- **Frequency axis**: Y-axis menunjukkan frekuensi (Hz)
- **Time axis**: X-axis menunjukkan waktu
- **Intensity**: Warna menunjukkan intensitas suara

### 💾 Recording System
- **Format**: WAV (lossless)
- **Quality**: 44.1 kHz, 16-bit, mono
- **Playback**: Built-in audio player
- **Download**: Save ke file lokal

### 🗄️ Storage System
- **Hybrid**: localStorage + database
- **Auto-sync**: Sinkronisasi otomatis saat online
- **Offline**: Queue data saat offline
- **Export**: JSON dan CSV format

## Troubleshooting

### ❌ Microphone tidak berfungsi

**Gejala:**
- Tidak ada suara terdeteksi
- Audio level tetap -∞ dB
- Spektogram kosong

**Solusi:**
1. **Cek permission browser**
   - Pastikan browser mengizinkan akses microphone
   - Klik ikon 🔒 di address bar
   - Set microphone ke "Allow"

2. **Cek hardware**
   - Pastikan microphone terhubung
   - Test di aplikasi lain (Discord, Zoom, dll)
   - Cek volume microphone di sistem

3. **Refresh halaman**
   - Tekan F5 atau Ctrl+R
   - Coba lagi dari awal

### ❌ Spektogram tidak muncul

**Gejala:**
- Canvas kosong/hitam
- Tidak ada visualisasi

**Solusi:**
1. **Cek console browser**
   - Tekan F12 untuk buka Developer Tools
   - Lihat tab Console untuk error
   - Pastikan tidak ada JavaScript error

2. **Cek browser support**
   - Pastikan menggunakan browser modern
   - Chrome, Firefox, Safari, Edge terbaru
   - Update browser jika perlu

### ❌ Recording gagal

**Gejala:**
- Tidak bisa start recording
- Error saat recording

**Solusi:**
1. **Cek MediaRecorder support**
   - Browser harus mendukung MediaRecorder API
   - Chrome 47+, Firefox 25+, Safari 14+

2. **Cek HTTPS**
   - MediaRecorder memerlukan HTTPS di production
   - Gunakan localhost untuk development

## Technical Details

### Audio Processing
```javascript
// Sample rate: 44.1 kHz
// FFT size: 2048 points
// Analysis interval: 60fps (requestAnimationFrame)
// Channels: Mono (1 channel)
```

### Spectrogram Algorithm
```javascript
// 1. Get frequency data from Web Audio API
// 2. Normalize to 0-1 range
// 3. Map to HSL color space
// 4. Draw on canvas with time scrolling
```

### Storage Format
```javascript
{
  "id": "timestamp",
  "emotion": "happy",
  "confidence": 0.85,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "type": "voice",
  "source": "microphone",
  "audioUrl": "blob:...",
  "storageMode": "hybrid"
}
```

## Performance Tips

### 🚀 Optimasi
1. **Close unused tabs** - Browser membatasi audio context per tab
2. **Use headphones** - Mengurangi feedback audio
3. **Limit recording time** - Rekaman panjang memakan memori
4. **Regular cleanup** - Export dan hapus data lama

### 📱 Mobile Optimization
1. **Use landscape mode** - Spektogram lebih terlihat
2. **Enable auto-rotate** - Untuk pengalaman terbaik
3. **Check battery** - Audio processing memakan baterai

## Development

### Menambah Fitur Baru

1. **Modify AudioRecorder class**
   ```javascript
   // Di js/audioRecorder.js
   class AudioRecorder {
       // Tambah method baru
       newFeature() {
           // Implementation
       }
   }
   ```

2. **Update UI**
   ```html
   <!-- Di emotion-input.html -->
   <button id="newFeatureBtn">New Feature</button>
   ```

3. **Connect in controller**
   ```javascript
   // Di js/emotion-input.js
   document.getElementById('newFeatureBtn').onclick = () => {
       this.audioRecorder.newFeature();
   };
   ```

### Debugging

1. **Console logging**
   ```javascript
   console.log('Audio level:', level);
   console.log('Recording status:', this.isRecording);
   ```

2. **Performance monitoring**
   ```javascript
   console.time('spectrogram-update');
   // ... code ...
   console.timeEnd('spectrogram-update');
   ```

## Support

### Browser Compatibility
- ✅ Chrome 47+
- ✅ Firefox 25+
- ✅ Safari 14+
- ✅ Edge 79+
- ❌ Internet Explorer (tidak didukung)

### API Requirements
- ✅ getUserMedia API
- ✅ Web Audio API
- ✅ MediaRecorder API
- ✅ Canvas API
- ✅ Blob API

### System Requirements
- **RAM**: Minimal 2GB
- **CPU**: Dual-core atau lebih
- **Storage**: Minimal 100MB free space
- **Network**: Untuk database sync (opsional)

## Contoh Penggunaan

### Basic Recording
```javascript
const recorder = new AudioRecorder();
await recorder.initialize();

// Start recording
await recorder.startRecording();

// Stop after 5 seconds
setTimeout(() => {
    recorder.stopRecording();
}, 5000);
```

### Custom Callbacks
```javascript
recorder.setCallbacks({
    onAudioLevel: (level) => {
        console.log('Current level:', level + ' dB');
    },
    onRecordingComplete: (audioUrl) => {
        console.log('Recording saved:', audioUrl);
    }
});
```

### Export Data
```javascript
const hybridStorage = new HybridStorage();
await hybridStorage.exportToJSON();
await hybridStorage.exportToCSV();
```

---

**🎉 Selamat menggunakan sistem microphone TeamPulse!**

Jika ada masalah, cek troubleshooting section atau buat issue di repository. 