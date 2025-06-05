import os
import logging
from flask import Flask, render_template, request, redirect, url_for, flash, send_file, jsonify, session
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from PIL import Image
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
import tempfile
import uuid
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
db.init_app(app)

# Patient model
class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    mrn = db.Column(db.String(50), unique=True, nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    clinic = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    cases = db.relationship('Case', backref='patient', lazy=True)
    
    def __repr__(self):
        return f'<Patient {self.mrn} - {self.first_name} {self.last_name}>'

# Case model
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
    visit_type = db.Column(db.String(50), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=True)
    visit_description = db.Column(db.Text)
    
    def __init__(self, title, notes, template, orientation, images_per_slide, image_count, pdf_filename, visit_type, patient_id=None, visit_description=None):
        self.title = title
        self.notes = notes
        self.template = template
        self.orientation = orientation
        self.images_per_slide = images_per_slide
        self.image_count = image_count
        self.pdf_filename = pdf_filename
        self.visit_type = visit_type
        self.patient_id = patient_id
        self.visit_description = visit_description
    
    def __repr__(self):
        return f'<Case {self.title} - {self.visit_type}>'

# Initialize database
with app.app_context():
    db.create_all()

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB per file
MAX_IMAGES = 8  # 3 extra-oral + 5 intra-oral images for medical template

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB total

def optimize_image_for_pdf(image_path, max_size=(800, 600), quality=70):
    """Quickly optimize image for PDF generation"""
    try:
        with Image.open(image_path) as img:
            # Convert to RGB if needed
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Resize if too large
            if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save directly over the original file to save memory
            img.save(image_path, 'JPEG', quality=quality, optimize=True)
            return True
    except Exception as e:
        logging.error(f"Error optimizing image {image_path}: {str(e)}")
        return False

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def optimize_image(image_path, max_width=800, max_height=600, quality=85):
    """Optimize image for PDF generation"""
    try:
        with Image.open(image_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Calculate new dimensions while maintaining aspect ratio
            img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Save optimized image to temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg', dir=UPLOAD_FOLDER)
            temp_file.close()  # Close the file handle so other processes can access it
            img.save(temp_file.name, 'JPEG', quality=quality, optimize=True)
            return temp_file.name
    except Exception as e:
        logging.error(f"Error optimizing image {image_path}: {str(e)}")
        return image_path

def create_classic_layout(images, heading_style, styles, pagesize):
    """Classic template - one image per slide"""
    story = []
    from reportlab.platypus import PageBreak
    
    # Standard dimensions for faster processing
    max_width = 5 * inch
    max_height = 4 * inch
    
    for i, image_path in enumerate(images, 1):
        try:
            story.append(Paragraph(f"Slide {i}", heading_style))
            
            # Use fixed dimensions for speed
            img_obj = RLImage(image_path, width=max_width, height=max_height)
            story.append(img_obj)
            story.append(Spacer(1, 0.3*inch))
            
            if i < len(images):
                story.append(PageBreak())
                
        except Exception as e:
            logging.error(f"Error adding image {image_path}: {str(e)}")
            story.append(Paragraph(f"Error loading image {i}", styles['Normal']))
    
    return story

def create_modern_layout(images, heading_style, styles, pagesize, notes):
    """Modern template - image with sidebar notes"""
    story = []
    from reportlab.platypus import PageBreak, Table, TableStyle
    from reportlab.lib import colors
    
    for i, image_path in enumerate(images, 1):
        try:
            story.append(Paragraph(f"Slide {i}", heading_style))
            
            with Image.open(image_path) as img:
                img_width, img_height = img.size
                aspect_ratio = img_width / img_height
                
                width = 4.5 * inch
                height = width / aspect_ratio
                if height > 3.5 * inch:
                    height = 3.5 * inch
                    width = height * aspect_ratio
            
            img_obj = RLImage(image_path, width=width, height=height)
            
            # Create notes content
            note_content = notes if notes else f"Image {i} description"
            note_para = Paragraph(note_content, styles['Normal'])
            
            # Create table with image and notes
            table_data = [[img_obj, note_para]]
            table = Table(table_data, colWidths=[width + 0.5*inch, 2*inch])
            table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (1, 0), (1, 0), 10),
            ]))
            
            story.append(table)
            story.append(Spacer(1, 0.3*inch))
            
            if i < len(images):
                story.append(PageBreak())
                
        except Exception as e:
            logging.error(f"Error adding image {image_path}: {str(e)}")
            story.append(Paragraph(f"Error loading image {i}", styles['Normal']))
    
    return story

