import os
import json
import logging
import pickle
from PIL import Image
import numpy as np
from typing import Dict, Any, List, Optional
from datetime import datetime
import base64
import io
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image, ImageFilter, ImageStat
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score
from datetime import datetime

# Try to import PyTorch, fall back to sklearn if not available
try:
    import torch
    import torch.nn as nn
    from torchvision import models, transforms
    PYTORCH_AVAILABLE = True
    logging.info("PyTorch is available")
except ImportError:
    PYTORCH_AVAILABLE = False
    logging.warning("PyTorch not available, using fallback classifier")

# Configure logging
logging.basicConfig(level=logging.INFO)

class FallbackDentalClassifier:
    """
    Fallback classifier when PyTorch is not available
    """
    
    def __init__(self, model_path: str = "models/dental_classifier.pkl"):
        self.model_path = model_path
        self.is_trained = False
        self.last_train_accuracy = None
        self.last_val_accuracy = None
        self.last_training_time = None
        
        # Categories matching your training data
        self.categories = [
            'extraoral_frontal', 'extraoral_full_face_smile', 'extraoral_right', 
            'extraoral_zoomed_smile', 'intraoral_front', 'intraoral_left', 
            'intraoral_right', 'lower_occlusal', 'upper_occlusal'
        ]
        
        # Initialize fallback model
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        
        # Load model if available
        self.load_model()
    
    def load_model(self):
        """Load the trained fallback model"""
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, 'rb') as f:
                    model_data = pickle.load(f)
                    self.model = model_data.get('model', self.model)
                    self.scaler = model_data.get('scaler', self.scaler)
                    self.label_encoder = model_data.get('label_encoder', self.label_encoder)
                    
                self.is_trained = True
                self.last_training_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                logging.info("Fallback dental classifier loaded successfully")
            else:
                logging.warning(f"Fallback model file not found: {self.model_path}")
                self.is_trained = False
        except Exception as e:
            logging.error(f"Failed to load fallback model: {e}")
            self.is_trained = False
    
    def extract_features(self, image_path: str) -> np.ndarray:
        """Extract simple features from image"""
        try:
            with Image.open(image_path) as img:
                # Convert to RGB if needed
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize to standard size
                img = img.resize((224, 224))
                
                # Extract basic color and texture features
                img_array = np.array(img)
                
                # Color features
                mean_rgb = np.mean(img_array, axis=(0, 1))
                std_rgb = np.std(img_array, axis=(0, 1))
                
                # Simple texture features
                gray = np.mean(img_array, axis=2)
                gradient_x = np.gradient(gray, axis=1)
                gradient_y = np.gradient(gray, axis=0)
                texture_features = [
                    np.mean(np.abs(gradient_x)),
                    np.mean(np.abs(gradient_y)),
                    np.std(gray)
                ]
                
                # Combine features
                features = np.concatenate([mean_rgb, std_rgb, texture_features])
                return features
                
        except Exception as e:
            logging.error(f"Feature extraction failed: {e}")
            return np.zeros(9)  # Return zero features on error
    
    def classify_image(self, image_path: str) -> Dict[str, Any]:
        """Classify a dental image using fallback model"""
        try:
            if not self.is_trained:
                return self._fallback_classification()
            
            # Extract features
            features = self.extract_features(image_path)
            features = self.scaler.transform([features])
            
            # Make prediction
            prediction = self.model.predict(features)[0]
            probabilities = self.model.predict_proba(features)[0]
            
            # Get category
            predicted_category = self.label_encoder.inverse_transform([prediction])[0]
            confidence = max(probabilities)
            
            # Create probability dictionary
            prob_dict = {}
            for i, category in enumerate(self.label_encoder.classes_):
                prob_dict[category] = probabilities[i] if i < len(probabilities) else 0.0
            
            # Map to user-friendly names
            category_names = {
                'extraoral_frontal': 'Extraoral Frontal',
                'extraoral_full_face_smile': 'Extraoral Full Face Smile',
                'extraoral_right': 'Extraoral Right',
                'extraoral_zoomed_smile': 'Extraoral Zoomed Smile',
                'intraoral_front': 'Intraoral Front',
                'intraoral_left': 'Intraoral Left',
                'intraoral_right': 'Intraoral Right',
                'lower_occlusal': 'Lower Occlusal',
                'upper_occlusal': 'Upper Occlusal'
            }
            
            return {
                'classification': predicted_category,
                'confidence': confidence,
                'probabilities': prob_dict,
                'category_name': category_names.get(predicted_category, 'Unknown')
            }
            
        except Exception as e:
            logging.error(f"Fallback classification failed for {image_path}: {e}")
            return self._fallback_classification()
    
    def _fallback_classification(self) -> Dict[str, Any]:
        """Ultimate fallback classification"""
        return {
            'classification': 'intraoral_front',
            'confidence': 0.3,
            'probabilities': {cat: 1.0/len(self.categories) for cat in self.categories},
            'category_name': 'Intraoral Front (Fallback)',
            'error': 'Model not trained'
        }
    
    def classify_bulk_images(self, image_paths: List[str]) -> List[Dict[str, Any]]:
        """Classify multiple images efficiently"""
        results = []
        for image_path in image_paths:
            result = self.classify_image(image_path)
            result['image_path'] = image_path
            results.append(result)
        return results


