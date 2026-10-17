import React from 'react';
import { Link } from 'react-router-dom';
import { Vote, Shield, CheckCircle, Lock, Camera, Award, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LandingPage = () => {
  const { isAuthenticated, isStaff, isVoter } = useAuth();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '3.5rem 1rem 3rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
          }}
        >
          <Shield size={16} /> Campus Electoral Integrity Platform
        </div>

        <h1 style={{ fontSize: '2.75rem', marginBottom: '1.25rem', color: 'var(--dark)' }}>
          Secure Campus E-Voting with <br />
          <span style={{ color: 'var(--primary)' }}>Facial Recognition</span> &amp; One-Time Voting
        </h1>

        <p
          style={{
            fontSize: '1.15rem',
            color: 'var(--gray-600)',
            maxWidth: '680px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.6,
          }}
        >
          A privacy-preserving academic digital voting application featuring two-factor biometric authentication,
          atomic duplicate-vote prevention, and anonymous ballot separation.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {!isAuthenticated ? (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                Register to Vote <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Voter Sign In
              </Link>
            </>
          ) : (
            <Link to={isStaff ? '/staff/dashboard' : '/voter/dashboard'} className="btn btn-primary btn-lg">
              Go to Your Dashboard <ArrowRight size={18} />
            </Link>
          )}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ margin: '2rem 0 3.5rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.6rem' }}>
          Key Security &amp; Architectural Pillars
        </h2>

        <div className="grid-3">
          <div className="content-card">
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Camera size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Two-Factor Biometrics</h3>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Voters enroll a facial embedding during registration. At login, a live probe capture is verified using deep
              cosine feature similarity before granting voting access.
            </p>
          </div>

          <div className="content-card">
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Lock size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Strict One-Vote Guarantee</h3>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Database-level compound unique indexes enforce exactly one vote per voter per election. Multiple submissions,
              browser refreshes, and direct API replays are strictly rejected.
            </p>
          </div>

          <div className="content-card">
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--success-light)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <CheckCircle size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Ballot Secrecy</h3>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Participation tracking is kept strictly distinct from the anonymous ballot records. No public API maps a voter's
              identity to their selected candidate.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Flow */}
      <section className="content-card" style={{ marginBottom: '3rem', backgroundColor: 'var(--white)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
          Voter Lifecycle at a Glance
        </h2>

        <div className="grid-2" style={{ gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span
              style={{
                backgroundColor: 'var(--primary)',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              1
            </span>
            <div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>Account &amp; Face Registration</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                Register personal details with Argon2 password hashing, provide biometric consent, and capture facial template.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span
              style={{
                backgroundColor: 'var(--primary)',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              2
            </span>
            <div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>Biometric Login</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                Authenticate with your credentials and complete fresh webcam verification to access eligible elections.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span
              style={{
                backgroundColor: 'var(--primary)',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              3
            </span>
            <div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>Cast Confirmed Vote</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                Review the two candidates, select one, verify your choice on the confirmation screen, and commit your ballot.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span
              style={{
                backgroundColor: 'var(--primary)',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              4
            </span>
            <div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>Already Voted &amp; View Results</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                You can log in again anytime to view election status. Results become visible once staff officially publishes them.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