def create_grid_layout(images, heading_style, styles, pagesize, images_per_slide):
    """Grid template - multiple images per slide"""
    story = []
    from reportlab.platypus import PageBreak, Table, TableStyle
    
    # Fixed dimensions for speed
    if images_per_slide == 2:
        img_width, img_height = 3*inch, 2*inch
    elif images_per_slide == 4:
        img_width, img_height = 2.5*inch, 1.5*inch
    elif images_per_slide == 6:
        img_width, img_height = 2*inch, 1.2*inch
    else:
        img_width, img_height = 5*inch, 3*inch
    
    slide_num = 1
    for i in range(0, len(images), images_per_slide):
        slide_images = images[i:i + images_per_slide]
        
        story.append(Paragraph(f"Slide {slide_num}", heading_style))
        
        # Simple layout for speed
        for img_path in slide_images:
            try:
                img_obj = RLImage(img_path, width=img_width, height=img_height)
                story.append(img_obj)
                story.append(Spacer(1, 0.2*inch))
            except Exception as e:
                logging.error(f"Error adding image {img_path}: {str(e)}")
        
        story.append(Spacer(1, 0.3*inch))
        slide_num += 1
        
        if i + images_per_slide < len(images):
            story.append(PageBreak())
    
    return story

def create_timeline_layout(images, heading_style, styles, pagesize):
    """Timeline template - chronological layout"""
    story = []
    from reportlab.platypus import PageBreak
    
    for i, image_path in enumerate(images, 1):
        try:
            # Add timeline marker
            timeline_style = ParagraphStyle(
                'Timeline',
                parent=styles['Normal'],
                fontSize=12,
                textColor='blue',
                leftIndent=20
            )
            story.append(Paragraph(f"Step {i}", timeline_style))
            
            with Image.open(image_path) as img:
                img_width, img_height = img.size
                aspect_ratio = img_width / img_height
                
                width = 5 * inch
                height = width / aspect_ratio
                if height > 3 * inch:
                    height = 3 * inch
                    width = height * aspect_ratio
            
            img_obj = RLImage(image_path, width=width, height=height)
            story.append(img_obj)
            story.append(Spacer(1, 0.5*inch))
            
            # Add connector line (except for last image)
            if i < len(images):
                story.append(Paragraph("↓", styles['Normal']))
                story.append(Spacer(1, 0.2*inch))
                
        except Exception as e:
            logging.error(f"Error adding image {image_path}: {str(e)}")
            story.append(Paragraph(f"Error loading image {i}", styles['Normal']))
    
    return story

def create_comparison_layout(images, heading_style, styles, pagesize):
    """Comparison template - side-by-side layout"""
    story = []
    from reportlab.platypus import PageBreak, Table, TableStyle
    
    # Process images in pairs
    for i in range(0, len(images), 2):
        slide_num = (i // 2) + 1
        story.append(Paragraph(f"Comparison {slide_num}", heading_style))
        
        img1_path = images[i]
        img2_path = images[i + 1] if i + 1 < len(images) else None
        
        try:
            img_width = 3 * inch
            img_height = 2.5 * inch
            
            img1_obj = RLImage(img1_path, width=img_width, height=img_height)
            
            if img2_path:
                img2_obj = RLImage(img2_path, width=img_width, height=img_height)
                table_data = [[img1_obj, img2_obj]]
                table = Table(table_data, colWidths=[img_width + 0.5*inch, img_width + 0.5*inch])
            else:
                table_data = [[img1_obj, ""]]
                table = Table(table_data, colWidths=[img_width + 0.5*inch, img_width + 0.5*inch])
            
            table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ]))
            
            story.append(table)
            story.append(Spacer(1, 0.3*inch))
            
            if i + 2 < len(images):
                story.append(PageBreak())
                
        except Exception as e:
            logging.error(f"Error creating comparison layout: {str(e)}")
            story.append(Paragraph(f"Error loading comparison {slide_num}", styles['Normal']))
    
    return story

