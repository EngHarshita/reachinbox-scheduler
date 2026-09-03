import { OAuth2Client } from 'google-auth-library';
import { env } from './env';

export const googleOAuthClient = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

/**
 * Basic Google Login URL (Non-sensitive scopes: openid, profile, email)
 * Allows any Google user to log in / auto-provision without Google verification block.
 */
export const getGoogleLoginUrl = (): string => {
  const scopes = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/gmail.send',
  ];

  const url = googleOAuthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });

  console.log(`[Google OAuth Login URL Generator]: Generated OAuth login URL (offline access, consent prompt, gmail.send scope).`);
  return url;
};

// Backward compatibility alias for basic login URL
export const getGoogleAuthUrl = getGoogleLoginUrl;

/**
 * Dedicated Gmail Connection URL (Sensitive scope: gmail.send)
 * Only requested when user explicitly connects Gmail in Settings / Dashboard to dispatch emails.
 */
export const getGmailConnectUrl = (): string => {
  const scopes = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/gmail.send',
  ];

  const url = googleOAuthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
    state: 'gmail_connect',
  });

  console.log(`[Google OAuth Gmail URL Generator]: Generated Gmail connect OAuth URL with prompt=consent & gmail.send scope.`);
  return url;
};


