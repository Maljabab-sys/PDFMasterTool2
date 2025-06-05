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
    
    page_width = pagesize[0] - 1*inch
    page_height = pagesize[1] - 2*inch
    
    for i, image_path in enumerate(images, 1):
        try:
            story.append(Paragraph(f"Slide {i}", heading_style))
            
            with Image.open(image_path) as img:
                img_width, img_height = img.size
                aspect_ratio = img_width / img_height
                
                if aspect_ratio > 1:  # Landscape
                    width = min(page_width * 0.8, 6 * inch)
                    height = width / aspect_ratio
                else:  # Portrait
                    height = min(page_height * 0.7, 5 * inch)
                    width = height * aspect_ratio
            
            img_obj = RLImage(image_path, width=width, height=height)
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
    
    page_width = pagesize[0] - 1*inch
    
    # Calculate grid dimensions
    if images_per_slide == 2:
        cols, rows = 2, 1
    elif images_per_slide == 4:
        cols, rows = 2, 2
    elif images_per_slide == 6:
        cols, rows = 3, 2
    else:
        cols, rows = 1, 1
    
    img_width = (page_width / cols) * 0.8
    img_height = img_width * 0.75  # 4:3 aspect ratio
    
    slide_num = 1
    for i in range(0, len(images), images_per_slide):
        slide_images = images[i:i + images_per_slide]
        
        story.append(Paragraph(f"Slide {slide_num}", heading_style))
        
        # Create grid of images
        table_data = []
        for row in range(rows):
            row_data = []
            for col in range(cols):
                idx = row * cols + col
                if idx < len(slide_images):
                    try:
                        img_obj = RLImage(slide_images[idx], width=img_width, height=img_height)
                        row_data.append(img_obj)
                    except:
                        row_data.append("")
                else:
                    row_data.append("")
            table_data.append(row_data)
        
        if table_data:
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(table)
        
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

def create_pdf(images, case_title, notes, output_path, template='classic', orientation='portrait', images_per_slide=1):
    """Create PDF slide deck from images and text"""
    try:
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
        
        # Add images based on template
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
        else:
            story.extend(create_classic_layout(images, heading_style, styles, pagesize))
        
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
        case_title = request.form.get('case_title', '').strip()
        notes = request.form.get('notes', '').strip()
        template = request.form.get('template', 'classic')
        orientation = request.form.get('orientation', 'portrait')
        images_per_slide = int(request.form.get('images_per_slide', '1'))
        
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
        
        if create_pdf(uploaded_files, case_title, notes, pdf_path, template, orientation, images_per_slide):
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
