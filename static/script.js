document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('slideForm');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const loadingText = document.getElementById('loadingText');
    
    // Check if elements exist before proceeding
    if (!form) return;
    
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
    // Add image upload box function
    function addImageUpload() {
        const container = document.getElementById('imageUploads');
        if (!container) return;
        
        const uploadCount = container.children.length;
        const uploadDiv = document.createElement('div');
        uploadDiv.className = 'col-md-4 mb-3';
        uploadDiv.innerHTML = `
            <div class="image-upload-container">
                <div class="upload-placeholder text-center p-4 border border-2 border-dashed rounded">
                    <i class="bi bi-cloud-upload fs-2 text-muted"></i>
                    <p class="mb-2">Click to upload image ${uploadCount + 1}</p>
                    <input type="file" name="image_${uploadCount}" accept="image/*" class="form-control image-input">
                </div>
                <div class="image-preview" style="display: none;">
                    <img src="" alt="Preview" class="preview-img img-fluid rounded">
                    <button type="button" class="btn btn-sm btn-danger btn-remove-image mt-2">Remove</button>
                </div>
            </div>
        `;
        container.appendChild(uploadDiv);
        
        // Add event listeners to the new input
        const newInput = uploadDiv.querySelector('.image-input');
        newInput.addEventListener('change', function(e) {
            handleImageUpload(this, e.target.files[0]);
        });
    }

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
    if (form) {
        form.addEventListener('submit', function(e) {
        
        // Basic validation
        const visitTypeRadios = document.querySelectorAll('input[name="visit_type"]');
        let visitType = null;
        visitTypeRadios.forEach(radio => {
            if (radio.checked) {
                visitType = radio.value;
            }
        });
        
        if (!visitType) {
            showError('Please select a visit type.');
            return;
        }
        
        // Validate visit-specific fields
        if (visitType === 'registration') {
            const mrn = document.getElementById('mrn').value.trim();
            const clinic = document.getElementById('clinic').value;
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            
            if (!mrn || !clinic || !firstName || !lastName) {
                e.preventDefault();
                showError('Please fill in all required patient information.');
                return;
            }
        } else if (visitType === 'orthodontic_visit' || visitType === 'debond') {
            const patientId = document.getElementById('selectedPatientId').value;
            if (!patientId) {
                e.preventDefault();
                showError('Please search and select a patient.');
                return;
            }
        }
        
        // Images are optional - no validation required
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
    }
    
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
    const visitTypeRadios = document.querySelectorAll('input[name="visit_type"]');
    const registrationFields = document.getElementById('registrationFields');
    const followupFields = document.getElementById('followupFields');
    
    if (!registrationFields || !followupFields) return;
    
    let selectedValue = null;
    visitTypeRadios.forEach(radio => {
        if (radio.checked) {
            selectedValue = radio.value;
        }
    });
    
    // Hide all fields first
    registrationFields.style.display = 'none';
    followupFields.style.display = 'none';
    
    // Clear required attributes
    clearRequiredFields();
    
    if (selectedValue === 'registration') {
        registrationFields.style.display = 'block';
        setRegistrationRequired();
    } else if (selectedValue === 'orthodontic_visit' || selectedValue === 'debond') {
        followupFields.style.display = 'block';
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
    const resultsDiv = document.getElementById('searchResults');
    
    if (!resultsDiv) {
        console.error('Search results container not found');
        return;
    }
    
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
        if (resultsDiv) {
            resultsDiv.innerHTML = '<div class="alert alert-danger">Error searching patients</div>';
        }
    });
}

function displaySearchResults(patients) {
    const resultsDiv = document.getElementById('searchResults');
    
    if (!resultsDiv) {
        console.error('Search results container not found');
        return;
    }
    
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
    // Show selected patient info
    const selectedPatientInfo = document.getElementById('selectedPatientInfo');
    const selectedPatientDetails = document.getElementById('selectedPatientDetails');
    const selectedPatientId = document.getElementById('selectedPatientId');
    const mrnSearch = document.getElementById('mrnSearch');
    const searchResults = document.getElementById('searchResults');
    
    if (selectedPatientInfo) selectedPatientInfo.style.display = 'block';
    if (selectedPatientDetails) {
        selectedPatientDetails.textContent = `MRN: ${mrn} - ${firstName} ${lastName} (${clinic})`;
    }
    if (selectedPatientId) selectedPatientId.value = id;
    
    // Update search field with patient name and clear results
    if (mrnSearch) {
        mrnSearch.value = `${firstName} ${lastName} (${mrn})`;
        mrnSearch.setAttribute('readonly', true);
        mrnSearch.style.backgroundColor = '#e9ecef';
    }
    
    // Clear search results
    if (searchResults) {
        searchResults.innerHTML = '';
    }
    
    // Add a clear selection button
    if (selectedPatientInfo && !document.getElementById('clearPatientBtn')) {
        const clearBtn = document.createElement('button');
        clearBtn.id = 'clearPatientBtn';
        clearBtn.type = 'button';
        clearBtn.className = 'btn btn-sm btn-outline-secondary mt-2';
        clearBtn.innerHTML = '<i class="bi bi-x-circle me-1"></i>Clear Selection';
        clearBtn.onclick = clearPatientSelection;
        selectedPatientInfo.appendChild(clearBtn);
    }
}

function clearPatientSelection() {
    const selectedPatientInfo = document.getElementById('selectedPatientInfo');
    const selectedPatientId = document.getElementById('selectedPatientId');
    const mrnSearch = document.getElementById('mrnSearch');
    const searchResults = document.getElementById('searchResults');
    const clearBtn = document.getElementById('clearPatientBtn');
    
    if (selectedPatientInfo) selectedPatientInfo.style.display = 'none';
    if (selectedPatientId) selectedPatientId.value = '';
    if (mrnSearch) {
        mrnSearch.value = '';
        mrnSearch.removeAttribute('readonly');
        mrnSearch.style.backgroundColor = '';
    }
    if (searchResults) searchResults.innerHTML = '';
    if (clearBtn) clearBtn.remove();
}

// Section navigation for single-page app
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Update navigation active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    if (sectionName === 'new-case') {
        const section = document.getElementById('new-case-section');
        if (section) section.style.display = 'block';
        const link = document.querySelector('[onclick="showSection(\'new-case\')"]');
        if (link) link.classList.add('active');
    } else if (sectionName === 'case-history') {
        const section = document.getElementById('case-history-section');
        if (section) section.style.display = 'block';
        const link = document.querySelector('[onclick="showSection(\'case-history\')"]');
        if (link) link.classList.add('active');
        loadCaseHistory();
    } else if (sectionName === 'patient-list') {
        const section = document.getElementById('patient-list-section');
        if (section) section.style.display = 'block';
        const link = document.querySelector('[onclick="showSection(\'patient-list\')"]');
        if (link) link.classList.add('active');
        loadPatientList();
    } else if (sectionName === 'settings') {
        const section = document.getElementById('settings-section');
        if (section) section.style.display = 'block';
        const link = document.querySelector('[onclick="showSection(\'settings\')"]');
        if (link) link.classList.add('active');
        loadUserSettings();
    }
}

// Check URL fragment on page load to handle post-submission redirects
function checkUrlFragment() {
    const fragment = window.location.hash.substring(1);
    if (fragment === 'case-history') {
        showSection('case-history');
    } else if (fragment === 'patient-list') {
        showSection('patient-list');
    } else {
        showSection('new-case');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkUrlFragment();
    
    // Mobile navigation: auto-close when clicking nav links
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.addEventListener('click', function() {
            const navbarCollapse = document.querySelector('#mobileNav');
            const navbarToggler = document.querySelector('.navbar-toggler');
            
            // Only close on mobile
            if (window.innerWidth < 992 && navbarCollapse && navbarCollapse.classList.contains('show')) {
                navbarToggler.click(); // Let Bootstrap handle the closing
            }
        });
    });
});

// Load case history via AJAX
function loadCaseHistory() {
    const content = document.getElementById('case-history-content');
    if (!content) return;
    content.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    
    fetch('/api/cases')
        .then(response => response.json())
        .then(data => {
            console.log('Cases loaded:', data);
            content.innerHTML = renderCaseHistory(data);
        })
        .catch(error => {
            console.error('Error loading cases:', error);
            content.innerHTML = '<div class="alert alert-danger">Error loading case history</div>';
        });
}

// Load patient list via AJAX
function loadPatientList() {
    const content = document.getElementById('patientListContainer');
    if (!content) return;
    content.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-3 text-muted">Loading patients...</p></div>';
    
    fetch('/api/patients')
        .then(response => response.json())
        .then(data => {
            console.log('Patients loaded:', data);
            content.innerHTML = renderPatientList(data);
        })
        .catch(error => {
            console.error('Error loading patients:', error);
            content.innerHTML = '<div class="alert alert-danger">Error loading patient list</div>';
        });
}

