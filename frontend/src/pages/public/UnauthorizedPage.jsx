import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage = () => {
  return (
    <div style={{ maxWidth: '480px', margin: '3rem auto', textAlign: 'center' }}>
      <div className="content-card">
        <ShieldAlert size={52} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Access Denied</h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          You do not possess the required administrative or role authorizations to view this resource.
        </p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={16} /> Return to Home
        </Link>
      </div>
    </div>
  );
};
