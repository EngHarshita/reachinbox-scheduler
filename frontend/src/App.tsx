import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { ScheduledEmailsPage } from './pages/ScheduledEmailsPage';
import { SentEmailsPage } from './pages/SentEmailsPage';
import { ComposeEmailPage } from './pages/ComposeEmailPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Application & Auth Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/success" element={<AuthCallbackPage />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardOverviewPage />} />
              <Route path="/scheduled" element={<ScheduledEmailsPage />} />
              <Route path="/sent" element={<SentEmailsPage />} />
              <Route path="/compose" element={<ComposeEmailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
