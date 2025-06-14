import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_login import LoginManager, current_user, login_required
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime, timedelta

# Import our existing modules
from config.database import db
from config.models import User, Patient, Case, UserSettings
from dental_ai_model import get_dental_classifier, initialize_dental_classifier, classify_bulk_images, get_classification_summary

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///dental_app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-string')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
CORS(app, origins=['http://localhost:3000', 'http://localhost:3001'], supports_credentials=True, allow_headers=['Content-Type', 'Authorization'])  # Allow React frontend
db.init_app(app)
jwt = JWTManager(app)

# Set up logging
logging.basicConfig(level=logging.INFO)

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize AI model
try:
    initialize_dental_classifier()
    logging.info("AI model initialized successfully")
except Exception as e:
    logging.error(f"Failed to initialize AI model: {e}")

# Authentication Routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            access_token = create_access_token(identity=str(user.id))
            
            # Parse clinics from JSON
            clinics_list = []
            if user.clinics:
                try:
                    import json
                    clinics_list = json.loads(user.clinics)
                except:
                    clinics_list = []
            
            return jsonify({
                'token': access_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'fullName': user.full_name,
                    'specialty': user.specialty,
                    'gender': user.gender,
                    'profileImage': user.profile_image,
                    'clinics': clinics_list,
                    'notifications': user.notifications_enabled
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid email or password'}), 401
            
    except Exception as e:
        logging.error(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')

        if not email or not password or not name:
            return jsonify({'error': 'Email, password, and name are required'}), 400

        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400

        # Split name into first and last name
        name_parts = name.strip().split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        # Create new user
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            department='Dental',  # Default department
            position='Doctor'     # Default position
        )
        user.set_password(password)  # Use the model's method to set password
        
        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'fullName': user.full_name,
                'specialty': user.specialty,
                'gender': user.gender,
                'profileImage': user.profile_image,
                'clinics': [],
                'notifications': user.notifications_enabled
            }
        }), 201

    except Exception as e:
        logging.error(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/auth/verify', methods=['GET'])
@jwt_required()
def verify_token():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if user:
            # Parse clinics from JSON
            clinics_list = []
            if user.clinics:
                try:
                    import json
                    clinics_list = json.loads(user.clinics)
                except:
                    clinics_list = []
            
            return jsonify({
                'id': user.id,
                'email': user.email,
                'fullName': user.full_name,
                'specialty': user.specialty,
                'gender': user.gender,
                'profileImage': user.profile_image,
                'clinics': clinics_list,
                'notifications': user.notifications_enabled
            }), 200
        else:
            return jsonify({'error': 'User not found'}), 404
            
    except Exception as e:
        logging.error(f"Token verification error: {e}")
        return jsonify({'error': 'Invalid token'}), 401

@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    # With JWT, logout is handled client-side by removing the token
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/auth/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        logging.info(f"Profile update request for user_id: {user_id}")
        
        user = User.query.get(int(user_id))
        
        if not user:
            logging.error(f"User not found for id: {user_id}")
            return jsonify({'error': 'User not found'}), 404
            
        data = request.get_json()
        logging.info(f"Profile update data: {data}")
        
        if not data:
            logging.error("No JSON data received")
            return jsonify({'error': 'No data provided'}), 400
        
        # Update user fields
        if 'fullName' in data and data['fullName']:
            name_parts = data['fullName'].strip().split(' ', 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''
            logging.info(f"Updated name: {user.first_name} {user.last_name}")
        
        if 'email' in data and data['email']:
            # Check if email is already taken by another user
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Email already in use'}), 400
            user.email = data['email']
            logging.info(f"Updated email: {user.email}")
        
        # Handle profile image (for now, just store as text - in production you'd save to file system)
        if 'profileImage' in data:
            user.profile_image = data['profileImage']
            logging.info("Updated profile image")
        
        # Handle clinics (store as JSON string)
        if 'clinics' in data:
            import json
            user.clinics = json.dumps(data['clinics'])
            logging.info(f"Updated clinics: {data['clinics']}")
        
        # Handle specialty
        if 'specialty' in data:
            user.specialty = data['specialty']
            logging.info(f"Updated specialty: {user.specialty}")
        
        # Handle gender
        if 'gender' in data:
            user.gender = data['gender']
            logging.info(f"Updated gender: {user.gender}")
        
        # Handle preferences
        if 'notifications' in data:
            user.notifications_enabled = data['notifications']
            logging.info(f"Updated notifications: {user.notifications_enabled}")
        
        db.session.commit()
        logging.info("Profile updated successfully")
        
        # Return updated user data
        clinics_list = []
        if user.clinics:
            try:
                import json
                clinics_list = json.loads(user.clinics)
            except:
                clinics_list = []
        
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'fullName': user.full_name,
                'specialty': user.specialty,
                'gender': user.gender,
                'profileImage': user.profile_image,
                'clinics': clinics_list,
                'notifications': user.notifications_enabled
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Profile update error: {e}")
        import traceback
        logging.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500

# AI Routes
@app.route('/api/ai/model-status', methods=['GET'])
@jwt_required(optional=True)
def get_model_status():
    try:
        # Get model status from our AI system
        classifier = get_dental_classifier()
        status = {
            'model_type': 'pytorch' if classifier else 'sklearn',
            'training_images': 0,  # TODO: Get actual count
            'last_updated': datetime.now().isoformat(),
            'categories': [
                'extraoral_frontal',
                'extraoral_full_face_smile',
                'extraoral_right',
                'extraoral_zoomed_smile',
                'intraoral_front',
                'intraoral_left',
                'intraoral_right',
                'lower_occlusal',
                'upper_occlusal'
            ]
        }
        return jsonify(status), 200
        
    except Exception as e:
        logging.error(f"Model status error: {e}")
        return jsonify({'error': 'Failed to get model status'}), 500

@app.route('/api/ai/test-classification', methods=['POST'])
@jwt_required()
def test_classification():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if file:
            # Save the file temporarily
            filename = secure_filename(file.filename)
            unique_filename = f"test_{uuid.uuid4()}_{filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(file_path)

            try:
                # Classify the image
                classifier = get_dental_classifier()
                if classifier:
                    result = classifier.classify_image(file_path)
                    return jsonify({
                        'classification': result['category'],
                        'confidence': result['confidence'],
                        'all_predictions': result.get('all_predictions', {})
                    }), 200
                else:
                    return jsonify({'error': 'AI model not available'}), 503
                    
            finally:
                # Clean up temporary file
                if os.path.exists(file_path):
                    os.remove(file_path)

    except Exception as e:
        logging.error(f"Test classification error: {e}")
        return jsonify({'error': 'Classification failed'}), 500

@app.route('/api/ai/bulk-upload-categorize', methods=['POST'])
@jwt_required()
def bulk_upload_categorize():
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400

        files = request.files.getlist('files')
        if not files:
            return jsonify({'error': 'No files selected'}), 400

        results = []
        saved_files = []

        for file in files:
            if file.filename == '':
                continue

            # Save file
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_filename = f"{timestamp}_{filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(file_path)
            saved_files.append(file_path)

        # Classify all images
        if saved_files:
            classifications = classify_bulk_images(saved_files)
            for i, classification in enumerate(classifications):
                results.append({
                    'filename': os.path.basename(saved_files[i]),
                    'file_path': saved_files[i],
                    'classification': classification['category'],
                    'confidence': classification['confidence'],
                    'url': f"/uploads/{os.path.basename(saved_files[i])}"
                })

        return jsonify({'results': results}), 200

    except Exception as e:
        logging.error(f"Bulk classification error: {e}")
        return jsonify({'error': 'Bulk classification failed'}), 500

# Patient Routes
@app.route('/api/patients', methods=['GET'])
@jwt_required()
def get_patients():
    try:
        user_id = get_jwt_identity()
        patients = Patient.query.filter_by(user_id=user_id).all()
        
        patients_data = []
        for patient in patients:
            patients_data.append({
                'id': patient.id,
                'name': patient.name,
                'email': patient.email,
                'phone': patient.phone,
                'date_of_birth': patient.date_of_birth.isoformat() if patient.date_of_birth else None,
                'created_at': patient.created_at.isoformat(),
                'cases_count': len(patient.cases)
            })
            
        return jsonify(patients_data), 200
        
    except Exception as e:
        logging.error(f"Get patients error: {e}")
        return jsonify({'error': 'Failed to fetch patients'}), 500

@app.route('/api/patients', methods=['POST'])
@jwt_required()
def create_patient():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        patient = Patient(
            user_id=user_id,
            name=data.get('name'),
            email=data.get('email'),
            phone=data.get('phone'),
            date_of_birth=datetime.fromisoformat(data.get('date_of_birth')) if data.get('date_of_birth') else None
        )
        
        db.session.add(patient)
        db.session.commit()
        
        return jsonify({
            'id': patient.id,
            'name': patient.name,
            'email': patient.email,
            'phone': patient.phone,
            'date_of_birth': patient.date_of_birth.isoformat() if patient.date_of_birth else None,
            'created_at': patient.created_at.isoformat()
        }), 201
        
    except Exception as e:
        logging.error(f"Create patient error: {e}")
        return jsonify({'error': 'Failed to create patient'}), 500

# Case Routes
@app.route('/api/cases', methods=['GET'])
@jwt_required()
def get_cases():
    try:
        user_id = get_jwt_identity()
        cases = Case.query.join(Patient).filter(Patient.user_id == user_id).all()
        
        cases_data = []
        for case in cases:
            cases_data.append({
                'id': case.id,
                'patient_id': case.patient_id,
                'patient_name': case.patient.name,
                'description': case.description,
                'status': case.status,
                'created_at': case.created_at.isoformat(),
                'images_count': len(case.images) if hasattr(case, 'images') else 0
            })
            
        return jsonify(cases_data), 200
        
    except Exception as e:
        logging.error(f"Get cases error: {e}")
        return jsonify({'error': 'Failed to fetch cases'}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Database initialization - Fixed for newer Flask versions
def create_tables():
    with app.app_context():
        db.create_all()

if __name__ == '__main__':
    create_tables()  # Initialize database tables
    app.run(debug=True, host='0.0.0.0', port=5001) 