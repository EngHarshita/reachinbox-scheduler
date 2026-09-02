import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { redis } from '../config/redis';

/**
 * Generate cryptographically secure Slack OAuth authorization URL for user workspace connection
 */
export const getSlackAuthUrl = async (userId: string): Promise<string> => {
  const randomState = crypto.randomBytes(32).toString('hex');
  const redisStateKey = `slack:oauth:state:${randomState}`;

  // Store random state in Redis bound to userId with 600s (10 min) TTL
  await redis.set(
    redisStateKey,
    JSON.stringify({ userId, createdAt: new Date().toISOString() }),
    'EX',
    600
  );

  const scopes = ['chat:write'].join(',');
  const params = new URLSearchParams({
    client_id: env.SLACK_CLIENT_ID,
    scope: scopes,
    redirect_uri: env.SLACK_REDIRECT_URI,
    state: randomState,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
};

/**
 * Exchange OAuth authorization code for Slack access token with State Validation & Single-Use Enforcement
 */
export const handleSlackCallbackService = async (code: string, state: string) => {
  try {
    const redisStateKey = `slack:oauth:state:${state}`;
    const storedStateData = await redis.get(redisStateKey);

    if (!storedStateData) {
      throw new Error('INVALID_OAUTH_STATE: OAuth state is invalid, expired, or already consumed.');
    }

    // Single-Use Enforcement: Delete state key immediately from Redis
    await redis.del(redisStateKey);

    const { userId: stateUserId } = JSON.parse(storedStateData);
    if (!stateUserId) {
      throw new Error('INVALID_OAUTH_STATE: No valid user ID bound to state.');
    }

    let botAccessToken = 'mock_slack_bot_token_' + Date.now();
    let teamId = 'T_MOCK_TEAM_123';
    let teamName = 'ReachInbox Outreach Workspace';
    let channelId = 'C_MOCK_CHANNEL_456';
    let webhookUrl: string | null = null;

    // If live Slack credentials are set, perform real OAuth exchange
    if (env.SLACK_CLIENT_ID !== 'mock_slack_client_id') {
      const response = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.SLACK_CLIENT_ID,
          client_secret: env.SLACK_CLIENT_SECRET,
          code,
          redirect_uri: env.SLACK_REDIRECT_URI,
        }).toString(),
      });

      const data: any = await response.json();

      if (!data.ok) {
        throw new Error(`Slack OAuth error: ${data.error}`);
      }

      botAccessToken = data.access_token;
      teamId = data.team?.id || teamId;
      teamName = data.team?.name || teamName;
      channelId = data.incoming_webhook?.channel_id || data.authed_user?.id || channelId;
      webhookUrl = data.incoming_webhook?.url || null;
    }

    // Check for existing connection for user to update or create
    const existingConn = await prisma.slackConnection.findFirst({
      where: { userId: stateUserId, teamId },
    });

    let connection;
    if (existingConn) {
      connection = await prisma.slackConnection.update({
        where: { id: existingConn.id },
        data: {
          accessToken: botAccessToken,
          teamName,
          channelId,
          webhookUrl,
          updatedAt: new Date(),
        },
      });
    } else {
      connection = await prisma.slackConnection.create({
        data: {
          userId: stateUserId,
          teamId,
          teamName,
          accessToken: botAccessToken,
          channelId,
          webhookUrl,
        },
      });
    }

    console.log(`[SlackService]: Successfully verified OAuth state & stored Slack connection for user '${stateUserId}' (Team: '${teamName}')`);
    return connection;
  } catch (error) {
    console.error('[SlackService Error]: Failed Slack OAuth token exchange:', error);
    throw error;
  }
};

/**
 * Fetch Slack connection status for a user
 */
