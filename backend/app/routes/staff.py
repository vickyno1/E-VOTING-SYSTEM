from flask import Blueprint, request, jsonify, g
from app.middleware.auth import jwt_required
from app.middleware.permissions import roles_required
from app.services.election_service import election_service
from app.services.results_service import results_service
from app.services.audit_service import audit_service
from app.repositories.user_repository import UserRepository
from app.repositories.participation_repository import ParticipationRepository

staff_bp = Blueprint("staff", __name__, url_prefix="/api/staff")

@staff_bp.route("/dashboard", methods=["GET"])
@jwt_required
@roles_required("staff")
def get_staff_dashboard():
    user_repo = UserRepository()
    elections = election_service.list_all_elections()
    total_voters = user_repo.count_voters()
    
    open_count = sum(1 for e in elections if e.get("status") == "OPEN")
    draft_count = sum(1 for e in elections if e.get("status") in ("DRAFT", "SCHEDULED"))
    closed_count = sum(1 for e in elections if e.get("status") in ("CLOSED", "RESULTS_PUBLISHED"))

    return jsonify({
        "stats": {
            "total_voters": total_voters,
            "total_elections": len(elections),
            "open_elections": open_count,
            "draft_elections": draft_count,
            "closed_elections": closed_count
        },
        "recent_elections": elections[:5]
    }), 200

@staff_bp.route("/elections", methods=["GET"])
@jwt_required
@roles_required("staff")
def list_elections():
    elections = election_service.list_all_elections()
    part_repo = ParticipationRepository()
    for el in elections:
        el["participation_count"] = part_repo.count_participation(el["election_id"])
    return jsonify({"elections": elections}), 200

@staff_bp.route("/elections", methods=["POST"])
@jwt_required
@roles_required("staff")
def create_election():
    data = request.get_json(silent=True) or {}
    staff_id = g.current_user.get("voter_id", "STAFF")

    try:
        election = election_service.create_election(
            election_id=data.get("election_id"),
            title=data.get("title"),
            description=data.get("description"),
            start_at=data.get("start_at"),
            end_at=data.get("end_at"),
            created_by=staff_id,
            eligibility_rule=data.get("eligibility_rule", "ALL_VOTERS")
        )
        return jsonify({"election": election, "message": "Election created successfully in DRAFT mode."}), 201
    except ValueError as e:
        return jsonify({"error": "Validation Error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Server Error", "message": f"Failed to create election: {str(e)}"}), 500

@staff_bp.route("/elections/<election_id>", methods=["GET"])
@jwt_required
@roles_required("staff")
def get_election(election_id):
    election = election_service.get_election_details(election_id, include_candidates=True)
    if not election:
        return jsonify({"error": "Not Found", "message": "Election not found."}), 404
    part_repo = ParticipationRepository()
    election["participation_count"] = part_repo.count_participation(election_id)
    return jsonify({"election": election}), 200

@staff_bp.route("/elections/<election_id>", methods=["PUT"])
@jwt_required
@roles_required("staff")
def update_election(election_id):
    data = request.get_json(silent=True) or {}
    election = election_service.election_repo.find_by_election_id(election_id)
    if not election:
        return jsonify({"error": "Not Found", "message": "Election not found."}), 404

    if election.get("status") not in ("DRAFT", "SCHEDULED"):
        return jsonify({"error": "Forbidden", "message": "Cannot modify election once opened or closed."}), 403

    allowed_updates = {}
    if "title" in data:
        allowed_updates["title"] = data["title"].strip()
    if "description" in data:
        allowed_updates["description"] = data["description"].strip()
    if "start_at" in data:
        allowed_updates["start_at"] = election_service.parse_iso_datetime(data["start_at"])
    if "end_at" in data:
        allowed_updates["end_at"] = election_service.parse_iso_datetime(data["end_at"])

    election_service.election_repo.update_election(election_id, allowed_updates)
    updated = election_service.get_election_details(election_id)
    return jsonify({"election": updated, "message": "Election updated successfully."}), 200

@staff_bp.route("/elections/<election_id>/candidates", methods=["POST"])
@jwt_required
@roles_required("staff")
def add_candidate(election_id):
    data = request.get_json(silent=True) or {}
    try:
        candidate = election_service.add_candidate(
            election_id=election_id,
            candidate_id=data.get("candidate_id"),
            name=data.get("name"),
            description=data.get("description"),
            photo_url=data.get("photo_url", "")
        )
        return jsonify({"candidate": candidate, "message": "Candidate added successfully."}), 201
    except ValueError as e:
        return jsonify({"error": "Validation Error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Server Error", "message": f"Failed to add candidate: {str(e)}"}), 500

@staff_bp.route("/elections/<election_id>/open", methods=["POST"])
@jwt_required
@roles_required("staff")
def open_election(election_id):
    staff_id = g.current_user.get("voter_id", "STAFF")
    try:
        election = election_service.open_election(election_id, staff_id)
        return jsonify({"election": election, "message": "Election is now OPEN for voting."}), 200
    except ValueError as e:
        return jsonify({"error": "Validation Error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Server Error", "message": f"Failed to open election: {str(e)}"}), 500

@staff_bp.route("/elections/<election_id>/close", methods=["POST"])
@jwt_required
@roles_required("staff")
def close_election(election_id):
    staff_id = g.current_user.get("voter_id", "STAFF")
    try:
        election = election_service.close_election(election_id, staff_id)
        return jsonify({"election": election, "message": "Election is now CLOSED."}), 200
    except ValueError as e:
        return jsonify({"error": "Validation Error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Server Error", "message": f"Failed to close election: {str(e)}"}), 500

@staff_bp.route("/elections/<election_id>/publish-results", methods=["POST"])
@jwt_required
@roles_required("staff")
def publish_results(election_id):
    staff_id = g.current_user.get("voter_id", "STAFF")
    try:
        election = election_service.publish_results(election_id, staff_id)
        return jsonify({"election": election, "message": "Election results published successfully."}), 200
    except ValueError as e:
        return jsonify({"error": "Validation Error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Server Error", "message": f"Failed to publish results: {str(e)}"}), 500

@staff_bp.route("/elections/<election_id>/participation", methods=["GET"])
@jwt_required
@roles_required("staff")
def get_participation(election_id):
    try:
        summary = results_service.get_participation_summary(election_id)
        return jsonify({"participation": summary}), 200
    except ValueError as e:
        return jsonify({"error": "Not Found", "message": str(e)}), 404

@staff_bp.route("/elections/<election_id>/results", methods=["GET"])
@jwt_required
@roles_required("staff")
def get_staff_results(election_id):
    try:
        results = results_service.get_staff_results(election_id)
        return jsonify({"results": results}), 200
    except ValueError as e:
        return jsonify({"error": "Not Found", "message": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": "Forbidden", "message": str(e)}), 403
    except Exception as e:
        return jsonify({"error": "Server Error", "message": f"Failed to compute results: {str(e)}"}), 500

@staff_bp.route("/audit-logs", methods=["GET"])
@jwt_required
@roles_required("staff")
def get_audit_logs():
    limit = int(request.args.get("limit", 100))
    skip = int(request.args.get("skip", 0))
    logs = audit_service.get_logs(limit=limit, skip=skip)
    return jsonify({"audit_logs": logs, "count": len(logs)}), 200
