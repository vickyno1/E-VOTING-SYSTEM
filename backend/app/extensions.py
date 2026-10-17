import os
import datetime
import jwt
from argon2 import PasswordHasher
from pymongo import MongoClient, ASCENDING
from app.config import Config

# Initialize Argon2 Password Hasher
password_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16
)

_mongo_client = None
_db = None

def get_mongo_client():
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=5000)
    return _mongo_client

def get_db(client=None):
    global _db
    if client is not None:
        return client[Config.MONGODB_DATABASE]
    if _db is None:
        _db = get_mongo_client()[Config.MONGODB_DATABASE]
    return _db

def init_db_indexes(db=None):
    """
    Ensure all unique constraints and indexes are established atomically in MongoDB.
    """
    if db is None:
        db = get_db()
        
    # Users indexes: unique voter_id and email
    db.users.create_index([("voter_id", ASCENDING)], unique=True)
    db.users.create_index([("email", ASCENDING)], unique=True)
    
    # Elections indexes: unique election_id
    db.elections.create_index([("election_id", ASCENDING)], unique=True)
    db.elections.create_index([("status", ASCENDING)])
    
    # Candidates indexes: compound index on election_id and candidate_id
    db.candidates.create_index([("election_id", ASCENDING), ("candidate_id", ASCENDING)], unique=True)
    
    # Participation indexes: ABSOLUTE CRITICAL CONSTRAINT:
    # A voter can have at most ONE participation record per election.
    db.participation.create_index(
        [("election_id", ASCENDING), ("voter_id", ASCENDING)],
        unique=True,
        name="unique_voter_election_participation"
    )
    
    # Votes collection indexes
    db.votes.create_index([("ballot_id", ASCENDING)], unique=True)
    db.votes.create_index([("election_id", ASCENDING)])
    
    # Audit log index
    db.audit_logs.create_index([("timestamp", ASCENDING)])
    db.audit_logs.create_index([("action", ASCENDING)])

def create_jwt_token(payload: dict, expires_in_hours: int = None) -> str:
    if expires_in_hours is None:
        expires_in_hours = Config.JWT_EXPIRATION_HOURS
    now = datetime.datetime.now(datetime.timezone.utc)
    to_encode = payload.copy()
    to_encode.update({
        "iat": now,
        "exp": now + datetime.timedelta(hours=expires_in_hours)
    })
    return jwt.encode(to_encode, Config.SECRET_KEY, algorithm="HS256")

def decode_jwt_token(token: str) -> dict:
    return jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
