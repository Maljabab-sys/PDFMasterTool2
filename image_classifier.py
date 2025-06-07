import os
import base64
import json
from openai import OpenAI
from PIL import Image
import io

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

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
    Classify dental image as left, right, front, or other view
    Returns: dict with classification and confidence
    """
    try:
        # Encode image to base64
        base64_image = encode_image_to_base64(image_path)
        
        # Create prompt for dental image classification
        prompt = """
        Analyze this dental/orthodontic image and classify the view type. Pay careful attention to perspective and anatomical orientation.

        Classification criteria:
        - EXTRAORAL_LEFT: Patient's left side profile view (extraoral) - portrait orientation showing patient's left facial profile and smile from the side
        - EXTRAORAL_RIGHT: Patient's right side profile view (extraoral) - portrait orientation showing patient's right facial profile and smile from the side  
        - EXTRAORAL_FRONT: Frontal facial view (extraoral) - portrait orientation showing patient's face from front, both sides visible, full smile or lips closed
        - INTRAORAL_LEFT: Intraoral view of patient's LEFT side - molars appear on the LEFT side of the image (not mirrored)
        - INTRAORAL_RIGHT: Intraoral view of patient's RIGHT side - molars appear on the RIGHT side of the image (not mirrored)
        - INTRAORAL_FRONT: Intraoral frontal view - direct view of front teeth from inside the mouth, showing anterior teeth
        - INTRAORAL_OCCLUSAL: Intraoral top-down or bottom-up view of the bite surface/occlusal plane, showing tooth surfaces
        - OTHER: Individual teeth, X-rays, instruments, or unclear views

        Important distinctions:
        - EXTRAORAL: Shows face/facial features in portrait orientation, taken from outside the mouth, usually showing full face or profile
        - INTRAORAL: Shows teeth/gums directly, taken from inside the mouth with dental instruments, closer view of oral structures
        - CRITICAL RULE FOR LEFT/RIGHT: Intraoral photos are NOT mirrored - they show the actual anatomical view
          * If molars (large back teeth) appear on the LEFT side of the image = INTRAORAL_LEFT
          * If molars (large back teeth) appear on the RIGHT side of the image = INTRAORAL_RIGHT
        - Molars are large, broad back teeth; Incisors are small, narrow front teeth
        - Only classify ONE image as left and ONE as right per batch
        - Extraoral photos are portrait orientation (taller than wide)
        - Focus on direct molar positioning in the image frame (not mirrored)

        Respond with JSON in this exact format:
        {
            "classification": "extraoral_left|extraoral_right|extraoral_front|intraoral_left|intraoral_right|intraoral_front|intraoral_occlusal|other",
            "confidence": 0.85,
            "reasoning": "Brief explanation focusing on direct molar positioning in image frame (not mirrored), portrait/landscape orientation, and intraoral vs extraoral distinction"
        }
        """

        response = client.chat.completions.create(
            model="gpt-4o",  # Latest vision model
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                                "detail": "low"  # Use low detail for faster processing
                            }
                        }
                    ]
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=150,  # Reduced for faster response
            temperature=0.1  # Lower temperature for more consistent results
        )

        # Parse the response
        response_content = response.choices[0].message.content
        if not response_content:
            raise Exception("Empty response from OpenAI")
        result = json.loads(response_content)
        
        return {
            "success": True,
            "classification": result.get("classification", "other").lower(),
            "confidence": float(result.get("confidence", 0.5)),
            "reasoning": result.get("reasoning", ""),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "classification": "other",
            "confidence": 0.0,
            "reasoning": f"Error during classification: {str(e)}"
        }

def classify_bulk_images(image_paths):
    """
    Classify multiple images at once
    Returns: list of classification results
    """
    results = []
    
    import concurrent.futures
    
    def classify_single_image(image_path):
        if os.path.exists(image_path):
            result = classify_dental_image(image_path)
            result["image_path"] = image_path
            result["filename"] = os.path.basename(image_path)
            return result
        else:
            return {
                "success": False,
                "error": "File not found",
                "classification": "other",
                "confidence": 0.0,
                "reasoning": "Image file does not exist",
                "image_path": image_path,
                "filename": os.path.basename(image_path)
            }
    
    # Use ThreadPoolExecutor for parallel processing (limited to 2 threads to avoid rate limits)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        future_to_path = {executor.submit(classify_single_image, path): path for path in image_paths}
        
        for future in concurrent.futures.as_completed(future_to_path):
            result = future.result()
            results.append(result)
    
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