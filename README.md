Image Similarity Search

A web application that allows users to build an image database and search for visually similar images using deep learning. The application uses ResNet50 neural network features and cosine similarity to find images that match a query image.

Table of Contents

- Overview
- Features
- Technology Stack
- Project Structure
- Installation
- Usage
- API Endpoints
- How It Works
- File Descriptions

Overview

This application provides a user-friendly interface for managing an image library and performing similarity searches. Users can upload images to build a database, generate feature vectors using a pre-trained ResNet50 model, and then search for similar images by uploading a query image. The system calculates cosine similarity between the query image features and all images in the database to find the most similar matches.

Features

Image Management
- Upload multiple images to the library at once
- View all images in a scrollable gallery grid
- Delete individual images or multiple selected images
- Delete all images from the library
- Lazy-loaded image thumbnails for performance
- Image preview modal with full-size viewing

Feature Generation
- Generate feature vectors for all images in the library using ResNet50
- Real-time progress tracking during feature generation
- Automatic saving of features to disk for persistence
- Efficient batch processing of images

Image Search
- Upload a query image to search for similar images
- Get top 6 most similar images ranked by similarity score
- View similarity percentage for each result
- Visual similarity bar showing match strength
- Full-size image preview in modal

User Interface
- Clean, modern Material Design interface
- Responsive layout that works on desktop and mobile
- Tab-based navigation between Gallery and Search sections
- Drag-and-drop file upload support
- Real-time feedback with toast notifications
- Error handling with user-friendly messages

Technology Stack

Backend
- Flask 2.3.3 - Web framework for Python
- TensorFlow 2.13.0 - Deep learning framework
- ResNet50 - Pre-trained convolutional neural network for feature extraction
- scikit-learn 1.3.0 - Machine learning library for similarity calculations
- Werkzeug 2.3.7 - WSGI utilities for file handling
- NumPy 1.24.3 - Numerical computing library

Frontend
- HTML5 - Markup structure
- CSS3 - Styling with CSS variables and Grid layout
- JavaScript (Vanilla) - Client-side interactivity
- Material Icons - Icon library
- Google Fonts (Roboto) - Typography

Project Structure

```
.
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── features.npy          # Saved feature vectors (generated)
├── filenames.npy         # Saved image filenames (generated)
├── images/               # Directory containing uploaded images
│   └── 1_1.jpg through 1_159.jpg  # Sample images
├── uploads/              # Temporary upload directory
├── templates/
│   ├── index.html        # Main HTML template
│   ├── style.css         # Stylesheet
│   └── script.js         # Client-side JavaScript
└── .vscode/              # VS Code configuration
```

Installation

Prerequisites
- Python 3.8 or higher
- pip package manager

Steps

1. Clone or download the project to your local machine

2. Navigate to the project directory
   ```
   cd image-similarity-search
   ```

3. Create a virtual environment (recommended)
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

4. Install dependencies
   ```
   pip install -r requirements.txt
   ```

5. Run the application
   ```
   python app.py
   ```

6. Open your browser and navigate to
   ```
   http://localhost:5000
   ```

Usage

Gallery Tab

1. Upload Images
   - Click the upload area or drag and drop image files
   - Supported formats: PNG, JPG, JPEG, GIF, BMP
   - Multiple files can be uploaded at once
   - Maximum file size: 16MB per image

2. View Library
   - Images appear in a grid layout
   - Hover over images to see filename
   - Click an image to view it in full size
   - Use the scrollbar to browse through images

3. Manage Images
   - Click the checkbox on an image to select it
   - Use "Delete Selected" to remove checked images
   - Use "Delete All" to remove all images from the library
   - Individual delete button appears on hover

4. Generate Features
   - Click "Generate Features" button
   - The system processes all images and extracts feature vectors
   - Progress is shown in real-time
   - Features are saved automatically for future searches
   - This step must be completed before searching

Search Tab

1. Upload Query Image
   - Click the upload area or drag and drop an image
   - The image preview appears on the right side
   - Only one image can be used for search at a time

2. Search for Similar Images
   - Click the "Search" button
   - The system analyzes the query image
   - Top 6 most similar images are displayed
   - Results show similarity percentage and visual bar

3. View Results
   - Results are ranked by similarity score (highest first)
   - Click any result image to view it in full size
   - Similarity percentage is displayed for each match
   - Use "Clear" button to reset and search again

API Endpoints

GET /
Returns the main HTML page

GET /api/images
Returns list of all image filenames in the library
Response: { "images": ["filename1.jpg", "filename2.jpg", ...] }

POST /api/upload-image
Uploads a single image to the library
Parameters: file (multipart form data)
Response: { "success": true, "filename": "uploaded_file.jpg" }

DELETE /api/delete-image/<filename>
Deletes an image from the library
Parameters: filename (URL parameter)
Response: { "success": true }

POST /api/generate-features
Generates feature vectors for all images using Server-Sent Events
Returns: Streaming progress updates with JSON data
Response format: { "progress": 0-100, "current": number, "total": number }
Final response: { "complete": true, "count": number }

GET /api/check-features
Checks if feature files exist
Response: { "exists": true/false }

POST /api/search
Searches for similar images to an uploaded query image
Parameters: file (multipart form data)
Response: { "results": [{ "filename": "...", "similarity": 0-1, "image_url": "..." }, ...] }

GET /images/<filename>
Serves full-size image from the library
Includes caching headers for performance

GET /images/thumb/<filename>
Serves thumbnail version of image (200x200 pixels)
Optimized JPEG with quality 75

