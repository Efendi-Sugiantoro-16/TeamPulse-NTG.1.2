# Snapshot Features Documentation

## Overview

Fitur snapshot yang terintegrasi dengan Face-api.js telah disempurnakan untuk memberikan pengalaman pengguna yang lebih baik dalam menangkap, menganalisis, dan mengelola snapshot emosi.

## Fitur Utama

### 1. Snapshot Capture dengan Face Detection
- **Real-time Face Detection**: Menggunakan Face-api.js untuk deteksi wajah real-time
- **Emotion Analysis**: Analisis ekspresi wajah menggunakan model yang telah dilatih
- **Quality Assessment**: Penilaian kualitas gambar berdasarkan brightness dan contrast
- **Metadata Extraction**: Ekstraksi metadata seperti confidence level, posisi wajah, dan dimensi gambar

### 2. Snapshot Preview & Metadata
- **Visual Preview**: Tampilan snapshot dengan overlay deteksi wajah
- **Metadata Display**: Informasi lengkap tentang snapshot
  - Timestamp
  - Face Detection Status
  - Confidence Level
  - Image Quality Assessment
- **Face Detection Overlay**: Visualisasi box deteksi wajah dan landmarks

### 3. Snapshot Management
- **Download**: Unduh snapshot dalam format PNG
- **Delete**: Hapus snapshot dari storage
- **Share**: Bagikan snapshot melalui berbagai platform
- **History**: Lihat riwayat semua snapshot yang telah diambil

### 4. Snapshot History
- **Grid View**: Tampilan grid untuk semua snapshot
- **Thumbnail Preview**: Preview thumbnail untuk setiap snapshot
- **Quick Actions**: Aksi cepat (view, download, delete) untuk setiap snapshot
- **Statistics**: Statistik jumlah snapshot yang tersimpan
- **Bulk Management**: Hapus semua snapshot sekaligus

### 5. Sharing Features
- **Native Sharing**: Menggunakan Web Share API jika tersedia
- **Email**: Kirim snapshot melalui email
- **Social Media**: Bagikan ke Twitter
- **WhatsApp**: Bagikan ke WhatsApp (mobile & web)
- **Clipboard**: Copy link atau data snapshot

## Technical Implementation

### Face-api.js Integration
```javascript
// Detect face and expressions
const detections = await faceapi.detectSingleFace(snapshotCanvas, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions();
```

### Image Quality Assessment
```javascript
assessImageQuality(canvas) {
    // Calculate brightness and contrast
    // Return quality level (excellent, good, poor)
    // Provide quality score and metrics
}
```

### Storage Management
```javascript
// Save snapshot with metadata
await this.dataStorage.saveSnapshot({
    id: Date.now().toString(),
    imageData: canvas.toDataURL('image/png'),
    emotions: emotions,
    metadata: metadata,
    timestamp: new Date(),
    detections: detections
});
```

## UI Components

### Snapshot Section
- **Header**: Judul dan kontrol snapshot
- **Image Container**: Area preview snapshot
- **Metadata Panel**: Informasi detail snapshot
- **Action Buttons**: Download, delete, share

### Snapshot History Modal
- **Header**: Judul dan tombol close
- **Statistics**: Jumlah snapshot dan tombol clear all
- **Grid Layout**: Tampilan grid responsive
- **Empty State**: Tampilan ketika tidak ada snapshot

### Share Modal
- **Share Options**: Clipboard, Email, Social Media, WhatsApp
- **Responsive Design**: Adaptif untuk mobile dan desktop

## CSS Styling

### Responsive Design
- **Mobile First**: Optimized untuk perangkat mobile
- **Grid Layout**: CSS Grid untuk layout yang fleksibel
- **Animations**: Smooth animations dan transitions
- **Loading States**: Visual feedback saat processing

### Color Scheme
- **Primary**: #667eea (Blue)
- **Success**: #10b981 (Green)
- **Warning**: #f59e0b (Orange)
- **Error**: #ef4444 (Red)
- **Neutral**: #64748b (Gray)

## Data Structure

