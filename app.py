import os
import logging
import json
from flask import Flask, render_template, request, redirect, url_for, flash, send_file, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from PIL import Image, ExifTags
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
import tempfile
import uuid
from datetime import datetime, timedelta
from dental_ai_model import get_dental_classifier, initialize_dental_classifier, classify_bulk_images, get_classification_summary
from AI_System.scripts.training_setup import TrainingDataManager
from config.database import db
import json

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Secure cookie - prevent XSS
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Allow cross-site requests with credentials
app.config['SESSION_COOKIE_DOMAIN'] = None  # Use default domain
app.config['SESSION_COOKIE_PATH'] = '/'  # Available on all paths
app.config['SESSION_PERMANENT'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)  # Set session lifetime
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure CORS for React frontend with proper cookie support
CORS(app, 
     origins=['http://localhost:3000', 'http://localhost:3001'], 
     supports_credentials=True,  # CRITICAL: Allow credentials/cookies
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     expose_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])  # Allow all methods

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///dental_app.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
db.init_app(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
# Don't set login_view since we're using API-only backend
# login_manager.login_view = 'login'  # Remove this line
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'info'

# Custom unauthorized handler for API endpoints
@login_manager.unauthorized_handler
def unauthorized_api():
    """Handle unauthorized API requests"""
    return jsonify({'success': False, 'message': 'Authentication required', 'error': 'Unauthorized'}), 401

@login_manager.user_loader
def load_user(user_id):
    # Import here to avoid circular import
    from config.models import User
    from config.database import db
    return db.session.get(User, int(user_id))

# Initialize database with models
with app.app_context():
    # Import models here to avoid circular import
    from config.models import User, Patient, Case, UserSettings
    db.create_all()

# Initialize background training
def initialize_background_training():
    """Initialize background AI training service"""
    try:
        # Initialize dental classifier which will auto-train if needed
        from dental_ai_model import get_dental_classifier
        classifier = get_dental_classifier()

        # Start background training service
        try:
            from AI_System.scripts.background_trainer import start_background_training
            start_background_training()
        except ImportError as e:
            logging.warning(f"Background trainer not available: {e}")

        logging.info("Background AI training service initialized")
    except Exception as e:
        logging.error(f"Failed to initialize background training: {e}")

# Start background training on app startup
initialize_background_training()

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
            # Handle EXIF orientation to prevent unwanted rotation
            try:
                # Use ImageOps to handle EXIF orientation automatically
                from PIL import ImageOps
                img = ImageOps.exif_transpose(img)
            except (AttributeError, TypeError, ImportError):
                # Fallback to manual EXIF handling if ImageOps not available
                try:
                    exif = img._getexif()
                    if exif is not None:
                        orientation = exif.get(274)  # Orientation tag
                        if orientation == 3:
                            img = img.rotate(180, expand=True)
                        elif orientation == 6:
                            img = img.rotate(270, expand=True)
                        elif orientation == 8:
                            img = img.rotate(90, expand=True)
                except:
                    pass
            
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
            # Handle EXIF orientation to prevent unwanted rotation
            try:
                from PIL import ImageOps
                img = ImageOps.exif_transpose(img)
            except (AttributeError, TypeError, ImportError):
                # Fallback to manual EXIF handling if ImageOps not available
                try:
                    exif = img._getexif()
                    if exif is not None:
                        orientation = exif.get(274)  # Orientation tag
                        if orientation == 3:
                            img = img.rotate(180, expand=True)
                        elif orientation == 6:
                            img = img.rotate(270, expand=True)
                        elif orientation == 8:
                            img = img.rotate(90, expand=True)
                except:
                    pass
            
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

    # Split images into extra-oral and intra-oral sections
    # First 3 images go to extra-oral, remaining go to intra-oral
    extra_oral = images[:3] if len(images) >= 3 else images
    intra_oral = images[3:] if len(images) > 3 else []

    # Remove empty strings that might cause ReportLab errors
    extra_oral = [img for img in extra_oral if img and img.strip()]
    intra_oral = [img for img in intra_oral if img and img.strip()]

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

def create_pdf(images, case_title, notes, output_path, template='classic', orientation='portrait', images_per_slide=1, patient_info=None):
    """Create PDF slide deck from images and text"""
    try:
        # Filter out empty, None, or invalid image paths
        valid_images = []
        for img in images:
            if img and isinstance(img, str) and img.strip() and os.path.exists(img):
                valid_images.append(img)
            elif img:
                logging.warning(f"Invalid image path skipped: {img}")

        images = valid_images

        # Handle case with no valid images - log warning but continue
        if not images:
            logging.warning(f"Creating PDF with no valid images for case: {case_title}")

        # Set page size based on orientation
        pagesize = A4 if orientation == 'portrait' else (A4[1], A4[0])

        doc = SimpleDocTemplate(output_path, pagesize=pagesize, 
                              topMargin=0.5*inch, bottomMargin=0.5*inch,
                              leftMargin=0.5*inch, rightMargin=0.5*inch)

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=24,
            spaceAfter=12,
            spaceBefore=12,
            alignment=1,  # Center alignment
            textColor=colors.Color(int(0.8*255), int(0.6*255), int(0.2*255)),
            fontName='Helvetica-Bold'
        )

        patient_style = ParagraphStyle(
            'PatientInfo',
            parent=styles['Normal'],
            fontSize=20,
            spaceAfter=8,
            alignment=1,  # Center alignment
            textColor=colors.Color(int(0.4*255), int(0.4*255), int(0.4*255)),
            fontName='Helvetica-Bold'
        )

        visit_style = ParagraphStyle(
            'VisitInfo',
            parent=styles['Normal'],
            fontSize=18,
            spaceAfter=16,
            alignment=1,  # Center alignment
            textColor=colors.Color(int(0.6*255), int(0.6*255), int(0.6*255)),
            fontName='Helvetica'
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

        # Add patient information if available
        if patient_info:
            story.append(Paragraph(f"Patient: {patient_info['name']}", patient_style))
            story.append(Paragraph(f"MRN: {patient_info['mrn']} | Clinic: {patient_info['clinic']}", visit_style))
            story.append(Paragraph(f"Visit Type: {patient_info['visit_type']}", visit_style))

        if notes:
            # Add patient/case identifier in gray below title
            story.append(Paragraph(notes[:50] + "..." if len(notes) > 50 else notes, subtitle_style))
        story.append(Spacer(1, 0.5*inch))

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

# API-only Flask backend - no HTML template routes
# React frontend handles all UI rendering

@app.route('/save_draft', methods=['POST'])
@login_required
def save_draft():
    """Save case as draft"""
    try:
        case_title = request.form.get('case_title', '').strip()
        notes = request.form.get('notes', '').strip()
        visit_type = request.form.get('visit_type', '').strip()

        if not case_title:
            return jsonify({'success': False, 'message': 'Case title is required'})

        # Get additional case information
        priority = request.form.get('priority', 'normal')
        category = request.form.get('category', 'orthodontics')
        chief_complaint = request.form.get('chief_complaint', '').strip()
        treatment_plan = request.form.get('treatment_plan', '').strip()
        diagnosis = request.form.get('diagnosis', '').strip()
        visit_description = request.form.get('visit_description', '').strip()

        # Handle image categories
        image_categories = request.form.getlist('image_categories')
        image_categories_json = ','.join(image_categories) if image_categories else ''

        # Get template and layout settings
        template = request.form.get('template', 'medical')
        orientation = request.form.get('orientation', 'portrait')
        images_per_slide = int(request.form.get('images_per_slide', 1))

        # Handle patient info for drafts
        patient_id = None
        if visit_type == 'registration':
            mrn = request.form.get('mrn', '').strip()
            clinic = request.form.get('clinic', '').strip()
            first_name = request.form.get('first_name', '').strip()
            last_name = request.form.get('last_name', '').strip()

            if all([mrn, clinic, first_name, last_name]):
                # Check if patient exists
                existing_patient = Patient.query.filter_by(mrn=mrn, user_id=current_user.id).first()
                if not existing_patient:
                    new_patient = Patient(
                        mrn=mrn,
                        first_name=first_name,
                        last_name=last_name,
                        clinic=clinic,
                        user_id=current_user.id
                    )
                    db.session.add(new_patient)
                    db.session.flush()
                    patient_id = new_patient.id
                else:
                    patient_id = existing_patient.id
        else:
            patient_id = request.form.get('patient_id', '').strip()
            if patient_id:
                patient_id = int(patient_id)

        # Save draft case (without PDF generation)
        draft_case = Case(
            title=f"[DRAFT] {case_title}",
            notes=notes,
            template=template,
            orientation=orientation,
            images_per_slide=images_per_slide,
            image_count=0,  # No PDF for drafts
            pdf_filename=None,
            visit_type=visit_type,
            patient_id=patient_id,
            visit_description=visit_description,
            user_id=current_user.id,
            priority=priority,
            category=category,
            chief_complaint=chief_complaint,
            treatment_plan=treatment_plan,
            diagnosis=diagnosis,
            image_categories=image_categories_json
        )

        db.session.add(draft_case)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Draft saved successfully', 'draft_id': draft_case.id})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error saving draft: {str(e)}'})

# Removed HTML template routes - React handles all UI

