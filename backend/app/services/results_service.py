from app.repositories.election_repository import ElectionRepository
from app.repositories.vote_repository import VoteRepository
from app.repositories.participation_repository import ParticipationRepository

class ResultsService:
    def __init__(self, election_repo=None, vote_repo=None, participation_repo=None):
        self.election_repo = election_repo or ElectionRepository()
        self.vote_repo = vote_repo or VoteRepository()
        self.participation_repo = participation_repo or ParticipationRepository()

    def get_public_results(self, election_id: str):
        """
        Public/Voter results endpoint.
        Strictly rejects access if election results are NOT published!
        """
        election = self.election_repo.find_by_election_id(election_id)
        if not election:
            raise ValueError(f"Election '{election_id}' not found.")

        if election.get("status") != "RESULTS_PUBLISHED":
            raise PermissionError("Results for this election have not been published yet.")

        return self._compute_results(election)

    def get_staff_results(self, election_id: str):
        """
        Staff results endpoint.
        Staff can view results if election is CLOSED or RESULTS_PUBLISHED.
        Cannot view live candidate totals while election is still OPEN!
        """
        election = self.election_repo.find_by_election_id(election_id)
        if not election:
            raise ValueError(f"Election '{election_id}' not found.")

        if election.get("status") not in ("CLOSED", "RESULTS_PUBLISHED"):
            raise PermissionError("Results cannot be computed while the election is still OPEN or in DRAFT.")

        return self._compute_results(election)

    def get_participation_summary(self, election_id: str):
        """
        Safe participation summary: exposes only headcount/turnout, no candidate choices.
        """
        election = self.election_repo.find_by_election_id(election_id)
        if not election:
            raise ValueError(f"Election '{election_id}' not found.")

        participation_count = self.participation_repo.count_participation(election_id)
        return {
            "election_id": election_id,
            "title": election.get("title"),
            "status": election.get("status"),
            "total_participation": participation_count
        }

    def _compute_results(self, election: dict) -> dict:
        election_id = election["election_id"]
        candidates = self.election_repo.get_candidates(election_id)
        vote_counts = self.vote_repo.count_votes_by_candidate(election_id)
        total_votes = self.vote_repo.count_total_votes(election_id)
        participation_count = self.participation_repo.count_participation(election_id)

        candidate_results = []
        max_votes = -1
        winner = None
        is_tie = False

        for c in candidates:
            cid = c["candidate_id"]
            votes = vote_counts.get(cid, 0)
            percentage = round((votes / total_votes * 100), 2) if total_votes > 0 else 0.0

            candidate_results.append({
                "candidate_id": cid,
                "name": c["name"],
                "description": c.get("description", ""),
                "photo_url": c.get("photo_url", ""),
                "votes": votes,
                "percentage": percentage
            })

            if votes > max_votes:
                max_votes = votes
                winner = c["name"]
                is_tie = False
            elif votes == max_votes and max_votes > 0:
                is_tie = True

        outcome = "TIE" if is_tie else ("WINNER" if total_votes > 0 else "NO_VOTES")

        return {
            "election_id": election_id,
            "title": election.get("title"),
            "description": election.get("description"),
            "status": election.get("status"),
            "total_votes": total_votes,
            "total_participation": participation_count,
            "candidates": candidate_results,
            "outcome": outcome,
            "winner": "Tie" if is_tie else winner,
            "results_published_at": election.get("results_published_at").isoformat() if election.get("results_published_at") else None
        }

results_service = ResultsService()
