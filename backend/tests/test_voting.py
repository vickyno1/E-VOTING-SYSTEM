import pytest
import datetime
from app.services.election_service import ElectionService
from app.services.voting_service import VotingService

def setup_election(mock_db, election_id="ELEC01"):
    elec_service = ElectionService()
    now = datetime.datetime.now(datetime.timezone.utc)
    start_at = (now - datetime.timedelta(hours=1)).isoformat()
    end_at = (now + datetime.timedelta(hours=24)).isoformat()

    elec_service.create_election(election_id, "Election Test", "Test", start_at, end_at, "STAFF001")
    elec_service.add_candidate(election_id, "CAND_A", "Alice Candidate", "Manifesto A")
    elec_service.add_candidate(election_id, "CAND_B", "Bob Candidate", "Manifesto B")
    elec_service.open_election(election_id, "STAFF001")
    return election_id

def test_successful_vote_candidate_a(mock_db):
    election_id = setup_election(mock_db, "ELEC_A")
    voting_service = VotingService()

    res = voting_service.cast_vote(election_id, "STU1001", "CAND_A")
    assert res["status"] == "vote_recorded"

    status = voting_service.check_voter_status(election_id, "STU1001")
    assert status["has_voted"] is True
    assert status["status"] == "ALREADY_VOTED"

def test_successful_vote_candidate_b_separate_election(mock_db):
    election_id = setup_election(mock_db, "ELEC_B")
    voting_service = VotingService()

    res = voting_service.cast_vote(election_id, "STU1002", "CAND_B")
    assert res["status"] == "vote_recorded"

def test_cannot_vote_in_closed_election(mock_db):
    elec_service = ElectionService()
    now = datetime.datetime.now(datetime.timezone.utc)
    start_at = (now - datetime.timedelta(hours=2)).isoformat()
    end_at = (now - datetime.timedelta(hours=1)).isoformat()

    # Election already expired / closed
    elec_service.create_election("ELEC_EXPIRED", "Expired", "", start_at, end_at, "STAFF001")
    elec_service.add_candidate("ELEC_EXPIRED", "C1", "Cand 1", "")
    elec_service.add_candidate("ELEC_EXPIRED", "C2", "Cand 2", "")
    elec_service.open_election("ELEC_EXPIRED", "STAFF001")

    voting_service = VotingService()
    res = voting_service.cast_vote("ELEC_EXPIRED", "STU1003", "C1")
    assert res["status"] == "election_not_open"

def test_cannot_vote_for_candidate_from_another_election(mock_db):
    setup_election(mock_db, "ELEC_X")
    setup_election(mock_db, "ELEC_Y")
    
    voting_service = VotingService()
    # Try voting in ELEC_X with a candidate belonging to ELEC_Z
    res = voting_service.cast_vote("ELEC_X", "STU1004", "NON_EXISTENT_CANDIDATE")
    assert res["status"] == "invalid_candidate"
