import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, ArrowRight, LayoutDashboard } from 'lucide-react';

export const VoteSuccessPage = () => {
  const location = useLocation();
  const electionTitle = location.state?.election_title || 'Election';

  return (
    <div style={{ maxWidth: '540px', margin: '2rem auto' }}>
      <div className="content-card" style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '68px',
            height: '68px',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <CheckCircle2 size={40} />
        </div>

        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--dark)' }}>
          Vote Accepted!
        </h1>

        <p style={{ color: 'var(--gray-600)', fontSize: '1rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          Your ballot for <strong>{electionTitle}</strong> has been successfully accepted and atomically recorded into the protected vote collection.
        </p>

        <div
          style={{
            backgroundColor: 'var(--gray-50)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'left',
            marginBottom: '1.75rem',
            fontSize: '0.88rem',
            color: 'var(--gray-700)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>
            <ShieldCheck size={18} /> Verified Participation Summary
          </div>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.6 }}>
            <li>Your voter participation record is now active and locked.</li>
            <li>This election will now display <strong>Already Voted</strong> on your dashboard.</li>
            <li>You can log in again at any time to monitor election status.</li>
            <li>Final election results will be visible here once officially published by the election staff.</li>
          </ul>
        </div>

        <Link to="/voter/dashboard" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
          <LayoutDashboard size={18} /> Return to Voter Dashboard
        </Link>
      </div>
    </div>
  );
};
