import React, { useState } from 'react';
import { Mail, Clock, RefreshCw, Search, Filter, Copy, ArrowLeft, Paperclip, Download, Trash2, MoreHorizontal, Inbox, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface EmailItem {
  id: string;
  recipientEmail: string;
  subject: string;
  scheduledAt?: string;
  sentAt?: string | null;
  status: string;
  createdAt: string;
  bodyHtml?: string;
  bodyText?: string;
  attachments?: any[];
}

interface Figma3ColumnMailClientProps {
  title: string;
  description: string;
  emails: EmailItem[];
  loading: boolean;
  onRefresh: () => void;
  isSentView?: boolean;
}

export const Figma3ColumnMailClient: React.FC<Figma3ColumnMailClientProps> = ({
  title,
  description,
  emails,
  loading,
  onRefresh,
  isSentView = false,
}) => {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(emails[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mobileDetailView, setMobileDetailView] = useState(false);

  // Auto-select first email if none selected
  const selectedEmail = emails.find((e) => e.id === selectedEmailId) || emails[0] || null;

  // Filter Emails
  const filteredEmails = emails.filter((item) => {
    const matchesSearch =
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderTimestampBadge = (item: EmailItem) => {
    const statusUpper = (item.status || 'QUEUED').toUpperCase();
    const dateVal = item.sentAt || item.scheduledAt || item.createdAt;
    const formattedTime = new Date(dateVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (statusUpper === 'SENT') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>SENT • {formattedTime}</span>
        </span>
      );
    }

    if (statusUpper === 'PROCESSING') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>PROCESSING • {formattedTime}</span>
        </span>
      );
    }

    if (statusUpper === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          <span>FAILED • {formattedTime}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        <span>QUEUED • {formattedTime}</span>
      </span>
    );
  };

  return (
    <div className="flex-1 flex w-full h-full overflow-hidden bg-white text-slate-900">
      {/* COLUMN 2: MAIL LIST PANEL (380px fixed width on XL screens, White Background) */}
      <div
        className={`w-full xl:w-[380px] flex-shrink-0 border-r border-slate-200 bg-white flex flex-col h-full transition-all ${
          mobileDetailView ? 'hidden xl:flex' : 'flex'
        }`}
      >
        {/* Header Bar with Search & Filters */}
        <div className="p-3.5 border-b border-slate-200 space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h2>
              <p className="text-[11px] text-slate-500">{description}</p>
            </div>

            <button
              onClick={onRefresh}
              disabled={loading}
              title="Refresh inbox"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* FIGMA SPEC SEARCH BAR: Height 40px, Background #F5F5F5, Border None, Radius 20px */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by recipient or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[40px] bg-[#F5F5F5] border-none rounded-[20px] pl-10 pr-4 text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-300"
            />
          </div>

          {/* Status Filter Row */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Total: {filteredEmails.length} messages</span>
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="QUEUED">QUEUED</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="SENT">SENT</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>
          </div>
        </div>

        {/* NATIVE EMAIL CLIENT ROWS: Height 56px, Divider Lines, Hover #F8F8F8, Selected #F1F5F9 */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredEmails.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <Inbox className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
              <p>No messages found matching search criteria.</p>
            </div>
          ) : (
            filteredEmails.map((item) => {
              const isSelected = selectedEmail?.id === item.id;
              const previewSnippet = item.bodyText || item.subject;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedEmailId(item.id);
                    setMobileDetailView(true);
                  }}
                  className={`h-[56px] min-h-[56px] px-3.5 flex flex-col justify-center cursor-pointer transition-colors border-b border-slate-100 ${
                    isSelected ? 'bg-[#F1F5F9]' : 'hover:bg-[#F8F8F8]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900 truncate max-w-[210px]">
                      {item.recipientEmail}
                    </span>
                    {renderTimestampBadge(item)}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate mt-0.5">
                    <span className="font-medium text-slate-800 truncate max-w-[140px]">{item.subject}</span>
                    <span className="text-slate-300 font-bold">•</span>
                    <span className="text-slate-400 truncate flex-1 text-[11px]">{previewSnippet}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* COLUMN 3: FIGMA REBUILT EMAIL PREVIEW PANEL (Flex-1, White BG, 720px max content width) */}
      <div
        className={`flex-1 flex flex-col h-full bg-white overflow-hidden transition-all ${
          !mobileDetailView ? 'hidden xl:flex' : 'flex'
        }`}
      >
        {selectedEmail ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Top Toolbar Header with Back button & Action Icons */}
            <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between flex-shrink-0 px-6 sm:px-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileDetailView(false)}
                  className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 xl:hidden"
                  title="Back to email list"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <span className="text-xs font-mono text-slate-400">ID: {selectedEmail.id}</span>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(selectedEmail.id)}
                  title="Copy Job ID"
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  title="Delete message"
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  title="More actions"
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Reading Container: Max-width 720px */}
            <div className="flex-1 p-6 sm:p-10 overflow-y-auto">
              <div className="max-w-[720px] mx-auto space-y-8">
                {/* Heading Subject (32px) */}
                <h1 className="text-[32px] font-bold text-slate-900 tracking-tight leading-tight">
                  {selectedEmail.subject}
                </h1>

                {/* Sender Metadata Row: Avatar, Name, Email, Timestamp */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {selectedEmail.recipientEmail.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-none">
                        Outbox Scheduler Engine
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        to: <span className="text-slate-800 font-medium">{selectedEmail.recipientEmail}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs text-slate-400">
                    <p>
                      {selectedEmail.sentAt
                        ? new Date(selectedEmail.sentAt).toLocaleString()
                        : selectedEmail.scheduledAt
                        ? new Date(selectedEmail.scheduledAt).toLocaleString()
                        : new Date(selectedEmail.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Email Body Content (15px font size, 1.8 line height) */}
                <div className="text-[15px] leading-[1.8] text-[#1E293B] font-sans min-h-[200px]">
                  {selectedEmail.bodyHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }} />
                  ) : (
                    <p className="whitespace-pre-wrap">{selectedEmail.bodyText || 'No body content available.'}</p>
                  )}
                </div>

                {/* Compact Bordered Attachment Card (Rendered only when email has attachments) */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="pt-6 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider font-mono">
                      Attachments ({selectedEmail.attachments.length})
                    </p>
                    <div className="space-y-2">
                      {selectedEmail.attachments.map((att: any, idx: number) => (
                        <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center justify-between max-w-sm">
                          <div className="flex items-center gap-3">
                            <Paperclip className="w-4 h-4 text-slate-500" />
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{att.filename || att.name || 'attachment'}</p>
                              <p className="text-[10px] text-slate-500">{att.size ? `${Math.round(att.size / 1024)} KB` : 'Attachment'}</p>
                            </div>
                          </div>
                          <button className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-slate-400 space-y-2">
            <div>
              <Mail className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
              <p className="text-slate-700 font-semibold">No Email Selected</p>
              <p className="text-slate-500 text-[11px] mt-1">Select an email from the left list to view reading preview.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
