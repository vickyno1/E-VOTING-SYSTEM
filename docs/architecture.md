# System Architecture & Technical Design

This document details the software architecture, data flow, component interactions, and security boundaries of the **Secure E-Voting System with Biometric Facial Recognition**.

---

## 1. High-Level Architectural Overview

The system employs a decoupled, service-oriented client-server architecture:

```mermaid
graph TD
    Client["React Frontend (Vite, MediaDevices Webcam)"]
    API["Flask REST API Gateway (CORS, Auth Middleware)"]
    AuthSvc["Auth Service (Argon2id, PyJWT)"]
    FaceSvc["Face Service (OpenCV YuNet + SFace ONNX)"]
    ElecSvc["Election Service (Lifecycle Engine)"]
    VoteSvc["Voting Service (Atomic Deduplication)"]
    ResultsSvc["Results Service (Cryptographic Tally)"]
    AuditSvc["Audit Service (Security Event Trail)"]
    
    DB[("MongoDB Database")]

    Client -->|HTTPS / JSON + Biometric Probe| API
    API --> AuthSvc
    API --> FaceSvc
    API --> ElecSvc
    API --> VoteSvc
    API --> ResultsSvc
    API --> AuditSvc

    AuthSvc --> DB
    ElecSvc --> DB
    VoteSvc --> DB
    ResultsSvc --> DB
    AuditSvc --> DB
```

### Key Components

1. **Client Tier (`frontend/`)**: Single-Page Application (SPA) built using React 18, Vite, React Router 6, and Axios. Utilizes the HTML5 MediaDevices API for real-time video streaming, facial viewfinder alignment, and frame capture.
2. **Server Tier (`backend/`)**: Python 3.11+ Flask application utilizing blueprint modularization, Argon2 password hashing, and role-based JWT authorization (`voter` vs. `staff`).
3. **Computer Vision Tier (`backend/app/services/face_service.py`)**: OpenCV DNN runtime loading official ONNX models:
   - **Detector**: YuNet (`face_detection_yunet_2023mar.onnx`) for single-face localization and landmark detection.
   - **Recognizer**: SFace (`face_recognition_sface_2021dec.onnx`) for extracting 128-dimensional normalized feature embeddings.
4. **Database Tier (`MongoDB`)**: Document store enforcing uniqueness and concurrency guarantees via compound indexes.

---

## 2. Authentication & Facial Verification Workflow

The system mandates two-factor authentication for registered voters: password credentials followed by fresh live facial verification.

```mermaid
sequenceDiagram
    autonumber
    actor Voter
    participant Web as React Frontend
    participant Server as Flask Backend
    participant Face as OpenCV SFace Engine
    participant DB as MongoDB

    Voter->>Web: Enters Voter ID & Password
    Web->>Server: POST /api/auth/login {identifier, password}
    Server->>DB: Query user by voter_id/email
    DB-->>Server: User record (password_hash, face_template)
    Server->>Server: Verify Argon2id hash
    Server-->>Web: 200 OK {step: "face_verification_required", challenge_token}
    
    Web->>Voter: Activates camera with oval viewfinder
    Voter->>Web: Captures live frame
    Web->>Server: POST /api/auth/verify-face {challenge_token, image}
    Server->>Face: Single-face validation & feature extraction
    Face-->>Server: 128-d probe embedding
    Server->>Server: Cosine similarity against enrolled template
    alt Similarity >= 0.363 (Match)
        Server->>DB: Log VOTER_LOGIN_SUCCESS
        Server-->>Web: 200 OK + Authenticated Session JWT
        Web->>Voter: Redirects to Voter Dashboard
    else Similarity < 0.363 (Mismatch)
        Server->>DB: Log FACE_VERIFICATION_FAILED
        Server-->>Web: 401 Unauthorized ("Face does not match profile")
    end
```

> **Crucial Invariant**: Even if a voter has already cast a vote in an election, **login is never blocked**. The voter logs in normally and sees the **Already Voted** state on their dashboard.

---

## 3. Atomic Voting & Duplicate-Vote Prevention

Duplicate voting prevention is enforced at the database level using a compound unique index on `(election_id, voter_id)`.

```mermaid
sequenceDiagram
    autonumber
    actor Voter
    participant Web as React Frontend
    participant VoteSvc as Voting Service
    participant DB as MongoDB

    Voter->>Web: Selects Candidate & clicks "Confirm Vote"
    Web->>VoteSvc: POST /api/voter/elections/{id}/vote {candidate_id}
    VoteSvc->>VoteSvc: Verify election is OPEN & within UTC time window
    VoteSvc->>VoteSvc: Verify candidate belongs to election
    VoteSvc->>VoteSvc: Generate opaque UUID ballot_id

    critical Atomic Write Guarantee
        VoteSvc->>DB: Insert participation record (election_id, voter_id, ballot_id)
        alt First Vote Attempt
            DB-->>VoteSvc: Insert Success
            VoteSvc->>DB: Insert anonymous ballot (ballot_id, election_id, candidate_id)
            DB-->>VoteSvc: Ballot Stored
            VoteSvc-->>Web: 200 OK {status: "vote_recorded"}
            Web->>Voter: Redirect to Vote Accepted Page
        else Duplicate Vote Attempt (Concurrent or Replay)
            DB-->>VoteSvc: DuplicateKeyError (E11000)
            VoteSvc-->>Web: 409 Conflict {status: "already_voted"}
            Web->>Voter: Displays "Already Voted" restriction
        end
    end
```

---

## 4. Privacy-Preserving Data Architecture

To decouple identity from voting choices, the database strictly segregates voter records from candidate selections:

1. **Participation Collection (`participation`)**: Answers *whether* a voter has cast a ballot (`election_id`, `voter_id`, `ballot_id`, `cast_at`).
2. **Vote Collection (`votes`)**: Answers *which* candidates received votes (`ballot_id`, `election_id`, `candidate_id`, `cast_at`). **No voter ID, name, email, or IP address is stored in this collection.**

---

## 5. Election Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Staff creates election
    DRAFT --> SCHEDULED: Start time set in future
    DRAFT --> OPEN: Staff opens (requires exactly 2 candidates)
    SCHEDULED --> OPEN: Scheduled time arrives or staff opens
    OPEN --> CLOSED: Time expires or staff closes
    CLOSED --> RESULTS_PUBLISHED: Staff certifies & publishes results
    RESULTS_PUBLISHED --> [*]
```

- **Candidate Immutability**: Once an election enters `OPEN`, candidate details cannot be altered.
- **Result Confidentiality**: Candidate vote tallies are strictly inaccessible to voters until the status transitions to `RESULTS_PUBLISHED`.
