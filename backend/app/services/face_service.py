import base64
import os
import cv2
import numpy as np
from app.config import Config

class FaceQualityError(Exception):
    pass

class FaceService:
    def __init__(self, detector_path=None, recognizer_path=None, threshold=None):
        self.detector_path = detector_path or Config.FACE_DETECTOR_PATH
        self.recognizer_path = recognizer_path or Config.FACE_RECOGNIZER_PATH
        self.threshold = threshold if threshold is not None else Config.FACE_SIMILARITY_THRESHOLD
        self.model_version = "OpenCV_SFace_v1"
        self._detector = None
        self._recognizer = None

    def _get_detector(self, width=320, height=320):
        if not os.path.exists(self.detector_path):
            raise FileNotFoundError(f"Face detector model not found at {self.detector_path}")
        # Always update input size
        detector = cv2.FaceDetectorYN.create(
            self.detector_path,
            "",
            (width, height),
            score_threshold=0.7,
            nms_threshold=0.3,
            top_k=5000
        )
        return detector

    def _get_recognizer(self):
        if self._recognizer is None:
            if not os.path.exists(self.recognizer_path):
                raise FileNotFoundError(f"Face recognizer model not found at {self.recognizer_path}")
            self._recognizer = cv2.FaceRecognizerSF.create(self.recognizer_path, "")
        return self._recognizer

    def decode_image(self, image_data):
        """
        Accepts base64 data URI string or raw bytes and returns cv2 BGR image.
        """
        if isinstance(image_data, str):
            if "base64," in image_data:
                image_data = image_data.split("base64,")[1]
            try:
                raw_bytes = base64.b64decode(image_data)
            except Exception as e:
                raise ValueError("Invalid base64 image data") from e
        elif isinstance(image_data, (bytes, bytearray)):
            raw_bytes = image_data
        else:
            raise ValueError("Unsupported image data type")

        np_arr = np.frombuffer(raw_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image. Ensure image is in a valid format (JPEG, PNG).")
        return img

    def assess_image_quality(self, img):
        """
        Basic quality assessment: check minimum dimensions and brightness.
        """
        h, w = img.shape[:2]
        if h < 120 or w < 120:
            raise FaceQualityError(f"Image resolution too low ({w}x{h}). Minimum required is 120x120.")
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        mean_brightness = np.mean(gray)
        if mean_brightness < 35:
            raise FaceQualityError("Image is too dark. Please ensure adequate lighting.")
        if mean_brightness > 235:
            raise FaceQualityError("Image is overexposed/too bright. Please reduce glare.")

    def detect_and_extract_feature(self, image_input):
        """
        Detects face, validates exactly one face is present, checks quality,
        aligns face and extracts 128-dimensional embedding vector.
        """
        img = self.decode_image(image_input)
        self.assess_image_quality(img)

        h, w = img.shape[:2]
        detector = self._get_detector(w, h)
        _, faces = detector.detect(img)

        if faces is None or len(faces) == 0:
            raise FaceQualityError("No face detected. Please face the camera directly in good lighting.")
        
        if len(faces) > 1:
            raise FaceQualityError(f"Multiple faces detected ({len(faces)}). Exactly one face must be in view.")

        face = faces[0]
        # Check bounding box size relative to frame
        box_w, box_h = face[2], face[3]
        if box_w < 50 or box_h < 50:
            raise FaceQualityError("Face is too small or too far from the camera. Please move closer.")

        recognizer = self._get_recognizer()
        # Align and crop the face using facial landmarks
        aligned_face = recognizer.alignCrop(img, face)
        # Extract feature embedding (128-d vector)
        feature = recognizer.feature(aligned_face)
        # Flatten and normalize
        feat_vec = feature.flatten()
        norm = np.linalg.norm(feat_vec)
        if norm > 0:
            feat_vec = feat_vec / norm

        return feat_vec.tolist()

    def compute_similarity(self, feature1, feature2):
        """
        Calculates cosine similarity between two feature vectors.
        Returns float between -1.0 and 1.0 (typical match >= 0.363 for SFace).
        """
        vec1 = np.array(feature1, dtype=np.float32).flatten()
        vec2 = np.array(feature2, dtype=np.float32).flatten()

        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        if norm1 == 0 or norm2 == 0:
            return 0.0

        similarity = float(np.dot(vec1, vec2) / (norm1 * norm2))
        return similarity

    def verify_face(self, enrolled_feature, probe_image_input):
        """
        Extracts probe face feature and checks if cosine similarity >= threshold.
        Returns (is_match: bool, similarity: float).
        """
        probe_feature = self.detect_and_extract_feature(probe_image_input)
        similarity = self.compute_similarity(enrolled_feature, probe_feature)
        is_match = similarity >= self.threshold
        return is_match, similarity

face_service = FaceService()
