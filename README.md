# Image Similarity Search

A web application that allows you to build an image database and find visually similar images using deep learning. Upload reference images, generate feature vectors using ResNet50, and search for similar images in your library using cosine similarity.

## Features

- Image Gallery Management: Upload, view, and manage your image library with a responsive grid interface
- Feature Generation: Extract deep learning features from images using ResNet50 pre-trained model
- Similarity Search: Upload a query image or choose from library to find the most similar images from your database
- Batch Operations: Select and delete multiple images at once
- Lazy Loading: Optimized image loading with intersection observer for better performance
- Responsive Design: Works seamlessly on desktop and mobile devices
- Real-time Progress: Stream-based feature generation with live progress updates
- Protected Original Images: Default images cannot be deleted; only user-uploaded images can be managed
- Toast Notifications: Real-time feedback for upload, delete, and search operations
- Dual Search Modes: Upload new images or choose from existing library for similarity search

## Technology Stack

### Backend
- Flask 2.3.3: Web framework
- TensorFlow 2.13.0: Deep learning framework with ResNet50 model
- scikit-learn 1.3.0: Machine learning utilities for cosine similarity
- NumPy 1.24.3: Numerical computing
- Werkzeug 2.3.7: WSGI utilities for secure file handling

### Frontend
- HTML5 with semantic markup
- CSS3 with CSS variables for theming
- Vanilla JavaScript with modern APIs (Fetch, IntersectionObserver)
- Material Icons for UI elements

## Project Structure

```
.
├── app.py                      # Flask application and API endpoints
├── requirements.txt            # Python dependencies
├── generate_original_features.py # Script to pre-compute original image features
├── templates/
│   ├── index.html             # Main HTML template
│   ├── style.css              # Styling and responsive design
│   └── script.js              # Frontend logic and interactions
├── images/                     # Directory for storing images (50 original + user uploads)
├── uploads/                    # Temporary directory for search uploads
├── original_features.npy       # Pre-computed features for original images (deployment)
├── original_filenames.npy      # Original image filenames (deployment)
├── features.npy                # User-uploaded image features (generated)
├── filenames.npy               # User-uploaded image filenames (generated)
├── README.md                   # This file
├── DEPLOYMENT_GUIDE.md         # Detailed deployment instructions
└── .gitignore                  # Git ignore rules
```

## Installation

### Prerequisites
- Python 3.7 or higher
- pip package manager
- Virtual environment (recommended)

### Setup Steps

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

## Deployment with Pre-computed Features

For deployment with the default 50 images, follow these steps:

### Step 1: Pre-compute Original Features

Run the feature generation script once before deployment:

```bash
python generate_original_features.py
```

This will:
- Process all 50 original images
- Extract ResNet50 features for each image
- Save `original_features.npy` and `original_filenames.npy`
- Display progress as it processes each image

### Step 2: Verify Files

Ensure these files were created:
```bash
ls -la original_features.npy original_filenames.npy
```

### Step 3: Deploy

Deploy the project with these files included:
- `original_features.npy` - Pre-computed features
- `original_filenames.npy` - Original image list
- `images/` - Directory with 50 original images
- All other project files

## Usage

### Running the Application

