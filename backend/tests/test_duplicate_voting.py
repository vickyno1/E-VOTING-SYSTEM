import pytest
import datetime
from app.services.auth_service import AuthService
from app.services.election_service import ElectionService
from app.services.voting_service import VotingService
from app.services.results_service import ResultsService
from app.repositories.participation_repository import ParticipationRepository
from app.repositories.vote_repository import VoteRepository

def test_full_already_voted_workflow_and_duplicate_prevention(mock_db, monkeypatch):
    """
    Tests the exact specification in Section 11:
    1. Voter registers and enrolls face.
    2. Staff creates election with Candidate A & B and opens it.
    3. Voter logs in with credentials and face verification.
    4. Voter casts vote for Candidate A.
    5. Dashboard shows Already Voted.
    6. Voter logs out.
    7. Same voter logs in again successfully (login NOT blocked!).
    8. Voter attempts duplicate vote via service and API -> rejected with already_voted!
    9. Anonymous ballot collection has exactly 1 ballot for this voter.
    10. Voter cannot view live results before publication.
    11. Staff closes election and publishes results.
    12. Voter can now view published results.
    """
    auth_service = AuthService()
    election_service = ElectionService()
    voting_service = VotingService()
    results_service = ResultsService()
    part_repo = ParticipationRepository()
    vote_repo = VoteRepository()

    # 1. Voter registers
    reg = auth_service.register_voter(
        full_name="John Doe",
        voter_id="STU1001",
        email="john@college.edu",
        password="SecurePassword123!",
        confirm_password="SecurePassword123!"
    )
    user_id = reg["user"]["id"]

    # Mock face feature extraction
    mock_vector = [0.25] * 128
    monkeypatch.setattr(auth_service.user_repo, "update_face_template", 
                        lambda uid, feat, ver: mock_db.users.update_one(
                            {"voter_id": "STU1001"},
                            {"$set": {"face_template": mock_vector, "account_status": "ACTIVE"}}
                        ))

    # Enroll face
    monkeypatch.setattr("app.services.auth_service.face_service.detect_and_extract_feature", lambda img: mock_vector)
    auth_service.enroll_face(user_id=user_id, image_data="dummy_b64", consent_given=True)

    # 2. Staff creates election and opens it
    now = datetime.datetime.now(datetime.timezone.utc)
    election_service.create_election(
        election_id="PRESIDENT2026",
        title="Student Union Presidential Election",
        description="Choose your union president",
        start_at=(now - datetime.timedelta(hours=1)).isoformat(),
        end_at=(now + datetime.timedelta(hours=24)).isoformat(),
        created_by="STAFF001"
    )
    election_service.add_candidate("PRESIDENT2026", "CAND_A", "Candidate A", "Platform A")
    election_service.add_candidate("PRESIDENT2026", "CAND_B", "Candidate B", "Platform B")
    election_service.open_election("PRESIDENT2026", "STAFF001")

    # 3. Voter logs in (Step 1 + Step 2)
    step1 = auth_service.login_step1("STU1001", "SecurePassword123!")
    assert step1["step"] == "face_verification_required"
    challenge_token = step1["challenge_token"]

    monkeypatch.setattr("app.services.auth_service.face_service.verify_face", lambda enrolled, probe: (True, 0.95))
    step2 = auth_service.login_step2_verify_face(challenge_token, "probe_image")
    assert "token" in step2
    assert step2["user"]["voter_id"] == "STU1001"

    # 4. Voter casts vote for Candidate A
    vote_res = voting_service.cast_vote("PRESIDENT2026", "STU1001", "CAND_A")
    assert vote_res["status"] == "vote_recorded"

    # 5. Status check confirms ALREADY_VOTED
    voter_status = voting_service.check_voter_status("PRESIDENT2026", "STU1001")
    assert voter_status["has_voted"] is True
    assert voter_status["status"] == "ALREADY_VOTED"

    # 6. Immediate duplicate submission attempt in same session MUST be rejected
    dup_res = voting_service.cast_vote("PRESIDENT2026", "STU1001", "CAND_B")
    assert dup_res["status"] == "already_voted"

    # 7. Voter logs out and logs in again - CRITICAL: Login MUST NOT BE BLOCKED!
    step1_again = auth_service.login_step1("STU1001", "SecurePassword123!")
    assert step1_again["step"] == "face_verification_required"
    step2_again = auth_service.login_step2_verify_face(step1_again["challenge_token"], "probe_image")
    assert step2_again["user"]["voter_id"] == "STU1001"

    # 8. After logging in again, voter still sees already voted
    status_again = voting_service.check_voter_status("PRESIDENT2026", "STU1001")
    assert status_again["has_voted"] is True

    # And attempting to vote again is strictly rejected
    dup_res2 = voting_service.cast_vote("PRESIDENT2026", "STU1001", "CAND_A")
    assert dup_res2["status"] == "already_voted"

    # 9. Verify database integrity: exactly 1 participation record & exactly 1 ballot
    assert part_repo.count_participation("PRESIDENT2026") == 1
    assert vote_repo.count_total_votes("PRESIDENT2026") == 1

    # 10. Live results check: Voter cannot access live candidate counts while election is OPEN
    with pytest.raises(PermissionError, match="not been published yet"):
        results_service.get_public_results("PRESIDENT2026")

    # 11. Staff closes election and publishes results
    election_service.close_election("PRESIDENT2026", "STAFF001")
    election_service.publish_results("PRESIDENT2026", "STAFF001")

    # 12. Voter can now view published results
    pub_results = results_service.get_public_results("PRESIDENT2026")
    assert pub_results["total_votes"] == 1
    assert pub_results["total_participation"] == 1
    assert pub_results["winner"] == "Candidate A"
