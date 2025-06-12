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
    import torch.nn.functional as F
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

    def __init__(self, model_path: str = "AI_System/models/dental_classifier.pkl"):
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
        """Extract enhanced features from image for better extraoral classification"""
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

                # Enhanced texture features for extraoral distinction
                gray = np.mean(img_array, axis=2)
                gradient_x = np.gradient(gray, axis=1)
                gradient_y = np.gradient(gray, axis=0)
                
                # Additional features to distinguish extraoral types
                # Face detection features (simple edge detection for face boundaries)
                edges = np.gradient(gray)
                edge_density = np.mean(np.abs(edges))
                
                # Aspect ratio and shape features
                height, width = gray.shape
                aspect_ratio = width / height
                
                # Brightness distribution (helpful for smile detection)
                brightness_mean = np.mean(gray)
                brightness_std = np.std(gray)
                
                # Regional analysis (divide into quadrants)
                h_mid, w_mid = height // 2, width // 2
                top_brightness = np.mean(gray[:h_mid, :])
                bottom_brightness = np.mean(gray[h_mid:, :])
                left_brightness = np.mean(gray[:, :w_mid])
                right_brightness = np.mean(gray[:, w_mid:])
                
                texture_features = [
                    np.mean(np.abs(gradient_x)),
                    np.mean(np.abs(gradient_y)),
                    np.std(gray),
                    edge_density,
                    aspect_ratio,
                    brightness_mean,
                    brightness_std,
                    top_brightness,
                    bottom_brightness,
                    left_brightness,
                    right_brightness
                ]

                # Combine all features
                features = np.concatenate([mean_rgb, std_rgb, texture_features])
                return features

        except Exception as e:
            logging.error(f"Feature extraction failed: {e}")
            return np.zeros(17)  # Return zero features on error (updated size)

    def _rule_based_extraoral_refinement(self, image_path: str, predicted_category: str, confidence: float, probabilities: dict) -> Dict[str, Any]:
        """Apply rule-based refinement for extraoral images"""
        try:
            # Only apply to extraoral images
            if not predicted_category.startswith('extraoral'):
                return None
                
            # Extract additional features for rule-based classification
            with Image.open(image_path) as img:
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                img = img.resize((224, 224))
                img_array = np.array(img)
                
                # Analyze image characteristics
                height, width = img_array.shape[:2]
                aspect_ratio = width / height
                
                # Color analysis
                brightness = np.mean(img_array)
                
                # Regional brightness analysis
                h_mid, w_mid = height // 2, width // 2
                center_brightness = np.mean(img_array[h_mid-50:h_mid+50, w_mid-50:w_mid+50])
                bottom_half_brightness = np.mean(img_array[h_mid:, :])
                
                # Edge detection for smile (more edges in mouth area)
                gray = np.mean(img_array, axis=2)
                # Simple gradient-based edge detection (no scipy needed)
                grad_x = np.gradient(gray, axis=1)
                grad_y = np.gradient(gray, axis=0)
                edges = np.sqrt(grad_x**2 + grad_y**2)
                bottom_center_edges = np.mean(edges[int(height*0.6):int(height*0.9), int(width*0.3):int(width*0.7)])
                
                # Rule-based logic
                rules_applied = []
                
                # Rule 1: Zoomed smile detection
                if (bottom_center_edges > np.mean(edges) * 1.5 and 
                    bottom_half_brightness > brightness * 0.9 and
                    confidence < 0.8):
                    rules_applied.append("high_mouth_detail")
                    predicted_category = 'extraoral_zoomed_smile'
                    confidence = min(0.85, confidence + 0.2)
                
                # Rule 2: Right view detection (asymmetric lighting)
                left_brightness = np.mean(img_array[:, :w_mid])
                right_brightness = np.mean(img_array[:, w_mid:])
                brightness_asymmetry = abs(left_brightness - right_brightness) / max(left_brightness, right_brightness)
                
                if (brightness_asymmetry > 0.15 and 
                    aspect_ratio > 1.1 and
                    confidence < 0.8):
                    rules_applied.append("asymmetric_lighting")
                    predicted_category = 'extraoral_right'
                    confidence = min(0.85, confidence + 0.2)
                
                # Rule 3: Full face smile (wide aspect ratio + high brightness variation)
                brightness_std = np.std(img_array)
                if (aspect_ratio > 1.3 and 
                    brightness_std > np.mean(img_array) * 0.3 and
                    confidence < 0.8):
                    rules_applied.append("wide_face_view")
                    predicted_category = 'extraoral_full_face_smile'
                    confidence = min(0.85, confidence + 0.2)
                
                if rules_applied:
                    logging.info(f"Rule-based refinement applied: {rules_applied} -> {predicted_category}")
                    return {
                        'classification': predicted_category,
                        'confidence': confidence,
                        'rules_applied': rules_applied
                    }
                    
        except Exception as e:
            logging.error(f"Rule-based refinement failed: {e}")
            
        return None

    def classify_image(self, image_path: str) -> Dict[str, Any]:
        """Classify a dental image using fallback model with rule-based refinement"""
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

            # Apply rule-based refinement for extraoral images
            refinement = self._rule_based_extraoral_refinement(image_path, predicted_category, confidence, prob_dict)
            if refinement:
                predicted_category = refinement['classification']
                confidence = refinement['confidence']
                # Update probabilities to reflect rule-based decision
                prob_dict[predicted_category] = confidence
                
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

            logging.info(f"Enhanced classification: {predicted_category} (confidence: {confidence:.3f})")

            result = {
                'classification': predicted_category,
                'confidence': confidence,
                'probabilities': prob_dict,
                'category_name': category_names.get(predicted_category, 'Unknown'),
                'model_used': 'fallback_sklearn_enhanced'
            }
            
            if refinement and 'rules_applied' in refinement:
                result['rules_applied'] = refinement['rules_applied']
                
            return result

        except Exception as e:
            logging.error(f"Enhanced classification failed for {image_path}: {e}")
            return self._fallback_classification()

    def _fallback_classification(self) -> Dict[str, Any]:
        """Ultimate fallback classification"""
        return {
            'classification': 'intraoral_front',
            'confidence': 0.3,
            'probabilities': {cat: 1.0/len(self.categories) for cat in self.categories},
            'category_name': 'Intraoral Front (Fallback)',
            'error': 'Model not trained',
            'model_used': 'fallback_default'
        }

    def classify_bulk_images(self, image_paths: List[str]) -> List[Dict[str, Any]]:
        """Classify multiple images efficiently"""
        results = []
        for image_path in image_paths:
            result = self.classify_image(image_path)
            result['image_path'] = image_path
            results.append(result)
        return results


