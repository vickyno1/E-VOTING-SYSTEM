import datetime
from pymongo.errors import DuplicateKeyError
from app.extensions import get_db

class ParticipationRepository:
    def __init__(self, db=None):
        self._db = db

    @property
    def collection(self):
        return get_db(self._db).participation

    def has_voted(self, election_id: str, voter_id: str) -> bool:
        """
        Quick check if voter has already participated in this election.
        """
        record = self.collection.find_one({
            "election_id": election_id,
            "voter_id": voter_id.strip().upper()
        })
        return record is not None

    def record_participation(self, election_id: str, voter_id: str, ballot_id: str, session=None):
        """
        Atomically records voter participation.
        Leverages the compound unique index on (election_id, voter_id).
        Throws DuplicateKeyError if this voter already voted in this election.
        """
        now = datetime.datetime.now(datetime.timezone.utc)
        record = {
            "election_id": election_id,
            "voter_id": voter_id.strip().upper(),
            "ballot_id": ballot_id,
            "participation_status": "VOTED",
            "cast_at": now
        }
        return self.collection.insert_one(record, session=session)

    def count_participation(self, election_id: str) -> int:
        return self.collection.count_documents({"election_id": election_id})

    def delete_participation(self, election_id: str, voter_id: str, session=None):
        """Used only for rollback if non-transactional standalone mode encounters an error"""
        return self.collection.delete_one(
            {"election_id": election_id, "voter_id": voter_id.strip().upper()},
            session=session
        )
