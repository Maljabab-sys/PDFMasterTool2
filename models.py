from app import db
from datetime import datetime

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
    
    def __repr__(self):
        return f'<Case {self.title}>'