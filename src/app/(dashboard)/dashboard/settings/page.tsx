'use client';

import { useEffect, useState } from 'react';
import {
  Settings,
  Brain,
  Mail,
  Shield,
  Key,
  Database,
  Cpu,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { useAuth } from '@/components/providers/AuthProvider';

export default function SettingsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    recipientEmail: '',
    time: '08:00',
    timezone: 'UTC',
    videosPerChannel: 2,
    includeInsights: true,
    includeScripts: true,
    includePrompts: true,
    includeCaptions: true,
  });

  const [aiUsage, setAiUsage] = useState({
    generationsToday: 0,
    generationsMonth: 0,
  });

  const [systemInfo, setSystemInfo] = useState({
    aiBrain: '',
    hasResend: false,
    hasNvidia: false,
    appUrl: '',
  });

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.emailSettings) setEmailSettings(d.settings.emailSettings);
        if (d.settings?.aiUsage) setAiUsage(d.settings.aiUsage);
        if (d.system) setSystemInfo(d.system);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailSettings }),
      });

      if (!res.ok) throw new Error('Failed to update settings');
      success('Settings updated successfully!');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading system preferences...</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 64, maxWidth: 840 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
          Application Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Manage AI Brain architecture, Resend email automation, and usage telemetry
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Section 1: AI Brain Architecture */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Cpu size={20} style={{ color: '#6366f1' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>AI Brain Configuration</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
            The AI Brain coordinates prompt generation, character continuity audits, and strategic learning.
          </p>

          <div
            style={{
              padding: 16,
              background: 'rgba(99, 102, 241, 0.05)',
              borderRadius: 8,
              border: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Configured Model ID:</span>
              <code style={{ color: '#a5b4fc', fontSize: 13 }}>
                {systemInfo.aiBrain || 'nvidia/llama-3.1-nemotron-70b-instruct'}
              </code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>NVIDIA API Status:</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: systemInfo.hasNvidia ? '#10b981' : '#f59e0b' }}>
                {systemInfo.hasNvidia ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                {systemInfo.hasNvidia ? 'Connected' : 'Key Configured (Simulated Fallback Ready)'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Cost Control & Usage */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Brain size={20} style={{ color: '#10b981' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>AI Usage & Cost Control</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
            Token usage is tracked per generation session to safeguard API limits.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ padding: 14, background: 'rgba(255, 255, 255, 0.02)', borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Generations Today
              </span>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                {aiUsage.generationsToday || 0}
              </div>
            </div>
            <div style={{ padding: 14, background: 'rgba(255, 255, 255, 0.02)', borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Generations This Month
              </span>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#6366f1', marginTop: 4 }}>
                {aiUsage.generationsMonth || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Daily Email Delivery Settings */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Mail size={20} style={{ color: '#ec4899' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Email Automation (Resend)</h2>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={emailSettings.enabled}
                onChange={(e) => setEmailSettings({ ...emailSettings, enabled: e.target.checked })}
              />
              <span style={{ fontWeight: 600 }}>Enable Daily Content Dispatch</span>
            </label>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              Recipient Email Address
            </label>
            <input
              type="email"
              className="input"
              value={emailSettings.recipientEmail}
              onChange={(e) => setEmailSettings({ ...emailSettings, recipientEmail: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                Scheduled Send Time
              </label>
              <input
                type="time"
                className="input"
                value={emailSettings.time}
                onChange={(e) => setEmailSettings({ ...emailSettings, time: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                Timezone
              </label>
              <input
                type="text"
                className="input"
                value={emailSettings.timezone}
                onChange={(e) => setEmailSettings({ ...emailSettings, timezone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={emailSettings.includeScripts}
                onChange={(e) => setEmailSettings({ ...emailSettings, includeScripts: e.target.checked })}
              />
              <span>Include Scene Scripts</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={emailSettings.includePrompts}
                onChange={(e) => setEmailSettings({ ...emailSettings, includePrompts: e.target.checked })}
              />
              <span>Include AI Video Prompts</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={emailSettings.includeInsights}
                onChange={(e) => setEmailSettings({ ...emailSettings, includeInsights: e.target.checked })}
              />
              <span>Include Strategy Directives & Insights</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
