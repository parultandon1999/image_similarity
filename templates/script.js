// Helper function to open gallery image in modal
function openGalleryImage(filename) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const imageCaption = document.getElementById('imageCaption');
    
    if (modal && modalImage && imageCaption) {
        modalImage.src = `/images/${filename}`;
        imageCaption.textContent = filename;
        modal.classList.add('show');
    }
}

// Virtual scrolling for gallery
let galleryScrollTimeout;
function setupGalleryVirtualScroll() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    
    grid.addEventListener('scroll', () => {
        clearTimeout(galleryScrollTimeout);
        galleryScrollTimeout = setTimeout(() => {
            const items = grid.querySelectorAll('.gallery-item');
            const gridRect = grid.getBoundingClientRect();
            
            items.forEach(item => {
                const itemRect = item.getBoundingClientRect();
                const isVisible = itemRect.bottom > gridRect.top && itemRect.top < gridRect.bottom;
                
                if (isVisible) {
                    item.style.opacity = '1';
                    item.style.pointerEvents = 'auto';
                } else {
                    item.style.opacity = '0.3';
                    item.style.pointerEvents = 'none';
                }
            });
        }, 50);
    }, { passive: true });
}

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const searchBtn = document.getElementById('searchBtn');
const removeBtn = document.getElementById('removeBtn');
const loading = document.getElementById('loading');
const resultsGrid = document.getElementById('resultsGrid');
const errorDiv = document.getElementById('error');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const generateBtn = document.getElementById('generateBtn');
const galleryGrid = document.getElementById('galleryGrid');
const galleryLoading = document.getElementById('galleryLoading');
const galleryError = document.getElementById('galleryError');
const generateLoading = document.getElementById('generateLoading');
const successMessage = document.getElementById('successMessage');
const warningMessage = document.getElementById('warningMessage');

// Search mode elements
const searchModeBtns = document.querySelectorAll('.search-mode-btn');
const uploadAreaDiv = document.getElementById('uploadArea');
const librarySelectorDiv = document.getElementById('librarySelector');
const libraryImageSelect = document.getElementById('libraryImageSelect');

let currentSearchMode = 'upload';
let selectedLibraryImage = null;

// Gallery upload handlers
const uploadAreaGallery = document.getElementById('uploadAreaGallery');
const fileInputGallery = document.getElementById('fileInputGallery');

uploadAreaGallery.addEventListener('click', () => fileInputGallery.click());

uploadAreaGallery.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadAreaGallery.classList.add('dragover');
}, { passive: false });

uploadAreaGallery.addEventListener('dragleave', () => {
    uploadAreaGallery.classList.remove('dragover');
}, { passive: true });

uploadAreaGallery.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadAreaGallery.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        fileInputGallery.files = files;
        uploadFilesToGallery();
    }
});

fileInputGallery.addEventListener('change', () => {
    if (fileInputGallery.files.length > 0) {
        uploadFilesToGallery();
    }
});

async function uploadFilesToGallery() {
    const files = fileInputGallery.files;
    galleryError.style.display = 'none';
    const toast = document.getElementById('toast');
    
    if (files.length === 0) {
        console.log('No files selected');
        return;
    }
    
    console.log('Uploading', files.length, 'files');
    
    // Show a loading state inside the upload area or global loader
    uploadAreaGallery.style.opacity = '0.5';
    
    let uploadedCount = 0;
    let errorCount = 0;
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        try {
            console.log('Uploading file:', file.name);
            
            // Show progress toast
            toast.innerHTML = `<span class="material-icons spin">cloud_upload</span> Uploading ${i + 1} of ${totalFiles}...`;
            toast.classList.add('show');
            
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log('Upload response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }
            
            uploadedCount++;
            console.log('File uploaded successfully:', file.name);
        } catch (error) {
            console.error('Upload error:', error);
            galleryError.textContent = 'Error uploading ' + file.name + ': ' + error.message;
            galleryError.style.display = 'block';
            errorCount++;
        }
    }
    
    console.log('Upload complete. Uploaded:', uploadedCount, 'Errors:', errorCount);
    
    uploadAreaGallery.style.opacity = '1';
    fileInputGallery.value = '';
    
    if (uploadedCount > 0) {
        console.log('Loading gallery...');
        
        // Show success toast
        if (errorCount === 0) {
            toast.innerHTML = `<span class="material-icons">check_circle</span> Successfully uploaded ${uploadedCount} file${uploadedCount !== 1 ? 's' : ''}`;
        } else {
            toast.innerHTML = `<span class="material-icons">warning</span> Uploaded ${uploadedCount} file${uploadedCount !== 1 ? 's' : ''}, ${errorCount} failed`;
        }
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
        
        loadGallery();
    }
}

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        tabContents.forEach(content => content.style.display = 'none');
        document.getElementById(`${tabName}-tab`).style.display = 'block';
        
        if (tabName === 'gallery') {
            loadGallery();
        } else if (tabName === 'search') {
            checkFeaturesExist();
            populateLibrarySelector();
        }
    });
});

