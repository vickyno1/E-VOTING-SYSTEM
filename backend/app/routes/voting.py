from flask import Blueprint, request, jsonify, g
from app.middleware.auth import jwt_required
from app.middleware.permissions import roles_required
from app.services.voting_service import voting_service

voting_bp = Blueprint("voting", __name__, url_prefix="/api/voter/elections")

@voting_bp.route("/<election_id>/vote", methods=["POST"])
@jwt_required
@roles_required("voter")
def submit_vote(election_id):
    voter_id = g.current_user["voter_id"]
    data = request.get_json(silent=True) or {}
    candidate_id = data.get("candidate_id")

    if not candidate_id:
        return jsonify({"error": "Validation Error", "message": "Candidate ID must be selected."}), 400

    result = voting_service.cast_vote(
        election_id=election_id,
        voter_id=voter_id,
        candidate_id=candidate_id
    )

    status = result.get("status")

    if status == "vote_recorded":
        return jsonify(result), 200
    elif status == "already_voted":
        return jsonify({"error": "Duplicate Vote", "status": "already_voted", "message": result.get("message")}), 409
    elif status in ("election_not_open", "voter_not_eligible", "invalid_candidate"):
        return jsonify({"error": "Bad Request", "status": status, "message": result.get("message")}), 400
    elif status == "election_not_found":
        return jsonify({"error": "Not Found", "status": status, "message": result.get("message")}), 404
    else:
        return jsonify({"error": "Submission Failed", "status": status, "message": result.get("message")}), 500
