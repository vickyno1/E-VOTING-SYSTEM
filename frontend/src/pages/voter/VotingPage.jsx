import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { voterApi } from '../../api/voter';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime } from '../../utils/formatters';
import { Vote, CheckCircle2, AlertTriangle, ArrowLeft, ShieldCheck, User } from 'lucide-react';

export const VotingPage = () => {
  const { electionId } = useParams();
  const navigate = useNavigate();

  const [election, setElection] = useState(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadElectionDetails();
  }, [electionId]);

  const loadElectionDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await voterApi.getElection(electionId);
      setElection(data.election);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load election details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCastVote = async () => {
    if (!selectedCandidateId) {
      setError('Please select a candidate before proceeding.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await voterApi.castVote(electionId, selectedCandidateId);
      // Navigate to Vote Success confirmation page
      navigate(`/voter/elections/${electionId}/vote-success`, {
        state: {
          election_title: election?.title,
          status: res.status,
        },
      });
    } catch (err) {
      const status = err.response?.data?.status;
      const msg = err.response?.data?.message || err.message || 'Vote submission failed.';

      if (status === 'already_voted' || err.response?.status === 409) {
        // Update local state to already voted
        setElection((prev) => ({ ...prev, user_has_voted: true }));
        setIsConfirming(false);
        setError('You have already submitted a vote in this election. Further votes are strictly disallowed.');
      } else {
        setError(msg);
        setIsConfirming(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <p style={{ fontWeight: 600, color: 'var(--primary)' }}>Verifying Voter Eligibility &amp; Election Data...</p>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="content-card" style={{ maxWidth: '480px', margin: '2rem auto', textAlign: 'center' }}>
        <AlertTriangle size={40} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3>Election Not Found</h3>
        <p style={{ color: 'var(--gray-600)', margin: '1rem 0' }}>
          The requested election identifier does not exist or has been removed.
        </p>
        <Link to="/voter/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Already Voted State Check
  if (election.user_has_voted) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="content-card" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Vote Already Recorded</h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Our records confirm that you have already cast your one allowed ballot for <strong>{election.title}</strong>.
          </p>

          <div
            style={{
              backgroundColor: 'var(--gray-50)',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.75rem',
              fontSize: '0.9rem',
              color: 'var(--gray-700)',
            }}
          >
            One voter can cast only one vote per election. In accordance with ballot secrecy standards, your individual candidate choice
            is stored anonymously and detached from your voter ID.
          </div>

          <Link to="/voter/dashboard" className="btn btn-primary">
            <ArrowLeft size={16} /> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Election Not Open State Check
  if (election.status !== 'OPEN') {
    return (
      <div className="content-card" style={{ maxWidth: '540px', margin: '2rem auto', textAlign: 'center' }}>
        <AlertTriangle size={40} color="var(--warning)" style={{ marginBottom: '1rem' }} />
        <h3>Voting Window Inactive</h3>
        <p style={{ color: 'var(--gray-600)', margin: '1rem 0' }}>
          This election is currently in <strong>{election.status}</strong> status and cannot accept ballots.
        </p>
        <Link to="/voter/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const candidates = election.candidates || [];
  const selectedCandidate = candidates.find((c) => c.candidate_id === selectedCandidateId);

  return (
    <div style={{ maxWidth: '800px', margin: '1rem auto' }}>
      {/* Header Banner */}
      <div className="content-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Link to="/voter/dashboard" style={{ display: 'flex', alignItems: 'center', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                <ArrowLeft size={14} /> Back
              </Link>
              <span style={{ color: 'var(--gray-300)' }}>|</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>ID: {election.election_id}</span>
            </div>
            <h1 style={{ fontSize: '1.6rem', color: 'var(--dark)' }}>{election.title}</h1>
          </div>
          <StatusBadge status={election.status} />
        </div>

        <p style={{ color: 'var(--gray-600)', fontSize: '0.95rem', margin: '0.75rem 0 1rem' }}>
          {election.description}
        </p>

        <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span>Voting Ends: {formatDateTime(election.end_at)}</span>
          <span>Rule: Exactly 1 Candidate Selection</span>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      {!isConfirming ? (
        <>
          {/* Candidate Selection Cards */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--dark)' }}>
              Select Exactly One Candidate:
            </h2>

            <div className="grid-2">
              {candidates.map((candidate) => {
                const isSelected = selectedCandidateId === candidate.candidate_id;
                return (
                  <div
                    key={candidate.candidate_id}
                    onClick={() => {
                      setSelectedCandidateId(candidate.candidate_id);
                      setError(null);
                    }}
                    className={`candidate-selection-card ${isSelected ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="candidate_selection"
                      checked={isSelected}
                      onChange={() => setSelectedCandidateId(candidate.candidate_id)}
                      className="candidate-radio"
                    />

                    {candidate.photo_url ? (
                      <img src={candidate.photo_url} alt={candidate.name} className="candidate-avatar" />
                    ) : (
                      <div className="candidate-avatar">
                        <User size={40} />
                      </div>
                    )}

                    <h3 style={{ fontSize: '1.2rem', textAlign: 'center', marginBottom: '0.35rem' }}>
                      {candidate.name}
                    </h3>
                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.75rem' }}>
                      Candidate ID: {candidate.candidate_id}
                    </div>

                    <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.45, flex: 1, textAlign: 'center' }}>
                      {candidate.description || 'No manifesto provided.'}
                    </p>

                    <div
                      style={{
                        marginTop: '1rem',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: isSelected ? 'var(--primary)' : 'var(--gray-400)',
                      }}
                    >
                      {isSelected ? '✓ Selected Choice' : 'Click to Select'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Link to="/voter/dashboard" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => {
                if (!selectedCandidateId) {
                  setError('Please select a candidate to cast your vote.');
                  return;
                }
                setIsConfirming(true);
              }}
              disabled={!selectedCandidateId}
              className="btn btn-primary btn-lg"
            >
              Review Selection &amp; Confirm
            </button>
          </div>
        </>
      ) : (
        /* Confirmation Screen */
        <div className="content-card" style={{ border: '2px solid var(--primary)', backgroundColor: 'var(--white)' }}>
          <h2 style={{ fontSize: '1.45rem', marginBottom: '1rem', textAlign: 'center' }}>
            Confirm Your Ballot Submission
          </h2>

          <div
            style={{
              backgroundColor: 'var(--primary-light)',
              border: '1px solid #bfdbfe',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>
              Election: {election.title}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
              You are casting your single official vote for:
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem' }}>
              {selectedCandidate?.name}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
              Candidate ID: {selectedCandidate?.candidate_id}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--warning-light)',
              border: '1px solid #fed7aa',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              fontSize: '0.85rem',
              color: '#9a3412',
              marginBottom: '1.5rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
            }}
          >
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Irreversible Action:</strong> Once confirmed, this ballot will be committed to the database.
              You will not be able to alter your choice or cast another vote in this election.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              disabled={submitting}
              className="btn btn-secondary"
            >
              Change Selection
            </button>

            <button
              type="button"
              onClick={handleCastVote}
              disabled={submitting}
              className="btn btn-success btn-lg"
            >
              {submitting ? 'Recording Atomic Vote...' : 'Confirm and Cast Vote'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
