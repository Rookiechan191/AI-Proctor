import cv2
import numpy as np
from ultralytics import YOLO
import time
from face_verification import FaceVerificationService
from detection import detect_face_from_base64
import base64
import io
from PIL import Image

class HybridVerificationService:
    def __init__(self):
        self.yolo_detector = YOLO('yolov8n.pt')
        self.face_verifier = FaceVerificationService()
        self.person_class = 0  # YOLO class for person
        self.face_class = 0    # YOLO class for face
        self.person_confidence = 0.5
        self.face_confidence = 0.7
        
        # Initialize MediaPipe Face Mesh for detailed face analysis
        import mediapipe as mp
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=3,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        
        # Key facial landmarks for head pose estimation
        self.pose_landmarks = [33, 263, 1, 61, 291, 199]  # Nose, left eye, right eye, left mouth, right mouth, chin
        
        # Eye landmarks for looking away detection
        self.left_eye = [33, 133]  # Left eye outer and inner corners
        self.right_eye = [362, 263]  # Right eye outer and inner corners
        self.eye_top = [159, 386]  # Top of left and right eyes
        self.eye_bottom = [145, 374]  # Bottom of left and right eyes
        
        # Tracking state
        self.tracked_person_id = None
        self.person_last_seen = None
        self.person_disappeared = False
        self.face_verification_required = False
        self.last_verification_time = 0
        self.verification_cooldown = 5  # seconds
        
        # Person tracking history
        self.person_tracking_history = {}
        
        # Device detection temporal tracking
        self.device_detection_history = {}
        self.device_min_duration = 0.5  # Minimum seconds device must be visible
        self.device_confidence_threshold = 0.3
        self.device_classes = {67: 'cell phone', 73: 'laptop', 62: 'monitor/tv'}
        
        # Multiple people detection temporal tracking
        self.multiple_people_detection_history = {
            'first_detected': None,
            'last_detected': None,
            'total_detections': 0,
            'consecutive_frames': 0,
            'violation_triggered': False
        }
        self.multiple_people_min_duration = 1.0  # Adjusted: Minimum seconds multiple people must be visible
        self.multiple_people_confidence_threshold = 0.3  # Lowered: Confidence for multiple people
        
        self.person_id_counter = 0
        self.person_id_map = {}  # Maps bbox center to ID
        self.original_student_id = None  # Preserved original student's person ID
        
    def _pil_to_base64(self, pil_image):
        """Convert PIL image to base64 string."""
        buffer = io.BytesIO()
        pil_image.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_str}"
    
    def _detect_person_and_face(self, frame):
        """Detect person and face objects in the frame."""
        results = self.yolo_detector(frame)
        
        persons = []
        faces = []
        
        for result in results:
            for box in result.boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                bbox = box.xyxy[0].cpu().numpy()
                
                if cls == self.person_class and conf > self.person_confidence:
                    persons.append({
                        'bbox': bbox,
                        'confidence': conf,
                        'center': ((bbox[0] + bbox[2])/2, (bbox[1] + bbox[3])/2)
                    })
                elif cls == self.face_class and conf > self.face_confidence:
                    faces.append({
                        'bbox': bbox,
                        'confidence': conf
                    })
        
        return persons, faces
    
    def _detect_comprehensive_violations(self, frame, violations):
        """
        Detect comprehensive violations including multiple faces, looking away, head turning, and devices.
        """
        try:
            # Detect faces and devices using YOLO
            yolo_results = self.yolo_detector(frame)
            
            # Count faces detected by YOLO
            face_count = 0
            face_boxes = []
            current_time = time.time()
            
            # Track current frame device detections
            current_frame_devices = set()
            
            for result in yolo_results:
                for box in result.boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    # Check for faces with higher confidence
                    if cls == 0 and conf > 0.7:  # YOLO class 0 is face
                        face_count += 1
                        face_boxes.append(box.xyxy[0])  # Store face box coordinates
                        
                        # Get face region for detailed analysis
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        face_region = frame[y1:y2, x1:x2]
                        
                        # Process face region with MediaPipe for detailed analysis
                        if face_region.size > 0:  # Check if face region is valid
                            rgb_face = cv2.cvtColor(face_region, cv2.COLOR_BGR2RGB)
                            face_results = self.face_mesh.process(rgb_face)
                            
                            if face_results.multi_face_landmarks:
                                for face_landmarks in face_results.multi_face_landmarks:
                                    # Check head pose
                                    pitch, yaw, roll = self._get_head_pose(face_landmarks)
                                    print(f"[DEBUG] Head pose - Yaw: {yaw:.1f}°, Pitch: {pitch:.1f}°, Roll: {roll:.1f}°")
                                    if abs(yaw) > 30 or abs(pitch) > 20:  # Thresholds in degrees
                                        violations['head_turning'] = True
                                        print(f"[DEBUG] Head turning detected - Yaw: {yaw:.1f}°, Pitch: {pitch:.1f}°")

                                    # Check gaze direction
                                    looking_away_result = self._is_looking_away(face_landmarks, self.left_eye, self.right_eye, self.eye_top, self.eye_bottom)
                                    if looking_away_result:
                                        violations['looking_away'] = True
                                        print(f"[DEBUG] Looking away violation triggered")
                    
                    # Check for devices with temporal tracking
                    elif cls in self.device_classes and conf > self.device_confidence_threshold:
                        device_name = self.device_classes[cls]
                        current_frame_devices.add(device_name)
                        print(f"[DEBUG] Device detected: {device_name} (confidence: {conf:.2f})")
                        
                        # Update device detection history
                        if device_name not in self.device_detection_history:
                            self.device_detection_history[device_name] = {
                                'first_detected': current_time,
                                'last_detected': current_time,
                                'total_detections': 1,
                                'consecutive_frames': 1
                            }
                            print(f"[DEBUG] New device tracking started: {device_name}")
                        else:
                            # Update existing device tracking
                            device_track = self.device_detection_history[device_name]
                            device_track['last_detected'] = current_time
                            device_track['total_detections'] += 1
                            device_track['consecutive_frames'] += 1
                            print(f"[DEBUG] Device tracking updated: {device_name} (consecutive: {device_track['consecutive_frames']})")
            
            # Check for devices that were detected before but not in current frame
            devices_to_remove = []
            for device_name, device_track in self.device_detection_history.items():
                if device_name not in current_frame_devices:
                    # Device not detected in current frame, reset consecutive count
                    device_track['consecutive_frames'] = 0
                    
                    # If device hasn't been detected for too long, remove from history
                    if current_time - device_track['last_detected'] > 3.0:  # 3 seconds timeout
                        devices_to_remove.append(device_name)
            
            # Remove expired devices
            for device_name in devices_to_remove:
                del self.device_detection_history[device_name]
            
            # Check if any device has been detected for minimum duration
            for device_name, device_track in self.device_detection_history.items():
                detection_duration = current_time - device_track['first_detected']
                print(f"[DEBUG] Device {device_name}: duration={detection_duration:.1f}s, consecutive={device_track['consecutive_frames']}")
                if detection_duration >= self.device_min_duration:
                    violations['device_detected'] = True
                    print(f"[WARNING] Device violation: {device_name} detected for {detection_duration:.1f}s")
                    break

            # Set multiple faces violation only if we have clear evidence of multiple faces
            if face_count > 1:
                # Additional check: verify that faces are not too close to each other
                # (to avoid false positives from face detection artifacts)
                is_multiple_faces = True
                for i in range(len(face_boxes)):
                    for j in range(i + 1, len(face_boxes)):
                        box1 = face_boxes[i]
                        box2 = face_boxes[j]
                        
                        # Calculate distance between face centers
                        center1 = ((box1[0] + box1[2])/2, (box1[1] + box1[3])/2)
                        center2 = ((box2[0] + box2[2])/2, (box2[1] + box2[3])/2)
                        distance = math.sqrt((center1[0] - center2[0])**2 + (center1[1] - center2[1])**2)
                        
                        # If faces are too close, it might be a false positive
                        if distance < 50:  # Minimum distance threshold in pixels
                            is_multiple_faces = False
                            break
                    
                    if not is_multiple_faces:
                        break
                
                violations['multiple_faces'] = is_multiple_faces
                
        except Exception as e:
            print(f"[ERROR] Comprehensive violation detection failed: {str(e)}")
    
    def _get_head_pose(self, face_landmarks):
        """
        Calculate head pose (pitch, yaw, roll) using 6 key facial points
        """
        import numpy as np
        import cv2
        face_3d = []
        face_2d = []

        for idx in self.pose_landmarks:
            lm = face_landmarks.landmark[idx]
            x, y, z = lm.x, lm.y, lm.z
            face_3d.append([x * 100, y * 100, z * 100])
            face_2d.append([x * 100, y * 100])

        face_2d = np.array(face_2d, dtype=np.float64)
        face_3d = np.array(face_3d, dtype=np.float64)

        # Camera matrix estimation
        focal_length = 500
        center = (100, 100)
        cam_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)

        dist_matrix = np.zeros((4, 1), dtype=np.float64)

        # Solve PnP
        success, rot_vec, trans_vec = cv2.solvePnP(
            face_3d, face_2d, cam_matrix, dist_matrix
        )

        # Get rotational matrix
        rmat, jac = cv2.Rodrigues(rot_vec)

        # Get angles
        angles, mtxR, mtxQ, Qx, Qy, Qz = cv2.RQDecomp3x3(rmat)

        return angles[0], angles[1], angles[2]  # pitch, yaw, roll

    def _is_looking_away(self, face_landmarks, left_eye, right_eye, eye_top, eye_bottom):
        """
        Detect if person is looking away using eye aspect ratio and head pose
        """
        import math
        def get_distance(p1, p2):
            return math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2)

        # Calculate Eye Aspect Ratio (EAR) for both eyes
        left_ear = (
            get_distance(face_landmarks.landmark[eye_top[0]], face_landmarks.landmark[eye_bottom[0]]) /
            get_distance(face_landmarks.landmark[left_eye[0]], face_landmarks.landmark[left_eye[1]])
        )

        right_ear = (
            get_distance(face_landmarks.landmark[eye_top[1]], face_landmarks.landmark[eye_bottom[1]]) /
            get_distance(face_landmarks.landmark[right_eye[0]], face_landmarks.landmark[right_eye[1]])
        )

        # Get head pose
        pitch, yaw, _ = self._get_head_pose(face_landmarks)

        # Combined check for looking away:
        # 1. Significant head turn (yaw)
        # 2. Looking up/down significantly (pitch)
        # 3. Eyes mostly closed or wide open (unusual EAR)
        avg_ear = (left_ear + right_ear) / 2
        normal_ear_range = (0.2, 0.5)  # Normal range for eye aspect ratio

        return (
            abs(yaw) > 30 or  # Head turned too much
            abs(pitch) > 20 or  # Looking too far up/down
            avg_ear < normal_ear_range[0] or  # Eyes too closed
            avg_ear > normal_ear_range[1]  # Eyes too wide
        )
    
    def _assign_person_ids(self, persons):
        # Assign unique IDs to all detected persons based on bbox center proximity
        assigned_ids = []
        for person in persons:
            center = tuple(person['center'])
            # Find closest existing center
            min_dist = float('inf')
            min_id = None
            for prev_center, pid in self.person_id_map.items():
                dist = ((center[0] - prev_center[0])**2 + (center[1] - prev_center[1])**2)**0.5
                if dist < 50:  # Threshold for matching same person
                    if dist < min_dist:
                        min_dist = dist
                        min_id = pid
            if min_id is not None:
                person['id'] = min_id
                assigned_ids.append(min_id)
            else:
                self.person_id_counter += 1
                person['id'] = self.person_id_counter
                assigned_ids.append(self.person_id_counter)
            self.person_id_map[center] = person['id']
        # Remove old IDs not seen in this frame
        self.person_id_map = {center: pid for center, pid in self.person_id_map.items() if pid in assigned_ids}
        return persons

    def process_frame(self, frame, student_id):
        """
        Process a frame and return verification status and violations.
        """
        violations = {
            'person_disappeared': False,
            'identity_mismatch': False,
            'multiple_people': False,
            'multiple_faces': False,
            'looking_away': False,
            'head_turning': False,
            'device_detected': False
        }
        
        verification_result = {
            'person_tracked': False,
            'face_verification_triggered': False,
            'identity_verified': None,
            'message': ''
        }
        
        detection_boxes = {
            'persons': [],
            'faces': []
        }
        
        try:
            # Detect persons and faces
            persons, faces = self._detect_person_and_face(frame)
            persons = self._assign_person_ids(persons)
            
            # Store detection boxes for frontend visualization
            detection_boxes['persons'] = persons
            detection_boxes['faces'] = faces
            
            # Check for multiple people with temporal persistence
            multiple_people_detected = self._detect_multiple_people_with_persistence(persons)
            if multiple_people_detected:
                violations['multiple_people'] = True
                verification_result['message'] = 'Multiple people detected'
                # New logic: Run face verification for all detected persons
                for person in persons:
                    # Extract bounding box
                    bbox = person['bbox']
                    x1, y1, x2, y2 = map(int, bbox)
                    person_region = frame[y1:y2, x1:x2]
                    if person_region.size > 0:
                        # Convert to base64 for face verification
                        try:
                            frame_rgb = cv2.cvtColor(person_region, cv2.COLOR_BGR2RGB)
                            pil_image = Image.fromarray(frame_rgb)
                            frame_base64 = self._pil_to_base64(pil_image)
                            face_result = self.face_verifier.verify_face(student_id, frame_base64)
                            if face_result['success'] and not face_result['verified']:
                                violations['identity_mismatch'] = True
                                verification_result['message'] = 'Identity verification failed - different person detected (multiple people)'
                                break  # No need to check further if a proxy is found
                        except Exception as e:
                            print(f"[ERROR] Face verification for multiple people failed: {str(e)}")
            
            # Comprehensive violation detection using MediaPipe and YOLO
            self._detect_comprehensive_violations(frame, violations)
            
            # Track the main person (largest bbox)
            if persons:
                main_person = max(persons, key=lambda p: (p['bbox'][2] - p['bbox'][0]) * (p['bbox'][3] - p['bbox'][1]))
                main_person_id = main_person['id']
                # On first run, set the original student ID after successful verification
                if self.original_student_id is None:
                    # Run face verification for the first main person
                    x1, y1, x2, y2 = map(int, main_person['bbox'])
                    person_region = frame[y1:y2, x1:x2]
                    if person_region.size > 0:
                        frame_rgb = cv2.cvtColor(person_region, cv2.COLOR_BGR2RGB)
                        pil_image = Image.fromarray(frame_rgb)
                        frame_base64 = self._pil_to_base64(pil_image)
                        face_result = self.face_verifier.verify_face(student_id, frame_base64)
                        if face_result['success'] and face_result['verified']:
                            self.original_student_id = main_person_id
                            self.tracked_person_id = main_person_id
                else:
                    # If the tracked person ID changes, verify the new person
                    if self.tracked_person_id != main_person_id:
                        x1, y1, x2, y2 = map(int, main_person['bbox'])
                        person_region = frame[y1:y2, x1:x2]
                        if person_region.size > 0:
                            frame_rgb = cv2.cvtColor(person_region, cv2.COLOR_BGR2RGB)
                            pil_image = Image.fromarray(frame_rgb)
                            frame_base64 = self._pil_to_base64(pil_image)
                            face_result = self.face_verifier.verify_face(student_id, frame_base64)
                            if face_result['success'] and not face_result['verified']:
                                violations['identity_mismatch'] = True
                                verification_result['message'] = 'Identity verification failed - tracked person changed and does not match reference'
                            elif face_result['success'] and face_result['verified']:
                                self.tracked_person_id = main_person_id
            # Assign person ID and track
            person_id = self.tracked_person_id
            if person_id:
                verification_result['person_tracked'] = True
                verification_result['message'] = f'Tracking person: {person_id}'
            
            # Check if person disappeared
            if self._check_person_disappeared(persons):
                violations['person_disappeared'] = True
                verification_result['message'] = 'Person left camera view'
            
            # Trigger face verification if needed
            if self._should_trigger_face_verification():
                print(f"[DEBUG] Triggering face verification for student {student_id}")
                verification_result['face_verification_triggered'] = True
                
                # Convert frame to base64 for face verification
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(frame_rgb)
                frame_base64 = self._pil_to_base64(pil_image)
                
                # Perform face verification
                print(f"[DEBUG] Calling face_verifier.verify_face()")
                face_result = self.face_verifier.verify_face(student_id, frame_base64)
                print(f"[DEBUG] Face verification result: {face_result}")
                
                if face_result['success']:
                    verification_result['identity_verified'] = face_result['verified']
                    if not face_result['verified']:
                        violations['identity_mismatch'] = True
                        verification_result['message'] = 'Identity verification failed - different person detected'
                    else:
                        verification_result['message'] = 'Identity verified - same person confirmed'
                else:
                    verification_result['message'] = f'Face verification error: {face_result.get("error", "Unknown error")}'
            
        except Exception as e:
            print(f"[ERROR] Hybrid verification failed: {str(e)}")
            verification_result['message'] = f'Verification error: {str(e)}'
        
        return {
            'violations': violations,
            'verification': verification_result,
            'tracked_person_id': self.tracked_person_id,
            'detection_boxes': detection_boxes
        }
    
    def get_tracking_status(self):
        """Get current tracking status."""
        return {
            'tracked_person_id': self.tracked_person_id,
            'person_disappeared': self.person_disappeared,
            'face_verification_required': self.face_verification_required,
            'tracking_history': self.person_tracking_history
        }
    
    def reset_tracking(self):
        """Reset tracking state."""
        self.tracked_person_id = None
        self.person_last_seen = None
        self.person_disappeared = False
        self.face_verification_required = False
        self.person_tracking_history = {}
        self.device_detection_history = {}
        self.multiple_people_detection_history = {
            'first_detected': None,
            'last_detected': None,
            'total_detections': 0,
            'consecutive_frames': 0,
            'violation_triggered': False
        }
        self.person_id_counter = 0
        self.person_id_map = {}
        self.original_student_id = None
        print("[INFO] Tracking state reset")
    
    def get_device_detection_status(self):
        """Get current device detection status for debugging."""
        current_time = time.time()
        status = {
            'active_devices': {},
            'min_duration': self.device_min_duration,
            'confidence_threshold': self.device_confidence_threshold
        }
        
        for device_name, device_track in self.device_detection_history.items():
            detection_duration = current_time - device_track['first_detected']
            time_since_last = current_time - device_track['last_detected']
            
            status['active_devices'][device_name] = {
                'detection_duration': detection_duration,
                'time_since_last_detection': time_since_last,
                'total_detections': device_track['total_detections'],
                'consecutive_frames': device_track['consecutive_frames'],
                'violation_triggered': detection_duration >= self.device_min_duration
            }
        
        return status
    
    def get_multiple_people_detection_status(self):
        """Get current multiple people detection status for debugging."""
        current_time = time.time()
        status = {
            'detection_history': self.multiple_people_detection_history.copy(),
            'min_duration': self.multiple_people_min_duration,
            'confidence_threshold': self.multiple_people_confidence_threshold
        }
        
        if self.multiple_people_detection_history['first_detected']:
            detection_duration = current_time - self.multiple_people_detection_history['first_detected']
            status['detection_duration'] = detection_duration
            status['violation_triggered'] = self.multiple_people_detection_history['violation_triggered']
        else:
            status['detection_duration'] = 0
            status['violation_triggered'] = False
        
        return status

    def _detect_multiple_people_with_persistence(self, persons):
        """
        Detect multiple people with temporal persistence to prevent false positives.
        Returns True only if multiple people are consistently detected for minimum duration.
        """
        current_time = time.time()
        
        # Check if we have multiple people with sufficient confidence
        high_confidence_persons = [p for p in persons if p['confidence'] > self.multiple_people_confidence_threshold]
        
        if len(high_confidence_persons) > 1:
            # Additional validation: check if persons are not too close (false positive from overlapping detections)
            is_valid_multiple = True
            for i in range(len(high_confidence_persons)):
                for j in range(i + 1, len(high_confidence_persons)):
                    person1 = high_confidence_persons[i]
                    person2 = high_confidence_persons[j]
                    
                    # Calculate distance between person centers
                    center1 = person1['center']
                    center2 = person2['center']
                    distance = ((center1[0] - center2[0])**2 + (center1[1] - center2[1])**2)**0.5
                    
                    # Calculate overlap between bounding boxes
                    bbox1 = person1['bbox']
                    bbox2 = person2['bbox']
                    
                    # Calculate intersection
                    x1_i = max(bbox1[0], bbox2[0])
                    y1_i = max(bbox1[1], bbox2[1])
                    x2_i = min(bbox1[2], bbox2[2])
                    y2_i = min(bbox1[3], bbox2[3])
                    
                    if x2_i > x1_i and y2_i > y1_i:
                        intersection = (x2_i - x1_i) * (y2_i - y1_i)
                        area1 = (bbox1[2] - bbox1[0]) * (bbox1[3] - bbox1[1])
                        area2 = (bbox2[2] - bbox2[0]) * (bbox2[3] - bbox2[1])
                        overlap_ratio = intersection / min(area1, area2) if min(area1, area2) > 0 else 0
                        
                        # If persons are too close or have high overlap, it might be a false positive
                        if distance < 80 or overlap_ratio > 0.3:
                            is_valid_multiple = False
                            print(f"[DEBUG] Multiple people detection rejected - distance: {distance:.1f}, overlap: {overlap_ratio:.2f}")
                            break
                
                if not is_valid_multiple:
                    break
            
            if is_valid_multiple:
                # Update detection history
                if self.multiple_people_detection_history['first_detected'] is None:
                    self.multiple_people_detection_history['first_detected'] = current_time
                
                self.multiple_people_detection_history['last_detected'] = current_time
                self.multiple_people_detection_history['total_detections'] += 1
                self.multiple_people_detection_history['consecutive_frames'] += 1
                
                # Check if violation should be triggered
                detection_duration = current_time - self.multiple_people_detection_history['first_detected']
                if (detection_duration >= self.multiple_people_min_duration and 
                    not self.multiple_people_detection_history['violation_triggered']):
                    self.multiple_people_detection_history['violation_triggered'] = True
                    print(f"[WARNING] Multiple people violation triggered after {detection_duration:.1f}s")
                    return True
            else:
                # Reset detection history if validation fails
                self.multiple_people_detection_history['consecutive_frames'] = 0
        else:
            # No multiple people detected, reset consecutive count
            self.multiple_people_detection_history['consecutive_frames'] = 0
            
            # If no multiple people for too long, reset history
            if (self.multiple_people_detection_history['last_detected'] and 
                current_time - self.multiple_people_detection_history['last_detected'] > 3.0):
                self.multiple_people_detection_history = {
                    'first_detected': None,
                    'last_detected': None,
                    'total_detections': 0,
                    'consecutive_frames': 0,
                    'violation_triggered': False
                }
        
        return self.multiple_people_detection_history['violation_triggered'] 

    def _check_person_disappeared(self, persons):
        """Check if the tracked person has disappeared."""
        if self.tracked_person_id is None:
            return False
        
        if not persons:
            # No persons detected, check if this is a disappearance
            current_time = time.time()
            if self.person_last_seen and (current_time - self.person_last_seen) > 2:  # 2 second threshold
                if not self.person_disappeared:
                    self.person_disappeared = True
                    self.face_verification_required = True
                    print(f"[WARNING] Tracked person {self.tracked_person_id} disappeared")
                    print(f"[DEBUG] Setting face_verification_required = True")
                return True
        else:
            # Person detected, update last seen
            if self.person_disappeared:
                print(f"[DEBUG] Person reappeared after disappearance")
            self.person_last_seen = time.time()
            self.person_disappeared = False
        
        return False 