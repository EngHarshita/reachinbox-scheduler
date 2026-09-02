import React, { useState } from 'react';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [loadingDemo, setLoadingDemo] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleDemoLoginClick = async () => {
    try {
      setLoadingDemo(true);
      const response = await api.post('/auth/demo');
      if (response.data?.status === 'success' && response.data?.token) {
        loginWithToken(response.data.token, response.data.user);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Demo login failed:', err);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: '380px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E4E4E7',
          borderRadius: '12px',
          padding: '36px 32px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#18181B',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#09090B',
              letterSpacing: '-0.02em',
              margin: 0,
              marginBottom: '6px',
            }}
          >
            Welcome to ReachInbox
          </h1>
          <p style={{ color: '#71717A', fontSize: '0.875rem', margin: 0, lineHeight: '1.4' }}>
            Email Scheduling & Automation Engine
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <GoogleLoginButton />

          <div style={{ display: 'flex', alignItems: 'center', margin: '6px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E4E4E7' }}></div>
            <span
              style={{
                padding: '0 10px',
                fontSize: '0.75rem',
                color: '#A1A1AA',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              or
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E4E4E7' }}></div>
          </div>

          <button
            onClick={handleDemoLoginClick}
            disabled={loadingDemo}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              backgroundColor: '#18181B',
              color: '#FFFFFF',
              border: '1px solid #18181B',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#27272A';
              e.currentTarget.style.borderColor = '#27272A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#18181B';
              e.currentTarget.style.borderColor = '#18181B';
            }}
          >
            <Sparkles style={{ width: '16px', height: '16px', color: '#A1A1AA' }} />
            {loadingDemo ? 'Logging in...' : 'Demo One-Click Login'}
          </button>
        </div>

        {/* Footer Note */}
        <p
          style={{
            marginTop: '24px',
            fontSize: '0.75rem',
            color: '#71717A',
            textAlign: 'center',
            lineHeight: '1.5',
            margin: 0,
            paddingTop: '20px',
            borderTop: '1px solid #F4F4F5',
          }}
        >
          Secure 256-bit encrypted authentication via official OAuth 2.0 or instant Demo sandbox mode.
        </p>
      </div>
    </div>
  );
};