// Search mode switching
searchModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        currentSearchMode = mode;
        
        searchModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (mode === 'upload') {
            uploadAreaDiv.style.display = 'block';
            librarySelectorDiv.style.display = 'none';
            fileInput.value = '';
            selectedLibraryImage = null;
            document.getElementById('previewImage').style.display = 'none';
            document.getElementById('previewText').style.display = 'block';
            searchBtn.disabled = true;
            removeBtn.disabled = true;
        } else {
            uploadAreaDiv.style.display = 'none';
            librarySelectorDiv.style.display = 'block';
            fileInput.value = '';
            libraryImageSelect.value = '';
            document.getElementById('previewImage').style.display = 'none';
            document.getElementById('previewText').style.display = 'block';
            searchBtn.disabled = true;
            removeBtn.disabled = true;
        }
    });
});

// Populate library selector
async function populateLibrarySelector() {
    try {
        const response = await fetch('/api/images');
        const data = await response.json();
        
        libraryImageSelect.innerHTML = '<option value="">-- Choose an image --</option>';
        
        if (data.images && data.images.length > 0) {
            data.images.forEach(img => {
                const option = document.createElement('option');
                option.value = img;
                option.textContent = img;
                libraryImageSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading library images:', error);
    }
}

// Library image selection
libraryImageSelect.addEventListener('change', () => {
    const selectedImg = libraryImageSelect.value;
    
    if (selectedImg) {
        selectedLibraryImage = selectedImg;
        document.getElementById('previewImage').src = `/images/${selectedImg}`;
        document.getElementById('previewImage').style.display = 'block';
        document.getElementById('previewText').style.display = 'none';
        searchBtn.disabled = false;
        removeBtn.disabled = false;
    } else {
        selectedLibraryImage = null;
        document.getElementById('previewImage').style.display = 'none';
        document.getElementById('previewText').style.display = 'block';
        searchBtn.disabled = true;
        removeBtn.disabled = true;
    }
});

// Track selected images
let selectedImages = new Set();

async function checkFeaturesExist() {
    try {
        const response = await fetch('/api/check-features');
        const data = await response.json();
        
        if (data.exists) {
            warningMessage.style.display = 'none';
            // Only enable search button if an image is actually uploaded
            if (fileInput.files.length > 0) {
                searchBtn.disabled = false;
            }
        } else {
            warningMessage.style.display = 'block';
            searchBtn.disabled = true;
        }
    } catch (error) {
        // Silently fail on initial check
    }
}

async function loadGallery() {
    galleryLoading.style.display = 'block';
    galleryError.style.display = 'none';
    galleryGrid.innerHTML = '';
    selectedImages.clear();
    updateDeleteButtons();

    try {
        const response = await fetch('/api/images');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load images');
        }

        const originalImages = data.original_images || [];
        const images = data.images || [];

        if (images.length === 0) {
            galleryGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #757575;">
                    <span class="material-icons" style="font-size: 48px; color: #E0E0E0;">image</span>
                    <p style="margin-top: 10px;">Library is empty</p>
                </div>`;
        } else {
            images.forEach(img => {
                const isOriginal = originalImages.includes(img);
                const item = document.createElement('div');
                item.className = 'gallery-item';
                item.dataset.filename = img;
                item.dataset.original = isOriginal;
                
                // Use a lightweight placeholder
                item.innerHTML = `
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'%3E%3Crect fill='%23f0f0f0' width='160' height='160'/%3E%3C/svg%3E" data-src="/images/thumb/${img}" alt="${img}" style="cursor: pointer;" loading="lazy">
                    <div class="gallery-checkbox-wrapper" ${isOriginal ? 'style="display: none;"' : ''}>
                        <input type="checkbox" class="gallery-checkbox" data-filename="${img}">
                    </div>
                    <button class="gallery-delete-btn" data-filename="${img}" title="${isOriginal ? 'Original images cannot be deleted' : 'Delete'}" ${isOriginal ? 'disabled' : ''}>
                        <span class="material-icons" style="font-size: 18px;">close</span>
                    </button>
                    ${isOriginal ? '<div class="original-badge">Original</div>' : ''}
                    <div class="gallery-item-overlay">
                        <div class="gallery-item-name">${img}</div>
                    </div>
                `;
                
                galleryGrid.appendChild(item);
                
                // Lazy load image with IntersectionObserver
                const imgElement = item.querySelector('img');
                if ('IntersectionObserver' in window) {
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                const img = entry.target;
                                img.src = img.dataset.src;
                                img.removeAttribute('data-src');
                                observer.unobserve(img);
                                img.addEventListener('click', () => openGalleryImage(img.alt));
                            }
                        });
                    }, { rootMargin: '100px' });
                    observer.observe(imgElement);
                } else {
                    imgElement.src = imgElement.dataset.src;
                    imgElement.addEventListener('click', () => openGalleryImage(img));
                }
                
                // Add change handler to checkbox (only for non-original images)
                if (!isOriginal) {
                    const checkbox = item.querySelector('.gallery-checkbox');
                    if (checkbox) {
                        checkbox.addEventListener('change', function(e) {
                            e.stopPropagation();
                            if (checkbox.checked) {
                                selectedImages.add(img);
                                item.classList.add('selected');
                            } else {
                                selectedImages.delete(img);
                                item.classList.remove('selected');
                            }
                            updateDeleteButtons();
                        }, { passive: true });
                    }
                }
                
                // Add click handler to delete button (only for non-original images)
                const deleteBtn = item.querySelector('.gallery-delete-btn');
                if (deleteBtn && !isOriginal) {
                    deleteBtn.addEventListener('click', async function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                        if (!confirm(`Delete ${img}?`)) return;
                        
                        const toast = document.getElementById('toast');
                        
                        try {
                            toast.innerHTML = `<span class="material-icons spin">delete</span> Deleting...`;
                            toast.classList.add('show');
                            
                            const response = await fetch(`/api/delete-image/${img}`, {
                                method: 'DELETE'
                            });
                            
                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || `Failed to delete ${img}`);
                            }
                            
                            toast.innerHTML = `<span class="material-icons">check_circle</span> Image deleted successfully`;
                            toast.classList.add('show');
                            
                            setTimeout(() => {
                                toast.classList.remove('show');
                            }, 2000);
                            
                            loadGallery();
                        } catch (error) {
                            galleryError.textContent = 'Error: ' + error.message;
                            galleryError.style.display = 'block';
                            toast.classList.remove('show');
                        }
                    }, { passive: true });
                }
            });
        }
    } catch (error) {
        galleryError.textContent = 'Error: ' + error.message;
        galleryError.style.display = 'block';
    } finally {
        galleryLoading.style.display = 'none';
        setupGalleryVirtualScroll();
    }
}

function updateDeleteButtons() {
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const selectedCount = document.getElementById('selectedCount');
    
    selectedCount.textContent = selectedImages.size;
    
    // Check if we are in gallery tab context, buttons might be hidden by CSS if empty
    deleteSelectedBtn.style.display = selectedImages.size > 0 ? 'inline-flex' : 'none';
    deleteAllBtn.style.display = document.querySelectorAll('.gallery-item').length > 0 ? 'inline-flex' : 'none';
}

// Load gallery on page load
loadGallery();
checkFeaturesExist();

document.getElementById('deleteSelectedBtn').addEventListener('click', async () => {
    if (selectedImages.size === 0) return;
    
    if (!confirm(`Delete ${selectedImages.size} selected image(s)?`)) return;
    
    const toast = document.getElementById('toast');
    let deletedCount = 0;
    let errorCount = 0;
    const totalToDelete = selectedImages.size;
    let currentIndex = 0;
    
    try {
        for (const filename of selectedImages) {
            currentIndex++;
            
            // Show progress toast
            toast.innerHTML = `<span class="material-icons spin">delete</span> Deleting ${currentIndex} of ${totalToDelete}...`;
            toast.classList.add('show');
            
            const response = await fetch(`/api/delete-image/${filename}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to delete ${filename}`);
            }
            
            deletedCount++;
        }
        
        selectedImages.clear();
        
        // Show success toast
        if (errorCount === 0) {
            toast.innerHTML = `<span class="material-icons">check_circle</span> Successfully deleted ${deletedCount} image${deletedCount !== 1 ? 's' : ''}`;
        } else {
            toast.innerHTML = `<span class="material-icons">warning</span> Deleted ${deletedCount} image${deletedCount !== 1 ? 's' : ''}, ${errorCount} failed`;
        }
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
        
        loadGallery();
    } catch (error) {
        galleryError.textContent = 'Error: ' + error.message;
        galleryError.style.display = 'block';
        toast.classList.remove('show');
    }
});

document.getElementById('deleteAllBtn').addEventListener('click', async () => {
    const allItems = Array.from(document.querySelectorAll('.gallery-item'));
    const deletableImages = allItems
        .filter(item => item.dataset.original !== 'true')
        .map(item => item.dataset.filename);
    
    if (deletableImages.length === 0) {
        galleryError.textContent = 'No deletable images. Original images cannot be deleted.';
        galleryError.style.display = 'block';
        return;
    }
    
    if (!confirm(`Delete all ${deletableImages.length} uploaded image(s)? Original images will be preserved.`)) return;
    
    const toast = document.getElementById('toast');
    let deletedCount = 0;
    let errorCount = 0;
    const totalToDelete = deletableImages.length;
    let currentIndex = 0;
    
    try {
        for (const filename of deletableImages) {
            currentIndex++;
            
            // Show progress toast
            toast.innerHTML = `<span class="material-icons spin">delete</span> Deleting ${currentIndex} of ${totalToDelete}...`;
            toast.classList.add('show');
            
            const response = await fetch(`/api/delete-image/${filename}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to delete ${filename}`);
            }
            
            deletedCount++;
        }
        
        selectedImages.clear();
        
        // Show success toast
        if (errorCount === 0) {
            toast.innerHTML = `<span class="material-icons">check_circle</span> Successfully deleted ${deletedCount} image${deletedCount !== 1 ? 's' : ''}`;
        } else {
            toast.innerHTML = `<span class="material-icons">warning</span> Deleted ${deletedCount} image${deletedCount !== 1 ? 's' : ''}, ${errorCount} failed`;
        }
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
        
        loadGallery();
    } catch (error) {
        galleryError.textContent = 'Error: ' + error.message;
        galleryError.style.display = 'block';
        toast.classList.remove('show');
    }
});

generateBtn.addEventListener('click', async () => {
    generateBtn.disabled = true;
    galleryError.style.display = 'none';
    const toast = document.getElementById('toast');

    try {
        const response = await fetch('/api/generate-features', {
            method: 'POST'
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to generate features');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (let line of lines) {
                line = line.trim();
                if (line.startsWith('data: ')) {
                    try {
                        const jsonStr = line.slice(6);
                        const data = JSON.parse(jsonStr);

                        if (data.progress !== undefined) {
                            toast.innerHTML = `<span class="material-icons spin">refresh</span> Processing ${data.current} of ${data.total} images...`;
                            toast.classList.add('show');
                        }

                        if (data.complete) {
                            toast.innerHTML = `<span class="material-icons">check_circle</span> Generated features for ${data.count} images`;
                            toast.classList.add('show');
                            setTimeout(() => {
                                toast.classList.remove('show');
                            }, 3000);
                            checkFeaturesExist();
                        }

                        if (data.error) {
                            throw new Error(data.error);
                        }
                    } catch (e) {
                        console.error('Parse error:', e);
                    }
                }
            }
        }
    } catch (error) {
        galleryError.textContent = 'Error: ' + error.message;
        galleryError.style.display = 'block';
        toast.classList.remove('show');
    } finally {
        generateBtn.disabled = false;
    }
});

// Upload and search functionality
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}, { passive: false });

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
}, { passive: true });

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        fileInput.files = files;
        searchBtn.disabled = false;
    }
});

fileInput.addEventListener('change', () => {
    const hasFile = fileInput.files.length > 0;
    searchBtn.disabled = !hasFile;
    removeBtn.disabled = !hasFile;
    
    if (hasFile) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewImage').src = e.target.result;
            document.getElementById('previewImage').style.display = 'block';
            document.getElementById('previewText').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
});

removeBtn.addEventListener('click', () => {
    fileInput.value = '';
    libraryImageSelect.value = '';
    selectedLibraryImage = null;
    document.getElementById('previewImage').style.display = 'none';
    document.getElementById('previewText').style.display = 'block';
    searchBtn.disabled = true;
    removeBtn.disabled = true;
});

// Initialize buttons as disabled on page load
window.addEventListener('load', () => {
    searchBtn.disabled = true;
    removeBtn.disabled = true;
});

searchBtn.addEventListener('click', async () => {
    if (currentSearchMode === 'upload' && fileInput.files.length === 0) return;
    if (currentSearchMode === 'library' && !selectedLibraryImage) return;

    const formData = new FormData();
    
    if (currentSearchMode === 'upload') {
        formData.append('file', fileInput.files[0]);
    } else {
        // For library mode, we need to fetch the image and convert it to a file
        try {
            const response = await fetch(`/images/${selectedLibraryImage}`);
            const blob = await response.blob();
            formData.append('file', blob, selectedLibraryImage);
        } catch (error) {
            errorDiv.textContent = 'Error: Failed to load image from library';
            errorDiv.style.display = 'block';
            return;
        }
    }

    const toast = document.getElementById('toast');
    toast.innerHTML = '<span class="material-icons spin">refresh</span> Searching...';
    toast.classList.add('show');

    errorDiv.style.display = 'none';

    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Search failed');
        }

        displayResults(data.results);
        
        toast.classList.remove('show');
    } catch (error) {
        errorDiv.textContent = 'Error: ' + error.message;
        errorDiv.style.display = 'block';
        
        toast.classList.remove('show');
    }
});

function displayResults(results) {
    resultsGrid.innerHTML = '';
    results.forEach(result => {
        const card = document.createElement('div');
        card.className = 'result-card';
        const percentage = (result.similarity * 100).toFixed(1);
        
        card.innerHTML = `
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'%3E%3Crect fill='%23f0f0f0' width='160' height='160'/%3E%3C/svg%3E" data-src="${result.image_url}" alt="${result.filename}" class="result-image" loading="lazy">
            <div class="result-info">
                <div class="result-header">
                    <div class="result-filename" title="${result.filename}">${result.filename}</div>
                    <div class="result-similarity">${percentage}%</div>
                </div>
                <div class="similarity-bar-bg">
                    <div class="similarity-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
        
        const img = card.querySelector('.result-image');
        
        // Lazy load image
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const imgEl = entry.target;
                        imgEl.src = imgEl.dataset.src;
                        imgEl.removeAttribute('data-src');
                        observer.unobserve(imgEl);
                        
                        imgEl.addEventListener('click', () => {
                            const modal = document.getElementById('imageModal');
                            const modalImage = document.getElementById('modalImage');
                            const imageCaption = document.getElementById('imageCaption');
                            
                            modalImage.src = result.image_url;
                            imageCaption.textContent = `${result.filename} (${percentage}% match)`;
                            modal.classList.add('show');
                        });
                    }
                });
            }, { rootMargin: '100px' });
            observer.observe(img);
        } else {
            img.src = img.dataset.src;
            img.addEventListener('click', () => {
                const modal = document.getElementById('imageModal');
                const modalImage = document.getElementById('modalImage');
                const imageCaption = document.getElementById('imageCaption');
                
                modalImage.src = result.image_url;
                imageCaption.textContent = `${result.filename} (${percentage}% match)`;
                modal.classList.add('show');
            });
        }
        
        resultsGrid.appendChild(card);
    });
}

// Modal close handlers
const modal = document.getElementById('imageModal');
const closeBtn = document.querySelector('.close');

closeBtn.addEventListener('click', () => {
    modal.classList.remove('show');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        modal.classList.remove('show');
    }
});