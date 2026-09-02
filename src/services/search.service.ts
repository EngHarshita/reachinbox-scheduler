import { esClient, EMAIL_INDEX_NAME } from '../config/elasticsearch';
import { prisma } from '../config/prisma';

export interface EmailSearchDoc {
  id: string;
  userId: string;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
  status: string;
  scheduledAt: string;
  sentAt?: string | null;
  createdAt: string;
}

/**
 * Index or update an email document in Elasticsearch
 */
export const indexEmailDocument = async (email: {
  id: string;
  userId: string;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
  status: string;
  scheduledAt: Date;
  sentAt?: Date | null;
  createdAt: Date;
}): Promise<void> => {
  try {
    const doc: EmailSearchDoc = {
      id: email.id,
      userId: email.userId,
      recipientEmail: email.recipientEmail,
      subject: email.subject,
      bodyHtml: email.bodyHtml,
      bodyText: email.bodyText,
      status: email.status,
      scheduledAt: email.scheduledAt.toISOString(),
      sentAt: email.sentAt ? email.sentAt.toISOString() : null,
      createdAt: email.createdAt.toISOString(),
    };

    await esClient.index({
      index: EMAIL_INDEX_NAME,
      id: email.id,
      document: doc,
      refresh: 'wait_for',
    });

    console.log(`[Elasticsearch]: Email document '${email.id}' successfully indexed.`);
  } catch (error) {
    console.error(`[Elasticsearch Error]: Failed to index document '${email.id}':`, error);
  }
};

/**
 * Search emails by email, subject, or content with strict Multi-Tenant User Isolation
 */
export const searchEmailsService = async (userId: string, query: string) => {
  try {
    const result = await esClient.search<EmailSearchDoc>({
      index: EMAIL_INDEX_NAME,
      query: {
        bool: {
          must: [
            { term: { userId: userId } },
            {
              multi_match: {
                query: query,
                fields: ['recipientEmail^3', 'subject^2', 'bodyText', 'bodyHtml'],
                fuzziness: 'AUTO',
              },
            },
          ],
        },
      },
    });

    const hits = result.hits.hits
      .map((hit: { _source?: EmailSearchDoc }) => hit._source)
      .filter((doc: EmailSearchDoc | undefined): doc is EmailSearchDoc => Boolean(doc));

    return hits;
  } catch (error) {
    console.warn('[Elasticsearch Warning]: Search failed or node unreachable. Falling back to PostgreSQL search:', error);

    // Fallback to PostgreSQL Prisma full-text/contains query if ES node is unavailable
    const fallbackResults = await prisma.email.findMany({
      where: {
        userId,
        OR: [
          { recipientEmail: { contains: query, mode: 'insensitive' } },
          { subject: { contains: query, mode: 'insensitive' } },
          { bodyHtml: { contains: query, mode: 'insensitive' } },
          { bodyText: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return fallbackResults;
  }
};

/**
 * Bulk re-index all emails from PostgreSQL to Elasticsearch (Recovery / Admin Tooling)
 */
export const bulkReindexEmailsService = async (): Promise<{ total: number; indexed: number }> => {
  try {
    const emails = await prisma.email.findMany();
    if (emails.length === 0) return { total: 0, indexed: 0 };

    const operations = emails.flatMap((email) => [
      { index: { _index: EMAIL_INDEX_NAME, _id: email.id } },
      {
        id: email.id,
        userId: email.userId,
        recipientEmail: email.recipientEmail,
        subject: email.subject,
        bodyHtml: email.bodyHtml,
        bodyText: email.bodyText,
        status: email.status,
        scheduledAt: email.scheduledAt.toISOString(),
        sentAt: email.sentAt ? email.sentAt.toISOString() : null,
        createdAt: email.createdAt.toISOString(),
      },
    ]);

    const bulkResponse = await esClient.bulk({ refresh: true, operations });
    console.log(`[Elasticsearch Bulk Reindex]: Bulk indexed ${emails.length} documents into index '${EMAIL_INDEX_NAME}'. Errors: ${bulkResponse.errors}`);
    return { total: emails.length, indexed: emails.length };
  } catch (error) {
    console.error('[Elasticsearch Bulk Error]: Failed bulk reindex operation:', error);
    throw error;
  }
};