@app.route('/search_patients', methods=['POST'])
@login_required
def search_patients():
    """Search for patients by MRN"""
    data = request.get_json()
    mrn_search = data.get('mrn', '').strip()

    if len(mrn_search) < 2:
        return jsonify({'patients': []})

    # Search patients by MRN or name (partial match) for current user only
    patients = Patient.query.filter(
        Patient.user_id == current_user.id,
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

@app.route('/api/download/<int:case_id>')
@login_required
def download_case(case_id):
    """Download PDF for a specific case"""
    case = Case.query.filter_by(id=case_id, user_id=current_user.id).first_or_404()
    pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], case.pdf_filename)

    if os.path.exists(pdf_path):
        return send_file(pdf_path, as_attachment=True, 
                        download_name=f"{case.title}_slides.pdf",
                        mimetype='application/pdf')
    else:
        return jsonify({'error': 'PDF file not found'}), 404

@app.route('/upload', methods=['POST'])
@login_required
def upload_files():
    try:
        # Get basic form data
        case_title = request.form.get('case_title', '').strip()
        notes = request.form.get('notes', '').strip()
        visit_type = request.form.get('visit_type', '').strip()
        visit_description = request.form.get('visit_description', '').strip()

        # Get additional case information
        priority = request.form.get('priority', 'normal')
        category = request.form.get('category', 'orthodontics')
        chief_complaint = request.form.get('chief_complaint', '').strip()
        treatment_plan = request.form.get('treatment_plan', '').strip()
        diagnosis = request.form.get('diagnosis', '').strip()

        # Handle image categories
        image_categories = request.form.getlist('image_categories')
        image_categories_json = ','.join(image_categories) if image_categories else ''

        # Get template and layout settings from form
        template = request.form.get('template', 'medical')
        orientation = request.form.get('orientation', 'portrait')
        images_per_slide = int(request.form.get('images_per_slide', 1))

        if not case_title:
            flash('Please provide a case title.', 'error')
            return redirect(url_for('new_case'))

        # Images are optional - no validation required

        if not visit_type:
            flash('Please select a visit type.', 'error')
            return redirect(url_for('new_case'))

        patient_id = None

        # Handle visit-specific data
        if visit_type == 'registration':
            # Registration: Create new patient
            mrn = request.form.get('mrn', '').strip()
            clinic = request.form.get('clinic', '').strip()
            first_name = request.form.get('first_name', '').strip()
            last_name = request.form.get('last_name', '').strip()

            if not all([mrn, clinic, first_name, last_name]):
                flash('Please fill in all required patient information.', 'error')
                return redirect(url_for('new_case'))

            # Check if MRN already exists for this user
            existing_patient = Patient.query.filter_by(mrn=mrn, user_id=current_user.id).first()
            if existing_patient:
                flash(f'Patient with MRN {mrn} already exists.', 'error')
                return redirect(url_for('new_case'))

            # Create new patient for current user
            new_patient = Patient(
                mrn=mrn,
                first_name=first_name,
                last_name=last_name,
                clinic=clinic,
                user_id=current_user.id
            )
            db.session.add(new_patient)
            db.session.commit()
            patient_id = new_patient.id

        elif visit_type in ['orthodontic_visit', 'debond']:
            # Follow-up visit: Find existing patient
            patient_id = request.form.get('patient_id', '').strip()

            if not patient_id:
                flash('Please select a patient.', 'error')
                return redirect(url_for('new_case'))

            # Verify patient exists and belongs to current user
            patient = Patient.query.filter_by(id=patient_id, user_id=current_user.id).first()
            if not patient:
                flash('Selected patient not found.', 'error')
                return redirect(url_for('new_case'))

        # Get visit description for follow-up visits
        visit_description = request.form.get('visit_description', '').strip() if visit_type != 'Registration' else None

        # Handle specific image upload fields for the new structure
        image_fields = [
            'extra_oral_front', 'extra_oral_left', 'extra_oral_right',
            'intra_oral_center', 'intra_oral_upper', 'intra_oral_lower',
            'intra_oral_left', 'intra_oral_right'
        ]
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

        # Get patient info for PDF if available
        patient_info = None
        if patient_id:
            patient = Patient.query.filter_by(id=patient_id, user_id=current_user.id).first()
            if patient:
                patient_info = {
                    'name': f"{patient.first_name} {patient.last_name}",
                    'mrn': patient.mrn,
                    'clinic': patient.clinic,
                    'visit_type': visit_type
                }

        if create_pdf(uploaded_files, case_title, notes, pdf_path, template, orientation, images_per_slide, patient_info):
            # Save case to database with visit information for current user
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
                visit_description=visit_description,
                user_id=current_user.id,
                priority=priority,
                category=category,
                chief_complaint=chief_complaint,
                treatment_plan=treatment_plan,
                diagnosis=diagnosis,
                image_categories=image_categories_json
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
                'case_id': case.id,
                'show_success_animation': True
            }

            return redirect(url_for('new_case') + '?success=true')
        else:
            flash('Error generating PDF. Please try again.', 'error')
            return redirect(url_for('index'))

    except Exception as e:
        logging.error(f"Error in upload_files: {str(e)}")
        flash('An error occurred while processing your request.', 'error')
        return redirect(url_for('index'))

@app.route('/upload_single_files', methods=['POST'])
@login_required
def upload_single_files():
    """Handle single file uploads for direct placement - BYPASSES AI CLASSIFICATION"""
    try:
        logging.info(f"Direct upload request from user {current_user.id}")
        logging.info(f"Request files: {list(request.files.keys())}")
        logging.info(f"Request form: {list(request.form.keys())}")

        # Check for direct upload (single file with forced classification)
        direct_classification = request.form.get('direct_classification')
        placeholder_id = request.form.get('placeholder_id')
        
        if direct_classification and placeholder_id:
            logging.info(f"DIRECT UPLOAD: {direct_classification} → {placeholder_id}")
            
            # Handle single file direct upload (bypass AI)
            if 'file' not in request.files:
                return jsonify({'success': False, 'error': 'No file provided for direct upload'})
            
            file = request.files['file']
            if not file or file.filename == '':
                return jsonify({'success': False, 'error': 'No file selected'})
            
            if not allowed_file(file.filename):
                return jsonify({'success': False, 'error': 'Invalid file type'})
            
            upload_folder = app.config['UPLOAD_FOLDER']
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
            
            # Generate unique filename
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_direct_{direct_classification}_{filename}"
            filepath = os.path.join(upload_folder, unique_filename)
            
            try:
                file.save(filepath)
                optimize_image_for_pdf(filepath)
                
                logging.info(f"DIRECT UPLOAD SUCCESS: {unique_filename} classified as {direct_classification}")
                return jsonify({
                    'success': True, 
                    'filename': unique_filename,
                    'classification': direct_classification,
                    'message': f'Image uploaded directly to {direct_classification}'
                })
                
            except Exception as e:
                logging.error(f"Error in direct upload: {str(e)}")
                return jsonify({'success': False, 'error': f'Upload failed: {str(e)}'})
        
        # Original bulk upload logic (with AI classification)
        if 'files' not in request.files:
            logging.warning("No 'files' key in request.files")
            return jsonify({'success': False, 'error': 'No files selected'})

        files = request.files.getlist('files')
        logging.info(f"Found {len(files)} files for bulk upload")

        if not files or all(f.filename == '' for f in files):
            logging.warning("No valid files found")
            return jsonify({'success': False, 'error': 'No files selected'})

        uploaded_filenames = []
        upload_folder = app.config['UPLOAD_FOLDER']

        # Create upload directory if it doesn't exist
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            logging.info(f"Created upload directory: {upload_folder}")

        for file in files:
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                filepath = os.path.join(upload_folder, unique_filename)

                logging.info(f"Saving file: {filename} as {unique_filename}")

                try:
                    file.save(filepath)
                    # Optimize the image
                    if optimize_image_for_pdf(filepath):
                        uploaded_filenames.append(unique_filename)
                        logging.info(f"Successfully uploaded and optimized: {unique_filename}")
                    else:
                        logging.warning(f"Failed to optimize image: {unique_filename}")
                        uploaded_filenames.append(unique_filename)  # Still add it
                except Exception as e:
                    logging.error(f"Error uploading file {filename}: {str(e)}")
                    return jsonify({'success': False, 'error': f'Error uploading {filename}: {str(e)}'})
            else:
                error_msg = f"Invalid file: {file.filename if file else 'None'}"
                logging.warning(error_msg)
                return jsonify({'success': False, 'error': 'Invalid file type or empty file'})

        logging.info(f"Bulk upload completed successfully: {uploaded_filenames}")
        return jsonify({'success': True, 'filenames': uploaded_filenames})

    except Exception as e:
        logging.error(f"Unexpected error in upload_single_files: {str(e)}")
        return jsonify({'success': False, 'error': f'Upload failed: {str(e)}'})

