import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { CameraCapture } from '../../components/CameraCapture';
import { Shield, AlertCircle, CheckCircle2, Lock, Info } from 'lucide-react';

export const FaceEnrollmentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const enrollmentToken = location.state?.enrollment_token;
  const user = location.state?.user;

  const [consentGiven, setConsentGiven] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!enrollmentToken) {
    return (
      <div className="content-card" style={{ maxWidth: '480px', margin: '2rem auto', textAlign: 'center' }}>
        <AlertCircle size={44} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3>Registration Session Missing</h3>
        <p style={{ color: 'var(--gray-600)', margin: '1rem 0' }}>
          Please complete Step 1 (Personal Details) before proceeding with biometric face enrollment.
        </p>
        <Link to="/register" className="btn btn-primary">
          Go to Registration
        </Link>
      </div>
    );
  }

  const handleEnrollmentSubmit = async () => {
    if (!consentGiven) {
      setError('You must provide explicit consent for biometric processing before continuing.');
      return;
    }
    if (!capturedImage) {
      setError('Please capture or upload a facial photograph.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authApi.enrollFace(capturedImage, consentGiven, enrollmentToken);
      // Auto login user into context
      login(res.token, res.user);
      // Navigate to success page
      navigate('/registration-success', {
        state: { user: res.user },
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Face enrollment failed. Please retry in good lighting.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '580px', margin: '1rem auto' }}>
      <div className="content-card">
        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span
            style={{
              backgroundColor: 'var(--success)',
              color: '#fff',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            ✓
          </span>
          <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Personal Details</span>
          <span style={{ color: 'var(--gray-300)' }}>—</span>
          <span
            style={{
              backgroundColor: 'var(--primary)',
              color: '#fff',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            2
          </span>
          <span style={{ fontWeight: 600, color: 'var(--dark)' }}>Face Enrollment</span>
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          Biometric Face Enrollment
        </h2>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          Enrolling for: <strong>{user?.full_name || 'Voter'}</strong> ({user?.voter_id})
        </p>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {/* Biometric Explanation & Consent Box */}
        <div
          style={{
            backgroundColor: 'var(--primary-light)',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: '#1e3a8a',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 700, marginBottom: '0.35rem' }}>
            <Shield size={16} /> Biometric Privacy Notice
          </div>
          <p style={{ lineHeight: 1.45, marginBottom: '0.75rem' }}>
            Your captured photo is processed locally on the server to extract an anonymized 128-dimensional mathematical
            feature vector (embedding). Raw images are never permanently archived. This template is used strictly to verify
            your identity during login to prevent unauthorized voting impersonation.
          </p>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              style={{ marginTop: '0.2rem', accentColor: 'var(--primary)', width: '1rem', height: '1rem' }}
            />
            <span>
              I give explicit consent for my biometric facial template to be generated and stored securely for election authentication.
            </span>
          </label>
        </div>

        {/* Camera Component */}
        <div style={{ opacity: consentGiven ? 1 : 0.45, pointerEvents: consentGiven ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
          <CameraCapture onCapture={setCapturedImage} actionLabel="Capture Face Template" />
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={handleEnrollmentSubmit}
            disabled={!consentGiven || !capturedImage || loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
          >
            {loading ? 'Analyzing Face & Generating Template...' : 'Complete Face Registration'}
          </button>
        </div>
      </div>
    </div>
  );
};
