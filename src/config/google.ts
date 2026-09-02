import { OAuth2Client } from 'google-auth-library';
import { env } from './env';

export const googleOAuthClient = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

export const getGoogleAuthUrl = (): string => {
  const scopes = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/gmail.send',
  ];

  const url = googleOAuthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'select_account consent',
    scope: scopes,
  });

  console.log(`[Google OAuth URL Generator]: Generated fresh OAuth URL with prompt=select_account consent & access_type=offline.`);
  return url;
};