How It Works

Feature Extraction

1. ResNet50 Model
   - Pre-trained on ImageNet dataset
   - Removes classification layer, uses average pooling
   - Outputs 2048-dimensional feature vector per image
   - Captures high-level visual characteristics

2. Image Processing
   - Images resized to 224x224 pixels (ResNet50 input size)
   - Normalized using ImageNet preprocessing
   - Features flattened to 1D vector

3. Feature Storage
   - Features saved as NumPy arrays in features.npy
   - Filenames saved in filenames.npy
   - Persistent storage for quick searches without reprocessing

Similarity Search

1. Query Processing
   - Query image processed same way as library images
   - Feature vector extracted using ResNet50

2. Similarity Calculation
   - Cosine similarity computed between query and all library features
   - Similarity ranges from 0 (completely different) to 1 (identical)
   - Formula: similarity = (A · B) / (||A|| * ||B||)

3. Ranking
   - Results sorted by similarity score in descending order
   - Top 6 results returned to user
   - Similarity percentage calculated as score * 100

Performance Optimizations

- Lazy loading of images in gallery and results
- Thumbnail generation for gallery display
- Image caching with HTTP headers
- Virtual scrolling for large image collections
- Efficient NumPy operations for similarity calculations
- Server-Sent Events for real-time progress updates

File Descriptions

app.py

Main Flask application containing all backend logic.

Key Components:
- Flask app initialization with static folder configuration
- ResNet50 model loading with ImageNet weights
- Feature extraction function using TensorFlow
- Gallery management endpoints (upload, delete, list)
- Feature generation with streaming progress
- Search endpoint with cosine similarity calculation
- Image serving with caching and thumbnail generation

Configuration:
- MAX_CONTENT_LENGTH: 16MB file size limit
- ALLOWED_EXTENSIONS: jpg, jpeg, png, gif, bmp
- Static folder: templates directory
- Upload folder: uploads directory

index.html

Main HTML template providing the user interface structure.

Sections:
- Header with title and description
- Tab navigation (Gallery and Search)
- Gallery tab with upload area, image grid, and management buttons
- Search tab with upload area, preview section, and results grid
- Image modal for full-size viewing
- Toast notification container

Features:
- Material Design icons integration
- Responsive grid layout
- Semantic HTML structure
- Accessibility considerations

style.css

Complete stylesheet for the application.

Design System:
- CSS variables for colors and shadows
- Material Design color palette
- Responsive breakpoints for mobile
- Smooth animations and transitions

Components:
- Header and typography styles
- Tab navigation styling
- Button styles (primary, outlined, text)
- Upload area with drag-over states
- Gallery and results grid layouts
- Modal styling
- Loading spinner animation
- Toast notification positioning
- Scrollbar customization

script.js

Client-side JavaScript handling all user interactions.

Key Functions:
- loadGallery() - Fetches and displays images
- uploadFilesToGallery() - Handles image uploads
- generateFeatures() - Triggers feature generation with progress tracking
- search() - Performs similarity search
- displayResults() - Renders search results
- Tab switching and navigation
- Modal management
- Drag-and-drop file handling
- Lazy image loading with IntersectionObserver
- Virtual scrolling for performance

Event Handlers:
- File input change events
- Drag and drop events
- Button click events
- Checkbox selection for bulk operations
- Modal close on escape key

requirements.txt

Python package dependencies with specific versions:
- Flask 2.3.3 - Web framework
- numpy 1.24.3 - Numerical computing
- tensorflow 2.13.0 - Deep learning
- scikit-learn 1.3.0 - Machine learning utilities
- Werkzeug 2.3.7 - WSGI utilities

Data Files

features.npy
- NumPy binary file containing feature vectors
- Shape: (number_of_images, 2048)
- Generated by ResNet50 feature extraction
- Used for similarity calculations

filenames.npy
- NumPy binary file containing corresponding image filenames
- Shape: (number_of_images,)
- Maintains correspondence with features.npy
- Used to map similarity scores back to filenames

Troubleshooting

Features Not Generating
- Ensure all images are in the images/ directory
- Check that image files are valid and not corrupted
- Verify TensorFlow is properly installed
- Check console for specific error messages

Search Not Working
- Generate features first using the Gallery tab
- Ensure features.npy and filenames.npy exist
- Upload a valid image file for search
- Check file format is supported

Images Not Displaying
- Verify images are in the images/ directory
- Check file permissions
- Clear browser cache
- Ensure image files are not corrupted

Performance Issues
- Reduce number of images in library
- Use smaller image files
- Close other applications to free memory
- Consider using GPU acceleration for TensorFlow

Limitations

- Maximum 16MB per image file
- Supported formats: PNG, JPG, JPEG, GIF, BMP
- Feature generation processes images sequentially
- Search returns top 6 results only
- No user authentication or multi-user support
- Features must be regenerated if images are deleted

Future Enhancements

- Batch search for multiple query images
- Adjustable number of results returned
- Image filtering and sorting options
- User accounts and saved searches
- GPU acceleration for faster processing
- Advanced search filters (date, size, etc.)
- Export search results
- Image annotation and tagging
- Duplicate image detection
- Batch image processing improvements

License

This project uses open-source libraries. See requirements.txt for dependencies and their respective licenses.

Support

For issues or questions, check the troubleshooting section or review the console logs for error messages. Ensure all dependencies are correctly installed and TensorFlow is properly configured for your system.
#   i m a g e _ s i m i l a r i t y  
 