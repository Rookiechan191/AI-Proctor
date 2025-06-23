# Face Verification System

This document explains the real-time face verification system that checks if the person taking the exam is the same person who registered.

## Overview

The face verification system uses:
- **YOLOv8n-face** for face detection
- **FaceNet** (InceptionResnetV1) for face recognition
- **Real-time webcam feed** for live verification

## How It Works

1. **Registration Phase**: User captures 3 reference images (front, left, right views)
2. **Storage**: Images are saved to `face_images/` directory
3. **Embedding Generation**: Reference images are processed to create face embeddings
4. **Live Verification**: During exam, webcam feed is continuously checked against reference embeddings
5. **Verification Result**: System shows if the current person matches the registered person

## File Structure

```
backend/
├── detection.py              # Face detection using YOLOv8n
├── recognition.py            # Face recognition using FaceNet
├── face_verification.py      # Main verification service
├── weights/
│   └── yolov8n-face.pt      # YOLOv8 face detection model
├── face_images/             # Directory for stored reference images
├── test_face_verification.py # Test script
└── README_FACE_VERIFICATION.md # This file
```

## API Endpoints

### 1. Upload Reference Images
- **URL**: `POST /upload_face_image`
- **Purpose**: Save reference images during registration
- **Request**:
  ```json
  {
    "image": "data:image/png;base64,...",
    "student_id": "student123",
    "view_type": "front"
  }
  ```

### 2. Real-time Face Verification
- **URL**: `POST /verify_face`
- **Purpose**: Verify live webcam feed against reference images
- **Request**:
  ```json
  {
    "student_id": "student123",
    "image": "data:image/jpeg;base64,..."
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "verified": true,
    "match_count": 2,
    "total_references": 3,
    "average_distance": 0.85,
    "distances": {
      "front": 0.82,
      "left": 0.88,
      "right": 0.85
    },
    "threshold": 0.92
  }
  ```

### 3. Verification Status
- **URL**: `GET /face_verification_status?student_id=student123`
- **Purpose**: Check if reference images are loaded

### 4. Load Reference Images
- **URL**: `POST /load_reference_images`
- **Purpose**: Manually load reference images for a student

## Frontend Integration

The `WebcamFeed` component now includes:
- **Real-time face verification** every 3 seconds
- **Visual indicators** showing verification status
- **Automatic loading** of reference images

### Verification Status Display
- 🟢 **Green**: Identity verified
- 🔴 **Red**: Identity not verified or error

## Configuration

### Threshold Settings
- **Default threshold**: 0.92 (92% similarity)
- **Minimum matches**: 2 out of 3 reference images
- **Verification interval**: 3 seconds

### Model Settings
- **Face detection confidence**: 0.5
- **Face crop size**: 160x160 pixels
- **Embedding dimension**: 512 (FaceNet output)

## Testing

Run the test script to verify everything works:

```bash
python3 test_face_verification.py
```

This will test:
- Model file availability
- Face detection functionality
- Face recognition functionality
- Verification service initialization

## Troubleshooting

### Common Issues

1. **"No reference images found"**
   - Ensure user has completed face registration
   - Check `face_images/` directory for student's images

2. **"No face detected in live image"**
   - Ensure good lighting
   - Position face clearly in camera view
   - Check camera permissions

3. **"Failed to compute embedding"**
   - Check if PyTorch and FaceNet are properly installed
   - Verify model files are present

4. **Low verification accuracy**
   - Adjust threshold in `face_verification.py`
   - Ensure reference images are high quality
   - Check lighting conditions during registration

### Performance Optimization

- **GPU acceleration**: System automatically uses CUDA if available
- **Verification frequency**: Adjust interval in `WebcamFeed.tsx`
- **Image quality**: Lower JPEG quality for faster processing

## Security Features

- **Multiple reference views**: Requires 2/3 matches for verification
- **Distance-based matching**: Uses Euclidean distance between embeddings
- **Real-time monitoring**: Continuous verification during exam
- **Error handling**: Graceful degradation on detection failures

## Dependencies

Required Python packages:
```
torch>=2.0.0
facenet-pytorch>=2.5.0
ultralytics>=8.0.0
opencv-python>=4.8.0
numpy>=1.24.0
Pillow>=10.0.0
```

## Usage Flow

1. **Start backend server**:
   ```bash
   python3 app.py
   ```

2. **Complete face registration** in the main app
3. **Start exam** - face verification begins automatically
4. **Monitor verification status** in webcam feed
5. **View verification results** in real-time

The system provides continuous identity verification to ensure exam integrity. 