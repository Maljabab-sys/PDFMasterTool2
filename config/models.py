from .database import db
from datetime import datetime, timedelta
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import secrets

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    position = db.Column(db.String(100), nullable=False)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    last_login = db.Column(db.DateTime)
    
    # Password reset fields
    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    
    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    @property
    def full_name(self):
        """Get full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_active(self):
        """Required by Flask-Login"""
        return self.active
    
    def generate_reset_token(self):
        """Generate a secure password reset token"""
        self.reset_token = secrets.token_urlsafe(32)
        self.reset_token_expires = datetime.now() + timedelta(hours=1)  # Token expires in 1 hour
        return self.reset_token
    
    def verify_reset_token(self, token):
        """Verify if the reset token is valid and not expired"""
        if not self.reset_token or not self.reset_token_expires:
            return False
        if self.reset_token != token:
            return False
        if datetime.now() > self.reset_token_expires:
            return False
        return True
    
    def clear_reset_token(self):
        """Clear the reset token after use"""
        self.reset_token = None
        self.reset_token_expires = None
    
    def __repr__(self):
        return f'<User {self.email}>'

# Add user relationships
User.patients = db.relationship('Patient', backref='user', lazy=True)
User.cases = db.relationship('Case', backref='user', lazy=True)

class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    mrn = db.Column(db.String(50), nullable=False)  # Medical Record Number
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    clinic = db.Column(db.String(20), nullable=False)  # KFMC or DC
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # User relationship - each patient belongs to a specific user
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationship to cases
    cases = db.relationship('Case', backref='patient', lazy=True)
    
    # Unique constraint: MRN must be unique per user (not globally)
    __table_args__ = (db.UniqueConstraint('mrn', 'user_id', name='unique_mrn_per_user'),)
    
    def __repr__(self):
        return f'<Patient {self.mrn} - {self.first_name} {self.last_name}>'

class Case(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    notes = db.Column(db.Text)
    template = db.Column(db.String(50), nullable=False)
    orientation = db.Column(db.String(20), nullable=False)
    images_per_slide = db.Column(db.Integer, default=1)
    image_count = db.Column(db.Integer, default=0)
    pdf_filename = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # User relationship - each case belongs to a specific user
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # New fields for visit types
    visit_type = db.Column(db.String(50), nullable=False)  # Registration, Orthodontic Visit, Debond
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=True)  # Link to patient
    visit_description = db.Column(db.Text)  # For Orthodontic Visit and Debond
    
    # Additional case information fields
    priority = db.Column(db.String(20), default='normal')  # normal, urgent, emergency
    category = db.Column(db.String(50), default='orthodontics')  # medical specialty
    chief_complaint = db.Column(db.String(255))  # Patient's main concern
    treatment_plan = db.Column(db.Text)  # Proposed treatment
    diagnosis = db.Column(db.Text)  # Clinical diagnosis and findings
    image_categories = db.Column(db.Text)  # JSON string of selected image categories
    
    def __repr__(self):
        return f'<Case {self.title} - {self.visit_type}>'

class OrthodonticExamination(db.Model):
    """Comprehensive orthodontic examination data for each patient"""
    id = db.Column(db.Integer, primary_key=True)
    
    # Patient and User relationships
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    case_id = db.Column(db.Integer, db.ForeignKey('case.id'), nullable=True)  # Link to case if created
    
    # Personal Information
    full_name = db.Column(db.String(200), nullable=False)
    file_number = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date)
    age = db.Column(db.String(10))
    gender = db.Column(db.String(20))
    phone_number = db.Column(db.String(20))
    email = db.Column(db.String(120))
    address = db.Column(db.Text)
    emergency_contact_name = db.Column(db.String(200))
    emergency_contact_phone = db.Column(db.String(20))
    
    # Medical & Dental History
    medical_condition = db.Column(db.String(50))  # yes/no/unknown
    medical_condition_details = db.Column(db.Text)
    current_medications = db.Column(db.Text)
    allergies = db.Column(db.Text)
    dental_history = db.Column(db.Text)  # JSON array of selected options
    dental_history_other = db.Column(db.Text)
    previous_orthodontic_treatment = db.Column(db.String(50))
    previous_orthodontic_details = db.Column(db.Text)
    
    # Extra-oral Examination
    facial_type = db.Column(db.String(50))
    profile_type = db.Column(db.String(50))
    profile_type_other = db.Column(db.Text)
    vertical_facial_proportion = db.Column(db.String(50))
    smile_line = db.Column(db.String(50))
    facial_asymmetry = db.Column(db.String(50))
    facial_asymmetry_other = db.Column(db.Text)
    midline_upper = db.Column(db.String(10))  # on/off
    midline_upper_side = db.Column(db.String(10))  # left/right
    midline_upper_mm = db.Column(db.String(10))
    midline_lower = db.Column(db.String(10))  # on/off
    midline_lower_side = db.Column(db.String(10))  # left/right
    midline_lower_mm = db.Column(db.String(10))
    nasolabial = db.Column(db.String(20))
    nose_size = db.Column(db.String(20))
    mentolabial_fold = db.Column(db.String(50))
    mentolabial_fold_other = db.Column(db.Text)
    lip_in_repose = db.Column(db.String(50))
    lip_in_contact = db.Column(db.String(50))
    jaw_function_muscle_tenderness = db.Column(db.String(10))  # yes/no
    jaw_function_muscle_tenderness_text = db.Column(db.Text)
    tmj_sound = db.Column(db.String(10))  # yes/no
    tmj_sound_text = db.Column(db.Text)
    mandibular_shift = db.Column(db.String(10))  # yes/no
    mandibular_shift_text = db.Column(db.Text)
    
    # Intra-oral Examination
    oral_hygiene = db.Column(db.String(50))
    frenulum_attachment_maxilla = db.Column(db.String(50))
    tongue_size = db.Column(db.String(50))
    palpation_unerupted_canines = db.Column(db.String(100))
    molar_relation_right = db.Column(db.String(50))
    molar_relation_left = db.Column(db.String(50))
    overjet = db.Column(db.String(10))  # in mm
    overbite = db.Column(db.String(50))
    overbite_other = db.Column(db.Text)
    crossbite = db.Column(db.String(50))
    crossbite_other = db.Column(db.Text)
    space_condition = db.Column(db.Text)  # JSON array of selected conditions
    space_condition_other = db.Column(db.Text)
    gingival_impingement = db.Column(db.String(10))  # yes/no
    
    # Additional Notes
    examination_notes = db.Column(db.Text)
    
    # Photo Upload Information
    uploaded_photos = db.Column(db.Text)  # JSON object with photo file paths
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    patient = db.relationship('Patient', backref='orthodontic_examinations')
    user = db.relationship('User', backref='orthodontic_examinations')
    case = db.relationship('Case', backref='orthodontic_examination', uselist=False)
    
    def __repr__(self):
        return f'<OrthodonticExamination {self.full_name} - {self.file_number}>'

class UserSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    full_name = db.Column(db.String(100))
    email = db.Column(db.String(120))
    position = db.Column(db.String(100))  # Used for specialty field in React
    gender = db.Column(db.String(10))  # 'male', 'female', 'other', 'prefer-not-to-say'
    profile_image = db.Column(db.String(255))  # Path to uploaded profile image
    clinics_data = db.Column(db.Text)  # JSON string of clinic names
    
    # Additional fields for React frontend
    specialty = db.Column(db.String(100))  # Dental specialty (separate from position)
    notifications = db.Column(db.Boolean, default=True)  # Notification preferences
    auto_save = db.Column(db.Boolean, default=True)  # Auto-save preference
    dark_mode = db.Column(db.Boolean, default=False)  # Dark mode preference
    language = db.Column(db.String(10), default='en')  # Language preference ('en', 'ar', etc.)
    
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f'<UserSettings {self.full_name} - {self.email}>'

