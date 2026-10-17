import datetime
from app.repositories.election_repository import ElectionRepository
from app.repositories.participation_repository import ParticipationRepository
from app.services.audit_service import audit_service

VALID_TRANSITIONS = {
    "DRAFT": ["SCHEDULED", "OPEN"],
    "SCHEDULED": ["OPEN", "DRAFT"],
    "OPEN": ["CLOSED"],
    "CLOSED": ["RESULTS_PUBLISHED"],
    "RESULTS_PUBLISHED": []
}

class ElectionService:
    def __init__(self, election_repo=None, participation_repo=None):
        self.election_repo = election_repo or ElectionRepository()
        self.participation_repo = participation_repo or ParticipationRepository()

    def parse_iso_datetime(self, val):
        if isinstance(val, (datetime.datetime, datetime.date)):
            if isinstance(val, datetime.date) and not isinstance(val, datetime.datetime):
                return datetime.datetime(val.year, val.month, val.day, tzinfo=datetime.timezone.utc)
            if val.tzinfo is None:
                return val.replace(tzinfo=datetime.timezone.utc)
            return val
        if isinstance(val, str):
            # Parse ISO 8601 string
            clean = val.replace("Z", "+00:00")
            dt = datetime.datetime.fromisoformat(clean)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=datetime.timezone.utc)
            return dt
        raise ValueError("Invalid datetime format. Expected ISO 8601 string.")

    def create_election(self, election_id: str, title: str, description: str, start_at: str, end_at: str, created_by: str, eligibility_rule: str = "ALL_VOTERS"):
        if not election_id or not election_id.strip():
            raise ValueError("Election ID is required.")
        election_id = election_id.strip().upper()

        if self.election_repo.find_by_election_id(election_id):
            raise ValueError(f"An election with ID '{election_id}' already exists.")

        if not title or not title.strip():
            raise ValueError("Election title is required.")

        start_dt = self.parse_iso_datetime(start_at)
        end_dt = self.parse_iso_datetime(end_at)

        if start_dt >= end_dt:
            raise ValueError("Election start time must be strictly before end time.")

        election_data = {
            "election_id": election_id,
            "title": title.strip(),
            "description": description.strip() if description else "",
            "start_at": start_dt,
            "end_at": end_dt,
            "status": "DRAFT",
            "candidate_ids": [],
            "eligibility_rule": eligibility_rule,
            "created_by": created_by
        }

        created = self.election_repo.create_election(election_data)
        audit_service.log_event(
            actor_id=created_by,
            action="ELECTION_CREATED",
            target_type="election",
            target_id=election_id,
            metadata={"title": title}
        )

        return ElectionRepository.safe_election_dict(created)

    def add_candidate(self, election_id: str, candidate_id: str, name: str, description: str, photo_url: str = ""):
        election = self.election_repo.find_by_election_id(election_id)
        if not election:
            raise ValueError(f"Election '{election_id}' not found.")

        if election.get("status") not in ("DRAFT", "SCHEDULED"):
            raise ValueError(f"Cannot add candidate to election in '{election.get('status')}' state.")

        current_count = self.election_repo.count_candidates(election_id)
        if current_count >= 2:
            raise ValueError("For this version, an election can have exactly two candidates. Limit reached.")

        candidate_id = candidate_id.strip().upper()
        if self.election_repo.get_candidate(election_id, candidate_id):
            raise ValueError(f"Candidate '{candidate_id}' already exists in this election.")

        candidate_data = {
            "candidate_id": candidate_id,
            "election_id": election_id,
            "name": name.strip(),
            "description": description.strip() if description else "",
            "photo_url": photo_url.strip() if photo_url else ""
        }

        self.election_repo.add_candidate(candidate_data)
        audit_service.log_event(
            actor_id=election.get("created_by", "STAFF"),
            action="CANDIDATE_ADDED",
            target_type="candidate",
            target_id=candidate_id,
            metadata={"election_id": election_id, "name": name}
        )

        return candidate_data

    def open_election(self, election_id: str, staff_id: str):
        election = self.election_repo.find_by_election_id(election_id)
        if not election:
            raise ValueError(f"Election '{election_id}' not found.")

        current_status = election.get("status")
        if current_status not in ("DRAFT", "SCHEDULED"):
            raise ValueError(f"Cannot open election from status '{current_status}'.")

        # Crucial requirement: Must have exactly 2 candidates before opening!
        candidate_count = self.election_repo.count_candidates(election_id)
        if candidate_count != 2:
            raise ValueError(f"Election must have exactly two candidates before opening. Current count: {candidate_count}.")

        now = datetime.datetime.now(datetime.timezone.utc)
        self.election_repo.update_election(election_id, {
            "status": "OPEN",
            "opened_at": now
        })

        audit_service.log_event(
            actor_id=staff_id,
            action="ELECTION_OPENED",
            target_type="election",
            target_id=election_id
        )

        updated = self.election_repo.find_by_election_id(election_id)
        candidates = self.election_repo.get_candidates(election_id)
        return ElectionRepository.safe_election_dict(updated, candidates)

    def close_election(self, election_id: str, staff_id: str):
        election = self.election_repo.find_by_election_id(election_id)
        if not election:
            raise ValueError(f"Election '{election_id}' not found.")

        if election.get("status") != "OPEN":
            raise ValueError(f"Cannot close election because current status is '{election.get('status')}'.")

        now = datetime.datetime.now(datetime.timezone.utc)
        self.election_repo.update_election(election_id, {
            "status": "CLOSED",
            "closed_at": now
        })

        audit_service.log_event(
            actor_id=staff_id,
            action="ELECTION_CLOSED",
            target_type="election",
            target_id=election_id
        )

        updated = self.election_repo.find_by_election_id(election_id)
        candidates = self.election_repo.get_candidates(election_id)
        return ElectionRepository.safe_election_dict(updated, candidates)

    def publish_results(self, election_id: str, staff_id: str):
        election = self.election_repo.find_by_election_id(election_id)
        if not election:
            raise ValueError(f"Election '{election_id}' not found.")

        if election.get("status") != "CLOSED":
            raise ValueError(f"Election must be closed before publishing results. Current status: '{election.get('status')}'.")

        now = datetime.datetime.now(datetime.timezone.utc)
        self.election_repo.update_election(election_id, {
            "status": "RESULTS_PUBLISHED",
            "results_published_at": now
        })

        audit_service.log_event(
            actor_id=staff_id,
            action="ELECTION_RESULTS_PUBLISHED",
            target_type="election",
            target_id=election_id
        )

        updated = self.election_repo.find_by_election_id(election_id)
        candidates = self.election_repo.get_candidates(election_id)
        return ElectionRepository.safe_election_dict(updated, candidates)

    def get_election_details(self, election_id: str, include_candidates: bool = True):
        election = self.election_repo.find_by_election_id(election_id)
        if not election:
            return None
        candidates = self.election_repo.get_candidates(election_id) if include_candidates else None
        return ElectionRepository.safe_election_dict(election, candidates)

    def list_all_elections(self, filter_query=None):
        elections = self.election_repo.list_elections(filter_query)
        result = []
        for e in elections:
            candidates = self.election_repo.get_candidates(e["election_id"])
            result.append(ElectionRepository.safe_election_dict(e, candidates))
        return result

election_service = ElectionService()