1. Start the Flask application:
```bash
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

### Gallery Tab

- Upload images by dragging and dropping or clicking the upload area
- Supported formats: PNG, JPG, GIF, BMP
- Maximum file size: 16MB per image
- View all images in your library
- Original images are marked with "Original" badge and cannot be deleted
- Delete individual images or select multiple for batch deletion
- Generate feature vectors by clicking "Generate Features"
- Real-time toast notifications show upload and delete progress

### Search Tab

Two search modes available:

1. Upload Image Mode:
   - Upload a new reference image
   - Click "Search" to find similar images
   - View results with similarity scores

2. Choose from Library Mode:
   - Select an image from your existing library
   - Click "Search" to find similar images
   - View results with similarity scores

Results show:
- Top 6 most similar images
- Similarity scores (0-1 range, where 1 is identical)
- Thumbnail previews
- Click on results to view full-size images

## API Endpoints

### GET /
Returns the main HTML page.

### GET /api/images
Returns a list of all images in the library with original image markers.

Response:
```json
{
  "images": ["image1.jpg", "image2.jpg", ...],
  "original_images": ["1_1.jpg", "1_2.jpg", ...]
}
```

### POST /api/upload-image
Uploads a new image to the library.

Parameters:
- file: Image file (multipart/form-data)

Supported formats: jpg, jpeg, png, gif, bmp
Max file size: 16MB

Response:
```json
{
  "success": true,
  "filename": "uploaded_image.jpg"
}
```

### DELETE /api/delete-image/<filename>
Deletes a user-uploaded image from the library.

Returns 403 error if attempting to delete original images.

Response:
```json
{
  "success": true
}
```

### POST /api/generate-features
Generates feature vectors for user-uploaded images.

Returns: Server-sent events stream with progress updates

Progress event:
```json
{
  "progress": 50,
  "current": 5,
  "total": 10
}
```

Completion event:
```json
{
  "complete": true,
  "count": 10,
  "original_count": 50
}
```

### GET /api/check-features
Checks if feature vectors are available (original or user-generated).

Response:
```json
{
  "exists": true
}
```

### POST /api/search
Searches for similar images across both original and user-uploaded images.

Parameters:
- file: Query image file (multipart/form-data)

Response:
```json
{
  "results": [
    {
      "filename": "similar_image.jpg",
      "similarity": 0.95,
      "image_url": "/images/similar_image.jpg"
    },
    ...
  ]
}
```

### GET /images/<filename>
Serves full-size images with caching headers.

### GET /images/thumb/<filename>
Serves thumbnail versions of images (200x200px).

## How It Works

### Feature Extraction

When you generate features, the application:
1. Loads the ResNet50 model pre-trained on ImageNet
2. Extracts the final average-pooled layer (2048-dimensional vectors) for each image
3. Saves features to disk for fast retrieval

### Similarity Calculation

For a query image:
1. Extract features using the same ResNet50 model
2. Compute cosine similarity between query features and all cached features
3. Return top 6 most similar images sorted by similarity score

### Feature Management

The system maintains two separate feature sets:

- **Original Features** (original_features.npy, original_filenames.npy):
  - Pre-computed before deployment
  - Read-only and never modified
  - Always available for search

- **User Features** (features.npy, filenames.npy):
  - Generated on-demand when user clicks "Generate Features"
  - Only includes user-uploaded images
  - Updated when images are deleted

### Search Process

When searching:
1. Load both original and user features
2. Merge features for similarity comparison
3. Return top 6 results from combined set
4. Results include images from both original and user sets

## Configuration

### File Upload Limits
- Maximum file size: 16MB (configurable in app.py line 13)
- Allowed formats: jpg, jpeg, png, gif, bmp

### Image Processing
- Target size for feature extraction: 224x224 pixels
- Thumbnail size: 200x200 pixels
- Thumbnail quality: 75% JPEG compression

### Original Images
- First 50 images in sorted order are treated as original
- Original images cannot be deleted
- Original features are pre-computed and never regenerated

## Performance Considerations

- Feature generation is computationally intensive. For large image libraries (100+ images), this may take several minutes.
- Original features are pre-computed and cached, so they load instantly.
- User features are cached after generation for fast subsequent searches.
- Lazy loading is used for images to reduce initial page load time.
- Virtual scrolling optimizes gallery rendering for large collections.
- Thumbnail generation uses PIL for efficient image resizing.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires JavaScript enabled
- Requires modern CSS Grid and Flexbox support

## Troubleshooting

### Feature generation fails
- Ensure all images are valid and not corrupted
- Check that you have sufficient disk space
- Verify TensorFlow is properly installed
- Check console for specific error messages

### Search returns no results
- Generate features first from the Gallery tab
- Ensure images are in supported formats
- Verify original_features.npy exists if using pre-computed features

### Images not displaying
- Check browser console for errors (F12)
- Verify images are in the images/ directory
- Clear browser cache and reload (Ctrl+Shift+Delete)
- Check file permissions on image files

### Cannot delete images
- Original images (marked with "Original" badge) cannot be deleted
- Only user-uploaded images can be deleted
- Check browser console for error messages

### Upload fails
- Check file size (max 16MB)
- Verify file format is supported
- Check disk space availability
- Ensure uploads/ directory exists and is writable

### Slow performance
- Feature generation is normal for first run
- Reduce number of images in library
- Close other applications to free up memory
- Consider using SSD for faster disk I/O

## File Descriptions

### app.py
Main Flask application containing:
- Route handlers for all API endpoints
- Feature extraction and similarity search logic
- Image upload and deletion handlers
- Feature generation with streaming progress
- Original image protection logic

### templates/index.html
HTML template containing:
- Page structure and layout
- Tab navigation (Gallery and Search)
- Upload areas and file inputs
- Gallery grid and search results display
- Modal for full-size image viewing
- Getting started instructions

### templates/style.css
Stylesheet containing:
- CSS variables for theming
- Responsive grid layouts
- Material Design inspired styling
- Animation and transition effects
- Mobile-responsive breakpoints
- Accessibility considerations

### templates/script.js
JavaScript containing:
- Gallery management (load, upload, delete)
- Search functionality (upload and library modes)
- Feature generation with progress tracking
- Toast notifications for user feedback
- Modal image viewing
- Lazy loading with IntersectionObserver
- Virtual scrolling for performance

### generate_original_features.py
Utility script for:
- Pre-computing features for original images
- Batch processing with progress display
- Saving features to .npy files
- Validation and error handling

## Security Considerations

- File uploads are validated for type and size
- Filenames are sanitized using secure_filename
- Original images are protected from deletion
- Feature files are stored locally (not in version control)
- Consider adding authentication for production use
- Use HTTPS in production environments

## Development Notes

### Adding New Features
- Modify app.py for backend changes
- Update templates/script.js for frontend changes
- Update templates/style.css for styling changes
- Test thoroughly before deployment

### Debugging
- Enable Flask debug mode for development
- Check browser console (F12) for JavaScript errors
- Check Flask console for Python errors
- Use print statements in Python for debugging
- Use console.log in JavaScript for debugging

### Performance Optimization
- Consider using a production WSGI server (Gunicorn, uWSGI)
- Implement caching headers for static files
- Consider using a CDN for image delivery
- Optimize image sizes before upload
- Consider using GPU acceleration for feature extraction

## License

This project is provided as-is for educational and personal use.

## Contributing

Contributions are welcome. Please ensure code follows the existing style and test thoroughly before submitting.

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review the DEPLOYMENT_GUIDE.md for deployment-specific issues
3. Check browser console for error messages
4. Review Flask console output for server errors

## Version History

- v1.0.0: Initial release with core functionality
- Features: Gallery management, feature generation, similarity search
- Improvements: Toast notifications, dual search modes, protected original images
