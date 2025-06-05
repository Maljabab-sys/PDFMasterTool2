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
        document.getElementById('new-case-section').style.display = 'block';
        document.querySelector('[onclick="showSection(\'new-case\')"]').classList.add('active');
    } else if (sectionName === 'case-history') {
        document.getElementById('case-history-section').style.display = 'block';
        document.querySelector('[onclick="showSection(\'case-history\')"]').classList.add('active');
        loadCaseHistory();
    } else if (sectionName === 'patient-list') {
        document.getElementById('patient-list-section').style.display = 'block';
        document.querySelector('[onclick="showSection(\'patient-list\')"]').classList.add('active');
        loadPatientList();
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
});

// Load case history via AJAX
function loadCaseHistory() {
    const content = document.getElementById('case-history-content');
    content.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    
    fetch('/api/cases')
        .then(response => response.json())
        .then(data => {
            content.innerHTML = renderCaseHistory(data.cases);
        })
        .catch(error => {
            content.innerHTML = '<div class="alert alert-danger">Error loading case history</div>';
        });
}

// Load patient list via AJAX
function loadPatientList() {
    const content = document.getElementById('patient-list-content');
    content.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    
    fetch('/api/patients')
        .then(response => response.json())
        .then(data => {
            content.innerHTML = renderPatientList(data.patients);
        })
        .catch(error => {
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
let allPatients = [];

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
                        
                        <h6 class="fw-bold mb-3">Medical Slides (${patient.cases_count})</h6>
                        ${renderPatientCases(patient.cases)}
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// Filter patients based on search input
function filterPatients() {
    const searchTerm = document.getElementById('patientSearchInput').value.toLowerCase();
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
    document.getElementById('patientSearchInput').value = '';
    filterPatients();
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
                <h6 class="text-light bg-secondary px-3 py-2 rounded mb-3">
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