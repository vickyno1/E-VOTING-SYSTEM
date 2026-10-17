from functools import wraps
from flask import jsonify, g

def roles_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user = getattr(g, "current_user", None)
            if not current_user:
                return jsonify({"error": "Unauthorized", "message": "Authentication required."}), 401
            
            user_role = current_user.get("role")
            if user_role not in allowed_roles:
                return jsonify({
                    "error": "Forbidden",
                    "message": f"Access denied. Required role: {', '.join(allowed_roles)}."
                }), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator
