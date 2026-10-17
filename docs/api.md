# REST API Specification & Endpoint Documentation

Base URL: `http://localhost:5000/api`

All requests and responses use `application/json` unless otherwise specified. Authentication is established via HTTP Bearer token or HttpOnly `session_token` cookies.

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Voter Registration
- **Route**: `POST /api/auth/register`
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "full_name": "Alice Walker",
    "voter_id": "STU1001",
    "email": "alice@college.edu",
    "password": "SecurePassword123!",
    "confirm_password": "SecurePassword123!",
    "profile_data": { "department": "Computer Science" }
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "user": { "id": "...", "voter_id": "STU1001", "email": "alice@college.edu", "role": "voter", "account_status": "PENDING_BIOMETRIC" },
      "enrollment_token": "<jwt_token>",
      "message": "Personal details registered successfully. Please proceed to face registration."
    }
    ```
  - `400 Bad Request`: Validation failure (weak password, duplicate ID or email, missing fields).

### 1.2 Face Enrollment
- **Route**: `POST /api/auth/enroll-face`
- **Auth**: Enrollment Token (Bearer or JSON `enrollment_token`)
- **Request Body**:
  ```json
  {
    "enrollment_token": "<jwt_token>",
    "consent": true,
    "image": "data:image/jpeg;base64,..."
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "user": { "id": "...", "voter_id": "STU1001", "face_enrolled": true, "account_status": "ACTIVE" },
      "token": "<session_jwt>",
      "message": "Face registered successfully. Your account is now active."
    }
    ```
  - `400 Bad Request`: Biometric consent not granted or missing token.
  - `422 Unprocessable Entity`: Quality failure (no face detected, multiple faces, image too dark).

### 1.3 Login (Step 1: Credentials)
- **Route**: `POST /api/auth/login`
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "identifier": "STU1001",
    "password": "SecurePassword123!"
  }
  ```
- **Responses**:
  - `200 OK (Voter)`:
    ```json
    {
      "step": "face_verification_required",
      "challenge_token": "<challenge_jwt>",
      "voter_name": "Alice Walker",
      "message": "Credentials verified. Please complete face verification."
    }
    ```
  - `200 OK (Staff)`:
    ```json
    {
      "step": "completed",
      "role": "staff",
      "token": "<session_jwt>",
      "user": { "full_name": "Chief Election Officer", "role": "staff" }
    }
    ```
  - `401 Unauthorized`: Invalid credentials.

### 1.4 Face Verification (Step 2: Biometric Probe)
- **Route**: `POST /api/auth/verify-face`
- **Auth**: None (Requires valid `challenge_token`)
- **Request Body**:
  ```json
  {
    "challenge_token": "<challenge_jwt>",
    "image": "data:image/jpeg;base64,..."
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "token": "<session_jwt>",
      "user": { "voter_id": "STU1001", "role": "voter" },
      "message": "Authentication and face verification successful."
    }
    ```
  - `401 Unauthorized`: Face embedding does not match registered profile template.
  - `422 Unprocessable Entity`: Frame quality issue.

### 1.5 User Profile
- **Route**: `GET /api/auth/me`
- **Auth**: Bearer Token or Session Cookie (`voter` or `staff`)
- **Response**: `200 OK` with sanitized user object (no password or biometric vectors).

### 1.6 Logout
- **Route**: `POST /api/auth/logout`
- **Auth**: Bearer Token or Session Cookie
- **Response**: `200 OK` with cleared session cookie.

---

## 2. Voter Endpoints (`/api/voter`)

### 2.1 Voter Dashboard
- **Route**: `GET /api/voter/dashboard`
- **Auth**: `voter` role required
- **Response**: `200 OK`
  ```json
  {
    "voter": { "voter_id": "STU1001", "full_name": "Alice Walker" },
    "open_elections": [ ... ],
    "upcoming_elections": [ ... ],
    "closed_elections": [ ... ],
    "already_voted_elections": [ ... ]
  }
  ```

### 2.2 Election Details
- **Route**: `GET /api/voter/elections/<election_id>`
- **Auth**: `voter` role required
- **Response**: `200 OK` with election details, candidates, and `user_has_voted` flag.

### 2.3 Voter Participation Status
- **Route**: `GET /api/voter/elections/<election_id>/status`
- **Auth**: `voter` role required
- **Response**: `200 OK`
  ```json
  {
    "election_id": "PRESIDENT2026",
    "voter_id": "STU1001",
    "has_voted": true,
    "status": "ALREADY_VOTED"
  }
  ```
  *(Note: The chosen candidate is strictly omitted).*

### 2.4 Cast Vote (Atomic Ballot Submission)
- **Route**: `POST /api/voter/elections/<election_id>/vote`
- **Auth**: `voter` role required
- **Request Body**:
  ```json
  {
    "candidate_id": "CAND_A"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "status": "vote_recorded",
      "message": "Your vote has been securely recorded.",
      "election_id": "PRESIDENT2026"
    }
    ```
  - `409 Conflict`:
    ```json
    {
      "error": "Duplicate Vote",
      "status": "already_voted",
      "message": "A vote has already been submitted and accepted for this voter in this election."
    }
    ```
  - `400 Bad Request`: Election is not in OPEN status, or current server time is outside voting window, or candidate belongs to another election.

### 2.5 View Certified Results
- **Route**: `GET /api/voter/results/<election_id>`
- **Auth**: `voter` role required
- **Responses**:
  - `200 OK`: Certified results (candidate vote tallies, percentage bars, winner).
  - `403 Forbidden`: Election is not in `RESULTS_PUBLISHED` state.

---

## 3. Staff Endpoints (`/api/staff`)

Requires `staff` role authorization.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/staff/dashboard` | Returns summary metrics: total registered voters, election counts by status. |
| `GET` | `/api/staff/elections` | Returns all elections with candidate counts and turnout headcount. |
| `POST` | `/api/staff/elections` | Creates a new election in `DRAFT` state. |
| `GET` | `/api/staff/elections/<id>` | Retrieves election configuration and candidates. |
| `PUT` | `/api/staff/elections/<id>` | Updates title, description, or schedule (only allowed in DRAFT/SCHEDULED). |
| `POST` | `/api/staff/elections/<id>/candidates` | Adds Candidate A or Candidate B (max 2 for initial version). |
| `POST` | `/api/staff/elections/<id>/open` | Opens election for voter participation (verifies exactly 2 candidates). |
| `POST` | `/api/staff/elections/<id>/close` | Closes election; halts all incoming vote submissions. |
| `POST` | `/api/staff/elections/<id>/publish-results` | Publishes computed results to the public voter portal. |
| `GET` | `/api/staff/elections/<id>/participation` | Returns turnout statistics (headcount only, no choices). |
| `GET` | `/api/staff/elections/<id>/results` | Computes tally per candidate (accessible when CLOSED or RESULTS_PUBLISHED). |
| `GET` | `/api/staff/audit-logs` | Retrieves paginated operational and security audit records. |
