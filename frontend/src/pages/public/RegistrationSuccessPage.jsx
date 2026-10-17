import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export const RegistrationSuccessPage = () => {
  const location = useLocation();
  const user = location.state?.user;

  return (
    <div style={{ maxWidth: '520px', margin: '2rem auto' }}>
      <div className="content-card" style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <CheckCircle2 size={36} />
        </div>

        <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Registration Complete!</h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Your student voter account and biometric face template have been successfully verified and registered in the system.
        </p>

        <div
          style={{
            backgroundColor: 'var(--gray-50)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'left',
            marginBottom: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Voter Name:</span>
            <span style={{ fontWeight: 600 }}>{user?.full_name || 'Registered Voter'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Voter ID:</span>
            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{user?.voter_id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Biometric Status:</span>
            <span style={{ fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShieldCheck size={14} /> ACTIVE &amp; ENROLLED
            </span>
          </div>
        </div>

        <Link to="/voter/dashboard" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
          Go to Voter Dashboard <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
};