def create_medical_layout(images, heading_style, styles, pagesize):
    """Medical case template - professional case presentation matching the design"""
    story = []
    from reportlab.platypus import PageBreak, Table, TableStyle, HRFlowable
    from reportlab.lib import colors
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_LEFT
    
    # Create custom styles matching the design
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.gray,  # Gray color like in the design
        spaceAfter=6,
        fontName='Helvetica',
        alignment=TA_LEFT
    )
    
    # Ensure we have exactly 8 images - first 3 are extra-oral, last 5 are intra-oral
    if len(images) < 8:
        logging.warning(f"Expected 8 images, got {len(images)}")
        # Pad with empty placeholders if needed
        while len(images) < 8:
            images.append("")
    
    extra_oral = images[:3]  # First 3 images
    intra_oral = images[3:8]  # Last 5 images
    
    # Extra-oral section: 3 images next to each other (enlarged to fit page)
    if extra_oral:
        story.append(Paragraph("Extra-oral", section_style))
        story.append(Spacer(1, 0.15*inch))
        
        # Single row: 3 images next to each other, larger size
        img_row = []
        for img_path in extra_oral:
            if img_path:
                try:
                    img_obj = RLImage(img_path, width=2.2*inch, height=1.8*inch)
                    img_row.append(img_obj)
                except Exception as e:
                    logging.error(f"Error adding image {img_path}: {str(e)}")
                    img_row.append("")
            else:
                img_row.append("")
        
        # Fill to 3 columns if needed
        while len(img_row) < 3:
            img_row.append("")
        
        table = Table([img_row], colWidths=[2.3*inch, 2.3*inch, 2.3*inch])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 2),
            ('RIGHTPADDING', (0, 0), (-1, -1), 2),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ]))
        story.append(table)
        story.append(Spacer(1, 0.3*inch))
    
    # Intra-oral section: 5 images total - 3 on top row, 2 centered below
    if intra_oral:
        story.append(Paragraph("Intra oral:", section_style))
        story.append(Spacer(1, 0.15*inch))
        
        # First row: 3 images next to each other
        first_row = intra_oral[:3]
        img_row = []
        for img_path in first_row:
            if img_path:
                try:
                    img_obj = RLImage(img_path, width=2.2*inch, height=1.6*inch)
                    img_row.append(img_obj)
                except Exception as e:
                    logging.error(f"Error adding image {img_path}: {str(e)}")
                    img_row.append("")
            else:
                img_row.append("")
        
        # Fill to 3 columns if needed
        while len(img_row) < 3:
            img_row.append("")
        
        table = Table([img_row], colWidths=[2.3*inch, 2.3*inch, 2.3*inch])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 2),
            ('RIGHTPADDING', (0, 0), (-1, -1), 2),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ]))
        story.append(table)
        story.append(Spacer(1, 0.15*inch))
        
        # Second row: 2 images centered below (4th and 5th images)
        if len(intra_oral) > 3:
            second_row = intra_oral[3:5]  # Take 4th and 5th images
            if len(second_row) >= 1:
                img_row = []
                
                # Add spacing columns to center the images
                if len(second_row) == 1:
                    # Single image centered
                    img_row = [""]
                    try:
                        img_obj = RLImage(second_row[0], width=2.2*inch, height=1.6*inch)
                        img_row.append(img_obj)
                    except Exception as e:
                        logging.error(f"Error adding centered image: {str(e)}")
                        img_row.append("")
                    img_row.append("")
                    
                elif len(second_row) == 2:
                    # Two images centered
                    img_row = [""]
                    for img_path in second_row:
                        try:
                            img_obj = RLImage(img_path, width=2.2*inch, height=1.6*inch)
                            img_row.append(img_obj)
                        except Exception as e:
                            logging.error(f"Error adding image: {str(e)}")
                            img_row.append("")
                    img_row.append("")
                
                # Create table with proper centering
                if len(second_row) == 1:
                    centered_table = Table([img_row], colWidths=[2.3*inch, 2.3*inch, 2.3*inch])
                    centered_table.setStyle(TableStyle([
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('GRID', (1, 0), (1, 0), 0.5, colors.lightgrey),
                    ]))
                else:
                    # For 2 images, use 4-column layout for better centering
                    centered_table = Table([img_row], colWidths=[1.15*inch, 2.3*inch, 2.3*inch, 1.15*inch])
                    centered_table.setStyle(TableStyle([
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('GRID', (1, 0), (2, 0), 0.5, colors.lightgrey),
                    ]))
                
                story.append(centered_table)
    
    return story