// Render case history HTML in single column layout with Riyadh timezone
function renderCaseHistory(cases) {
    if (!cases.length) {
        return '<div class="text-center text-muted py-5"><i class="bi bi-folder2-open display-1 mb-3"></i><h4>No slides found</h4></div>';
    }
    
    let html = '<div class="list-group">';
    cases.forEach(case_ => {
        const badgeClass = case_.visit_type === 'Registration' ? 'bg-success' : 
                          case_.visit_type === 'Orthodontic Visit' ? 'bg-primary' : 'bg-warning';
        
        // Convert to Riyadh timezone (UTC+3)
        const date = new Date(case_.created_at);
        const riyadhTime = new Date(date.getTime() + (3 * 60 * 60 * 1000));
        
        html += `
            <div class="list-group-item border rounded shadow-sm mb-3 p-4">
                <div class="d-flex w-100 justify-content-between align-items-start mb-3">
                    <div class="flex-grow-1">
                        <h5 class="mb-1 fw-bold">${case_.title}</h5>
                        <div class="text-muted small mb-2">
                            <i class="bi bi-calendar me-1"></i>
                            ${riyadhTime.toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            })} at ${riyadhTime.toLocaleTimeString('en-US', {
                                hour: 'numeric', minute: '2-digit', hour12: true
                            })} (Riyadh Time)
                        </div>
                        ${case_.patient ? `
                        <div class="mb-2">
                            <i class="bi bi-person me-1"></i>
                            <strong>Patient:</strong> ${case_.patient.first_name} ${case_.patient.last_name}<br>
                            <small class="text-muted ms-3">MRN: ${case_.patient.mrn} | ${case_.patient.clinic}</small>
                        </div>
                        ` : ''}
                    </div>
                    <span class="badge ${badgeClass} ms-3">${case_.visit_type}</span>
                </div>
                <div class="d-flex gap-2">
                    <a href="/download/${case_.id}" class="btn btn-primary btn-sm">
                        <i class="bi bi-download me-1"></i>Download Slide
                    </a>
                </div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// Store patients data globally for search
var allPatients = [];

// Render patient list HTML
function renderPatientList(patients) {
    // Store patients for search functionality
    allPatients = patients;
    
    if (!patients.length) {
        return '<div class="text-center text-muted py-5"><i class="bi bi-people display-1 mb-3"></i><h4>No patients found</h4></div>';
    }
    
    let html = '<div class="accordion" id="patientAccordion">';
    patients.forEach((patient, index) => {
        html += `
            <div class="accordion-item patient-item" data-patient-name="${patient.first_name.toLowerCase()} ${patient.last_name.toLowerCase()}" 
                 data-patient-mrn="${patient.mrn.toLowerCase()}" data-patient-clinic="${patient.clinic.toLowerCase()}">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                            data-bs-target="#patient-${patient.id}" aria-expanded="false">
                        <div class="d-flex align-items-center w-100">
                            <i class="bi bi-person-circle me-3 text-primary" style="font-size: 1.5rem;"></i>
                            <div class="flex-grow-1">
                                <div class="fw-bold">${patient.first_name} ${patient.last_name}</div>
                                <small class="text-muted">MRN: ${patient.mrn} | ${patient.clinic} | ${patient.cases_count} slide(s)</small>
                            </div>
                        </div>
                    </button>
                </h2>
                <div id="patient-${patient.id}" class="accordion-collapse collapse" 
                     data-bs-parent="#patientAccordion">
                    <div class="accordion-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Medical Record Number:</strong> ${patient.mrn}
                            </div>
                            <div class="col-md-6">
                                <strong>Clinic:</strong> ${patient.clinic}
                            </div>
                        </div>
                        <div class="mb-3">
                            <strong>Patient Since:</strong> ${new Date(patient.created_at).toLocaleDateString()}
                        </div>
                        
                        <h6 class="fw-bold mb-3">Treatment Timeline</h6>
                        ${renderTreatmentTimeline(patient.cases)}
                        
                        <h6 class="fw-bold mb-3 mt-4">Medical Slides (${patient.cases_count})</h6>
                        ${renderPatientCases(patient.cases)}
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}



// Render patient cases in single column with dark theme and Riyadh timezone
function renderPatientCases(cases) {
    if (!cases.length) {
        return '<div class="text-muted">No slides found</div>';
    }
    
    // Group cases by date in Riyadh timezone
    const groupedCases = {};
    cases.forEach(case_ => {
        const date = new Date(case_.created_at);
        // Convert to Riyadh timezone (UTC+3)
        const riyadhTime = new Date(date.getTime() + (3 * 60 * 60 * 1000));
        const dateKey = riyadhTime.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
        });
        
        if (!groupedCases[dateKey]) {
            groupedCases[dateKey] = [];
        }
        groupedCases[dateKey].push({...case_, riyadhTime});
    });
    
    let html = '';
    Object.keys(groupedCases).forEach(dateKey => {
        html += `
            <div class="mb-4">
                <h6 class="text-white px-3 py-2 rounded mb-3" style="background-color: #4a148c; font-weight: bold;">
                    <i class="bi bi-calendar2-week me-2"></i>${dateKey}
                </h6>
                <div class="list-group">
        `;
        
        groupedCases[dateKey].forEach(case_ => {
            const badgeClass = case_.visit_type === 'Registration' ? 'bg-success' : 
                              case_.visit_type === 'Orthodontic Visit' ? 'bg-primary' : 'bg-warning';
            
            html += `
                <div class="list-group-item bg-dark border-secondary mb-2 rounded">
                    <div class="d-flex w-100 justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="mb-1 text-light">${case_.title}</h6>
                            <small class="text-muted">
                                <i class="bi bi-clock me-1"></i>
                                ${case_.riyadhTime.toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                })} (Riyadh Time)
                            </small>
                            ${case_.visit_description ? `
                            <div class="mt-1">
                                <small class="text-muted">
                                    <strong>Notes:</strong> ${case_.visit_description.substring(0, 100)}${case_.visit_description.length > 100 ? '...' : ''}
                                </small>
                            </div>
                            ` : ''}
                        </div>
                        <span class="badge ${badgeClass} ms-3">${case_.visit_type}</span>
                    </div>
                    <div class="mt-2">
                        <a href="/download/${case_.id}" class="btn btn-outline-light btn-sm">
                            <i class="bi bi-download me-1"></i>Download Slide
                        </a>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    return html;
}

// Render treatment timeline
function renderTreatmentTimeline(cases) {
    // Define timeline stages
    const stages = [
        { name: 'Registration', icon: 'bi-person-plus-fill', color: '#28a745' },
        { name: 'Orthodontic Visit', icon: 'bi-arrow-repeat', color: '#007bff' },
        { name: 'Debond', icon: 'bi-check-circle-fill', color: '#ffc107' }
    ];
    
    // Find which stages have cases
    const completedStages = new Set();
    const stageData = {};
    
    cases.forEach(case_ => {
        const visitType = case_.visit_type;
        if (['Registration', 'Orthodontic Visit', 'Debond'].includes(visitType)) {
            completedStages.add(visitType);
            if (!stageData[visitType] || new Date(case_.created_at) > new Date(stageData[visitType].created_at)) {
                stageData[visitType] = case_;
            }
        }
    });
    
    // Count orthodontic visits
    const orthodonticVisits = cases.filter(c => c.visit_type === 'Orthodontic Visit').length;
    
    let html = '<div class="treatment-timeline">';
    
    stages.forEach((stage, index) => {
        const isCompleted = completedStages.has(stage.name);
        const case_ = stageData[stage.name];
        const stageKey = stage.name.toLowerCase().replace(' ', '_');
        
        // Check if next stage is also completed for connection line
        const nextStage = stages[index + 1];
        const nextCompleted = nextStage ? completedStages.has(nextStage.name) : false;
        const showConnection = index < stages.length - 1;
        const connectionActive = isCompleted && nextCompleted;
        
        html += `
            <div class="timeline-item ${isCompleted ? 'completed' : 'pending'}" data-stage="${stageKey}">
                <div class="timeline-marker">
                    <i class="${stage.icon}" style="color: white; font-size: 12px;"></i>
                </div>
                <div class="timeline-content">
                    <div class="timeline-title" style="color: ${isCompleted ? stage.color : '#adb5bd'}">
                        ${stage.name}
                        ${stage.name === 'Orthodontic Visit' && orthodonticVisits > 1 ? ` (${orthodonticVisits})` : ''}
                    </div>
                    ${isCompleted ? `
                        <div class="timeline-date">
                            ${new Date(case_.created_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric'
                            })}
                        </div>
                    ` : `
                        <div class="timeline-pending">Pending</div>
                    `}
                </div>
                ${showConnection ? `<div class="timeline-connection ${connectionActive ? 'active' : ''}"></div>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    return html;
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

// Settings functionality
function loadUserSettings() {
    fetch('/api/user-settings')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Settings loaded:', data);
            
            // Populate form fields
            const fullNameField = document.getElementById('fullName');
            const emailField = document.getElementById('email');
            const positionField = document.getElementById('position');
            const genderField = document.getElementById('gender');
            
            if (fullNameField) fullNameField.value = data.full_name || '';
            if (emailField) emailField.value = data.email || '';
            if (positionField) positionField.value = data.position || '';
            if (genderField) genderField.value = data.gender || '';
            
            // Load clinic list with delete buttons
            loadUserClinics(data.clinics || ['KFMC', 'DC']);
            
            // Load profile image if exists
            if (data.profile_image) {
                const preview = document.getElementById('profilePreview');
                const placeholder = document.getElementById('profilePlaceholder');
                
                if (preview && placeholder) {
                    preview.src = data.profile_image;
                    preview.style.display = 'block';
                    placeholder.style.display = 'none';
                }
                
                // Update navigation profile image
                updateNavProfileImage(data.profile_image, data.gender);
            } else {
                // No image, use gender-based icon
                updateNavProfileImage(null, data.gender || '');
            }
            
            // Update clinic dropdown in registration form
            updateClinicDropdown(data.clinics || []);
        })
        .catch(error => {
            console.error('Error loading settings:', error);
            // Don't load defaults on error - let user manually add clinics
        });
}

// Add form submission handler for settings
document.addEventListener('DOMContentLoaded', function() {
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent default form submission
            
            // Create FormData from form
            const formData = new FormData(settingsForm);
            
            // Submit via AJAX
            fetch('/save_settings', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) {
                    // Show success popup
                    showSuccessPopup('Settings saved successfully!');
                    
                    // Reload settings to update UI
                    setTimeout(() => {
                        loadUserSettings();
                    }, 500);
                } else {
                    throw new Error('Failed to save settings');
                }
            })
            .catch(error => {
                console.error('Error saving settings:', error);
                alert('Error saving settings. Please try again.');
            });
        });
    }
});

function loadUserClinics(clinics) {
    const clinicsList = document.getElementById('clinicsList');
    if (!clinicsList) {
        console.log('clinicsList element not found');
        return;
    }
    
    console.log('Loading clinics:', clinics);
    clinicsList.innerHTML = '';
    
    // Only load actual user clinics, no defaults
    if (clinics && clinics.length > 0) {
        clinics.forEach(clinic => {
            console.log('Adding clinic to list:', clinic);
            addClinicToList(clinic);
        });
    }
}

function addClinicToList(clinicName) {
    const clinicsList = document.getElementById('clinicsList');
    if (!clinicsList) {
        console.log('Cannot add clinic - clinicsList element not found');
        return;
    }
    
    console.log('Adding clinic to DOM:', clinicName);
    const clinicId = `clinic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const clinicHtml = `
        <div class="clinic-item d-flex align-items-center justify-content-between p-3 mb-2 bg-secondary bg-opacity-25 rounded" data-clinic="${clinicName}">
            <div class="d-flex align-items-center">
                <i class="bi bi-building me-2 text-primary"></i>
                <span class="fw-medium">${clinicName}</span>
                <input type="hidden" name="clinics" value="${clinicName}">
            </div>
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeClinicFromList(this)" title="Delete clinic">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    clinicsList.insertAdjacentHTML('beforeend', clinicHtml);
    console.log('Clinic added to DOM, current content:', clinicsList.innerHTML);
}

function addClinic() {
    const container = document.getElementById('clinicsContainer');
    const clinicCount = container.querySelectorAll('.clinic-entry').length;
    
    const clinicHtml = `
        <div class="clinic-entry mb-3">
            <div class="row">
                <div class="col-md-8">
                    <label class="form-label">Clinic Name</label>
                    <input type="text" class="form-control clinic-input" name="clinics[]" 
                           placeholder="Enter clinic name...">
                </div>
                <div class="col-md-4 d-flex align-items-end">
                    <button type="button" class="btn btn-outline-danger btn-sm remove-clinic" 
                            onclick="removeClinic(this)">
                        <i class="bi bi-trash"></i> Remove
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', clinicHtml);
    
    // Show remove buttons if more than one clinic
    if (clinicCount >= 0) {
        container.querySelectorAll('.remove-clinic').forEach(btn => {
            btn.style.display = 'block';
        });
    }
}

function removeClinic(button) {
    const clinicEntry = button.closest('.custom-clinic-entry');
    if (!clinicEntry) return;
    
    // Get clinic name for confirmation
    const clinicCheckbox = clinicEntry.querySelector('input[type="checkbox"]');
    const clinicName = clinicCheckbox ? clinicCheckbox.value : 'this clinic';
    
    if (clinicName !== 'this clinic' && !confirm(`Are you sure you want to delete "${clinicName}"?`)) {
        return;
    }
    
    clinicEntry.remove();
    updateClinicDropdowns();
}

// Add custom clinic function for settings page
function addCustomClinic() {
    const customClinics = document.getElementById('customClinics');
    const clinicCount = customClinics.querySelectorAll('.custom-clinic-entry').length;
    
    const clinicHtml = `
        <div class="custom-clinic-entry mb-3">
            <div class="row">
                <div class="col-md-8">
                    <label class="form-label">Custom Clinic Name</label>
                    <input type="text" class="form-control" name="custom_clinics[]" 
                           placeholder="Enter clinic name...">
                </div>
                <div class="col-md-4 d-flex align-items-end">
                    <button type="button" class="btn btn-outline-danger btn-sm" 
                            onclick="removeClinic(this)" title="Remove clinic">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    customClinics.insertAdjacentHTML('beforeend', clinicHtml);
}

// Add new clinic from input field
function addNewClinic() {
    const newClinicInput = document.getElementById('newClinicName');
    const clinicName = newClinicInput.value.trim();
    
    if (!clinicName) {
        alert('Please enter a clinic name');
        return;
    }
    
    // Check if clinic already exists
    const existingClinics = document.querySelectorAll('.clinic-item');
    for (let item of existingClinics) {
        if (item.dataset.clinic.toLowerCase() === clinicName.toLowerCase()) {
            alert('This clinic already exists');
            return;
        }
    }
    
    addClinicToList(clinicName);
    newClinicInput.value = '';
}

function removeClinicFromList(button) {
    const clinicItem = button.closest('.clinic-item');
    const clinicName = clinicItem.dataset.clinic;
    
    // Show custom confirmation modal
    showDeleteConfirmation(clinicName, () => {
        clinicItem.remove();
        showSuccessPopup(`Clinic "${clinicName}" deleted successfully!`);
    });
}

// Filter patients based on search input
function filterPatients() {
    const searchTerm = document.getElementById('patientSearch').value.toLowerCase();
    const patientItems = document.querySelectorAll('.patient-item');
    let visibleCount = 0;
    
    patientItems.forEach(item => {
        const name = item.getAttribute('data-patient-name');
        const mrn = item.getAttribute('data-patient-mrn');
        const clinic = item.getAttribute('data-patient-clinic');
        
        if (name.includes(searchTerm) || mrn.includes(searchTerm) || clinic.includes(searchTerm)) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show/hide no results message
    const accordion = document.getElementById('patientAccordion');
    let noResultsMsg = document.getElementById('no-search-results');
    
    if (visibleCount === 0 && searchTerm.length > 0) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.id = 'no-search-results';
            noResultsMsg.className = 'text-center text-muted py-4';
            noResultsMsg.innerHTML = '<i class="bi bi-search display-4 mb-3"></i><h5>No patients found</h5><p>Try adjusting your search terms</p>';
            accordion.parentNode.appendChild(noResultsMsg);
        }
        noResultsMsg.style.display = 'block';
    } else if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
}

// Clear patient search
function clearPatientSearch() {
    document.getElementById('patientSearch').value = '';
    filterPatients();
}

// Update patient statistics


// Mobile navigation close function with transition animation
// Update clinic dropdowns throughout the application
function updateClinicDropdowns() {
    const clinicSelects = document.querySelectorAll('#clinic, .clinic-dropdown');
    
    // Get all available clinics
    const primaryClinics = [];
    const customClinics = [];
    
    // Check primary clinics
    const kfmcCheckbox = document.getElementById('kfmc');
    const dcCheckbox = document.getElementById('dc');
    
    if (kfmcCheckbox && kfmcCheckbox.checked) {
        primaryClinics.push('KFMC');
    }
    if (dcCheckbox && dcCheckbox.checked) {
        primaryClinics.push('DC');
    }
    
    // Get custom clinics
    const customClinicInputs = document.querySelectorAll('#customClinics input[type="text"]');
    customClinicInputs.forEach(input => {
        if (input.value.trim()) {
            customClinics.push(input.value.trim());
        }
    });
    
    // Update all clinic dropdowns
    clinicSelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select a clinic</option>';
        
        // Add primary clinics
        primaryClinics.forEach(clinic => {
            const option = document.createElement('option');
            option.value = clinic;
            option.textContent = clinic === 'KFMC' ? 'King Fahd Medical City (KFMC)' : 'Dental Center (DC)';
            select.appendChild(option);
        });
        
        // Add custom clinics
        customClinics.forEach(clinic => {
            const option = document.createElement('option');
            option.value = clinic;
            option.textContent = clinic;
            select.appendChild(option);
        });
        
        // Restore previous selection if still valid
        if (currentValue && [...primaryClinics, ...customClinics].includes(currentValue)) {
            select.value = currentValue;
        }
    });
}

function updateClinicDropdown(clinics) {
    const clinicSelect = document.getElementById('clinic');
    if (!clinicSelect) return;
    
    // Start with empty select
    clinicSelect.innerHTML = '<option value="">Select clinic...</option>';
    
    // Add all user's clinics (including any custom ones)
    clinics.forEach(clinic => {
        if (clinic) {
            const option = document.createElement('option');
            option.value = clinic;
            option.textContent = clinic;
            clinicSelect.appendChild(option);
        }
    });
}

// Load clinic options when page loads
function loadClinicOptions() {
    fetch('/api/user-settings')
        .then(response => response.json())
        .then(data => {
            if (data.clinics) {
                updateClinicDropdown(data.clinics);
            }
        })
        .catch(error => {
            console.log('Error loading clinic options:', error);
            // No fallback - user must add clinics manually
        });
}

function showAbout() {
    alert('Patient Data Organizer v1.0\n\nA professional medical case presentation tool for healthcare professionals.\n\nDeveloped for organizing patient data and creating professional slide presentations.');
}

function showSuccessPopup(message = 'Changes saved successfully!') {
    // Remove any existing popup
    const existing = document.querySelector('.success-popup-overlay');
    if (existing) {
        existing.remove();
    }
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'success-popup-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
    overlay.style.cssText = `
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        backdrop-filter: blur(3px);
        opacity: 0;
        transition: all 0.3s ease;
    `;
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'bg-success text-white p-4 rounded-4 shadow-lg text-center';
    popup.style.cssText = `
        max-width: 350px;
        transform: scale(0.8) translateY(-20px);
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;
    
    popup.innerHTML = `
        <div class="mb-3">
            <div class="bg-white bg-opacity-20 rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                <i class="bi bi-check-lg text-white" style="font-size: 2rem; font-weight: bold;"></i>
            </div>
        </div>
        <h5 class="fw-bold mb-2">Success!</h5>
        <p class="mb-0">${message}</p>
    `;
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // Trigger entrance animation
    setTimeout(() => {
        overlay.style.opacity = '1';
        popup.style.transform = 'scale(1) translateY(0)';
    }, 10);
    
    // Auto hide after 2.5 seconds
    setTimeout(() => {
        overlay.style.opacity = '0';
        popup.style.transform = 'scale(0.9) translateY(-10px)';
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                overlay.remove();
            }
        }, 300);
    }, 2500);
}

function handleProfileImageUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        input.value = '';
        return;
    }
    
    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB.');
        input.value = '';
        return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('profilePreview');
        const placeholder = document.getElementById('uploadPlaceholder');
        
        preview.src = e.target.result;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        
        // Update navigation profile image
        updateNavProfileImage(e.target.result);
    };
    reader.readAsDataURL(file);
}

