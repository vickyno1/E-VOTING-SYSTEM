import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Vote, LogOut, User, ShieldCheck, PlusCircle, FileText, LayoutDashboard } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isStaff, isVoter, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="nav-container">
        <Link to="/" className="brand">
          <Vote size={26} color="var(--primary)" />
          <span>CampusVote<span style={{ color: 'var(--secondary)', fontSize: '0.9em' }}>Secure</span></span>
        </Link>

        <nav>
          <ul className="nav-links">
            {isAuthenticated ? (
              <>
                {isVoter && (
                  <>
                    <li>
                      <Link to="/voter/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <LayoutDashboard size={18} /> Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link to="/voter/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={18} /> Profile
                      </Link>
                    </li>
                  </>
                )}

                {isStaff && (
                  <>
                    <li>
                      <Link to="/staff/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <LayoutDashboard size={18} /> Staff Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link to="/staff/create-election" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <PlusCircle size={18} /> Create Election
                      </Link>
                    </li>
                    <li>
                      <Link to="/staff/audit-logs" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FileText size={18} /> Audit Trail
                      </Link>
                    </li>
                  </>
                )}

                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                  <span
                    style={{
                      background: isStaff ? '#f3e8ff' : '#eff6ff',
                      color: isStaff ? '#7e22ce' : '#1e40af',
                      padding: '0.3rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <ShieldCheck size={14} />
                    {isStaff ? 'ELECTION STAFF' : user?.voter_id}
                  </span>

                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.35rem 0.65rem' }}
                    title="Log Out"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/register" className="btn btn-outline-primary btn-sm">
                    Voter Registration
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="btn btn-primary btn-sm">
                    Voter Login
                  </Link>
                </li>
                <li>
                  <Link to="/staff/login" style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                    Staff Portal
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};
