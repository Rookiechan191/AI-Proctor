from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
from proctor_detector import ProctorDetector
from models import Violation, SessionLocal, Base, engine
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Initialize the database
Base.metadata.create_all(bind=engine)

# Initialize the proctor detector
detector = ProctorDetector()

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
            for violation_type, is_violation in violations.items():
                if is_violation:
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
                        timestamp=datetime.utcnow()
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) 