function updateNavProfileImage(imageSrc, gender = '') {
    const navImage = document.getElementById('navProfileImage');
    const navIcon = document.getElementById('navProfileIcon');
    
    if (imageSrc) {
        navImage.src = imageSrc;
        navImage.style.display = 'block';
        navIcon.style.display = 'none';
    } else {
        navImage.style.display = 'none';
        navIcon.style.display = 'block';
        
        // Update icon based on gender
        if (gender === 'male') {
            navIcon.className = 'bi bi-person-fill-check';
        } else if (gender === 'female') {
            navIcon.className = 'bi bi-person-heart';
        } else {
            navIcon.className = 'bi bi-person-circle';
        }
    }
}

function updateDefaultProfileIcon() {
    const gender = document.getElementById('gender').value;
    const preview = document.getElementById('profilePreview');
    
    // Only update icon if no image is uploaded
    if (!preview || preview.style.display === 'none') {
        updateNavProfileImage(null, gender);
    }
}

function showDeleteConfirmation(itemName, onConfirm) {
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title text-danger">
                            <i class="bi bi-exclamation-triangle me-2"></i>Confirm Deletion
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-3">Are you sure you want to delete "<strong>${itemName}</strong>"?</p>
                        <p class="text-muted small mb-0">This action cannot be undone.</p>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
                            <i class="bi bi-trash me-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('deleteConfirmModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
    
    // Handle confirm button click
    document.getElementById('confirmDeleteBtn').onclick = function() {
        onConfirm();
        modal.hide();
        // Clean up modal after hiding
        setTimeout(() => {
            const modalElement = document.getElementById('deleteConfirmModal');
            if (modalElement) {
                modalElement.remove();
            }
        }, 300);
    };
    
    // Clean up modal when dismissed
    document.getElementById('deleteConfirmModal').addEventListener('hidden.bs.modal', function() {
        setTimeout(() => {
            const modalElement = document.getElementById('deleteConfirmModal');
            if (modalElement) {
                modalElement.remove();
            }
        }, 100);
    });
}

// Bulk Upload with AI Categorization
document.addEventListener('DOMContentLoaded', function() {
    const bulkUploadInput = document.getElementById('bulkUploadInput');
    const bulkUploadBtn = document.getElementById('bulkUploadBtn');
    const clearBulkBtn = document.getElementById('clearBulkBtn');
    const bulkUploadProgress = document.getElementById('bulkUploadProgress');
    const bulkUploadResults = document.getElementById('bulkUploadResults');
    const classificationSummary = document.getElementById('classificationSummary');
    const imageResults = document.getElementById('imageResults');

    if (bulkUploadInput && bulkUploadBtn) {
        bulkUploadInput.addEventListener('change', function() {
            bulkUploadBtn.disabled = this.files.length === 0;
        });

        bulkUploadBtn.addEventListener('click', function() {
            const files = bulkUploadInput.files;
            if (files.length === 0) return;

            // Initialize layout with loading states
            initializeLayoutWithLoading();

            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files[]', files[i]);
            }

            bulkUploadProgress.style.display = 'block';
            bulkUploadResults.style.display = 'block';
            bulkUploadBtn.disabled = true;

            // Simulate progressive loading
            simulateProgressiveLoading(files.length);

            fetch('/bulk_upload_categorize', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Complete the progress bar
                updateProgressBar(100);
                
                setTimeout(() => {
                    bulkUploadProgress.style.display = 'none';
                    bulkUploadBtn.disabled = false;

                    if (data.success) {
                        updateLayoutWithResults(data);
                        clearBulkBtn.style.display = 'inline-block';
                    } else {
                        alert('Error: ' + (data.error || 'Upload failed'));
                    }
                }, 500);
            })
            .catch(error => {
                console.error('Error:', error);
                bulkUploadProgress.style.display = 'none';
                bulkUploadBtn.disabled = false;
                alert('An error occurred during upload');
            });
        });

        clearBulkBtn.addEventListener('click', function() {
            bulkUploadInput.value = '';
            bulkUploadBtn.disabled = true;
            bulkUploadResults.style.display = 'none';
            clearBulkBtn.style.display = 'none';
        });
    }
});

function handleBulkUpload(input) {
    const files = input.files;
    if (files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files[]', files[i]);
    }

    const progressDiv = document.getElementById('bulkUploadProgress');
    const resultsDiv = document.getElementById('bulkUploadResults');
    
    progressDiv.style.display = 'block';
    simulateProgressiveLoading(files.length);

    fetch('/bulk_upload_categorize', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        updateProgressBar(100);
        
        setTimeout(() => {
            progressDiv.style.display = 'none';
            
            if (data.success) {
                updateLayoutGuideWithResults(data);
                resultsDiv.style.display = 'block';
                document.getElementById('classificationSummary').innerHTML = 
                    `Successfully uploaded and organized ${data.files.length} images in the layout guide above.`;
                document.getElementById('classificationSummary').style.display = 'block';
            } else {
                alert('Error: ' + (data.error || 'Upload failed'));
            }
        }, 500);
    })
    .catch(error => {
        console.error('Error:', error);
        progressDiv.style.display = 'none';
        alert('An error occurred during upload');
    });
}

function updateLayoutGuideWithResults(data) {
    const { files } = data;
    
    console.log('Processing AI categorization results:', files);
    
    // Map classifications to placeholder IDs (expand mapping for all possible classifications)
    const classificationMap = {
        // Direct AI model classifications
        'extraoral_right': 'placeholder_extraoral_right',
        'extraoral_frontal': 'placeholder_extraoral_frontal',
        'extraoral_full_face_smile': 'placeholder_extraoral_smiling',
        'extraoral_zoomed_smile': 'placeholder_extraoral_teeth_smile',
        'intraoral_right': 'placeholder_intraoral_right',
        'intraoral_front': 'placeholder_intraoral_frontal',
        'intraoral_left': 'placeholder_intraoral_left',
        'upper_occlusal': 'placeholder_intraoral_upper',
        'lower_occlusal': 'placeholder_intraoral_lower',
        
        // Legacy _view format support
        'extraoral_right_view': 'placeholder_extraoral_right',
        'extraoral_frontal_view': 'placeholder_extraoral_frontal',
        'extraoral_smiling_view': 'placeholder_extraoral_smiling',
        'extraoral_teeth_smile_view': 'placeholder_extraoral_teeth_smile',
        'intraoral_right_view': 'placeholder_intraoral_right',
        'intraoral_frontal_view': 'placeholder_intraoral_frontal',
        'intraoral_left_view': 'placeholder_intraoral_left',
        'intraoral_upper_occlusal_view': 'placeholder_intraoral_upper',
        'intraoral_lower_occlusal_view': 'placeholder_intraoral_lower'
    };
    
    let placedImages = 0;
    
    // Update each classified image in its designated position
    files.forEach((file, index) => {
        const placeholderId = classificationMap[file.classification];
        console.log(`File ${file.original_name}: classification=${file.classification}, placeholderId=${placeholderId}`);
        
        if (placeholderId) {
            const placeholder = document.getElementById(placeholderId);
            if (placeholder) {
                setTimeout(() => {
                    updatePlaceholderWithDirectImage(placeholderId, file);
                    placedImages++;
                    console.log(`Placed image ${file.original_name} in ${placeholderId}`);
                }, index * 300); // Staggered placement for visual effect
            } else {
                console.error(`Placeholder ${placeholderId} not found for ${file.original_name}`);
            }
        } else {
            console.warn(`No placeholder mapping found for classification: ${file.classification}`);
        }
    });
    
    // Show completion message after all images are processed
    setTimeout(() => {
        console.log(`Successfully placed ${placedImages} out of ${files.length} images`);
        if (placedImages > 0) {
            showSuccessPopup(`Successfully organized ${placedImages} images in the layout guide!`);
        }
    }, files.length * 300 + 500);
}

