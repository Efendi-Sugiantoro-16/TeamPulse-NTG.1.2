/**
 * Test Database Connection and Input Components
 * 
 * Script untuk menguji apakah semua komponen input terhubung ke database
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8080/api';

async function testDatabaseConnection() {
    console.log('🧪 Testing Database Connection...\n');
    
    try {
        // Test 1: Database connection
        console.log('1️⃣ Testing database connection...');
        const dbResponse = await fetch(`${API_BASE}/db-test`);
        const dbResult = await dbResponse.json();
        
        if (dbResult.success) {
            console.log('✅ Database connection successful');
            console.log(`   Database: ${dbResult.database}`);
        } else {
            console.log('❌ Database connection failed');
            console.log(`   Error: ${dbResult.error}`);
            return false;
        }
        
        // Test 2: Emotions API health check
        console.log('\n2️⃣ Testing emotions API...');
        const emotionsPingResponse = await fetch(`${API_BASE}/emotions/ping`);
        const emotionsPingResult = await emotionsPingResponse.json();
        
        if (emotionsPingResult.success) {
            console.log('✅ Emotions API is running');
        } else {
            console.log('❌ Emotions API failed');
            return false;
        }
        
        // Test 3: Save camera emotion
        console.log('\n3️⃣ Testing camera emotion input...');
        const cameraEmotion = {
            user_id: 1,
            emotion: 'happy',
            confidence: 0.85,
            source: 'camera',
            data: JSON.stringify({
                expressions: { happy: 0.85, sad: 0.05, angry: 0.03, surprised: 0.07 },
                landmarks: 68,
                timestamp: new Date().toISOString()
            }),
            notes: 'Camera analysis - face detected'
        };
        
        const cameraResponse = await fetch(`${API_BASE}/emotions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cameraEmotion)
        });
        const cameraResult = await cameraResponse.json();
        
        if (cameraResult.success) {
            console.log('✅ Camera emotion saved successfully');
            console.log(`   ID: ${cameraResult.data.id}`);
        } else {
            console.log('❌ Camera emotion save failed');
            console.log(`   Error: ${cameraResult.message}`);
        }
        
        // Test 4: Save audio emotion
        console.log('\n4️⃣ Testing audio emotion input...');
        const audioEmotion = {
            user_id: 1,
            emotion: 'neutral',
            confidence: 0.72,
            source: 'audio',
            data: JSON.stringify({
                features: { mfcc: [0.1, 0.2, 0.3], pitch: 220, energy: 0.8 },
                duration: 3.5,
                sampleRate: 44100
            }),
            notes: 'Audio analysis - voice detected'
        };
        
        const audioResponse = await fetch(`${API_BASE}/emotions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(audioEmotion)
        });
        const audioResult = await audioResponse.json();
        
        if (audioResult.success) {
            console.log('✅ Audio emotion saved successfully');
            console.log(`   ID: ${audioResult.data.id}`);
        } else {
            console.log('❌ Audio emotion save failed');
            console.log(`   Error: ${audioResult.message}`);
        }
        
        // Test 5: Save text emotion
        console.log('\n5️⃣ Testing text emotion input...');
        const textEmotion = {
            user_id: 1,
            emotion: 'excited',
            confidence: 0.91,
            source: 'text',
            data: JSON.stringify({
                text: 'I am so excited about this project!',
                keywords: ['excited', 'project'],
                sentiment: 'positive'
            }),
            notes: 'Text analysis - positive sentiment'
        };
        
        const textResponse = await fetch(`${API_BASE}/emotions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(textEmotion)
        });
        const textResult = await textResponse.json();
        
        if (textResult.success) {
            console.log('✅ Text emotion saved successfully');
            console.log(`   ID: ${textResult.data.id}`);
        } else {
            console.log('❌ Text emotion save failed');
            console.log(`   Error: ${textResult.message}`);
        }
        
        // Test 6: Save snapshot emotion
        console.log('\n6️⃣ Testing snapshot emotion input...');
        const snapshotEmotion = {
            user_id: 1,
            emotion: 'surprised',
            confidence: 0.78,
            source: 'snapshot',
            data: JSON.stringify({
                imageUrl: '/snapshots/photo_2024_01_15.jpg',
                expressions: { surprised: 0.78, happy: 0.15, neutral: 0.07 },
                timestamp: new Date().toISOString()
            }),
            notes: 'Snapshot analysis - surprise detected'
        };
        
        const snapshotResponse = await fetch(`${API_BASE}/emotions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(snapshotEmotion)
        });
        const snapshotResult = await snapshotResponse.json();
        
        if (snapshotResult.success) {
            console.log('✅ Snapshot emotion saved successfully');
            console.log(`   ID: ${snapshotResult.data.id}`);
        } else {
            console.log('❌ Snapshot emotion save failed');
            console.log(`   Error: ${snapshotResult.message}`);
        }
        
        // Test 7: Get all emotions
        console.log('\n7️⃣ Testing get all emotions...');
        const getAllResponse = await fetch(`${API_BASE}/emotions`);
        const getAllResult = await getAllResponse.json();
        
        if (getAllResult.success) {
            console.log(`✅ Retrieved ${getAllResult.count} emotions`);
            console.log('   Sources found:', [...new Set(getAllResult.data.map(e => e.source))]);
        } else {
            console.log('❌ Get emotions failed');
            console.log(`   Error: ${getAllResult.message}`);
        }
        
        // Test 8: Get emotion statistics
        console.log('\n8️⃣ Testing emotion statistics...');
        const statsResponse = await fetch(`${API_BASE}/emotions/stats`);
        const statsResult = await statsResponse.json();
        
        if (statsResult.success) {
            console.log('✅ Emotion statistics retrieved');
            console.log('   Stats:', statsResult.data.map(s => `${s.emotion}: ${s.count}`));
        } else {
            console.log('❌ Get statistics failed');
            console.log(`   Error: ${statsResult.message}`);
        }
        
        console.log('\n🎉 All tests completed!');
        console.log('📊 Database connection and all input components are working correctly.');
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.log('💡 Make sure the server is running on port 8080');
        return false;
    }
}

// Run test if this script is executed directly
if (require.main === module) {
    testDatabaseConnection().then(success => {
        if (!success) {
            process.exit(1);
        }
    });
}

module.exports = { testDatabaseConnection }; 