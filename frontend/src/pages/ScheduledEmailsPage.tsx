import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { UI_POLL_INTERVAL_MS } from '../constants';
import { Figma3ColumnMailClient, EmailItem } from '../components/Figma3ColumnMailClient';

export const ScheduledEmailsPage: React.FC = () => {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchScheduledEmails = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await api.get(`/emails/scheduled?_t=${Date.now()}`);
      if (res.data?.status === 'success') {
        setEmails(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch scheduled emails:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduledEmails(true);
    const interval = setInterval(() => {
      fetchScheduledEmails(false);
    }, UI_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchScheduledEmails]);

  return (
    <Figma3ColumnMailClient
      title="Scheduled Queue"
      description="Real-time BullMQ Redis & PostgreSQL automated scheduled dispatches."
      emails={emails}
      loading={loading}
      onRefresh={() => fetchScheduledEmails(true)}
      isSentView={false}
    />
  );
};