function displayBulkUploadResults(data) {
    const { files, classification_summary } = data;
    
    // Group files by category
    const categorizedFiles = {
        'extraoral_frontal_view': [],
        'extraoral_right_view': [],
        'extraoral_smiling_view': [],
        'extraoral_teeth_smile_view': [],
        'intraoral_frontal_view': [],
        'intraoral_right_view': [],
        'intraoral_left_view': [],
        'intraoral_upper_occlusal_view': [],
        'intraoral_lower_occlusal_view': []
    };

    files.forEach((file, index) => {
        file.originalIndex = index;
        if (categorizedFiles[file.classification]) {
            categorizedFiles[file.classification].push(file);
        } else {
            // Handle any unknown classifications
            if (!categorizedFiles['other']) categorizedFiles['other'] = [];
            categorizedFiles['other'].push(file);
        }
    });

    // Display summary
    classificationSummary.innerHTML = '';
    if (classification_summary) {
        const totalFiles = Object.values(categorizedFiles).reduce((sum, arr) => sum + arr.length, 0);
        const summaryHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <strong>AI Classification Complete:</strong> 
                    ${totalFiles} images categorized
                </div>
            </div>
        `;
        classificationSummary.innerHTML = summaryHTML;
    }

    imageResults.innerHTML = '';
    
    // Display in specific layout format
    let layoutHTML = '';
    
    // Hide the initial template guide and show categorized results
    const layoutGuide = document.getElementById('layoutGuide');
    if (layoutGuide) {
        layoutGuide.style.display = 'none';
    }
    
    // Show updated guide with actual categorized images
    layoutHTML += `
        <div class="alert alert-success border mb-4" id="categorizedGuide">
            <h6 class="text-success mb-3">
                <i class="bi bi-check-circle me-2"></i>Your Images Organized
            </h6>
            <p class="small text-muted mb-3">Review the AI categorization below. You can adjust classifications if needed before saving:</p>
        </div>
    `;
    
    // Extraoral section - 3 in a row
    const extraoralCategories = ['extraoral_right_view', 'extraoral_frontal_view', 'extraoral_smiling_view'];
    const extraoralFiles = extraoralCategories.map(cat => categorizedFiles[cat][0] || null);
    
    if (extraoralFiles.some(file => file !== null)) {
        layoutHTML += `
            <div class="col-12 mb-4">
                <h5 class="text-primary mb-3">📸 Extraoral Views</h5>
                <div class="row g-3">
                    ${createLayoutRow(extraoralFiles, ['Right Side', 'Frontal', 'Smiling'])}
                </div>
            </div>
        `;
    }
    
    // Intraoral section - 3 in first row, 2 in second row
    const intraoral3Categories = ['intraoral_right_view', 'intraoral_frontal_view', 'intraoral_left_view'];
    const intraoral2Categories = ['intraoral_upper_occlusal_view', 'intraoral_lower_occlusal_view'];
    
    const intraoral3Files = intraoral3Categories.map(cat => categorizedFiles[cat][0] || null);
    const intraoral2Files = intraoral2Categories.map(cat => categorizedFiles[cat][0] || null);
    
    if (intraoral3Files.some(file => file !== null) || intraoral2Files.some(file => file !== null)) {
        layoutHTML += `
            <div class="col-12 mb-4">
                <h5 class="text-success mb-3">🦷 Intraoral Views</h5>
                <div class="row g-3 mb-3">
                    ${createLayoutRow(intraoral3Files, ['Right Side', 'Frontal', 'Left Side'])}
                </div>
                <div class="row g-3 justify-content-center">
                    ${createLayoutRow(intraoral2Files, ['Upper Occlusal', 'Lower Occlusal'], 'col-md-4')}
                </div>
            </div>
        `;
    }
    
    // Display remaining files in other categories
    const otherCategories = ['extraoral_teeth_smile_view'];
    otherCategories.forEach(category => {
        const categoryFiles = categorizedFiles[category];
        if (categoryFiles.length > 0) {
            layoutHTML += `
                <div class="col-12 mb-3">
                    <h6 class="text-warning mb-3">Other: ${category.replace(/_/g, ' ').toUpperCase()}</h6>
                    <div class="row g-3">
                        ${categoryFiles.map(file => createLayoutCard(file)).join('')}
                    </div>
                </div>
            `;
        }
    });
    
    // Add final submission guide
    layoutHTML += `
        <div class="col-12 mt-4">
            <div class="alert alert-info">
                <h6 class="mb-2">
                    <i class="bi bi-info-circle me-2"></i>Ready to Save
                </h6>
                <p class="mb-0 small">Your images have been organized according to dental photography standards. Make any final adjustments using the dropdowns above, then click "Add to Case" for each image you want to include.</p>
            </div>
        </div>
    `;
    
    imageResults.innerHTML = layoutHTML;
    bulkUploadResults.style.display = 'block';
}

function initializeLayoutWithLoading() {
    // Hide the initial template guide
    const layoutGuide = document.getElementById('layoutGuide');
    if (layoutGuide) {
        layoutGuide.style.display = 'none';
    }
    
    // Show the empty layout structure with loading states
    const imageResults = document.getElementById('imageResults');
    imageResults.innerHTML = `
        <div class="alert alert-info border mb-4">
            <h6 class="text-info mb-3">
                <i class="bi bi-cloud-upload me-2"></i>Processing Your Images
            </h6>
            <p class="small text-muted mb-0">AI is analyzing and categorizing your dental images...</p>
        </div>
        
        <!-- Extraoral Section -->
        <div class="col-12 mb-4">
            <h5 class="text-primary mb-3">📸 Extraoral Views</h5>
            <div class="row g-3">
                <div class="col-md-4">
                    <div class="card h-100 border-dashed text-center p-4 layout-placeholder-box" id="placeholder_extraoral_right">
                        <div class="loading-content">
                            <div class="spinner-border text-primary mb-2" role="status"></div>
                            <p class="mb-0 small">Analyzing Right Side...</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card h-100 border-dashed text-center p-4 layout-placeholder-box" id="placeholder_extraoral_frontal">
                        <div class="loading-content">
                            <div class="spinner-border text-primary mb-2" role="status"></div>
                            <p class="mb-0 small">Analyzing Frontal...</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card h-100 border-dashed text-center p-4 layout-placeholder-box" id="placeholder_extraoral_smiling">
                        <div class="loading-content">
                            <div class="spinner-border text-primary mb-2" role="status"></div>
                            <p class="mb-0 small">Analyzing Smiling...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Intraoral Section -->
        <div class="col-12 mb-4">
            <h5 class="text-success mb-3">🦷 Intraoral Views</h5>
            <div class="row g-3 mb-3">
                <div class="col-md-4">
                    <div class="card h-100 border-dashed text-center p-4 layout-placeholder-box" id="placeholder_intraoral_right">
                        <div class="loading-content">
                            <div class="spinner-border text-success mb-2" role="status"></div>
                            <p class="mb-0 small">Analyzing Right Side...</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card h-100 border-dashed text-center p-4 layout-placeholder-box" id="placeholder_intraoral_frontal">
                        <div class="loading-content">
                            <div class="spinner-border text-success mb-2" role="status"></div>
                            <p class="mb-0 small">Processing Frontal...</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card h-100 border-dashed text-center p-4 layout-placeholder-box" id="placeholder_intraoral_left">
                        <div class="loading-content">
                            <div class="spinner-border text-success mb-2" role="status"></div>
                            <p class="mb-0 small">Processing Left Side...</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row g-3 justify-content-center">
                <div class="col-md-4">
                    <div class="card h-100 border-dashed text-center p-4 layout-placeholder-box" id="placeholder_intraoral_upper">
                        <div class="loading-content">
                            <div class="spinner-border text-success mb-2" role="status"></div>
                            <p class="mb-0 small">Processing Upper...</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card h-100 border-dashed text-center p-4 layout-placeholder-box" id="placeholder_intraoral_lower">
                        <div class="loading-content">
                            <div class="spinner-border text-success mb-2" role="status"></div>
                            <p class="mb-0 small">Processing Lower...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateLayoutWithResults(data) {
    const { files } = data;
    
    // Map classifications to placeholder IDs
    const classificationMap = {
        'extraoral_right_view': 'placeholder_extraoral_right',
        'extraoral_frontal_view': 'placeholder_extraoral_frontal',
        'extraoral_smiling_view': 'placeholder_extraoral_smiling',
        'intraoral_right_view': 'placeholder_intraoral_right',
        'intraoral_frontal_view': 'placeholder_intraoral_frontal',
        'intraoral_left_view': 'placeholder_intraoral_left',
        'intraoral_upper_occlusal_view': 'placeholder_intraoral_upper',
        'intraoral_lower_occlusal_view': 'placeholder_intraoral_lower'
    };
    
    // Update each classified image in its designated position with staggered timing
    const isMobile = window.innerWidth <= 768;
    const staggerDelay = isMobile ? 200 : 300; // Faster animations on mobile
    
    files.forEach((file, index) => {
        const placeholderId = classificationMap[file.classification];
        if (placeholderId) {
            setTimeout(() => {
                updatePlaceholderWithImage(placeholderId, file, index);
                // Update progress as images are placed
                const progressPercentage = 80 + ((index + 1) / files.length) * 15;
                updateProgressBar(Math.round(progressPercentage));
            }, index * staggerDelay);
        }
    });
    
    // After all updates, show final completion message
    setTimeout(() => {
        updateProgressBar(100);
        setTimeout(() => {
            showCompletionMessage();
        }, 200);
    }, files.length * staggerDelay + 500);
}

function updatePlaceholderWithImage(placeholderId, file, index) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;
    
    const confidenceColor = getConfidenceColor(file.confidence);
    const isExtraoral = file.classification.startsWith('extraoral');
    const isMobile = window.innerWidth <= 768;
    
    // Apply CSS classes for proper sizing - preserve full image
    const imageClasses = isExtraoral ? 'layout-img extraoral' : 'layout-img';
    const imageStyle = `height: 100%; width: 100%; object-fit: contain; cursor: pointer;`;
    
    // Animate the transition
    placeholder.style.transition = 'all 0.3s ease';
    placeholder.classList.remove('border-dashed');
    placeholder.classList.add('border-success');
    
    placeholder.innerHTML = `
        <div class="position-relative w-100 h-100">
            <img src="/uploads/${file.filename}" alt="${file.original_name}" class="${imageClasses}" style="${imageStyle}" onclick="showImageModal('/uploads/${file.filename}', '${file.original_name}', '${file.classification}')">
            <span class="badge ${confidenceColor} position-absolute top-0 end-0 m-1">
                ${Math.round(file.confidence * 100)}%
            </span>
        </div>
        <div class="p-2">
            <div class="mb-2">
                                        <!-- Filename text removed for cleaner UI -->
            </div>
            
            <div class="mb-2">
                <select class="form-select form-select-sm" id="select_${index}" onchange="updateClassificationDisplay(${index}, this.value)">
                    <option value="extraoral_frontal_view" ${file.classification === 'extraoral_frontal_view' ? 'selected' : ''}>Extraoral Frontal</option>
                    <option value="extraoral_right_view" ${file.classification === 'extraoral_right_view' ? 'selected' : ''}>Extraoral Right</option>
                    <option value="extraoral_smiling_view" ${file.classification === 'extraoral_smiling_view' ? 'selected' : ''}>Extraoral Smiling</option>
                    <option value="extraoral_teeth_smile_view" ${file.classification === 'extraoral_teeth_smile_view' ? 'selected' : ''}>Extraoral Teeth Smile</option>
                    <option value="intraoral_frontal_view" ${file.classification === 'intraoral_frontal_view' ? 'selected' : ''}>Intraoral Frontal</option>
                    <option value="intraoral_right_view" ${file.classification === 'intraoral_right_view' ? 'selected' : ''}>Intraoral Right</option>
                    <option value="intraoral_left_view" ${file.classification === 'intraoral_left_view' ? 'selected' : ''}>Intraoral Left</option>
                    <option value="intraoral_upper_occlusal_view" ${file.classification === 'intraoral_upper_occlusal_view' ? 'selected' : ''}>Upper Occlusal</option>
                    <option value="intraoral_lower_occlusal_view" ${file.classification === 'intraoral_lower_occlusal_view' ? 'selected' : ''}>Lower Occlusal</option>
                </select>
            </div>
            
            <button class="btn btn-sm btn-primary w-100" onclick="assignToCategory('${file.filename}', document.getElementById('select_${index}').value)">
                Add to Case
            </button>
        </div>
    `;
    
    // Remove onclick handler from the placeholder to prevent accidental uploads
    placeholder.removeAttribute('onclick');
}

function showCompletionMessage() {
    const imageResults = document.getElementById('imageResults');
    const completionAlert = `
        <div class="col-12 mt-4">
            <div class="alert alert-success">
                <h6 class="mb-2">
                    <i class="bi bi-check-circle me-2"></i>Classification Complete
                </h6>
                <p class="mb-0 small">Your images have been organized in the layout above. Review the classifications and make any adjustments using the dropdowns, then click "Add to Case" for each image.</p>
            </div>
        </div>
    `;
    imageResults.innerHTML += completionAlert;
}

function simulateProgressiveLoading(totalFiles) {
    let progress = 0;
    const increment = 80 / totalFiles; // Reserve 20% for final processing
    const isMobile = window.innerWidth <= 768;
    const interval = isMobile ? 150 : 200; // Faster on mobile for better UX
    
    const progressInterval = setInterval(() => {
        progress += increment / 4; // Smooth incremental progress
        if (progress >= 80) {
            progress = 80;
            clearInterval(progressInterval);
        }
        updateProgressBar(Math.round(progress));
    }, interval);
}

function updateProgressBar(percentage) {
    const progressBar = document.querySelector('#bulkUploadProgress .progress-bar');
    const progressText = document.querySelector('#bulkUploadProgress .text-info');
    const progressBadge = document.getElementById('progressPercentage');
    
    if (progressBar) {
        progressBar.style.width = percentage + '%';
        progressBar.setAttribute('aria-valuenow', percentage);
    }
    
    if (progressBadge) {
        progressBadge.textContent = percentage + '%';
    }
    
    // Hide the processing text - only show the loader animation
    if (progressText) {
        progressText.style.display = 'none';
    }
}

function createLayoutRow(files, labels, colClass = 'col-md-4') {
    return files.map((file, index) => {
        const categoryKey = getCategoryKeyFromLabel(labels[index]);
        if (file) {
            return createLayoutCard(file, colClass, labels[index]);
        } else {
            return `
                <div class="${colClass}">
                    <div class="card h-100 border-dashed text-center p-4 layout-placeholder-box" style="border: 2px dashed #dee2e6;" id="placeholder_${categoryKey}">
                        <div class="text-muted placeholder-content">
                            <i class="bi bi-image" style="font-size: 2rem;"></i>
                            <p class="mt-2 mb-0">${labels[index]}</p>
                            <small>No image classified</small>
                        </div>
                        <div class="loading-content" style="display: none;">
                            <div class="spinner-border text-primary mb-2" role="status"></div>
                            <p class="mb-0 small">Processing...</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');
}

function getCategoryKeyFromLabel(label) {
    const labelMap = {
        'Right Side': 'extraoral_right',
        'Frontal': 'extraoral_frontal', 
        'Smiling': 'extraoral_smiling',
        'Left Side': 'intraoral_left',
        'Upper Occlusal': 'intraoral_upper',
        'Lower Occlusal': 'intraoral_lower'
    };
    return labelMap[label] || label.toLowerCase().replace(/\s+/g, '_');
}

function createLayoutCard(file, colClass = 'col-md-4', label = '') {
    const confidenceColor = getConfidenceColor(file.confidence);
    const index = file.originalIndex;
    
    // Responsive image styles with specific handling for zoomed smile
    const isExtraoral = file.classification.startsWith('extraoral');
    const isZoomedSmile = file.classification === 'extraoral_teeth_smile_view';
    
    let imageStyle;
    if (isExtraoral) {
        // For extraoral images, use larger container and fit the full image properly
        imageStyle = "height: 280px; width: 100%; object-fit: contain; cursor: pointer; margin: 0 auto; display: block;";
    } else {
        // Intraoral images
        imageStyle = "height: 150px; width: 100%; object-fit: cover; cursor: pointer;";
    }
    
    return `
        <div class="${colClass} layout-card-mobile">
            <div class="card h-100 shadow-sm image-card-hover">
                <div class="position-relative d-flex justify-content-center">
                    <img src="/uploads/${file.filename}" alt="${file.original_name}" class="card-img-top layout-img" style="${imageStyle}" onclick="showImageModal('/uploads/${file.filename}', '${file.original_name}', '${file.classification}')">
                    <span class="badge ${confidenceColor} position-absolute top-0 end-0 m-1" id="badge_${index}">
                        ${Math.round(file.confidence * 100)}%
                    </span>
                    ${label ? `<div class="badge bg-dark position-absolute bottom-0 start-0 m-1 layout-label">${label}</div>` : ''}
                </div>
                <div class="card-body p-2">
                    <div class="mb-2">
                        <!-- Filename text removed for cleaner UI -->
                    </div>
                    
                    <div class="mb-2">
                        <select class="form-select form-select-sm" id="select_${index}" onchange="updateClassificationDisplay(${index}, this.value)">
                            <option value="extraoral_frontal_view" ${file.classification === 'extraoral_frontal_view' ? 'selected' : ''}>Extraoral Frontal</option>
                            <option value="extraoral_right_view" ${file.classification === 'extraoral_right_view' ? 'selected' : ''}>Extraoral Right</option>
                            <option value="extraoral_smiling_view" ${file.classification === 'extraoral_smiling_view' ? 'selected' : ''}>Extraoral Smiling</option>
                            <option value="extraoral_teeth_smile_view" ${file.classification === 'extraoral_teeth_smile_view' ? 'selected' : ''}>Extraoral Teeth Smile</option>
                            <option value="intraoral_frontal_view" ${file.classification === 'intraoral_frontal_view' ? 'selected' : ''}>Intraoral Frontal</option>
                            <option value="intraoral_right_view" ${file.classification === 'intraoral_right_view' ? 'selected' : ''}>Intraoral Right</option>
                            <option value="intraoral_left_view" ${file.classification === 'intraoral_left_view' ? 'selected' : ''}>Intraoral Left</option>
                            <option value="intraoral_upper_occlusal_view" ${file.classification === 'intraoral_upper_occlusal_view' ? 'selected' : ''}>Upper Occlusal</option>
                            <option value="intraoral_lower_occlusal_view" ${file.classification === 'intraoral_lower_occlusal_view' ? 'selected' : ''}>Lower Occlusal</option>
                        </select>
                    </div>
                    
                    <button class="btn btn-sm btn-primary w-100" onclick="assignToCategory('${file.filename}', document.getElementById('select_${index}').value)" id="use_btn_${index}">
                        Add to Case
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createImageCard(file, category) {
    const confidenceColor = getConfidenceColor(file.confidence);
    const index = file.originalIndex;
    
    // Determine image display style based on classification with specific handling for zoomed smile
    const isExtraoral = file.classification.startsWith('extraoral');
    const isZoomedSmile = file.classification === 'extraoral_teeth_smile_view';
    
    let imageStyle;
    if (isExtraoral) {
        // For extraoral images, use larger container and fit the full image properly
        imageStyle = "height: 240px; width: 100%; object-fit: contain; cursor: pointer; margin: 0 auto; display: block;";
    } else {
        // Intraoral images
        imageStyle = "height: 120px; width: 100%; object-fit: cover; cursor: pointer;";
    }
    
    return `
        <div class="col-md-3 col-lg-2">
            <div class="card h-100 shadow-sm image-card-hover">
                <div class="position-relative d-flex justify-content-center">
                    <img src="/uploads/${file.filename}" alt="${file.original_name}" class="card-img-top" style="${imageStyle}" onclick="showImageModal('/uploads/${file.filename}', '${file.original_name}', '${file.classification}')">
                    <span class="badge ${confidenceColor} position-absolute top-0 end-0 m-1" id="badge_${index}">
                        ${Math.round(file.confidence * 100)}%
                    </span>
                    <button type="button" class="btn btn-sm btn-info position-absolute" onclick="event.stopPropagation(); editImage('/uploads/${file.filename}', 'bulk_${index}')" style="top: 5px; left: 5px; padding: 0.25rem 0.4rem; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" title="Edit image">
                        <i class="bi bi-pencil" style="font-size: 0.7rem;"></i>
                    </button>
                </div>
                <div class="card-body p-2">
                    <div class="mb-2">
                        <!-- Filename text removed for cleaner UI -->
                    </div>
                    
                    <div class="mb-2">
                        <select class="form-select form-select-sm" id="select_${index}" onchange="updateClassificationDisplay(${index}, this.value)">
                            <option value="extraoral_frontal_view" ${file.classification === 'extraoral_frontal_view' ? 'selected' : ''}>Extraoral Frontal</option>
                            <option value="extraoral_right_view" ${file.classification === 'extraoral_right_view' ? 'selected' : ''}>Extraoral Right</option>
                            <option value="extraoral_smiling_view" ${file.classification === 'extraoral_smiling_view' ? 'selected' : ''}>Extraoral Smiling</option>
                            <option value="extraoral_teeth_smile_view" ${file.classification === 'extraoral_teeth_smile_view' ? 'selected' : ''}>Extraoral Teeth Smile</option>
                            <option value="intraoral_frontal_view" ${file.classification === 'intraoral_frontal_view' ? 'selected' : ''}>Intraoral Frontal</option>
                            <option value="intraoral_right_view" ${file.classification === 'intraoral_right_view' ? 'selected' : ''}>Intraoral Right</option>
                            <option value="intraoral_left_view" ${file.classification === 'intraoral_left_view' ? 'selected' : ''}>Intraoral Left</option>
                            <option value="intraoral_upper_occlusal_view" ${file.classification === 'intraoral_upper_occlusal_view' ? 'selected' : ''}>Upper Occlusal</option>
                            <option value="intraoral_lower_occlusal_view" ${file.classification === 'intraoral_lower_occlusal_view' ? 'selected' : ''}>Lower Occlusal</option>
                        </select>
                    </div>
                    
                    <button class="btn btn-sm btn-primary w-100" onclick="assignToCategory('${file.filename}', document.getElementById('select_${index}').value)" id="use_btn_${index}">
                        Add to Case
                    </button>
                </div>
            </div>
        </div>
    `;
}

function getConfidenceColor(confidence) {
    if (confidence >= 0.8) return 'bg-success';
    if (confidence >= 0.6) return 'bg-warning';
    return 'bg-danger';
}

function getClassificationIcon(classification) {
    const icons = {
        'extraoral_left': '👤←',
        'extraoral_right': '👤→', 
        'extraoral_front': '👤',
        'intraoral_left': '🦷←',
        'intraoral_right': '🦷→',
        'intraoral_front': '🦷',
        'intraoral_occlusal': '🦷⬇',
        'other': '?',
        // Legacy support
        'left': '←',
        'right': '→',
        'front': '↑',
        'occlusal': '⬇'
    };
    return icons[classification] || '?';
}

function updateClassificationDisplay(index, newClassification) {
    const badge = document.getElementById(`badge_${index}`);
    const icon = getClassificationIcon(newClassification);
    
    if (badge) {
        badge.innerHTML = `${icon} ${newClassification.toUpperCase()}`;
        badge.className = `badge bg-info position-absolute top-0 end-0 m-1`; // Use info color for manually corrected
    }
}

function showImageModal(imageSrc, imageName, classification = '') {
    // No rotation applied - show images in their original orientation
    const imageStyle = "max-height: 70vh;";
    
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="imageModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${imageName}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img src="${imageSrc}" alt="${imageName}" class="img-fluid" style="${imageStyle}">
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('imageModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('imageModal'));
    modal.show();
    
    // Clean up modal when hidden
    document.getElementById('imageModal').addEventListener('hidden.bs.modal', function() {
        setTimeout(() => {
            const modalElement = document.getElementById('imageModal');
            if (modalElement) {
                modalElement.remove();
            }
        }, 100);
    });
}

function assignToCategory(filename, classification) {
    const fieldMapping = {
        'extraoral_left': 'extra_oral_left',
        'extraoral_right': 'extra_oral_right', 
        'extraoral_front': 'extra_oral_front',
        'intraoral_left': 'intra_oral_left',
        'intraoral_right': 'intra_oral_right',
        'intraoral_front': 'intra_oral_front',
        'intraoral_occlusal': 'intra_oral_center',
        // Legacy support
        'left': 'extra_oral_left',
        'right': 'extra_oral_right', 
        'front': 'extra_oral_front',
        'occlusal': 'intra_oral_center'
    };
    
    const fieldName = fieldMapping[classification];
    if (fieldName) {
        const targetInput = document.querySelector(`input[name="${fieldName}"]`);
        if (targetInput) {
            const container = targetInput.closest('.image-upload-container');
            if (container) {
                const placeholder = container.querySelector('.upload-placeholder');
                const preview = container.querySelector('.image-preview');
                
                if (placeholder && preview) {
                    placeholder.style.display = 'none';
                    preview.style.display = 'block';
                    
                    const previewImg = preview.querySelector('.preview-img');
                    if (previewImg) {
                        previewImg.src = '/uploads/' + filename;
                        previewImg.alt = `Classified as: ${classification}`;
                    }
                    
                    container.setAttribute('data-ai-file', filename);
                    container.setAttribute('data-ai-classification', classification);
                    
                    showSuccessPopup(`Image assigned to ${classification.toUpperCase()} category`);
                }
            }
        }
    } else {
        alert(`Please manually assign this ${classification} image to the appropriate field`);
    }
}

// Direct upload functionality for guide boxes
function triggerFileUpload(category) {
    const fileInput = document.getElementById(`upload_${category}`);
    if (fileInput) {
        fileInput.click();
    }
}

function handleDirectUpload(input, classification) {
    const file = input.files[0];
    if (!file) return;
    
    const placeholderId = getPlaceholderIdFromClassification(classification);
    const placeholder = document.getElementById(placeholderId);
    
    if (!placeholder) {
        console.error(`Placeholder not found for classification: ${classification}`);
        return;
    }
    
    console.log(`Direct upload: ${file.name} → ${classification} → ${placeholderId}`);
    
    // Show loading state
    showUploadingState(placeholder);
    
    // Create form data and upload - use single file upload endpoint to avoid AI classification
    const formData = new FormData();
    formData.append('file', file);
    formData.append('direct_classification', classification); // Tell server this is a direct upload
    formData.append('placeholder_id', placeholderId);
    
    fetch('/upload_single_files', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.filename) {
            // Create file object for display - use the EXACT classification specified by user
            const fileObj = {
                filename: data.filename,
                original_name: file.name,
                classification: classification, // Force the exact classification from the upload box
                confidence: 1.0 // 100% confidence for direct placement
            };
            
            console.log(`Successfully uploaded to ${placeholderId}:`, fileObj);
            
            // Update placeholder with uploaded image
            updatePlaceholderWithDirectImage(placeholderId, fileObj);
        } else {
            console.error('Upload failed:', data.error || 'Unknown error');
            showUploadError(placeholder, data.error || 'Upload failed');
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        showUploadError(placeholder, 'Upload error occurred');
    });
}

function getPlaceholderIdFromClassification(classification) {
    const mappings = {
        // AI model classifications to placeholder IDs
        'extraoral_right': 'placeholder_extraoral_right',
        'extraoral_frontal': 'placeholder_extraoral_frontal',
        'extraoral_full_face_smile': 'placeholder_extraoral_smiling',      // FIXED: Full face smile goes to smiling placeholder
        'extraoral_zoomed_smile': 'placeholder_extraoral_teeth_smile',     // FIXED: Zoomed smile goes to teeth smile placeholder
        'intraoral_right': 'placeholder_intraoral_right',
        'intraoral_front': 'placeholder_intraoral_frontal',
        'intraoral_left': 'placeholder_intraoral_left',
        'upper_occlusal': 'placeholder_intraoral_upper',
        'lower_occlusal': 'placeholder_intraoral_lower',
        
        // Legacy support for old view format (if needed)
        'extraoral_right_view': 'placeholder_extraoral_right',
        'extraoral_frontal_view': 'placeholder_extraoral_frontal',
        'extraoral_smiling_view': 'placeholder_extraoral_smiling',
        'extraoral_teeth_smile_view': 'placeholder_extraoral_teeth_smile',
        'intraoral_right_view': 'placeholder_intraoral_right',
        'intraoral_frontal_view': 'placeholder_intraoral_frontal',
        'intraoral_left_view': 'placeholder_intraoral_left',
        'intraoral_upper_occlusal_view': 'placeholder_intraoral_upper',
        'intraoral_lower_occlusal_view': 'placeholder_intraoral_lower'
    };
    return mappings[classification];
}

function showUploadingState(placeholder) {
    const placeholderId = placeholder.id;
    placeholder.innerHTML = `
        <div class="loading-content d-flex flex-column align-items-center justify-content-center h-100">
            <div class="spinner-border text-primary mb-2" role="status" style="width: 1.5rem; height: 1.5rem;"></div>
            <div class="small text-primary">Uploading...</div>
            <div class="small text-muted mt-1" id="${placeholderId}_progress">0%</div>
        </div>
        <div class="upload-progress">
            <div class="upload-progress-bar" id="${placeholderId}_bar"></div>
        </div>
    `;
    
    // Start progress animation
    simulateUploadProgress(placeholderId);
}

function updatePlaceholderWithDirectImage(placeholderId, file) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
        console.error(`Placeholder ${placeholderId} not found`);
        return;
    }
    
    console.log(`Updating placeholder ${placeholderId} with file ${file.filename} (classification: ${file.classification})`);
    
    const confidenceColor = getConfidenceColor(file.confidence);
    const isExtraoral = file.classification.startsWith('extraoral');
    const isZoomedSmile = file.classification === 'extraoral_teeth_smile_view' || placeholderId === 'placeholder_extraoral_teeth_smile';
    const isMobile = window.innerWidth <= 768;
    
    // Apply proper sizing - fit image to container with proper aspect ratio
    const imageClasses = isExtraoral ? 'layout-img extraoral' : 'layout-img';
    
    // For extraoral images, use object-fit: contain to show full image, for intraoral use cover
    const objectFit = isExtraoral ? 'contain' : 'cover';
    const imageStyle = `height: 100%; width: 100%; object-fit: ${objectFit}; cursor: pointer; border-radius: 0.375rem;`;
    
    // Animate the transition
    placeholder.style.transition = 'all 0.3s ease';
    placeholder.classList.remove('border-dashed');
    placeholder.classList.add('border-success');
    
    // Adjust container size for extraoral images to show full image properly
    if (isExtraoral) {
        placeholder.style.minHeight = isMobile ? '240px' : '280px';
        placeholder.style.height = isMobile ? '240px' : '280px';
        placeholder.style.maxHeight = isMobile ? '300px' : '350px';
    } else {
        // Set minimum height for intraoral images
        const minHeight = isMobile ? '120px' : '150px';
        placeholder.style.minHeight = minHeight;
        placeholder.style.height = 'auto';
    }
    
    // Add a loading indicator first
    placeholder.innerHTML = `
        <div class="d-flex align-items-center justify-content-center h-100">
            <div class="spinner-border text-success" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    
    // Load image and update placeholder
    const img = new Image();
    img.onload = function() {
        placeholder.innerHTML = `
            <div class="position-relative w-100 h-100">
                <img src="/uploads/${file.filename}" alt="${file.original_name}" class="${imageClasses}" style="${imageStyle}" onclick="showImageModal('/uploads/${file.filename}', '${file.original_name}', '${file.classification}')">
                <span class="badge ${confidenceColor} position-absolute top-0 end-0 m-1" style="font-size: 0.7rem;">
                    ${Math.round(file.confidence * 100)}% AI
                </span>
                <div class="position-absolute" style="top: 5px; left: 5px; z-index: 10; display: flex; flex-direction: column; gap: 3px;">
                    <button type="button" class="btn btn-sm btn-danger" onclick="event.preventDefault(); event.stopPropagation(); removeDirectImage('${placeholderId}')" style="padding: 0.25rem 0.4rem; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" title="Remove image">
                        <i class="bi bi-x" style="font-size: 0.8rem;"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-info" onclick="event.preventDefault(); event.stopPropagation(); editImage('/uploads/${file.filename}', '${placeholderId}')" style="padding: 0.25rem 0.4rem; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" title="Edit image">
                        <i class="bi bi-pencil" style="font-size: 0.7rem;"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-warning" onclick="event.preventDefault(); event.stopPropagation(); replaceDirectImage('${placeholderId}')" style="padding: 0.25rem 0.4rem; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" title="Replace image">
                        <i class="bi bi-arrow-repeat" style="font-size: 0.7rem;"></i>
                    </button>
                </div>
            </div>
            <input type="hidden" name="image_files" value="${file.filename}">
                            <!-- Filename text removed for cleaner UI -->
        `;
        
        // Remove onclick handler from the placeholder to prevent accidental uploads
        placeholder.removeAttribute('onclick');
        
        // Animate appearance
        placeholder.style.opacity = '0';
        placeholder.style.transform = 'scale(0.8)';
        setTimeout(() => {
            placeholder.style.opacity = '1';
            placeholder.style.transform = 'scale(1)';
        }, 100);
        
        console.log(`Successfully updated placeholder ${placeholderId} with image`);
    };
    
    img.onerror = function() {
        console.error(`Failed to load image: /uploads/${file.filename}`);
        placeholder.innerHTML = `
            <div class="text-center text-danger p-3">
                <i class="bi bi-exclamation-triangle"></i>
                <div class="small">Failed to load image</div>
                <!-- Filename text removed for cleaner UI -->
            </div>
        `;
    };
    
    img.src = `/uploads/${file.filename}`;
}

function replaceDirectImage(placeholderId) {
    // Trigger file upload for the specific category
    const categoryMap = {
        'placeholder_extraoral_right': 'extraoral_right',
        'placeholder_extraoral_frontal': 'extraoral_frontal', 
        'placeholder_extraoral_smiling': 'extraoral_smiling',
        'placeholder_extraoral_teeth_smile': 'extraoral_teeth_smile',
        'placeholder_intraoral_right': 'intraoral_right',
        'placeholder_intraoral_frontal': 'intraoral_frontal',
        'placeholder_intraoral_left': 'intraoral_left',
        'placeholder_intraoral_upper': 'intraoral_upper',
        'placeholder_intraoral_lower': 'intraoral_lower'
    };
    
    const category = categoryMap[placeholderId];
    if (category) {
        // Create a new file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        // Add event listener for file selection
        fileInput.onchange = function(event) {
            handleDirectUpload(this, getClassificationFromCategory(category));
        };
        
        // Add to document and trigger click
        document.body.appendChild(fileInput);
        fileInput.click();
        
        // Clean up after a short delay
        setTimeout(() => {
            document.body.removeChild(fileInput);
        }, 1000);
    }
}

function removeDirectImage(placeholderId) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;
    
    // Get the original category name
    const categoryMap = {
        'placeholder_extraoral_right': 'extraoral_right',
        'placeholder_extraoral_frontal': 'extraoral_frontal',
        'placeholder_extraoral_smiling': 'extraoral_smiling',
        'placeholder_extraoral_teeth_smile': 'extraoral_teeth_smile',
        'placeholder_intraoral_right': 'intraoral_right',
        'placeholder_intraoral_frontal': 'intraoral_frontal',
        'placeholder_intraoral_left': 'intraoral_left',
        'placeholder_intraoral_upper': 'intraoral_upper',
        'placeholder_intraoral_lower': 'intraoral_lower'
    };
    
    const category = categoryMap[placeholderId];
    
    // Reset to original state
    resetPlaceholderToOriginal(placeholder, category);
}

function resetPlaceholderToOriginal(placeholder, category) {
    const iconMap = {
        'extraoral_right': 'bi-person',
        'extraoral_frontal': 'bi-person',
        'extraoral_smiling': 'bi-emoji-smile',
        'extraoral_teeth_smile': 'bi-emoji-laughing',
        'intraoral_right': 'bi-arrow-right',
        'intraoral_frontal': 'bi-circle',
        'intraoral_left': 'bi-arrow-left',
        'intraoral_upper': 'bi-arrow-up',
        'intraoral_lower': 'bi-arrow-down'
    };
    
    const labelMap = {
        'extraoral_right': 'Right Side View',
        'extraoral_frontal': 'Frontal View',
        'extraoral_smiling': 'Frontal Smile View',
        'extraoral_teeth_smile': 'Zoomed Smile View',
        'intraoral_right': 'Right Side View',
        'intraoral_frontal': 'Frontal View',
        'intraoral_left': 'Left Side View',
        'intraoral_upper': 'Upper Jaw View',
        'intraoral_lower': 'Lower Jaw View'
    };
    
    const isMobile = window.innerWidth <= 768;
    const isOcclusal = category.includes('upper') || category.includes('lower');
    const minHeight = isMobile ? (isOcclusal ? '80px' : '100px') : (isOcclusal ? '100px' : '120px');
    const mobileIconSize = isMobile ? (isOcclusal ? '0.8rem' : '1rem') : (isOcclusal ? '1rem' : '1.2rem');
    const desktopIconSize = isMobile ? (isOcclusal ? '1rem' : '1.2rem') : (isOcclusal ? '1.2rem' : '1.5rem');
    
    placeholder.className = 'layout-placeholder-box text-center p-3 border border-dashed rounded bg-light position-relative';
    placeholder.style.cssText = `min-height: ${minHeight}; height: ${minHeight}; cursor: pointer;`;
    placeholder.setAttribute('onclick', `triggerFileUpload('${category}')`);
    
    placeholder.innerHTML = `
        <div class="loading-content d-flex flex-column align-items-center justify-content-center h-100">
            <i class="${iconMap[category]} text-muted d-block d-md-none" style="font-size: ${mobileIconSize};"></i>
            <i class="${iconMap[category]} text-muted d-none d-md-block" style="font-size: ${desktopIconSize};"></i>
            <div class="small text-muted mt-1">${labelMap[category]}</div>
            <div class="small text-info mt-1">Click to upload</div>
        </div>
        <input type="file" id="upload_${category}" class="d-none" accept="image/*" onchange="handleDirectUpload(this, '${getClassificationFromCategory(category)}')">
    `;
}

function getClassificationFromCategory(category) {
    const mappings = {
        'extraoral_right': 'extraoral_right',
        'extraoral_frontal': 'extraoral_frontal', 
        'extraoral_smiling': 'extraoral_full_face_smile',      // FIXED: Maps to full face smile
        'extraoral_teeth_smile': 'extraoral_zoomed_smile',     // FIXED: Maps to zoomed smile
        'intraoral_right': 'intraoral_right',
        'intraoral_frontal': 'intraoral_front',
        'intraoral_left': 'intraoral_left',
        'intraoral_upper': 'upper_occlusal',
        'intraoral_lower': 'lower_occlusal'
    };
    return mappings[category];
}

function showUploadError(placeholder, message) {
    placeholder.innerHTML = `
        <div class="loading-content d-flex flex-column align-items-center justify-content-center h-100">
            <i class="bi bi-exclamation-triangle text-danger" style="font-size: 1.5rem;"></i>
            <div class="small text-danger mt-1">${message}</div>
            <button class="btn btn-sm btn-outline-secondary mt-2" onclick="location.reload()">
                <i class="bi bi-arrow-clockwise me-1"></i>Retry
            </button>
        </div>
    `;
}

function addImageToCase(filename, originalName, classification) {
    // Add image to the main case form - look for existing image container
    let imageContainer = document.getElementById('imageContainer');
    
    // If no container exists, create one
    if (!imageContainer) {
        imageContainer = document.createElement('div');
        imageContainer.id = 'imageContainer';
        imageContainer.className = 'mt-3';
        
        // Insert after the layout guide
        const layoutGuide = document.getElementById('layoutGuide');
        if (layoutGuide) {
            layoutGuide.parentNode.insertBefore(imageContainer, layoutGuide.nextSibling);
        }
    }
    
    const imageDiv = document.createElement('div');
    imageDiv.className = 'image-upload-item mb-3 p-3 border rounded bg-light';
    imageDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <img src="/uploads/${filename}" alt="${originalName}" class="me-3" style="width: 60px; height: 60px; object-fit: cover; border-radius: 0.375rem;">
            <div class="flex-grow-1">
                <h6 class="mb-1">${originalName}</h6>
                <small class="text-muted">${classification.replace(/_/g, ' ').replace(/view/g, 'View')}</small>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.parentElement.parentElement.remove()">
                <i class="bi bi-trash"></i>
            </button>
        </div>
        <input type="hidden" name="image_files" value="${filename}">
    `;
    
    imageContainer.appendChild(imageDiv);
    
    // Show success message
    showSuccessPopup(`Added ${originalName} to case`);
}

function simulateUploadProgress(placeholderId) {
    let progress = 0;
    const progressText = document.getElementById(`${placeholderId}_progress`);
    const progressBar = document.getElementById(`${placeholderId}_bar`);
    
    if (!progressText || !progressBar) return;
    
    const interval = setInterval(() => {
        progress += Math.random() * 15 + 5; // Random increment between 5-20%
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        
        progressText.textContent = Math.round(progress) + '%';
        progressBar.style.width = progress + '%';
        
        if (progress >= 100) {
            progressText.textContent = 'Processing...';
        }
    }, 200);
}

// Mobile responsiveness handler
function refreshLayoutResponsiveness() {
    const placeholders = document.querySelectorAll('.layout-placeholder-box.border-success');
    placeholders.forEach(placeholder => {
        const img = placeholder.querySelector('img');
        if (img) {
            const isMobile = window.innerWidth <= 768;
            const isExtraoral = img.classList.contains('extraoral');
            
            const tempImg = new Image();
            tempImg.onload = function() {
                const containerWidth = placeholder.offsetWidth;
                const imageAspectRatio = this.naturalWidth / this.naturalHeight;
                
                let effectiveAspectRatio;
                if (isExtraoral) {
                    effectiveAspectRatio = 1 / imageAspectRatio;
                } else {
                    effectiveAspectRatio = imageAspectRatio;
                }
                
                let containerHeight = containerWidth / effectiveAspectRatio;
                
                const isUpperLower = img.src.includes('upper') || img.src.includes('lower') || 
                                   img.classList.contains('upper') || img.classList.contains('lower');
                
                let maxHeight, minHeight;
                if (isUpperLower) {
                    if (img.src.includes('lower') || img.classList.contains('lower')) {
                        // Lower jaw images - fixed square dimensions
                        containerHeight = isMobile ? 60 : 75;
                        containerWidth = containerHeight;
                    } else {
                        // Upper jaw images - also fixed square dimensions
                        containerHeight = isMobile ? 60 : 75;
                        containerWidth = containerHeight;
                    }
                } else {
                    maxHeight = isMobile ? 250 : 350;
                    minHeight = isMobile ? 60 : 80;
                    containerHeight = Math.max(minHeight, Math.min(maxHeight, containerHeight));
                }
                
                placeholder.style.height = `${containerHeight}px`;
                placeholder.style.minHeight = `${containerHeight}px`;
                if (isUpperLower) {
                    placeholder.style.width = `${containerWidth}px`;
                    placeholder.style.minWidth = `${containerWidth}px`;
                }
            };
            tempImg.src = img.src;
        }
    });
}

// Window resize handler for mobile responsiveness
if (typeof resizeTimeout === 'undefined') {
    var resizeTimeout;
}
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(refreshLayoutResponsiveness, 250);
});

// Helper functions for showing messages
function showError(message) {
    // Create or update error alert
    let existingAlert = document.querySelector('.alert-danger');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertHtml = `
        <div class="alert alert-danger alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; max-width: 400px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const alert = document.querySelector('.alert-danger');
        if (alert) alert.remove();
    }, 5000);
}

function showSuccessPopup(message) {
    // Create or update success alert
    let existingAlert = document.querySelector('.alert-success');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertHtml = `
        <div class="alert alert-success alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; max-width: 400px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
        const alert = document.querySelector('.alert-success');
        if (alert) alert.remove();
    }, 3000);
}

