import datetime
from app.extensions import get_db

class AuditService:
    def __init__(self, db=None):
        self._db = db

    @property
    def collection(self):
        return get_db(self._db).audit_logs

    def log_event(self, actor_id: str, action: str, target_type: str, target_id: str, metadata: dict = None):
        """
        Records security and operational events.
        Strictly sanitizes metadata to never persist passwords, biometric templates, or keys.
        """
        clean_metadata = {}
        if metadata:
            for k, v in metadata.items():
                if k.lower() in ("password", "face_template", "token", "secret", "image", "raw"):
                    continue
                clean_metadata[k] = v

        entry = {
            "actor_id": actor_id or "SYSTEM",
            "action": action,
            "target_type": target_type,
            "target_id": str(target_id),
            "timestamp": datetime.datetime.now(datetime.timezone.utc),
            "metadata": clean_metadata
        }
        try:
            self.collection.insert_one(entry)
        except Exception as e:
            # Audit logging must not crash main flow, but error should be noted
            print(f"[AUDIT ERROR] Failed to record audit log: {e}")

    def get_logs(self, limit: int = 100, skip: int = 0):
        records = list(
            self.collection.find()
            .sort("timestamp", -1)
            .skip(skip)
            .limit(limit)
        )
        for r in records:
            r["id"] = str(r["_id"])
            del r["_id"]
            if isinstance(r.get("timestamp"), datetime.datetime):
                r["timestamp"] = r["timestamp"].isoformat()
        return records

audit_service = AuditService()
