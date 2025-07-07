import os
import numpy as np
from PIL import Image
import io
import base64 as b64
from detection import detect_face_from_base64
from recognition import FaceRecognizer
import json

class FaceVerificationService:
    def __init__(self):
        self.recognizer = FaceRecognizer()
        self.reference_embeddings = {}
        self.face_images_dir = 'face_images'
        
    def load_reference_images(self, student_id):
        """
        Load reference images for a student and compute embeddings.
        Simplified to work with any available reference images.
        """
        try:
            # Look for reference images in face_images directory
            reference_files = []
            if os.path.exists(self.face_images_dir):
                for filename in os.listdir(self.face_images_dir):
                    if filename.startswith(f"{student_id}_") and filename.endswith('.png'):
                        parts = filename.replace('.png', '').split('_')
                        if len(parts) >= 3:
                            view_type = parts[1]
                            reference_files.append((view_type, os.path.join(self.face_images_dir, filename)))
            
            # Sort by view type to ensure consistent order
            reference_files.sort(key=lambda x: x[0])
            
            if len(reference_files) == 0:
                print(f"[ERROR] No reference images found for student {student_id}")
                return False
            
            # Load and compute embeddings for each reference image
            embeddings = {}
            for view_type, filepath in reference_files:
                try:
                    # Load image
                    ref_image = Image.open(filepath)
                    
                    # Convert to RGB if necessary
                    if ref_image.mode in ('RGBA', 'LA', 'P'):
                        ref_image = ref_image.convert('RGB')
                    
                    # Detect face in reference image
                    face_crop = detect_face_from_base64(self._pil_to_base64(ref_image))
                    if face_crop is None:
                        print(f"[WARNING] No face detected in reference image: {filepath}")
                        # Try to use the original image if face detection fails
                        embedding = self.recognizer.get_embedding(ref_image)
                        if embedding is not None:
                            embeddings[view_type] = embedding
                            print(f"[INFO] Used original image for {view_type} view")
                        continue
                    
                    # Compute embedding
                    embedding = self.recognizer.get_embedding(face_crop)
                    if embedding is not None:
                        embeddings[view_type] = embedding
                        print(f"[INFO] Loaded reference embedding for {view_type} view")
                    
                except Exception as e:
                    print(f"[ERROR] Failed to process reference image {filepath}: {str(e)}")
                    continue
            
            if len(embeddings) >= 1:  # At least 1 reference embedding needed
                self.reference_embeddings[student_id] = embeddings
                print(f"[INFO] Successfully loaded {len(embeddings)} reference embeddings for student {student_id}")
                return True
            else:
                print(f"[ERROR] No valid reference embeddings for student {student_id}")
                return False
                
        except Exception as e:
            print(f"[ERROR] Failed to load reference images for student {student_id}: {str(e)}")
            return False
    
    def _pil_to_base64(self, pil_image):
        """Convert PIL image to base64 string."""
        buffer = io.BytesIO()
        pil_image.save(buffer, format='PNG')
        img_str = b64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_str}"
    
    def verify_face(self, student_id, live_image_base64, threshold=None):
        """
        Enhanced face verification for 3-angle system.
        Uses adaptive thresholds and intelligent matching logic.
        """
        try:
            # Check if reference embeddings are loaded
            if student_id not in self.reference_embeddings:
                print(f"[INFO] Loading reference images for student {student_id}")
                if not self.load_reference_images(student_id):
                    return {
                        'success': False,
                        'error': 'No reference images found for this student',
                        'verified': False
                    }
            
            # Adaptive threshold based on number of reference images
            if threshold is None:
                num_references = len(self.reference_embeddings[student_id])
                if num_references >= 3:
                    threshold = 0.82  # More lenient for 3-angle system
                elif num_references >= 2:
                    threshold = 0.78  # Medium for 2-angle system
                else:
                    threshold = 0.75  # Strict for single angle
                print(f"[DEBUG] Using adaptive threshold: {threshold} (based on {num_references} reference images)")
            
            # Detect face in live image
            face_crop = detect_face_from_base64(live_image_base64)
            if face_crop is None:
                print(f"[DEBUG] No face detected in live image for student {student_id}")
                return {
                    'success': False,
                    'error': 'No face detected in live image',
                    'verified': False
                }
            
            # Compute embedding for live face
            live_embedding = self.recognizer.get_embedding(face_crop)
            if live_embedding is None:
                print(f"[DEBUG] Failed to compute embedding for live face for student {student_id}")
                return {
                    'success': False,
                    'error': 'Failed to compute embedding for live face',
                    'verified': False
                }
            
            # Compare with reference embeddings
            reference_embeddings = self.reference_embeddings[student_id]
            best_match = False
            best_distance = float('inf')
            distances = {}
            
            print(f"[DEBUG] Face verification for student {student_id} - threshold: {threshold}")
            print(f"[DEBUG] Number of reference embeddings: {len(reference_embeddings)}")
            
            # Calculate distances to all reference views
            for view_type, ref_embedding in reference_embeddings.items():
                distance = np.linalg.norm(live_embedding - ref_embedding)
                distances[view_type] = distance
                print(f"[DEBUG] {view_type} view distance: {distance:.4f}, threshold: {threshold}")
                
                if distance < best_distance:
                    best_distance = distance
                
                # If any reference matches well enough, consider it the same person
                if distance < threshold:
                    best_match = True
                    print(f"[DEBUG] Match found with {view_type} view! Distance: {distance:.4f}")
            
            # Enhanced verification logic for 3-angle system
            if not best_match and len(distances) >= 3:
                # Calculate average distance and standard deviation
                avg_distance = np.mean(list(distances.values()))
                std_distance = np.std(list(distances.values()))
                
                print(f"[DEBUG] Enhanced check - Avg distance: {avg_distance:.4f}, Std: {std_distance:.4f}")
                
                # If average distance is reasonable and distances are consistent, it might be the same person
                # with different lighting/angle than reference images
                if avg_distance < 0.88 and std_distance < 0.12:
                    best_match = True
                    print(f"[DEBUG] Enhanced verification passed - consistent distances across all views")
            
            # Additional leniency for 3-angle system
            if not best_match and len(distances) >= 3:
                # Check if at least 2 out of 3 views are reasonably close
                close_views = sum(1 for d in distances.values() if d < 0.90)
                if close_views >= 2:
                    best_match = True
                    print(f"[DEBUG] Multi-view verification passed - {close_views}/3 views are close")
            
            # Determine verification result
            verified = best_match
            
            print(f"[DEBUG] Final verification result: {verified}, best_distance: {best_distance:.4f}")
            if len(distances) >= 3:
                print(f"[DEBUG] All distances: {distances}")
            
            return {
                'success': True,
                'verified': verified,
                'best_distance': float(best_distance),
                'threshold': threshold,
                'message': 'Same person detected' if verified else 'Different person detected',
                'distances': distances if len(distances) >= 3 else None
            }
            
        except Exception as e:
            print(f"[ERROR] Face verification failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'verified': False
            }
    
    def get_verification_status(self, student_id):
        """Get the current verification status for a student."""
        if student_id in self.reference_embeddings:
            return {
                'loaded': True,
                'reference_count': len(self.reference_embeddings[student_id]),
                'reference_views': list(self.reference_embeddings[student_id].keys())
            }
        else:
            return {
                'loaded': False,
                'reference_count': 0,
                'reference_views': []
            } 