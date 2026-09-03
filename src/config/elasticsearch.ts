import { Client } from '@elastic/elasticsearch';
import { env } from './env';

export const EMAIL_INDEX_NAME = 'emails';

export const esClient = new Client({
  node: env.ELASTICSEARCH_URL || env.ELASTICSEARCH_NODE,
});

export const initElasticsearch = async (): Promise<void> => {
  try {
    const exists = await esClient.indices.exists({ index: EMAIL_INDEX_NAME });

    if (!exists) {
      console.log(`[Elasticsearch]: Index '${EMAIL_INDEX_NAME}' does not exist. Creating index...`);
      await esClient.indices.create({
        index: EMAIL_INDEX_NAME,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            userId: { type: 'keyword' },
            recipientEmail: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            subject: { type: 'text' },
            bodyHtml: { type: 'text' },
            bodyText: { type: 'text' },
            status: { type: 'keyword' },
            scheduledAt: { type: 'date' },
            sentAt: { type: 'date' },
            createdAt: { type: 'date' },
          },
        },
      });
      console.log(`[Elasticsearch]: Index '${EMAIL_INDEX_NAME}' created successfully.`);
    } else {
      console.log(`[Elasticsearch]: Index '${EMAIL_INDEX_NAME}' ready.`);
    }
  } catch (error) {
    console.warn(`[Elasticsearch Warning]: Could not connect or initialize index '${EMAIL_INDEX_NAME}'. Elasticsearch features will degrade gracefully.`, error);
  }
};
