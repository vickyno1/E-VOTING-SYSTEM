import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';

export const StaffLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.login(identifier, password);
      if (res.role !== 'staff') {
        setError('Access denied. This login portal is restricted to authorized Election Staff members only.');
        setLoading(false);
        return;
      }
      login(res.token, res.user);
      navigate('/staff/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed. Please verify staff credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '2.5rem auto' }}>
      <div className="content-card" style={{ borderTop: '4px solid var(--primary)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#f3e8ff',
              color: '#7e22ce',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.45rem', marginBottom: '0.25rem' }}>Staff Administration Portal</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>
            Restricted access for election officers and administrators
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="staff_identifier">
              Staff Identifier or Official Email
            </label>
            <input
              id="staff_identifier"
              type="text"
              required
              className="form-control"
              placeholder="e.g. STAFF001 or staff@college.edu"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="staff_password">
              Master Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="staff_password"
                type={showPassword ? 'text' : 'password'}
                required
                className="form-control"
                placeholder="Enter staff security password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
            {loading ? 'Authenticating Officer...' : 'Sign In as Election Staff'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
          Are you a voter?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--primary)' }}>
            Voter Login
          </Link>
        </div>
      </div>
    </div>
  );
};
