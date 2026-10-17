import pytest
import datetime
from app.services.election_service import ElectionService
from app.services.voting_service import VotingService
from app.services.results_service import ResultsService

def test_results_calculation_and_outcome(mock_db):
    election_service = ElectionService()
    voting_service = VotingService()
    results_service = ResultsService()

    now = datetime.datetime.now(datetime.timezone.utc)
    election_service.create_election("ELEC_RESULTS", "Results Test", "", (now - datetime.timedelta(hours=1)).isoformat(), (now + datetime.timedelta(hours=24)).isoformat(), "STAFF001")
    election_service.add_candidate("ELEC_RESULTS", "CAND_1", "Candidate One", "")
    election_service.add_candidate("ELEC_RESULTS", "CAND_2", "Candidate Two", "")
    election_service.open_election("ELEC_RESULTS", "STAFF001")

    # Cast 3 votes: 2 for CAND_1, 1 for CAND_2
    voting_service.cast_vote("ELEC_RESULTS", "VOTER1", "CAND_1")
    voting_service.cast_vote("ELEC_RESULTS", "VOTER2", "CAND_1")
    voting_service.cast_vote("ELEC_RESULTS", "VOTER3", "CAND_2")

    # Cannot view public results while OPEN
    with pytest.raises(PermissionError):
        results_service.get_public_results("ELEC_RESULTS")

    # Staff closes election
    election_service.close_election("ELEC_RESULTS", "STAFF001")

    # Staff can now view results before publishing
    staff_results = results_service.get_staff_results("ELEC_RESULTS")
    assert staff_results["total_votes"] == 3
    assert staff_results["total_participation"] == 3
    assert staff_results["winner"] == "Candidate One"

    # Voter still cannot view until published
    with pytest.raises(PermissionError):
        results_service.get_public_results("ELEC_RESULTS")

    # Staff publishes results
    election_service.publish_results("ELEC_RESULTS", "STAFF001")

    # Voter can now view
    public_results = results_service.get_public_results("ELEC_RESULTS")
    assert public_results["total_votes"] == 3
    assert public_results["winner"] == "Candidate One"
    assert public_results["outcome"] == "WINNER"
