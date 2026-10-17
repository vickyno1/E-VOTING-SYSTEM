from flask import Blueprint, jsonify, g
from app.middleware.auth import jwt_required
from app.middleware.permissions import roles_required
from app.services.election_service import election_service
from app.services.voting_service import voting_service
from app.services.results_service import results_service
from app.repositories.participation_repository import ParticipationRepository

voter_bp = Blueprint("voter", __name__, url_prefix="/api/voter")

@voter_bp.route("/dashboard", methods=["GET"])
@jwt_required
@roles_required("voter")
def get_voter_dashboard():
    voter_id = g.current_user["voter_id"]
    all_elections = election_service.list_all_elections()

    participation_repo = ParticipationRepository()

    open_elections = []
    upcoming_elections = []
    closed_elections = []
    already_voted_elections = []

    for el in all_elections:
        eid = el["election_id"]
        has_voted = participation_repo.has_voted(eid, voter_id)
        el["user_has_voted"] = has_voted

        if has_voted:
            already_voted_elections.append(el)

        status = el.get("status")
        if status == "OPEN":
            open_elections.append(el)
        elif status in ("DRAFT", "SCHEDULED"):
            upcoming_elections.append(el)
        elif status in ("CLOSED", "RESULTS_PUBLISHED"):
            closed_elections.append(el)

    return jsonify({
        "voter": {
            "voter_id": voter_id,
            "full_name": g.current_user.get("full_name"),
            "email": g.current_user.get("email")
        },
        "open_elections": open_elections,
        "upcoming_elections": upcoming_elections,
        "closed_elections": closed_elections,
        "already_voted_elections": already_voted_elections,
        "total_available": len(all_elections)
    }), 200

@voter_bp.route("/elections", methods=["GET"])
@jwt_required
@roles_required("voter")
def list_voter_elections():
    voter_id = g.current_user["voter_id"]
    elections = election_service.list_all_elections()
    participation_repo = ParticipationRepository()

    for el in elections:
        el["user_has_voted"] = participation_repo.has_voted(el["election_id"], voter_id)

    return jsonify({"elections": elections}), 200

@voter_bp.route("/elections/<election_id>", methods=["GET"])
@jwt_required
@roles_required("voter")
def get_election_details(election_id):
    election = election_service.get_election_details(election_id, include_candidates=True)
    if not election:
        return jsonify({"error": "Not Found", "message": "Election not found."}), 404

    voter_id = g.current_user["voter_id"]
    participation_repo = ParticipationRepository()
    has_voted = participation_repo.has_voted(election_id, voter_id)
    election["user_has_voted"] = has_voted

    return jsonify({"election": election}), 200

@voter_bp.route("/elections/<election_id>/status", methods=["GET"])
@jwt_required
@roles_required("voter")
def get_voter_status(election_id):
    voter_id = g.current_user["voter_id"]
    status_info = voting_service.check_voter_status(election_id, voter_id)
    return jsonify(status_info), 200

@voter_bp.route("/results/<election_id>", methods=["GET"])
@jwt_required
@roles_required("voter")
def get_election_results(election_id):
    try:
        results = results_service.get_public_results(election_id)
        return jsonify({"results": results}), 200
    except ValueError as e:
        return jsonify({"error": "Not Found", "message": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": "Forbidden", "message": str(e)}), 403
    except Exception as e:
        return jsonify({"error": "Server Error", "message": f"Failed to retrieve results: {str(e)}"}), 500
