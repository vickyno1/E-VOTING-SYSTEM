import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { staffApi } from '../../api/staff';
import { PlusCircle, ArrowLeft, AlertCircle, CheckCircle2, User } from 'lucide-react';

export const CreateElectionPage = () => {
  const navigate = useNavigate();

  // Election Details
  const [electionData, setElectionData] = useState({
    election_id: '',
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    eligibility_rule: 'ALL_VOTERS',
  });

  // Exactly Two Candidates (Candidate A & Candidate B)
  const [candidate1, setCandidate1] = useState({
    candidate_id: 'CAND_A',
    name: '',
    description: '',
    photo_url: '',
  });

  const [candidate2, setCandidate2] = useState({
    candidate_id: 'CAND_B',
    name: '',
    description: '',
    photo_url: '',
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleElectionChange = (e) => {
    setElectionData({ ...electionData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!electionData.election_id.trim()) {
      setError('Election ID is required.');
      return;
    }

    if (!candidate1.name.trim() || !candidate2.name.trim()) {
      setError('Both Candidate 1 and Candidate 2 names are required before creating the election.');
      return;
    }

    const start = new Date(electionData.start_at);
    const end = new Date(electionData.end_at);
    if (start >= end) {
      setError('Election start time must be strictly before end time.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Draft Election
      await staffApi.createElection({
        ...electionData,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
      });

      // 2. Add Candidate 1
      await staffApi.addCandidate(electionData.election_id, candidate1);

      // 3. Add Candidate 2
      await staffApi.addCandidate(electionData.election_id, candidate2);

      navigate('/staff/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create election with candidates.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '1rem auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/staff/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gray-600)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Staff Dashboard
        </Link>
      </div>

      <div className="content-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <PlusCircle size={24} color="var(--primary)" />
          <h1 style={{ fontSize: '1.5rem', color: 'var(--dark)' }}>Create Election with Exactly Two Candidates</h1>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Election Information */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
              1. Election Schedule &amp; Metadata
            </h2>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="election_id">
                  Election Identifier (Unique)
                </label>
                <input
                  id="election_id"
                  name="election_id"
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. UNION_PRESIDENT_2026"
                  value={electionData.election_id}
                  onChange={handleElectionChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="title">
                  Election Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Student Union Presidential Election"
                  value={electionData.title}
                  onChange={handleElectionChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Election Description / Purpose
              </label>
              <textarea
                id="description"
                name="description"
                rows="2"
                className="form-control"
                placeholder="Briefly state the purpose, positions, and rules of this election"
                value={electionData.description}
                onChange={handleElectionChange}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="start_at">
                  Voting Start Time (Local)
                </label>
                <input
                  id="start_at"
                  name="start_at"
                  type="datetime-local"
                  required
                  className="form-control"
                  value={electionData.start_at}
                  onChange={handleElectionChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="end_at">
                  Voting End Time (Local)
                </label>
                <input
                  id="end_at"
                  name="end_at"
                  type="datetime-local"
                  required
                  className="form-control"
                  value={electionData.end_at}
                  onChange={handleElectionChange}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Candidate A Configuration */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
              2. Candidate A Configuration
            </h2>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Candidate Identifier</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={candidate1.candidate_id}
                  onChange={(e) => setCandidate1({ ...candidate1, candidate_id: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Alice Walker"
                  value={candidate1.name}
                  onChange={(e) => setCandidate1({ ...candidate1, name: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Manifesto or Statement</label>
              <textarea
                rows="2"
                className="form-control"
                placeholder="Candidate's platform summary"
                value={candidate1.description}
                onChange={(e) => setCandidate1({ ...candidate1, description: e.target.value })}
              />
            </div>
          </div>

          {/* Section 3: Candidate B Configuration */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem', color: 'var(--secondary)' }}>
              3. Candidate B Configuration
            </h2>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Candidate Identifier</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={candidate2.candidate_id}
                  onChange={(e) => setCandidate2({ ...candidate2, candidate_id: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Robert Vance"
                  value={candidate2.name}
                  onChange={(e) => setCandidate2({ ...candidate2, name: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Manifesto or Statement</label>
              <textarea
                rows="2"
                className="form-control"
                placeholder="Candidate's platform summary"
                value={candidate2.description}
                onChange={(e) => setCandidate2({ ...candidate2, description: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Link to="/staff/dashboard" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
              {loading ? 'Configuring Election...' : 'Create Election & Candidates'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
