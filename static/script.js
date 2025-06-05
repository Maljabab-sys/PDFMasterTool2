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
    const section1 = document.getElementById('section1');
    const registrationFields = document.getElementById('registrationFields');
    const followupFields = document.getElementById('followupFields');
    const extraOralSection = document.getElementById('extraOralSection');
    const intraOralSection = document.getElementById('intraOralSection');
    
    // Hide all sections first
    if (section1) section1.style.display = 'none';
    if (registrationFields) registrationFields.style.display = 'none';
    if (followupFields) followupFields.style.display = 'none';
    if (extraOralSection) extraOralSection.style.display = 'none';
    if (intraOralSection) intraOralSection.style.display = 'none';
    
    // Clear required attributes
    clearRequiredFields();
    
    if (visitType) {
        // Show Section 1 (Patient Data)
        if (section1) section1.style.display = 'block';
        
        // Show appropriate fields in Section 1
        if (visitType === 'Registration') {
            if (registrationFields) registrationFields.style.display = 'block';
            setRegistrationRequired();
        } else if (visitType === 'Orthodontic Visit' || visitType === 'Debond') {
            if (followupFields) followupFields.style.display = 'block';
            setFollowupRequired();
        }
        
        // Show Section 2 and 3 (Image uploads)
        if (extraOralSection) extraOralSection.style.display = 'block';
        if (intraOralSection) intraOralSection.style.display = 'block';
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
    const selectedPatientInfo = document.getElementById('selectedPatientInfo');
    const selectedPatientDetails = document.getElementById('selectedPatientDetails');
    const selectedPatientId = document.getElementById('selectedPatientId');
    
    if (selectedPatientInfo) selectedPatientInfo.style.display = 'block';
    if (selectedPatientDetails) {
        selectedPatientDetails.textContent = `MRN: ${mrn} - ${firstName} ${lastName} (${clinic})`;
    }
    if (selectedPatientId) selectedPatientId.value = id;
    
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
    } else if (sectionName === 'settings') {
        document.getElementById('settings-section').style.display = 'block';
        document.querySelector('[onclick="showSection(\'settings\')"]').classList.add('active');
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
    
    // Load initial content for all sections
    setTimeout(() => {
        loadUserSettings();
    }, 100);
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
        .then(response => response.json())
        .then(data => {
            if (data.settings) {
                document.getElementById('fullName').value = data.settings.full_name || '';
                document.getElementById('email').value = data.settings.email || '';
                document.getElementById('position').value = data.settings.position || '';
                document.getElementById('gender').value = data.settings.gender || '';
                
                // Load clinics
                loadUserClinics(data.settings.clinics || []);
                
                // Load profile image if exists
                if (data.settings.profile_image) {
                    const preview = document.getElementById('profilePreview');
                    const placeholder = document.getElementById('uploadPlaceholder');
                    
                    if (preview && placeholder) {
                        preview.src = data.settings.profile_image;
                        preview.style.display = 'block';
                        placeholder.style.display = 'none';
                    }
                    
                    // Update navigation profile image
                    updateNavProfileImage(data.settings.profile_image, data.settings.gender);
                } else {
                    // No image, use gender-based icon
                    updateNavProfileImage(null, data.settings.gender || '');
                }
            }
            
            // Update clinic dropdown in registration form
            updateClinicDropdown(data.settings?.clinics || []);
        })
        .catch(error => {
            console.error('Error loading settings:', error);
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
    const container = document.getElementById('clinicsContainer');
    container.innerHTML = '';
    
    if (clinics.length === 0) {
        addClinic();
        return;
    }
    
    clinics.forEach((clinic, index) => {
        const clinicHtml = `
            <div class="clinic-entry mb-3">
                <div class="row">
                    <div class="col-md-8">
                        <label class="form-label">Clinic Name</label>
                        <input type="text" class="form-control clinic-input" name="clinics[]" 
                               value="${clinic}" placeholder="Enter clinic name...">
                    </div>
                    <div class="col-md-4 d-flex align-items-end">
                        <button type="button" class="btn btn-outline-danger btn-sm remove-clinic" 
                                onclick="removeClinic(this)" ${clinics.length === 1 ? 'style="display: none;"' : ''}>
                            <i class="bi bi-trash"></i> Remove
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', clinicHtml);
    });
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
    const container = document.getElementById('clinicsContainer');
    const clinicEntry = button.closest('.clinic-entry');
    clinicEntry.remove();
    
    // Hide remove buttons if only one clinic left
    const remainingClinics = container.querySelectorAll('.clinic-entry');
    if (remainingClinics.length === 1) {
        remainingClinics[0].querySelector('.remove-clinic').style.display = 'none';
    }
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

function showAbout() {
    alert('Patient Data Organizer v1.0\n\nA professional medical case presentation tool for healthcare professionals.\n\nDeveloped for organizing patient data and creating professional slide presentations.');
}

function showSuccessPopup(message = 'Settings saved successfully!') {
    // Remove any existing popup
    const existing = document.querySelector('.success-popup');
    if (existing) {
        existing.remove();
    }
    
    // Create popup element
    const popup = document.createElement('div');
    popup.className = 'success-popup';
    popup.innerHTML = `
        <div class="success-icon">
            <i class="bi bi-check" style="color: white; font-size: 14px; font-weight: bold;"></i>
        </div>
        <div class="success-text">${message}</div>
    `;
    
    // Add to page
    document.body.appendChild(popup);
    
    // Trigger animation
    setTimeout(() => popup.classList.add('show'), 100);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        popup.classList.add('hide');
        setTimeout(() => popup.remove(), 400);
    }, 3000);
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