import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/prisma';
import { sendMailService, SendMailOptions, SendMailResult } from './mail-sender.service';
import { env } from '../config/env';

export interface UserGmailAccountStatus {
  isConnected: boolean;
  email: string;
  hasRefreshToken: boolean;
}

export const getUserGmailStatus = async (userId: string): Promise<UserGmailAccountStatus> => {
  const user: any = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { isConnected: false, email: '', hasRefreshToken: false };
  }

  const isConnected = Boolean(user.googleRefreshToken || user.googleAccessToken);
  return {
    isConnected,
    email: user.email,
    hasRefreshToken: Boolean(user.googleRefreshToken),
  };
};

/**
 * Creates an isolated Google OAuth2Client for a specific tenant user
 */
const createIsolatedUserOAuthClient = (): OAuth2Client => {
  return new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
};

const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>?/gm, '').trim();
};

export const sendGmailApiService = async (
  userId: string,
  options: SendMailOptions
): Promise<SendMailResult> => {
  const userDelegate = prisma.user as any;
  const user: any = await userDelegate.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error(`USER_NOT_FOUND: User ID '${userId}' does not exist in database.`);
  }

  const hasOAuthTokens = Boolean(user.googleRefreshToken || user.googleAccessToken);

  // Strict Tenant Multi-User Sender Isolation
  if (!hasOAuthTokens) {
    const isSystemAdmin = (user.email || '').toLowerCase() === (env.SMTP_USER || '').toLowerCase();
    if (isSystemAdmin) {
      console.log(`[System Admin Dispatch]: Account '${user.email}' dispatching via System SMTP.`);
      return sendMailService(options);
    }

    const notConnectedErr = `GMAIL_NOT_CONNECTED: Gmail account is not connected for user '${user.email}'. Please log in via Google to grant email sending permissions.`;
    console.error(`[Multi-User Sender Isolation Error]: ❌ ${notConnectedErr}`);
    throw new Error(notConnectedErr);
  }

  console.log(`[Gmail API Multi-Tenant]: Isolated dispatch initiated for '${user.email}'...`);

  let accessToken = user.googleAccessToken;
  const isExpired = user.googleTokenExpiry ? new Date(user.googleTokenExpiry).getTime() <= Date.now() + 60000 : false;

  // Dedicated per-user OAuth client to prevent global singleton mutation races
  const userOAuthClient = createIsolatedUserOAuthClient();

  // Helper function to perform access token refresh for user
  const refreshUserAccessToken = async (): Promise<string> => {
    if (!user.googleRefreshToken) {
      throw new Error(`OAUTH_REFRESH_TOKEN_MISSING: Refresh token missing for '${user.email}'. Please log out and reconnect Google Account in ReachInbox.`);
    }

    console.log(`[OAuth Token Refresh]: Exchanging refresh token for user '${user.email}'...`);
    userOAuthClient.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    const { credentials } = await userOAuthClient.refreshAccessToken();
    const newAccessToken = credentials.access_token;
    if (!newAccessToken) {
      throw new Error(`OAUTH_REFRESH_EMPTY: Google did not return a valid access token for '${user.email}'.`);
    }

    const newExpiry = credentials.expiry_date ? new Date(credentials.expiry_date) : null;
    await userDelegate.update({
      where: { id: user.id },
      data: {
        googleAccessToken: newAccessToken,
        ...(newExpiry && { googleTokenExpiry: newExpiry }),
      },
    });

    console.log(`[OAuth Token Refresh]: Successfully updated access token in database for '${user.email}'.`);
    return newAccessToken;
  };

  // Attempt refresh if access token is missing or expired
  if (!accessToken || isExpired) {
    try {
      accessToken = await refreshUserAccessToken();
    } catch (refreshErr: any) {
      const errMsg = refreshErr instanceof Error ? refreshErr.message : String(refreshErr);
      console.error(`[OAuth Refresh Failed]: ❌ ${errMsg}`);
      throw new Error(`OAUTH_REFRESH_FAILED: ${errMsg}`);
    }
  }

  // Construct RFC 2822 multipart/alternative MIME message for standard Gmail inline rendering
  const boundary = `====_ReachInbox_Boundary_${Date.now()}_====`;
  const textPlain = options.text || stripHtml(options.html);
  const formattedHtml = options.html.trim().startsWith('<')
    ? options.html
    : `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"></head>\n<body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; margin: 0; padding: 24px;">\n<p style="margin: 0 0 16px 0;">${options.html.replace(/\n/g, '<br/>')}</p>\n</body>\n</html>`;

  const sender = `"${user.email}" <${user.email}>`;
  const messageParts = [
    `From: ${sender}`,
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    textPlain,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    formattedHtml,
    '',
    `--${boundary}--`,
  ];
  const rawMessage = messageParts.join('\r\n');

  console.log(`\n[RAW MIME MULTIPART/ALTERNATIVE GENERATED]`);
  console.log(`----------------------------------------`);
  console.log(rawMessage);
  console.log(`----------------------------------------\n`);

  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // Dispatch message to official Gmail REST API Endpoint
  const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

  let response = await fetch(GMAIL_SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  // Handle 401 Unauthorized by attempting a token refresh retry ONCE
  if (response.status === 401 && user.googleRefreshToken) {
    console.warn(`[Gmail API 401]: Access token rejected for '${user.email}'. Attempting token refresh retry...`);
    try {
      accessToken = await refreshUserAccessToken();
      response = await fetch(GMAIL_SEND_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedMessage }),
      });
    } catch (retryErr: any) {
      console.error(`[Gmail API 401 Retry Failed]: ${retryErr.message}`);
    }
  }

  if (!response.ok) {
    const errorBody = await response.text();
    let detailedMessage = errorBody;
    try {
      const jsonErr = JSON.parse(errorBody);
      if (jsonErr.error?.message) {
        const reason = jsonErr.error?.errors?.[0]?.reason || jsonErr.error.code || 'UNKNOWN';
        detailedMessage = `${jsonErr.error.message} (Reason: ${reason})`;
      }
    } catch (_) {}

    const apiErr = `GMAIL_API_ERROR: HTTP ${response.status} for '${user.email}': ${detailedMessage}`;
    console.error(`[Gmail API Error Response]: ❌ ${apiErr}`);
    throw new Error(apiErr);
  }

  const resData: any = await response.json();
  const realMessageId = resData.id ? resData.id : `msg_${Date.now()}`;
  const realProviderResponse = `250 2.0.0 OK (Gmail API Message ID: ${resData.id || 'N/A'}, Thread ID: ${resData.threadId || 'N/A'})`;

  // Fetch Gmail stored message metadata for raw MIME verification
  if (resData.id) {
    try {
      const getMsgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${resData.id}?format=full`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (getMsgRes.ok) {
        const msgMetadata: any = await getMsgRes.json();
        const payload = msgMetadata.payload || {};
        const parts = payload.parts || [];
        const attachmentParts = parts.filter((p: any) => p.filename && p.filename.length > 0);

        console.log(`[RAW MIME GMAIL RECURSIVE METADATA VERIFICATION]`);
        console.log(`Gmail Message ID: ${resData.id}`);
        console.log(`Root MIME Type: ${payload.mimeType}`);
        console.log(`Payload Parts Count: ${parts.length}`);
        console.log(`Part 0 (text/plain): ${parts[0]?.mimeType}`);
        console.log(`Part 1 (text/html): ${parts[1]?.mimeType}`);
        console.log(`Total Attachment Parts with Filename: ${attachmentParts.length}`);
      }
    } catch (metaErr: any) {
      console.warn(`[Gmail Metadata Verification Warning]: ${metaErr.message}`);
    }
  }

  console.log(`\n[ACTUAL GMAIL API RESPONSE RECEIVED]`);
  console.log(`Sender Account: ${user.email}`);
  console.log(`Recipient: ${options.to}`);
  console.log(`Gmail API Message ID (id): ${resData.id}`);
  console.log(`Gmail API Thread ID (threadId): ${resData.threadId}`);
  console.log(`Response Payload: ${realProviderResponse}\n`);

  return {
    messageId: realMessageId,
    response: realProviderResponse,
    accepted: [options.to.toLowerCase()],
    rejected: [],
  };
};
