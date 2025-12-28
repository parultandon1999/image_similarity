from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import numpy as np
from tensorflow.keras.applications.resnet50 import ResNet50, preprocess_input
from tensorflow.keras.preprocessing import image
from sklearn.metrics.pairwise import cosine_similarity
import os
from pathlib import Path

app = Flask(__name__, static_folder='templates', static_url_path='')
app.config['UPLOAD_FOLDER'] = os.environ.get('UPLOAD_FOLDER', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'bmp'}

# Create uploads folder if it doesn't exist
Path(app.config['UPLOAD_FOLDER']).mkdir(exist_ok=True)

# Load model and features
model = ResNet50(weights='imagenet', include_top=False, pooling='avg')

image_dir = "images"

features = None
filenames = None
original_features = None
original_filenames = None

# Original images that cannot be deleted (first 50 images)
ORIGINAL_IMAGES_COUNT = 50

def get_original_images():
    """Get list of original images that cannot be deleted"""
    if not os.path.exists(image_dir):
        return []
    
    all_images = sorted([f for f in os.listdir(image_dir) if allowed_file(f)])
    # Return the first 50 images as original
    return all_images[:ORIGINAL_IMAGES_COUNT]

def load_features():
    global features, filenames, original_features, original_filenames
    
    # Load original features (pre-computed, never changes)
    if os.path.exists("original_features.npy") and os.path.exists("original_filenames.npy"):
        original_features = np.load("original_features.npy")
        original_filenames = np.load("original_filenames.npy")
    else:
        original_features = None
        original_filenames = None
    
    # Load user-uploaded features
    if not os.path.exists("features.npy") or not os.path.exists("filenames.npy"):
        features = None
        filenames = None
    else:
        features = np.load("features.npy")
        filenames = np.load("filenames.npy")

