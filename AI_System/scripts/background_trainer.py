import threading
import time
import logging
import os
from datetime import datetime, timedelta

class BackgroundAITrainer:
    """
    Background service for automatic AI model training
    """
    
    def __init__(self, check_interval=300):  # Check every 5 minutes
        self.check_interval = check_interval
        self.last_training = None
        self.training_in_progress = False
        self.thread = None
        self.running = False
    
    def start(self):
        """Start the background training service"""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._training_loop, daemon=True)
            self.thread.start()
            logging.info("Background AI trainer started")
    
    def stop(self):
        """Stop the background training service"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=10)
        logging.info("Background AI trainer stopped")
    
    def _training_loop(self):
        """Main training loop that runs in background"""
        while self.running:
            try:
                self._check_and_train()
                time.sleep(self.check_interval)
            except Exception as e:
                logging.error(f"Background training error: {e}")
                time.sleep(60)  # Wait 1 minute on error
    
    def _check_and_train(self):
        """Check if training is needed and train if necessary"""
        if self.training_in_progress:
            return
        
        try:
            from .training_setup import TrainingDataManager
            from dental_ai_model import get_dental_classifier
            
            trainer = TrainingDataManager()
            stats = trainer.get_training_stats()
            classifier = get_dental_classifier()
            
            # Check if we should train
            should_train = False
            
            # Train if we have enough new data and haven't trained recently
            if stats['total_images'] >= 20:
                if not classifier.is_trained:
                    should_train = True
                    reason = "Model not trained yet"
                elif self.last_training is None:
                    should_train = True  
                    reason = "No previous training recorded"
                elif stats['total_images'] % 25 == 0:  # Retrain every 25 images
                    should_train = True
                    reason = f"Periodic retraining at {stats['total_images']} images"
            
            if should_train:
                logging.info(f"Background training triggered: {reason}")
                self._train_model(trainer, classifier)
            
        except Exception as e:
            logging.error(f"Background training check failed: {e}")
    
    def _train_model(self, trainer, classifier):
        """Actually train the model"""
        try:
            self.training_in_progress = True
            
            logging.info("Starting background model training...")
            
            # Train the model
            results = classifier.train(trainer.base_path)
            
            # Save the trained model
            model_save_path = "models/dental_classifier.pkl"
            os.makedirs("models", exist_ok=True)
            classifier.save_model(model_save_path)
            
            self.last_training = datetime.now()
            
            logging.info(f"Background training completed successfully. "
                        f"Train accuracy: {results.get('train_accuracy', 0):.3f}, "
                        f"Val accuracy: {results.get('val_accuracy', 0):.3f}")
            
        except Exception as e:
            logging.error(f"Background model training failed: {e}")
        finally:
            self.training_in_progress = False

# Global background trainer instance
background_trainer = BackgroundAITrainer()

def start_background_training():
    """Start the background training service"""
    background_trainer.start()

def stop_background_training():
    """Stop the background training service"""
    background_trainer.stop()
