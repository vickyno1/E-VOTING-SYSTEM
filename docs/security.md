# Application Security & Biometric Threat Model

This document outlines the security architecture, threat model, biometric protections, and real-world electoral limitations of the **Secure E-Voting System with Face Recognition**.

---

## 1. Password & Credential Security

1. **Argon2id Password Hashing**: Passwords are never stored in plaintext. They are hashed using Argon2id (`time_cost=3`, `memory_cost=65536 KB`, `parallelism=4`, `hash_len=32`), providing robust defense against GPU/ASIC brute-force dictionary attacks.
2. **Policy Enforcement**: Passwords must be at least 8 characters long and contain both alphabetic characters and numerical digits.
3. **No Account Enumeration**: Failed login attempts return generic error messages (`"Invalid credentials or account does not exist"`) to prevent timing and enumeration attacks.

---

## 2. Biometric Security & Facial Recognition Design

1. **Feature Vector Extraction**:
   - The system utilizes the deep learning SFace model via OpenCV DNN.
   - Raw facial images sent during enrollment or verification are parsed in memory, transformed into 128-dimensional floating-point embeddings, and discarded.
   - **No permanent archival of raw user photos**: Only the mathematical vector is retained.
2. **Threshold Configuration**:
   - Default cosine similarity match threshold is set to `0.363` (matching the official OpenCV Zoo benchmark for SFace).
   - Higher values increase False Reject Rate (FRR); lower values increase False Accept Rate (FAR).
3. **Biometric Privacy Controls**:
   - User profile endpoints (`/api/auth/me`) rigorously strip `face_template` and `password_hash`.
   - Explicit informed biometric consent is required before camera capture.
4. **Biometric Threat Model & Presentation Attack Limitations**:
   - *Academic Scope*: Standard 2D webcam image verification cannot reliably detect sophisticated presentation attacks such as high-resolution photograph displays, tablet replays, silicone masks, or deepfakes.
   - *Production Recommendation*: Commercial deployments require hardware-backed structured-light 3D depth sensors, challenge-response active liveness (e.g., blinking/head turning), and infrared sensors.

---

## 3. Electoral Integrity & Duplicate Vote Prevention

1. **Strict One-Vote-Per-Voter Policy**:
   - Duplicate vote prevention is enforced directly inside the database through a compound unique index on `(election_id, voter_id)` in the `participation` collection.
   - Concurrent submissions or repeated HTTP requests trigger an atomic unique constraint violation (`DuplicateKeyError`), returning an immediate HTTP 409 Conflict.
2. **Separation of Concerns (Ballot Secrecy)**:
   - The system strictly isolates the `participation` record (which proves the voter exercised their right to vote) from the `votes` record (which stores the anonymous ballot choice).
   - Public APIs never expose which candidate a voter chose.
3. **Client-Side Non-Authority**:
   - Client-side checks (disabled buttons, React state, hidden forms) are strictly for user experience.
   - The backend independently re-validates voter eligibility, election status (`OPEN`), voting window (server UTC time), candidate validity, and prior participation before accepting a ballot.

---

## 4. Role-Based Access Control (RBAC)

1. **Two Distinct Roles**:
   - `voter`: Restricted to voter registration, face enrollment, viewing available elections, casting one ballot per open election, and viewing published results.
   - `staff`: Authorized to create elections, manage candidates, open/close elections, review turnout headcounts, calculate tallies, publish results, and inspect audit trails.
2. **No Public Staff Registration**:
   - Staff accounts cannot be registered via public forms or API payloads.
   - Submitting `"role": "admin"` in voter registration is ignored; the server hardcodes the role to `voter`.
   - Staff accounts can only be bootstrapped using the administrative CLI script `backend/scripts/create_staff.py`.

---

## 5. Audit Logging & Non-Repudiation

- High-impact events (`VOTER_REGISTRATION_INITIATED`, `VOTER_FACE_ENROLLED`, `VOTER_LOGIN_SUCCESS`, `FACE_VERIFICATION_FAILED`, `ELECTION_CREATED`, `ELECTION_OPENED`, `VOTE_CAST_SUCCESS`, `ELECTION_CLOSED`, `ELECTION_RESULTS_PUBLISHED`) are logged to the `audit_logs` collection.
- Audit entries record `actor_id`, `action`, `target_type`, `target_id`, and `timestamp`.
- Metadata is sanitized to ensure tokens, passwords, and biometric templates are never written to disk logs.
