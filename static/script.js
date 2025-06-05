// Global variables
let selectedPatientData = null;

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
        };
        reader.readAsDataURL(file);
        
        // Handle remove button
        removeBtn.onclick = function() {
            input.value = '';
            preview.style.display = 'none';
            placeholder.style.display = 'flex';
        };
    }
    
    function truncateFilename(filename, maxLength) {
        if (filename.length <= maxLength) return filename;
        const start = filename.substring(0, maxLength - 3);
        return start + '...';
    }
    
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        errorDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 350px;';
        errorDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    function showProgressIndicator() {
        const progressDiv = document.createElement('div');
        progressDiv.className = 'progress-indicator';
        progressDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                <span>Processing images...</span>
            </div>
        `;
        document.body.appendChild(progressDiv);
        return progressDiv;
    }
    
    // Character count handlers
    function updateCharacterCount(input, maxLength) {
        const countElement = document.getElementById(input.id.replace(/([A-Z])/g, '') + 'Count') || 
                            document.getElementById(input.id + 'Count');
        if (countElement) {
            countElement.textContent = input.value.length;
        }
    }
    
    // Add character count listeners
    const textInputs = ['caseTitle', 'notes', 'visitDescription'];
    textInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function() {
                const maxLength = this.getAttribute('maxlength') || 1000;
                updateCharacterCount(this, maxLength);
            });
        }
    });
    
    // Form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (submitBtn) {
                submitBtn.disabled = true;
                if (submitText) submitText.style.display = 'none';
                if (loadingText) loadingText.style.display = 'inline';
            }
            
            const progressIndicator = showProgressIndicator();
            
            const formData = new FormData(form);
            
            fetch(form.action, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) {
                    return response.text();
                }
                throw new Error('Upload failed');
            })
            .then(data => {
                progressIndicator.remove();
                window.location.href = '/success';
            })
            .catch(error => {
                progressIndicator.remove();
                console.error('Error:', error);
                showError('Error uploading files. Please try again.');
                
                if (submitBtn) {
                    submitBtn.disabled = false;
                    if (submitText) submitText.style.display = 'inline';
                    if (loadingText) loadingText.style.display = 'none';
                }
            });
        });
    }
});

function handleVisitTypeChange() {
    const visitType = document.getElementById('visitType').value;
    const registrationFields = document.getElementById('registrationFields');
    const followupFields = document.getElementById('followupFields');
    
    // Clear all fields first
    clearRequiredFields();
    
    if (visitType === 'Registration') {
        setRegistrationRequired();
        if (registrationFields) registrationFields.style.display = 'block';
        if (followupFields) followupFields.style.display = 'none';
    } else if (visitType === 'Orthodontic Visit' || visitType === 'Debond') {
        setFollowupRequired();
        if (registrationFields) registrationFields.style.display = 'none';
        if (followupFields) followupFields.style.display = 'block';
    } else {
        if (registrationFields) registrationFields.style.display = 'none';
        if (followupFields) followupFields.style.display = 'none';
    }
}

function clearRequiredFields() {
    // Clear registration fields
    const regFields = ['mrn', 'clinic', 'firstName', 'lastName'];
    regFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            element.required = false;
            element.value = '';
        }
    });
    
    // Clear followup fields
    const followupField = document.getElementById('selectedPatientId');
    if (followupField) {
        followupField.required = false;
        followupField.value = '';
    }
    
    // Hide patient info
    const patientInfo = document.getElementById('selectedPatientInfo');
    if (patientInfo) patientInfo.style.display = 'none';
    
    // Clear search results
    const results = document.getElementById('patientResults');
    if (results) results.innerHTML = '';
}

function setRegistrationRequired() {
    const regFields = ['mrn', 'clinic', 'firstName', 'lastName'];
    regFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) element.required = true;
    });
}

function setFollowupRequired() {
    const followupField = document.getElementById('selectedPatientId');
    if (followupField) followupField.required = true;
}

function searchPatients() {
    const searchTerm = document.getElementById('mrnSearch').value.trim();
    
    if (searchTerm.length < 2) {
        document.getElementById('patientResults').innerHTML = '';
        return;
    }
    
    fetch('/search_patients', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `search_term=${encodeURIComponent(searchTerm)}`
    })
    .then(response => response.json())
    .then(data => {
        displaySearchResults(data.patients);
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Error searching for patients');
    });
}

function displaySearchResults(patients) {
    const resultsDiv = document.getElementById('patientResults');
    
    if (patients.length === 0) {
        resultsDiv.innerHTML = '<div class="alert alert-info">No patients found</div>';
        return;
    }
    
    const resultsHtml = patients.map(patient => 
        `<div class="list-group-item list-group-item-action" style="cursor: pointer;" 
                    onclick="selectPatient(${patient.id}, '${patient.mrn}', '${patient.first_name}', '${patient.last_name}', '${patient.clinic}')">
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${patient.first_name} ${patient.last_name}</h6>
                <small class="badge bg-primary">${patient.clinic}</small>
            </div>
            <p class="mb-1">MRN: ${patient.mrn}</p>
        </div>`
    ).join('');
    
    resultsDiv.innerHTML = `<div class="list-group">${resultsHtml}</div>`;
}

function selectPatient(id, mrn, firstName, lastName, clinic) {
    document.getElementById('selectedPatientId').value = id;
    document.getElementById('selectedPatientDetails').textContent = `${firstName} ${lastName} (MRN: ${mrn}, Clinic: ${clinic})`;
    document.getElementById('selectedPatientInfo').style.display = 'block';
    document.getElementById('patientResults').innerHTML = '';
    document.getElementById('mrnSearch').value = '';
    
    // Store patient data for later use
    selectedPatientData = {
        id: id,
        mrn: mrn,
        first_name: firstName,
        last_name: lastName,
        clinic: clinic
    };
}

// Section navigation functions
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.style.display = 'none');
    
    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Load content based on section
    if (sectionName === 'case-history') {
        loadCaseHistory();
    } else if (sectionName === 'patient-list') {
        loadPatientList();
    } else if (sectionName === 'settings') {
        loadUserSettings();
    }
}

function checkUrlFragment() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        showSection(hash);
    }
}

// Case History functions
function loadCaseHistory() {
    fetch('/api/cases')
        .then(response => response.json())
        .then(data => {
            renderCaseHistory(data.cases);
        })
        .catch(error => {
            console.error('Error loading case history:', error);
            document.getElementById('caseHistoryContent').innerHTML = 
                '<div class="alert alert-danger">Error loading case history</div>';
        });
}

function loadPatientList() {
    fetch('/api/patients')
        .then(response => response.json())
        .then(data => {
            renderPatientList(data.patients);
        })
        .catch(error => {
            console.error('Error loading patients:', error);
            document.getElementById('patientListContent').innerHTML = 
                '<div class="alert alert-danger">Error loading patients</div>';
        });
}

function renderCaseHistory(cases) {
    const content = document.getElementById('caseHistoryContent');
    
    if (cases.length === 0) {
        content.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-folder2-open display-1 text-muted"></i>
                <h4 class="mt-3">No cases yet</h4>
                <p class="text-muted">Start by creating your first case presentation</p>
                <button class="btn btn-primary" onclick="showSection('home')">
                    <i class="bi bi-plus me-2"></i>Create Case
                </button>
            </div>
        `;
        return;
    }
    
    const casesHtml = cases.map(case_ => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${case_.title}</h5>
                    <p class="card-text text-muted">${case_.visit_type}</p>
                    ${case_.patient_name ? `<p class="card-text"><small class="text-muted">Patient: ${case_.patient_name}</small></p>` : ''}
                    <p class="card-text"><small class="text-muted">${new Date(case_.created_at).toLocaleDateString()}</small></p>
                </div>
                <div class="card-footer bg-transparent">
                    <a href="/case/${case_.id}" class="btn btn-outline-primary btn-sm">
                        <i class="bi bi-eye me-1"></i>View
                    </a>
                    ${case_.pdf_filename ? `
                        <a href="/download/${case_.id}" class="btn btn-primary btn-sm">
                            <i class="bi bi-download me-1"></i>Download
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    content.innerHTML = `<div class="row">${casesHtml}</div>`;
}

function renderPatientList(patients) {
    const content = document.getElementById('patientListContent');
    
    if (patients.length === 0) {
        content.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-people display-1 text-muted"></i>
                <h4 class="mt-3">No patients yet</h4>
                <p class="text-muted">Patients will appear here after registration</p>
            </div>
        `;
        return;
    }
    
    const patientsHtml = patients.map(patient => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${patient.first_name} ${patient.last_name}</h5>
                    <p class="card-text">
                        <strong>MRN:</strong> ${patient.mrn}<br>
                        <strong>Clinic:</strong> ${patient.clinic}<br>
                        <strong>Cases:</strong> ${patient.case_count || 0}
                    </p>
                    <p class="card-text">
                        <small class="text-muted">Registered: ${new Date(patient.created_at).toLocaleDateString()}</small>
                    </p>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-outline-primary btn-sm" onclick="renderPatientCases(${patient.id})">
                        <i class="bi bi-folder me-1"></i>View Cases
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    content.innerHTML = `<div class="row">${patientsHtml}</div>`;
}

function filterPatients() {
    const searchTerm = document.getElementById('patientFilter').value.toLowerCase();
    const patientCards = document.querySelectorAll('#patientListContent .card');
    
    patientCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.closest('.col-md-6').style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

function clearPatientSearch() {
    document.getElementById('patientFilter').value = '';
    filterPatients();
}

function renderPatientCases(patientId) {
    fetch(`/api/patients/${patientId}/cases`)
        .then(response => response.json())
        .then(data => {
            const content = document.getElementById('patientListContent');
            
            if (data.cases.length === 0) {
                content.innerHTML = `
                    <div class="text-center py-5">
                        <button class="btn btn-secondary mb-3" onclick="loadPatientList()">
                            <i class="bi bi-arrow-left me-2"></i>Back to Patients
                        </button>
                        <h4>No cases for this patient yet</h4>
                    </div>
                `;
                return;
            }
            
            const casesHtml = data.cases.map(case_ => `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">${case_.title}</h5>
                            <p class="card-text">${case_.visit_type}</p>
                            <p class="card-text">
                                <small class="text-muted">${new Date(case_.created_at).toLocaleDateString()}</small>
                            </p>
                        </div>
                        <div class="card-footer bg-transparent">
                            <a href="/case/${case_.id}" class="btn btn-outline-primary btn-sm">
                                <i class="bi bi-eye me-1"></i>View
                            </a>
                            ${case_.pdf_filename ? `
                                <a href="/download/${case_.id}" class="btn btn-primary btn-sm">
                                    <i class="bi bi-download me-1"></i>Download
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
            
            content.innerHTML = `
                <div class="mb-3">
                    <button class="btn btn-secondary" onclick="loadPatientList()">
                        <i class="bi bi-arrow-left me-2"></i>Back to Patients
                    </button>
                    <h4 class="mt-3">Cases for ${data.patient.first_name} ${data.patient.last_name}</h4>
                </div>
                ${renderTreatmentTimeline(data.cases)}
                <div class="row">${casesHtml}</div>
            `;
        })
        .catch(error => {
            console.error('Error loading patient cases:', error);
        });
}

function renderTreatmentTimeline(cases) {
    if (cases.length === 0) return '';
    
    // Sort cases by visit type order
    const visitOrder = { 'Registration': 1, 'Orthodontic Visit': 2, 'Debond': 3 };
    const sortedCases = cases.sort((a, b) => visitOrder[a.visit_type] - visitOrder[b.visit_type]);
    
    const timelineHtml = sortedCases.map((case_, index) => {
        let stageColor = 'success';
        let icon = 'check-circle-fill';
        
        if (case_.visit_type === 'Registration') {
            stageColor = 'success';
            icon = 'person-plus-fill';
        } else if (case_.visit_type === 'Orthodontic Visit') {
            stageColor = 'primary';
            icon = 'gear-fill';
        } else if (case_.visit_type === 'Debond') {
            stageColor = 'warning';
            icon = 'trophy-fill';
        }
        
        return `
            <div class="timeline-item">
                <div class="timeline-marker bg-${stageColor}">
                    <i class="bi bi-${icon}"></i>
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="timeline-title">${case_.visit_type}</span>
                        <span class="timeline-date" style="background-color: #4a148c; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em;">
                            ${new Date(case_.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <p class="timeline-description">${case_.title}</p>
                </div>
            </div>
        `;
    }).join('');
    
    return `
        <div class="timeline-container mb-4">
            <h5 class="mb-3">Treatment Timeline</h5>
            <div class="timeline">
                ${timelineHtml}
            </div>
        </div>
    `;
}

// Settings functions
function loadUserSettings() {
    fetch('/api/user/settings')
        .then(response => response.json())
        .then(data => {
            if (data.settings) {
                const settings = data.settings;
                document.getElementById('fullName').value = settings.full_name || '';
                document.getElementById('email').value = settings.email || '';
                document.getElementById('position').value = settings.position || '';
                document.getElementById('gender').value = settings.gender || '';
                
                if (settings.profile_image) {
                    const preview = document.getElementById('profilePreview');
                    const placeholder = document.getElementById('uploadPlaceholder');
                    preview.src = `/static/uploads/profiles/${settings.profile_image}`;
                    preview.style.display = 'block';
                    placeholder.style.display = 'none';
                    
                    updateNavProfileImage(`/static/uploads/profiles/${settings.profile_image}`, settings.gender);
                } else {
                    updateDefaultProfileIcon();
                }
                
                loadUserClinics(data.clinics || []);
            }
        })
        .catch(error => {
            console.error('Error loading settings:', error);
        });
}

function loadUserClinics(clinics) {
    const container = document.getElementById('clinicsContainer');
    
    if (clinics.length === 0) {
        container.innerHTML = '<p class="text-muted">No clinics added yet</p>';
        return;
    }
    
    const clinicsHtml = clinics.map((clinic, index) => `
        <div class="clinic-item d-flex align-items-center mb-2">
            <input type="text" class="form-control me-2" value="${clinic.name}" readonly>
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeClinic(this)">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `).join('');
    
    container.innerHTML = clinicsHtml;
    
    updateClinicDropdown(clinics);
}

function addClinic() {
    const container = document.getElementById('clinicsContainer');
    
    if (container.querySelector('p')) {
        container.innerHTML = '';
    }
    
    const clinicItem = document.createElement('div');
    clinicItem.className = 'clinic-item d-flex align-items-center mb-2';
    clinicItem.innerHTML = `
        <input type="text" class="form-control me-2" placeholder="Enter clinic name..." required>
        <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeClinic(this)">
            <i class="bi bi-trash"></i>
        </button>
    `;
    
    container.appendChild(clinicItem);
    clinicItem.querySelector('input').focus();
}

function removeClinic(button) {
    const clinicItem = button.closest('.clinic-item');
    clinicItem.remove();
    
    const container = document.getElementById('clinicsContainer');
    if (container.children.length === 0) {
        container.innerHTML = '<p class="text-muted">No clinics added yet</p>';
    }
}

function updateClinicDropdown(clinics) {
    const clinicSelect = document.getElementById('clinic');
    if (!clinicSelect) return;
    
    // Keep default options
    clinicSelect.innerHTML = `
        <option value="">Select clinic...</option>
        <option value="KFMC">KFMC</option>
        <option value="DC">DC</option>
    `;
    
    // Add user clinics
    clinics.forEach(clinic => {
        if (clinic.name !== 'KFMC' && clinic.name !== 'DC') {
            const option = document.createElement('option');
            option.value = clinic.name;
            option.textContent = clinic.name;
            clinicSelect.appendChild(option);
        }
    });
}

function showAbout() {
    const aboutHtml = `
        <div class="text-center py-5">
            <h2>Patient Data Organizer</h2>
            <p class="lead">Professional medical case presentation platform</p>
            <div class="row mt-5">
                <div class="col-md-4">
                    <i class="bi bi-upload display-4 text-primary"></i>
                    <h5 class="mt-3">Easy Upload</h5>
                    <p>Upload medical images with predefined labels</p>
                </div>
                <div class="col-md-4">
                    <i class="bi bi-file-pdf display-4 text-success"></i>
                    <h5 class="mt-3">PDF Generation</h5>
                    <p>Generate professional slide decks</p>
                </div>
                <div class="col-md-4">
                    <i class="bi bi-people display-4 text-info"></i>
                    <h5 class="mt-3">Patient Management</h5>
                    <p>Track patient visits and treatment progress</p>
                </div>
            </div>
        </div>
    `;
    
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.style.display = 'none');
    
    const homeSection = document.getElementById('home-section');
    if (homeSection) {
        homeSection.innerHTML = aboutHtml;
        homeSection.style.display = 'block';
    }
}

function showSuccessPopup(message = 'Settings saved successfully!') {
    const popup = document.getElementById('successPopup');
    const text = popup.querySelector('.success-text');
    text.textContent = message;
    
    popup.classList.add('show');
    
    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

function handleProfileImageUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showError('Please select an image file.');
        input.value = '';
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        showError('Profile image must be under 2MB.');
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('profilePreview');
        const placeholder = document.getElementById('uploadPlaceholder');
        
        preview.src = e.target.result;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        
        updateNavProfileImage(e.target.result);
    };
    reader.readAsDataURL(file);
}

function updateNavProfileImage(imageSrc, gender = '') {
    const navImage = document.querySelector('.navbar .rounded-circle');
    if (navImage) {
        if (imageSrc) {
            navImage.src = imageSrc;
            navImage.style.display = 'block';
            const icon = navImage.nextElementSibling;
            if (icon) icon.style.display = 'none';
        } else {
            navImage.style.display = 'none';
            const icon = navImage.nextElementSibling;
            if (icon) {
                icon.style.display = 'block';
                icon.className = `bi bi-person${gender === 'female' ? '-dress' : ''}-circle`;
            }
        }
    }
}

function updateDefaultProfileIcon() {
    const gender = document.getElementById('gender').value;
    const preview = document.getElementById('profilePreview');
    const placeholder = document.getElementById('uploadPlaceholder');
    
    if (!preview.src || preview.src.includes('blob:') || preview.src.includes('data:')) {
        preview.style.display = 'none';
        placeholder.style.display = 'flex';
        
        const icon = placeholder.querySelector('i');
        if (icon) {
            icon.className = gender === 'female' ? 'bi bi-person-dress text-muted' : 'bi bi-person text-muted';
        }
        
        updateNavProfileImage(null, gender);
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
    errorDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 350px;';
    errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

function saveSettings() {
    const formData = new FormData();
    
    formData.append('full_name', document.getElementById('fullName').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('position', document.getElementById('position').value);
    formData.append('gender', document.getElementById('gender').value);
    
    const profileImage = document.getElementById('profileImage').files[0];
    if (profileImage) {
        formData.append('profile_image', profileImage);
    }
    
    const clinics = [];
    document.querySelectorAll('#clinicsContainer input[type="text"]').forEach(input => {
        if (input.value.trim()) {
            clinics.push(input.value.trim());
        }
    });
    
    clinics.forEach(clinic => {
        formData.append('clinics', clinic);
    });
    
    fetch('/settings/save', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccessPopup('Settings saved successfully!');
            
            if (data.profile_image) {
                updateNavProfileImage(`/static/uploads/profiles/${data.profile_image}`);
            }
            
            if (clinics.length > 0) {
                updateClinicDropdown(clinics.map(name => ({name})));
            }
        } else {
            showError(data.message || 'Error saving settings');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Error saving settings');
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkUrlFragment();
    
    // Handle browser back/forward
    window.addEventListener('hashchange', checkUrlFragment);
});