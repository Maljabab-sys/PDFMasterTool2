# dental_ai_model.py - Compatibility redirect to AI_System
# This file redirects imports to the consolidated AI_System structure

# Import everything from the consolidated AI system
from AI_System.scripts.dental_ai_model import *

# Import additional functions from other AI scripts for compatibility
try:
    from AI_System.scripts.image_classifier import classify_bulk_images as img_classify_bulk, get_classification_summary as img_get_summary
    # Re-export image classifier functions for compatibility
    classify_bulk_images = img_classify_bulk
    get_classification_summary = img_get_summary
except ImportError:
    # Fallback implementations if image_classifier not available
    def classify_bulk_images(image_paths):
        return []
    
    def get_classification_summary(results):
        return {"total": 0, "categories": {}}

# Maintain backward compatibility for existing imports
from AI_System.scripts.dental_ai_model import (
    get_dental_classifier,
    initialize_dental_classifier,
    classify_dental_image,
    encode_image_to_base64,
    validate_and_fix_duplicates,
    FallbackDentalClassifier,
    PYTORCH_AVAILABLE
)

# For anyone importing the class directly
try:
    from AI_System.scripts.dental_ai_model import PyTorchDentalClassifier
except ImportError:
    pass 