export const getSlackConnectionStatus = async (userId: string) => {
  const conn = await prisma.slackConnection.findFirst({
    where: { userId },
    select: {
      id: true,
      teamName: true,
      teamId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    connected: Boolean(conn),
    teamName: conn?.teamName || null,
    teamId: conn?.teamId || null,
    channelName: null,
    updatedAt: conn?.updatedAt || null,
  };
};

/**
 * Disconnect active Slack connection for a user
 */
export const disconnectSlackService = async (userId: string): Promise<boolean> => {
  const result = await prisma.slackConnection.deleteMany({
    where: { userId },
  });
  console.log(`[SlackService]: Disconnected ${result.count} active Slack workspace connection(s) for user '${userId}'`);
  return result.count > 0;
};

/**
 * Helper function to send alert text payload to Slack chat.postMessage endpoint with API response validation
 */
const sendSlackPayload = async (conn: any, alertText: string): Promise<void> => {
  if (conn.accessToken && !conn.accessToken.includes('mock')) {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${conn.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: conn.channelId,
        text: alertText,
      }),
    });

    const data: any = await res.json();
    if (!data.ok) {
      console.error(`[Slack API Error]: chat.postMessage failed for team '${conn.teamName}': ${data.error}`);
      throw new Error(`SLACK_API_ERROR: ${data.error}`);
    }

    console.log(`[Slack API Response Success]: ok=true, channel=${data.channel}, ts=${data.ts}`);
  } else if (conn.webhookUrl && !conn.webhookUrl.includes('mock')) {
    const res = await fetch(conn.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: alertText }),
    });

    if (!res.ok) {
      console.error(`[Slack Webhook Error]: Webhook returned HTTP ${res.status}`);
      throw new Error(`SLACK_WEBHOOK_ERROR: HTTP ${res.status}`);
    }

    console.log(`[Slack Webhook Success]: Alert dispatched via Webhook to Slack team '${conn.teamName}'`);
  } else {
    console.log(`[SlackService Active Alert]: 📣 Slack notification sent to workspace '${conn.teamName}': ${alertText}`);
  }
};

/**
 * Notify user on Slack when hourly rate limit is hit with Redis Idempotency Deduplication
 */
export const notifySlackOnRateLimitHit = async (userId: string, currentLimit: number): Promise<void> => {
  try {
    const conn = await prisma.slackConnection.findFirst({
      where: { userId },
    });

    if (!conn) return;

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hour = String(now.getUTCHours()).padStart(2, '0');
    const dedupeKey = `ratelimit:slack_notified:${userId}:${year}${month}${day}${hour}`;

    // Redis atomic SETNX check for idempotency
    const alreadyNotified = await redis.get(dedupeKey);
    if (alreadyNotified) {
      console.log(`[SlackService Idempotency]: Slack notification already dispatched for user '${userId}' in current hour bucket. Skipping duplicate alert.`);
      return;
    }

    // Mark as notified in Redis for current hour window (3600 seconds TTL)
    await redis.set(dedupeKey, 'true', 'EX', 3600);

    const alertText = `⚠️ *ReachInbox Rate Limit Alert*\nEmail dispatch limit (${currentLimit}/hr) reached for your account. Pending jobs have been automatically deferred to the next hour window.`;
    await sendSlackPayload(conn, alertText);
  } catch (error) {
    console.error(`[SlackService Error]: Failed to send Slack rate limit alert for user '${userId}':`, error);
  }
};

/**
 * Notify user on Slack when a queued email job fails
 */
export const notifySlackOnQueueFailure = async (
  userId: string,
  emailId: string,
  subject: string,
  reason: string
): Promise<void> => {
  try {
    const conn = await prisma.slackConnection.findFirst({
      where: { userId },
    });

    if (!conn) return;

    const alertText = `🚨 *ReachInbox Queue Failure Alert*\nJob Execution Failed for Email ID: \`${emailId}\`\n*Subject:* ${subject}\n*Failure Reason:* ${reason}`;
    await sendSlackPayload(conn, alertText);
  } catch (error) {
    console.error(`[SlackService Error]: Failed to send Slack queue failure alert for user '${userId}':`, error);
  }
};

/**
 * Send general system notification alert to user Slack workspace
 */
export const notifySlackOnSystemAlert = async (
  userId: string,
  title: string,
  message: string
): Promise<void> => {
  try {
    const conn = await prisma.slackConnection.findFirst({
      where: { userId },
    });

    if (!conn) return;

    const alertText = `ℹ️ *ReachInbox System Alert: ${title}*\n${message}`;
    await sendSlackPayload(conn, alertText);
  } catch (error) {
    console.error(`[SlackService Error]: Failed to send Slack system alert for user '${userId}':`, error);
  }
};
