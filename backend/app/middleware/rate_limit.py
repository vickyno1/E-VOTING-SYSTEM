import time
from functools import wraps
from collections import defaultdict
from flask import request, jsonify

# In-memory rate limiting store: key -> list of timestamps
_rate_limit_store = defaultdict(list)

def rate_limit(max_requests=10, window_seconds=60):
    """
    In-memory sliding window rate limiter decorator.
    Identifies clients by client IP address (or X-Forwarded-For if behind reverse proxy).
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Determine client identifier
            ip = request.headers.get("X-Forwarded-For", request.remote_addr)
            if ip and "," in ip:
                ip = ip.split(",")[0].strip()
            
            endpoint_key = f"{ip}:{request.endpoint}"
            now = time.time()
            cutoff = now - window_seconds

            # Filter out timestamps outside window
            timestamps = [t for t in _rate_limit_store[endpoint_key] if t > cutoff]
            
            if len(timestamps) >= max_requests:
                retry_after = int(window_seconds - (now - timestamps[0])) + 1
                response = jsonify({
                    "error": "Too Many Requests",
                    "message": f"Rate limit exceeded. Maximum {max_requests} attempts permitted per {window_seconds} seconds. Please wait {retry_after}s.",
                    "retry_after": retry_after
                })
                response.status_code = 429
                response.headers["Retry-After"] = retry_after
                return response

            timestamps.append(now)
            _rate_limit_store[endpoint_key] = timestamps

            return f(*args, **kwargs)
        return decorated_function
    return decorator

def reset_rate_limits():
    """Utility function for testing"""
    _rate_limit_store.clear()
