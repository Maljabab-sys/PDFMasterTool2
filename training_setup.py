import os
import shutil
import json
from datetime import datetime
from typing import Dict, List, Any
import logging

class TrainingDataManager:
    """
    Manages training data collection and organization for custom dental AI model
    """
    
    def __init__(self, base_path: str = "training_data"):
        self.base_path = base_path
        self.categories = {
            'intraoral_left': 'Intraoral Left',
            'intraoral_right': 'Intraoral Right',
            'intraoral_front': 'Intraoral Front',
            'upper_occlusal': 'Upper Occlusal',
            'lower_occlusal': 'Lower Occlusal',
            'extraoral_frontal': 'Extraoral Frontal',
            'extraoral_right': 'Extraoral Right',
            'extraoral_full_face_smile': 'Extraoral Full Face Smile',
            'extraoral_zoomed_smile': 'Extraoral Zoomed Smile'
        }
        self.setup_directories()
    
    def setup_directories(self):
        """Create directory structure for training data"""
        try:
            # Create base training directory
            os.makedirs(self.base_path, exist_ok=True)
            
            # Create category subdirectories
            for category in self.categories.keys():
                category_path = os.path.join(self.base_path, category)
                os.makedirs(category_path, exist_ok=True)
            
            # Create validation split
            validation_path = os.path.join(self.base_path, "validation")
            os.makedirs(validation_path, exist_ok=True)
            
            for category in self.categories.keys():
                val_category_path = os.path.join(validation_path, category)
                os.makedirs(val_category_path, exist_ok=True)
            
            logging.info(f"Training data directories created at {self.base_path}")
            
        except Exception as e:
            logging.error(f"Failed to create training directories: {e}")
    
    def add_training_image(self, image_path: str, category: str, correct_classification: bool = True):
        """
        Add an image to training data with its correct category
        
        Args:
            image_path: Path to the source image
            category: Correct category for the image
            correct_classification: Whether this was correctly classified by current model
        """
        if category not in self.categories:
            logging.warning(f"Unknown category: {category}")
            category = 'other'
        
        try:
            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            original_name = os.path.basename(image_path)
            name, ext = os.path.splitext(original_name)
            new_filename = f"{timestamp}_{name}{ext}"
            
            # Destination path
            dest_path = os.path.join(self.base_path, category, new_filename)
            
            # Copy image to training directory
            shutil.copy2(image_path, dest_path)
            
            # Log the addition
            self._log_training_addition(dest_path, category, correct_classification)
            
            logging.info(f"Added training image: {new_filename} -> {category}")
            
        except Exception as e:
            logging.error(f"Failed to add training image: {e}")
    
    def remove_training_image(self, image_path: str):
        """
        Remove an image from training data
        
        Args:
            image_path: Path to the image to remove
        """
        filename = os.path.basename(image_path)
        
        # Search for the image in all category directories
        for category in self.categories:
            category_dir = os.path.join(self.base_path, category)
            training_image_path = os.path.join(category_dir, filename)
            
            if os.path.exists(training_image_path):
                os.remove(training_image_path)
                logging.info(f"Removed training image: {training_image_path}")
                break
    
    def _log_training_addition(self, image_path: str, category: str, correct: bool):
        """Log training data additions for tracking"""
        log_file = os.path.join(self.base_path, "training_log.json")
        
        entry = {
            'timestamp': datetime.now().isoformat(),
            'image_path': image_path,
            'category': category,
            'correctly_classified': correct
        }
        
        # Load existing log or create new
        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                log_data = json.load(f)
        else:
            log_data = {'entries': []}
        
        log_data['entries'].append(entry)
        
        with open(log_file, 'w') as f:
            json.dump(log_data, f, indent=2)
    
    def get_training_stats(self) -> Dict[str, Any]:
        """Get statistics about current training data"""
        stats = {
            'categories': {},
            'total_images': 0,
            'validation_split': 0.2
        }
        
        for category in self.categories.keys():
            category_path = os.path.join(self.base_path, category)
            if os.path.exists(category_path):
                image_count = len([f for f in os.listdir(category_path) 
                                 if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
                stats['categories'][category] = image_count
                stats['total_images'] += image_count
        
        return stats
    
    def export_training_config(self) -> str:
        """Export training configuration for model training"""
        config = {
            'data_path': self.base_path,
            'categories': self.categories,
            'image_size': (224, 224),
            'batch_size': 32,
            'epochs': 50,
            'validation_split': 0.2,
            'augmentation': {
                'rotation_range': 20,
                'width_shift_range': 0.1,
                'height_shift_range': 0.1,
                'zoom_range': 0.1,
                'horizontal_flip': True
            }
        }
        
        config_path = os.path.join(self.base_path, "training_config.json")
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        return config_path


def collect_existing_images_for_training(uploads_dir: str = "uploads"):
    """
    Collect existing uploaded images for training data
    This allows you to use images from actual cases for training
    """
    trainer = TrainingDataManager()
    
    if not os.path.exists(uploads_dir):
        logging.warning(f"Uploads directory not found: {uploads_dir}")
        return
    
    # Get all uploaded images
    image_files = []
    for root, dirs, files in os.walk(uploads_dir):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                image_files.append(os.path.join(root, file))
    
    print(f"Found {len(image_files)} images for potential training data")
    print("You can now manually categorize these images or use the web interface")
    
    return image_files


def create_labeling_interface():
    """
    Create a simple web interface for labeling training data
    This will be integrated into your existing Flask app
    """
    interface_code = '''
<!-- Add this to your Flask app for manual labeling -->
<div class="training-interface" style="display: none;">
    <h3>Label Training Data</h3>
    <div class="image-preview">
        <img id="labelingImage" src="" style="max-width: 400px; max-height: 400px;">
    </div>
    <div class="category-buttons">
        <button onclick="labelImage('left')" class="btn btn-primary">Left View</button>
        <button onclick="labelImage('right')" class="btn btn-primary">Right View</button>
        <button onclick="labelImage('front')" class="btn btn-primary">Front View</button>
        <button onclick="labelImage('upper_occlusal')" class="btn btn-primary">Upper Occlusal</button>
        <button onclick="labelImage('lower_occlusal')" class="btn btn-primary">Lower Occlusal</button>
        <button onclick="labelImage('extraoral')" class="btn btn-primary">Extraoral</button>
        <button onclick="labelImage('radiograph')" class="btn btn-primary">Radiograph</button>
        <button onclick="labelImage('other')" class="btn btn-secondary">Other</button>
    </div>
</div>

<script>
function labelImage(category) {
    const imagePath = document.getElementById('labelingImage').src;
    
    fetch('/label_training_image', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            image_path: imagePath,
            category: category
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Image labeled:', data);
        loadNextImage();
    });
}
</script>
'''
    
    return interface_code


if __name__ == "__main__":
    # Initialize training data management
    trainer = TrainingDataManager()
    
    # Collect existing images
    existing_images = collect_existing_images_for_training()
    
    # Show stats
    stats = trainer.get_training_stats()
    print(f"Training data statistics: {stats}")
    
    # Export configuration
    config_path = trainer.export_training_config()
    print(f"Training configuration saved to: {config_path}")