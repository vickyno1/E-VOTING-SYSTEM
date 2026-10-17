from functools import wraps
from flask import request, jsonify, g
from app.extensions import decode_jwt_token

def jwt_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        # Check Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        elif request.cookies.get("session_token"):
            token = request.cookies.get("session_token")

        if not token:
            return jsonify({"error": "Unauthorized", "message": "Authentication token is missing."}), 401

        try:
            payload = decode_jwt_token(token)
            if payload.get("scope") != "authenticated":
                return jsonify({"error": "Unauthorized", "message": "Invalid token scope."}), 401
            g.current_user = payload
        except Exception as e:
            return jsonify({"error": "Unauthorized", "message": "Token is invalid or expired."}), 401

        return f(*args, **kwargs)
    return decorated_function
