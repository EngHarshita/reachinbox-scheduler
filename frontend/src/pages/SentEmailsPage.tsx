import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { UI_POLL_INTERVAL_MS } from '../constants';
import { Figma3ColumnMailClient, EmailItem } from '../components/Figma3ColumnMailClient';

export const SentEmailsPage: React.FC = () => {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSentEmails = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await api.get(`/emails/sent?_t=${Date.now()}`);
      if (res.data?.status === 'success') {
        setEmails(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch sent emails:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSentEmails(true);
    const interval = setInterval(() => {
      fetchSentEmails(false);
    }, UI_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchSentEmails]);

  return (
    <Figma3ColumnMailClient
      title="Delivered Outbox"
      description="Historical log of successfully dispatched Gmail API emails."
      emails={emails}
      loading={loading}
      onRefresh={() => fetchSentEmails(true)}
      isSentView={true}
    />
  );
};
