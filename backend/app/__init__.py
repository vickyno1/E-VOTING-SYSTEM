from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.extensions import init_db_indexes

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure CORS for configured origins with credentials (cookies)
    CORS(
        app,
        resources={r"/api/*": {"origins": [config_class.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"]}},
        supports_credentials=True
    )

    # Ensure database indexes are created
    try:
        init_db_indexes()
    except Exception as e:
        app.logger.warning(f"Could not initialize DB indexes on startup: {e}")

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.voter import voter_bp
    from app.routes.voting import voting_bp
    from app.routes.staff import staff_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(voter_bp)
    app.register_blueprint(voting_bp)
    app.register_blueprint(staff_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "Secure E-Voting Backend",
            "version": "1.0.0"
        }), 200

    @app.errorhandler(404)
    def not_found_handler(e):
        return jsonify({"error": "Not Found", "message": "The requested API endpoint does not exist."}), 404

    @app.errorhandler(413)
    def request_entity_too_large(e):
        return jsonify({"error": "Payload Too Large", "message": "Uploaded image exceeds maximum allowed size (5MB)."}), 413

    @app.errorhandler(500)
    def internal_error_handler(e):
        return jsonify({"error": "Internal Server Error", "message": "An internal server error occurred."}), 500

    return app
