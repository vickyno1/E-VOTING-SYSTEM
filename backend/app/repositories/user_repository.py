import datetime
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from app.extensions import get_db

class UserRepository:
    def __init__(self, db=None):
        self._db = db

    @property
    def collection(self):
        return get_db(self._db).users

    def create_user(self, user_data: dict) -> dict:
        now = datetime.datetime.now(datetime.timezone.utc)
        user_data["created_at"] = now
        user_data["updated_at"] = now
        # Normalize voter_id (upper) and email (lower)
        user_data["voter_id"] = user_data["voter_id"].strip().upper()
        user_data["email"] = user_data["email"].strip().lower()
        
        result = self.collection.insert_one(user_data)
        user_data["_id"] = result.inserted_id
        return user_data

    def find_by_voter_id(self, voter_id: str):
        if not voter_id:
            return None
        return self.collection.find_one({"voter_id": voter_id.strip().upper()})

    def find_by_email(self, email: str):
        if not email:
            return None
        return self.collection.find_one({"email": email.strip().lower()})

    def find_by_identifier(self, identifier: str):
        """
        Finds user by either voter_id or email
        """
        if not identifier:
            return None
        clean = identifier.strip()
        user = self.collection.find_one({
            "$or": [
                {"voter_id": clean.upper()},
                {"email": clean.lower()}
            ]
        })
        return user

    def find_by_id(self, user_id):
        if isinstance(user_id, str):
            try:
                user_id = ObjectId(user_id)
            except Exception:
                return None
        return self.collection.find_one({"_id": user_id})

    def update_face_template(self, user_id, face_template: list, model_version: str):
        now = datetime.datetime.now(datetime.timezone.utc)
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        return self.collection.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "face_template": face_template,
                    "face_model_version": model_version,
                    "face_enrolled_at": now,
                    "account_status": "ACTIVE",
                    "updated_at": now
                }
            }
        )

    def count_voters(self) -> int:
        return self.collection.count_documents({"role": "voter"})

    @staticmethod
    def safe_user_dict(user: dict) -> dict:
        """
        Serializes user object for API responses, rigorously stripping password_hash
        and sensitive biometric vector.
        """
        if not user:
            return {}
        safe = {
            "id": str(user.get("_id")),
            "voter_id": user.get("voter_id"),
            "full_name": user.get("full_name"),
            "email": user.get("email"),
            "role": user.get("role", "voter"),
            "account_status": user.get("account_status", "ACTIVE"),
            "face_enrolled": bool(user.get("face_template")),
            "face_enrolled_at": user.get("face_enrolled_at").isoformat() if user.get("face_enrolled_at") else None,
            "created_at": user.get("created_at").isoformat() if user.get("created_at") else None
        }
        return safe
