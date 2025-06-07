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
        You are a dental AI assistant. Categorize the input image into one of the following classes. Use facial orientation, expression, and intraoral visibility to determine the correct category. Only choose one label.

        Categories:
        1. Extraoral_frontal_view — Full face from the front, not smiling.
        2. Extraoral_right_view — Full face from the right side, not smiling.
        3. Extraoral_smiling_view — Full face from the front, smiling.
        4. Extraoral_teeth_smile_view — Close-up of mouth/teeth while smiling (no full face).
        5. Intraoral_frontal_view — Teeth from the front inside the mouth.
        6. Intraoral_right_view — Right-side teeth view (no mirror used).
        7. Intraoral_left_view — Left-side teeth view (no mirror used).
        8. Intraoral_upper_occlusal_view — Occlusal (biting surface) view of the upper teeth (maxilla).
        9. Intraoral_lower_occlusal_view — Occlusal (biting surface) view of the lower teeth (mandible).

        Carefully analyze the image and assign the most accurate label from the list above.

        Respond with JSON in this exact format:
        {
            "classification": "extraoral_frontal_view|extraoral_right_view|extraoral_smiling_view|extraoral_teeth_smile_view|intraoral_frontal_view|intraoral_right_view|intraoral_left_view|intraoral_upper_occlusal_view|intraoral_lower_occlusal_view",
            "confidence": 0.85,
            "reasoning": "Brief explanation of the view type and key visual features that led to this classification"
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