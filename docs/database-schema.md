# Database Schema & Data Integrity Design

The application uses **MongoDB** as its persistent document database, leveraging strict indexing constraints, data segregation, and atomic operations.

---

## 1. Collection Specifications

### 1.1 `users` Collection
Stores registered voters and administrative staff.

```json
{
  "_id": "ObjectId",
  "voter_id": "STU1001",
  "full_name": "Alice Walker",
  "email": "alice@college.edu",
  "password_hash": "$argon2id$v=19$m=65536,t=3,p=4$...",
  "role": "voter",
  "account_status": "ACTIVE",
  "face_template": [0.0234, -0.129, ...],
  "face_model_version": "OpenCV_SFace_v1",
  "face_enrolled_at": "ISODate",
  "biometric_consent_at": "ISODate",
  "profile_data": {},
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

**Indexes:**
- `{ "voter_id": 1 }` (Unique, sparse=false)
- `{ "email": 1 }` (Unique, sparse=false)

---

### 1.2 `elections` Collection
Manages election metadata, schedule, and state lifecycle.

```json
{
  "_id": "ObjectId",
  "election_id": "UNION_PRESIDENT_2026",
  "title": "Student Union Presidential Election",
  "description": "Annual student council executive voting",
  "start_at": "ISODate",
  "end_at": "ISODate",
  "status": "OPEN",
  "candidate_ids": ["CAND_A", "CAND_B"],
  "eligibility_rule": "ALL_VOTERS",
  "created_by": "STAFF001",
  "created_at": "ISODate",
  "updated_at": "ISODate",
  "opened_at": "ISODate",
  "closed_at": "ISODate",
  "results_published_at": "ISODate"
}
```

**Indexes:**
- `{ "election_id": 1 }` (Unique)
- `{ "status": 1 }`

---

### 1.3 `candidates` Collection
Stores the candidates configured for each election (exactly two in the initial version).

```json
{
  "_id": "ObjectId",
  "candidate_id": "CAND_A",
  "election_id": "UNION_PRESIDENT_2026",
  "name": "Candidate A",
  "description": "Promoting campus technology and student welfare",
  "photo_url": "",
  "created_at": "ISODate"
}
```

**Indexes:**
- `{ "election_id": 1, "candidate_id": 1 }` (Unique compound index)

---

### 1.4 `participation` Collection
Answers **whether** a voter has voted in a particular election.

```json
{
  "_id": "ObjectId",
  "election_id": "UNION_PRESIDENT_2026",
  "voter_id": "STU1001",
  "ballot_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "participation_status": "VOTED",
  "cast_at": "ISODate"
}
```

**Critical Duplicate-Vote Prevention Index:**
- `{ "election_id": 1, "voter_id": 1 }` (Unique compound index named `unique_voter_election_participation`)
  * Any attempt to insert a second record with identical `(election_id, voter_id)` triggers MongoDB error `11000 (DuplicateKeyError)`.

---

### 1.5 `votes` Collection
Stores the anonymous ballots containing candidate choices. **Never references voter identity.**

```json
{
  "_id": "ObjectId",
  "ballot_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "election_id": "UNION_PRESIDENT_2026",
  "candidate_id": "CAND_A",
  "cast_at": "ISODate"
}
```

**Indexes:**
- `{ "ballot_id": 1 }` (Unique)
- `{ "election_id": 1 }`

---

### 1.6 `audit_logs` Collection
Immutable log of security and administrative operations.

```json
{
  "_id": "ObjectId",
  "actor_id": "STU1001",
  "action": "VOTE_CAST_SUCCESS",
  "target_type": "election",
  "target_id": "UNION_PRESIDENT_2026",
  "timestamp": "ISODate",
  "metadata": {}
}
```

**Indexes:**
- `{ "timestamp": 1 }`
- `{ "action": 1 }`
