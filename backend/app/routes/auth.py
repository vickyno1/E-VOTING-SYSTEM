from flask import Blueprint, request, jsonify, g, make_response
from app.services.auth_service import auth_service
from app.services.face_service import FaceQualityError
from app.middleware.auth import jwt_required
from app.middleware.rate_limit import rate_limit
from app.repositories.user_repository import UserRepository
from app.config import Config

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
@rate_limit(max_requests=10, window_seconds=60)
def register():
    data = request.get_json(silent=True) or {}
    try:
        result = auth_service.register_voter(
            full_name=data.get("full_name"),
            voter_id=data.get("voter_id"),
            email=data.get("email"),
            password=data.get("password"),
            confirm_password=data.get("confirm_password"),
            profile_data=data.get("profile_data")
        )
        return jsonify(result), 201
    except ValueError as e:
        return jsonify({"error": "Validation Error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Server Error", "message": "An unexpected error occurred during registration."}), 500

@auth_bp.route("/enroll-face", methods=["POST"])
def enroll_face():
    data = request.get_json(silent=True) or {}
    image_data = data.get("image")
    consent = data.get("consent", False)
    enrollment_token = data.get("enrollment_token")

    if not image_data:
        return jsonify({"error": "Validation Error", "message": "Face image is required."}), 400
    if not enrollment_token:
        return jsonify({"error": "Validation Error", "message": "Enrollment token is missing."}), 400

    try:
        from app.extensions import decode_jwt_token
        payload = decode_jwt_token(enrollment_token)
        if payload.get("scope") != "face_enrollment":
            return jsonify({"error": "Unauthorized", "message": "Invalid enrollment session."}), 401
        user_id = payload.get("user_id")
    except Exception:
        return jsonify({"error": "Unauthorized", "message": "Enrollment session has expired. Please register again."}), 401

    try:
        result = auth_service.enroll_face(user_id=user_id, image_data=image_data, consent_given=consent)
        resp = make_response(jsonify(result), 200)
        # Set HttpOnly session cookie
        resp.set_cookie(
            "session_token",
            result["token"],
            httponly=True,
            secure=Config.SESSION_COOKIE_SECURE,
            samesite=Config.SESSION_COOKIE_SAMESITE,
            max_age=Config.JWT_EXPIRATION_HOURS * 3600
        )
        return resp
    except FaceQualityError as e:
        return jsonify({"error": "Face Quality Error", "message": str(e)}), 422
    except ValueError as e:
        return jsonify({"error": "Validation Error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Server Error", "message": f"Face enrollment failed: {str(e)}"}), 500

@auth_bp.route("/login", methods=["POST"])
@rate_limit(max_requests=15, window_seconds=60)
def login():
    data = request.get_json(silent=True) or {}
    identifier = data.get("identifier") or data.get("voter_id") or data.get("email")
    password = data.get("password")

    try:
        result = auth_service.login_step1(identifier=identifier, password=password)
        if result.get("step") == "completed":
            resp = make_response(jsonify(result), 200)
            resp.set_cookie(
                "session_token",
                result["token"],
                httponly=True,
                secure=Config.SESSION_COOKIE_SECURE,
                samesite=Config.SESSION_COOKIE_SAMESITE,
                max_age=Config.JWT_EXPIRATION_HOURS * 3600
            )
            return resp
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": "Authentication Failed", "message": str(e)}), 401
    except Exception as e:
        return jsonify({"error": "Server Error", "message": "An unexpected error occurred during login."}), 500

@auth_bp.route("/verify-face", methods=["POST"])
@rate_limit(max_requests=15, window_seconds=60)
def verify_face():
    data = request.get_json(silent=True) or {}
    challenge_token = data.get("challenge_token")
    probe_image = data.get("image")

    if not challenge_token or not probe_image:
        return jsonify({"error": "Validation Error", "message": "Challenge token and face image are required."}), 400

    try:
        result = auth_service.login_step2_verify_face(
            challenge_token=challenge_token,
            probe_image_data=probe_image
        )
        resp = make_response(jsonify(result), 200)
        resp.set_cookie(
            "session_token",
            result["token"],
            httponly=True,
            secure=Config.SESSION_COOKIE_SECURE,
            samesite=Config.SESSION_COOKIE_SAMESITE,
            max_age=Config.JWT_EXPIRATION_HOURS * 3600
        )
        return resp
    except FaceQualityError as e:
        return jsonify({"error": "Face Quality Error", "message": str(e)}), 422
    except ValueError as e:
        return jsonify({"error": "Authentication Failed", "message": str(e)}), 401
    except Exception as e:
        return jsonify({"error": "Server Error", "message": f"Verification failed: {str(e)}"}), 500

@auth_bp.route("/logout", methods=["POST"])
def logout():
    resp = make_response(jsonify({"message": "Successfully logged out."}), 200)
    resp.delete_cookie("session_token")
    return resp

@auth_bp.route("/me", methods=["GET"])
@jwt_required
def get_current_user():
    user_repo = UserRepository()
    user = user_repo.find_by_id(g.current_user["user_id"])
    if not user:
        return jsonify({"error": "Not Found", "message": "User not found."}), 404
    return jsonify({"user": UserRepository.safe_user_dict(user)}), 200
