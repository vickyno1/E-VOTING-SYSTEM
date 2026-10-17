import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { staffApi } from '../../api/staff';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime } from '../../utils/formatters';
import {
  Users,
  Vote,
  PlusCircle,
  Clock,
  CheckCircle2,
  Lock,
  BarChart3,
  FileText,
  AlertCircle,
  Eye,
} from 'lucide-react';

export const StaffDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, elList] = await Promise.all([
        staffApi.getDashboard(),
        staffApi.getElections(),
      ]);
      setDashboardData(dash);
      setElections(elList.elections || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load staff dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenElection = async (electionId) => {
    if (!window.confirm(`Are you sure you want to OPEN election '${electionId}' for voter participation?`)) {
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const res = await staffApi.openElection(electionId);
      setMessage(res.message || 'Election is now OPEN.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to open election.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseElection = async (electionId) => {
    if (!window.confirm(`Are you sure you want to CLOSE election '${electionId}'? No further votes will be accepted.`)) {
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const res = await staffApi.closeElection(electionId);
      setMessage(res.message || 'Election is now CLOSED.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close election.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <p style={{ fontWeight: 600, color: 'var(--primary)' }}>Loading Staff Management Operations...</p>
      </div>
    );
  }

  const { stats = {} } = dashboardData || {};

  return (
    <div>
      {/* Staff Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--dark)' }}>Election Staff Administration</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Campus electoral oversight, candidate management, and certified results tally
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/staff/create-election" className="btn btn-primary">
            <PlusCircle size={18} /> Create New Election
          </Link>
          <Link to="/staff/audit-logs" className="btn btn-secondary">
            <FileText size={18} /> Audit Logs
          </Link>
        </div>
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

      {/* Metrics Row */}
      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        <div className="content-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark)' }}>
              {stats.total_voters || 0}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Registered Voters</div>
          </div>
        </div>

        <div className="content-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark)' }}>
              {stats.open_elections || 0}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Active Open Elections</div>
          </div>
        </div>

        <div className="content-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#f3e8ff',
              color: '#7e22ce',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Vote size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark)' }}>
              {stats.total_elections || 0}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Total Managed Elections</div>
          </div>
        </div>
      </div>

      {/* Elections Table */}
      <div className="content-card">
        <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>Elections Management</h2>

        {elections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
            No elections configured yet. Click "Create New Election" above to begin.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--gray-200)', color: 'var(--gray-600)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Identifier</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Election Title</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Candidates</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Turnout</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Voting Window</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {elections.map((el) => (
                  <tr key={el.election_id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {el.election_id}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600 }}>{el.title}</td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <StatusBadge status={el.status} />
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      {el.candidate_count || el.candidates?.length || 0} / 2 configured
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600 }}>
                      {el.participation_count || 0} ballots
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      {formatDateTime(el.start_at)} — {formatDateTime(el.end_at)}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Link to={`/staff/elections/${el.election_id}`} className="btn btn-secondary btn-sm" title="Manage Details">
                          <Eye size={14} /> Details
                        </Link>

                        {el.status === 'DRAFT' && (
                          <button
                            onClick={() => handleOpenElection(el.election_id)}
                            disabled={actionLoading}
                            className="btn btn-success btn-sm"
                          >
                            Open Election
                          </button>
                        )}

                        {el.status === 'OPEN' && (
                          <button
                            onClick={() => handleCloseElection(el.election_id)}
                            disabled={actionLoading}
                            className="btn btn-danger btn-sm"
                          >
                            Close Election
                          </button>
                        )}

                        {(el.status === 'CLOSED' || el.status === 'RESULTS_PUBLISHED') && (
                          <Link to={`/staff/elections/${el.election_id}/results`} className="btn btn-outline-primary btn-sm">
                            <BarChart3 size={14} /> Tally &amp; Publish
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
