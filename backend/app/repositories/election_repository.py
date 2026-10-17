import datetime
from bson import ObjectId
from app.extensions import get_db

class ElectionRepository:
    def __init__(self, db=None):
        self._db = db

    @property
    def elections(self):
        return get_db(self._db).elections

    @property
    def candidates(self):
        return get_db(self._db).candidates

    def create_election(self, election_data: dict) -> dict:
        now = datetime.datetime.now(datetime.timezone.utc)
        election_data["created_at"] = now
        election_data["updated_at"] = now
        election_data["candidate_ids"] = election_data.get("candidate_ids", [])
        election_data["status"] = election_data.get("status", "DRAFT")
        
        result = self.elections.insert_one(election_data)
        election_data["_id"] = result.inserted_id
        return election_data

    def find_by_election_id(self, election_id: str):
        return self.elections.find_one({"election_id": election_id})

    def list_elections(self, filter_query=None):
        filter_query = filter_query or {}
        return list(self.elections.find(filter_query).sort("created_at", -1))

    def update_election(self, election_id: str, update_fields: dict):
        now = datetime.datetime.now(datetime.timezone.utc)
        update_fields["updated_at"] = now
        return self.elections.update_one(
            {"election_id": election_id},
            {"$set": update_fields}
        )

    # Candidate operations
    def add_candidate(self, candidate_data: dict) -> dict:
        now = datetime.datetime.now(datetime.timezone.utc)
        candidate_data["created_at"] = now
        self.candidates.insert_one(candidate_data)
        # Append candidate_id to election's candidate_ids array
        self.elections.update_one(
            {"election_id": candidate_data["election_id"]},
            {
                "$addToSet": {"candidate_ids": candidate_data["candidate_id"]},
                "$set": {"updated_at": now}
            }
        )
        return candidate_data

    def get_candidates(self, election_id: str):
        return list(self.candidates.find({"election_id": election_id}))

    def get_candidate(self, election_id: str, candidate_id: str):
        return self.candidates.find_one({
            "election_id": election_id,
            "candidate_id": candidate_id
        })

    def count_candidates(self, election_id: str) -> int:
        return self.candidates.count_documents({"election_id": election_id})

    @staticmethod
    def safe_election_dict(election: dict, candidates=None) -> dict:
        if not election:
            return {}
        res = {
            "id": str(election.get("_id")),
            "election_id": election.get("election_id"),
            "title": election.get("title"),
            "description": election.get("description"),
            "start_at": election.get("start_at").isoformat() if isinstance(election.get("start_at"), (datetime.datetime, datetime.date)) else election.get("start_at"),
            "end_at": election.get("end_at").isoformat() if isinstance(election.get("end_at"), (datetime.datetime, datetime.date)) else election.get("end_at"),
            "status": election.get("status"),
            "eligibility_rule": election.get("eligibility_rule", "ALL_VOTERS"),
            "created_by": election.get("created_by"),
            "created_at": election.get("created_at").isoformat() if isinstance(election.get("created_at"), datetime.datetime) else None,
            "closed_at": election.get("closed_at").isoformat() if isinstance(election.get("closed_at"), datetime.datetime) else None,
            "results_published_at": election.get("results_published_at").isoformat() if isinstance(election.get("results_published_at"), datetime.datetime) else None,
            "candidate_count": len(election.get("candidate_ids", []))
        }
        if candidates is not None:
            res["candidates"] = [
                {
                    "candidate_id": c.get("candidate_id"),
                    "name": c.get("name"),
                    "description": c.get("description"),
                    "photo_url": c.get("photo_url", "")
                } for c in candidates
            ]
        return res
