import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { staffApi } from '../../api/staff';
import { formatDateTime } from '../../utils/formatters';
import { FileText, ArrowLeft, Shield, AlertCircle, RefreshCw } from 'lucide-react';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await staffApi.getAuditLogs(100, 0);
      setLogs(data.audit_logs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve system audit logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '1rem auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <Link to="/staff/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gray-600)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Staff Dashboard
        </Link>
        <button onClick={fetchLogs} disabled={loading} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      <div className="content-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
          <Shield size={24} color="var(--primary)" />
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--dark)' }}>Security &amp; Operational Audit Trail</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>
              Immutable operational logs tracking voter registration, authentication, state transitions, and vote commitments
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <div>{error}</div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--primary)' }}>
            Retrieving tamper-evident audit trail...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
            No audit records recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--gray-200)', color: 'var(--gray-600)' }}>
                  <th style={{ padding: '0.65rem 0.5rem' }}>Timestamp</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>Action Event</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>Actor</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>Target</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '0.65rem 0.5rem', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem', fontWeight: 600 }}>
                      {log.actor_id}
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem', color: 'var(--gray-600)' }}>
                      {log.target_type}: {log.target_id}
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem', color: 'var(--gray-500)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {log.metadata && Object.keys(log.metadata).length > 0 ? JSON.stringify(log.metadata) : '—'}
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
