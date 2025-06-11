import os
import json
import base64
import logging
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image, ImageFilter, ImageStat
import io
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import pickle
from datetime import datetime

class DentalImageClassifier:
    """
    Custom scikit-learn model for dental image classification
    Replaces OpenAI GPT-4o with specialized dental AI using image feature extraction
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path
        self.model = RandomForestClassifier(
            n_estimators=200,  # More trees for better accuracy
            max_depth=15,      # Prevent overfitting
            min_samples_split=3,  # More conservative splitting
            min_samples_leaf=2,   # Ensure leaf nodes have multiple samples
            max_features='sqrt',  # Use sqrt of features for diversity
            bootstrap=True,
            random_state=42,
            class_weight='balanced'  # Handle class imbalance
        )
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        self.last_train_accuracy = None
        self.last_val_accuracy = None
        self.last_training_time = None

        # Dental image categories - updated to match your requirements
        self.categories = [
            'intraoral_left', 'intraoral_right', 'intraoral_front',
            'upper_occlusal', 'lower_occlusal', 
            'extraoral_frontal', 'extraoral_right', 'extraoral_full_face_smile', 'extraoral_zoomed_smile'
        ]

        # Fit label encoder
        self.label_encoder.fit(self.categories)

        if model_path and os.path.exists(model_path):
            self.load_model()
        else:
            logging.info("Created new Random Forest classifier for dental images")

    def extract_image_features(self, image_path: str) -> np.ndarray:
        """Extract comprehensive features from dental image for better classification"""
        try:
            with Image.open(image_path) as img:
                # Convert to RGB if needed
                if img.mode != 'RGB':
                    img = img.convert('RGB')

                # Resize to standard size
                img = img.resize((224, 224), Image.Resampling.LANCZOS)

                # Extract comprehensive features
                features = []

                # 1. Enhanced color statistics for each channel
                for channel in range(3):  # R, G, B
                    channel_data = np.array(img)[:, :, channel]
                    features.extend([
                        np.mean(channel_data),
                        np.std(channel_data),
                        np.min(channel_data),
                        np.max(channel_data),
                        np.percentile(channel_data, 25),  # Q1
                        np.percentile(channel_data, 75),  # Q3
                        np.median(channel_data)
                    ])

                # 2. Enhanced brightness and contrast analysis
                gray = img.convert('L')
                gray_array = np.array(gray)
                features.extend([
                    np.mean(gray_array),  # Overall brightness
                    np.std(gray_array),   # Contrast
                    np.min(gray_array),   # Darkest point
                    np.max(gray_array),   # Brightest point
                    np.percentile(gray_array, 10),  # Dark regions
                    np.percentile(gray_array, 90),  # Bright regions
                ])

                # 3. Enhanced edge detection for dental features
                edges = gray.filter(ImageFilter.FIND_EDGES)
                edge_array = np.array(edges)
                edge_threshold = 30
                features.extend([
                    np.mean(edge_array),
                    np.std(edge_array),
                    np.sum(edge_array > edge_threshold) / edge_array.size,  # Edge density
                    np.max(edge_array),  # Strongest edge
                    np.sum(edge_array > edge_threshold * 2) / edge_array.size,  # Strong edges
                ])

                # 4. Shape and geometric features
                width, height = img.size
                features.extend([
                    width / height,  # Aspect ratio
                    width * height,  # Total area
                    max(width, height) / min(width, height),  # Extreme aspect ratio
                ])

                # 5. Enhanced histogram analysis
                hist = img.histogram()
                # Analyze different regions of histogram
                total_pixels = width * height
                hist_features = []
                
                # RGB histogram features
                for i in range(0, 256, 32):  # 8 bins per channel
                    r_sum = sum(hist[i:i+32])
                    g_sum = sum(hist[256+i:256+i+32])
                    b_sum = sum(hist[512+i:512+i+32])
                    hist_features.extend([r_sum/total_pixels, g_sum/total_pixels, b_sum/total_pixels])
                
                features.extend(hist_features[:24])  # 24 histogram features

                # 6. Enhanced texture analysis
                texture_features = self._calculate_enhanced_texture_features(gray_array)
                features.extend(texture_features)

                # 7. Dental-specific features
                dental_features = self._calculate_dental_specific_features(gray_array, edge_array)
                features.extend(dental_features)

                return np.array(features, dtype=np.float32)

        except Exception as e:
            logging.error(f"Feature extraction failed for {image_path}: {e}")
            # Return zero features if extraction fails
            return np.zeros(50, dtype=np.float32)

    def _calculate_enhanced_texture_features(self, gray_array: np.ndarray) -> List[float]:
        """Calculate enhanced texture features from grayscale image"""
        features = []

        # Enhanced texture measures
        # 1. Local variance in multiple neighborhood sizes
        rows, cols = gray_array.shape
        for window_size in [3, 5]:
            local_vars = []
            half_window = window_size // 2
            
            for i in range(half_window, rows-half_window, 6):
                for j in range(half_window, cols-half_window, 6):
                    neighborhood = gray_array[i-half_window:i+half_window+1, j-half_window:j+half_window+1]
                    local_vars.append(np.var(neighborhood))

            if local_vars:
                features.extend([
                    np.mean(local_vars),
                    np.std(local_vars),
                    np.max(local_vars),
                    np.min(local_vars)
                ])
            else:
                features.extend([0.0, 0.0, 0.0, 0.0])

        # 2. Enhanced gradient features
        grad_x = np.abs(np.diff(gray_array, axis=1))
        grad_y = np.abs(np.diff(gray_array, axis=0))
        
        # Gradient magnitude - handle shape mismatch
        min_rows = min(grad_x.shape[0], grad_y.shape[0])
        min_cols = min(grad_x.shape[1], grad_y.shape[1])
        
        if min_rows > 0 and min_cols > 0:
            grad_x_crop = grad_x[:min_rows, :min_cols]
            grad_y_crop = grad_y[:min_rows, :min_cols]
            grad_mag = np.sqrt(grad_x_crop**2 + grad_y_crop**2)
        else:
            grad_mag = np.array([[0]])

        features.extend([
            np.mean(grad_x),
            np.mean(grad_y),
            np.std(grad_x),
            np.std(grad_y),
            np.mean(grad_mag),
            np.std(grad_mag),
            np.max(grad_mag)
        ])

        # 3. Texture patterns using simplified LBP
        pattern_features = self._calculate_pattern_features(gray_array)
        features.extend(pattern_features)

        return features

    def _calculate_pattern_features(self, gray_array: np.ndarray) -> List[float]:
        """Calculate pattern features for texture analysis"""
        features = []
        rows, cols = gray_array.shape
        
        # Simplified Local Binary Pattern
        patterns = []
        for i in range(1, rows-1, 4):
            for j in range(1, cols-1, 4):
                center = gray_array[i, j]
                neighbors = [
                    gray_array[i-1, j-1], gray_array[i-1, j], gray_array[i-1, j+1],
                    gray_array[i, j+1], gray_array[i+1, j+1], gray_array[i+1, j],
                    gray_array[i+1, j-1], gray_array[i, j-1]
                ]
                
                # Count neighbors greater than center
                pattern = sum(1 for n in neighbors if n > center)
                patterns.append(pattern)
        
        if patterns:
            features.extend([
                np.mean(patterns),
                np.std(patterns),
                patterns.count(0) / len(patterns),  # Uniform dark regions
                patterns.count(8) / len(patterns),  # Uniform bright regions
            ])
        else:
            features.extend([0.0, 0.0, 0.0, 0.0])
        
        return features

    def _calculate_dental_specific_features(self, gray_array: np.ndarray, edge_array: np.ndarray) -> List[float]:
        """Calculate features specific to dental image classification"""
        features = []
        rows, cols = gray_array.shape
        
        # 1. Darkness concentration (for occlusal views - dark areas between teeth)
        dark_threshold = np.percentile(gray_array, 20)
        dark_pixels = gray_array < dark_threshold
        dark_ratio = np.sum(dark_pixels) / (rows * cols)
        
        # Dark region clustering (occlusal views have clustered dark areas)
        from scipy import ndimage
        try:
            dark_labels, dark_regions = ndimage.label(dark_pixels)
            avg_dark_region_size = np.sum(dark_pixels) / max(dark_regions, 1)
        except:
            avg_dark_region_size = 0
        
        features.extend([
            dark_ratio,
            avg_dark_region_size / (rows * cols),  # Normalized region size
        ])
        
        # 2. Edge concentration patterns
        # Occlusal views have edges concentrated in center
        # Extraoral views have edges more distributed
        center_y, center_x = rows // 2, cols // 2
        quarter_y, quarter_x = rows // 4, cols // 4
        
        center_region = edge_array[quarter_y:3*quarter_y, quarter_x:3*quarter_x]
        edge_region = np.concatenate([
            edge_array[:quarter_y, :].flatten(),
            edge_array[3*quarter_y:, :].flatten(),
            edge_array[:, :quarter_x].flatten(),
            edge_array[:, 3*quarter_x:].flatten()
        ])
        
        center_edge_density = np.mean(center_region) if center_region.size > 0 else 0
        edge_edge_density = np.mean(edge_region) if edge_region.size > 0 else 0
        
        features.extend([
            center_edge_density,
            edge_edge_density,
            center_edge_density / max(edge_edge_density, 1),  # Center vs edge ratio
        ])
        
        # 3. Symmetry features (intraoral views are often more symmetric)
        try:
            left_half = gray_array[:, :cols//2]
            right_half = np.fliplr(gray_array[:, cols//2:])
            min_width = min(left_half.shape[1], right_half.shape[1])
            
            if min_width > 0 and left_half.shape[0] == right_half.shape[0]:
                left_crop = left_half[:, -min_width:]
                right_crop = right_half[:, :min_width]
                symmetry_score = np.mean(np.abs(left_crop.astype(float) - right_crop.astype(float)))
            else:
                symmetry_score = 255
        except Exception as e:
            symmetry_score = 255
            
        features.extend([
            symmetry_score / 255,  # Normalized symmetry score
        ])
        
        return features

    def preprocess_image(self, image_data: bytes) -> np.ndarray:
        """Preprocess image for feature extraction"""
        try:
            # Save bytes to temporary path for feature extraction
            temp_path = '/tmp/temp_dental_image.jpg'
            with open(temp_path, 'wb') as f:
                f.write(image_data)

            features = self.extract_image_features(temp_path)

            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)

            return features.reshape(1, -1)

        except Exception as e:
            logging.error(f"Image preprocessing failed: {e}")
            raise

    def predict(self, features: np.ndarray) -> Dict[str, float]:
        """Make prediction using the model"""
        if not self.is_trained:
            # Use rule-based classification for untrained model
            return self._rule_based_classification(features)

        try:
            # Scale features
            features_scaled = self.scaler.transform(features)

            # Get prediction probabilities
            probabilities = self.model.predict_proba(features_scaled)[0]

            # Ensure we have the right number of probabilities
            if len(probabilities) != len(self.categories):
                return self._rule_based_classification(features)

            # Create probability dictionary
            result = {}
            for i, category in enumerate(self.categories):
                if i < len(probabilities):
                    result[category] = float(probabilities[i])
                else:
                    result[category] = 0.0

            return result

        except Exception as e:
            logging.error(f"Model prediction failed: {e}")
            return self._rule_based_classification(features)

    def _rule_based_classification(self, features: np.ndarray) -> Dict[str, float]:
        """Rule-based classification using image features"""
        # Extract key features for rule-based decisions
        if features.shape[1] < 20:
            # Return uniform distribution if not enough features
            prob = 1.0 / len(self.categories)
            return {cat: prob for cat in self.categories}

        brightness = features[0, 12]  # Overall brightness feature
        contrast = features[0, 13]    # Contrast feature
        aspect_ratio = features[0, 17] # Aspect ratio
        edge_density = features[0, 16] # Edge density

        # Initialize probabilities
        probs = {cat: 0.1 for cat in self.categories}

        # Rule-based logic
        if brightness < 50:  # Dark images likely radiographs
            probs['radiograph'] += 0.4

        if aspect_ratio > 1.5:  # Wide images likely extraoral or front
            probs['extraoral'] += 0.3
            probs['front_view'] += 0.2
        elif aspect_ratio < 0.8:  # Tall images
            probs['radiograph'] += 0.2

        if contrast > 40:  # High contrast images
            probs['radiograph'] += 0.2
            probs['front_view'] += 0.1

        if edge_density > 0.1:  # High edge density
            probs['upper_occlusal'] += 0.2
            probs['lower_occlusal'] += 0.2

        # Normalize probabilities
        total = sum(probs.values())
        return {k: v/total for k, v in probs.items()}

    def classify_image(self, image_path: str) -> Dict[str, Any]:
        """Classify a single dental image"""
        try:
            features = self.extract_image_features(image_path)
            features_reshaped = features.reshape(1, -1)
            probabilities = self.predict(features_reshaped)

            # Find best match
            best_category = max(probabilities.keys(), key=lambda k: probabilities[k])
            confidence = probabilities[best_category]

            # Ensure classification matches our 9 categories
            if best_category not in self.categories:
                # Map old categories to new ones or default to front view
                old_to_new_mapping = {
                    'left_view': 'intraoral_left',
                    'right_view': 'intraoral_right',
                    'front_view': 'intraoral_front',
                    'extraoral': 'extraoral_frontal',
                    'radiograph': 'intraoral_front',  # Default radiographs to front view
                    'other': 'intraoral_front',
                    'reasoning': 'intraoral_front',  # Handle reasoning errors
                    'success': 'intraoral_front'     # Handle success errors
                }
                logging.warning(f"Unknown category '{best_category}' mapped to front view")
                best_category = old_to_new_mapping.get(best_category, 'intraoral_front')

            # Double-check the category is valid
            if best_category not in self.categories:
                best_category = 'intraoral_front'
                confidence = 0.3

            # Map to user-friendly names
            category_names = {
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

        for image_path in image_paths:
            result = self.classify_image(image_path)
            result['image_path'] = image_path
            results.append(result)

        return results

    def train(self, data_path: str, validation_split: float = 0.2):
        """Train the model on dental image data"""
        logging.info("Loading training data...")

        # Collect training data
        features_list = []
        labels_list = []

        for category in self.categories:
            category_path = os.path.join(data_path, category)
            if not os.path.exists(category_path):
                continue

            for filename in os.listdir(category_path):
                if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                    image_path = os.path.join(category_path, filename)
                    try:
                        features = self.extract_image_features(image_path)
                        features_list.append(features)
                        labels_list.append(category)
                    except Exception as e:
                        logging.warning(f"Failed to process {image_path}: {e}")

        if not features_list:
            raise ValueError("No training images found")

        # Convert to arrays
        X = np.array(features_list)
        y = np.array(labels_list)

        logging.info(f"Loaded {len(X)} training samples")

        # Apply data augmentation to increase training data
        logging.info("Applying data augmentation...")
        X_augmented = []
        y_augmented = []
        
        for i, (sample, label) in enumerate(zip(X, y)):
            # Add original sample
            X_augmented.append(sample)
            y_augmented.append(label)
            
            # Add augmented versions
            augmented_samples = self._augment_features(sample)
            for aug_sample in augmented_samples:
                X_augmented.append(aug_sample)
                y_augmented.append(label)
        
        X = np.array(X_augmented)
        y = np.array(y_augmented)
        
        logging.info(f"After augmentation: {len(X)} training samples")

        # Check if we have enough data for proper validation split
        unique_labels, label_counts = np.unique(y, return_counts=True)
        min_samples = min(label_counts)

        if len(X) < 20 or min_samples < 4:
            # Not enough data for validation split - train on all data
            logging.info(f"Limited data ({len(X)} samples, min {min_samples} per class). Training on all data.")
            X_train, X_val, y_train, y_val = X, X, y, y
            validation_split = 0  # No actual validation split
        else:
            # Enough data for proper train/validation split
            X_train, X_val, y_train, y_val = train_test_split(
                X, y, test_size=validation_split, random_state=42, stratify=y
            )

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_val_scaled = self.scaler.transform(X_val)

        # Train model
        logging.info("Training Random Forest classifier...")
        self.model.fit(X_train_scaled, y_train)

        # Evaluate
        train_score = self.model.score(X_train_scaled, y_train)
        val_score = self.model.score(X_val_scaled, y_val)

        logging.info(f"Training accuracy: {train_score:.3f}")
        logging.info(f"Validation accuracy: {val_score:.3f}")

        self.is_trained = True
        self.last_train_accuracy = train_score
        self.last_val_accuracy = val_score
        self.last_training_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        return {'train_accuracy': train_score, 'val_accuracy': val_score}

    def save_model(self, save_path: str):
        """Save the trained model"""
        if not self.model:
            raise ValueError("No model to save")

        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(save_path), exist_ok=True)

        # Save model components
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'categories': self.categories,
            'is_trained': self.is_trained
        }

        with open(save_path, 'wb') as f:
            pickle.dump(model_data, f)

        logging.info(f"Model saved to {save_path}")

    def load_model(self):
        """Load a saved model"""
        if not self.model_path:
            logging.warning("No model path specified")
            return

        try:
            with open(self.model_path, 'rb') as f:
                model_data = pickle.load(f)

            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.label_encoder = model_data['label_encoder']
            self.categories = model_data['categories']
            self.is_trained = model_data.get('is_trained', True)

            logging.info(f"Model loaded from {self.model_path}")

        except Exception as e:
            logging.error(f"Failed to load model: {e}")
            # Keep default initialized model

    def _augment_features(self, original_features: np.ndarray) -> List[np.ndarray]:
        """Create augmented feature variations to increase training data"""
        augmented = []

        # Add small random noise (simulates lighting variations)
        for _ in range(2):
            noise_factor = 0.05
            noise = np.random.normal(0, noise_factor, original_features.shape)
            augmented_features = original_features + noise
            # Ensure features stay in reasonable ranges
            augmented_features = np.clip(augmented_features, 
                                       original_features * 0.8, 
                                       original_features * 1.2)
            augmented.append(augmented_features)

        # Brightness variations (adjust first few features which are color-related)
        brightness_variations = [0.9, 1.1]
        for brightness in brightness_variations:
            bright_features = original_features.copy()
            # Adjust color and brightness features (first 21 features)
            bright_features[:21] *= brightness
            bright_features = np.clip(bright_features, 0, 255)
            augmented.append(bright_features)

        return augmented
# Global instance for the application
dental_classifier = None

def initialize_dental_classifier(model_path: str = "models/dental_classifier.pkl"):
    """Initialize the global dental classifier"""
    global dental_classifier
    dental_classifier = DentalImageClassifier(model_path)
    return dental_classifier

def get_dental_classifier():
    """Get the global dental classifier instance"""
    global dental_classifier
    if dental_classifier is None:
        dental_classifier = DentalImageClassifier()
        # Automatically train if we have training data but no trained model
        auto_train_if_needed()
    return dental_classifier

def auto_train_if_needed():
    """Automatically train the model if training data is available and model is not trained"""
    try:
        from training_setup import TrainingDataManager
        trainer = TrainingDataManager()
        stats = trainer.get_training_stats()

        classifier = get_dental_classifier()

        # Train if we have enough data (at least 20 images) and model isn't trained
        if stats['total_images'] >= 20 and not classifier.is_trained:
            logging.info(f"Auto-training model with {stats['total_images']} training images...")

            # Train the model
            results = classifier.train(trainer.base_path)

            # Save the trained model
            model_save_path = "models/dental_classifier.pkl"
            os.makedirs("models", exist_ok=True)
            classifier.save_model(model_save_path)

            logging.info(f"Auto-training completed. Train accuracy: {results.get('train_accuracy', 0):.3f}")

        elif stats['total_images'] > 0 and stats['total_images'] < 20:
            logging.info(f"Training data available ({stats['total_images']} images) but need at least 20 for training")

    except Exception as e:
        logging.error(f"Auto-training failed: {e}")

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