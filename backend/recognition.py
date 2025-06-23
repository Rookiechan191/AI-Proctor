# backend/face_utils/recognition.py

from facenet_pytorch import InceptionResnetV1
import torch
import numpy as np
from PIL import Image
import cv2
import torch.nn.functional as F

class FaceRecognizer:
    def __init__(self):
        self.device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
        self.resnet = InceptionResnetV1(pretrained='vggface2').eval().to(self.device)

    def get_embedding(self, face_img):
        """Convert face image (PIL.Image or np.ndarray) to embedding vector."""
        if face_img is None:
            return None

        # Convert PIL Image to numpy if needed
        if isinstance(face_img, Image.Image):
            face_img = np.array(face_img)

        if face_img.shape[2] == 3 and np.max(face_img) > 1.0:
            face_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)

        # Resize and normalize face image
        face_img = cv2.resize(face_img, (160, 160))
        face_img = face_img.astype(np.float32) / 255.0
        face_img = (face_img - 0.5) / 0.5  # Normalize to [-1, 1]

        # Convert to tensor and get embedding
        face_tensor = torch.from_numpy(face_img).permute(2, 0, 1).unsqueeze(0).to(self.device)
        embedding = self.resnet(face_tensor).detach().cpu().numpy()

        return embedding

    def compare_faces(self, embedding1, embedding2, threshold=0.92):
        """Compare two face embeddings and return True if they match."""
        if embedding1 is None or embedding2 is None:
            return False

        distance = np.linalg.norm(embedding1 - embedding2)
        print(f"[INFO] Face embedding distance: {distance}")
        print(f"[DEBUG] Face distance: {distance}, Threshold: {threshold}")
        return distance < threshold
