import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';
import { User, ShieldCheck, Mail, Key, LogOut } from 'lucide-react';

export const VoterProfilePage = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: '580px', margin: '2rem auto' }}>
      <div className="content-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              fontSize: '1.75rem',
            }}
          >
            <User size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{user?.full_name}</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Registered University Voter</p>
        </div>

        <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--gray-100)' }}>
            <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Voter ID:</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{user?.voter_id}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--gray-100)' }}>
            <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Email Address:</span>
            <span style={{ fontWeight: 600 }}>{user?.email}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--gray-100)' }}>
            <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Biometric Status:</span>
            <span style={{ fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={16} /> Active &amp; Enrolled
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--gray-100)' }}>
            <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Enrollment Date:</span>
            <span style={{ color: 'var(--gray-700)', fontSize: '0.9rem' }}>{formatDateTime(user?.face_enrolled_at || user?.created_at)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
            <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Account Role:</span>
            <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{user?.role}</span>
          </div>
        </div>

        <button onClick={logout} className="btn btn-secondary" style={{ width: '100%' }}>
          <LogOut size={16} /> Sign Out of Portal
        </button>
      </div>
    </div>
  );
};