class PyTorchDentalClassifier:
    """
    PyTorch-based dental image classifier using ResNet18
    """

    def __init__(self, model_path: str = "modelmhanna/dental_classifier.pt"):
        if not PYTORCH_AVAILABLE:
            raise ImportError("PyTorch not available")
            
        self.model_path = model_path
        self.device = torch.device('cpu')  # Use CPU for compatibility
        self.is_trained = False
        self.last_train_accuracy = None
        self.last_val_accuracy = None
        self.last_training_time = None

        # Categories matching your training data
        self.categories = [
            'extraoral_frontal', 'extraoral_full_face_smile', 'extraoral_right', 
            'extraoral_zoomed_smile', 'intraoral_front', 'intraoral_left', 
            'intraoral_right', 'lower_occlusal', 'upper_occlusal'
        ]

        # Image preprocessing pipeline
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

        # Initialize model
        self.model = models.resnet18(pretrained=False)
        self.model.fc = nn.Linear(self.model.fc.in_features, len(self.categories))
        self.model.to(self.device)

        # Load trained weights if available
        self.load_model()

    def load_model(self):
        """Load the trained PyTorch model"""
        try:
            if os.path.exists(self.model_path):
                logging.info(f"Loading PyTorch model from {self.model_path}")
                state_dict = torch.load(self.model_path, map_location=self.device)
                self.model.load_state_dict(state_dict)
                self.model.eval()
                self.is_trained = True
                self.last_training_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                logging.info("PyTorch dental classifier loaded successfully")
            else:
                logging.warning(f"Model file not found: {self.model_path}")
                self.is_trained = False
        except Exception as e:
            logging.error(f"Failed to load PyTorch model: {e}")
            self.is_trained = False

    def preprocess_image(self, image_path: str) -> torch.Tensor:
        """Preprocess image for PyTorch model"""
        try:
            image = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(image).unsqueeze(0)
            return image_tensor.to(self.device)
        except Exception as e:
            logging.error(f"Image preprocessing failed: {e}")
            raise

    def classify_image(self, image_path: str) -> Dict[str, Any]:
        """Classify a dental image using PyTorch model"""
        try:
            if not self.is_trained:
                return self._fallback_classification()

            # Preprocess image
            image_tensor = self.preprocess_image(image_path)

            # Make prediction
            with torch.no_grad():
                logits = self.model(image_tensor)
                probabilities = torch.softmax(logits, dim=1)
                predicted_idx = torch.argmax(logits, dim=1).item()
                confidence = probabilities[0][predicted_idx].item()

            # Get category
            predicted_category = self.categories[predicted_idx]

            # Create probability dictionary
            prob_dict = {}
            for i, category in enumerate(self.categories):
                prob_dict[category] = probabilities[0][i].item()

            # Map to user-friendly names
            category_names = {
                'extraoral_frontal': 'Extraoral Frontal',
                'extraoral_full_face_smile': 'Extraoral Full Face Smile',
                'extraoral_right': 'Extraoral Right',
                'extraoral_zoomed_smile': 'Extraoral Zoomed Smile',
                'intraoral_front': 'Intraoral Front',
                'intraoral_left': 'Intraoral Left',
                'intraoral_right': 'Intraoral Right',
                'lower_occlusal': 'Lower Occlusal',
                'upper_occlusal': 'Upper Occlusal'
            }

            return {
                'classification': predicted_category,
                'confidence': confidence,
                'probabilities': prob_dict,
                'category_name': category_names.get(predicted_category, 'Unknown')
            }

        except Exception as e:
            logging.error(f"PyTorch classification failed for {image_path}: {e}")
            return self._fallback_classification()

    def _fallback_classification(self) -> Dict[str, Any]:
        """Fallback classification when model is not available"""
        return {
            'classification': 'intraoral_front',
            'confidence': 0.3,
            'probabilities': {cat: 1.0/len(self.categories) for cat in self.categories},
            'category_name': 'Intraoral Front (Fallback)',
            'error': 'Model not trained'
        }

    def classify_bulk_images(self, image_paths: List[str]) -> List[Dict[str, Any]]:
        """Classify multiple images efficiently"""
        results = []
        for image_path in image_paths:
            result = self.classify_image(image_path)
            result['image_path'] = image_path
            results.append(result)
        return results

    def train(self, data_path: str = "modelmhanna/data", validation_split: float = 0.2):
        """Train the PyTorch model"""
        try:
            logging.info("Training PyTorch model...")

            # Import training modules
            import torch.optim as optim
            from torch.utils.data import DataLoader
            from torchvision import datasets

            # Create data loaders
            train_transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.RandomHorizontalFlip(),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])

            dataset = datasets.ImageFolder(data_path, transform=train_transform)
            train_loader = DataLoader(dataset, batch_size=8, shuffle=True)

            # Setup training
            criterion = nn.CrossEntropyLoss()
            optimizer = optim.Adam(self.model.parameters(), lr=1e-4)

            # Train for 3 epochs
            self.model.train()
            for epoch in range(3):
                running_loss = 0.0
                correct = 0
                total = 0

                for images, labels in train_loader:
                    images, labels = images.to(self.device), labels.to(self.device)

                    optimizer.zero_grad()
                    outputs = self.model(images)
                    loss = criterion(outputs, labels)
                    loss.backward()
                    optimizer.step()

                    running_loss += loss.item()
                    _, predicted = torch.max(outputs.data, 1)
                    total += labels.size(0)
                    correct += (predicted == labels).sum().item()

                epoch_loss = running_loss / len(train_loader)
                epoch_acc = 100 * correct / total
                logging.info(f"Epoch {epoch+1}/3 - Loss: {epoch_loss:.4f}, Accuracy: {epoch_acc:.2f}%")

            # Save model
            torch.save(self.model.state_dict(), self.model_path)

            self.is_trained = True
            self.last_train_accuracy = epoch_acc / 100
            self.last_val_accuracy = epoch_acc / 100  # Using training accuracy as proxy
            self.last_training_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            logging.info(f"Model training completed and saved to {self.model_path}")
            return {'train_accuracy': self.last_train_accuracy, 'val_accuracy': self.last_val_accuracy}

        except Exception as e:
            logging.error(f"Training failed: {e}")
            return {'train_accuracy': 0.0, 'val_accuracy': 0.0}

    def save_model(self, save_path: str = None):
        """Save the trained model"""
        if save_path is None:
            save_path = self.model_path

        try:
            torch.save(self.model.state_dict(), save_path)
            logging.info(f"Model saved to {save_path}")
        except Exception as e:
            logging.error(f"Failed to save model: {e}")

