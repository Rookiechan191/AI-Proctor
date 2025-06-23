# Face Recognition Image Storage

This document explains how face recognition images are stored in the main application.

## Directory Structure

```
backend/
├── face_images/          # Directory where captured images are stored
├── app.py               # Main Flask application with image upload endpoints
├── manage_images.py     # Utility script to manage stored images
└── README_IMAGES.md     # This file
```

## Image Storage Location

**Directory**: `backend/face_images/`

Images are automatically saved to this directory when users complete the face recognition process in the main application.

## File Naming Convention

Images are saved with the following naming pattern:
```
{student_id}_{view_type}_{timestamp}.png
```

Examples:
- `student123_front_20240621_143022.png`
- `student123_left_20240621_143025.png`
- `student123_right_20240621_143028.png`

## API Endpoints

### Upload Face Image
- **URL**: `POST /upload_face_image`
- **Purpose**: Upload a captured face image
- **Request Body**:
  ```json
  {
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "student_id": "student123",
    "view_type": "front"
  }
  ```

### Get Face Images
- **URL**: `GET /get_face_images?student_id={student_id}`
- **Purpose**: Retrieve all images for a specific student

## Managing Images

Use the `manage_images.py` utility script to manage stored images:

```bash
# List all images
python3 manage_images.py list

# List images for a specific student
python3 manage_images.py student student123

# Show directory information
python3 manage_images.py info
```

## Integration with Frontend

The main application automatically uploads images to the backend when users capture their face photos. 