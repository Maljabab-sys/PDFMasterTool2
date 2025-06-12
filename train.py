#!/usr/bin/env python3
import os
import logging
from dental_ai_model import get_dental_classifier, initialize_dental_classifier
from training_setup import TrainingDataManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def main():
    """Main training function using PyTorch model"""
    try:
        logging.info("=== Starting PyTorch Dental AI Training ===")

        # Initialize training data manager
        trainer = TrainingDataManager()

        # Get training statistics
        stats = trainer.get_training_stats()
        logging.info("=== Training Data Statistics ===")
        logging.info(f"Total images: {stats['total_images']}")

        for category, count in stats['category_counts'].items():
            logging.info(f"  {category}: {count} images")

        if stats['total_images'] < 10:
            logging.warning("Very few training images available. Consider adding more data.")

        # Initialize PyTorch classifier
        classifier = initialize_dental_classifier()

        # Check if model already exists and is trained
        if classifier.is_trained:
            logging.info("Model is already trained. Retraining...")

        # Train the model using data from modelmhanna/data directory
        data_path = "modelmhanna/data"
        if os.path.exists(data_path):
            logging.info(f"Training using data from {data_path}")
            results = classifier.train(data_path)

            logging.info("=== Training Results ===")
            logging.info(f"Training accuracy: {results['train_accuracy']:.3f}")
            logging.info(f"Validation accuracy: {results['val_accuracy']:.3f}")

            if results['train_accuracy'] > 0.8:
                logging.info("✅ Training successful! Model is ready for use.")
            else:
                logging.warning("⚠️ Training accuracy is low. Consider adding more data or adjusting parameters.")
        else:
            logging.error(f"Training data directory not found: {data_path}")
            return False

        # Test the trained model
        test_model()

        return True

    except Exception as e:
        logging.error(f"Training failed: {e}")
        return False

def test_model(image_path=None):
    """Test the trained PyTorch model"""
    try:
        logging.info("=== Testing PyTorch Dental AI Model ===")

        # Load the trained model
        classifier = get_dental_classifier()

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
            data_path = "modelmhanna/data"
            test_count = 0

            for category in classifier.categories:
                category_path = os.path.join(data_path, category)
                if os.path.exists(category_path):
                    images = [f for f in os.listdir(category_path) 
                             if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

                    if images and test_count < 3:  # Test max 3 images
                        test_image = os.path.join(category_path, images[0])
                        logging.info(f"\nTesting image from {category}:")

                        result = classifier.classify_image(test_image)
                        correct = result['classification'] == category

                        logging.info(f"  Expected: {category}")
                        logging.info(f"  Predicted: {result['classification']}")
                        logging.info(f"  Confidence: {result['confidence']:.3f}")
                        logging.info(f"  Correct: {'✅' if correct else '❌'}")

                        test_count += 1

        logging.info("=== Model Testing Complete ===")
        return True

    except Exception as e:
        logging.error(f"Model testing failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        logging.info("Training script completed successfully!")
    else:
        logging.error("Training script failed!")