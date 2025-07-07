from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
import cv2
import numpy as np
import base64
from hybrid_verification import HybridVerificationService
from models import Violation, SessionLocal, Base, engine
from datetime import datetime, timedelta
import pytz
import os
from PIL import Image
import io
from face_verification import FaceVerificationService

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the database
Base.metadata.create_all(bind=engine)

# Initialize services
hybrid_verifier = HybridVerificationService()
face_verifier = FaceVerificationService()

FACE_IMAGES_DIR = 'face_images'
os.makedirs(FACE_IMAGES_DIR, exist_ok=True)
DUPLICATE_WINDOW = 2

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class FaceImageUpload(BaseModel):
    image: str
    student_id: str
    view_type: str

@app.post("/upload_face_image")
async def upload_face_image(data: FaceImageUpload):
    try:
        image_data = data.image.split(',')[1]
        image_bytes = base64.b64decode(image_data)

        image = Image.open(io.BytesIO(image_bytes))
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{data.student_id}_{data.view_type}_{timestamp}.png"
        filepath = os.path.join(FACE_IMAGES_DIR, filename)
        image.save(filepath)

        return {"success": True, "filename": filename, "filepath": filepath}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_face_images")
async def get_face_images(student_id: str):
    try:
        images = []
        for filename in os.listdir(FACE_IMAGES_DIR):
            if filename.startswith(f"{student_id}_"):
                filepath = os.path.join(FACE_IMAGES_DIR, filename)
                stat = os.stat(filepath)
                images.append({
                    'filename': filename,
                    'view_type': filename.split('_')[1],
                    'timestamp': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    'size': stat.st_size
                })
        images.sort(key=lambda x: x['timestamp'], reverse=True)
        return {"success": True, "images": images}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/get_violations")
async def get_violations(student_id: str, exam_id: str, db: Session = Depends(get_db)):
    try:
        violations = db.query(Violation).filter(
            Violation.student_id == student_id,
            Violation.exam_id == exam_id
        ).order_by(Violation.timestamp.desc()).all()

        return {
            "success": True,
            "violations": [
                {
                    "type": v.violation_type,
                    "confidence": v.confidence,
                    "timestamp": v.timestamp.isoformat(),
                    "details": v.details
                } for v in violations
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ReportViolationRequest(BaseModel):
    student_id: str
    exam_id: str
    violation_type: str
    details: str = ""
    confidence: float = 1.0

@app.post("/report_violation")
async def report_violation(data: ReportViolationRequest, db: Session = Depends(get_db)):
    try:
        violation = Violation(
            student_id=data.student_id,
            exam_id=data.exam_id,
            violation_type=data.violation_type,
            details=data.details,
            confidence=data.confidence
        )
        db.add(violation)
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class FaceVerificationRequest(BaseModel):
    student_id: str
    image: str

@app.post("/verify_face")
async def verify_face(data: FaceVerificationRequest):
    try:
        result = face_verifier.verify_face(data.student_id, data.image)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/face_verification_status")
async def face_verification_status(student_id: str):
    try:
        status = face_verifier.get_verification_status(student_id)
        return {"success": True, "status": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class LoadReferenceRequest(BaseModel):
    student_id: str

@app.post("/load_reference_images")
async def load_reference_images(data: LoadReferenceRequest):
    try:
        success = face_verifier.load_reference_images(data.student_id)
        return {
            "success": success,
            "message": "Reference images loaded successfully" if success else "Failed to load reference images"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class HybridAnalyzeRequest(BaseModel):
    image: str
    student_id: str
    exam_id: str

@app.post("/hybrid_analyze")
async def hybrid_analyze(data: HybridAnalyzeRequest, db: Session = Depends(get_db)):
    try:
        image_bytes = base64.b64decode(data.image.split(',')[1])
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Use hybrid verification
        result = hybrid_verifier.process_frame(frame, data.student_id)
        
        current_time = datetime.now(pytz.timezone('Asia/Kolkata'))
        time_window_start = current_time - timedelta(seconds=DUPLICATE_WINDOW)
        
        # Check for violations and add to database
        violations = result['violations']
        for v_type, is_violation in violations.items():
            if is_violation:
                exists = db.query(Violation).filter(
                    Violation.student_id == data.student_id,
                    Violation.exam_id == data.exam_id,
                    Violation.violation_type == v_type,
                    Violation.timestamp >= time_window_start
                ).first()
                if not exists:
                    db.add(Violation(
                        student_id=data.student_id,
                        exam_id=data.exam_id,
                        violation_type=v_type,
                        confidence=0.8,
                        details=f"Hybrid detection: {v_type}",
                        timestamp=current_time
                    ))
        
        db.commit()
        
        return {
            "success": True, 
            "violations": violations,
            "verification": result['verification'],
            "tracked_person_id": result['tracked_person_id']
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tracking_status")
async def get_tracking_status():
    try:
        status = hybrid_verifier.get_tracking_status()
        return {"success": True, "status": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset_tracking")
async def reset_tracking():
    try:
        hybrid_verifier.reset_tracking()
        return {"success": True, "message": "Tracking reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/device_detection_status")
async def get_device_detection_status():
    """Get current device detection status for debugging."""
    try:
        status = hybrid_verifier.get_device_detection_status()
        return {"success": True, "status": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/multiple_people_detection_status")
async def get_multiple_people_detection_status():
    """Get current multiple people detection status for debugging."""
    try:
        status = hybrid_verifier.get_multiple_people_detection_status()
        return {"success": True, "status": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))