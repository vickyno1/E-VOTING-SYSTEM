import pytest
import numpy as np
from app.services.face_service import FaceService, FaceQualityError

def test_cosine_similarity_identical_vectors():
    service = FaceService()
    vec = [0.5, 0.5, 0.5, 0.5]
    sim = service.compute_similarity(vec, vec)
    assert pytest.approx(sim, 0.001) == 1.0

def test_cosine_similarity_orthogonal_vectors():
    service = FaceService()
    vec1 = [1.0, 0.0, 0.0]
    vec2 = [0.0, 1.0, 0.0]
    sim = service.compute_similarity(vec1, vec2)
    assert pytest.approx(sim, 0.001) == 0.0

def test_quality_check_low_resolution():
    service = FaceService()
    # Image smaller than 120x120
    small_img = np.zeros((100, 100, 3), dtype=np.uint8)
    with pytest.raises(FaceQualityError, match="Image resolution too low"):
        service.assess_image_quality(small_img)

def test_quality_check_too_dark():
    service = FaceService()
    # Brightness < 35
    dark_img = np.full((150, 150, 3), 10, dtype=np.uint8)
    with pytest.raises(FaceQualityError, match="Image is too dark"):
        service.assess_image_quality(dark_img)

def test_quality_check_overexposed():
    service = FaceService()
    # Brightness > 235
    bright_img = np.full((150, 150, 3), 250, dtype=np.uint8)
    with pytest.raises(FaceQualityError, match="Image is overexposed"):
        service.assess_image_quality(bright_img)

def test_verify_face_match_and_mismatch(monkeypatch):
    service = FaceService(threshold=0.363)
    mock_vector = [1.0, 0.0, 0.0, 0.0]
    different_vector = [0.0, 1.0, 0.0, 0.0]

    # Mock extract_feature
    monkeypatch.setattr(service, "detect_and_extract_feature", lambda img: mock_vector)

    # Identical should match
    is_match, score = service.verify_face(mock_vector, "dummy_data")
    assert is_match is True
    assert score > 0.9

    # Different vector should fail
    monkeypatch.setattr(service, "detect_and_extract_feature", lambda img: different_vector)
    is_match, score = service.verify_face(mock_vector, "dummy_data")
    assert is_match is False
    assert score < service.threshold
