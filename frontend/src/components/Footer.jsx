import React from 'react';

export const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="app-container" style={{ padding: '0 1.5rem' }}>
        <p style={{ fontWeight: 600, color: 'var(--gray-700)', marginBottom: '0.4rem' }}>
          Secure Campus E-Voting System with Biometric Face Recognition
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', maxWidth: '700px', margin: '0 auto' }}>
          Notice: This software is an academic reference and portfolio implementation designed for educational demonstration.
          It is not certified for legally binding public or governmental elections without independent security, cryptographic and privacy audits.
        </p>
      </div>
    </footer>
  );
};
