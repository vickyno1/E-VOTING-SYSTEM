import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { FaceEnrollmentPage } from '../pages/public/FaceEnrollmentPage';
import { RegistrationSuccessPage } from '../pages/public/RegistrationSuccessPage';
import { LoginPage } from '../pages/public/LoginPage';
import { StaffLoginPage } from '../pages/public/StaffLoginPage';
import { UnauthorizedPage } from '../pages/public/UnauthorizedPage';

// Voter Pages
import { VoterDashboardPage } from '../pages/voter/VoterDashboardPage';
import { VotingPage } from '../pages/voter/VotingPage';
import { VoteSuccessPage } from '../pages/voter/VoteSuccessPage';
import { ElectionResultsPage } from '../pages/voter/ElectionResultsPage';
import { VoterProfilePage } from '../pages/voter/VoterProfilePage';

// Staff Pages
import { StaffDashboardPage } from '../pages/staff/StaffDashboardPage';
import { CreateElectionPage } from '../pages/staff/CreateElectionPage';
import { ElectionDetailsPage } from '../pages/staff/ElectionDetailsPage';
import { StaffResultsPage } from '../pages/staff/StaffResultsPage';
import { AuditLogsPage } from '../pages/staff/AuditLogsPage';

const NotFoundPage = () => (
  <div className="content-card" style={{ maxWidth: '480px', margin: '3rem auto', textAlign: 'center' }}>
    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>404</h2>
    <h3 style={{ marginBottom: '0.75rem' }}>Page Not Found</h3>
    <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
      The URL you requested does not exist in the electoral system.
    </p>
    <Link to="/" className="btn btn-primary">
      Return Home
    </Link>
  </div>
);

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/enroll-face" element={<FaceEnrollmentPage />} />
          <Route path="/registration-success" element={<RegistrationSuccessPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/staff/login" element={<StaffLoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Voter Routes */}
          <Route
            path="/voter/dashboard"
            element={
              <ProtectedRoute allowedRoles={['voter']}>
                <VoterDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/voter/profile"
            element={
              <ProtectedRoute allowedRoles={['voter']}>
                <VoterProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/voter/elections/:electionId/vote"
            element={
              <ProtectedRoute allowedRoles={['voter']}>
                <VotingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/voter/elections/:electionId/vote-success"
            element={
              <ProtectedRoute allowedRoles={['voter']}>
                <VoteSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/voter/results/:electionId"
            element={
              <ProtectedRoute allowedRoles={['voter', 'staff']}>
                <ElectionResultsPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Staff Routes */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/create-election"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <CreateElectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/elections/:electionId"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <ElectionDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/elections/:electionId/results"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
