import os
import logging
from flask import Flask, render_template, request, redirect, url_for, flash, send_file, jsonify
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
from PIL import Image
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
import tempfile
import uuid
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

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
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
            img.save(temp_file.name, 'JPEG', quality=quality, optimize=True)
            return temp_file.name
    except Exception as e:
        logging.error(f"Error optimizing image {image_path}: {str(e)}")
        return image_path

def create_pdf(images, case_title, notes, output_path):
    """Create PDF slide deck from images and text"""
    try:
        doc = SimpleDocTemplate(output_path, pagesize=A4, 
                              topMargin=0.5*inch, bottomMargin=0.5*inch,
                              leftMargin=0.5*inch, rightMargin=0.5*inch)
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=24,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            spaceBefore=20
        )
        
        story = []
        
        # Title page
        story.append(Paragraph(case_title, title_style))
        story.append(Spacer(1, 0.5*inch))
        
        if notes:
            story.append(Paragraph("Case Notes:", heading_style))
            story.append(Paragraph(notes, styles['Normal']))
        
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", styles['Normal']))
        
        # Add page break before images
        from reportlab.platypus import PageBreak
        story.append(PageBreak())
        
        # Add images
        for i, image_path in enumerate(images, 1):
            try:
                # Optimize image for PDF
                optimized_path = optimize_image(image_path)
                
                # Add image title
                story.append(Paragraph(f"Slide {i}", heading_style))
                
                # Calculate image dimensions for PDF
                with Image.open(optimized_path) as img:
                    img_width, img_height = img.size
                    # Scale to fit page width (max 7 inches)
                    max_width = 7 * inch
                    max_height = 5 * inch
                    
                    aspect_ratio = img_width / img_height
                    if img_width > img_height:
                        width = min(max_width, 7 * inch)
                        height = width / aspect_ratio
                    else:
                        height = min(max_height, 5 * inch)
                        width = height * aspect_ratio
                
                # Add image to PDF
                img_obj = RLImage(optimized_path, width=width, height=height)
                story.append(img_obj)
                story.append(Spacer(1, 0.3*inch))
                
                # Clean up optimized image if it's different from original
                if optimized_path != image_path:
                    try:
                        os.unlink(optimized_path)
                    except:
                        pass
                        
                # Add page break between images (except for last image)
                if i < len(images):
                    story.append(PageBreak())
                    
            except Exception as e:
                logging.error(f"Error adding image {image_path} to PDF: {str(e)}")
                story.append(Paragraph(f"Error loading image {i}", styles['Normal']))
        
        # Build PDF
        doc.build(story)
        return True
        
    except Exception as e:
        logging.error(f"Error creating PDF: {str(e)}")
        return False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_files():
    try:
        # Debug logging
        logging.debug(f"Form data received: {dict(request.form)}")
        logging.debug(f"Files received: {list(request.files.keys())}")
        
        case_title = request.form.get('case_title', '').strip()
        notes = request.form.get('notes', '').strip()
        
        logging.debug(f"Case title after processing: '{case_title}'")
        logging.debug(f"Case title length: {len(case_title)}")
        
        if not case_title:
            flash('Please provide a case title.', 'error')
            return redirect(url_for('index'))
        
        # Check if files were uploaded
        if 'images' not in request.files:
            flash('No files selected.', 'error')
            return redirect(url_for('index'))
        
        files = request.files.getlist('images')
        
        if not files or all(f.filename == '' for f in files):
            flash('No files selected.', 'error')
            return redirect(url_for('index'))
        
        # Validate and save uploaded files
        uploaded_files = []
        for file in files:
            if file and file.filename and file.filename != '' and allowed_file(file.filename):
                # Generate unique filename
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                
                try:
                    file.save(file_path)
                    uploaded_files.append(file_path)
                except Exception as e:
                    logging.error(f"Error saving file {filename}: {str(e)}")
                    flash(f'Error saving file {filename}.', 'error')
        
        if not uploaded_files:
            flash('No valid image files were uploaded.', 'error')
            return redirect(url_for('index'))
        
        # Generate PDF
        pdf_filename = f"slides_{uuid.uuid4()}.pdf"
        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], pdf_filename)
        
        if create_pdf(uploaded_files, case_title, notes, pdf_path):
            # Clean up uploaded image files
            for file_path in uploaded_files:
                try:
                    os.unlink(file_path)
                except:
                    pass
            
            return send_file(pdf_path, as_attachment=True, 
                           download_name=f"{case_title}_slides.pdf",
                           mimetype='application/pdf')
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
