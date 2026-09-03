import { googleOAuthClient } from '../config/google';
import { prisma } from '../config/prisma';
import { signToken } from '../utils/jwt.util';

export interface GoogleAuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string | null;
  };
}

export const processGoogleCallback = async (code: string): Promise<GoogleAuthResult> => {
  // Exchange authorization code for Google OAuth Tokens via Google Cloud Console
  const { tokens } = await googleOAuthClient.getToken(code);
  googleOAuthClient.setCredentials(tokens);

  // Fetch Google User Profile info using access token
  const userinfoResponse = await googleOAuthClient.request<{
    id: string;
    email: string;
    name?: string;
  }>({
    url: 'https://www.googleapis.com/oauth2/v2/userinfo',
  });

  const profile = userinfoResponse.data;

  if (!profile.email || !profile.id) {
    throw new Error('Google OAuth profile did not return a valid Google sub ID or email address.');
  }

  const googleId = profile.id;
  const email = profile.email;
  const name = profile.name || 'Google User';
  const refreshToken = tokens.refresh_token || null;
  const accessToken = tokens.access_token || googleOAuthClient.credentials.access_token || null;
  const expiryDate = tokens.expiry_date || googleOAuthClient.credentials.expiry_date
    ? new Date(tokens.expiry_date || (googleOAuthClient.credentials.expiry_date as number))
    : null;

  console.log(`[Google OAuth Callback]: Selected Google Account — sub: ${googleId}, email: ${email}, name: ${name}`);
  if (refreshToken) {
    console.log(`[Google OAuth Callback]: Refresh Token successfully received for '${email}'.`);
  } else {
    console.warn(`[Google OAuth Callback]: Warning: No refresh token returned for '${email}'. Will rely on existing refresh token if present.`);
  }

  const userDelegate = prisma.user as any;

  // Step 1: Primary lookup by googleId (Google sub)
  let user = await userDelegate.findFirst({
    where: { googleId },
  });

  if (user) {
    // Step 2: User found by googleId -> update tokens & profile
    user = await userDelegate.update({
      where: { id: user.id },
      data: {
        email,
        fullName: name,
        googleAccessToken: accessToken,
        ...(refreshToken && { googleRefreshToken: refreshToken }),
        ...(expiryDate && { googleTokenExpiry: expiryDate }),
      },
    });
  } else {
    // Step 3: Secondary lookup by email for legacy records
    const existingByEmail = await userDelegate.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      // Link googleId to legacy record & update tokens
      user = await userDelegate.update({
        where: { id: existingByEmail.id },
        data: {
          googleId,
          fullName: name,
          googleAccessToken: accessToken,
          ...(refreshToken && { googleRefreshToken: refreshToken }),
          ...(expiryDate && { googleTokenExpiry: expiryDate }),
        },
      });
    } else {
      // Step 4: Create new application user with concurrency protection
      try {
        user = await userDelegate.create({
          data: {
            email,
            googleId,
            fullName: name,
            googleAccessToken: accessToken,
            googleRefreshToken: refreshToken,
            googleTokenExpiry: expiryDate,
          },
        });
      } catch (createErr: any) {
        // Handle concurrent first-login race condition
        user = await userDelegate.findFirst({
          where: { OR: [{ googleId }, { email }] },
        });
        if (user) {
          user = await userDelegate.update({
            where: { id: user.id },
            data: {
              googleId,
              email,
              fullName: name,
              googleAccessToken: accessToken,
              ...(refreshToken && { googleRefreshToken: refreshToken }),
              ...(expiryDate && { googleTokenExpiry: expiryDate }),
            },
          });
        } else {
          throw createErr;
        }
      }
    }
  }

  console.log(`[Google OAuth Callback]: Resolved Application User ID: ${user.id} for Google sub: ${googleId}`);

  // Issue application JWT Token
  const token = signToken({
    userId: user.id,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
  };
};
