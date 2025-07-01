# Troubleshooting Guide - EmotionController System

## Common Issues and Solutions

### 1. "Missing required dependencies" Error

**Error Message:**
```
Failed to initialize system: Missing required dependencies: UIManager, DataManager, CameraManager, AudioManager, TextAnalyzer, EmotionController
```

**Cause:**
- Script files not loaded in correct order
- Missing component files
- JavaScript errors preventing class definitions

**Solutions:**

#### A. Check File Structure
Ensure all component files exist:
```
js/
├── components/
│   ├── DataManager.js
│   ├── UIManager.js
│   ├── CameraManager.js
│   ├── AudioManager.js
│   └── TextAnalyzer.js
└── emotionController.js
```

#### B. Verify Script Loading Order
In your HTML file, ensure scripts are loaded in this exact order:

```html
<!-- 1. Load Dependencies -->
<script src="js/tf.min.js"></script>
<script src="models/face-api.min.js"></script>
<script src="js/meyda.min.js"></script>
<script src="js/hybridStorage.js"></script>
<script src="js/dataStorage.js"></script>

<!-- 2. Load Components -->
<script src="js/components/DataManager.js"></script>
<script src="js/components/UIManager.js"></script>
<script src="js/components/CameraManager.js"></script>
<script src="js/components/AudioManager.js"></script>
<script src="js/components/TextAnalyzer.js"></script>

<!-- 3. Load Controller -->
<script src="js/emotionController.js"></script>
```

#### C. Test Individual Components
Use the test file to verify each component:

```bash
# Open test-components.html in your browser
# Check browser console for detailed error messages
```

### 2. Component Initialization Errors

**Error Message:**
```
Component: Initialization failed - [specific error]
```

**Common Causes and Solutions:**

#### A. DataManager Issues
- **Problem:** localStorage not available
- **Solution:** Check if running in private/incognito mode
- **Fix:** Use fallback storage mechanism

#### B. UIManager Issues
- **Problem:** DOM elements not found
- **Solution:** Ensure HTML structure matches expected elements
- **Fix:** Check element IDs in HTML

#### C. CameraManager Issues
- **Problem:** face-api.js not loaded
- **Solution:** Ensure face-api.js is properly loaded
- **Fix:** Check model files exist in `models/` directory

#### D. AudioManager Issues
- **Problem:** Audio APIs not supported
- **Solution:** Check browser compatibility
- **Fix:** Use HTTPS or localhost (required for audio APIs)

#### E. TextAnalyzer Issues
- **Problem:** JavaScript syntax errors
- **Solution:** Check browser console for syntax errors
- **Fix:** Validate JavaScript syntax

### 3. Browser Compatibility Issues

**Supported Browsers:**
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

**Common Issues:**

#### A. Audio APIs
- **Problem:** Audio recording not working
- **Solution:** Use HTTPS or localhost
- **Fix:** Run on local web server

#### B. Camera APIs
- **Problem:** Camera access denied
- **Solution:** Grant camera permissions
- **Fix:** Check browser settings

#### C. localStorage
- **Problem:** Data not saving
- **Solution:** Check if localStorage is enabled
- **Fix:** Use fallback storage

### 4. File Loading Issues

**Error Message:**
```
Failed to load resource: net::ERR_FILE_NOT_FOUND
```

**Solutions:**

#### A. Check File Paths
Ensure all files exist in correct locations:
```
project/
├── js/
│   ├── components/
│   │   ├── DataManager.js
│   │   ├── UIManager.js
│   │   ├── CameraManager.js
│   │   ├── AudioManager.js
│   │   └── TextAnalyzer.js
│   └── emotionController.js
├── models/
│   ├── face-api.min.js
│   └── [model files]
└── emotion-input-new.html
```

#### B. Use Web Server
Don't open HTML files directly. Use a local web server:

**Python:**
```bash
python -m http.server 8000
```

**Node.js:**
```bash
npx http-server
```

**VS Code Live Server:**
- Install Live Server extension
- Right-click HTML file → "Open with Live Server"

### 5. Performance Issues

**Symptoms:**
- Slow initialization
- UI lag
- Memory leaks

**Solutions:**

#### A. Optimize Loading
- Load components on demand
- Use async/await properly
- Minimize blocking operations

#### B. Memory Management
- Properly destroy components
- Clear event listeners
- Clean up timers and intervals

#### C. Reduce Analysis Frequency
- Increase detection intervals
- Use requestAnimationFrame
- Implement throttling

### 6. Debugging Steps

#### Step 1: Check Browser Console
1. Open Developer Tools (F12)
2. Check Console tab for errors
3. Look for specific error messages

#### Step 2: Test Individual Components
```javascript
// Test in browser console
console.log('Testing components...');

// Check if classes are defined
console.log('DataManager:', typeof DataManager);
console.log('UIManager:', typeof UIManager);
console.log('CameraManager:', typeof CameraManager);
console.log('AudioManager:', typeof AudioManager);
console.log('TextAnalyzer:', typeof TextAnalyzer);
console.log('EmotionController:', typeof EmotionController);

// Test component creation
try {
    const dataManager = new DataManager();
    console.log('DataManager created successfully');
} catch (error) {
    console.error('DataManager creation failed:', error);
}
```

#### Step 3: Use Test Files
1. Open `test-components.html`
2. Check results
3. Look for specific failures

#### Step 4: Check Network Tab
1. Open Developer Tools
2. Go to Network tab
3. Refresh page
4. Look for failed requests

### 7. Common Fixes

#### A. Fix Script Loading Order
```html
<!-- WRONG ORDER -->
<script src="js/emotionController.js"></script>
<script src="js/components/DataManager.js"></script>

<!-- CORRECT ORDER -->
<script src="js/components/DataManager.js"></script>
<script src="js/emotionController.js"></script>
```

#### B. Fix Missing Dependencies
```javascript
// Add fallback for missing dependencies
if (typeof DataManager === 'undefined') {
    console.error('DataManager not loaded');
    // Implement fallback or show error
}
```

#### C. Fix Initialization Errors
```javascript
// Add proper error handling
try {
    await controller.init();
} catch (error) {
    console.error('Initialization failed:', error);
    // Show user-friendly error message
}
```

### 8. Getting Help

If you're still experiencing issues:

1. **Check the console** for specific error messages
2. **Use test files** to isolate the problem
3. **Verify file structure** matches expected layout
4. **Test in different browsers** to check compatibility
5. **Check network connectivity** for external dependencies

### 9. Fallback Mode

If the modular system fails, you can fall back to the legacy system:

```html
<!-- Use legacy system as fallback -->
<script src="js/emotion-input.js"></script>
```

The legacy system is more monolithic but more stable for basic functionality.

---

**Note:** Most issues are related to script loading order or missing files. Always check the browser console first for specific error messages. 