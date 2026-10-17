import datetime
from app.extensions import get_db

class VoteRepository:
    def __init__(self, db=None):
        self._db = db

    @property
    def collection(self):
        return get_db(self._db).votes

    def record_vote(self, ballot_id: str, election_id: str, candidate_id: str, session=None):
        """
        Records the anonymous ballot containing only ballot_id, election_id, candidate_id, cast_at.
        Voter identification is completely omitted to preserve ballot secrecy.
        """
        now = datetime.datetime.now(datetime.timezone.utc)
        ballot = {
            "ballot_id": ballot_id,
            "election_id": election_id,
            "candidate_id": candidate_id,
            "cast_at": now
        }
        return self.collection.insert_one(ballot, session=session)

    def count_total_votes(self, election_id: str) -> int:
        return self.collection.count_documents({"election_id": election_id})

    def count_votes_by_candidate(self, election_id: str) -> dict:
        """
        Aggregates vote counts per candidate for the election.
        Returns a dict mapping candidate_id -> count.
        """
        pipeline = [
            {"$match": {"election_id": election_id}},
            {"$group": {"_id": "$candidate_id", "total": {"$sum": 1}}}
        ]
        results = list(self.collection.aggregate(pipeline))
        counts = {r["_id"]: r["total"] for r in results}
        return counts

    def delete_vote(self, ballot_id: str, session=None):
        """Used only for rollback if non-transactional standalone mode encounters an error"""
        return self.collection.delete_one({"ballot_id": ballot_id}, session=session)