def create_pdf(images, case_title, notes, output_path, template='classic', orientation='portrait', images_per_slide=1):
    """Create PDF slide deck from images and text"""
    try:
        # Handle case with no images - log warning but continue
        if not images:
            logging.warning(f"Creating PDF with no images for case: {case_title}")
        
        # Set page size based on orientation
        pagesize = A4 if orientation == 'portrait' else (A4[1], A4[0])
        
        doc = SimpleDocTemplate(output_path, pagesize=pagesize, 
                              topMargin=0.5*inch, bottomMargin=0.5*inch,
                              leftMargin=0.5*inch, rightMargin=0.5*inch)
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=18,
            spaceAfter=6,
            spaceBefore=12,
            alignment=1,  # Center alignment
            textColor=colors.Color(int(0.8*255), int(0.6*255), int(0.2*255)),
            fontName='Helvetica-Bold'
        )
        
        subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=24,
            alignment=1,  # Center alignment
            textColor=colors.Color(int(0.5*255), int(0.5*255), int(0.5*255)),
            fontName='Helvetica'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=8,
            spaceBefore=16,
            textColor=colors.Color(int(0.3*255), int(0.3*255), int(0.3*255)),
            fontName='Helvetica-Bold'
        )
        
        story = []
        
        # Title page matching the medical design
        story.append(Paragraph(case_title, title_style))
        if notes:
            # Add patient/case identifier in gray below title
            story.append(Paragraph(notes[:50] + "..." if len(notes) > 50 else notes, subtitle_style))
        story.append(Spacer(1, 0.8*inch))
        
        if notes:
            story.append(Paragraph("Case Notes:", heading_style))
            story.append(Paragraph(notes, styles['Normal']))
        
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", styles['Normal']))
        
        # Add page break before images
        from reportlab.platypus import PageBreak
        story.append(PageBreak())
        
        # Add images based on template (handle empty image list)
        if images:
            if template == 'classic':
                story.extend(create_classic_layout(images, heading_style, styles, pagesize))
            elif template == 'modern':
                story.extend(create_modern_layout(images, heading_style, styles, pagesize, notes))
            elif template == 'grid':
                story.extend(create_grid_layout(images, heading_style, styles, pagesize, images_per_slide))
            elif template == 'timeline':
                story.extend(create_timeline_layout(images, heading_style, styles, pagesize))
            elif template == 'comparison':
                story.extend(create_comparison_layout(images, heading_style, styles, pagesize))
            elif template == 'medical':
                story.extend(create_medical_layout(images, heading_style, styles, pagesize))
            else:
                story.extend(create_classic_layout(images, heading_style, styles, pagesize))
        else:
            # No images provided - add placeholder message
            story.append(Paragraph("No images were uploaded for this case.", heading_style))
            story.append(Spacer(1, 0.5*inch))
        
        # Build PDF
        doc.build(story)
        return True
        
    except Exception as e:
        logging.error(f"Error creating PDF: {str(e)}")
        return False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/success')
