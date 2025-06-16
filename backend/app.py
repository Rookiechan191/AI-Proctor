from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
from proctor_detector import ProctorDetector

app = Flask(__name__)
CORS(app)

# Initialize the proctor detector
detector = ProctorDetector()

@app.route('/analyze_frame', methods=['POST'])
def analyze_frame():
    try:
        # Get the base64 encoded image from the request
        data = request.json
        image_data = data['image'].split(',')[1]  # Remove the data URL prefix
        image_bytes = base64.b64decode(image_data)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Detect violations
        violations = detector.detect_violations(frame)
        
        return jsonify({
            'success': True,
            'violations': violations
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) 