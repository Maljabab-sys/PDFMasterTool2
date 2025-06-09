import os
import base64
import json
import logging
from PIL import Image
import io

# Import our custom dental AI model instead of OpenAI
try:
    from dental_ai_model import get_dental_classifier, classify_dental_image as custom_classify_image, classify_bulk_images as custom_classify_bulk
    USE_CUSTOM_AI = True
    logging.info("Using custom dental AI model")
except ImportError:
    # Fallback to OpenAI if custom model not available
    from openai import OpenAI
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    USE_CUSTOM_AI = False
    logging.info("Using OpenAI model as fallback")

def encode_image_to_base64(image_path, max_size=(512, 512)):
    """Convert image to base64 string for OpenAI API with optimization"""
    from PIL import Image
    import io
    
    # Open and resize image for faster processing
    with Image.open(image_path) as img:
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to smaller size for faster processing
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save to bytes
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG', quality=70, optimize=True)
        img_byte_arr = img_byte_arr.getvalue()
        
        return base64.b64encode(img_byte_arr).decode('utf-8')

def classify_dental_image(image_path):
    """
    Classify dental image using custom AI model or OpenAI fallback
    Returns: dict with classification and confidence
    """
    try:
        if USE_CUSTOM_AI:
            # Use our custom dental AI model
            result = custom_classify_image(image_path)
            
            # Map custom model categories to expected format
            category_mapping = {
                'left_view': 'left',
                'right_view': 'right', 
                'front_view': 'front',
                'upper_occlusal': 'upper_occlusal',
                'lower_occlusal': 'lower_occlusal',
                'extraoral': 'extraoral',
                'radiograph': 'radiograph',
                'other': 'other'
            }
            
            mapped_classification = category_mapping.get(result['classification'], 'other')
            
            return {
                'classification': mapped_classification,
                'confidence': result['confidence'],
                'probabilities': result.get('probabilities', {}),
                'category_name': result.get('category_name', 'Unknown')
            }
        else:
            # Fallback to OpenAI
            base64_image = encode_image_to_base64(image_path)
            
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a dental image classification expert. Analyze dental images and classify them into one of these categories:
                        
                        - left: Left side view of teeth/mouth
                        - right: Right side view of teeth/mouth  
                        - front: Front view of teeth/mouth
                        - upper_occlusal: Upper jaw occlusal view (looking down at upper teeth)
                        - lower_occlusal: Lower jaw occlusal view (looking up at lower teeth)
                        - extraoral: External view of face/mouth
                        - radiograph: X-ray images
                        - other: Any other type of dental image
                        
                        Respond with JSON in this exact format:
                        {"classification": "category_name", "confidence": 0.95}"""
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Please classify this dental image and provide your confidence level."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                response_format={"type": "json_object"},
                max_tokens=150
            )

            # Parse the OpenAI response
            response_content = response.choices[0].message.content
            if not response_content:
                raise Exception("Empty response from OpenAI")
            result = json.loads(response_content)
            
            # Validate result format
            if 'classification' not in result or 'confidence' not in result:
                return {
                    'classification': 'other',
                    'confidence': 0.1,
                    'error': 'Invalid response format'
                }
            
            return {
                'classification': result.get('classification', 'other'),
                'confidence': result.get('confidence', 0.1),
                'probabilities': {},
                'category_name': result.get('classification', 'Other').title()
            }

    except Exception as e:
        print(f"Error classifying image {image_path}: {str(e)}")
        return {
            'classification': 'other',
            'confidence': 0.1,
            'error': str(e)
        }

def classify_bulk_images(image_paths):
    """
    Classify multiple images at once using custom AI model
    Returns: list of classification results
    """
    try:
        if USE_CUSTOM_AI:
            # Use our custom dental AI model for bulk classification
            results = custom_classify_bulk(image_paths)
            
            # Map custom model categories to expected format
            category_mapping = {
                'left_view': 'left',
                'right_view': 'right', 
                'front_view': 'front',
                'upper_occlusal': 'upper_occlusal',
                'lower_occlusal': 'lower_occlusal',
                'extraoral': 'extraoral',
                'radiograph': 'radiograph',
                'other': 'other'
            }
            
            # Map results to expected format
            mapped_results = []
            for result in results:
                mapped_classification = category_mapping.get(result['classification'], 'other')
                mapped_results.append({
                    'classification': mapped_classification,
                    'confidence': result['confidence'],
                    'image_path': result.get('image_path', ''),
                    'filename': os.path.basename(result.get('image_path', ''))
                })
            
            return mapped_results
        else:
            # Fallback to individual OpenAI classifications
            results = []
            for image_path in image_paths:
                if os.path.exists(image_path):
                    result = classify_dental_image(image_path)
                    result["image_path"] = image_path
                    result["filename"] = os.path.basename(image_path)
                    results.append(result)
                else:
                    results.append({
                        "classification": "other",
                        "confidence": 0.0,
                        "error": "File not found",
                        "image_path": image_path,
                        "filename": os.path.basename(image_path)
                    })
            return results
            
    except Exception as e:
        print(f"Error in bulk classification: {str(e)}")
        # Return error results for all images
        return [
            {
                "classification": "other",
                "confidence": 0.0,
                "error": str(e),
                "image_path": path,
                "filename": os.path.basename(path)
            }
            for path in image_paths
        ]
    
    # Sort results to maintain original order
    results.sort(key=lambda x: image_paths.index(x["image_path"]))
    
    # Validate and fix duplicate classifications
    results = validate_and_fix_duplicates(results)
    return results

def validate_and_fix_duplicates(results):
    """
    Validate classifications and fix duplicate left/right issues
    """
    # Count classifications
    classification_counts = {}
    for result in results:
        if result['success']:
            classification = result['classification']
            classification_counts[classification] = classification_counts.get(classification, 0) + 1
    
    # Check for duplicates in left/right intraoral
    intraoral_left_count = classification_counts.get('intraoral_left', 0)
    intraoral_right_count = classification_counts.get('intraoral_right', 0)
    
    # If we have duplicates, re-examine and fix
    if intraoral_left_count > 1 or intraoral_right_count > 1:
        # Find intraoral left/right results
        intraoral_lr_results = []
        for i, result in enumerate(results):
            if result['success'] and result['classification'] in ['intraoral_left', 'intraoral_right']:
                intraoral_lr_results.append((i, result))
        
        # If we have exactly 2 intraoral L/R images and they're both classified the same
        if len(intraoral_lr_results) == 2 and intraoral_lr_results[0][1]['classification'] == intraoral_lr_results[1][1]['classification']:
            # Fix by making the one with lower confidence the opposite side
            idx1, result1 = intraoral_lr_results[0]
            idx2, result2 = intraoral_lr_results[1]
            
            if result1['confidence'] < result2['confidence']:
                # Change the lower confidence one to opposite
                original_class = result1['classification']
                results[idx1]['classification'] = 'intraoral_right' if original_class == 'intraoral_left' else 'intraoral_left'
                results[idx1]['reasoning'] = f"Auto-corrected to avoid duplicate {original_class}. {result1['reasoning']}"
                results[idx1]['confidence'] = max(0.6, result1['confidence'] - 0.1)
            else:
                # Change the lower confidence one to opposite
                original_class = result2['classification']
                results[idx2]['classification'] = 'intraoral_right' if original_class == 'intraoral_left' else 'intraoral_left'
                results[idx2]['reasoning'] = f"Auto-corrected to avoid duplicate {original_class}. {result2['reasoning']}"
                results[idx2]['confidence'] = max(0.6, result2['confidence'] - 0.1)
    
    return results

def get_classification_summary(results):
    """
    Get summary of classification results
    """
    summary = {
        "total": len(results),
        "successful": len([r for r in results if r["success"]]),
        "failed": len([r for r in results if not r["success"]]),
        "categories": {
            "left": len([r for r in results if r["classification"] == "left"]),
            "right": len([r for r in results if r["classification"] == "right"]),
            "front": len([r for r in results if r["classification"] == "front"]),
            "occlusal": len([r for r in results if r["classification"] == "occlusal"]),
            "other": len([r for r in results if r["classification"] == "other"])
        }
    }
    
    return summary