def success():
    success_info = session.get('success_info', {})
    if not success_info:
        return redirect(url_for('index'))
    
    # Clear the session data
    session.pop('success_info', None)
    
    return render_template('success.html', 
                         case_title=success_info.get('case_title', 'Unknown'),
                         template=success_info.get('template', 'unknown'),
                         image_count=success_info.get('image_count', 0),
                         timestamp=success_info.get('timestamp', 'Unknown'),
                         case_id=success_info.get('case_id', 0))

@app.route('/search_patients', methods=['POST'])
def search_patients():
    """Search for patients by MRN"""
    data = request.get_json()
    mrn_search = data.get('mrn', '').strip()
    
    if len(mrn_search) < 2:
        return jsonify({'patients': []})
    
    # Search patients by MRN or name (partial match)
    patients = Patient.query.filter(
        db.or_(
            Patient.mrn.ilike(f'%{mrn_search}%'),
            Patient.first_name.ilike(f'%{mrn_search}%'),
            Patient.last_name.ilike(f'%{mrn_search}%'),
            db.func.concat(Patient.first_name, ' ', Patient.last_name).ilike(f'%{mrn_search}%')
        )
    ).all()
    
    patients_data = []
    for patient in patients:
        patients_data.append({
            'id': patient.id,
            'mrn': patient.mrn,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'clinic': patient.clinic
        })
    
    return jsonify({'patients': patients_data})

@app.route('/cases')
def cases():
    """Display all submitted cases with search functionality"""
    search_query = request.args.get('search', '').strip()
    
    if search_query:
        # Search in case title, notes, visit type, patient name, and MRN
        cases = Case.query.join(Patient, Case.patient_id == Patient.id, isouter=True).filter(
            db.or_(
                Case.title.ilike(f'%{search_query}%'),
                Case.notes.ilike(f'%{search_query}%'),
                Case.visit_type.ilike(f'%{search_query}%'),
                Case.visit_description.ilike(f'%{search_query}%'),
                Patient.mrn.ilike(f'%{search_query}%'),
                Patient.first_name.ilike(f'%{search_query}%'),
                Patient.last_name.ilike(f'%{search_query}%')
            )
        ).order_by(Case.created_at.desc()).all()
    else:
        cases = Case.query.order_by(Case.created_at.desc()).all()
    
    return render_template('cases.html', cases=cases, search_query=search_query)

@app.route('/case/<int:case_id>')
def case_detail(case_id):
    """Display details of a specific case"""
    case = Case.query.get_or_404(case_id)
    return render_template('case_detail.html', case=case)

@app.route('/download/<int:case_id>')
def download_case(case_id):
    """Download PDF for a specific case"""
    case = Case.query.get_or_404(case_id)
    pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], case.pdf_filename)
    
    if os.path.exists(pdf_path):
        return send_file(pdf_path, as_attachment=True, 
                        download_name=f"{case.title}_slides.pdf",
                        mimetype='application/pdf')
    else:
        flash('PDF file not found. It may have been deleted.', 'error')
        return redirect(url_for('cases'))

