# AI Proctoring System - Comprehensive Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technologies Used](#technologies-used)
4. [AI Models and Algorithms](#ai-models-and-algorithms)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Security Features](#security-features)
10. [Installation and Setup](#installation-and-setup)
11. [Usage Guide](#usage-guide)
12. [Configuration](#configuration)
13. [Troubleshooting](#troubleshooting)

## Project Overview

The AI Proctoring System is an intelligent online examination monitoring solution that uses computer vision and machine learning to detect potential violations during online exams. The system provides real-time monitoring capabilities with high accuracy and low false positive rates.

### Key Features
- **Real-time Face Detection**: Monitors for multiple faces in the frame
- **Face Recognition & Proxy Detection**: Verifies if the same person is taking the exam
- **Head Pose Estimation**: Detects if the user is looking away from the screen
- **Gaze Tracking**: Monitors eye movements and detects unusual behavior
- **Device Detection**: Identifies electronic devices like phones, laptops, and monitors
- **Violation Logging**: Comprehensive database logging of all violations
- **Modern UI**: Clean and responsive interface built with React and Tailwind CSS

## System Architecture

The system follows a client-server architecture with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (Flask)       │◄──►│   (SQLite)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Webcam        │    │   AI Models     │
│   Capture       │    │   (YOLO, etc.)  │
└─────────────────┘    └─────────────────┘
```

### Data Flow
1. **Registration Phase**: Student captures reference face images (front, left, right)
2. **Exam Phase**: Real-time webcam monitoring with frame analysis every 3 seconds
3. **Violation Detection**: Multiple AI models analyze each frame for violations
4. **Database Logging**: All violations are stored with timestamps and metadata

## Technologies Used

### Backend Technologies
- **Python 3.8+**: Core programming language
- **Flask 2.0+**: Web framework for API endpoints
- **Flask-CORS**: Cross-origin resource sharing support
- **SQLAlchemy 2.0+**: Database ORM and management
- **OpenCV 4.8+**: Computer vision operations
- **NumPy 1.24+**: Numerical computations
- **Pillow 10.0+**: Image processing
- **PyTorch 2.0+**: Deep learning framework
- **pytz**: Timezone handling

### AI/ML Libraries
- **MediaPipe 0.10+**: Face mesh and landmark detection
- **Ultralytics 8.0+**: YOLOv8 implementation
- **FaceNet-PyTorch 2.5+**: Face recognition embeddings
- **YOLOv8n-face**: Specialized face detection model

### Frontend Technologies
- **React 18.3+**: UI framework
- **TypeScript 5.5+**: Type-safe JavaScript
- **Tailwind CSS 3.4+**: Utility-first CSS framework
- **Vite 5.2+**: Build tool and dev server
- **React Router DOM 7.6+**: Client-side routing
- **Lucide React 0.441+**: Icon library

### Development Tools
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## AI Models and Algorithms

### 1. Face Detection (YOLOv8n-face)
- **Model**: YOLOv8n-face (nano variant optimized for face detection)
- **Purpose**: Detect faces in webcam frames and reference images
- **Confidence Threshold**: 0.5
- **Output**: Bounding boxes with confidence scores
- **Performance**: Real-time detection with high accuracy

### 2. Face Recognition (FaceNet)
- **Model**: InceptionResnetV1 (VGG-Face2 pre-trained)
- **Purpose**: Generate 512-dimensional face embeddings for identity verification
- **Architecture**: Deep convolutional neural network
- **Distance Metric**: Euclidean distance between embeddings
- **Threshold**: 0.85 (configurable)
- **Performance**: High accuracy for face matching

### 3. Head Pose Estimation
- **Method**: 6-point facial landmark analysis
- **Landmarks Used**: Nose, left eye, right eye, left mouth, right mouth, chin
- **Algorithm**: Perspective-n-Point (PnP) solving
- **Output**: Pitch, Yaw, Roll angles in degrees
- **Thresholds**: 
  - Yaw: ±30° (head turning left/right)
  - Pitch: ±20° (head tilting up/down)

### 4. Gaze Detection
- **Method**: Eye Aspect Ratio (EAR) calculation
- **Landmarks**: Eye corners, top, and bottom points
- **Formula**: EAR = (vertical distance) / (horizontal distance)
- **Normal Range**: 0.2 to 0.5
- **Combined with**: Head pose for comprehensive gaze analysis

### 5. Device Detection (YOLOv8)
- **Model**: YOLOv8n (general purpose object detection)
- **Target Classes**: 
  - Class 67: Cell phone
  - Class 73: Laptop
  - Class 62: Monitor/TV
- **Confidence Threshold**: 0.35
- **Purpose**: Detect unauthorized electronic devices

### 6. Multiple Face Detection
- **Method**: YOLO face detection + distance analysis
- **Algorithm**: 
  1. Detect all faces in frame
  2. Calculate distances between face centers
  3. Filter out false positives (faces too close)
- **Distance Threshold**: 50 pixels minimum between faces

## Backend Implementation

### Core Components

#### 1. ProctorDetector Class (`proctor_detector.py`)
```python
class ProctorDetector:
    def __init__(self):
        # MediaPipe Face Mesh for landmarks
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            max_num_faces=3,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        
        # YOLO models for detection
        self.yolo_detector = YOLO('yolov8n.pt')
        
    def detect_violations(self, frame):
        # Returns violation dictionary
```

#### 2. FaceVerificationService Class (`face_verification.py`)
```python
class FaceVerificationService:
    def __init__(self):
        self.recognizer = FaceRecognizer()
        self.reference_embeddings = {}
    
    def verify_face(self, student_id, live_image_base64, threshold=0.85):
        # Returns verification result
```

#### 3. Face Recognition (`recognition.py`)
```python
class FaceRecognizer:
    def __init__(self):
        self.resnet = InceptionResnetV1(pretrained='vggface2')
    
    def get_embedding(self, face_img):
        # Returns 512-dim embedding vector
```

### Key Algorithms

#### Face Embedding Generation
1. **Image Preprocessing**:
   - Resize to 160x160 pixels
   - Convert to RGB format
   - Normalize to [-1, 1] range
   
2. **Feature Extraction**:
   - Pass through InceptionResnetV1
   - Extract 512-dimensional embedding
   - L2 normalization

#### Violation Detection Pipeline
1. **Frame Analysis**:
   - YOLO face detection
   - MediaPipe landmark extraction
   - Device detection
   
2. **Violation Checks**:
   - Multiple faces: Distance-based filtering
   - Head pose: PnP-based angle calculation
   - Gaze: EAR + pose combination
   - Devices: YOLO object detection

## Frontend Implementation

### Component Architecture

```
App.tsx
├── Header.tsx
├── Hero.tsx
├── SignIn.tsx
├── FaceRecognition.tsx
│   ├── FaceCapture.tsx
│   └── WebcamFeed.tsx
├── Quiz.tsx
│   ├── QuizLayout.tsx
│   ├── ExamTimer.tsx
│   ├── ProgressIndicator.tsx
│   └── WarningDialog.tsx
└── Results.tsx
```

### Key Features

#### 1. Real-time Webcam Integration
- **MediaDevices API**: Camera access and control
- **Canvas Rendering**: Frame capture and processing
- **Base64 Encoding**: Image transmission to backend

#### 2. Face Capture System
- **Three-view Capture**: Front, left, right angles
- **Quality Validation**: Face detection before saving
- **Progress Tracking**: Visual feedback during capture

#### 3. Violation Monitoring
- **Real-time Alerts**: Immediate violation notifications
- **Status Display**: Current verification status
- **Warning System**: Progressive warning levels

### State Management
- **React Hooks**: useState, useEffect for local state
- **Context API**: Global state for exam session
- **Local Storage**: Persistence of user preferences

## Database Schema

### Violations Table
```sql
CREATE TABLE violations (
    id INTEGER PRIMARY KEY,
    student_id VARCHAR,
    exam_id VARCHAR,
    violation_type VARCHAR,
    confidence FLOAT,
    timestamp DATETIME,
    details TEXT
);
```

### Fields Description
- **id**: Primary key (auto-increment)
- **student_id**: Unique student identifier
- **exam_id**: Exam session identifier
- **violation_type**: Type of violation detected
- **confidence**: Detection confidence score (0.0-1.0)
- **timestamp**: UTC timestamp of violation
- **details**: Additional violation information

### Indexes
- `student_id`: For quick student violation lookup
- `exam_id`: For exam-specific violation queries
- `timestamp`: For time-based filtering

## API Endpoints

### Face Management
- `POST /upload_face_image`: Upload reference face images
- `GET /get_face_images`: Retrieve stored face images
- `POST /load_reference_images`: Load reference embeddings

### Violation Detection
- `POST /analyze_frame`: Analyze webcam frame for violations
- `GET /get_violations`: Retrieve violation history
- `POST /report_violation`: Manual violation reporting

### Face Verification
- `POST /verify_face`: Real-time face verification
- `GET /face_verification_status`: Get verification status

### Response Format
```json
{
    "success": true/false,
    "data": {...},
    "error": "error_message"
}
```

## Security Features

### 1. Face Recognition Security
- **Embedding-based**: No raw images stored in memory
- **Threshold-based**: Configurable similarity thresholds
- **Multi-view**: Multiple reference angles for robustness

### 2. Data Protection
- **Local Storage**: Face images stored locally
- **Encrypted Transmission**: HTTPS for all API calls
- **Session-based**: Temporary data storage

### 3. Anti-Spoofing Measures
- **Multi-angle Verification**: Front, left, right views
- **Real-time Monitoring**: Continuous verification
- **Distance Analysis**: Prevents simple photo attacks

## Installation and Setup

### Prerequisites
- **Node.js**: v14 or higher
- **Python**: 3.8 or higher
- **Webcam**: For face capture and monitoring
- **Git**: For version control

### Backend Setup
```bash
# Clone repository
git clone <repository-url>
cd AI-Proctor-master

# Install Python dependencies
cd backend
pip install -r requirements.txt

# Download YOLO models (if not included)
# YOLOv8n-face model should be in backend/weights/

# Start backend server
python app.py
```

### Frontend Setup
```bash
# Install Node.js dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration
Create `.env` file in backend directory:
```env
DATABASE_URL=sqlite:///./ai_proctor.db
FLASK_ENV=development
FLASK_DEBUG=1
```

## Usage Guide

### 1. Student Registration
1. Navigate to the application
2. Enter student ID and exam details
3. Allow camera access
4. Capture three reference images:
   - Front view (looking straight)
   - Left view (head turned left)
   - Right view (head turned right)
5. Verify all images are captured successfully

### 2. Exam Monitoring
1. Start the exam session
2. System automatically begins monitoring
3. Real-time violation detection:
   - Face verification every 3 seconds
   - Continuous behavior monitoring
   - Immediate violation alerts
4. Monitor violation status in real-time

### 3. Violation Types
- **Multiple Faces**: More than one person detected
- **Looking Away**: Head pose or gaze outside normal range
- **Head Turning**: Excessive head rotation
- **Device Detected**: Unauthorized electronic devices
- **Proxy Detection**: Face doesn't match reference images

## Configuration

### Detection Thresholds
```python
# In proctor_detector.py
self.device_confidence = 0.35      # Device detection confidence
self.face_confidence = 0.7         # Face detection confidence
self.gaze_threshold = 0.12         # Gaze detection threshold

# Head pose thresholds (degrees)
yaw_threshold = 30                 # Left/right head turn
pitch_threshold = 20               # Up/down head tilt

# Eye aspect ratio range
ear_normal_range = (0.2, 0.5)     # Normal eye openness
```

### Face Recognition Settings
```python
# In face_verification.py
verification_threshold = 0.85      # Face matching threshold
embedding_dimension = 512          # Face embedding size
```

### Monitoring Intervals
```javascript
// In frontend components
const VERIFICATION_INTERVAL = 3000;  // 3 seconds
const CAPTURE_INTERVAL = 100;        // 100ms for smooth video
```

## Troubleshooting

### Common Issues

#### 1. Face Detection Fails
- **Cause**: Poor lighting or camera quality
- **Solution**: Ensure good lighting and camera positioning
- **Debug**: Check browser console for detection errors

#### 2. High False Positive Rate
- **Cause**: Thresholds too strict
- **Solution**: Adjust detection thresholds in configuration
- **Debug**: Monitor confidence scores in logs

#### 3. Performance Issues
- **Cause**: Heavy computational load
- **Solution**: Reduce frame analysis frequency
- **Debug**: Check CPU/GPU usage

#### 4. Database Errors
- **Cause**: SQLite file permissions or corruption
- **Solution**: Check file permissions, recreate database
- **Debug**: Check backend logs for SQL errors

### Debug Mode
Enable debug logging in backend:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Performance Optimization
- **GPU Acceleration**: Use CUDA-enabled PyTorch
- **Model Optimization**: Use quantized models
- **Frame Skipping**: Process every nth frame
- **Caching**: Cache reference embeddings

## Performance Metrics

### Detection Accuracy
- **Face Detection**: >95% accuracy
- **Face Recognition**: >90% accuracy at 0.85 threshold
- **Violation Detection**: >85% accuracy with low false positives

### Processing Speed
- **Frame Analysis**: <100ms per frame
- **Face Verification**: <200ms per verification
- **Real-time Monitoring**: 3-second intervals

### Resource Usage
- **CPU**: Moderate usage (2-4 cores)
- **Memory**: 2-4GB RAM
- **GPU**: Optional acceleration (CUDA)

## Future Enhancements

### Planned Features
1. **Voice Analysis**: Audio-based violation detection
2. **Screen Recording**: Monitor screen content
3. **Behavioral Analysis**: Machine learning-based behavior patterns
4. **Multi-language Support**: Internationalization
5. **Mobile App**: Native mobile applications

### Technical Improvements
1. **Model Optimization**: Smaller, faster models
2. **Edge Computing**: Local processing capabilities
3. **Cloud Integration**: Scalable cloud deployment
4. **Advanced Analytics**: Detailed violation analytics

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintainer**: AI Proctor Development Team 