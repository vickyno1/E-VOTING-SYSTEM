import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { CameraCapture } from '../../components/CameraCapture';
import { LogIn, Eye, EyeOff, AlertCircle, Camera, CheckCircle2, User } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Login steps: 1 = credentials, 2 = facial verification
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Verification challenge state
  const [challengeToken, setChallengeToken] = useState(null);
  const [voterName, setVoterName] = useState('');
  const [capturedProbeImage, setCapturedProbeImage] = useState(null);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Submit Credentials
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.login(identifier, password);

      if (res.step === 'completed') {
        // Direct completed login (for staff or test flow)
        login(res.token, res.user);
        if (res.role === 'staff') {
          navigate('/staff/dashboard');
        } else {
          navigate('/voter/dashboard');
        }
      } else if (res.step === 'face_verification_required') {
        setChallengeToken(res.challenge_token);
        setVoterName(res.voter_name || 'Voter');
        setStep(2);
      } else if (res.step === 'face_enrollment_required') {
        navigate('/enroll-face', {
          state: {
            enrollment_token: res.enrollment_token,
            user: { voter_id: identifier },
          },
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid credentials or account does not exist.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit Facial Probe for Cosine Similarity Verification
  const handleFaceVerifySubmit = async () => {
    if (!capturedProbeImage) {
      setError('Please capture your facial photograph before submitting verification.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await authApi.verifyFace(challengeToken, capturedProbeImage);
      // Login successful! Note: Even if user already voted in an election, login succeeds completely!
      login(res.token, res.user);
      navigate('/voter/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Facial verification failed. Please align your face in good lighting and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '1.5rem auto' }}>
      <div className="content-card">
        {step === 1 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                }}
              >
                <LogIn size={26} />
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Voter Sign In</h2>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                Step 1: Enter your registered credentials
              </p>
            </div>

            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleCredentialsSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="identifier">
                  Voter ID or University Email
                </label>
                <input
                  id="identifier"
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. STU1001 or student@college.edu"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError(null);
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-control"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--gray-500)',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                {loading ? 'Authenticating...' : 'Next: Face Verification'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--gray-600)' }}>
              Don't have an account yet?{' '}
              <Link to="/register" style={{ fontWeight: 600 }}>
                Register here
              </Link>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success-light)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                }}
              >
                <Camera size={26} />
              </div>
              <h2 style={{ fontSize: '1.45rem', marginBottom: '0.25rem' }}>Face Verification</h2>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem' }}>
                Welcome back, <strong>{voterName}</strong>! Please verify your live face to complete sign in.
              </p>
            </div>

            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div>{error}</div>
              </div>
            )}

            <CameraCapture onCapture={setCapturedProbeImage} actionLabel="Capture Live Face" />

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
              <button
                type="button"
                onClick={handleFaceVerifySubmit}
                disabled={!capturedProbeImage || loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem' }}
              >
                {loading ? 'Verifying Facial Embedding...' : 'Confirm & Access Dashboard'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setCapturedProbeImage(null);
                  setError(null);
                }}
                className="btn btn-secondary btn-sm"
              >
                Back to Credentials
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