@app.route('/upload', methods=['POST'])
def upload_files():
    try:
        # Get basic form data
        case_title = request.form.get('title', '').strip()
        notes = request.form.get('notes', '').strip()
        visit_type = request.form.get('visit_type', '').strip()
        
        template = 'medical'  # Only medical template
        orientation = 'portrait'  # Fixed to portrait
        images_per_slide = 1  # Not used in medical template
        
        if not case_title:
            flash('Please provide a case title.', 'error')
            return redirect(url_for('index'))
        
        # Images are optional - no validation required
            
        if not visit_type:
            flash('Please select a visit type.', 'error')
            return redirect(url_for('index'))
        
        patient_id = None
        
        # Handle visit-specific data
        if visit_type == 'Registration':
            # Registration: Create new patient
            mrn = request.form.get('mrn', '').strip()
            clinic = request.form.get('clinic', '').strip()
            first_name = request.form.get('first_name', '').strip()
            last_name = request.form.get('last_name', '').strip()
            
            if not all([mrn, clinic, first_name, last_name]):
                flash('Please fill in all required patient information.', 'error')
                return redirect(url_for('index'))
            
            # Check if MRN already exists
            existing_patient = Patient.query.filter_by(mrn=mrn).first()
            if existing_patient:
                flash(f'Patient with MRN {mrn} already exists.', 'error')
                return redirect(url_for('index'))
            
            # Create new patient
            new_patient = Patient(
                mrn=mrn,
                first_name=first_name,
                last_name=last_name,
                clinic=clinic
            )
            db.session.add(new_patient)
            db.session.commit()
            patient_id = new_patient.id
            
        elif visit_type in ['Orthodontic Visit', 'Debond']:
            # Follow-up visit: Find existing patient
            patient_id = request.form.get('patient_id', '').strip()
            
            if not patient_id:
                flash('Please select a patient.', 'error')
                return redirect(url_for('index'))
            
            # Verify patient exists
            patient = Patient.query.get(patient_id)
            if not patient:
                flash('Selected patient not found.', 'error')
                return redirect(url_for('index'))
        
        # Get visit description for follow-up visits
        visit_description = request.form.get('visit_description', '').strip() if visit_type != 'Registration' else None
        
        # Handle optional image uploads in correct order
        image_fields = ['eofv', 'eosv', 'eomv', 'iorv', 'iofv', 'iolv', 'iouv', 'iolowerv']
        uploaded_files = []
        
        for field_name in image_fields:
            if field_name in request.files:
                file = request.files[field_name]
                
                if file and file.filename != '':
                    if not allowed_file(file.filename):
                        flash(f'Invalid file type for {field_name.upper()}. Please use JPEG, PNG, or WebP.', 'error')
                        return redirect(url_for('index'))
                    
                    # Generate unique filename
                    filename = secure_filename(file.filename)
                    unique_filename = f"{uuid.uuid4()}_{field_name}_{filename}"
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                    
                    try:
                        file.save(file_path)
                        # Optimize image immediately after upload
                        optimize_image_for_pdf(file_path)
                        uploaded_files.append(file_path)
                    except Exception as e:
                        logging.error(f"Error saving file {filename}: {str(e)}")
                        flash(f'Error saving file {filename}.', 'error')
                        return redirect(url_for('index'))
        
        # Generate PDF
        pdf_filename = f"slides_{uuid.uuid4()}.pdf"
        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], pdf_filename)
        
        if create_pdf(uploaded_files, case_title, notes, pdf_path, template, orientation, images_per_slide):
            # Save case to database with visit information
            case = Case(
                title=case_title,
                notes=notes,
                template=template,
                orientation=orientation,
                images_per_slide=images_per_slide,
                image_count=len(uploaded_files),
                pdf_filename=pdf_filename,
                visit_type=visit_type,
                patient_id=patient_id,
                visit_description=visit_description
            )
            db.session.add(case)
            db.session.commit()
            
            # Clean up uploaded image files
            for file_path in uploaded_files:
                try:
                    os.unlink(file_path)
                except:
                    pass
            
            # Store success info in session for success page
            session['success_info'] = {
                'case_title': case_title,
                'template': template,
                'image_count': len(uploaded_files),
                'timestamp': datetime.now().strftime('%B %d, %Y at %I:%M %p'),
                'case_id': case.id
            }
            
            return redirect(url_for('success'))
        else:
            flash('Error generating PDF. Please try again.', 'error')
            return redirect(url_for('index'))
            
    except Exception as e:
        logging.error(f"Error in upload_files: {str(e)}")
        flash('An error occurred while processing your request.', 'error')
        return redirect(url_for('index'))

@app.errorhandler(413)
def too_large(e):
    flash('File is too large. Please upload files smaller than 16MB.', 'error')
    return redirect(url_for('index'))

@app.errorhandler(404)
def not_found(e):
    return render_template('index.html'), 404

@app.errorhandler(500)
def server_error(e):
    logging.error(f"Server error: {str(e)}")
    flash('An internal server error occurred. Please try again.', 'error')
    return render_template('index.html'), 500