// Add touch-friendly interactions for mobile
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', function(e) {
        if (e.target.closest('.layout-placeholder-box')) {
            e.target.closest('.layout-placeholder-box').style.transform = 'scale(0.98)';
        }
    });
    
    document.addEventListener('touchend', function(e) {
        if (e.target.closest('.layout-placeholder-box')) {
            e.target.closest('.layout-placeholder-box').style.transform = 'scale(1)';
        }
    });
}

// Crop functionality - simplified and robust
window.currentCropData = null;
window.cropModal = null;

function cropImage(imageSrc, placeholderId) {
    window.currentCropData = { imageSrc, placeholderId };
    
    const cropImage = document.getElementById('cropImage');
    const cropModalElement = document.getElementById('cropModal');
    
    if (cropModalElement && cropImage) {
        cropImage.src = imageSrc;
        cropImage.onload = function() {
            setTimeout(() => {
                initializeCropOverlay();
                if (!window.cropModal) {
                    window.cropModal = new bootstrap.Modal(cropModalElement);
                }
                window.cropModal.show();
            }, 200);
        };
    }
}

function initializeCropOverlay() {
    setTimeout(() => {
        const cropImage = document.getElementById('cropImage');
        const cropOverlay = document.getElementById('cropOverlay');
        
        if (!cropImage || !cropOverlay) return;
        
        // Wait for image to fully load and get accurate dimensions
        const waitForImageLoad = () => {
            if (cropImage.offsetWidth === 0 || cropImage.offsetHeight === 0) {
                setTimeout(waitForImageLoad, 50);
                return;
            }
            
            const container = cropImage.parentElement;
            const containerRect = container.getBoundingClientRect();
            const imageRect = cropImage.getBoundingClientRect();
            
            // Calculate image position relative to container
            const imageLeft = imageRect.left - containerRect.left;
            const imageTop = imageRect.top - containerRect.top;
            const imageWidth = cropImage.offsetWidth;
            const imageHeight = cropImage.offsetHeight;
            
            // Start with crop box covering the entire image (maximum size)
            cropOverlay.style.display = 'block';
            cropOverlay.style.left = imageLeft + 'px';
            cropOverlay.style.top = imageTop + 'px';
            cropOverlay.style.width = imageWidth + 'px';
            cropOverlay.style.height = imageHeight + 'px';
            
            updateCropRatio();
            setupCropHandlers();
        };
        
        waitForImageLoad();
    }, 100);
}



