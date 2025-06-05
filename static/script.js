document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('images');
    const previewContainer = document.getElementById('previewContainer');
    const previewArea = document.getElementById('imagePreview');
    const form = document.getElementById('slideForm');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const loadingText = document.getElementById('loadingText');
    
    let selectedFiles = [];
    
    // File input change handler
    fileInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        selectedFiles = files;
        displayPreview(files);
    });
    
    // Display image preview
    function displayPreview(files) {
        previewContainer.innerHTML = '';
        
        if (files.length === 0) {
            previewArea.style.display = 'none';
            return;
        }
        
        previewArea.style.display = 'block';
        previewArea.classList.add('fade-in');
        
        files.forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewItem = createPreviewItem(e.target.result, file.name, index);
                    previewContainer.appendChild(previewItem);
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Create preview item
    function createPreviewItem(src, filename, index) {
        const col = document.createElement('div');
        col.className = 'col-6 col-sm-4 col-md-3';
        
        col.innerHTML = `
            <div class="preview-item">
                <img src="${src}" alt="${filename}" class="preview-image">
                <button type="button" class="remove-image" onclick="removeImage(${index})">
                    <i class="bi bi-x"></i>
                </button>
                <div class="preview-filename">${truncateFilename(filename, 20)}</div>
            </div>
        `;
        
        return col;
    }
    
    // Remove image from selection
    window.removeImage = function(index) {
        selectedFiles.splice(index, 1);
        updateFileInput();
        displayPreview(selectedFiles);
    };
    
    // Update file input with remaining files
    function updateFileInput() {
        const dt = new DataTransfer();
        selectedFiles.forEach(file => dt.items.add(file));
        fileInput.files = dt.files;
    }
    
    // Truncate filename for display
    function truncateFilename(filename, maxLength) {
        if (filename.length <= maxLength) return filename;
        const extension = filename.split('.').pop();
        const name = filename.substring(0, filename.lastIndexOf('.'));
        const truncatedName = name.substring(0, maxLength - extension.length - 4) + '...';
        return truncatedName + '.' + extension;
    }
    
    // Form validation
    function validateForm() {
        const caseTitle = document.getElementById('case_title').value.trim();
        const files = fileInput.files;
        
        if (!caseTitle) {
            showError('Please enter a case title.');
            return false;
        }
        
        if (files.length === 0) {
            showError('Please select at least one image.');
            return false;
        }
        
        // Validate file types and sizes
        for (let file of files) {
            if (!file.type.startsWith('image/')) {
                showError(`${file.name} is not a valid image file.`);
                return false;
            }
            
            if (file.size > 16 * 1024 * 1024) { // 16MB
                showError(`${file.name} is too large. Maximum file size is 16MB.`);
                return false;
            }
        }
        
        return true;
    }
    
    // Show error message
    function showError(message) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Create new alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="bi bi-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at top of container
        const container = document.querySelector('.container');
        const firstChild = container.firstElementChild;
        container.insertBefore(alertDiv, firstChild.nextElementSibling);
        
        // Scroll to alert
        alertDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Form submission handler
    form.addEventListener('submit', function(e) {
        if (!validateForm()) {
            e.preventDefault();
            return;
        }
        
        // Show loading state
        submitBtn.classList.add('loading');
        submitText.classList.add('d-none');
        loadingText.classList.remove('d-none');
        
        // Show progress indicator
        showProgressIndicator();
        
        // Disable form inputs
        const inputs = form.querySelectorAll('input, textarea, button');
        inputs.forEach(input => input.disabled = true);
    });
    
    // Show progress indicator
    function showProgressIndicator() {
        const progressBar = document.createElement('div');
        progressBar.className = 'upload-progress active';
        document.body.appendChild(progressBar);
    }
    
    // Auto-resize textarea
    const notesTextarea = document.getElementById('notes');
    notesTextarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
    
    // Character count for inputs
    const caseTitle = document.getElementById('case_title');
    const notes = document.getElementById('notes');
    
    function updateCharacterCount(input, maxLength) {
        const current = input.value.length;
        const remaining = maxLength - current;
        
        let countElement = input.parentElement.querySelector('.char-count');
        if (!countElement) {
            countElement = document.createElement('div');
            countElement.className = 'char-count form-text text-end';
            input.parentElement.appendChild(countElement);
        }
        
        countElement.textContent = `${current}/${maxLength}`;
        countElement.style.color = remaining < 10 ? 'var(--bs-warning)' : '';
    }
    
    caseTitle.addEventListener('input', () => updateCharacterCount(caseTitle, 100));
    notes.addEventListener('input', () => updateCharacterCount(notes, 1000));
    
    // Touch-friendly file upload for mobile
    if (window.innerWidth <= 768) {
        fileInput.addEventListener('click', function() {
            // Add visual feedback for mobile tap
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    }
    
    // Prevent form submission on Enter in text inputs
    caseTitle.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });
    
    // Auto-save form data to localStorage
    function saveFormData() {
        const formData = {
            caseTitle: caseTitle.value,
            notes: notes.value
        };
        localStorage.setItem('slideFormData', JSON.stringify(formData));
    }
    
    function loadFormData() {
        const saved = localStorage.getItem('slideFormData');
        if (saved) {
            const data = JSON.parse(saved);
            caseTitle.value = data.caseTitle || '';
            notes.value = data.notes || '';
        }
    }
    
    // Save on input
    caseTitle.addEventListener('input', saveFormData);
    notes.addEventListener('input', saveFormData);
    
    // Load on page load
    loadFormData();
    
    // Clear saved data on successful submission
    form.addEventListener('submit', function() {
        localStorage.removeItem('slideFormData');
    });
});
