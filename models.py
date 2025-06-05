from app import db
from datetime import datetime

class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    mrn = db.Column(db.String(50), unique=True, nullable=False)  # Medical Record Number
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    clinic = db.Column(db.String(20), nullable=False)  # KFMC or DC
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to cases
    cases = db.relationship('Case', backref='patient', lazy=True)
    
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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # New fields for visit types
    visit_type = db.Column(db.String(50), nullable=False)  # Registration, Orthodontic Visit, Debond
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=True)  # Link to patient
    visit_description = db.Column(db.Text)  # For Orthodontic Visit and Debond
    
    def __repr__(self):
        return f'<Case {self.title} - {self.visit_type}>'

class UserSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100))
    email = db.Column(db.String(120))
    position = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to clinics
    clinics = db.relationship('UserClinic', backref='user_settings', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<UserSettings {self.full_name} - {self.email}>'

class UserClinic(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    settings_id = db.Column(db.Integer, db.ForeignKey('user_settings.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<UserClinic {self.name}>'