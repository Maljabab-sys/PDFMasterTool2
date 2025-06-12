import base64
import json
import logging
import os
from io import BytesIO
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)

def encode_image_to_base64(image_path, max_size=(512, 512)):
    """Convert image to base64 string for API with optimization"""
    try:
        # Open and resize image
        with Image.open(image_path) as img:
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize while maintaining aspect ratio
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save to bytes
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=85, optimize=True)
            buffer.seek(0)
            
            # Encode to base64
            img_bytes = buffer.getvalue()
            return base64.b64encode(img_bytes).decode('utf-8')
            
    except Exception as e:
        logging.error(f"Error encoding image {image_path}: {e}")
        # Fallback: read file directly and encode
        try:
            with open(image_path, 'rb') as img_file:
                return base64.b64encode(img_file.read()).decode('utf-8')
        except Exception as fallback_error:
            logging.error(f"Fallback encoding failed: {fallback_error}")
            return ""

def classify_dental_image(image_path):
    """
    Classify dental image using trained custom AI model
    Returns: dict with classification and confidence
    """
    try:
        # Use the trained dental AI model
        from dental_ai_model import get_dental_classifier
        classifier = get_dental_classifier()
        
        result = classifier.classify_image(image_path)
        
        # Map dental AI categories to New Case layout categories
        dental_to_layout = {
            'intraoral_left': 'intraoral_left_view',
            'intraoral_right': 'intraoral_right_view',
            'intraoral_front': 'intraoral_frontal_view',
            'upper_occlusal': 'intraoral_upper_occlusal_view',
            'lower_occlusal': 'intraoral_lower_occlusal_view',
            'extraoral_frontal': 'extraoral_frontal_view',
            'extraoral_right': 'extraoral_right_view',
            'extraoral_full_face_smile': 'extraoral_smiling_view',
            'extraoral_zoomed_smile': 'extraoral_smiling_view'
        }
        
        dental_category = result.get('classification', 'intraoral_front')
        layout_category = dental_to_layout.get(dental_category, 'other')
        
        return {
            'classification': layout_category,
            'confidence': result.get('confidence', 0.5),
            'probabilities': result.get('probabilities', {}),
            'category_name': result.get('category_name', 'Other'),
            'dental_category': dental_category
        }
        
    except Exception as e:
        logging.error(f"Error during AI classification: {e}")
        return {
            'classification': 'other',
            'confidence': 0.1,
            'category_name': 'Other'
        }


def classify_bulk_images(image_paths):
    """
    Classify multiple images at once using trained AI model
    Returns: list of classification results
    """
    try:
        from dental_ai_model import get_dental_classifier
        classifier = get_dental_classifier()
        
        results = []
        for image_path in image_paths:
            result = classify_dental_image(image_path)
            result['image_path'] = image_path
            results.append(result)
        
        return results
        
    except Exception as e:
        logging.error(f"Bulk classification failed: {e}")
        # Return default results for all images
        return [{
            'image_path': path,
            'classification': 'other',
            'confidence': 0.1,
            'category_name': 'Other'
        } for path in image_paths]


def validate_and_fix_duplicates(results):
    """
    Validate classifications and fix duplicate left/right issues
    """
    # Count classifications
    classification_counts = {}
    for result in results:
        classification = result.get('classification', 'other')
        classification_counts[classification] = classification_counts.get(classification, 0) + 1
    
    # If we have duplicates of left/right, adjust lower confidence ones
    if classification_counts.get('intraoral_left_view', 0) > 1:
        left_results = [r for r in results if r.get('classification') == 'intraoral_left_view']
        left_results.sort(key=lambda x: x.get('confidence', 0), reverse=True)
        # Keep highest confidence as left, change others to front
        for result in left_results[1:]:
            result['classification'] = 'intraoral_frontal_view'
            result['category_name'] = 'Intraoral Front'
    
    if classification_counts.get('intraoral_right_view', 0) > 1:
        right_results = [r for r in results if r.get('classification') == 'intraoral_right_view']
        right_results.sort(key=lambda x: x.get('confidence', 0), reverse=True)
        # Keep highest confidence as right, change others to front
        for result in right_results[1:]:
            result['classification'] = 'intraoral_frontal_view'
            result['category_name'] = 'Intraoral Front'
    
    return results


def get_classification_summary(results):
    """
    Get summary of classification results
    """
    if not results:
        return {'total': 0, 'categories': {}, 'avg_confidence': 0}
    
    categories = {}
    total_confidence = 0
    
    for result in results:
        classification = result.get('classification', 'other')
        confidence = result.get('confidence', 0)
        
        categories[classification] = categories.get(classification, 0) + 1
        total_confidence += confidence
    
    return {
        'total': len(results),
        'categories': categories,
        'avg_confidence': total_confidence / len(results) if results else 0
    }