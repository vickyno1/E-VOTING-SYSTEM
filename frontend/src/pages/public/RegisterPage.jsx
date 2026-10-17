import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { UserCheck, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    voter_id: '',
    email: '',
    password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register(formData);
      // Navigate to Face Enrollment (Step 2) with the enrollment token
      navigate('/enroll-face', {
        state: {
          enrollment_token: res.enrollment_token,
          user: res.user,
        },
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please check your inputs.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '1rem auto' }}>
      <div className="content-card">
        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
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
            1
          </span>
          <span style={{ fontWeight: 600, color: 'var(--dark)' }}>Personal Details</span>
          <span style={{ color: 'var(--gray-300)' }}>—</span>
          <span
            style={{
              backgroundColor: 'var(--gray-200)',
              color: 'var(--gray-600)',
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
          <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Face Enrollment</span>
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>Voter Registration</h2>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          Enter your academic credentials to begin voter onboarding
        </p>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="full_name">
              Full Legal Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              className="form-control"
              placeholder="e.g. Alexander Hamilton"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="voter_id">
              Unique Voter ID or Student ID
            </label>
            <input
              id="voter_id"
              name="voter_id"
              type="text"
              required
              className="form-control"
              placeholder="e.g. STU1001"
              value={formData.voter_id}
              onChange={handleChange}
            />
            <small style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>
              Must be unique and match your official university ID.
            </small>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Institutional Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="form-control"
              placeholder="e.g. student@college.edu"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="form-control"
                placeholder="At least 8 characters with letters & numbers"
                value={formData.password}
                onChange={handleChange}
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

          <div className="form-group">
            <label className="form-label" htmlFor="confirm_password">
              Confirm Password
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type={showPassword ? 'text' : 'password'}
              required
              className="form-control"
              placeholder="Re-enter password"
              value={formData.confirm_password}
              onChange={handleChange}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'Validating...' : (
              <>
                Continue to Face Registration <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--gray-600)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};
