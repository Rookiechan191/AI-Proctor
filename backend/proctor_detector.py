import cv2
import mediapipe as mp
import numpy as np
from ultralytics import YOLO
import math

class ProctorDetector:
    def __init__(self):
        # Initialize MediaPipe Face Mesh for landmarks
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=3,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

        # Initialize YOLO model for device and face detection
        self.yolo_detector = YOLO('yolov8n.pt')
        self.device_classes = {67: 'cell phone', 73: 'laptop', 62: 'monitor/tv'}
        self.face_class = 0  # YOLO class for face
        self.device_confidence = 0.35
        self.face_confidence = 0.5

        # Gaze detection threshold
        self.gaze_threshold = 0.12

        # Key facial landmarks for head pose estimation
        self.pose_landmarks = [33, 263, 1, 61, 291, 199]  # Nose, left eye, right eye, left mouth, right mouth, chin

        # Eye landmarks
        self.left_eye = [33, 133]  # Left eye outer and inner corners
        self.right_eye = [362, 263]  # Right eye outer and inner corners
        self.eye_top = [159, 386]  # Top of left and right eyes
        self.eye_bottom = [145, 374]  # Bottom of left and right eyes

    def detect_violations(self, frame):
        """
        Detect all violations in a single frame
        Returns a dictionary of violations
        """
        violations = {
            'multiple_faces': False,
            'looking_away': False,
            'head_turning': False,
            'device_detected': False
        }

        # Detect faces and devices using YOLO
        yolo_results = self.yolo_detector(frame)
        
        # Count faces detected by YOLO
        face_count = 0
        for result in yolo_results:
            for box in result.boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                
                # Check for faces
                if cls == self.face_class and conf > self.face_confidence:
                    face_count += 1
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
                                if abs(yaw) > 30 or abs(pitch) > 20:  # Thresholds in degrees
                                    violations['head_turning'] = True

                                # Check gaze direction
                                if self._is_looking_away(face_landmarks):
                                    violations['looking_away'] = True
                
                # Check for devices
                elif cls in self.device_classes and conf > self.device_confidence:
                    violations['device_detected'] = True

        # Set multiple faces violation if more than one face detected
        if face_count > 1:
            violations['multiple_faces'] = True

        return violations

    def _get_head_pose(self, face_landmarks):
        """
        Calculate head pose (pitch, yaw, roll) using 6 key facial points
        """
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

    def _is_looking_away(self, face_landmarks):
        """
        Detect if person is looking away using eye aspect ratio and head pose
        """
        def get_distance(p1, p2):
            return math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2)

        # Calculate Eye Aspect Ratio (EAR) for both eyes
        left_ear = (
            get_distance(face_landmarks.landmark[self.eye_top[0]], face_landmarks.landmark[self.eye_bottom[0]]) /
            get_distance(face_landmarks.landmark[self.left_eye[0]], face_landmarks.landmark[self.left_eye[1]])
        )

        right_ear = (
            get_distance(face_landmarks.landmark[self.eye_top[1]], face_landmarks.landmark[self.eye_bottom[1]]) /
            get_distance(face_landmarks.landmark[self.right_eye[0]], face_landmarks.landmark[self.right_eye[1]])
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