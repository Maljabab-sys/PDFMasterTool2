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
        // Basic validation only
        const caseTitle = document.getElementById('case_title').value.trim();
        const files = fileInput.files;
        
        if (!caseTitle) {
            e.preventDefault();
            showError('Please enter a case title.');
            return;
        }
        
        if (files.length === 0) {
            e.preventDefault();
            showError('Please select at least one image.');
            return;
        }
        
        if (files.length !== 8) {
            e.preventDefault();
            showError('Please select exactly 8 images for the medical template.');
            return;
        }
        
        // Check file sizes
        for (let file of files) {
            if (file.size > 5 * 1024 * 1024) { // 5MB
                e.preventDefault();
                showError(`${file.name} is too large. Maximum file size is 5MB.`);
                return;
            }
        }
        
        // Show loading state
        submitBtn.classList.add('loading');
        submitText.classList.add('d-none');
        loadingText.classList.remove('d-none');
        
        // Show progress indicator
        showProgressIndicator();
        
        // Disable form inputs after a brief delay to ensure form submission
        setTimeout(() => {
            const inputs = form.querySelectorAll('input, textarea, button');
            inputs.forEach(input => input.disabled = true);
        }, 100);
        
        // Don't redirect automatically - let the server handle it
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

// Handle visit type change
function handleVisitTypeChange() {
    const visitType = document.getElementById('visitType').value;
    const registrationFields = document.getElementById('registrationFields');
    const followupFields = document.getElementById('followupFields');
    
    // Hide all fields first
    if (registrationFields) registrationFields.style.display = 'none';
    if (followupFields) followupFields.style.display = 'none';
    
    // Clear required attributes
    clearRequiredFields();
    
    if (visitType === 'Registration') {
        if (registrationFields) registrationFields.style.display = 'block';
        setRegistrationRequired();
    } else if (visitType === 'Orthodontic Visit' || visitType === 'Debond') {
        if (followupFields) followupFields.style.display = 'block';
        setFollowupRequired();
    }
}

function clearRequiredFields() {
    const fields = ['mrn', 'clinic', 'firstName', 'lastName', 'mrnSearch'];
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) element.removeAttribute('required');
    });
}

function setRegistrationRequired() {
    const fields = ['mrn', 'clinic', 'firstName', 'lastName'];
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) element.setAttribute('required', 'required');
    });
}

function setFollowupRequired() {
    const mrnSearch = document.getElementById('mrnSearch');
    if (mrnSearch) mrnSearch.setAttribute('required', 'required');
}

// Search patients function
function searchPatients() {
    const mrnSearch = document.getElementById('mrnSearch').value.trim();
    const resultsDiv = document.getElementById('patientResults');
    
    if (mrnSearch.length < 2) {
        resultsDiv.innerHTML = '';
        return;
    }
    
    // Make AJAX request to search patients
    fetch('/search_patients', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mrn: mrnSearch })
    })
    .then(response => response.json())
    .then(data => {
        displaySearchResults(data.patients);
    })
    .catch(error => {
        console.error('Error searching patients:', error);
        resultsDiv.innerHTML = '<div class="alert alert-danger">Error searching patients</div>';
    });
}

function displaySearchResults(patients) {
    const resultsDiv = document.getElementById('patientResults');
    
    if (patients.length === 0) {
        resultsDiv.innerHTML = '<div class="alert alert-warning">No patients found with that MRN</div>';
        return;
    }
    
    let html = '<div class="list-group">';
    patients.forEach(patient => {
        html += `
            <button type="button" class="list-group-item list-group-item-action" 
                    onclick="selectPatient('${patient.id}', '${patient.mrn}', '${patient.first_name}', '${patient.last_name}', '${patient.clinic}')">
                <strong>MRN: ${patient.mrn}</strong><br>
                ${patient.first_name} ${patient.last_name} - ${patient.clinic}
            </button>
        `;
    });
    html += '</div>';
    
    resultsDiv.innerHTML = html;
}

function selectPatient(id, mrn, firstName, lastName, clinic) {
    // Hide search results
    document.getElementById('patientResults').innerHTML = '';
    
    // Show selected patient info
    document.getElementById('selectedPatientInfo').style.display = 'block';
    document.getElementById('selectedPatientDetails').textContent = 
        `MRN: ${mrn} - ${firstName} ${lastName} (${clinic})`;
    document.getElementById('selectedPatientId').value = id;
    
    // Clear search field
    document.getElementById('mrnSearch').value = mrn;
}

// Character count for visit description
document.addEventListener('DOMContentLoaded', function() {
    const visitDescInput = document.getElementById('visitDescription');
    if (visitDescInput) {
        visitDescInput.addEventListener('input', function() {
            const countElement = document.getElementById('visitDescCount');
            if (countElement) {
                countElement.textContent = this.value.length;
            }
        });
    }
});
