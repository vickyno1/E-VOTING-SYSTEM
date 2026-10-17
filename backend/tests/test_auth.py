import json
import pytest
from app.services.auth_service import AuthService
from app.repositories.user_repository import UserRepository

def test_voter_registration_success(mock_db):
    auth_service = AuthService()
    result = auth_service.register_voter(
        full_name="Alice Student",
        voter_id="STU1001",
        email="alice@college.edu",
        password="ValidPassword1!",
        confirm_password="ValidPassword1!"
    )
    assert result["user"]["voter_id"] == "STU1001"
    assert result["user"]["email"] == "alice@college.edu"
    assert result["user"]["account_status"] == "PENDING_BIOMETRIC"
    assert "enrollment_token" in result

def test_duplicate_voter_id_rejected(mock_db):
    auth_service = AuthService()
    auth_service.register_voter("Alice Student", "STU1001", "alice1@college.edu", "ValidPass1!", "ValidPass1!")
    
    with pytest.raises(ValueError, match="already registered"):
        auth_service.register_voter("Bob Other", "STU1001", "bob@college.edu", "ValidPass1!", "ValidPass1!")

def test_duplicate_email_rejected(mock_db):
    auth_service = AuthService()
    auth_service.register_voter("Alice Student", "STU1001", "alice@college.edu", "ValidPass1!", "ValidPass1!")
    
    with pytest.raises(ValueError, match="already exists"):
        auth_service.register_voter("Alice Duplicate", "STU1002", "alice@college.edu", "ValidPass1!", "ValidPass1!")

def test_password_policy_and_mismatch(mock_db):
    auth_service = AuthService()
    # Mismatch
    with pytest.raises(ValueError, match="Passwords do not match"):
        auth_service.register_voter("Alice", "STU1003", "alice3@college.edu", "ValidPass1!", "DifferentPass1!")

    # Too short
    with pytest.raises(ValueError, match="at least 8 characters"):
        auth_service.register_voter("Alice", "STU1003", "alice3@college.edu", "Short1!", "Short1!")

    # No number
    with pytest.raises(ValueError, match="contain at least one digit"):
        auth_service.register_voter("Alice", "STU1003", "alice3@college.edu", "NoNumberPassword!", "NoNumberPassword!")

def test_login_invalid_password(mock_db):
    auth_service = AuthService()
    auth_service.register_voter("Alice", "STU1001", "alice@college.edu", "CorrectPass1!", "CorrectPass1!")

    with pytest.raises(ValueError, match="Invalid credentials"):
        auth_service.login_step1("STU1001", "WrongPassword!")

def test_unauthenticated_api_access(client):
    res = client.get("/api/voter/dashboard")
    assert res.status_code == 401
    assert "Authentication token is missing" in res.get_json()["message"]
