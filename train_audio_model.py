import tensorflow as tf
import numpy as np
from tensorflow.keras import layers, models
import librosa
import os
import json

def create_model():
    model = models.Sequential([
        # First Convolutional Block
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=(128, 128, 1)),
        layers.MaxPooling2D((2, 2)),
        
        # Second Convolutional Block
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        
        # Third Convolutional Block
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        
        # Dense Layers
        layers.Flatten(),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(4, activation='softmax')  # 4 emotions: happy, sad, angry, neutral
    ])
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def extract_features(audio_path, sample_rate=16000, n_mels=128):
    # Load audio file
    audio, sr = librosa.load(audio_path, sr=sample_rate)
    
    # Extract mel spectrogram
    mel_spec = librosa.feature.melspectrogram(
        y=audio,
        sr=sample_rate,
        n_mels=n_mels,
        n_fft=1024,
        hop_length=512
    )
    
    # Convert to log scale
    mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
    
    # Normalize
    mel_spec_norm = (mel_spec_db - mel_spec_db.mean()) / mel_spec_db.std()
    
    # Resize to 128x128
    mel_spec_resized = tf.image.resize(
        mel_spec_norm[..., np.newaxis],
        (128, 128)
    )
    
    return mel_spec_resized

def prepare_dataset(data_dir):
    X = []
    y = []
    emotion_map = {
        'happy': 0,
        'sad': 1,
        'angry': 2,
        'neutral': 3
    }
    
    for emotion in emotion_map.keys():
        emotion_dir = os.path.join(data_dir, emotion)
        for audio_file in os.listdir(emotion_dir):
            if audio_file.endswith('.wav'):
                audio_path = os.path.join(emotion_dir, audio_file)
                features = extract_features(audio_path)
                X.append(features)
                y.append(emotion_map[emotion])
    
    X = np.array(X)
    y = tf.keras.utils.to_categorical(y, num_classes=4)
    
    return X, y

def train_model():
    # Create and compile model
    model = create_model()
    
    # Prepare dataset
    X_train, y_train = prepare_dataset('path/to/your/audio/dataset')
    
    # Train model
    history = model.fit(
        X_train, y_train,
        epochs=50,
        batch_size=32,
        validation_split=0.2
    )
    
    # Save model
    model.save('audio_emotion_model.h5')
    
    # Convert to TensorFlow.js format
    import tensorflowjs as tfjs
    tfjs.converters.save_keras_model(model, 'models/audio_emotion_model')

if __name__ == '__main__':
    train_model() 