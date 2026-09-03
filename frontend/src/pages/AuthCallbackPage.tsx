import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const hasRefreshToken = searchParams.get('hasRefreshToken');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        loginWithToken(token, user);

        if (hasRefreshToken === 'false' || hasRefreshToken === 'null' || !hasRefreshToken) {
          // First-time user or missing Gmail refresh token: initiate Gmail OAuth flow immediately after login
          window.location.href = '/api/v1/auth/gmail/connect';
        } else {
          // User already has a valid Gmail refresh token: proceed straight to dashboard
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Failed to parse OAuth callback parameters:', err);
        navigate('/login', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, loginWithToken, navigate]);

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Completing Google Authentication...</p>
      </div>
    </div>
  );
};
