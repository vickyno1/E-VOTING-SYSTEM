#!/usr/bin/env python3
"""
Secure Staff Account Bootstrap Script
This script creates an authorized staff member in the MongoDB database.
Staff accounts CANNOT be created via the public registration endpoint.
"""
import sys
import os
import argparse
from pathlib import Path

# Add backend directory to sys.path so app modules can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.extensions import get_db, password_hasher, init_db_indexes
from app.repositories.user_repository import UserRepository
from app.services.audit_service import audit_service

def bootstrap_staff(full_name: str, email: str, voter_id: str, password: str):
    init_db_indexes()
    user_repo = UserRepository()

    email_clean = email.strip().lower()
    voter_id_clean = voter_id.strip().upper()

    existing_voter = user_repo.find_by_voter_id(voter_id_clean)
    if existing_voter:
        print(f"[ERROR] User with Voter/Staff ID '{voter_id_clean}' already exists.")
        return False

    existing_email = user_repo.find_by_email(email_clean)
    if existing_email:
        print(f"[ERROR] User with Email '{email_clean}' already exists.")
        return False

    if len(password) < 8:
        print("[ERROR] Password must be at least 8 characters long.")
        return False

    # Hash using Argon2id
    password_hash = password_hasher.hash(password)

    staff_user = {
        "voter_id": voter_id_clean,
        "full_name": full_name.strip(),
        "email": email_clean,
        "password_hash": password_hash,
        "role": "staff", # Protected Staff Role
        "account_status": "ACTIVE",
        "face_template": None, # Staff bypasses facial scan by design in administrative flow
        "face_model_version": None,
        "face_enrolled_at": None,
        "biometric_consent_at": None
    }

    created = user_repo.create_user(staff_user)
    audit_service.log_event(
        actor_id="CLI_BOOTSTRAP",
        action="STAFF_ACCOUNT_CREATED",
        target_type="user",
        target_id=created["_id"],
        metadata={"voter_id": voter_id_clean, "email": email_clean}
    )

    print(f"\n[SUCCESS] Staff account successfully created:")
    print(f"  Name:     {full_name}")
    print(f"  Staff ID: {voter_id_clean}")
    print(f"  Email:    {email_clean}")
    print(f"  Role:     staff")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create an authorized Election Staff account.")
    parser.add_argument("--name", help="Staff full name", default="Election Commissioner")
    parser.add_argument("--email", help="Staff email", default="staff@evoting.local")
    parser.add_argument("--id", help="Staff identifier (e.g. STAFF001)", default="STAFF001")
    parser.add_argument("--password", help="Staff password", default="StaffPass123!")

    args = parser.parse_args()
    bootstrap_staff(
        full_name=args.name,
        email=args.email,
        voter_id=args.id,
        password=args.password
    )