@app.route('/upload_cropped_image', methods=['POST'])
@login_required
def upload_cropped_image():
    """Handle cropped image uploads"""
    try:
        logging.info(f"Crop upload request from user {current_user.id}")

        if 'cropped_image' in request.files:
            cropped_file = request.files['cropped_image']
            placeholder_id = request.form.get('placeholder_id', '')

            if cropped_file and cropped_file.filename:
                upload_folder = app.config['UPLOAD_FOLDER']
                if not os.path.exists(upload_folder):
                    os.makedirs(upload_folder)

                # Generate unique filename for cropped image
                unique_filename = f"{uuid.uuid4()}_cropped.png"
                filepath = os.path.join(upload_folder, unique_filename)

                try:
                    cropped_file.save(filepath)
                    optimize_image_for_pdf(filepath)

                    logging.info(f"Successfully saved cropped image: {unique_filename}")
                    return jsonify({'success': True, 'filename': unique_filename})

                except Exception as e:
                    logging.error(f"Error saving cropped image: {str(e)}")
                    return jsonify({'success': False, 'error': f'Error saving cropped image: {str(e)}'})
            else:
                return jsonify({'success': False, 'error': 'No cropped image provided'})
        else:
            return jsonify({'success': False, 'error': 'No cropped image in request'})

    except Exception as e:
        logging.error(f"Error in crop upload: {str(e)}")
        return jsonify({'success': False, 'error': f'Crop upload failed: {str(e)}'})

@app.route('/edit_image', methods=['POST'])
@login_required
def edit_image():
    """Handle image editing (rotation, cropping)"""
    try:
        data = request.get_json()
        image_filename = data.get('image_filename')
        placeholder_id = data.get('placeholder_id')
        rotation = data.get('rotation', 0)
        crop_data = data.get('crop_data')
        
        if not image_filename:
            return jsonify({'success': False, 'error': 'No image filename provided'})
        
        # Get the original image path
        original_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
        if not os.path.exists(original_path):
            return jsonify({'success': False, 'error': 'Original image not found'})
        
        # Create edited image
        with Image.open(original_path) as img:
            # Apply rotation if specified
            if rotation != 0:
                img = img.rotate(-rotation, expand=True)  # Negative for correct direction
            
            # Apply cropping if specified
            if crop_data:
                # Convert relative crop coordinates to absolute
                img_width, img_height = img.size
                crop_x = int((crop_data['x'] / crop_data['imageWidth']) * img_width)
                crop_y = int((crop_data['y'] / crop_data['imageHeight']) * img_height)
                crop_w = int((crop_data['width'] / crop_data['imageWidth']) * img_width)
                crop_h = int((crop_data['height'] / crop_data['imageHeight']) * img_height)
                
                # Ensure crop coordinates are within image bounds
                crop_x = max(0, min(crop_x, img_width))
                crop_y = max(0, min(crop_y, img_height))
                crop_w = max(1, min(crop_w, img_width - crop_x))
                crop_h = max(1, min(crop_h, img_height - crop_y))
                
                # Crop the image
                img = img.crop((crop_x, crop_y, crop_x + crop_w, crop_y + crop_h))
            
            # Save the edited image with a new filename
            edited_filename = f"{uuid.uuid4()}_edited_{image_filename}"
            edited_path = os.path.join(app.config['UPLOAD_FOLDER'], edited_filename)
            
            # Convert to RGB if needed before saving
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            img.save(edited_path, 'JPEG', quality=90, optimize=True)
            
            # Optimize for PDF
            optimize_image_for_pdf(edited_path)
            
            logging.info(f"Successfully edited image: {edited_filename}")
            return jsonify({
                'success': True, 
                'filename': edited_filename,
                'message': 'Image edited successfully!'
            })
    
    except Exception as e:
        logging.error(f"Error editing image: {str(e)}")
        return jsonify({'success': False, 'error': f'Failed to edit image: {str(e)}'})

@app.route('/bulk_upload_categorize', methods=['POST'])
@login_required
def bulk_upload_categorize():
    """Handle bulk upload with modelmhanna AI categorization"""
    try:
        if 'files[]' not in request.files:
            return jsonify({'success': False, 'error': 'No files provided'})

        files = request.files.getlist('files[]')
        if not files or files[0].filename == '':
            return jsonify({'success': False, 'error': 'No files selected'})

        # Map modelmhanna AI categories to frontend expected categories  
        def map_ai_to_frontend_category(ai_category):
            """Convert modelmhanna AI categories to frontend expected format"""
            # Now using direct AI categories (no _view suffix needed)
            category_mapping = {
                'extraoral_frontal': 'extraoral_frontal',
                'extraoral_full_face_smile': 'extraoral_full_face_smile', 
                'extraoral_right': 'extraoral_right',
                'extraoral_zoomed_smile': 'extraoral_zoomed_smile',
                'intraoral_front': 'intraoral_front',
                'intraoral_left': 'intraoral_left',
                'intraoral_right': 'intraoral_right',
                'lower_occlusal': 'lower_occlusal',
                'upper_occlusal': 'upper_occlusal'
            }
            return category_mapping.get(ai_category, ai_category)

        results = []
        classifier = get_dental_classifier()
        
        # Log which model is being used
        model_info = "unknown"
        if hasattr(classifier, 'model_path'):
            model_info = f"modelmhanna PyTorch ({classifier.model_path})"
        elif hasattr(classifier, '__class__'):
            model_info = classifier.__class__.__name__
        
        logging.info(f"Using AI classifier: {model_info}")

        for file in files:
            if file and allowed_file(file.filename):
                # Save file
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                unique_filename = f"{timestamp}_{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(filepath)

                # Optimize image for better AI classification
                optimize_image_for_pdf(filepath)

                # Classify with modelmhanna AI
                try:
                    classification_result = classifier.classify_image(filepath)
                    logging.info(f"Modelmhanna AI classification for {filename}: {classification_result}")

                    # Extract detailed information
                    ai_classification = classification_result.get('classification', 'unknown')
                    confidence = classification_result.get('confidence', 0.0)
                    category_name = classification_result.get('category_name', ai_classification)
                    model_used = classification_result.get('model_used', 'unknown')
                    probabilities = classification_result.get('probabilities', {})

                    # Map AI category to frontend expected format
                    frontend_classification = map_ai_to_frontend_category(ai_classification)
                    
                    logging.info(f"Mapped {ai_classification} -> {frontend_classification} for {filename}")

                    # Create detailed result
                    result = {
                        'filename': unique_filename,
                        'original_name': filename,
                        'classification': frontend_classification,  # Use mapped category
                        'ai_classification': ai_classification,     # Keep original for reference
                        'confidence': round(confidence, 3),
                        'category_name': category_name,
                        'model_used': model_used,
                        'reasoning': f"Classified as {category_name} with {confidence:.1%} confidence using {model_used}",
                        'probabilities': {k: round(v, 3) for k, v in probabilities.items()},
                        'success': True
                    }

                    # Add confidence level indicator
                    if confidence >= 0.8:
                        result['confidence_level'] = 'high'
                    elif confidence >= 0.6:
                        result['confidence_level'] = 'medium'
                    else:
                        result['confidence_level'] = 'low'

                    results.append(result)

                except Exception as e:
                    logging.error(f"Error during modelmhanna AI classification for {filename}: {e}")
                    # Enhanced fallback classification
                    results.append({
                        'filename': unique_filename,
                        'original_name': filename,
                        'classification': 'intraoral_frontal_view',  # Use frontend format
                        'ai_classification': 'intraoral_front',     # Original AI format
                        'confidence': 0.3,
                        'category_name': 'Intraoral Front (Fallback)',
                        'model_used': 'fallback_error',
                        'reasoning': f'Default classification due to error: {str(e)}',
                        'probabilities': {},
                        'confidence_level': 'low',
                        'success': False,
                        'error': str(e)
                    })

        # Generate classification summary
        total_files = len(results)
        successful_classifications = len([r for r in results if r.get('success', False)])
        high_confidence = len([r for r in results if r.get('confidence_level') == 'high'])
        medium_confidence = len([r for r in results if r.get('confidence_level') == 'medium'])
        low_confidence = len([r for r in results if r.get('confidence_level') == 'low'])

        # Count categories (using frontend categories)
        category_counts = {}
        for result in results:
            category = result.get('category_name', 'Unknown')
            category_counts[category] = category_counts.get(category, 0) + 1

        summary = {
            'total_files': total_files,
            'successful_classifications': successful_classifications,
            'failed_classifications': total_files - successful_classifications,
            'confidence_distribution': {
                'high': high_confidence,
                'medium': medium_confidence,
                'low': low_confidence
            },
            'category_distribution': category_counts,
            'model_used': model_info
        }

        logging.info(f"Modelmhanna bulk upload completed: {total_files} files processed, {successful_classifications} successful")

        return jsonify({
            'success': True,
            'files': results,
            'summary': summary,
            'classification_summary': f"Processed {total_files} images with modelmhanna AI: {successful_classifications} successful, {high_confidence} high confidence"
        })

    except Exception as e:
        logging.error(f"Bulk upload error: {e}")
        return jsonify({'success': False, 'error': str(e)})

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File is too large. Please upload files smaller than 16MB.'}), 413

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/cases')
def api_cases():
    """API endpoint for case history"""
    if not current_user.is_authenticated:
        # Auto-login demo user if not authenticated
        demo_user = User.query.filter_by(email='demo@example.com').first()
        if demo_user:
            login_user(demo_user, remember=True)
            session.permanent = True
        else:
            return jsonify([])

    cases = Case.query.filter_by(user_id=current_user.id).order_by(Case.created_at.desc()).all()
    cases_data = []

    for case in cases:
        case_data = {
            'id': case.id,
            'title': case.title,
            'visit_type': case.visit_type,
            'created_at': case.created_at.isoformat(),
            'image_count': case.image_count,
            'patient': None
        }

        if case.patient:
            case_data['patient'] = {
                'id': case.patient.id,
                'first_name': case.patient.first_name,
                'last_name': case.patient.last_name,
                'mrn': case.patient.mrn,
                'clinic': case.patient.clinic
            }

        if case.visit_description:
            case_data['visit_description'] = case.visit_description

        cases_data.append(case_data)

    return jsonify(cases_data)

