import uuid
import datetime
from pymongo.errors import DuplicateKeyError, OperationFailure
from app.extensions import get_mongo_client
from app.repositories.election_repository import ElectionRepository
from app.repositories.participation_repository import ParticipationRepository
from app.repositories.vote_repository import VoteRepository
from app.services.audit_service import audit_service

class VotingService:
    def __init__(self, election_repo=None, participation_repo=None, vote_repo=None):
        self.election_repo = election_repo or ElectionRepository()
        self.participation_repo = participation_repo or ParticipationRepository()
        self.vote_repo = vote_repo or VoteRepository()

    def check_voter_status(self, election_id: str, voter_id: str) -> dict:
        """
        Returns whether the voter has voted in the given election.
        Strictly DOES NOT reveal which candidate was chosen!
        """
        has_voted = self.participation_repo.has_voted(election_id, voter_id)
        return {
            "election_id": election_id,
            "voter_id": voter_id,
            "has_voted": has_voted,
            "status": "ALREADY_VOTED" if has_voted else "ELIGIBLE"
        }

    def cast_vote(self, election_id: str, voter_id: str, candidate_id: str) -> dict:
        """
        Submits a vote atomically.
        Guarantees one vote per voter per election via database-level unique compound index.
        """
        election_id = election_id.strip().upper()
        voter_id = voter_id.strip().upper()
        candidate_id = candidate_id.strip().upper()

        # 1. Fetch Election
        election = self.election_repo.find_by_election_id(election_id)
        if not election:
            return {"status": "election_not_found", "message": "Election does not exist."}

        # 2. Check Election Status
        if election.get("status") != "OPEN":
            return {
                "status": "election_not_open",
                "message": f"Voting is not permitted because election is in '{election.get('status')}' status."
            }

        # 3. Check Time Window in UTC
        now = datetime.datetime.now(datetime.timezone.utc)
        start_at = election.get("start_at")
        end_at = election.get("end_at")
        
        # Ensure UTC timezone
        if isinstance(start_at, datetime.datetime) and start_at.tzinfo is None:
            start_at = start_at.replace(tzinfo=datetime.timezone.utc)
        if isinstance(end_at, datetime.datetime) and end_at.tzinfo is None:
            end_at = end_at.replace(tzinfo=datetime.timezone.utc)

        if start_at and now < start_at:
            return {"status": "election_not_open", "message": "Election voting period has not started yet."}
        if end_at and now > end_at:
            return {"status": "election_not_open", "message": "Election voting period has ended."}

        # 4. Check Candidate Belongs to This Election
        candidate = self.election_repo.get_candidate(election_id, candidate_id)
        if not candidate:
            return {
                "status": "invalid_candidate",
                "message": "The selected candidate does not belong to this election."
            }

        # 5. Check if Voter Already Voted (fast check before write)
        if self.participation_repo.has_voted(election_id, voter_id):
            return {
                "status": "already_voted",
                "message": "You have already cast your vote in this election."
            }

        # 6. Generate Opaque Ballot ID for Anonymous Ballot Separation
        ballot_id = str(uuid.uuid4())

        # 7. Atomic Write Execution
        client = get_mongo_client()
        supports_transactions = False
        try:
            # Check if replica set is active and client is native pymongo (not mongomock)
            if (type(client).__module__.startswith("pymongo") and 
                hasattr(client, "topology_description") and 
                client.topology_description and 
                getattr(client.topology_description, "replica_set_name", None)):
                supports_transactions = True
        except Exception:
            supports_transactions = False

        if supports_transactions:
            try:
                with client.start_session() as session:
                    with session.start_transaction():
                        # First insert participation (will fail with DuplicateKeyError if already voted)
                        self.participation_repo.record_participation(election_id, voter_id, ballot_id, session=session)
                        # Then record anonymous vote
                        self.vote_repo.record_vote(ballot_id, election_id, candidate_id, session=session)
            except DuplicateKeyError:
                return {
                    "status": "already_voted",
                    "message": "A vote has already been submitted and accepted for this voter in this election."
                }
            except Exception as e:
                return {"status": "submission_failed", "message": f"Voting transaction failed: {str(e)}"}
        else:
            # Standalone or non-replica deployment:
            # Atomic participation insert first. The compound unique index on (election_id, voter_id)
            # strictly rejects duplicate voting even during concurrent race conditions.
            try:
                self.participation_repo.record_participation(election_id, voter_id, ballot_id)
            except DuplicateKeyError:
                return {
                    "status": "already_voted",
                    "message": "A vote has already been submitted and accepted for this voter in this election."
                }
            except Exception as e:
                return {"status": "submission_failed", "message": f"Failed to record voter participation: {str(e)}"}

            # Now insert the anonymous ballot
            try:
                self.vote_repo.record_vote(ballot_id, election_id, candidate_id)
            except Exception as e:
                # Rollback participation record if vote write fails
                self.participation_repo.delete_participation(election_id, voter_id)
                return {"status": "submission_failed", "message": f"Failed to record ballot: {str(e)}"}

        # 8. Log Audit Event (Without linking candidate to voter)
        audit_service.log_event(
            actor_id=voter_id,
            action="VOTE_CAST_SUCCESS",
            target_type="election",
            target_id=election_id
        )

        return {
            "status": "vote_recorded",
            "message": "Your vote has been securely recorded.",
            "election_id": election_id
        }

voting_service = VotingService()
