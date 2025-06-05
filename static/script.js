document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('slideForm');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const loadingText = document.getElementById('loadingText');
    
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Handle individual image uploads
    const imageInputs = document.querySelectorAll('.image-input');
    imageInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            handleImageUpload(this, e.target.files[0]);
        });
    });
    
    let uploadedImages = {};
    
    // Handle individual image upload
    function handleImageUpload(input, file) {
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showError('Please select an image file.');
            input.value = '';
            return;
        }
        
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showError(`${file.name} is too large. Maximum file size is 5MB.`);
            input.value = '';
            return;
        }
        
        const container = input.closest('.image-upload-container');
        const placeholder = container.querySelector('.upload-placeholder');
        const preview = container.querySelector('.image-preview');
        const previewImg = preview.querySelector('.preview-img');
        const removeBtn = preview.querySelector('.btn-remove-image');
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            placeholder.style.display = 'none';
            preview.style.display = 'block';
            container.style.borderColor = '#28a745';
            container.style.backgroundColor = 'rgba(40, 167, 69, 0.05)';
        };
        reader.readAsDataURL(file);
        
        // Handle remove button
        removeBtn.onclick = function() {
            input.value = '';
            placeholder.style.display = 'block';
            preview.style.display = 'none';
            container.style.borderColor = '#dee2e6';
            container.style.backgroundColor = '';
            delete uploadedImages[input.id];
        };
        
        // Store file reference
        uploadedImages[input.id] = file;
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
        // Basic validation
        const visitType = document.getElementById('visitType').value;
        const caseTitle = document.getElementById('title').value.trim();
        
        if (!visitType) {
            e.preventDefault();
            showError('Please select a visit type.');
            return;
        }
        
        if (!caseTitle) {
            e.preventDefault();
            showError('Please enter a case title.');
            return;
        }
        
        // Validate visit-specific fields
        if (visitType === 'Registration') {
            const mrn = document.getElementById('mrn').value.trim();
            const clinic = document.getElementById('clinic').value;
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            
            if (!mrn || !clinic || !firstName || !lastName) {
                e.preventDefault();
                showError('Please fill in all required patient information.');
                return;
            }
        } else if (visitType === 'Orthodontic Visit' || visitType === 'Debond') {
            const patientId = document.getElementById('selectedPatientId').value;
            if (!patientId) {
                e.preventDefault();
                showError('Please search and select a patient.');
                return;
            }
        }
        
        // Validate all 8 images are uploaded
        const requiredImages = ['eofv', 'eosv', 'eomv', 'iorv', 'iofv', 'iolv', 'iouv', 'iolowerv'];
        const missingImages = [];
        
        requiredImages.forEach(imageId => {
            const input = document.getElementById(imageId);
            if (!input.files || input.files.length === 0) {
                missingImages.push(imageId.toUpperCase());
            }
        });
        
        if (missingImages.length > 0) {
            e.preventDefault();
            showError(`Please upload images for: ${missingImages.join(', ')}`);
            return;
        }
        
        // Show loading state
        submitBtn.classList.add('loading');
        submitText.classList.add('d-none');
        loadingText.classList.remove('d-none');
        
        // Show progress indicator
        showProgressIndicator();
        
        // Disable form inputs after a brief delay to ensure form submission
        setTimeout(() => {
            const inputs = form.querySelectorAll('input, textarea, button, select');
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
