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
        - LEFT VIEW: Patient's left side view - you can see the RIGHT side of their dental arch (patient's right molars/teeth visible from camera perspective)
        - RIGHT VIEW: Patient's right side view - you can see the LEFT side of their dental arch (patient's left molars/teeth visible from camera perspective)  
        - FRONT VIEW: Frontal view showing anterior teeth, both left and right sides visible, central incisors prominent
        - OCCLUSAL: Top-down or bottom-up view of the bite surface/occlusal plane
        - OTHER: Individual teeth, X-rays, instruments, or unclear views

        Important: Consider the patient's anatomical orientation, not the camera angle. If you see molars on one side, determine which side of the patient's mouth they belong to.

        Respond with JSON in this exact format:
        {
            "classification": "left|right|front|occlusal|other",
            "confidence": 0.85,
            "reasoning": "Brief explanation of classification focusing on visible anatomical landmarks"
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
        result = json.loads(response.choices[0].message.content)
        
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