### Snapshot Object
```javascript
{
    id: "timestamp",
    imageData: "data:image/png;base64,...",
    emotions: {
        happy: 0.8,
        sad: 0.1,
        angry: 0.05,
        // ... other emotions
    },
    metadata: {
        faceDetected: true,
        detectionConfidence: 95,
        imageQuality: {
            level: "excellent",
            score: 95,
            brightness: 120,
            contrast: 45
        },
        facePosition: {
            x: 100,
            y: 50,
            width: 200,
            height: 200
        },
        imageDimensions: {
            width: 640,
            height: 480
        },
        dominantEmotion: {
            name: "happy",
            value: 0.8
        },
        timestamp: "2024-01-01T12:00:00.000Z"
    },
    timestamp: "2024-01-01T12:00:00.000Z",
    detections: "face-api.js detection object"
}
```

## Performance Optimizations

### Storage Management
- **Limit Snapshots**: Maksimal 50 snapshot untuk mencegah overflow
- **Image Compression**: Optimasi ukuran gambar
- **Lazy Loading**: Load thumbnail saat dibutuhkan

### Memory Management
- **Canvas Cleanup**: Bersihkan canvas setelah digunakan
- **Event Listener Cleanup**: Hapus event listener yang tidak digunakan
- **Modal Cleanup**: Hapus modal dari DOM setelah ditutup

## Error Handling

### Camera Access
- **Permission Denied**: Pesan error yang informatif
- **Device Not Found**: Fallback untuk perangkat tanpa kamera
- **Stream Error**: Handle error saat mengakses stream

### Face Detection
- **No Face Detected**: Pesan warning yang jelas
- **Model Loading Error**: Fallback jika model gagal dimuat
- **Analysis Error**: Handle error saat analisis

### Storage
- **Quota Exceeded**: Handle storage limit
- **Corrupted Data**: Handle data yang rusak
- **Save Error**: Handle error saat menyimpan

## Browser Compatibility

### Supported Browsers
- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

### Required APIs
- **getUserMedia**: Camera access
- **Canvas API**: Image processing
- **localStorage**: Data storage
- **Web Share API**: Native sharing (optional)

## Usage Examples

### Basic Snapshot Capture
```javascript
// Start camera
await emotionInput.startVideo();

// Take snapshot
await emotionInput.takeSnapshot();

// View results
emotionInput.showResultsSection();
```

### Access Snapshot History
```javascript
// Show history modal
emotionInput.showSnapshotHistory();

// View specific snapshot
emotionInput.viewSnapshot(snapshotId);

// Download snapshot
emotionInput.downloadSnapshotFromHistory(snapshotId);
```

### Share Snapshot
```javascript
// Share using native API
emotionInput.shareSnapshot();

// Share to specific platform
emotionInput.shareToEmail();
emotionInput.shareToWhatsApp();
```

## Future Enhancements

### Planned Features
- **Batch Operations**: Operasi batch untuk multiple snapshots
- **Advanced Filters**: Filter berdasarkan emosi, tanggal, kualitas
- **Export Options**: Export ke PDF, CSV, atau format lain
- **Cloud Storage**: Sync ke cloud storage
- **AI Improvements**: Model AI yang lebih akurat
- **Video Snapshots**: Capture video dengan analisis emosi

### Performance Improvements
- **Web Workers**: Background processing
- **Service Workers**: Offline functionality
- **IndexedDB**: Better storage for large data
- **WebAssembly**: Faster image processing

## Troubleshooting

### Common Issues
1. **Camera not working**: Check permissions and browser compatibility
2. **Face not detected**: Ensure good lighting and face positioning
3. **Slow performance**: Check device capabilities and close other tabs
4. **Storage full**: Clear old snapshots or increase storage limit

### Debug Mode
Enable debug mode by adding `?debug=true` to URL for detailed logging and error information.

## Conclusion

Fitur snapshot yang disempurnakan memberikan pengalaman yang komprehensif untuk menangkap, menganalisis, dan mengelola snapshot emosi. Integrasi dengan Face-api.js memastikan deteksi wajah yang akurat, sementara UI yang responsif dan intuitif memudahkan pengguna dalam menggunakan fitur-fitur yang tersedia. 