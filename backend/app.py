from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
from proctor_detector import ProctorDetector
from models import Violation, SessionLocal, Base, engine
from datetime import datetime, timedelta
import pytz
import os
from PIL import Image
import io
from face_verification import FaceVerificationService

app = Flask(__name__)
CORS(app)

# Initialize the database
Base.metadata.create_all(bind=engine)

# Initialize the proctor detector
detector = ProctorDetector()

# Initialize face verification service
face_verifier = FaceVerificationService()

# Create directory for storing face recognition images
FACE_IMAGES_DIR = 'face_images'
os.makedirs(FACE_IMAGES_DIR, exist_ok=True)

# Time window for duplicate detection (in seconds)
DUPLICATE_WINDOW = 2

@app.route('/upload_face_image', methods=['POST'])
def upload_face_image():
    try:
        # Get the base64 encoded image from the request
        data = request.json
        image_data = data['image'].split(',')[1]  # Remove the data URL prefix
        image_bytes = base64.b64decode(image_data)
        
        # Get student ID and view type from the request
        student_id = data.get('student_id')
        view_type = data.get('view_type')  # 'front', 'left', 'right'
        
        if not student_id or not view_type:
            return jsonify({
                'success': False,
                'error': 'Student ID and view type are required'
            }), 400
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary (remove alpha channel)
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{student_id}_{view_type}_{timestamp}.png"
        filepath = os.path.join(FACE_IMAGES_DIR, filename)
        
        # Save the image
        image.save(filepath)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'filepath': filepath
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/get_face_images', methods=['GET'])
def get_face_images():
    try:
        student_id = request.args.get('student_id')
        
        if not student_id:
            return jsonify({
                'success': False,
                'error': 'Student ID is required'
            }), 400
        
        # Get all images for the student
        images = []
        if os.path.exists(FACE_IMAGES_DIR):
            for filename in os.listdir(FACE_IMAGES_DIR):
                if filename.startswith(f"{student_id}_"):
                    filepath = os.path.join(FACE_IMAGES_DIR, filename)
                    file_stat = os.stat(filepath)
                    images.append({
                        'filename': filename,
                        'view_type': filename.split('_')[1],
                        'timestamp': datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
                        'size': file_stat.st_size
                    })
        
        # Sort by timestamp (newest first)
        images.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            'success': True,
            'images': images
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/analyze_frame', methods=['POST'])
def analyze_frame():
    try:
        # Get the base64 encoded image from the request
        data = request.json
        image_data = data['image'].split(',')[1]  # Remove the data URL prefix
        image_bytes = base64.b64decode(image_data)
        
        # Get student and exam IDs from the request
        student_id = data.get('student_id')
        exam_id = data.get('exam_id')
        
        if not student_id or not exam_id:
            return jsonify({
                'success': False,
                'error': 'Student ID and Exam ID are required'
            }), 400
        
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Detect violations
        violations = detector.detect_violations(frame)
        
        # Store violations in database
        db = SessionLocal()
        try:
            current_time = datetime.now(pytz.timezone('Asia/Kolkata'))
            time_window_start = current_time - timedelta(seconds=DUPLICATE_WINDOW)
            
            for violation_type, is_violation in violations.items():
                if is_violation:
                    # Check for recent duplicate violations
                    recent_violation = db.query(Violation).filter(
                        Violation.student_id == student_id,
                        Violation.exam_id == exam_id,
                        Violation.violation_type == violation_type,
                        Violation.timestamp >= time_window_start
                    ).first()
                    
                    if not recent_violation:
                        # Calculate confidence based on violation type
                        confidence = 0.8  # Default confidence
                        details = f"Detected {violation_type}"
                        
                        # Create violation record
                        violation = Violation(
                            student_id=student_id,
                            exam_id=exam_id,
                            violation_type=violation_type,
                            confidence=confidence,
                            details=details,
                            timestamp=current_time
                        )
                        db.add(violation)
            
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error storing violation: {e}")
        finally:
            db.close()
        
        return jsonify({
            'success': True,
            'violations': violations
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/get_violations', methods=['GET'])
def get_violations():
    try:
        student_id = request.args.get('student_id')
        exam_id = request.args.get('exam_id')
        
        if not student_id or not exam_id:
            return jsonify({
                'success': False,
                'error': 'Student ID and Exam ID are required'
            }), 400
        
        db = SessionLocal()
        try:
            violations = db.query(Violation).filter(
                Violation.student_id == student_id,
                Violation.exam_id == exam_id
            ).order_by(Violation.timestamp.desc()).all()
            
            return jsonify({
                'success': True,
                'violations': [
                    {
                        'type': v.violation_type,
                        'confidence': v.confidence,
                        'timestamp': v.timestamp.isoformat(),
                        'details': v.details
                    }
                    for v in violations
                ]
            })
        finally:
            db.close()
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/report_violation', methods=['POST'])
def report_violation():
    try:
        data = request.json
        student_id = data.get('student_id')
        exam_id = data.get('exam_id')
        violation_type = data.get('violation_type')
        details = data.get('details', '')
        confidence = data.get('confidence', 1.0)  # Default to 1.0 for manual events

        if not student_id or not exam_id or not violation_type:
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400

        db = SessionLocal()
        try:
            violation = Violation(
                student_id=student_id,
                exam_id=exam_id,
                violation_type=violation_type,
                confidence=confidence,
                details=details
            )
            db.add(violation)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error storing manual violation: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500
        finally:
            db.close()

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/verify_face', methods=['POST'])
def verify_face():
    """Verify if the live face matches the reference images for a student."""
    try:
        data = request.json
        student_id = data.get('student_id')
        live_image = data.get('image')
        
        if not student_id or not live_image:
            return jsonify({
                'success': False,
                'error': 'Student ID and live image are required'
            }), 400
        
        # Perform face verification
        result = face_verifier.verify_face(student_id, live_image)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/face_verification_status', methods=['GET'])
def face_verification_status():
    """Get the verification status for a student."""
    try:
        student_id = request.args.get('student_id')
        
        if not student_id:
            return jsonify({
                'success': False,
                'error': 'Student ID is required'
            }), 400
        
        status = face_verifier.get_verification_status(student_id)
        
        return jsonify({
            'success': True,
            'status': status
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/load_reference_images', methods=['POST'])
def load_reference_images():
    """Load reference images for a student."""
    try:
        data = request.json
        student_id = data.get('student_id')
        
        if not student_id:
            return jsonify({
                'success': False,
                'error': 'Student ID is required'
            }), 400
        
        success = face_verifier.load_reference_images(student_id)
        
        return jsonify({
            'success': success,
            'message': 'Reference images loaded successfully' if success else 'Failed to load reference images'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) 