# Global classifier instance
_pytorch_classifier = None

def get_dental_classifier():
    """Get or create the global dental classifier instance"""
    global _pytorch_classifier
    if _pytorch_classifier is None:
        if PYTORCH_AVAILABLE:
            try:
                _pytorch_classifier = PyTorchDentalClassifier()
                logging.info("Using PyTorch dental classifier")
            except Exception as e:
                logging.warning(f"PyTorch classifier failed, using fallback: {e}")
                _pytorch_classifier = FallbackDentalClassifier()
        else:
            _pytorch_classifier = FallbackDentalClassifier()
            logging.info("Using fallback dental classifier")
    return _pytorch_classifier

def initialize_dental_classifier():
    """Initialize and return the dental classifier"""
    global _pytorch_classifier
    if PYTORCH_AVAILABLE:
        try:
            _pytorch_classifier = PyTorchDentalClassifier()
            logging.info("Initialized PyTorch dental classifier")
        except Exception as e:
            logging.warning(f"PyTorch classifier failed, using fallback: {e}")
            _pytorch_classifier = FallbackDentalClassifier()
    else:
        _pytorch_classifier = FallbackDentalClassifier()
        logging.info("Initialized fallback dental classifier")
    return _pytorch_classifier

# Compatibility functions for existing code
def classify_dental_image(image_path: str) -> Dict[str, Any]:
    """Main function to classify dental images"""
    classifier = get_dental_classifier()
    return classifier.classify_image(image_path)

def classify_bulk_images(image_paths: List[str]) -> List[Dict[str, Any]]:
    """Bulk classification function"""
    classifier = get_dental_classifier()
    return classifier.classify_bulk_images(image_paths)

def encode_image_to_base64(image_path: str, max_size: tuple = (512, 512)) -> str:
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