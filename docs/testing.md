# Testing Strategy & Automated Test Suite

The system includes a comprehensive automated test suite implemented in **Pytest** covering registration, authentication, biometric similarity calculations, election lifecycles, atomic voting deduplication, and result tally computations.

---

## 1. Running the Test Suite

From the project root:

```bash
# Activate Python virtual environment
# Windows PowerShell:
backend\venv\Scripts\Activate.ps1

# Run all automated tests
pytest backend/tests -v
```

Or from the `backend/` directory:

```bash
cd backend
pytest -v
```

---

## 2. Test File Matrix & Coverage

| Test File | Target Module | Verified Behaviors |
|---|---|---|
| `test_auth.py` | `AuthService`, `UserRepository` | Voter registration, duplicate voter ID rejection, duplicate email rejection, Argon2 password verification, unauthenticated access blocking. |
| `test_face_service.py` | `FaceService` | Cosine similarity calculation, orthogonal vectors, face quality checks (resolution, underexposure, overexposure), threshold comparison. |
| `test_elections.py` | `ElectionService` | Election creation, time window validation, enforcement of **exactly two candidates** before opening, rejection of >2 candidates, lifecycle transitions (`DRAFT` &rarr; `OPEN` &rarr; `CLOSED` &rarr; `RESULTS_PUBLISHED`). |
| `test_voting.py` | `VotingService` | Legitimate vote recording, candidate validation (belonging to current election), voting outside time window rejected, closed election rejection. |
| `test_duplicate_voting.py` | `VotingService`, `ParticipationRepository` | **Section 11 End-to-End Scenario**: voter registers, logs in, votes Candidate A, dashboard reflects Already Voted, voter logs out, logs back in (login is NOT blocked!), attempts second vote (strictly rejected with 409), live results protected until publication, results viewable after publication. |
| `test_results.py` | `ResultsService` | Vote tally calculation from persisted ballots, tie detection, vote percentage accuracy, voter forbidden from accessing unpublished tallies, staff review. |

---

## 3. Test Isolation & Mocks

- **Database Mocking**: Tests utilize `mongomock` in `backend/tests/conftest.py`, creating a clean, isolated in-memory MongoDB environment for every single test without touching or corrupting production data.
- **Biometric Hardware Mocks**: Camera hardware and image acquisition are abstracted into normalized floating-point embedding vectors, enabling 100% deterministic, lightning-fast test execution in CI/CD pipelines without requiring physical webcam hardware.
