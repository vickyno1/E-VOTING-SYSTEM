import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { staffApi } from '../../api/staff';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime } from '../../utils/formatters';
import { ArrowLeft, Users, BarChart3, AlertCircle, CheckCircle2, User, Play, Square } from 'lucide-react';

export const ElectionDetailsPage = () => {
  const { electionId } = useParams();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDetails();
  }, [electionId]);

  const loadDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await staffApi.getElection(electionId);
      setElection(data.election);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load election details.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    if (!window.confirm('Are you sure you want to OPEN this election for voter ballots?')) return;
    setActionLoading(true);
    try {
      const res = await staffApi.openElection(electionId);
      setMessage(res.message);
      await loadDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to open election.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!window.confirm('Are you sure you want to CLOSE this election? No further ballots will be accepted.')) return;
    setActionLoading(true);
    try {
      const res = await staffApi.closeElection(electionId);
      setMessage(res.message);
      await loadDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close election.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <p style={{ fontWeight: 600, color: 'var(--primary)' }}>Loading Election Configuration...</p>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="content-card" style={{ maxWidth: '480px', margin: '2rem auto', textAlign: 'center' }}>
        <h3>Election Not Found</h3>
        <Link to="/staff/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const candidates = election.candidates || [];

  return (
    <div style={{ maxWidth: '800px', margin: '1rem auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/staff/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gray-600)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Staff Dashboard
        </Link>
      </div>

      {message && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <div>{message}</div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Main Details Card */}
      <div className="content-card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>
              Election Identifier: <strong style={{ color: 'var(--primary)' }}>{election.election_id}</strong>
            </div>
            <h1 style={{ fontSize: '1.65rem', color: 'var(--dark)' }}>{election.title}</h1>
          </div>
          <StatusBadge status={election.status} />
        </div>

        <p style={{ color: 'var(--gray-600)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
          {election.description || 'No description provided.'}
        </p>

        {/* Schedule & Participation Stats Grid */}
        <div className="grid-2" style={{ backgroundColor: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Voting Window</div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: '0.2rem' }}>
              {formatDateTime(election.start_at)} — {formatDateTime(election.end_at)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Voter Headcount / Turnout</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
              {election.participation_count || 0} Ballots Cast
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid var(--gray-200)', paddingTop: '1.25rem' }}>
          {election.status === 'DRAFT' && (
            <button
              onClick={handleOpen}
              disabled={actionLoading || candidates.length !== 2}
              className="btn btn-success"
            >
              <Play size={16} /> Open Election for Voting
            </button>
          )}

          {election.status === 'OPEN' && (
            <button
              onClick={handleClose}
              disabled={actionLoading}
              className="btn btn-danger"
            >
              <Square size={16} /> Close Election
            </button>
          )}

          {(election.status === 'CLOSED' || election.status === 'RESULTS_PUBLISHED') && (
            <Link to={`/staff/elections/${election.election_id}/results`} className="btn btn-primary">
              <BarChart3 size={16} /> Results Tally &amp; Official Certification
            </Link>
          )}
        </div>
      </div>

      {/* Configured Candidates Section */}
      <div className="content-card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Configured Candidates ({candidates.length}/2)</h2>

        <div className="grid-2">
          {candidates.map((cand) => (
            <div
              key={cand.candidate_id}
              style={{
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                backgroundColor: 'var(--white)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>{cand.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>ID: {cand.candidate_id}</div>
                </div>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--gray-600)', lineHeight: 1.4 }}>
                {cand.description || 'No manifesto provided.'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
