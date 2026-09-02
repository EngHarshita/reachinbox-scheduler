import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { Send, Calendar, Clock, Gauge, Upload, CheckCircle2, AlertCircle, X, Bold, Italic, Link as LinkIcon, List, Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ParsedRecipient {
  email: string;
  metadata?: Record<string, string>;
}

export const ComposeEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const editorRef = useRef<HTMLDivElement>(null);

  // Form Fields State
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [startTime, setStartTime] = useState('');
  const [delayBetweenEmails, setDelayBetweenEmails] = useState<number>(10);
  const [hourlyLimit, setHourlyLimit] = useState<number>(100);

  // CSV & Recipient State
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [parsedRecipients, setParsedRecipients] = useState<ParsedRecipient[]>([]);
  const [manualEmailInput, setManualEmailInput] = useState('');

  // Submission State
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual Recipient Handler
  const addManualRecipient = () => {
    const trimmed = manualEmailInput.trim().toLowerCase();
    if (!trimmed) return;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      setErrorMsg(`'${trimmed}' is not a valid email address.`);
      return;
    }

    if (parsedRecipients.some((r) => r.email === trimmed)) {
      setErrorMsg(`'${trimmed}' is already in the recipient list.`);
      setManualEmailInput('');
      return;
    }

    setErrorMsg(null);
    setParsedRecipients([...parsedRecipients, { email: trimmed }]);
    setManualEmailInput('');
  };

  const handleKeyDownManualEmail = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addManualRecipient();
    }
  };

  // Sync contentEditable innerHTML with bodyHtml state
  const handleEditorInput = () => {
    if (editorRef.current) {
      setBodyHtml(editorRef.current.innerHTML);
    }
  };

  // Visual Rich-Text Formatting Handlers using Browser Selection API & execCommand
  const handleBold = () => {
    document.execCommand('bold', false);
    handleEditorInput();
  };

  const handleItalic = () => {
    document.execCommand('italic', false);
    handleEditorInput();
  };

  const handleLink = () => {
    const defaultUrl = 'https://example.com';
    const targetUrl = window.prompt('Enter destination URL for link:', defaultUrl);
    if (!targetUrl) return;

    const sanitizedUrl = targetUrl.trim() || defaultUrl;
    document.execCommand('createLink', false, sanitizedUrl);
    handleEditorInput();
  };

  const handleBulletList = () => {
    document.execCommand('insertUnorderedList', false);
    handleEditorInput();
  };

  const handleCode = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const codeElement = document.createElement('code');
      codeElement.style.backgroundColor = '#f1f5f9';
      codeElement.style.color = '#0f172a';
      codeElement.style.padding = '2px 4px';
      codeElement.style.borderRadius = '4px';
      codeElement.style.fontFamily = 'monospace';
      codeElement.style.fontSize = '12px';
      try {
        range.surroundContents(codeElement);
      } catch (_) {
        document.execCommand('formatBlock', false, 'pre');
      }
    } else {
      document.execCommand('formatBlock', false, 'pre');
    }
    handleEditorInput();
  };

  // CSV File Handler
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split(/\r\n|\n/);
      const extracted: ParsedRecipient[] = [];
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const match = trimmed.match(emailRegex);
        if (match) {
          const foundEmail = match[0].toLowerCase();
          if (!extracted.some((r) => r.email === foundEmail)) {
            extracted.push({ email: foundEmail });
          }
        }
      });

      if (extracted.length === 0) {
        setErrorMsg('No valid email addresses found in the uploaded CSV file.');
      }

      setParsedRecipients(extracted);
    };

    reader.readAsText(file);
  };

  const removeRecipient = (emailToRemove: string) => {
    setParsedRecipients(parsedRecipients.filter((r) => r.email !== emailToRemove));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!subject || !bodyHtml || !startTime) {
      setErrorMsg('Please fill in Subject, Body, and Start Time fields.');
      return;
    }

    if (parsedRecipients.length === 0) {
      setErrorMsg('Please upload a CSV contact list containing recipient emails.');
      return;
    }

    try {
      setLoading(true);

      const baseStartTimeMs = new Date(startTime).getTime();
      let scheduledCount = 0;

      for (let i = 0; i < parsedRecipients.length; i++) {
        const recipient = parsedRecipients[i];
        const delaySeconds = i * delayBetweenEmails;
        const hourOffsetMs = Math.floor(i / Math.max(1, hourlyLimit)) * 3600000;
        const targetScheduleTimeMs = baseStartTimeMs + delaySeconds * 1000 + hourOffsetMs;
        const isoScheduledTime = new Date(targetScheduleTimeMs).toISOString();

        await api.post('/emails/schedule', {
          recipientEmail: recipient.email,
          subject,
          bodyHtml,
          scheduledAt: isoScheduledTime,
        });

        scheduledCount++;
      }

      setSuccessMsg(`Successfully scheduled ${scheduledCount} campaign email(s) via BullMQ queue!`);
      setTimeout(() => {
        navigate('/scheduled');
      }, 1800);
    } catch (err: any) {
      console.error('Failed to schedule campaign:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to schedule campaign emails.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto space-y-6 w-full bg-white text-slate-900">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Bar with Top-Right "Send Later" Outline Green Button (Radius 9999px) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Compose Campaign</h1>
            <p className="text-xs text-slate-500 mt-0.5">Design email template and configure rate limits.</p>
          </div>

          <button
            type="submit"
            disabled={loading || parsedRecipients.length === 0}
            className="h-10 px-5 rounded-full bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Scheduling...' : 'Send Later'}</span>
          </button>
        </div>

        {/* Banners */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Container Card */}
        <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-6 space-y-5">
          {/* FROM FIELD */}
          <div className="flex items-center gap-4 pb-3 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 w-16">From:</span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs text-slate-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>
                {user?.fullName
                  ? `${user.fullName} (${user.email || 'user@reachinbox.com'})`
                  : user?.email || 'user@reachinbox.com'}
              </span>
            </div>
          </div>

          {/* TO FIELD & RECIPIENT CHIPS & RIGHT-ALIGNED UPLOAD LIST */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-slate-200">
            <div className="flex items-start gap-4 flex-1">
              <span className="text-xs font-semibold text-slate-500 w-16 pt-1">To:</span>
              <div className="flex-1 flex flex-wrap gap-2 items-center">
                {parsedRecipients.map((rec) => (
                  <span
                    key={rec.email}
                    className="rounded-full px-3 py-1 text-xs bg-emerald-50 text-emerald-800 border border-emerald-500/40 flex items-center gap-1.5 font-medium"
                  >
                    <span>{rec.email}</span>
                    <button
                      type="button"
                      onClick={() => removeRecipient(rec.email)}
                      className="text-emerald-700 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="email"
                  value={manualEmailInput}
                  onChange={(e) => setManualEmailInput(e.target.value)}
                  onKeyDown={handleKeyDownManualEmail}
                  onBlur={addManualRecipient}
                  placeholder={parsedRecipients.length === 0 ? "Type recipient email & press Enter or upload CSV..." : "Add another email..."}
                  className="bg-transparent border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-none flex-1 min-w-[200px] py-1"
                />
              </div>
            </div>

            {/* Right Aligned CSV Upload Button */}
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-xs font-medium text-slate-700 cursor-pointer transition-colors shadow-2xs flex-shrink-0">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>{csvFileName ? `CSV: ${csvFileName}` : 'Upload List'}</span>
              <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
            </label>
          </div>

          {/* SUBJECT FIELD */}
          <div className="flex items-center gap-4 pb-3 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 w-16">Subject:</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject line..."
              required
              className="flex-1 bg-transparent border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          {/* INLINE CONTROLS: Start Time, Delay Between Emails, Hourly Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Start Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Delay (seconds)
              </label>
              <input
                type="number"
                min="0"
                value={delayBetweenEmails}
                onChange={(e) => setDelayBetweenEmails(Number(e.target.value))}
                required
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-slate-400" /> Hourly Limit (emails/hr)
              </label>
              <input
                type="number"
                min="1"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(Number(e.target.value))}
                required
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>
        </div>

        {/* EDITOR AREA: Toolbar on Top, White Background, Large Area */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden space-y-0">
          {/* Top Formatting Toolbar */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-slate-600 text-xs">
            <button
              type="button"
              onClick={handleBold}
              className="p-1.5 rounded hover:bg-slate-200/60 transition-colors text-slate-800"
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleItalic}
              className="p-1.5 rounded hover:bg-slate-200/60 transition-colors text-slate-800"
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleLink}
              className="p-1.5 rounded hover:bg-slate-200/60 transition-colors text-slate-800"
              title="Insert Link"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleBulletList}
              className="p-1.5 rounded hover:bg-slate-200/60 transition-colors text-slate-800"
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCode}
              className="p-1.5 rounded hover:bg-slate-200/60 transition-colors text-slate-800"
              title="Code Block"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Large Visual Rich-Text Editor Area */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            onBlur={handleEditorInput}
            className="w-full p-4 bg-white text-sm text-slate-800 focus:outline-none leading-relaxed font-sans min-h-[260px] max-h-[500px] overflow-y-auto border-none outline-none"
            style={{ minHeight: '260px' }}
            data-placeholder="Write your email body content here..."
          />
        </div>
      </form>
    </div>
  );
};