function updateCropRatio() {
    const selectedRatioElement = document.querySelector('input[name="cropRatio"]:checked');
    if (!selectedRatioElement) return;
    
    const selectedRatio = selectedRatioElement.value;
    const cropOverlay = document.getElementById('cropOverlay');
    const cropImage = document.getElementById('cropImage');
    
    if (!cropOverlay || !cropImage) return;
    
    const container = cropImage.parentElement;
    const containerRect = container.getBoundingClientRect();
    const imageRect = cropImage.getBoundingClientRect();
    
    // Calculate image position and dimensions relative to container
    const imageLeft = imageRect.left - containerRect.left;
    const imageTop = imageRect.top - containerRect.top;
    const imageWidth = cropImage.offsetWidth;
    const imageHeight = cropImage.offsetHeight;
    
    let newWidth, newHeight, newLeft, newTop;
    
    if (selectedRatio === 'free') {
        // Free transform - reset to maximum size covering entire image
        newLeft = imageLeft;
        newTop = imageTop;
        newWidth = imageWidth;
        newHeight = imageHeight;
    } else {
        // Calculate maximum dimensions that fit the aspect ratio
        let ratioWidth, ratioHeight;
        
        switch(selectedRatio) {
            case '1:1':
                ratioWidth = ratioHeight = 1;
                break;
            case '5:7':
                ratioWidth = 5;
                ratioHeight = 7;
                break;
            case '16:9':
                ratioWidth = 16;
                ratioHeight = 9;
                break;
            default:
                return;
        }
        
        // Calculate the largest size that fits the ratio within the image
        const scaleByWidth = imageWidth / ratioWidth;
        const scaleByHeight = imageHeight / ratioHeight;
        const scale = Math.min(scaleByWidth, scaleByHeight);
        
        newWidth = ratioWidth * scale;
        newHeight = ratioHeight * scale;
        
        // Center the crop box within the image
        newLeft = imageLeft + (imageWidth - newWidth) / 2;
        newTop = imageTop + (imageHeight - newHeight) / 2;
    }
    
    // Apply the new dimensions and position
    cropOverlay.style.left = newLeft + 'px';
    cropOverlay.style.top = newTop + 'px';
    cropOverlay.style.width = newWidth + 'px';
    cropOverlay.style.height = newHeight + 'px';
}