@app.route('/api/patients')
def api_patients():
    """API endpoint for patient list with cases"""
    if not current_user.is_authenticated:
        # Auto-login demo user if not authenticated
        demo_user = User.query.filter_by(email='demo@example.com').first()
        if demo_user:
            login_user(demo_user, remember=True)
            session.permanent = True
        else:
            return jsonify([])

    patients = Patient.query.filter_by(user_id=current_user.id).order_by(Patient.created_at.desc()).all()
    patients_data = []

    for patient in patients:
        patient_cases = Case.query.filter_by(patient_id=patient.id, user_id=current_user.id).order_by(Case.created_at.desc()).all()

        cases_data = []
        for case in patient_cases:
            case_data = {
                'id': case.id,
                'title': case.title,
                'visit_type': case.visit_type,
                'created_at': case.created_at.isoformat(),
                'image_count': case.image_count
            }
            if case.visit_description:
                case_data['visit_description'] = case.visit_description
            cases_data.append(case_data)

        patient_data = {
            'id': patient.id,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'mrn': patient.mrn,
            'clinic': patient.clinic,
            'created_at': patient.created_at.isoformat(),
            'cases_count': len(cases_data),
            'cases': cases_data
        }

        patients_data.append(patient_data)

    return jsonify(patients_data)

@app.route('/api/user-settings', methods=['GET'])
def api_user_settings():
    """API endpoint for user settings"""
    # Add debugging
    logging.info(f"User authenticated: {current_user.is_authenticated}")
    if hasattr(current_user, 'id'):
        logging.info(f"Current user ID: {current_user.id}")

    if not current_user.is_authenticated:
        logging.info("User not authenticated, returning defaults")
        return jsonify({'clinics': ['KFMC', 'DC']})

    # Get settings from database
    user_settings = UserSettings.query.filter_by(user_id=current_user.id).first()
    logging.info(f"Found user settings: {user_settings}")

    if user_settings:
        # Parse clinics from JSON
        try:
            clinics = json.loads(user_settings.clinics_data) if user_settings.clinics_data else ['KFMC', 'DC']
            logging.info(f"Parsed clinics from database: {clinics}")
        except (json.JSONDecodeError, TypeError) as e:
            logging.error(f"Error parsing clinics JSON: {e}")
            clinics = ['KFMC', 'DC']

        settings = {
            'full_name': user_settings.full_name or '',
            'email': user_settings.email or '',
            'position': user_settings.position or '',
            'gender': user_settings.gender or '',
            'clinics': clinics
        }

        # Convert profile image path to URL if exists
        if user_settings.profile_image:
            # Add timestamp to prevent browser caching
            timestamp = int(datetime.now().timestamp())
            settings['profile_image'] = url_for('serve_profile_image', filename=os.path.basename(user_settings.profile_image), _external=True) + f"?t={timestamp}"
    else:
        # Default settings for new users
        settings = {
            'full_name': '',
            'email': '',
            'position': '',
            'gender': '',
            'clinics': []
        }

    logging.info(f"Returning settings: {settings}")
    return jsonify(settings)

@app.route('/uploads/profiles/<filename>')
@login_required
def serve_profile_image(filename):
    """Serve profile images"""
    return send_from_directory(os.path.join('uploads', 'profiles'), filename)

@app.route('/uploads/<filename>')
@login_required
def serve_uploaded_file(filename):
    """Serve uploaded files"""
    return send_from_directory('uploads', filename)

# Removed ai_test HTML route - React handles AI testing UI

@app.route('/api/model-status')
@login_required
def api_model_status():
    """Get current modelmhanna AI model status and training information"""
    try:
        classifier = get_dental_classifier()
        
        # Get basic model information
        model_info = {
            'is_trained': classifier.is_trained,
            'categories': classifier.categories,
            'train_accuracy': getattr(classifier, 'last_train_accuracy', None),
            'val_accuracy': getattr(classifier, 'last_val_accuracy', None),
            'last_training': getattr(classifier, 'last_training_time', None)
        }

        # Add model-specific information
        if hasattr(classifier, 'model_path'):
            model_info['model_type'] = 'modelmhanna_pytorch'
            model_info['model_path'] = classifier.model_path
            model_info['model_exists'] = os.path.exists(classifier.model_path)
            if model_info['model_exists']:
                # Get model file size
                model_size = os.path.getsize(classifier.model_path)
                model_info['model_size_mb'] = round(model_size / (1024 * 1024), 2)
        else:
            model_info['model_type'] = 'fallback_sklearn'

        # Get training data statistics
        try:
            from AI_System.scripts.training_setup import TrainingDataManager
            trainer = TrainingDataManager()
            stats = trainer.get_training_stats()
            model_info['training_images'] = stats['total_images']
            model_info['training_categories'] = stats.get('categories', {})
        except Exception as e:
            logging.warning(f"Could not get training stats: {e}")
            model_info['training_images'] = 0
            model_info['training_categories'] = {}

        # Add modelmhanna data directory information
        modelmhanna_data_path = "modelmhanna/data"
        if os.path.exists(modelmhanna_data_path):
            model_info['modelmhanna_data_available'] = True
            # Count images in each category
            category_counts = {}
            for category in classifier.categories:
                category_path = os.path.join(modelmhanna_data_path, category)
                if os.path.exists(category_path):
                    image_files = [f for f in os.listdir(category_path) 
                                 if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif'))]
                    category_counts[category] = len(image_files)
                else:
                    category_counts[category] = 0
            model_info['modelmhanna_category_counts'] = category_counts
            model_info['modelmhanna_total_images'] = sum(category_counts.values())
        else:
            model_info['modelmhanna_data_available'] = False
            model_info['modelmhanna_category_counts'] = {}
            model_info['modelmhanna_total_images'] = 0

        # Add performance indicators
        if model_info['is_trained']:
            if model_info['model_type'] == 'modelmhanna_pytorch':
                model_info['performance_level'] = 'excellent'
                model_info['performance_description'] = 'Using trained modelmhanna PyTorch model'
            else:
                model_info['performance_level'] = 'good'
                model_info['performance_description'] = 'Using fallback sklearn model'
        else:
            model_info['performance_level'] = 'basic'
            model_info['performance_description'] = 'Model not trained, using default classifications'

        logging.info(f"Model status: {model_info['model_type']}, trained: {model_info['is_trained']}")

        return jsonify(model_info)

    except Exception as e:
        logging.error(f"Error getting modelmhanna model status: {e}")
        return jsonify({'error': str(e)}), 500

# Add API endpoints that the frontend expects
@app.route('/api/ai/model-status')
def api_ai_model_status():
    """Frontend compatible AI model status endpoint (no login required)"""
    try:
        classifier = get_dental_classifier()
        
        # Get basic model information
        model_info = {
            'is_trained': classifier.is_trained,
            'categories': classifier.categories,
            'train_accuracy': getattr(classifier, 'last_train_accuracy', None),
            'val_accuracy': getattr(classifier, 'last_val_accuracy', None),
            'last_training': getattr(classifier, 'last_training_time', None),
            'model_type': 'modelmhanna_pytorch' if hasattr(classifier, 'model_path') else 'fallback_sklearn',
            'performance_level': 'excellent' if hasattr(classifier, 'model_path') else 'basic',
            'performance_description': 'Using trained modelmhanna PyTorch model' if hasattr(classifier, 'model_path') else 'Model not trained, using default classifications'
        }

        return jsonify(model_info)

    except Exception as e:
        logging.error(f"Error getting modelmhanna model status: {e}")
        return jsonify({
            'error': str(e),
            'is_trained': False,
            'categories': [],
            'model_type': 'error',
            'performance_level': 'basic'
        }), 500

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def api_auth_login():
    """API endpoint for login that React frontend expects"""
    if request.method == 'OPTIONS':
        # Handle preflight CORS request
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
            
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            login_user(user, remember=True)
            session.permanent = True  # Make session permanent
            user.last_login = datetime.now()  # Fix deprecated datetime.utcnow()
            db.session.commit()
            
            logging.info(f"Login successful for user {user.email}, session: {session}")
            
            response = jsonify({
                'success': True, 
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'full_name': user.full_name
                }
            })
            # Add CORS headers to response
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response
        else:
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
            
    except Exception as e:
        logging.error(f"API login error: {e}")
        return jsonify({'success': False, 'message': 'Login failed'}), 500

@app.route('/api/auth/logout', methods=['POST'])
@login_required
def api_auth_logout():
    """API endpoint for logout"""
    logout_user()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/auth/me')
