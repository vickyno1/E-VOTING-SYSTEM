import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { staffApi } from '../../api/staff';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime, formatPercentage } from '../../utils/formatters';
import { BarChart3, Award, ArrowLeft, CheckCheck, AlertCircle, ShieldCheck } from 'lucide-react';

export const StaffResultsPage = () => {
  const { electionId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [electionId]);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await staffApi.getResults(electionId);
      setResults(data.results);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to compute results. Ensure election is closed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Are you sure you want to officially PUBLISH certified results? This makes results visible to all registered voters.')) {
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const res = await staffApi.publishResults(electionId);
      setMessage(res.message || 'Results published successfully.');
      await fetchResults();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish results.');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <p style={{ fontWeight: 600, color: 'var(--primary)' }}>Computing Certified Vote Tally from Protected Database...</p>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="content-card" style={{ maxWidth: '540px', margin: '2rem auto', textAlign: 'center' }}>
        <AlertCircle size={44} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3>Results Unavailable</h3>
        <p style={{ color: 'var(--gray-600)', margin: '1rem 0' }}>
          {error || 'Results cannot be computed while election is still open.'}
        </p>
        <Link to="/staff/dashboard" className="btn btn-primary">
          Back to Staff Dashboard
        </Link>
      </div>
    );
  }

  const { title, candidates = [], total_votes = 0, winner, outcome, status, results_published_at } = results;

  return (
    <div style={{ maxWidth: '780px', margin: '1rem auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/staff/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gray-600)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Staff Dashboard
        </Link>
      </div>

      {message && (
        <div className="alert alert-success">
          <CheckCheck size={18} />
          <div>{message}</div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      <div className="content-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--dark)' }}>{title} &mdash; Official Results</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>
              Election ID: {electionId} &bull; Certified Database Aggregation
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Outcome Summary */}
        <div
          style={{
            backgroundColor: outcome === 'WINNER' ? 'var(--success-light)' : 'var(--warning-light)',
            border: `1px solid ${outcome === 'WINNER' ? '#bbf7d0' : '#fed7aa'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            textAlign: 'center',
            marginBottom: '2rem',
          }}
        >
          <Award size={36} color={outcome === 'WINNER' ? 'var(--success)' : 'var(--warning)'} style={{ marginBottom: '0.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', color: 'var(--dark)', marginBottom: '0.25rem' }}>
            {outcome === 'WINNER' ? `Elected Winner: ${winner}` : 'Outcome: Tie'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray-700)' }}>
            Total Valid Ballots Cast: <strong>{total_votes}</strong>
          </p>
        </div>

        {/* Candidate Tally Table */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Candidate Breakdown</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {candidates.map((cand) => {
              const isWinner = cand.name === winner;
              return (
                <div
                  key={cand.candidate_id}
                  style={{
                    border: `2px solid ${isWinner ? 'var(--success)' : 'var(--gray-200)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    backgroundColor: isWinner ? '#f0fdf4' : 'var(--white)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      {cand.name} ({cand.candidate_id})
                    </span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                      {cand.votes} votes ({formatPercentage(cand.percentage)})
                    </span>
                  </div>

                  <div
                    style={{
                      height: '10px',
                      backgroundColor: 'var(--gray-200)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${cand.percentage || 0}%`,
                        backgroundColor: isWinner ? 'var(--success)' : 'var(--primary)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Publication Control Button */}
        <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            {status === 'RESULTS_PUBLISHED' ? (
              <span style={{ color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCheck size={18} /> Official Results Published to Public Voter Portal
              </span>
            ) : (
              <span style={{ color: 'var(--warning)', fontSize: '0.9rem', fontWeight: 600 }}>
                Results are currently internal to staff. Voters cannot view them yet.
              </span>
            )}
          </div>

          {status !== 'RESULTS_PUBLISHED' && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="btn btn-success btn-lg"
            >
              <ShieldCheck size={18} /> {publishing ? 'Certifying & Publishing...' : 'Certify & Publish Results to Voters'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
