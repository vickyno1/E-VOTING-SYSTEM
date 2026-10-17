import re
import datetime
from argon2.exceptions import VerifyMismatchError
from app.extensions import password_hasher, create_jwt_token, decode_jwt_token
from app.repositories.user_repository import UserRepository
from app.services.face_service import face_service, FaceQualityError
from app.services.audit_service import audit_service

EMAIL_REGEX = re.compile(r"^[\w\.-]+@([\w\.-]+\.)+[\w-]{2,4}$")

class AuthService:
    def __init__(self, user_repo=None):
        self.user_repo = user_repo or UserRepository()

    def validate_password_strength(self, password: str):
        if not password or len(password) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not any(c.isupper() or c.islower() for c in password):
            raise ValueError("Password must contain alphabetic characters.")
        if not any(c.isdigit() for c in password):
            raise ValueError("Password must contain at least one digit.")

    def register_voter(self, full_name: str, voter_id: str, email: str, password: str, confirm_password: str, profile_data=None):
        if not full_name or not full_name.strip():
            raise ValueError("Full name is required.")
        if not voter_id or not voter_id.strip():
            raise ValueError("Voter ID is required.")
        if not email or not email.strip():
            raise ValueError("Email address is required.")
        
        email = email.strip().lower()
        if not EMAIL_REGEX.match(email):
            raise ValueError("Invalid email address format.")
            
        voter_id = voter_id.strip().upper()
        if len(voter_id) < 3 or len(voter_id) > 30:
            raise ValueError("Voter ID must be between 3 and 30 characters.")

        if password != confirm_password:
            raise ValueError("Passwords do not match.")

        self.validate_password_strength(password)

        # Check uniqueness
        if self.user_repo.find_by_voter_id(voter_id):
            raise ValueError("A voter with this Voter ID is already registered.")
        if self.user_repo.find_by_email(email):
            raise ValueError("An account with this email address already exists.")

        # Hash password securely with Argon2id
        hashed_password = password_hasher.hash(password)

        user_data = {
            "voter_id": voter_id,
            "full_name": full_name.strip(),
            "email": email,
            "password_hash": hashed_password,
            "role": "voter", # Hardcoded role to prevent elevation
            "account_status": "PENDING_BIOMETRIC",
            "profile_data": profile_data or {},
            "face_template": None,
            "face_model_version": None,
            "face_enrolled_at": None,
            "biometric_consent_at": None
        }

        user = self.user_repo.create_user(user_data)
        audit_service.log_event(
            actor_id=voter_id,
            action="VOTER_REGISTRATION_INITIATED",
            target_type="user",
            target_id=user["_id"]
        )

        # Issue temporary enrollment token (valid for 30 minutes)
        enrollment_token = create_jwt_token(
            {"user_id": str(user["_id"]), "voter_id": voter_id, "scope": "face_enrollment"},
            expires_in_hours=1
        )

        return {
            "user": UserRepository.safe_user_dict(user),
            "enrollment_token": enrollment_token,
            "message": "Personal details registered successfully. Please proceed to face registration."
        }

    def enroll_face(self, user_id: str, image_data: str, consent_given: bool):
        if not consent_given:
            raise ValueError("Explicit biometric consent is required before face enrollment.")

        user = self.user_repo.find_by_id(user_id)
        if not user:
            raise ValueError("User account not found.")

        # Extract 128-d feature embedding via OpenCV SFace
        feature_vector = face_service.detect_and_extract_feature(image_data)
        model_version = face_service.model_version

        # Update user record
        self.user_repo.update_face_template(user_id, feature_vector, model_version)
        
        # Record consent timestamp
        now = datetime.datetime.now(datetime.timezone.utc)
        self.user_repo.collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"biometric_consent_at": now}}
        )

        audit_service.log_event(
            actor_id=user.get("voter_id"),
            action="VOTER_FACE_ENROLLED",
            target_type="user",
            target_id=user["_id"]
        )

        # Return updated user object and full auth session token
        updated_user = self.user_repo.find_by_id(user_id)
        session_token = create_jwt_token({
            "user_id": str(updated_user["_id"]),
            "voter_id": updated_user["voter_id"],
            "role": updated_user["role"],
            "full_name": updated_user["full_name"],
            "scope": "authenticated"
        })

        return {
            "user": UserRepository.safe_user_dict(updated_user),
            "token": session_token,
            "message": "Face registered successfully. Your account is now active."
        }

    def login_step1(self, identifier: str, password: str):
        """
        Step 1: Verify username/voter_id/email and Argon2 password.
        Returns challenge token for face verification.
        Staff accounts bypass face capture if configured, or can use standard staff auth.
        """
        if not identifier or not password:
            raise ValueError("Identifier and password are required.")

        user = self.user_repo.find_by_identifier(identifier)
        if not user:
            # Generic message to prevent enumeration
            raise ValueError("Invalid credentials or account does not exist.")

        try:
            password_hasher.verify(user["password_hash"], password)
        except VerifyMismatchError:
            audit_service.log_event(
                actor_id=identifier,
                action="LOGIN_PASSWORD_FAILED",
                target_type="user",
                target_id=str(user["_id"])
            )
            raise ValueError("Invalid credentials or account does not exist.")

        # Check if staff
        if user.get("role") == "staff":
            session_token = create_jwt_token({
                "user_id": str(user["_id"]),
                "voter_id": user.get("voter_id", "STAFF"),
                "role": "staff",
                "full_name": user.get("full_name", "Staff Member"),
                "scope": "authenticated"
            })
            audit_service.log_event(
                actor_id=str(user["_id"]),
                action="STAFF_LOGIN_SUCCESS",
                target_type="user",
                target_id=str(user["_id"])
            )
            return {
                "step": "completed",
                "role": "staff",
                "token": session_token,
                "user": UserRepository.safe_user_dict(user)
            }

        # Check if face enrolled
        if not user.get("face_template"):
            enrollment_token = create_jwt_token({
                "user_id": str(user["_id"]),
                "voter_id": user["voter_id"],
                "scope": "face_enrollment"
            }, expires_in_hours=1)
            return {
                "step": "face_enrollment_required",
                "enrollment_token": enrollment_token,
                "message": "Face registration is required before logging in."
            }

        # Issue face verification challenge token (15 mins)
        challenge_token = create_jwt_token({
            "user_id": str(user["_id"]),
            "voter_id": user["voter_id"],
            "scope": "face_verification"
        }, expires_in_hours=1)

        return {
            "step": "face_verification_required",
            "challenge_token": challenge_token,
            "voter_name": user["full_name"],
            "message": "Credentials verified. Please complete face verification."
        }

    def login_step2_verify_face(self, challenge_token: str, probe_image_data: str):
        """
        Step 2: Face verification.
        Compares live probe image feature against stored template.
        """
        try:
            payload = decode_jwt_token(challenge_token)
        except Exception:
            raise ValueError("Face verification session has expired. Please log in again.")

        if payload.get("scope") != "face_verification":
            raise ValueError("Invalid session challenge scope.")

        user = self.user_repo.find_by_id(payload.get("user_id"))
        if not user or not user.get("face_template"):
            raise ValueError("User biometric record not found.")

        enrolled_template = user["face_template"]
        is_match, similarity = face_service.verify_face(enrolled_template, probe_image_data)

        if not is_match:
            audit_service.log_event(
                actor_id=user["voter_id"],
                action="FACE_VERIFICATION_FAILED",
                target_type="user",
                target_id=str(user["_id"]),
                metadata={"similarity": round(similarity, 4), "threshold": face_service.threshold}
            )
            raise ValueError(f"Face verification did not match the registered profile. (Match score: {similarity:.2f})")

        # Face matched! Create full authenticated session token
        session_token = create_jwt_token({
            "user_id": str(user["_id"]),
            "voter_id": user["voter_id"],
            "role": user.get("role", "voter"),
            "full_name": user["full_name"],
            "email": user["email"],
            "scope": "authenticated"
        })

        audit_service.log_event(
            actor_id=user["voter_id"],
            action="VOTER_LOGIN_SUCCESS",
            target_type="user",
            target_id=str(user["_id"]),
            metadata={"similarity": round(similarity, 4)}
        )

        return {
            "token": session_token,
            "user": UserRepository.safe_user_dict(user),
            "message": "Authentication and face verification successful."
        }

auth_service = AuthService()