@login_required
def api_auth_me():
    """Get current user info"""
    return jsonify({
        'success': True,
        'user': {
            'id': current_user.id,
            'email': current_user.email,
            'first_name': current_user.first_name,
            'last_name': current_user.last_name,
            'full_name': current_user.full_name
        }
    })

@app.route('/api/auth/verify', methods=['GET', 'POST', 'OPTIONS'])
def api_auth_verify():
    """Verify user authentication status for React frontend"""
    if request.method == 'OPTIONS':
        # Handle preflight CORS request
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    if current_user.is_authenticated:
        return jsonify({
            'success': True,
            'authenticated': True,
            'user': {
                'id': current_user.id,
                'email': current_user.email,
                'first_name': current_user.first_name,
                'last_name': current_user.last_name,
                'full_name': current_user.full_name
            }
        })
    else:
        return jsonify({
            'success': True,
            'authenticated': False,
            'user': None
        })

@app.route('/test-ai-classification', methods=['POST'])
@login_required
def test_ai_classification():
    """Test modelmhanna AI classification on uploaded image"""
    try:
        if 'test_image' not in request.files:
            return jsonify({'success': False, 'error': 'No image provided'})

        file = request.files['test_image']
        if not file or file.filename == '':
            return jsonify({'success': False, 'error': 'No image provided'})

        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Invalid file type'})

        # Map modelmhanna AI categories to frontend expected categories
        def map_ai_to_frontend_category(ai_category):
            """Convert modelmhanna AI categories to frontend expected format"""
            # Now using direct AI categories (no _view suffix needed)
            category_mapping = {
                'extraoral_frontal': 'extraoral_frontal',
                'extraoral_full_face_smile': 'extraoral_full_face_smile',
                'extraoral_right': 'extraoral_right', 
                'extraoral_zoomed_smile': 'extraoral_zoomed_smile',
                'intraoral_front': 'intraoral_front',
                'intraoral_left': 'intraoral_left',
                'intraoral_right': 'intraoral_right',
                'lower_occlusal': 'lower_occlusal',
                'upper_occlusal': 'upper_occlusal'
            }
            return category_mapping.get(ai_category, ai_category)

        # Save temporary file
        temp_filename = f"test_{uuid.uuid4()}_{secure_filename(file.filename)}"
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], temp_filename)
        file.save(temp_path)

        try:
            # Optimize image for better AI classification
            optimize_image_for_pdf(temp_path)

            # Classify the image using modelmhanna AI
            classifier = get_dental_classifier()
            result = classifier.classify_image(temp_path)

            # Log which model was used
            model_used = result.get('model_used', 'unknown')
            logging.info(f"Modelmhanna AI test classification using {model_used}: {result}")

            # Map AI category to frontend format
            ai_classification = result['classification']
            frontend_classification = map_ai_to_frontend_category(ai_classification)
            
            logging.info(f"Test classification mapped {ai_classification} -> {frontend_classification}")

            # Store temp file path for potential training data collection
            session['last_test_image'] = temp_path
            session['last_test_result'] = result

            # Enhanced response with detailed information
            response_data = {
                'success': True,
                'classification': frontend_classification,  # Use mapped category
                'ai_classification': ai_classification,     # Keep original for reference
                'confidence': round(result['confidence'], 3),
                'probabilities': {k: round(v, 3) for k, v in result.get('probabilities', {}).items()},
                'category_name': result['category_name'],
                'model_used': model_used,
                'temp_path': temp_path,  # Return for correction endpoint
                'reasoning': f"Classified as {result['category_name']} with {result['confidence']:.1%} confidence"
            }

            # Add confidence level
            confidence = result['confidence']
            if confidence >= 0.8:
                response_data['confidence_level'] = 'high'
                response_data['confidence_description'] = 'High confidence - very reliable classification'
            elif confidence >= 0.6:
                response_data['confidence_level'] = 'medium'
                response_data['confidence_description'] = 'Medium confidence - fairly reliable classification'
            else:
                response_data['confidence_level'] = 'low'
                response_data['confidence_description'] = 'Low confidence - classification may need review'

            # Add top 3 predictions for better insight (map all to frontend format)
            if 'probabilities' in result:
                sorted_probs = sorted(result['probabilities'].items(), key=lambda x: x[1], reverse=True)
                response_data['top_predictions'] = [
                    {
                        'category': map_ai_to_frontend_category(category),  # Map to frontend format
                        'ai_category': category,  # Keep original
                        'probability': round(prob, 3),
                        'category_name': {
                            'extraoral_frontal': 'Extraoral Frontal',
                            'extraoral_full_face_smile': 'Extraoral Full Face Smile',
                            'extraoral_right': 'Extraoral Right',
                            'extraoral_zoomed_smile': 'Extraoral Zoomed Smile',
                            'intraoral_front': 'Intraoral Front',
                            'intraoral_left': 'Intraoral Left',
                            'intraoral_right': 'Intraoral Right',
                            'lower_occlusal': 'Lower Occlusal',
                            'upper_occlusal': 'Upper Occlusal'
                        }.get(category, category)
                    }
                    for category, prob in sorted_probs[:3]
                ]

            return jsonify(response_data)

        except Exception as e:
            # Clean up temp file on error
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            raise e

    except Exception as e:
        logging.error(f"Error in modelmhanna AI classification test: {e}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/trigger-training', methods=['POST'])
@login_required
def trigger_training():
    """Manually trigger AI model training"""
    try:
        from AI_System.scripts.background_trainer import train_model_background
        train_model_background()
        return jsonify({'success': True, 'message': 'Training started in background'})
    except Exception as e:
        logging.error(f"Error triggering training: {e}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/save_settings', methods=['POST'])
def save_settings():
    """Save user settings to database"""

    if not current_user.is_authenticated:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    try:
        full_name = request.form.get('full_name', '').strip()
        email = request.form.get('email', '').strip()
        position = request.form.get('position', '').strip()
        gender = request.form.get('gender', '').strip()
        # Handle both clinics and clinics[] form field names
        clinics = request.form.getlist('clinics') or request.form.getlist('clinics[]')

        # Handle profile image upload
        profile_image_path = None
        if 'profile_image' in request.files:
            file = request.files['profile_image']
            if file and file.filename and allowed_file(file.filename):
                # Create profiles directory if it doesn't exist
                profiles_dir = os.path.join('uploads', 'profiles')
                os.makedirs(profiles_dir, exist_ok=True)

                # Generate unique filename
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"profile_{timestamp}_{filename}"
                filepath = os.path.join(profiles_dir, filename)

                # Save and optimize the image
                file.save(filepath)
                optimize_image_for_pdf(filepath, max_size=(300, 300), quality=80)
                profile_image_path = filepath

        # Clean up clinic names and ensure we have at least default clinics
        clinics = [clinic.strip() for clinic in clinics if clinic.strip()]
        if not clinics:
            clinics = ['KFMC', 'DC']

        # Get or create user settings
        user_settings = UserSettings.query.filter_by(user_id=current_user.id).first()

        if user_settings:
            # Update existing settings
            user_settings.full_name = full_name
            user_settings.email = email
            user_settings.position = position
            user_settings.gender = gender
            user_settings.clinics_data = json.dumps(clinics)
            if profile_image_path:
                user_settings.profile_image = profile_image_path
            user_settings.updated_at = datetime.now()
        else:
            # Create new settings
            user_settings = UserSettings(
                user_id=current_user.id,
                full_name=full_name,
                email=email,
                position=position,
                gender=gender,
                clinics_data=json.dumps(clinics),
                profile_image=profile_image_path
            )
            db.session.add(user_settings)

        db.session.commit()

        logging.info(f"Settings saved to database: {full_name}, {email}, {position}, {gender}, {clinics}")

        # Return JSON response for AJAX
        return jsonify({'success': True, 'message': 'Settings saved successfully!'})

    except Exception as e:
        db.session.rollback()
        logging.error(f"Error saving settings: {str(e)}")
        return jsonify({'success': False, 'message': 'Error saving settings. Please try again.'}), 500

@app.errorhandler(500)
def server_error(e):
    logging.error(f"Server error: {str(e)}")
    return jsonify({'error': 'An internal server error occurred. Please try again.'}), 500

@app.route('/correct_classification', methods=['POST'])
def correct_classification():
    """Correct AI classification and add to training data"""
    try:
        data = request.get_json()
        correct_category = data.get('correct_category')
        temp_path = data.get('temp_path')

        if not correct_category or not temp_path or not os.path.exists(temp_path):
            return jsonify({'success': False, 'error': 'Invalid correction data'})

        # Map frontend categories to dental AI categories
        category_mapping = {
            'intraoral_left_view': 'intraoral_left',
            'intraoral_right_view': 'intraoral_right',
            'intraoral_frontal_view': 'intraoral_front',
            'intraoral_upper_occlusal_view': 'upper_occlusal',
            'intraoral_lower_occlusal_view': 'lower_occlusal',
            'extraoral_frontal_view': 'extraoral_frontal',
            'extraoral_right_view': 'extraoral_right',
            'extraoral_smiling_view': 'extraoral_full_face_smile'
        }

        dental_category = category_mapping.get(correct_category, correct_category)

        # Add to training data
        from AI_System.scripts.training_setup import TrainingDataManager
        trainer = TrainingDataManager()
        trainer.add_training_image(temp_path, dental_category, correct_classification=False)

        # Clean up temp file
        os.unlink(temp_path)

        # Get updated training stats
        stats = trainer.get_training_stats()

        logging.info(f"Added corrected classification: {dental_category}")

        return jsonify({
            'success': True,
            'message': f'Added to {dental_category} training data',
            'training_stats': stats
        })

    except Exception as e:
        logging.error(f"Error correcting classification: {e}")
        return jsonify({'success': False, 'error': str(e)})

# Add API endpoints that React frontend expects
@app.route('/api/auth/profile', methods=['GET', 'PUT', 'OPTIONS'])
def api_auth_profile():
    """User profile API endpoint that React expects"""
    if request.method == 'OPTIONS':
        # Handle preflight CORS request
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Check authentication for non-OPTIONS requests
    if not current_user.is_authenticated:
        logging.warning(f"Profile update failed - user not authenticated. Session: {session}, Current user: {current_user}")
        response = jsonify({'success': False, 'message': 'Authentication required', 'error': 'Unauthorized'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 401
    
    if request.method == 'GET':
        # Get user profile
        user_settings = UserSettings.query.filter_by(user_id=current_user.id).first()
        
        if user_settings:
            # Parse clinics from JSON
            try:
                clinics = json.loads(user_settings.clinics_data) if user_settings.clinics_data else []
            except (json.JSONDecodeError, TypeError):
                clinics = []

            profile_data = {
                'id': current_user.id,
                'email': current_user.email,
                'first_name': current_user.first_name,
                'last_name': current_user.last_name,
                'full_name': user_settings.full_name or f"{current_user.first_name} {current_user.last_name}",
                'specialty': user_settings.specialty or user_settings.position or '',  # Use dedicated specialty field or fall back to position
                'gender': user_settings.gender or '',
                'clinics': clinics,
                'notifications': user_settings.notifications if user_settings.notifications is not None else True,
                'autoSave': user_settings.auto_save if user_settings.auto_save is not None else True,
                'darkMode': user_settings.dark_mode if user_settings.dark_mode is not None else False,
                'language': user_settings.language or 'en',
                'profileImage': user_settings.profile_image
            }

            # Convert profile image path to URL if exists
            if user_settings.profile_image:
                # Add timestamp to prevent browser caching
                timestamp = int(datetime.now().timestamp())
                profile_data['profileImage'] = url_for('serve_profile_image', filename=os.path.basename(user_settings.profile_image), _external=True) + f"?t={timestamp}"
        else:
            # Default profile for new users
            profile_data = {
                'id': current_user.id,
                'email': current_user.email,
                'first_name': current_user.first_name,
                'last_name': current_user.last_name,
                'full_name': f"{current_user.first_name} {current_user.last_name}",
                'specialty': '',
                'gender': '',
                'clinics': [],
                'notifications': True,
                'autoSave': True,
                'darkMode': False,
                'language': 'en',
                'profileImage': None
            }

        response = jsonify({
            'success': True,
            'user': profile_data
        })
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    elif request.method == 'PUT':
        # Update user profile
        try:
            data = request.get_json()
            if not data:
                response = jsonify({'success': False, 'error': 'No data provided'})
                response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
                response.headers.add('Access-Control-Allow-Credentials', 'true')
                return response, 400

            # Debug: Log the received data
            logging.info(f"Profile update data received: {data}")
            logging.info(f"Current user ID: {current_user.id}")

            # Get or create user settings
            user_settings = UserSettings.query.filter_by(user_id=current_user.id).first()
            
            if not user_settings:
                user_settings = UserSettings(user_id=current_user.id)
                db.session.add(user_settings)

            # Update settings from the data
            if 'fullName' in data:
                logging.info(f"Updating full_name to: {data['fullName']}")
                user_settings.full_name = data['fullName']
            if 'email' in data:
                logging.info(f"Updating email to: {data['email']}")
                user_settings.email = data['email']
            if 'specialty' in data:
                logging.info(f"Updating specialty to: {data['specialty']}")
                user_settings.specialty = data['specialty']  # Save to dedicated specialty field
                user_settings.position = data['specialty']   # Also save to position for backward compatibility
            if 'gender' in data:
                logging.info(f"Updating gender to: {data['gender']}")
                user_settings.gender = data['gender']
            if 'clinics' in data:
                user_settings.clinics_data = json.dumps(data['clinics'])
            if 'notifications' in data:
                user_settings.notifications = data['notifications']
            if 'autoSave' in data:
                user_settings.auto_save = data['autoSave']
            if 'darkMode' in data:
                user_settings.dark_mode = data['darkMode']
            if 'language' in data:
                user_settings.language = data['language']
            
            # Handle profile image if provided (base64 data)
            if 'profileImage' in data and data['profileImage'] and data['profileImage'].startswith('data:'):
                # Handle base64 image data
                try:
                    import base64
                    from PIL import Image
                    import io
                    
                    logging.info(f"Processing profile image upload for user {current_user.id}")
                    
                    # Extract base64 data
                    image_data = data['profileImage'].split(',')[1]
                    image_bytes = base64.b64decode(image_data)
                    
                    # Create profiles directory if it doesn't exist
                    profiles_dir = os.path.join('uploads', 'profiles')
                    os.makedirs(profiles_dir, exist_ok=True)
                    
                    # Clean up old profile image if it exists
                    if user_settings.profile_image and os.path.exists(user_settings.profile_image):
                        try:
                            os.remove(user_settings.profile_image)
                            logging.info(f"Removed old profile image: {user_settings.profile_image}")
                        except Exception as e:
                            logging.warning(f"Failed to remove old profile image: {e}")
                    
                    # Generate unique filename with timestamp
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    filename = f"profile_{timestamp}_{current_user.id}.jpg"
                    filepath = os.path.join(profiles_dir, filename)
                    
                    # Process and save image
                    image = Image.open(io.BytesIO(image_bytes))
                    if image.mode in ('RGBA', 'LA', 'P'):
                        image = image.convert('RGB')
                    image.thumbnail((300, 300), Image.Resampling.LANCZOS)
                    image.save(filepath, 'JPEG', quality=80, optimize=True)
                    
                    user_settings.profile_image = filepath
                    logging.info(f"Saved new profile image: {filepath}")
                    
                except Exception as e:
                    logging.error(f"Error processing profile image: {e}")
                    # Continue without failing the entire update

            user_settings.updated_at = datetime.now()
            logging.info(f"About to commit changes for user {current_user.id}")
            db.session.commit()
            logging.info(f"Successfully committed profile changes for user {current_user.id}")

            # Return updated user data
            clinics = json.loads(user_settings.clinics_data) if user_settings.clinics_data else []
            
            # Generate profile image URL
            profile_image_url = None
            if user_settings.profile_image:
                # Always use URL, never file path - use absolute URL for frontend
                # Add timestamp to prevent browser caching
                timestamp = int(datetime.now().timestamp())
                profile_image_url = url_for('serve_profile_image', filename=os.path.basename(user_settings.profile_image), _external=True) + f"?t={timestamp}"
                logging.info(f"Generated profile image URL: {profile_image_url}")
            else:
                logging.warning(f"No profile image set for user {current_user.id}")

            updated_user = {
                'id': current_user.id,
                'email': current_user.email,
                'first_name': current_user.first_name,
                'last_name': current_user.last_name,
                'full_name': user_settings.full_name or f"{current_user.first_name} {current_user.last_name}",
                'specialty': user_settings.specialty or user_settings.position or '',
                'gender': user_settings.gender or '',
                'clinics': clinics,
                'notifications': user_settings.notifications if user_settings.notifications is not None else data.get('notifications', True),
                'autoSave': user_settings.auto_save if user_settings.auto_save is not None else data.get('autoSave', True),
                'darkMode': user_settings.dark_mode if user_settings.dark_mode is not None else data.get('darkMode', False),
                'language': user_settings.language or data.get('language', 'en'),
                'profileImage': profile_image_url
            }
            logging.info(f"Returning updated user data with profile image: {profile_image_url}")

            response = jsonify({
                'success': True,
                'message': 'Profile updated successfully',
                'user': updated_user
            })
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error updating profile: {str(e)}")
            response = jsonify({'success': False, 'error': 'Failed to update profile'})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response, 500

@app.route('/api/auth/change-password', methods=['POST', 'OPTIONS'])
def api_change_password():
    """Change user password API endpoint"""
    if request.method == 'OPTIONS':
        # Handle preflight CORS request
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Check authentication for non-OPTIONS requests
    if not current_user.is_authenticated:
        response = jsonify({'success': False, 'message': 'Authentication required', 'error': 'Unauthorized'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 401
    
    try:
        data = request.get_json()
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        
        if not current_password or not new_password:
            response = jsonify({'success': False, 'message': 'Current password and new password are required'})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response, 400
        
        # Verify current password
        if not current_user.check_password(current_password):
            response = jsonify({'success': False, 'message': 'Current password is incorrect'})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response, 401
        
        # Validate new password
        if len(new_password) < 8:
            response = jsonify({'success': False, 'message': 'New password must be at least 8 characters long'})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response, 400
        
        # Update password
        current_user.set_password(new_password)
        db.session.commit()
        
        logging.info(f"Password changed for user {current_user.email}")
        response = jsonify({'success': True, 'message': 'Password changed successfully'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    except Exception as e:
        db.session.rollback()
        logging.error(f"Error changing password: {str(e)}")
        response = jsonify({'success': False, 'message': 'Failed to change password'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 500

@app.route('/api/auth/debug', methods=['GET'])
def debug_auth():
    """Debug endpoint to check authentication status"""
    return jsonify({
        'authenticated': current_user.is_authenticated,
        'user_id': current_user.id if current_user.is_authenticated else None,
        'session': dict(session),
        'cookies': dict(request.cookies)
    })

@app.route('/api/dashboard-stats', methods=['GET', 'OPTIONS'])
def api_dashboard_stats():
    """Get dashboard statistics for React frontend"""
    if request.method == 'OPTIONS':
        # Handle preflight CORS request
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Check authentication for non-OPTIONS requests
    if not current_user.is_authenticated:
        response = jsonify({'success': False, 'message': 'Authentication required', 'error': 'Unauthorized'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 401
    
    try:
        # Get counts from database for current user only
        total_patients = Patient.query.filter_by(user_id=current_user.id).count()
        total_cases = Case.query.filter_by(user_id=current_user.id).count()
        
        # Get cases from current month for current user
        from datetime import datetime
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        this_month_cases = Case.query.filter(
            Case.user_id == current_user.id,
            db.extract('month', Case.created_at) == current_month,
            db.extract('year', Case.created_at) == current_year
        ).count()
        
        # Get active patients (patients with cases in last 30 days) for current user
        thirty_days_ago = datetime.now() - timedelta(days=30)
        active_patients = db.session.query(Patient).join(Case).filter(
            Case.user_id == current_user.id,
            Case.created_at >= thirty_days_ago
        ).distinct().count()
        
        # Get recent cases for the table for current user
        recent_cases = Case.query.filter_by(user_id=current_user.id).order_by(Case.created_at.desc()).limit(5).all()
        
        recent_cases_data = []
        for case in recent_cases:
            patient_name = 'Unknown'
            if case.patient:
                patient_name = f"{case.patient.first_name} {case.patient.last_name}".strip()
                if not patient_name:
                    patient_name = case.patient.mrn or 'Unknown'
            
            recent_cases_data.append({
                'id': case.id,
                'patient': patient_name,
                'action': 'New Case Created',
                'date': case.created_at.strftime('%Y-%m-%d') if case.created_at else '',
                'status': 'Completed'
            })
        
        response_data = {
            'totalPatients': total_patients,
            'totalCases': total_cases,
            'thisMonth': this_month_cases,
            'activePatients': active_patients,
            'recentCases': recent_cases_data
        }
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    except Exception as e:
        logging.error(f"Error fetching dashboard stats: {e}")
        response = jsonify({
            'success': False,
            'error': 'Failed to fetch dashboard statistics',
            'totalPatients': 0,
            'totalCases': 0,
            'thisMonth': 0,
            'activePatients': 0,
            'recentCases': []
        })
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 500

@app.route('/api/orthodontic-examinations', methods=['GET', 'OPTIONS'])
@login_required
def get_orthodontic_examinations():
    """Get all orthodontic examinations for current user"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    try:
        from config.models import OrthodonticExamination, Patient
        
        # Get all examinations for current user with patient info
        examinations = db.session.query(OrthodonticExamination, Patient).join(
            Patient, OrthodonticExamination.patient_id == Patient.id
        ).filter(
            OrthodonticExamination.user_id == current_user.id
        ).order_by(OrthodonticExamination.created_at.desc()).all()
        
        examinations_data = []
        for exam, patient in examinations:
            exam_data = {
                'id': exam.id,
                'patient_id': patient.id,
                'patient_name': exam.full_name,
                'file_number': exam.file_number,
                'patient_mrn': patient.mrn,
                'patient_clinic': patient.clinic,
                'created_at': exam.created_at.isoformat(),
                'updated_at': exam.updated_at.isoformat(),
                'case_id': exam.case_id,
                
                # Personal Information
                'date_of_birth': exam.date_of_birth.isoformat() if exam.date_of_birth else None,
                'age': exam.age,
                'gender': exam.gender,
                'phone_number': exam.phone_number,
                'email': exam.email,
                
                # Medical History Summary
                'medical_condition': exam.medical_condition,
                'previous_orthodontic_treatment': exam.previous_orthodontic_treatment,
                
                # Examination Summary
                'profile_type': exam.profile_type,
                'molar_relation_right': exam.molar_relation_right,
                'molar_relation_left': exam.molar_relation_left,
                'overjet': exam.overjet,
                'overbite': exam.overbite,
                
                # Photos
                'uploaded_photos': json.loads(exam.uploaded_photos) if exam.uploaded_photos else {}
            }
            examinations_data.append(exam_data)
        
        response = jsonify({
            'success': True,
            'examinations': examinations_data,
            'total': len(examinations_data)
        })
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    except Exception as e:
        logging.error(f"Error fetching orthodontic examinations: {str(e)}")
        response = jsonify({
            'success': False,
            'error': 'Failed to fetch examinations'
        })
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 500

@app.route('/api/orthodontic-examination/<int:exam_id>', methods=['GET', 'OPTIONS'])
@login_required
def get_orthodontic_examination_detail(exam_id):
    """Get detailed orthodontic examination data"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    try:
        from config.models import OrthodonticExamination, Patient
        
        # Get examination with patient info
        exam = db.session.query(OrthodonticExamination, Patient).join(
            Patient, OrthodonticExamination.patient_id == Patient.id
        ).filter(
            OrthodonticExamination.id == exam_id,
            OrthodonticExamination.user_id == current_user.id
        ).first()
        
        if not exam:
            response = jsonify({'success': False, 'error': 'Examination not found'})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response, 404
        
        examination, patient = exam
        
        # Return complete examination data
        exam_data = {
            'id': examination.id,
            'patient_id': patient.id,
            'patient_mrn': patient.mrn,
            'patient_clinic': patient.clinic,
            'case_id': examination.case_id,
            'created_at': examination.created_at.isoformat(),
            'updated_at': examination.updated_at.isoformat(),
            
            # Personal Information
            'full_name': examination.full_name,
            'file_number': examination.file_number,
            'date_of_birth': examination.date_of_birth.isoformat() if examination.date_of_birth else None,
            'age': examination.age,
            'gender': examination.gender,
            'phone_number': examination.phone_number,
            'email': examination.email,
            'address': examination.address,
            'emergency_contact_name': examination.emergency_contact_name,
            'emergency_contact_phone': examination.emergency_contact_phone,
            
            # Medical & Dental History
            'medical_condition': examination.medical_condition,
            'medical_condition_details': examination.medical_condition_details,
            'current_medications': examination.current_medications,
            'allergies': examination.allergies,
            'dental_history': json.loads(examination.dental_history) if examination.dental_history else [],
            'dental_history_other': examination.dental_history_other,
            'previous_orthodontic_treatment': examination.previous_orthodontic_treatment,
            'previous_orthodontic_details': examination.previous_orthodontic_details,
            
            # Extra-oral Examination
            'facial_type': examination.facial_type,
            'profile_type': examination.profile_type,
            'profile_type_other': examination.profile_type_other,
            'vertical_facial_proportion': examination.vertical_facial_proportion,
            'smile_line': examination.smile_line,
            'facial_asymmetry': examination.facial_asymmetry,
            'facial_asymmetry_other': examination.facial_asymmetry_other,
            'midline_upper': examination.midline_upper,
            'midline_upper_side': examination.midline_upper_side,
            'midline_upper_mm': examination.midline_upper_mm,
            'midline_lower': examination.midline_lower,
            'midline_lower_side': examination.midline_lower_side,
            'midline_lower_mm': examination.midline_lower_mm,
            'nasolabial': examination.nasolabial,
            'nose_size': examination.nose_size,
            'mentolabial_fold': examination.mentolabial_fold,
            'mentolabial_fold_other': examination.mentolabial_fold_other,
            'lip_in_repose': examination.lip_in_repose,
            'lip_in_contact': examination.lip_in_contact,
            'jaw_function_muscle_tenderness': examination.jaw_function_muscle_tenderness,
            'jaw_function_muscle_tenderness_text': examination.jaw_function_muscle_tenderness_text,
            'tmj_sound': examination.tmj_sound,
            'tmj_sound_text': examination.tmj_sound_text,
            'mandibular_shift': examination.mandibular_shift,
            'mandibular_shift_text': examination.mandibular_shift_text,
            
            # Intra-oral Examination
            'oral_hygiene': examination.oral_hygiene,
            'frenulum_attachment_maxilla': examination.frenulum_attachment_maxilla,
            'tongue_size': examination.tongue_size,
            'palpation_unerupted_canines': examination.palpation_unerupted_canines,
            'molar_relation_right': examination.molar_relation_right,
            'molar_relation_left': examination.molar_relation_left,
            'overjet': examination.overjet,
            'overbite': examination.overbite,
            'overbite_other': examination.overbite_other,
            'crossbite': examination.crossbite,
            'crossbite_other': examination.crossbite_other,
            'space_condition': json.loads(examination.space_condition) if examination.space_condition else [],
            'space_condition_other': examination.space_condition_other,
            'gingival_impingement': examination.gingival_impingement,
            
            # Additional Notes
            'examination_notes': examination.examination_notes,
            
            # Photo Upload Information
            'uploaded_photos': json.loads(examination.uploaded_photos) if examination.uploaded_photos else {}
        }
        
        response = jsonify({
            'success': True,
            'examination': exam_data
        })
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    except Exception as e:
        logging.error(f"Error fetching examination detail: {str(e)}")
        response = jsonify({
            'success': False,
            'error': 'Failed to fetch examination details'
        })
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 500

@app.route('/api/orthodontic-examination', methods=['POST', 'OPTIONS'])
def submit_orthodontic_examination():
    """Submit orthodontic examination form data"""
    if request.method == 'OPTIONS':
        # Handle preflight CORS request
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Auto-login if not authenticated
    if not current_user.is_authenticated:
        # Try to find any existing user to auto-login
        existing_user = User.query.first()
        if existing_user:
            login_user(existing_user, remember=True)
            session.permanent = True
            logging.info(f"Auto-logged in user: {existing_user.email}")
        else:
            return jsonify({'success': False, 'message': 'No users found in system'}), 401
    
    try:
        # Import here to avoid circular import
        from config.models import Patient, OrthodonticExamination, Case
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        # Extract form data
        form_data = data.get('formData', {})
        uploaded_images = data.get('uploadedImages', {})
        selected_specialty = data.get('selectedSpecialty', '')
        selected_clinic = data.get('selectedClinic', '')
        
        # Debug: Log received data
        logging.info(f"Orthodontic examination submission from user: {current_user.id if current_user.is_authenticated else 'Anonymous'}")
        logging.info(f"Received form data keys: {list(form_data.keys())}")
        logging.info(f"Selected specialty: {selected_specialty}")
        logging.info(f"Selected clinic: {selected_clinic}")
        logging.info(f"Full name: {form_data.get('fullName')}")
        logging.info(f"File number: {form_data.get('fileNumber')}")
        logging.info(f"Uploaded images: {list(uploaded_images.keys()) if uploaded_images else 'None'}")
        
        # Validate required fields
        if not form_data.get('fullName') or not form_data.get('fileNumber'):
            return jsonify({'success': False, 'message': 'Full name and file number are required'}), 400
        
        # Create or find patient
        patient = None
        
        # Check if patient already exists with this file number for current user
        existing_patient = Patient.query.filter_by(
            mrn=form_data.get('fileNumber'),
            user_id=current_user.id
        ).first()
        
        if existing_patient:
            # Update existing patient info
            patient = existing_patient
            name_parts = form_data.get('fullName', '').split(' ', 1)
            patient.first_name = name_parts[0] if name_parts else ''
            patient.last_name = name_parts[1] if len(name_parts) > 1 else ''
            patient.clinic = selected_clinic
        else:
            # Create new patient
            name_parts = form_data.get('fullName', '').split(' ', 1)
            patient = Patient(
                mrn=form_data.get('fileNumber'),
                first_name=name_parts[0] if name_parts else '',
                last_name=name_parts[1] if len(name_parts) > 1 else '',
                clinic=selected_clinic,
                user_id=current_user.id
            )
            db.session.add(patient)
            db.session.flush()  # Get patient ID
        
        # Save uploaded images to server
        saved_images = {}
        for image_type, image_data in uploaded_images.items():
            if image_data and image_data.get('file'):
                # Here you would save the actual image files
                # For now, we'll just store the image names
                saved_images[image_type] = image_data.get('name', '')
        
        # Create orthodontic examination record
        examination = OrthodonticExamination(
            patient_id=patient.id,
            user_id=current_user.id,
            
            # Personal Information
            full_name=form_data.get('fullName', ''),
            file_number=form_data.get('fileNumber', ''),
            date_of_birth=datetime.strptime(form_data.get('dateOfBirth'), '%Y-%m-%d').date() if form_data.get('dateOfBirth') else None,
            age=form_data.get('age', ''),
            gender=form_data.get('gender', ''),
            phone_number='',  # Not in frontend form yet
            email='',  # Not in frontend form yet
            address='',  # Not in frontend form yet
            emergency_contact_name='',  # Not in frontend form yet
            emergency_contact_phone='',  # Not in frontend form yet
            
            # Medical & Dental History
            medical_condition=form_data.get('medicalCondition', ''),
            medical_condition_details=form_data.get('medicalConditionOther', ''),
            current_medications=form_data.get('medication', ''),
            allergies=form_data.get('allergy', ''),
            dental_history=json.dumps(form_data.get('dentalHistory', [])),
            dental_history_other=form_data.get('dentalHistoryOther', ''),
            previous_orthodontic_treatment=form_data.get('previousOrthodonticTreatment', ''),
            previous_orthodontic_details=form_data.get('previousOrthodonticTreatmentOther', ''),
            
            # Extra-oral Examination
            facial_type=form_data.get('facialType', ''),
            profile_type=form_data.get('profileType', ''),
            profile_type_other=form_data.get('profileTypeOther', ''),
            vertical_facial_proportion=form_data.get('verticalFacialProportion', ''),
            smile_line=form_data.get('smileLine', ''),
            facial_asymmetry=form_data.get('facialAsymmetry', ''),
            facial_asymmetry_other=form_data.get('facialAsymmetryOther', ''),
            midline_upper=form_data.get('midlineUpper', ''),
            midline_upper_side=form_data.get('midlineUpperSide', ''),
            midline_upper_mm=form_data.get('midlineUpperMm', ''),
            midline_lower=form_data.get('midlineLower', ''),
            midline_lower_side=form_data.get('midlineLowerSide', ''),
            midline_lower_mm=form_data.get('midlineLowerMm', ''),
            nasolabial=form_data.get('nasolabial', ''),
            nose_size=form_data.get('noseSize', ''),
            mentolabial_fold=form_data.get('mentolabialFold', ''),
            mentolabial_fold_other=form_data.get('mentolabialFoldOther', ''),
            lip_in_repose=form_data.get('lipInRepose', ''),
            lip_in_contact=form_data.get('lipInContact', ''),
            jaw_function_muscle_tenderness=form_data.get('jawFunctionMuscleTenderness', ''),
            jaw_function_muscle_tenderness_text=form_data.get('jawFunctionMuscleTendernessText', ''),
            tmj_sound=form_data.get('tmjSound', ''),
            tmj_sound_text=form_data.get('tmjSoundText', ''),
            mandibular_shift=form_data.get('mandibularShift', ''),
            mandibular_shift_text=form_data.get('mandibularShiftText', ''),
            
            # Intra-oral Examination
            oral_hygiene=form_data.get('oralHygiene', ''),
            frenulum_attachment_maxilla=form_data.get('frenulumAttachmentMaxilla', ''),
            tongue_size=form_data.get('tongueSize', ''),
            palpation_unerupted_canines=form_data.get('palpationUnruptedCanines', ''),
            molar_relation_right=form_data.get('molarRelationRight', ''),
            molar_relation_left=form_data.get('molarRelationLeft', ''),
            overjet=form_data.get('overjet', ''),
            overbite=form_data.get('overbite', ''),
            overbite_other=form_data.get('overbiteOther', ''),
            crossbite=form_data.get('crossbite', ''),
            crossbite_other=form_data.get('crossbiteOther', ''),
            space_condition=json.dumps(form_data.get('spaceCondition', [])),
            space_condition_other=form_data.get('spaceConditionOther', ''),
            gingival_impingement=form_data.get('gingivalImpingement', ''),
            
            # Additional Notes
            examination_notes=form_data.get('examinationNotes', ''),
            
            # Photo Upload Information
            uploaded_photos=json.dumps(saved_images)
        )
        
        db.session.add(examination)
        db.session.flush()  # Get examination ID
        
        # Create a case record for this examination
        case_title = f"Orthodontic Examination - {form_data.get('fullName', '')} ({form_data.get('fileNumber', '')})"
        case = Case(
            title=case_title,
            notes=f"Orthodontic examination for {form_data.get('fullName', '')}",
            template='medical',
            orientation='portrait',
            images_per_slide=1,
            image_count=len([img for img in saved_images.values() if img]),
            pdf_filename=None,  # Will be generated later if needed
            visit_type='orthodontic_examination',
            patient_id=patient.id,
            user_id=current_user.id,
            category=selected_specialty,
            chief_complaint=form_data.get('reasonForTreatment', ''),  # Use reasonForTreatment as chief complaint
            treatment_plan='',  # Not in frontend form yet
            diagnosis=''  # Not in frontend form yet
        )
        
        db.session.add(case)
        db.session.flush()
        
        # Link examination to case
        examination.case_id = case.id
        
        # Commit all changes
        db.session.commit()
        
        logging.info(f"Orthodontic examination saved for patient {patient.id} by user {current_user.id}")
        
        response = jsonify({
            'success': True,
            'message': 'Orthodontic examination saved successfully',
            'patient_id': patient.id,
            'examination_id': examination.id,
            'case_id': case.id
        })
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        
        logging.info(f"Successfully saved orthodontic examination: patient_id={patient.id}, examination_id={examination.id}, case_id={case.id}")
        return response
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error saving orthodontic examination: {str(e)}")
        response = jsonify({
            'success': False,
            'message': f'Error saving examination: {str(e)}'
        })
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)