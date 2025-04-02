// Global variables
let selectedImages = [];
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const previewContainer = document.getElementById('previewContainer');
const optionsPanel = document.getElementById('optionsPanel');
const removeAllBtn = document.getElementById('removeAllBtn');
const reorderBtn = document.getElementById('reorderBtn');
const convertBtn = document.getElementById('convertBtn');
const loadingBar = document.getElementById('loadingBar');
const loadingProgress = loadingBar.querySelector('.loading-progress');

// Time and Date Functions
function updateDateTime() {
    const now = new Date();
    
    // Update time
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    document.getElementById('time').textContent = timeString;
    
    // Update date
    const dateString = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('date').textContent = dateString;
    
    // Update greeting
    const hour = now.getHours();
    let greeting = 'Good morning!';
    
    if (hour >= 12 && hour < 17) {
        greeting = 'Good afternoon!';
    } else if (hour >= 17 && hour < 22) {
        greeting = 'Good evening!';
    } else if (hour >= 22 || hour < 5) {
        greeting = 'Good night!';
    }
    
    document.getElementById('greeting').textContent = greeting;
}

// Update time and date every second
setInterval(updateDateTime, 1000);
// Initial update
updateDateTime();

// Smooth scroll function
function smoothScroll(target) {
    const element = document.querySelector(target);
    const headerOffset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

// Loading bar animation
function showLoadingBar() {
    loadingBar.style.display = 'block';
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                loadingBar.style.display = 'none';
                loadingProgress.style.width = '0%';
            }, 500);
        }
        loadingProgress.style.width = progress + '%';
    }, 500);
}

// Drag and drop event listeners
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    const files = e.dataTransfer.files;
    handleFiles(files);
});

// File input change event
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Handle selected files
function handleFiles(files) {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        alert('Please select valid image files.');
        return;
    }

    // Show loading bar
    showLoadingBar();

    // Add new images to the array
    selectedImages = [...selectedImages, ...imageFiles];
    
    // Update UI
    updatePreview();
    showOptionsPanel();

    // Scroll to options panel after a short delay
    setTimeout(() => {
        smoothScroll('#optionsPanel');
    }, 1000);
}

// Update preview section
function updatePreview() {
    previewContainer.innerHTML = '';
    
    selectedImages.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}">
                <div class="preview-item-controls">
                    <button class="remove-btn" onclick="removeImage(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="move-btn" onclick="moveImage(${index}, 'up')" ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="move-btn" onclick="moveImage(${index}, 'down')" ${index === selectedImages.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </div>
            `;
            previewContainer.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });

    previewSection.style.display = 'block';
}

// Remove single image
function removeImage(index) {
    selectedImages.splice(index, 1);
    updatePreview();
    if (selectedImages.length === 0) {
        previewSection.style.display = 'none';
        optionsPanel.style.display = 'none';
    }
}

// Remove all images
removeAllBtn.addEventListener('click', () => {
    selectedImages = [];
    previewSection.style.display = 'none';
    optionsPanel.style.display = 'none';
});

// Move image up or down
function moveImage(index, direction) {
    if (direction === 'up' && index > 0) {
        [selectedImages[index], selectedImages[index - 1]] = [selectedImages[index - 1], selectedImages[index]];
    } else if (direction === 'down' && index < selectedImages.length - 1) {
        [selectedImages[index], selectedImages[index + 1]] = [selectedImages[index + 1], selectedImages[index]];
    }
    updatePreview();
}

// Show options panel
function showOptionsPanel() {
    optionsPanel.style.display = 'block';
}

// Convert images to PDF
convertBtn.addEventListener('click', async () => {
    if (selectedImages.length === 0) {
        alert('Please select at least one image to convert.');
        return;
    }

    // Show loading bar
    showLoadingBar();

    // Get conversion options
    const pageSize = document.getElementById('pageSize').value;
    const imageQuality = document.getElementById('imageQuality').value;
    const orientation = document.getElementById('orientation').value;
    const margins = parseInt(document.getElementById('margins').value);

    // Create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: pageSize
    });

    // Set margins
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginWidth = margins * 2;
    const marginHeight = margins * 2;
    const contentWidth = pageWidth - marginWidth;
    const contentHeight = pageHeight - marginHeight;

    // Convert each image
    for (let i = 0; i < selectedImages.length; i++) {
        if (i > 0) {
            doc.addPage();
        }

        const img = await loadImage(selectedImages[i]);
        const imgWidth = img.width;
        const imgHeight = img.height;
        
        // Calculate scaling to fit within margins
        const scale = Math.min(
            contentWidth / imgWidth,
            contentHeight / imgHeight
        );

        // Center the image
        const x = (pageWidth - imgWidth * scale) / 2;
        const y = (pageHeight - imgHeight * scale) / 2;

        // Add image to PDF
        doc.addImage(
            img,
            'JPEG',
            x,
            y,
            imgWidth * scale,
            imgHeight * scale,
            '',
            'FAST'
        );
    }

    // Save the PDF
    doc.save('converted_images.pdf');
});

// Helper function to load image
function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Initialize Sortable for drag-and-drop reordering
if (typeof Sortable !== 'undefined') {
    new Sortable(previewContainer, {
        animation: 150,
        onEnd: function(evt) {
            const item = selectedImages[evt.oldIndex];
            selectedImages.splice(evt.oldIndex, 1);
            selectedImages.splice(evt.newIndex, 0, item);
        }
    });
} 