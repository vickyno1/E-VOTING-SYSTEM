import pytest
import datetime
from app.services.election_service import ElectionService

def test_create_election_success(mock_db):
    service = ElectionService()
    now = datetime.datetime.now(datetime.timezone.utc)
    start_at = (now + datetime.timedelta(hours=1)).isoformat()
    end_at = (now + datetime.timedelta(hours=24)).isoformat()

    election = service.create_election(
        election_id="ELEC2026",
        title="Student Council Election 2026",
        description="Annual representative voting",
        start_at=start_at,
        end_at=end_at,
        created_by="STAFF001"
    )
    assert election["election_id"] == "ELEC2026"
    assert election["status"] == "DRAFT"

def test_reject_invalid_times(mock_db):
    service = ElectionService()
    now = datetime.datetime.now(datetime.timezone.utc)
    # End before start
    start_at = (now + datetime.timedelta(hours=10)).isoformat()
    end_at = (now + datetime.timedelta(hours=2)).isoformat()

    with pytest.raises(ValueError, match="strictly before"):
        service.create_election("ELEC_BAD", "Bad Times", "", start_at, end_at, "STAFF001")

def test_enforce_two_candidates_rule(mock_db):
    service = ElectionService()
    now = datetime.datetime.now(datetime.timezone.utc)
    service.create_election("ELEC2026", "Council", "", now.isoformat(), (now + datetime.timedelta(days=1)).isoformat(), "STAFF001")

    # Add candidate 1
    service.add_candidate("ELEC2026", "CAND_A", "Alice Candidate", "Manifesto A")
    # Add candidate 2
    service.add_candidate("ELEC2026", "CAND_B", "Bob Candidate", "Manifesto B")

    # Attempting to add a 3rd candidate should be rejected
    with pytest.raises(ValueError, match="exactly two candidates"):
        service.add_candidate("ELEC2026", "CAND_C", "Charlie Candidate", "Manifesto C")

def test_open_election_requires_exactly_two_candidates(mock_db):
    service = ElectionService()
    now = datetime.datetime.now(datetime.timezone.utc)
    service.create_election("ELEC_ONE", "Council", "", now.isoformat(), (now + datetime.timedelta(days=1)).isoformat(), "STAFF001")

    # Add only 1 candidate
    service.add_candidate("ELEC_ONE", "CAND_A", "Solo Candidate", "")

    # Opening with < 2 candidates must fail
    with pytest.raises(ValueError, match="exactly two candidates"):
        service.open_election("ELEC_ONE", "STAFF001")

    # Add second candidate and now it opens successfully
    service.add_candidate("ELEC_ONE", "CAND_B", "Second Candidate", "")
    opened = service.open_election("ELEC_ONE", "STAFF001")
    assert opened["status"] == "OPEN"

def test_election_lifecycle_transitions(mock_db):
    service = ElectionService()
    now = datetime.datetime.now(datetime.timezone.utc)
    service.create_election("ELEC_CYCLE", "Title", "", now.isoformat(), (now + datetime.timedelta(days=1)).isoformat(), "STAFF001")
    service.add_candidate("ELEC_CYCLE", "C1", "Cand 1", "")
    service.add_candidate("ELEC_CYCLE", "C2", "Cand 2", "")

    # Open
    service.open_election("ELEC_CYCLE", "STAFF001")
    # Close
    closed = service.close_election("ELEC_CYCLE", "STAFF001")
    assert closed["status"] == "CLOSED"
    # Publish results
    published = service.publish_results("ELEC_CYCLE", "STAFF001")
    assert published["status"] == "RESULTS_PUBLISHED"