if PYTORCH_AVAILABLE:
    class PyTorchDentalClassifier:
        """
        PyTorch-based dental image classifier using the trained modelmhanna model
        """

        def __init__(self, model_path: str = "AI_System/models/dental_classifier.pt"):
            if not PYTORCH_AVAILABLE:
                raise ImportError("PyTorch not available")

            self.model_path = model_path
            self.device = torch.device('cpu')  # Use CPU for compatibility
            self.is_trained = False
            self.last_train_accuracy = None
            self.last_val_accuracy = None
            self.last_training_time = None

            # Categories matching the modelmhanna training data (9 classes)
            self.categories = [
                'extraoral_frontal', 'extraoral_full_face_smile', 'extraoral_right', 
                'extraoral_zoomed_smile', 'intraoral_front', 'intraoral_left', 
                'intraoral_right', 'lower_occlusal', 'upper_occlusal'
            ]

            # Image preprocessing pipeline (matching modelmhanna preprocessing)
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])

            # Initialize model with 9 classes (matching modelmhanna) - Updated to ResNet34
            self.model = models.resnet34(weights=None)  # Updated to ResNet34 to match trained models
            self.model.fc = nn.Linear(self.model.fc.in_features, 9)  # 9 classes
            self.model.to(self.device)

            # Load trained weights from modelmhanna
            self.load_model()

        def load_model(self):
            """Load the trained modelmhanna PyTorch model"""
            try:
                if os.path.exists(self.model_path):
                    logging.info(f"Loading modelmhanna PyTorch model from {self.model_path}")
                    state_dict = torch.load(self.model_path, map_location=self.device)
                    self.model.load_state_dict(state_dict)
                    self.model.eval()
                    self.is_trained = True
                    self.last_training_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    logging.info("Modelmhanna dental classifier loaded successfully")
                else:
                    logging.warning(f"Modelmhanna model file not found: {self.model_path}")
                    self.is_trained = False
            except Exception as e:
                logging.error(f"Failed to load modelmhanna PyTorch model: {e}")
                self.is_trained = False

        def preprocess_image(self, image_path: str) -> torch.Tensor:
            """Preprocess image for modelmhanna PyTorch model"""
            try:
                image = Image.open(image_path).convert('RGB')
                image_tensor = self.transform(image).unsqueeze(0)
                return image_tensor.to(self.device)
            except Exception as e:
                logging.error(f"Image preprocessing failed: {e}")
                raise

        def classify_image(self, image_path: str) -> Dict[str, Any]:
            """Classify a dental image using modelmhanna PyTorch model"""
            try:
                if not self.is_trained:
                    return self._fallback_classification()

                # Preprocess image
                image_tensor = self.preprocess_image(image_path)

                # Make prediction using modelmhanna model
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

                logging.info(f"Modelmhanna classification: {predicted_category} (confidence: {confidence:.3f})")

                return {
                    'classification': predicted_category,
                    'confidence': confidence,
                    'probabilities': prob_dict,
                    'category_name': category_names.get(predicted_category, 'Unknown'),
                    'model_used': 'modelmhanna_pytorch'
                }

            except Exception as e:
                logging.error(f"Modelmhanna PyTorch classification failed for {image_path}: {e}")
                return self._fallback_classification()

        def _fallback_classification(self) -> Dict[str, Any]:
            """Fallback classification when modelmhanna model is not available"""
            return {
                'classification': 'intraoral_front',
                'confidence': 0.3,
                'probabilities': {cat: 1.0/len(self.categories) for cat in self.categories},
                'category_name': 'Intraoral Front (Fallback)',
                'error': 'Modelmhanna model not trained',
                'model_used': 'fallback'
            }

        def classify_bulk_images(self, image_paths: List[str]) -> List[Dict[str, Any]]:
            """Classify multiple images efficiently using modelmhanna model"""
            results = []
            for image_path in image_paths:
                result = self.classify_image(image_path)
                result['image_path'] = image_path
                results.append(result)
            return results

        def train(self, data_path: str = "modelmhanna/data", validation_split: float = 0.2):
            """Train the modelmhanna PyTorch model"""
            try:
                logging.info("Training modelmhanna PyTorch model...")

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

                logging.info(f"Modelmhanna model training completed and saved to {self.model_path}")
                return {'train_accuracy': self.last_train_accuracy, 'val_accuracy': self.last_val_accuracy}

            except Exception as e:
                logging.error(f"Modelmhanna training failed: {e}")
                return {'error': str(e)}

        def save_model(self, save_path: str = None):
            """Save the trained modelmhanna model"""
            try:
                path = save_path or self.model_path
                torch.save(self.model.state_dict(), path)
                logging.info(f"Modelmhanna model saved to {path}")
            except Exception as e:
                logging.error(f"Failed to save modelmhanna model: {e}")

        def _predict(self, input_tensor: torch.Tensor) -> Dict[str, Any]:
            """Internal prediction method for modelmhanna model"""
            with torch.no_grad():
                logits = self.model(input_tensor)
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
                'category_name': category_names.get(predicted_category, 'Unknown'),
                'model_used': 'modelmhanna_pytorch'
            }
