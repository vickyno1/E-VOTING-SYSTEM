import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { voterApi } from '../../api/voter';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime } from '../../utils/formatters';
import { Vote, Calendar, Clock, AlertCircle, ArrowRight, BarChart3, CheckCircle2 } from 'lucide-react';

export const VoterDashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await voterApi.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load voter dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <p style={{ fontWeight: 600, color: 'var(--primary)' }}>Loading Elections &amp; Voter Status...</p>
      </div>
    );
  }

  const { open_elections = [], upcoming_elections = [], closed_elections = [] } = dashboardData || {};

  return (
    <div>
      {/* Welcome Header */}
      <div
        className="content-card"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%)',
          color: '#fff',
          marginBottom: '2rem',
          border: 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '1.85rem', marginBottom: '0.35rem' }}>
              Welcome, {user?.full_name || 'Voter'}!
            </h1>
            <p style={{ opacity: 0.9, fontSize: '0.95rem' }}>
              Voter ID: <strong style={{ color: '#fed7aa' }}>{user?.voter_id}</strong> &bull; Institutional Portal
            </p>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            Authentication: Verified Face Vector
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Section 1: Open Elections */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Vote size={22} color="var(--primary)" />
          <h2 style={{ fontSize: '1.35rem' }}>Active &amp; Open Elections</h2>
        </div>

        {open_elections.length === 0 ? (
          <div className="content-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
            There are currently no active open elections accepting votes.
          </div>
        ) : (
          <div className="grid-2">
            {open_elections.map((election) => (
              <div key={election.election_id} className="content-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.15rem' }}>{election.title}</h3>
                  <StatusBadge status={election.status} hasVoted={election.user_has_voted} />
                </div>

                <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', marginBottom: '1.25rem', flex: 1 }}>
                  {election.description || 'No description provided.'}
                </p>

                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--gray-500)',
                    borderTop: '1px solid var(--gray-200)',
                    paddingTop: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                    <Clock size={14} /> Ends: {formatDateTime(election.end_at)}
                  </div>
                </div>

                <div>
                  {election.user_has_voted ? (
                    <div
                      style={{
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        padding: '0.65rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <CheckCircle2 size={18} /> You Have Already Voted in This Election
                    </div>
                  ) : (
                    <Link
                      to={`/voter/elections/${election.election_id}/vote`}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      Cast Your Vote Now <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Upcoming Elections */}
      {upcoming_elections.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calendar size={22} color="var(--warning)" />
            <h2 style={{ fontSize: '1.35rem' }}>Upcoming Scheduled Elections</h2>
          </div>

          <div className="grid-2">
            {upcoming_elections.map((election) => (
              <div key={election.election_id} className="content-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.15rem' }}>{election.title}</h3>
                  <StatusBadge status={election.status} />
                </div>
                <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {election.description}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                  Voting Starts: {formatDateTime(election.start_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Closed & Published Elections */}
      {closed_elections.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <BarChart3 size={22} color="var(--secondary)" />
            <h2 style={{ fontSize: '1.35rem' }}>Closed &amp; Published Elections</h2>
          </div>

          <div className="grid-2">
            {closed_elections.map((election) => (
              <div key={election.election_id} className="content-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.15rem' }}>{election.title}</h3>
                  <StatusBadge status={election.status} hasVoted={election.user_has_voted} />
                </div>
                <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {election.description}
                </p>
                <div>
                  {election.status === 'RESULTS_PUBLISHED' ? (
                    <Link
                      to={`/voter/results/${election.election_id}`}
                      className="btn btn-outline-primary btn-sm"
                      style={{ width: '100%' }}
                    >
                      <BarChart3 size={16} /> View Certified Results
                    </Link>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontStyle: 'italic' }}>
                      Election closed. Official results pending staff audit and publication.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
