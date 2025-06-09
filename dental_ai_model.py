import os
import json
import base64
import logging
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image
import io
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import pickle

class DentalImageClassifier:
    """
    Custom TensorFlow model for dental image classification
    Replaces OpenAI GPT-4o with specialized dental AI
    """
    
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path
        self.model = None
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        
        # Dental image categories
        self.categories = [
            'left_view', 'right_view', 'front_view',
            'upper_occlusal', 'lower_occlusal', 
            'extraoral', 'radiograph', 'other'
        ]
        
        # Fit label encoder
        self.label_encoder.fit(self.categories)
        
        # Model architecture parameters
        self.input_shape = (224, 224, 3)
        self.num_classes = len(self.categories)
        
        if model_path and os.path.exists(model_path):
            self.load_model()
        else:
            self.build_model()
    
    def build_model(self):
        """Build CNN model architecture for dental image classification"""
        # Use transfer learning with MobileNetV2 for efficiency
        base_model = keras.applications.MobileNetV2(
            weights='imagenet',
            include_top=False,
            input_shape=self.input_shape
        )
        
        # Freeze base model initially
        base_model.trainable = False
        
        # Add custom classification head
        model = keras.Sequential([
            base_model,
            keras.layers.GlobalAveragePooling2D(),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(128, activation='relu'),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(self.num_classes, activation='softmax')
        ])
        
        # Compile model
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.0001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        self.model = model
        logging.info("Built dental image classification model")
    
    def preprocess_image(self, image_data: bytes) -> np.ndarray:
        """Preprocess image for model input"""
        try:
            image = Image.open(io.BytesIO(image_data))
            
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize to model input size
            image = image.resize((224, 224), Image.Resampling.LANCZOS)
            
            # Convert to array and normalize
            image_array = np.array(image, dtype=np.float32)
            image_array = image_array / 255.0
            
            # Add batch dimension
            image_array = np.expand_dims(image_array, axis=0)
            
            return image_array
            
        except Exception as e:
            logging.error(f"Image preprocessing failed: {e}")
            raise
    
    def preprocess_image_from_path(self, image_path: str) -> np.ndarray:
        """Preprocess image from file path"""
        with open(image_path, 'rb') as f:
            image_data = f.read()
        return self.preprocess_image(image_data)
    
    def predict(self, image_array: np.ndarray) -> Dict[str, float]:
        """Make prediction using the model"""
        if not self.model:
            raise ValueError("Model not loaded")
        
        try:
            predictions = self.model.predict(image_array, verbose=0)
            probabilities = predictions[0]
            
            # Create probability dictionary
            result = {}
            for i, category in enumerate(self.categories):
                result[category] = float(probabilities[i])
            
            return result
            
        except Exception as e:
            logging.error(f"Model prediction failed: {e}")
            raise
    
    def classify_image(self, image_path: str) -> Dict[str, Any]:
        """Classify a single dental image"""
        try:
            image_array = self.preprocess_image_from_path(image_path)
            probabilities = self.predict(image_array)
            
            # Find best match
            best_category = max(probabilities.keys(), key=lambda k: probabilities[k])
            confidence = probabilities[best_category]
            
            # Map to user-friendly names
            category_names = {
                'left_view': 'Left View',
                'right_view': 'Right View', 
                'front_view': 'Front View',
                'upper_occlusal': 'Upper Occlusal',
                'lower_occlusal': 'Lower Occlusal',
                'extraoral': 'Extraoral',
                'radiograph': 'Radiograph',
                'other': 'Other'
            }
            
            return {
                'classification': best_category,
                'confidence': confidence,
                'probabilities': probabilities,
                'category_name': category_names.get(best_category, 'Unknown')
            }
            
        except Exception as e:
            logging.error(f"Image classification failed for {image_path}: {e}")
            return {
                'classification': 'other',
                'confidence': 0.1,
                'probabilities': {'other': 1.0},
                'category_name': 'Other',
                'error': str(e)
            }
    
    def classify_bulk_images(self, image_paths: List[str]) -> List[Dict[str, Any]]:
        """Classify multiple images efficiently"""
        results = []
        
        try:
            # Batch preprocess images
            batch_images = []
            valid_paths = []
            
            for image_path in image_paths:
                try:
                    image_array = self.preprocess_image_from_path(image_path)
                    batch_images.append(image_array[0])  # Remove batch dimension
                    valid_paths.append(image_path)
                except Exception as e:
                    logging.warning(f"Failed to preprocess {image_path}: {e}")
                    results.append({
                        'image_path': image_path,
                        'classification': 'other',
                        'confidence': 0.0,
                        'error': str(e)
                    })
            
            if batch_images:
                # Batch predict
                batch_array = np.array(batch_images)
                predictions = self.model.predict(batch_array, verbose=0)
                
                # Process results
                for i, image_path in enumerate(valid_paths):
                    probabilities = {}
                    for j, category in enumerate(self.categories):
                        probabilities[category] = float(predictions[i][j])
                    
                    best_category = max(probabilities.keys(), key=lambda k: probabilities[k])
                    confidence = probabilities[best_category]
                    
                    results.append({
                        'image_path': image_path,
                        'classification': best_category,
                        'confidence': confidence,
                        'probabilities': probabilities
                    })
            
        except Exception as e:
            logging.error(f"Bulk classification failed: {e}")
            # Return individual results for remaining images
            for image_path in image_paths:
                if not any(r.get('image_path') == image_path for r in results):
                    results.append(self.classify_image(image_path))
        
        return results
    
    def load_training_data(self, data_path: str) -> Tuple[np.ndarray, np.ndarray]:
        """Load training data from organized directories"""
        images = []
        labels = []
        
        for category in self.categories:
            category_path = os.path.join(data_path, category)
            if not os.path.exists(category_path):
                continue
            
            for filename in os.listdir(category_path):
                if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                    image_path = os.path.join(category_path, filename)
                    try:
                        image_array = self.preprocess_image_from_path(image_path)
                        images.append(image_array[0])  # Remove batch dimension
                        labels.append(category)
                    except Exception as e:
                        logging.warning(f"Failed to load {image_path}: {e}")
        
        if not images:
            raise ValueError("No training images found")
        
        # Convert to arrays
        X = np.array(images)
        y = keras.utils.to_categorical(
            self.label_encoder.transform(labels),
            num_classes=self.num_classes
        )
        
        return X, y
    
    def train(self, data_path: str, epochs: int = 50, validation_split: float = 0.2):
        """Train the model on dental image data"""
        logging.info("Loading training data...")
        X, y = self.load_training_data(data_path)
        
        logging.info(f"Loaded {len(X)} training images")
        
        # Split data
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=validation_split, random_state=42, stratify=y
        )
        
        # Data augmentation
        datagen = keras.preprocessing.image.ImageDataGenerator(
            rotation_range=20,
            width_shift_range=0.1,
            height_shift_range=0.1,
            zoom_range=0.1,
            horizontal_flip=True,
            fill_mode='nearest'
        )
        
        # Callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
            keras.callbacks.ReduceLROnPlateau(factor=0.2, patience=5)
        ]
        
        # Train model
        logging.info("Starting training...")
        history = self.model.fit(
            datagen.flow(X_train, y_train, batch_size=32),
            steps_per_epoch=len(X_train) // 32,
            epochs=epochs,
            validation_data=(X_val, y_val),
            callbacks=callbacks,
            verbose=1
        )
        
        self.is_trained = True
        logging.info("Training completed")
        
        # Fine-tune with unfrozen base model
        if epochs > 20:
            logging.info("Fine-tuning with unfrozen base model...")
            self.model.layers[0].trainable = True
            
            # Lower learning rate for fine-tuning
            self.model.compile(
                optimizer=keras.optimizers.Adam(learning_rate=0.00001),
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )
            
            # Fine-tune for a few more epochs
            fine_tune_epochs = min(10, epochs // 5)
            self.model.fit(
                datagen.flow(X_train, y_train, batch_size=32),
                steps_per_epoch=len(X_train) // 32,
                epochs=fine_tune_epochs,
                validation_data=(X_val, y_val),
                verbose=1
            )
        
        return history
    
    def save_model(self, save_path: str):
        """Save the trained model"""
        if not self.model:
            raise ValueError("No model to save")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        # Save model
        self.model.save(save_path)
        
        # Save label encoder
        label_encoder_path = save_path.replace('.h5', '_labels.json')
        with open(label_encoder_path, 'w') as f:
            json.dump({
                'categories': self.categories,
                'label_encoder_classes': self.label_encoder.classes_.tolist()
            }, f)
        
        logging.info(f"Model saved to {save_path}")
    
    def load_model(self):
        """Load a saved model"""
        try:
            self.model = keras.models.load_model(self.model_path)
            
            # Load label encoder
            label_encoder_path = self.model_path.replace('.h5', '_labels.json')
            if os.path.exists(label_encoder_path):
                with open(label_encoder_path, 'r') as f:
                    label_data = json.load(f)
                    self.categories = label_data['categories']
                    self.label_encoder.classes_ = np.array(label_data['label_encoder_classes'])
            
            self.is_trained = True
            logging.info(f"Model loaded from {self.model_path}")
            
        except Exception as e:
            logging.error(f"Failed to load model: {e}")
            self.build_model()  # Fallback to new model
    
    def evaluate_model(self, test_data_path: str) -> Dict[str, float]:
        """Evaluate model performance on test data"""
        X_test, y_test = self.load_training_data(test_data_path)
        
        # Evaluate
        test_loss, test_accuracy = self.model.evaluate(X_test, y_test, verbose=0)
        
        # Detailed classification report
        y_pred = self.model.predict(X_test, verbose=0)
        y_pred_classes = np.argmax(y_pred, axis=1)
        y_true_classes = np.argmax(y_test, axis=1)
        
        from sklearn.metrics import classification_report, confusion_matrix
        
        report = classification_report(
            y_true_classes, y_pred_classes,
            target_names=self.categories,
            output_dict=True
        )
        
        return {
            'test_accuracy': test_accuracy,
            'test_loss': test_loss,
            'classification_report': report
        }


# Global instance for the application
dental_classifier = None

def initialize_dental_classifier(model_path: str = "models/dental_classifier.h5"):
    """Initialize the global dental classifier"""
    global dental_classifier
    dental_classifier = DentalImageClassifier(model_path)
    return dental_classifier

def get_dental_classifier():
    """Get the global dental classifier instance"""
    global dental_classifier
    if dental_classifier is None:
        dental_classifier = DentalImageClassifier()
    return dental_classifier

# Compatibility functions for existing code
def classify_dental_image(image_path: str) -> Dict[str, Any]:
    """Main function to replace OpenAI image classification"""
    classifier = get_dental_classifier()
    return classifier.classify_image(image_path)

def classify_bulk_images(image_paths: List[str]) -> List[Dict[str, Any]]:
    """Bulk classification function"""
    classifier = get_dental_classifier()
    return classifier.classify_bulk_images(image_paths)

def encode_image_to_base64(image_path: str, max_size: Tuple[int, int] = (512, 512)) -> str:
    """Encode image to base64 (compatibility function)"""
    try:
        with Image.open(image_path) as img:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            
            return base64.b64encode(buffer.getvalue()).decode('utf-8')
    except Exception as e:
        logging.error(f"Failed to encode image {image_path}: {e}")
        return ""

def validate_and_fix_duplicates(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Validate and fix classification results (compatibility function)"""
    # Simple validation - ensure each result has required fields
    validated_results = []
    
    for result in results:
        if not isinstance(result, dict):
            continue
        
        # Ensure required fields exist
        if 'classification' not in result:
            result['classification'] = 'other'
        if 'confidence' not in result:
            result['confidence'] = 0.0
        
        validated_results.append(result)
    
    return validated_results

def get_classification_summary(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Get summary of classification results (compatibility function)"""
    if not results:
        return {'total': 0, 'categories': {}}
    
    summary = {
        'total': len(results),
        'categories': {},
        'average_confidence': 0.0
    }
    
    total_confidence = 0.0
    for result in results:
        classification = result.get('classification', 'other')
        confidence = result.get('confidence', 0.0)
        
        if classification not in summary['categories']:
            summary['categories'][classification] = 0
        summary['categories'][classification] += 1
        
        total_confidence += confidence
    
    if len(results) > 0:
        summary['average_confidence'] = total_confidence / len(results)
    
    return summary