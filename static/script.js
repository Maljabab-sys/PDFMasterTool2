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
        };
    }
    
    // Truncate filename for display
    function truncateFilename(filename, maxLength) {
        if (filename.length <= maxLength) return filename;
        const ext = filename.substring(filename.lastIndexOf('.'));
        const name = filename.substring(0, filename.lastIndexOf('.'));
        const truncated = name.substring(0, maxLength - ext.length - 3) + '...';
        return truncated + ext;
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
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at top of form
        form.insertBefore(alertDiv, form.firstChild);
        
        // Scroll to alert
        alertDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Form submission handler
    form.addEventListener('submit', function(e) {
        // Basic validation
        const visitType = document.getElementById('visitType').value;
        
        if (!visitType) {
            e.preventDefault();
            showError('Please select a visit type.');
            return;
        }
        
        // Set case title automatically
        document.getElementById('title').value = 'Medical Case';
        
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
        
        // Validate all 8 images are uploaded - STRICT VALIDATION
        const requiredImages = ['eofv', 'eosv', 'eomv', 'iorv', 'iofv', 'iolv', 'iouv', 'iolowerv'];
        const missingImages = [];
        
        requiredImages.forEach(imageId => {
            const input = document.getElementById(imageId);
            if (!input || !input.files || input.files.length === 0 || !input.files[0]) {
                missingImages.push(imageId.toUpperCase());
            }
        });
        
        if (missingImages.length > 0) {
            e.preventDefault();
            showError(`All 8 images are required. Missing: ${missingImages.join(', ')}`);
            return;
        }
        
        // Double check - ensure exactly 8 images
        let uploadedCount = 0;
        requiredImages.forEach(imageId => {
            const input = document.getElementById(imageId);
            if (input && input.files && input.files.length > 0 && input.files[0]) {
                uploadedCount++;
            }
        });
        
        if (uploadedCount !== 8) {
            e.preventDefault();
            showError(`Please upload all 8 required images (${uploadedCount}/8 uploaded)`);
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
    
    // Character count functionality
    function updateCharacterCount(input, maxLength) {
        const countElement = document.getElementById(input.id + 'Count');
        if (countElement) {
            countElement.textContent = input.value.length;
            
            // Color coding
            const percentage = (input.value.length / maxLength) * 100;
            if (percentage > 90) {
                countElement.style.color = 'var(--bs-danger)';
            } else if (percentage > 75) {
                countElement.style.color = 'var(--bs-warning)';
            } else {
                countElement.style.color = 'var(--bs-muted)';
            }
        }
    }
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
        resultsDiv.innerHTML = '<div class="alert alert-warning">No patients found</div>';
        return;
    }
    
    let html = '<div class="list-group">';
    patients.forEach(patient => {
        html += `
            <button type="button" class="list-group-item list-group-item-action list-group-item-dark border-secondary patient-result" 
                    onclick="selectPatient('${patient.id}', '${patient.mrn}', '${patient.first_name}', '${patient.last_name}', '${patient.clinic}')">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1 text-light"><strong>MRN: ${patient.mrn}</strong></h6>
                    <small class="text-muted">${patient.clinic}</small>
                </div>
                <p class="mb-1 text-light">${patient.first_name} ${patient.last_name}</p>
            </button>
        `;
    });
    html += '</div>';
    
    resultsDiv.innerHTML = html;
}

function selectPatient(id, mrn, firstName, lastName, clinic) {
    // Remove previous selections
    document.querySelectorAll('.patient-result').forEach(el => {
        el.classList.remove('selected');
        el.classList.remove('list-group-item-success');
    });
    
    // Mark clicked patient as selected
    const clickedElement = event.target.closest('.patient-result');
    if (clickedElement) {
        clickedElement.classList.add('selected');
        clickedElement.classList.add('list-group-item-success');
    }
    
    // Show selected patient info
    document.getElementById('selectedPatientInfo').style.display = 'block';
    document.getElementById('selectedPatientDetails').textContent = 
        `MRN: ${mrn} - ${firstName} ${lastName} (${clinic})`;
    document.getElementById('selectedPatientId').value = id;
    
    // Keep search results visible but update search field
    document.getElementById('mrnSearch').value = `${firstName} ${lastName}`;
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