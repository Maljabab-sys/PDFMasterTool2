import os
import base64
import json
from openai import OpenAI
from PIL import Image
import io

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def encode_image_to_base64(image_path):
    """Convert image to base64 string for OpenAI API"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

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
        - INTRAORAL_LEFT: Intraoral view showing the patient's LEFT dental quadrant - the molars appear on the LEFT side of the image frame. Look for the larger posterior teeth (molars) positioned on the left side of the photo.
        - INTRAORAL_RIGHT: Intraoral view showing the patient's RIGHT dental quadrant - the molars appear on the RIGHT side of the image frame. Look for the larger posterior teeth (molars) positioned on the right side of the photo.
        - INTRAORAL_FRONT: Intraoral frontal view - direct view of front teeth from inside the mouth, showing anterior teeth
        - INTRAORAL_OCCLUSAL: Intraoral top-down or bottom-up view of the bite surface/occlusal plane, showing tooth surfaces
        - OTHER: Individual teeth, X-rays, instruments, or unclear views

        Important distinctions:
        - EXTRAORAL: Shows face/facial features in portrait orientation, taken from outside the mouth, usually showing full face or profile
        - INTRAORAL: Shows teeth/gums directly, taken from inside the mouth with dental instruments, closer view of oral structures
        - For LEFT/RIGHT intraoral classification: Use this simple rule - if the molars (large back teeth) are positioned on the LEFT side of the image, classify as INTRAORAL_LEFT. If molars are on the RIGHT side of the image, classify as INTRAORAL_RIGHT.
        - Extraoral photos are typically portrait orientation (taller than wide)
        - Molars are the larger, broader teeth typically visible in the back/posterior region of dental photos

        Respond with JSON in this exact format:
        {
            "classification": "extraoral_left|extraoral_right|extraoral_front|intraoral_left|intraoral_right|intraoral_front|intraoral_occlusal|other",
            "confidence": 0.85,
            "reasoning": "Brief explanation focusing on portrait/landscape orientation, intraoral vs extraoral, and anatomical side identification"
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
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=300
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
    
    for image_path in image_paths:
        if os.path.exists(image_path):
            result = classify_dental_image(image_path)
            result["image_path"] = image_path
            result["filename"] = os.path.basename(image_path)
            results.append(result)
        else:
            results.append({
                "success": False,
                "error": "File not found",
                "classification": "other",
                "confidence": 0.0,
                "reasoning": "Image file does not exist",
                "image_path": image_path,
                "filename": os.path.basename(image_path)
            })
    
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