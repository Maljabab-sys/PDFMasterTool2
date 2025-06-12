
#!/usr/bin/env python3
"""
Dedicated training script for the dental AI model
This script handles model training, evaluation, and saving
"""

import os
import sys
import logging
import argparse
from datetime import datetime
from dental_ai_model import DentalImageClassifier, initialize_dental_classifier
from training_setup import TrainingDataManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

def check_training_data():
    """Check available training data"""
    trainer = TrainingDataManager()
    stats = trainer.get_training_stats()
    
    logging.info("=== Training Data Statistics ===")
    logging.info(f"Total images: {stats['total_images']}")
    
    for category, count in stats['categories'].items():
        logging.info(f"  {category}: {count} images")
    
    if stats['total_images'] < 20:
        logging.warning(f"Only {stats['total_images']} training images available. Recommend at least 20 for good training.")
        return False
    
    # Check if each category has at least 1 image
    empty_categories = [cat for cat, count in stats['categories'].items() if count == 0]
    if empty_categories:
        logging.warning(f"Categories with no images: {empty_categories}")
    
    return True

def train_model(force_retrain=False, save_path="models/dental_classifier.pkl"):
    """Train the dental AI model"""
    try:
        logging.info("=== Starting Dental AI Model Training ===")
        
        # Check training data
        if not check_training_data():
            logging.error("Insufficient training data. Please add more images.")
            return False
        
        # Initialize classifier
        classifier = DentalImageClassifier()
        
        # Check if model exists and is trained
        if os.path.exists(save_path) and not force_retrain:
            try:
                classifier.load_model()
                if classifier.is_trained:
                    logging.info("Model already trained. Use --force to retrain.")
                    return True
            except Exception as e:
                logging.warning(f"Failed to load existing model: {e}. Training new model.")
        
        # Train the model
        trainer = TrainingDataManager()
        logging.info("Starting model training...")
        
        results = classifier.train(trainer.base_path, validation_split=0.2)
        
        # Log training results
        train_acc = results.get('train_accuracy', 0)
        val_acc = results.get('val_accuracy', 0)
        
        logging.info(f"Training completed successfully!")
        logging.info(f"Training accuracy: {train_acc:.3f}")
        logging.info(f"Validation accuracy: {val_acc:.3f}")
        
        # Save the model
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        classifier.save_model(save_path)
        logging.info(f"Model saved to: {save_path}")
        
        # Update classifier status
        classifier.is_trained = True
        classifier.last_train_accuracy = train_acc
        classifier.last_val_accuracy = val_acc
        classifier.last_training_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        return True
        
    except Exception as e:
        logging.error(f"Training failed: {e}")
        return False

def test_model(image_path=None):
    """Test the trained model"""
    try:
        logging.info("=== Testing Dental AI Model ===")
        
        # Load the trained model
        classifier = initialize_dental_classifier()
        
        if not classifier.is_trained:
            logging.error("Model is not trained. Please train the model first.")
            return False
        
        if image_path and os.path.exists(image_path):
            # Test on specific image
            logging.info(f"Testing on image: {image_path}")
            result = classifier.classify_image(image_path)
            
            logging.info(f"Classification: {result['classification']}")
            logging.info(f"Confidence: {result['confidence']:.3f}")
            logging.info(f"Category: {result['category_name']}")
            
        else:
            # Test on sample images from training data
            trainer = TrainingDataManager()
            stats = trainer.get_training_stats()
            
            test_count = 0
            for category in classifier.categories:
                category_path = os.path.join(trainer.base_path, category)
                if os.path.exists(category_path):
                    images = [f for f in os.listdir(category_path) 
                             if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                    
                    if images and test_count < 3:  # Test max 3 images
                        test_image = os.path.join(category_path, images[0])
                        result = classifier.classify_image(test_image)
                        
                        logging.info(f"Test image: {images[0]}")
                        logging.info(f"  Expected: {category}")
                        logging.info(f"  Predicted: {result['classification']}")
                        logging.info(f"  Confidence: {result['confidence']:.3f}")
                        logging.info(f"  Correct: {result['classification'] == category}")
                        logging.info("")
                        
                        test_count += 1
        
        return True
        
    except Exception as e:
        logging.error(f"Testing failed: {e}")
        return False

def main():
    """Main training script"""
    parser = argparse.ArgumentParser(description='Train the Dental AI Model')
    parser.add_argument('--force', action='store_true', 
                       help='Force retrain even if model exists')
    parser.add_argument('--test', action='store_true',
                       help='Test the trained model')
    parser.add_argument('--test-image', type=str,
                       help='Test on specific image path')
    parser.add_argument('--check-data', action='store_true',
                       help='Only check training data statistics')
    parser.add_argument('--model-path', type=str, 
                       default='models/dental_classifier.pkl',
                       help='Path to save/load the model')
    
    args = parser.parse_args()
    
    if args.check_data:
        check_training_data()
        return
    
    if args.test or args.test_image:
        success = test_model(args.test_image)
        sys.exit(0 if success else 1)
    
    # Train the model
    success = train_model(force_retrain=args.force, save_path=args.model_path)
    
    if success:
        logging.info("=== Training Complete ===")
        logging.info("You can now test the model with: python train.py --test")
    else:
        logging.error("Training failed. Check the logs above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
