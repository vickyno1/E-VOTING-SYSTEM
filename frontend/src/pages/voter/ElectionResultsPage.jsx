import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { voterApi } from '../../api/voter';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime, formatPercentage } from '../../utils/formatters';
import { Award, BarChart3, ArrowLeft, Users, AlertCircle, CheckCheck } from 'lucide-react';

export const ElectionResultsPage = () => {
  const { electionId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [electionId]);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await voterApi.getResults(electionId);
      setResults(data.results);
    } catch (err) {
      setError(err.response?.data?.message || 'Results are not available for this election yet.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <p style={{ fontWeight: 600, color: 'var(--primary)' }}>Retrieving Certified Election Results...</p>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="content-card" style={{ maxWidth: '540px', margin: '2rem auto', textAlign: 'center' }}>
        <AlertCircle size={44} color="var(--warning)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Results Not Available</h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {error || 'Results have not been officially certified or published by the election staff yet.'}
        </p>
        <Link to="/voter/dashboard" className="btn btn-primary">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const { title, description, candidates = [], total_votes = 0, winner, outcome, results_published_at } = results;

  return (
    <div style={{ maxWidth: '780px', margin: '1rem auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/voter/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gray-600)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Voter Dashboard
        </Link>
      </div>

      <div className="content-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--dark)' }}>{title}</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Official Certified Election Results &bull; Published: {formatDateTime(results_published_at)}
            </p>
          </div>
          <StatusBadge status="RESULTS_PUBLISHED" />
        </div>

        <p style={{ color: 'var(--gray-600)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          {description}
        </p>

        {/* Winner Banner */}
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
            {outcome === 'WINNER' ? `Elected: ${winner}` : 'Election Result: Tie'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray-700)' }}>
            Total Valid Ballots Cast: <strong>{total_votes}</strong>
          </p>
        </div>

        {/* Candidate Tally Breakdown */}
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Final Vote Tally</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {candidates.map((candidate) => {
              const isWinner = winner === candidate.name;
              return (
                <div
                  key={candidate.candidate_id}
                  style={{
                    border: `2px solid ${isWinner ? 'var(--success)' : 'var(--gray-200)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    backgroundColor: isWinner ? '#f0fdf4' : 'var(--white)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '1.15rem' }}>{candidate.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginLeft: '0.5rem' }}>
                        ({candidate.candidate_id})
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--dark)' }}>
                        {candidate.votes}
                      </span>{' '}
                      <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>votes</span>{' '}
                      <span style={{ fontWeight: 700, color: 'var(--primary)', marginLeft: '0.5rem' }}>
                        ({formatPercentage(candidate.percentage)})
                      </span>
                    </div>
                  </div>

                  {/* Percentage Progress Bar */}
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
                        width: `${candidate.percentage || 0}%`,
                        backgroundColor: isWinner ? 'var(--success)' : 'var(--primary)',
                        transition: 'width 0.8s ease-in-out',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