else:
    # Create a dummy class when PyTorch is not available
    class PyTorchDentalClassifier:
        def __init__(self, *args, **kwargs):
            raise ImportError("PyTorch not available")

# Global classifier instance
_classifier = None

def get_dental_classifier():
    """
    Get the best available dental classifier, prioritizing modelmhanna PyTorch model
    """
    global _classifier
    
    if _classifier is None:
        if PYTORCH_AVAILABLE:
            try:
                # Try to use modelmhanna PyTorch classifier first
                _classifier = PyTorchDentalClassifier("AI_System/models/dental_classifier.pt")
                if _classifier.is_trained:
                    logging.info("Using modelmhanna PyTorch dental classifier")
                else:
                    logging.warning("Modelmhanna PyTorch model not trained, falling back to sklearn")
                    _classifier = FallbackDentalClassifier()
            except Exception as e:
                logging.error(f"Failed to initialize modelmhanna PyTorch classifier: {e}")
                logging.info("Falling back to sklearn classifier")
                _classifier = FallbackDentalClassifier()
        else:
            logging.warning("PyTorch not available, using fallback classifier")
            _classifier = FallbackDentalClassifier()
    
    return _classifier

def initialize_dental_classifier():
    """
    Initialize the dental classifier system with modelmhanna model
    """
    try:
        classifier = get_dental_classifier()
        if hasattr(classifier, 'model_used'):
            logging.info(f"Dental classifier initialized successfully using {getattr(classifier, 'model_used', 'unknown')}")
        else:
            logging.info("Dental classifier initialized successfully")
        return classifier
    except Exception as e:
        logging.error(f"Failed to initialize dental classifier: {e}")
        return None

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