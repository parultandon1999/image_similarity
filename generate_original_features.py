#!/usr/bin/env python
"""
Script to pre-compute features for the original 50 images.
Run this once before deployment to create original_features.npy and original_filenames.npy
"""

import os
import numpy as np
from tensorflow.keras.applications.resnet50 import ResNet50, preprocess_input
from tensorflow.keras.preprocessing import image

# Configuration
image_dir = "images"
ORIGINAL_IMAGES_COUNT = 50

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'bmp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_features(img_path):
    """Extract ResNet50 features from an image"""
    model = ResNet50(weights='imagenet', include_top=False, pooling='avg')
    img = image.load_img(img_path, target_size=(224, 224))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    feature = model.predict(x, verbose=0)
    return feature.flatten()

def generate_original_features():
    """Generate and save features for the original 50 images"""
    
    if not os.path.exists(image_dir):
        print(f"Error: {image_dir} directory not found")
        return False
    
    # Get all image files
    all_images = sorted([f for f in os.listdir(image_dir) if allowed_file(f)])
    original_images = all_images[:ORIGINAL_IMAGES_COUNT]
    
    if len(original_images) == 0:
        print("Error: No images found in the images directory")
        return False
    
    print(f"Found {len(original_images)} original images")
    print("Generating features... This may take a few minutes.")
    
    features = []
    model = ResNet50(weights='imagenet', include_top=False, pooling='avg')
    
    for idx, img_name in enumerate(original_images):
        try:
            path = os.path.join(image_dir, img_name)
            img = image.load_img(path, target_size=(224, 224))
            x = image.img_to_array(img)
            x = np.expand_dims(x, axis=0)
            x = preprocess_input(x)
            feat = model.predict(x, verbose=0)
            features.append(feat.flatten())
            
            progress = int((idx + 1) / len(original_images) * 100)
            print(f"[{progress}%] Processed {img_name}")
        except Exception as e:
            print(f"Error processing {img_name}: {e}")
    
    if len(features) == 0:
        print("Error: Failed to extract features from any images")
        return False
    
    # Save features
    feature_array = np.array(features)
    np.save('original_features.npy', feature_array)
    np.save('original_filenames.npy', np.array(original_images))
    
    print(f"\nSuccess! Generated features for {len(original_images)} images")
    print(f"Saved: original_features.npy ({feature_array.shape})")
    print(f"Saved: original_filenames.npy")
    print("\nYou can now deploy the project with these files.")
    return True

if __name__ == '__main__':
    generate_original_features()
