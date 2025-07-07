# Project Documentation

## Overview

This project is an online proctoring and exam platform with real-time face and behavior monitoring, built with a React frontend and a Python FastAPI backend. It uses computer vision to detect violations (like tab switches, fullscreen exits, multiple faces, device detection, etc.) and stores all events in a PostgreSQL database for review.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Backend (FastAPI)](#backend-fastapi)
3. [Frontend (React)](#frontend-react)
4. [Database (PostgreSQL)](#database-postgresql)
5. [Setup & Installation](#setup--installation)
6. [API Endpoints](#api-endpoints)
7. [Violation Detection Logic](#violation-detection-logic)
8. [AI Models, Thresholds, and Detection Logic](#ai-models-thresholds-and-detection-logic)
9. [File Structure](#file-structure)
10. [Environment Variables](#environment-variables)
11. [How to Run](#how-to-run)
12. [Troubleshooting](#troubleshooting)

---

## Architecture

```mermaid
graph TD
  A[User (Browser)] -->|HTTP/REST| B[React Frontend]
  B -->|API Calls| C[FastAPI Backend]
  C -->|SQLAlchemy| D[(PostgreSQL Database)]
  C --> E[Face/Hybrid Verification Services]
```

---

## Backend (FastAPI)

- **Location:** `backend/`
- **Main entry:** `main.py`
- **Key features:**
  - REST API for reporting and retrieving violations
  - Face and hybrid verification using YOLO, MediaPipe, and custom logic
  - Stores violations in PostgreSQL (`report.violations`)
  - Handles image uploads and management

**Key files:**
- `main.py`: FastAPI app, endpoints, DB session management
- `models.py`: SQLAlchemy models (Violation, etc.)
- `face_verification.py`, `hybrid_verification.py`: Computer vision logic
- `detection.py`, `recognition.py`: Supporting detection logic
- `manage_images.py`: Utility for managing face images

---

## Frontend (React)

- **Location:** `src/`
- **Main entry:** `src/App.tsx`
- **Key features:**
  - User authentication and exam flow
  - Real-time webcam feed and face capture
  - Exam rules, timer, and progress
  - Displays detected violations in a results table
  - Communicates with backend via REST API

**Key files:**
- `src/pages/`: Main pages (ExamDetails, FaceRecognition, Quiz, Results, etc.)
- `src/components/`: UI components (WebcamFeed, WarningDialog, ExamTimer, etc.)
- `src/utils/quizSecurity.ts`: Handles tab switch and fullscreen detection

---

## Database (PostgreSQL)

- **Table:** `report.violations`
- **Columns:**  
  - `id` (PK)
  - `student_id`
  - `exam_id`
  - `violation_type`
  - `confidence`
  - `timestamp`
  - `details`
- **Connection:** Managed via SQLAlchemy in `backend/models.py`
- **Remote host:** e.g., `blackbuck-stage.postgres.database.azure.com`

---

## Setup & Installation

### Backend

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. **Set environment variables:**  
   - `DATABASE_URL` (PostgreSQL connection string)
   - Any other required keys (see `.env` or `models.py`)

3. **Run backend:**
   ```bash
   uvicorn main:app --reload
   ```

### Frontend

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run frontend:**
   ```bash
   npm run dev
   ```

---

## API Endpoints

### Violations

- `POST /report_violation`
  - Report a new violation (fields: student_id, exam_id, violation_type, details, confidence)
- `GET /get_violations?student_id=...&exam_id=...`
  - Retrieve all violations for a student and exam

### Hybrid/Face Verification

- `POST /hybrid_analyze`
  - Analyze a webcam frame for violations
- `POST /reset_tracking`
  - Reset tracking state


---

## Violation Detection Logic

- **Tab Switch & Fullscreen Exit:**  
  Detected in frontend (`quizSecurity.ts`), reported to backend.
- **Multiple Faces, Looking Away, Head Turning, Device Detection:**  
  Detected in backend using YOLO, MediaPipe, and custom logic.
- **Duplicate Prevention:**  
  Violations of the same type are not saved more than once every 2 seconds (configurable).

---

## AI Models, Thresholds, and Detection Logic

### Face Verification & Proxy Detection

- **Main Class:** `FaceVerificationService` (in `backend/face_verification.py`)
- **Embedding Model:** `InceptionResnetV1` from `facenet-pytorch` (see `FaceRecognizer` in `backend/recognition.py`)
- **Reference Loading:**
  - `FaceVerificationService.load_reference_images(student_id)` loads and embeds 1-3 reference images per student.
- **Verification Method:**
  - `FaceVerificationService.verify_face(student_id, live_image_base64, threshold=None)`
    - Loads reference embeddings if not already loaded.
    - Detects face in live image, computes embedding.
    - Compares live embedding to each reference embedding using Euclidean distance.
    - Uses adaptive thresholding based on number of reference images.
    - Enhanced logic for 3-angle system (average distance, std deviation, multi-view check).
    - Returns a result dict with `verified`, `best_distance`, `threshold`, and per-view distances.

**Key Code Snippet:**
```python
# backend/face_verification.py
if distance < threshold:
    best_match = True
# Enhanced logic for 3-angle system
if not best_match and len(distances) >= 3:
    avg_distance = np.mean(list(distances.values()))
    std_distance = np.std(list(distances.values()))
    if avg_distance < 0.88 and std_distance < 0.12:
        best_match = True
    # At least 2/3 views close
    close_views = sum(1 for d in distances.values() if d < 0.90)
    if close_views >= 2:
        best_match = True
verified = best_match
```

- **Proxy Detection:**
  - If `verified` is `False`, a proxy violation is logged (different person detected).

---

### Face & Behavior Detection (Hybrid Verification)

- **Main Class:** `HybridVerificationService` (in `backend/hybrid_verification.py`)
- **Object Detection:**
  - Uses `YOLOv8n` (Ultralytics) for person, face, and device detection: `self.yolo_detector = YOLO('yolov8n.pt')`
- **MediaPipe Face Mesh:**
  - Used for head pose and gaze estimation: `self.face_mesh = mp.solutions.face_mesh.FaceMesh(...)`

#### Detection Steps (in `process_frame` method):
1. **Person & Face Detection:**
   - `_detect_person_and_face(frame)`
     - Runs YOLO on the frame.
     - Filters detections by class and confidence.
2. **Multiple People Detection:**
   - `_detect_multiple_people_with_persistence(persons)`
     - Checks for >1 person with confidence >0.3.
     - Ensures faces are at least 50 pixels apart.
     - Requires persistence for 1.0s.
3. **Comprehensive Violations:**
   - `_detect_comprehensive_violations(frame, violations)`
     - Detects multiple faces, head turning, looking away, device detection.
     - **Head Pose:**
       - Uses 6 key landmarks, calculates yaw/pitch.
       - Triggers if `abs(yaw) > 30` or `abs(pitch) > 20`.
     - **Gaze/EAR:**
       - Calculates Eye Aspect Ratio (EAR) for both eyes.
       - Triggers if `avg_ear < 0.2` or `avg_ear > 0.5`.
     - **Device Detection:**
       - Checks for YOLO classes 67, 73, 62 with confidence >0.5.
       - Device must be visible for 1.0s.

**Key Code Snippet:**
```python
# backend/hybrid_verification.py
def _detect_comprehensive_violations(self, frame, violations):
    ...
    if abs(yaw) > 30 or abs(pitch) > 20:
        violations['head_turning'] = True
    if avg_ear < 0.2 or avg_ear > 0.5:
        violations['looking_away'] = True
    if detection_duration >= self.device_min_duration:
        violations['device_detected'] = True
    if face_count > 1 and faces_are_apart:
        violations['multiple_faces'] = True
```

- **Duplicate Prevention:**
  - In `main.py`, before saving a violation:
    ```python
    exists = db.query(Violation).filter(
        Violation.student_id == data.student_id,
        Violation.exam_id == data.exam_id,
        Violation.violation_type == v_type,
        Violation.timestamp >= time_window_start
    ).first()
    if not exists:
        db.add(Violation(...))
    ```
  - This prevents saving the same violation type for the same student/exam more than once every 2 seconds.

---

### Class/Method Reference

- `FaceVerificationService` (face_verification.py)
  - `load_reference_images(student_id)`
  - `verify_face(student_id, live_image_base64, threshold=None)`
- `FaceRecognizer` (recognition.py)
  - `get_embedding(face_img)`
- `HybridVerificationService` (hybrid_verification.py)
  - `process_frame(frame, student_id)`
  - `_detect_person_and_face(frame)`
  - `_detect_multiple_people_with_persistence(persons)`
  - `_detect_comprehensive_violations(frame, violations)`

---

### Example: Full Face Verification Flow

1. Student registers with 1-3 reference images (front, left, right).
2. Reference images are embedded and stored in memory.
3. During the exam, a live frame is captured and sent to the backend.
4. Backend extracts face, computes embedding, and compares to references.
5. If match passes threshold/logic, user is verified; otherwise, a proxy violation is logged.

---

### Example: Full Violation Detection Flow

1. Frontend sends webcam frame to `/hybrid_analyze` endpoint.
2. Backend runs YOLO and MediaPipe on the frame.
3. Checks for multiple faces, head turning, looking away, device detection.
4. If any violation is detected and not recently logged, it is saved to the database.
5. Violations are retrieved and displayed in the frontend results table.

---

## File Structure

```
AIP_Final_Draft-2/
  backend/
    main.py
    models.py
    face_verification.py
    hybrid_verification.py
    ...
  src/
    App.tsx
    pages/
    components/
    utils/
    ...
  public/
  README.md / DOCUMENTATION.md
```

---

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (see `backend/models.py`)
- Other variables as needed for cloud, API keys, etc.

---

## How to Run

1. Start the backend server (FastAPI).
2. Start the frontend (React).
3. Open the app in your browser (usually at `http://localhost:5173` or similar).
4. Use the app to take an exam, and view violations in the results page.

---

## Troubleshooting

- **Database connection issues:**  
  Check `DATABASE_URL`, network, and SSL settings.
- **Violations not appearing:**  
  Check backend logs, database, and frontend grouping logic.
- **Face/Hybrid detection errors:**  
  Ensure all model weights and dependencies are present.


