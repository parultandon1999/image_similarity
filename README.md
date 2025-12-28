Image Similarity Search

A web application that allows you to build an image database and find visually similar images using deep learning. Upload reference images, generate feature vectors using ResNet50, and search for similar images in your library using cosine similarity.

Features

- Image Gallery Management: Upload, view, and manage your image library with a responsive grid interface
- Feature Generation: Extract deep learning features from images using ResNet50 pre-trained model
- Similarity Search: Upload a query image and find the most similar images from your database
- Batch Operations: Select and delete multiple images at once
- Lazy Loading: Optimized image loading with intersection observer for better performance
- Responsive Design: Works seamlessly on desktop and mobile devices
- Real-time Progress: Stream-based feature generation with live progress updates

Technology Stack

Backend:
- Flask 2.3.3: Web framework
- TensorFlow 2.13.0: Deep learning framework with ResNet50 model
- scikit-learn 1.3.0: Machine learning utilities for cosine similarity
- NumPy 1.24.3: Numerical computing
- Werkzeug 2.3.7: WSGI utilities for secure file handling

Frontend:
- HTML5 with semantic markup
- CSS3 with CSS variables for theming
- Vanilla JavaScript with modern APIs (Fetch, IntersectionObserver)
- Material Icons for UI elements

Project Structure

```
.
├── app.py                 # Flask application and API endpoints
├── requirements.txt       # Python dependencies
├── templates/
│   ├── index.html        # Main HTML template
│   ├── style.css         # Styling and responsive design
│   └── script.js         # Frontend logic and interactions
├── images/               # Directory for storing uploaded images
├── uploads/              # Temporary directory for search uploads
└── features.npy          # Cached feature vectors (generated)
    filenames.npy         # Cached image filenames (generated)
```

Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd image-similarity-search
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

Usage

1. Start the Flask application:
```bash
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

3. Use the Gallery tab to:
   - Upload images by dragging and dropping or clicking the upload area
   - View all images in your library
   - Delete individual images or select multiple for batch deletion
   - Generate feature vectors by clicking "Generate Features"

4. Use the Search tab to:
   - Upload a reference image
   - Click "Search" to find similar images
   - View results with similarity scores
   - Click on results to view full-size images

API Endpoints

GET /
Returns the main HTML page.

GET /api/images
Returns a list of all images in the library.

POST /api/upload-image
Uploads a new image to the library.
- Accepts: multipart/form-data with 'file' field
- Supported formats: jpg, jpeg, png, gif, bmp
- Max file size: 16MB

DELETE /api/delete-image/<filename>
Deletes an image from the library.

POST /api/generate-features
Generates feature vectors for all images in the library.
- Returns: Server-sent events stream with progress updates
- Extracts ResNet50 features and caches them

GET /api/check-features
Checks if feature vectors have been generated.

POST /api/search
Searches for similar images.
- Accepts: multipart/form-data with 'file' field
- Returns: Top 6 most similar images with similarity scores

GET /images/<filename>
Serves full-size images with caching headers.

GET /images/thumb/<filename>
Serves thumbnail versions of images (200x200px).

How It Works

1. Feature Extraction: When you generate features, the application loads the ResNet50 model pre-trained on ImageNet and extracts the final average-pooled layer (2048-dimensional vectors) for each image.

2. Similarity Calculation: For a query image, the same feature extraction process is applied, and cosine similarity is computed between the query features and all cached features.

3. Results: The top 6 most similar images are returned with their similarity scores (0-1 range, where 1 is identical).

4. Caching: Feature vectors are cached in .npy files to avoid recomputation on subsequent searches.

Configuration

File Upload Limits:
- Maximum file size: 16MB (configurable in app.py)
- Allowed formats: jpg, jpeg, png, gif, bmp

Image Processing:
- Target size for feature extraction: 224x224 pixels
- Thumbnail size: 200x200 pixels
- Thumbnail quality: 75% JPEG compression

Performance Considerations

- Feature generation is computationally intensive. For large image libraries (100+ images), this may take several minutes.
- Features are cached after generation for fast subsequent searches.
- Lazy loading is used for images to reduce initial page load time.
- Virtual scrolling optimizes gallery rendering for large collections.

Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires JavaScript enabled

Troubleshooting

Feature generation fails:
- Ensure all images are valid and not corrupted
- Check that you have sufficient disk space
- Verify TensorFlow is properly installed

Search returns no results:
- Generate features first from the Gallery tab
- Ensure images are in supported formats

Images not displaying:
- Check browser console for errors
- Verify images are in the images/ directory
- Clear browser cache and reload

License

This project is provided as-is for educational and personal use.

Contributing

Contributions are welcome. Please ensure code follows the existing style and test thoroughly before submitting.
