import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, loginWithToken } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const oauthError = queryParams.get('error');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = async () => {
    try {
      setLoadingGoogle(true);
      const res = await api.get('/auth/google/url');
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Failed to initiate Google auth:', err);
      alert('Could not initiate Google Login. Please ensure backend is running.');
      setLoadingGoogle(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleGoogleLogin();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
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
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '36px 28px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#111827',
            textAlign: 'center',
            margin: 0,
            marginBottom: '24px',
            letterSpacing: '-0.02em',
          }}
        >
          Login
        </h1>

        {oauthError && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              fontSize: '0.75rem',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            {oauthError === 'access_denied'
              ? 'Google authorization was cancelled or denied.'
              : `Authentication error: ${oauthError}`}
          </div>
        )}

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loadingGoogle}
          style={{
            width: '100%',
            padding: '11px 16px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            backgroundColor: '#E8F5E9',
            color: '#1F2937',
            border: '1px solid #C8E6C9',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#C8E6C9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#E8F5E9';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {loadingGoogle ? 'Connecting...' : 'Login with Google'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
          <span
            style={{
              padding: '0 10px',
              fontSize: '0.75rem',
              color: '#9CA3AF',
              fontWeight: 400,
              whiteSpace: 'nowrap',
            }}
          >
            or sign up through email
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            placeholder="Email ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              fontSize: '0.875rem',
              color: '#111827',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#10B981';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              fontSize: '0.875rem',
              color: '#111827',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#10B981';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          />

          <button
            type="submit"
            disabled={loadingLogin}
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              marginTop: '8px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#10B981';
            }}
          >
            {loadingLogin ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};