load_features()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_features(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    feature = model.predict(x, verbose=0)
    return feature.flatten()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/images')
def get_images():
    try:
        if not os.path.exists(image_dir):
            return jsonify({'images': [], 'original_images': []})
        
        image_files = [f for f in os.listdir(image_dir) if allowed_file(f)]
        image_files = sorted(image_files)
        
        original_images = get_original_images()
        
        # Sort: new images first, then original images
        new_images = [f for f in image_files if f not in original_images]
        sorted_images = new_images + original_images
        
        return jsonify({
            'images': sorted_images,
            'original_images': original_images
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        Path(image_dir).mkdir(exist_ok=True)
        filename = secure_filename(file.filename)
        filepath = os.path.join(image_dir, filename)
        file.save(filepath)
        
        return jsonify({'success': True, 'filename': filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-image/<filename>', methods=['DELETE'])
def delete_image(filename):
    try:
        global features, filenames
        
        filename = secure_filename(filename)
        
        # Check if this is an original image
        original_images = get_original_images()
        if filename in original_images:
            return jsonify({'error': 'Cannot delete original images'}), 403
        
        filepath = os.path.join(image_dir, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        os.remove(filepath)
        
        # If the deleted image was in the user features, remove it
        if filenames is not None and filename in filenames:
            # Remove from features and filenames
            idx = np.where(filenames == filename)[0]
            if len(idx) > 0:
                features = np.delete(features, idx[0], axis=0)
                filenames = np.delete(filenames, idx[0])
                
                # Save updated features
                if len(filenames) > 0:
                    np.save("features.npy", features)
                    np.save("filenames.npy", filenames)
                else:
                    # If no user images left, remove user feature files
                    if os.path.exists("features.npy"):
                        os.remove("features.npy")
                    if os.path.exists("filenames.npy"):
                        os.remove("filenames.npy")
                    features = None
                    filenames = None
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-features', methods=['POST'])
def generate_features():
    try:
        from flask import Response
        import json
        
        if not os.path.exists(image_dir):
            return jsonify({'error': 'Images directory not found'}), 400
        
        all_img_files = sorted([f for f in os.listdir(image_dir) if allowed_file(f)])
        original_images = get_original_images()
        
        # Only generate features for new (non-original) images
        new_img_files = [f for f in all_img_files if f not in original_images]
        
        if not new_img_files and not original_images:
            return jsonify({'error': 'No images found in directory'}), 400
        
        def generate():
            global features, filenames, original_features, original_filenames
            
            # Load original features if they exist
            load_features()
            
            image_names = []
            feature_list = []
            total = len(new_img_files)
            
            for idx, img_name in enumerate(new_img_files):
                path = os.path.join(image_dir, img_name)
                if os.path.isfile(path):
                    try:
                        feat = extract_features(path)
                        feature_list.append(feat)
                        image_names.append(img_name)
                    except Exception as e:
                        print(f"Error processing {img_name}: {e}")
                
                progress = int((idx + 1) / total * 100) if total > 0 else 100
                data = {'progress': progress, 'current': idx + 1, 'total': total}
                yield f"data: {json.dumps(data)}\n\n"
            
            if feature_list or original_images:
                # Save new user features
                if feature_list:
                    feature_array = np.array(feature_list)
                    np.save("features.npy", feature_array)
                    np.save("filenames.npy", np.array(image_names))
                    features = feature_array
                    filenames = np.array(image_names)
                else:
                    # No new images, clear user features
                    features = None
                    filenames = None
                    if os.path.exists("features.npy"):
                        os.remove("features.npy")
                    if os.path.exists("filenames.npy"):
                        os.remove("filenames.npy")
                
                data = {'complete': True, 'count': len(image_names), 'original_count': len(original_images)}
                yield f"data: {json.dumps(data)}\n\n"
            else:
                data = {'error': 'Failed to extract features from any images'}
                yield f"data: {json.dumps(data)}\n\n"
        
        return Response(generate(), mimetype='text/event-stream', headers={'X-Accel-Buffering': 'no'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/check-features')
def check_features():
    load_features()
    # Features exist if either original features or user features exist
    has_features = (original_features is not None and original_filenames is not None) or \
                   (features is not None and filenames is not None)
    return jsonify({'exists': has_features})

@app.route('/api/search', methods=['POST'])
def search():
    load_features()
    
    # Merge original and user features
    all_features = None
    all_filenames = None
    
    if original_features is not None and original_filenames is not None:
        all_features = original_features
        all_filenames = original_filenames
    
    if features is not None and filenames is not None:
        if all_features is not None:
            all_features = np.vstack([all_features, features])
            all_filenames = np.concatenate([all_filenames, filenames])
        else:
            all_features = features
            all_filenames = filenames
    
    if all_features is None or all_filenames is None:
        return jsonify({'error': 'Feature files not found. Please generate features first from the Gallery tab.'}), 400
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Ensure upload folder exists
        Path(app.config['UPLOAD_FOLDER']).mkdir(exist_ok=True)
        
        file.save(filepath)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Failed to save uploaded file'}), 500
        
        query_features = extract_features(filepath)
        similarities = cosine_similarity([query_features], all_features)[0]
        
        sorted_indices = np.argsort(similarities)[::-1]
        top_n = 6
        sorted_filenames = all_filenames[sorted_indices][:top_n]
        sorted_scores = similarities[sorted_indices][:top_n]
        
        results = []
        for name, score in zip(sorted_filenames, sorted_scores):
            results.append({
                'filename': str(name),
                'similarity': float(score),
                'image_url': f'/images/{name}'
            })
        
        # Clean up uploaded file
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify({'results': results})
    
    except Exception as e:
        return jsonify({'error': f'Search error: {str(e)}'}), 500

@app.route('/images/<filename>')
def serve_image(filename):
    from flask import make_response
    response = make_response(send_from_directory(image_dir, filename))
    response.headers['Cache-Control'] = 'public, max-age=31536000'  # 1 year cache
    response.headers['ETag'] = filename
    return response

@app.route('/images/thumb/<filename>')
def serve_thumb(filename):
    from flask import make_response
    from PIL import Image
    import io
    
    try:
        filename = secure_filename(filename)
        filepath = os.path.join(image_dir, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        # Open and resize image
        img = Image.open(filepath)
        img.thumbnail((200, 200), Image.Resampling.LANCZOS)
        
        # Save to bytes
        img_io = io.BytesIO()
        img.save(img_io, 'JPEG', quality=75, optimize=True)
        img_io.seek(0)
        
        response = make_response(img_io.getvalue())
        response.headers['Content-Type'] = 'image/jpeg'
        response.headers['Cache-Control'] = 'public, max-age=31536000'
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