function setupCropHandlers() {
    const cropOverlay = document.getElementById('cropOverlay');
    
    if (!cropOverlay) return;
    
    // Remove existing listeners to prevent duplicates
    const existingRadios = document.querySelectorAll('input[name="cropRatio"]');
    existingRadios.forEach(radio => {
        radio.removeEventListener('change', updateCropRatio);
        radio.addEventListener('change', updateCropRatio);
    });
    
    // Enhanced dragging and resizing functionality
    let isDragging = false;
    let isResizing = false;
    let currentHandle = null;
    let startX, startY, startLeft, startTop, startWidth, startHeight;
    
    const handleMouseDown = function(e) {
        const target = e.target;
        
        if (target.classList.contains('crop-handle')) {
            // Handle resizing
            isResizing = true;
            currentHandle = target;
            const rect = cropOverlay.getBoundingClientRect();
            const containerRect = cropOverlay.parentElement.getBoundingClientRect();
            
            startX = e.clientX;
            startY = e.clientY;
            startLeft = rect.left - containerRect.left;
            startTop = rect.top - containerRect.top;
            startWidth = rect.width;
            startHeight = rect.height;
            
        } else if (target === cropOverlay) {
            // Handle dragging
            isDragging = true;
            startX = e.clientX - cropOverlay.offsetLeft;
            startY = e.clientY - cropOverlay.offsetTop;
        }
        
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleMouseMove = function(e) {
        const cropImage = document.getElementById('cropImage');
        if (!cropImage) return;
        
        // Get image and container positioning
        const container = cropImage.parentElement;
        const containerRect = container.getBoundingClientRect();
        const imageRect = cropImage.getBoundingClientRect();
        const imageLeft = imageRect.left - containerRect.left;
        const imageTop = imageRect.top - containerRect.top;
        const imageWidth = cropImage.offsetWidth;
        const imageHeight = cropImage.offsetHeight;
        
        if (isDragging) {
            // Move the crop overlay with strict boundary enforcement
            const newLeft = e.clientX - startX;
            const newTop = e.clientY - startY;
            
            const cropWidth = cropOverlay.offsetWidth;
            const cropHeight = cropOverlay.offsetHeight;
            
            // Ensure crop box stays completely within image boundaries
            const constrainedLeft = Math.max(imageLeft, Math.min(imageLeft + imageWidth - cropWidth, newLeft));
            const constrainedTop = Math.max(imageTop, Math.min(imageTop + imageHeight - cropHeight, newTop));
            
            cropOverlay.style.left = constrainedLeft + 'px';
            cropOverlay.style.top = constrainedTop + 'px';
            
        } else if (isResizing && currentHandle) {
            // Resize the crop overlay
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newLeft = startLeft;
            let newTop = startTop;
            let newWidth = startWidth;
            let newHeight = startHeight;
            
            const selectedRatio = document.querySelector('input[name="cropRatio"]:checked').value;
            const isFree = selectedRatio === 'free';
            const isSquare = selectedRatio === '1:1';
            const ratio57 = selectedRatio === '5:7' ? 7/5 : null;
            const ratio169 = selectedRatio === '16:9' ? 9/16 : null; // Horizontal widescreen
            
            // Handle different resize directions
            if (currentHandle.classList.contains('nw-handle')) {
                newLeft = startLeft + deltaX;
                newTop = startTop + deltaY;
                newWidth = startWidth - deltaX;
                newHeight = startHeight - deltaY;
            } else if (currentHandle.classList.contains('ne-handle')) {
                newTop = startTop + deltaY;
                newWidth = startWidth + deltaX;
                newHeight = startHeight - deltaY;
            } else if (currentHandle.classList.contains('sw-handle')) {
                newLeft = startLeft + deltaX;
                newWidth = startWidth - deltaX;
                newHeight = startHeight + deltaY;
            } else if (currentHandle.classList.contains('se-handle')) {
                newWidth = startWidth + deltaX;
                newHeight = startHeight + deltaY;
            } else if (currentHandle.classList.contains('n-handle')) {
                newTop = startTop + deltaY;
                newHeight = startHeight - deltaY;
            } else if (currentHandle.classList.contains('s-handle')) {
                newHeight = startHeight + deltaY;
            } else if (currentHandle.classList.contains('w-handle')) {
                newLeft = startLeft + deltaX;
                newWidth = startWidth - deltaX;
            } else if (currentHandle.classList.contains('e-handle')) {
                newWidth = startWidth + deltaX;
            }
            
            // Apply aspect ratio constraints (skip for free transform)
            if (!isFree) {
                if (isSquare) {
                    const size = Math.min(newWidth, newHeight);
                    newWidth = newHeight = size;
                } else if (ratio57) {
                    newHeight = newWidth * ratio57;
                } else if (ratio169) {
                    newHeight = newWidth * ratio169; // Horizontal format
                }
            }
            
            // Enforce strict boundary constraints within image area
            // Constrain position to image boundaries
            newLeft = Math.max(imageLeft, Math.min(newLeft, imageLeft + imageWidth - 50)); // minimum 50px width
            newTop = Math.max(imageTop, Math.min(newTop, imageTop + imageHeight - 50)); // minimum 50px height
            
            // Constrain dimensions to fit within remaining space from position to image edge
            const maxAllowedWidth = imageLeft + imageWidth - newLeft;
            const maxAllowedHeight = imageTop + imageHeight - newTop;
            
            newWidth = Math.max(50, Math.min(maxAllowedWidth, newWidth));
            newHeight = Math.max(50, Math.min(maxAllowedHeight, newHeight));
            
            // Final check: ensure crop box doesn't exceed image boundaries
            if (newLeft + newWidth > imageLeft + imageWidth) {
                newWidth = imageLeft + imageWidth - newLeft;
            }
            if (newTop + newHeight > imageTop + imageHeight) {
                newHeight = imageTop + imageHeight - newTop;
            }
            
            // Apply the new dimensions
            cropOverlay.style.left = newLeft + 'px';
            cropOverlay.style.top = newTop + 'px';
            cropOverlay.style.width = newWidth + 'px';
            cropOverlay.style.height = newHeight + 'px';
        }
    };
    
    const handleMouseUp = function() {
        isDragging = false;
        isResizing = false;
        currentHandle = null;
    };
    
    // Remove existing event listeners
    document.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Add new event listeners
    cropOverlay.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

// Apply crop functionality - simplified
document.addEventListener('DOMContentLoaded', function() {
    const applyCropBtn = document.getElementById('applyCrop');
    if (applyCropBtn) {
        applyCropBtn.addEventListener('click', function() {
            if (!window.currentCropData) return;
            
            const cropOverlay = document.getElementById('cropOverlay');
            const cropImage = document.getElementById('cropImage');
            
            if (cropOverlay && cropImage) {
                const cropData = {
                    x: parseFloat(cropOverlay.style.left) || 0,
                    y: parseFloat(cropOverlay.style.top) || 0,
                    width: parseFloat(cropOverlay.style.width) || 100,
                    height: parseFloat(cropOverlay.style.height) || 100,
                    imageWidth: cropImage.offsetWidth,
                    imageHeight: cropImage.offsetHeight,
                    originalSrc: window.currentCropData.imageSrc
                };
                
                applyCropToImage(cropData, window.currentCropData.placeholderId);
                
                if (window.cropModal) {
                    window.cropModal.hide();
                }
            }
        });
    }
});

function applyCropToImage(cropData, placeholderId) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // Calculate scale factors
        const scaleX = img.naturalWidth / cropData.imageWidth;
        const scaleY = img.naturalHeight / cropData.imageHeight;
        
        // Set canvas size to crop dimensions
        canvas.width = cropData.width * scaleX;
        canvas.height = cropData.height * scaleY;
        
        // Draw cropped portion
        ctx.drawImage(
            img,
            cropData.x * scaleX, cropData.y * scaleY,
            cropData.width * scaleX, cropData.height * scaleY,
            0, 0,
            canvas.width, canvas.height
        );
        
        // Convert to blob and update image
        canvas.toBlob(function(blob) {
            const formData = new FormData();
            formData.append('cropped_image', blob, 'cropped_image.png');
            formData.append('placeholder_id', placeholderId);
            
            fetch('/upload_cropped_image', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update the image in the placeholder
                    const placeholder = document.getElementById(placeholderId);
                    const img = placeholder.querySelector('img');
                    if (img) {
                        img.src = '/uploads/' + data.filename + '?t=' + Date.now();
                        // Update hidden input
                        const hiddenInput = placeholder.querySelector('input[name="image_files"]');
                        if (hiddenInput) {
                            hiddenInput.value = data.filename;
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Error uploading cropped image:', error);
                showError('Failed to apply crop. Please try again.');
            });
        }, 'image/png');
    };
    
    img.src = cropData.originalSrc;
}

// Image editing functionality
function editImage(imageSrc, placeholderId) {
    const modalHtml = `
        <div class="modal fade" id="imageEditModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Image</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-8">
                                <div class="position-relative" id="imageEditContainer" style="background: #f8f9fa; border-radius: 8px; min-height: 400px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                    <img id="editableImage" src="${imageSrc}" alt="Editable Image" style="max-width: 100%; max-height: 500px; transform-origin: center;" />
                                    <div id="cropOverlayEdit" style="display: none; position: absolute; border: 2px dashed #007bff; background: rgba(0,123,255,0.1); cursor: move; min-width: 50px; min-height: 50px;">
                                        <div class="crop-handle" data-handle="nw" style="position: absolute; top: -5px; left: -5px; width: 10px; height: 10px; background: #007bff; cursor: nw-resize; border-radius: 50%;"></div>
                                        <div class="crop-handle" data-handle="ne" style="position: absolute; top: -5px; right: -5px; width: 10px; height: 10px; background: #007bff; cursor: ne-resize; border-radius: 50%;"></div>
                                        <div class="crop-handle" data-handle="sw" style="position: absolute; bottom: -5px; left: -5px; width: 10px; height: 10px; background: #007bff; cursor: sw-resize; border-radius: 50%;"></div>
                                        <div class="crop-handle" data-handle="se" style="position: absolute; bottom: -5px; right: -5px; width: 10px; height: 10px; background: #007bff; cursor: se-resize; border-radius: 50%;"></div>
                                        <div class="crop-handle" data-handle="n" style="position: absolute; top: -5px; left: 50%; transform: translateX(-50%); width: 10px; height: 10px; background: #007bff; cursor: n-resize; border-radius: 50%;"></div>
                                        <div class="crop-handle" data-handle="s" style="position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%); width: 10px; height: 10px; background: #007bff; cursor: s-resize; border-radius: 50%;"></div>
                                        <div class="crop-handle" data-handle="w" style="position: absolute; top: 50%; left: -5px; transform: translateY(-50%); width: 10px; height: 10px; background: #007bff; cursor: w-resize; border-radius: 50%;"></div>
                                        <div class="crop-handle" data-handle="e" style="position: absolute; top: 50%; right: -5px; transform: translateY(-50%); width: 10px; height: 10px; background: #007bff; cursor: e-resize; border-radius: 50%;"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0"><i class="bi bi-arrow-clockwise"></i> Rotation</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-outline-primary" onclick="rotateImage(-90)">
                                                <i class="bi bi-arrow-counterclockwise"></i> Rotate Left 90°
                                            </button>
                                            <button class="btn btn-outline-primary" onclick="rotateImage(90)">
                                                <i class="bi bi-arrow-clockwise"></i> Rotate Right 90°
                                            </button>
                                            <button class="btn btn-outline-primary" onclick="rotateImage(180)">
                                                <i class="bi bi-arrow-repeat"></i> Rotate 180°
                                            </button>
                                            <button class="btn btn-outline-secondary" onclick="resetRotation()">
                                                <i class="bi bi-bootstrap-reboot"></i> Reset Rotation
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="card mt-3">
                                    <div class="card-header">
                                        <h6 class="mb-0"><i class="bi bi-crop"></i> Crop</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="mb-3">
                                            <label class="form-label">Aspect Ratio</label>
                                            <select class="form-select" id="cropAspectRatio" onchange="setCropAspectRatio()">
                                                <option value="free">Free Size</option>
                                                <option value="9:16">9:16 Landscape</option>
                                                <option value="5:7">5:7 Portrait</option>
                                            </select>
                                        </div>
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-outline-success" onclick="startCropping()" id="startCropBtn">
                                                <i class="bi bi-crop"></i> Start Crop
                                            </button>
                                            <button class="btn btn-outline-warning" onclick="resetCrop()" id="resetCropBtn" style="display: none;">
                                                <i class="bi bi-arrow-clockwise"></i> Reset Crop
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="card mt-3">
                                    <div class="card-body">
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-success" onclick="saveEditedImage('${placeholderId}')">
                                                <i class="bi bi-check-lg"></i> Save Changes
                                            </button>
                                            <button class="btn btn-secondary" data-bs-dismiss="modal">
                                                <i class="bi bi-x-lg"></i> Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('imageEditModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('imageEditModal'));
    modal.show();
    
    // Initialize editing variables
    window.currentRotation = 0;
    window.currentCropData = null;
    window.cropActive = false;
    window.editImageSrc = imageSrc;
    window.editPlaceholderId = placeholderId;
    
    // Clean up modal when hidden
    document.getElementById('imageEditModal').addEventListener('hidden.bs.modal', function() {
        setTimeout(() => {
            const modalElement = document.getElementById('imageEditModal');
            if (modalElement) {
                modalElement.remove();
            }
        }, 100);
    });
}

function rotateImage(degrees) {
    const image = document.getElementById('editableImage');
    if (!image) return;
    
    window.currentRotation = (window.currentRotation + degrees) % 360;
    image.style.transform = `rotate(${window.currentRotation}deg)`;
}

function resetRotation() {
    const image = document.getElementById('editableImage');
    if (!image) return;
    
    window.currentRotation = 0;
    image.style.transform = 'rotate(0deg)';
}

function startCropping() {
    const container = document.getElementById('imageEditContainer');
    const image = document.getElementById('editableImage');
    const cropOverlay = document.getElementById('cropOverlayEdit');
    const resetBtn = document.getElementById('resetCropBtn');
    const startBtn = document.getElementById('startCropBtn');
    
    if (!container || !image || !cropOverlay) return;
    
    // Show crop overlay and controls
    cropOverlay.style.display = 'block';
    resetBtn.style.display = 'block';
    startBtn.style.display = 'none';
    
    // Get image dimensions and position relative to container
    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    
    // Calculate image position relative to container
    const imageLeft = imageRect.left - containerRect.left;
    const imageTop = imageRect.top - containerRect.top;
    const imageWidth = imageRect.width;
    const imageHeight = imageRect.height;
    
    // Calculate initial crop area (center 60% of image)
    let cropWidth = imageWidth * 0.6;
    let cropHeight = imageHeight * 0.6;
    
    // Apply aspect ratio if selected
    const aspectRatio = document.getElementById('cropAspectRatio').value;
    
    if (aspectRatio === '9:16') {
        cropHeight = cropWidth * (16/9);
        if (cropHeight > imageHeight * 0.8) {
            cropHeight = imageHeight * 0.8;
            cropWidth = cropHeight * (9/16);
        }
    } else if (aspectRatio === '5:7') {
        cropHeight = cropWidth * (7/5);
        if (cropHeight > imageHeight * 0.8) {
            cropHeight = imageHeight * 0.8;
            cropWidth = cropHeight * (5/7);
        }
    }
    
    // Center the crop area on the image
    const cropLeft = imageLeft + (imageWidth - cropWidth) / 2;
    const cropTop = imageTop + (imageHeight - cropHeight) / 2;
    
    // Position crop overlay
    cropOverlay.style.width = cropWidth + 'px';
    cropOverlay.style.height = cropHeight + 'px';
    cropOverlay.style.left = cropLeft + 'px';
    cropOverlay.style.top = cropTop + 'px';
    
    window.cropActive = true;
    setupCropHandlersEdit();
}

function setCropAspectRatio() {
    if (window.cropActive) {
        startCropping(); // Restart cropping with new aspect ratio
    }
}

function resetCrop() {
    const cropOverlay = document.getElementById('cropOverlayEdit');
    const resetBtn = document.getElementById('resetCropBtn');
    const startBtn = document.getElementById('startCropBtn');
    
    if (cropOverlay) {
        cropOverlay.style.display = 'none';
    }
    if (resetBtn) {
        resetBtn.style.display = 'none';
    }
    if (startBtn) {
        startBtn.style.display = 'block';
    }
    
    window.cropActive = false;
    window.currentCropData = null;
}

function setupCropHandlersEdit() {
    const cropOverlay = document.getElementById('cropOverlayEdit');
    const container = document.getElementById('imageEditContainer');
    const image = document.getElementById('editableImage');
    
    if (!cropOverlay || !container || !image) return;
    
    let isDragging = false;
    let isResizing = false;
    let currentHandle = null;
    let startX, startY, startWidth, startHeight, startLeft, startTop;
    
    // Get image boundaries
    const getImageBounds = () => {
        const containerRect = container.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        return {
            left: imageRect.left - containerRect.left,
            top: imageRect.top - containerRect.top,
            width: imageRect.width,
            height: imageRect.height
        };
    };
    
    // Handle mouse down on crop overlay
    const handleMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.target.classList.contains('crop-handle')) {
            isResizing = true;
            currentHandle = e.target.dataset.handle;
        } else if (e.target === cropOverlay) {
            isDragging = true;
        }
        
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(cropOverlay.style.width);
        startHeight = parseInt(cropOverlay.style.height);
        startLeft = parseInt(cropOverlay.style.left);
        startTop = parseInt(cropOverlay.style.top);
    };
    
    // Handle mouse move
    const handleMouseMove = (e) => {
        if (!isDragging && !isResizing) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const imageBounds = getImageBounds();
        
        if (isDragging) {
            // Move the crop area
            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;
            
            // Constrain to image boundaries
            newLeft = Math.max(imageBounds.left, Math.min(newLeft, imageBounds.left + imageBounds.width - startWidth));
            newTop = Math.max(imageBounds.top, Math.min(newTop, imageBounds.top + imageBounds.height - startHeight));
            
            cropOverlay.style.left = newLeft + 'px';
            cropOverlay.style.top = newTop + 'px';
            
        } else if (isResizing && currentHandle) {
            // Resize the crop area
            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;
            
            const aspectRatio = document.getElementById('cropAspectRatio').value;
            
            // Calculate new dimensions based on handle
            switch (currentHandle) {
                case 'se': // Bottom-right
                    newWidth = startWidth + deltaX;
                    newHeight = startHeight + deltaY;
                    break;
                case 'sw': // Bottom-left
                    newWidth = startWidth - deltaX;
                    newHeight = startHeight + deltaY;
                    newLeft = startLeft + deltaX;
                    break;
                case 'ne': // Top-right
                    newWidth = startWidth + deltaX;
                    newHeight = startHeight - deltaY;
                    newTop = startTop + deltaY;
                    break;
                case 'nw': // Top-left
                    newWidth = startWidth - deltaX;
                    newHeight = startHeight - deltaY;
                    newLeft = startLeft + deltaX;
                    newTop = startTop + deltaY;
                    break;
                case 'n': // Top
                    newHeight = startHeight - deltaY;
                    newTop = startTop + deltaY;
                    break;
                case 's': // Bottom
                    newHeight = startHeight + deltaY;
                    break;
                case 'w': // Left
                    newWidth = startWidth - deltaX;
                    newLeft = startLeft + deltaX;
                    break;
                case 'e': // Right
                    newWidth = startWidth + deltaX;
                    break;
            }
            
            // Apply aspect ratio constraints
            if (aspectRatio === '9:16') {
                newHeight = newWidth * (16/9);
            } else if (aspectRatio === '5:7') {
                newHeight = newWidth * (7/5);
            }
            
            // Ensure minimum size
            newWidth = Math.max(50, newWidth);
            newHeight = Math.max(50, newHeight);
            
            // Constrain to image boundaries
            newLeft = Math.max(imageBounds.left, Math.min(newLeft, imageBounds.left + imageBounds.width - newWidth));
            newTop = Math.max(imageBounds.top, Math.min(newTop, imageBounds.top + imageBounds.height - newHeight));
            
            // Ensure crop doesn't exceed image boundaries
            if (newLeft + newWidth > imageBounds.left + imageBounds.width) {
                newWidth = imageBounds.left + imageBounds.width - newLeft;
            }
            if (newTop + newHeight > imageBounds.top + imageBounds.height) {
                newHeight = imageBounds.top + imageBounds.height - newTop;
            }
            
            // Apply new dimensions
            cropOverlay.style.width = newWidth + 'px';
            cropOverlay.style.height = newHeight + 'px';
            cropOverlay.style.left = newLeft + 'px';
            cropOverlay.style.top = newTop + 'px';
        }
    };
    
    // Handle mouse up
    const handleMouseUp = () => {
        isDragging = false;
        isResizing = false;
        currentHandle = null;
    };
    
    // Add event listeners
    cropOverlay.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Store cleanup function
    window.cleanupCropHandlers = () => {
        cropOverlay.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
}

function saveEditedImage(placeholderId) {
    // Get current transformation data
    const rotation = window.currentRotation || 0;
    const cropOverlay = document.getElementById('cropOverlayEdit');
    const image = document.getElementById('editableImage');
    const container = document.getElementById('imageEditContainer');
    
    let cropData = null;
    
    if (window.cropActive && cropOverlay && cropOverlay.style.display !== 'none') {
        // Get crop data relative to image
        const containerRect = container.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        const cropRect = cropOverlay.getBoundingClientRect();
        
        cropData = {
            x: cropRect.left - imageRect.left,
            y: cropRect.top - imageRect.top,
            width: cropRect.width,
            height: cropRect.height,
            imageWidth: imageRect.width,
            imageHeight: imageRect.height
        };
    }
    
    // Extract filename from image src
    const imageSrc = window.editImageSrc;
    const filename = imageSrc.split('/').pop().split('?')[0]; // Remove query params if any
    
    // Send the edit data to server
    const editData = {
        image_filename: filename,
        placeholder_id: placeholderId,
        rotation: rotation,
        crop_data: cropData
    };
    
    // Show loading state
    const saveBtn = event.target;
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Saving...';
    saveBtn.disabled = true;
    
    fetch('/edit_image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update the image in the placeholder
            const placeholder = document.getElementById(placeholderId);
            if (placeholder) {
                const img = placeholder.querySelector('img');
                if (img) {
                    img.src = '/uploads/' + data.filename + '?t=' + Date.now();
                }
                
                // Update hidden input if exists
                const hiddenInput = placeholder.querySelector('input[name="image_files"]');
                if (hiddenInput) {
                    hiddenInput.value = data.filename;
                }
            }
            
            showSuccessPopup(data.message || 'Image edited successfully!');
            
            // Clean up event handlers
            if (window.cleanupCropHandlers) {
                window.cleanupCropHandlers();
            }
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('imageEditModal'));
            if (modal) {
                modal.hide();
            }
        } else {
            showError(data.error || 'Failed to save image edits');
        }
    })
    .catch(error => {
        console.error('Error saving edited image:', error);
        showError('Failed to save image edits. Please try again.');
    })
    .finally(() => {
        // Restore button state
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    });
}