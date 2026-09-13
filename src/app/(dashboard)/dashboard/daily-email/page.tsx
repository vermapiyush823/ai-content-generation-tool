'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Sparkles,
  Send,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Settings as SettingsIcon,
  Loader2,
  Play,
  Film,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface DailyPackage {
  _id: string;
  date: string;
  status: 'generating' | 'completed' | 'failed' | 'emailed';
  strategy: {
    objective: string;
    focus: string;
    avoid: string;
    experiment?: string;
    reason: string;
  };
  channelId: {
    _id: string;
    name: string;
    genre: string;
  };
  episodes: {
    _id: string;
    title: string;
    hook: string;
    duration: number;
    seriesId?: {
      title: string;
    };
  }[];
  createdAt: string;
}

export default function DailyEmailPage() {
  const { success, error: toastError } = useToast();
  const [packages, setPackages] = useState<DailyPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<DailyPackage | null>(null);

  // Settings form
  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    recipientEmail: '',
    time: '08:00',
    timezone: 'UTC',
    videosPerChannel: 2,
    includeInsights: true,
    includeScripts: true,
    includePrompts: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  async function loadPackages() {
    setLoading(true);
    try {
      const res = await fetch('/api/daily-package');
      if (res.ok) {
        const d = await res.json();
        setPackages(d.packages || []);
      }
    } catch {
      toastError('Failed to load packages');
    } finally {
      setLoading(false);
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const d = await res.json();
        if (d.settings?.emailSettings) {
          setEmailSettings(d.settings.emailSettings);
        }
      }
    } catch {}
  }

  useEffect(() => {
    loadPackages();
    loadSettings();
  }, []);

  async function handleTriggerNow() {
    setTriggering(true);
    try {
      const res = await fetch('/api/daily-package', { method: 'POST' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to trigger package');
      }

      const d = await res.json();
      success(d.message || 'Daily package generated and email dispatched!');
      loadPackages();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Error triggering package');
    } finally {
      setTriggering(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailSettings }),
      });

      if (!res.ok) throw new Error('Failed to update email settings');
      success('Email preferences updated successfully!');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <div style={{ paddingBottom: 64 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
            Daily Content Packages & Email
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Automated multi-channel packages delivered directly to your inbox via Resend
          </p>
        </div>

        <button
          onClick={handleTriggerNow}
          disabled={triggering}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {triggering ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Generating Today&apos;s Package...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Trigger Today&apos;s Package Now</span>
            </>
          )}
        </button>
      </div>

      <div className="grid-responsive-two-col">
        {/* Left: Package History */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Generated Package History</h3>
            <button
              onClick={loadPackages}
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: '4px 8px' }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 64 }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
              <p style={{ color: 'var(--text-muted)' }}>Loading package history...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <Mail size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 14px' }} />
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No Packages Generated Yet</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 18 }}>
                Click &ldquo;Trigger Today&apos;s Package Now&rdquo; to generate your first multi-channel content pack.
              </p>
              <button onClick={handleTriggerNow} disabled={triggering} className="btn btn-primary">
                Generate First Package
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {packages.map((pkg) => (
                <div
                  key={pkg._id}
                  className="card"
                  style={{
                    padding: 20,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 15, fontWeight: 800 }}>📅 {pkg.date}</span>
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                        {pkg.channelId?.name} ({pkg.channelId?.genre})
                      </span>
                    </div>

                    <span
                      className={`badge badge-${
                        pkg.status === 'emailed' || pkg.status === 'completed'
                          ? 'success'
                          : pkg.status === 'failed'
                          ? 'danger'
                          : 'warning'
                      }`}
                    >
                      {pkg.status}
                    </span>
                  </div>

                  {/* Strategy directive */}
                  <div
                    style={{
                      background: 'rgba(99, 102, 241, 0.05)',
                      padding: 12,
                      borderRadius: 6,
                      fontSize: 12,
                      borderLeft: '3px solid #6366f1',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#818cf8' }}>Today&apos;s Directive:</strong>{' '}
                      <span style={{ color: 'var(--text-primary)' }}>{pkg.strategy?.objective}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                      Focus: {pkg.strategy?.focus} • Avoid: {pkg.strategy?.avoid}
                    </div>
                  </div>

                  {/* Episodes created */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {pkg.episodes?.map((ep) => (
                      <Link
                        key={ep._id}
                        href={`/dashboard/content/${ep._id}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: 6,
                          textDecoration: 'none',
                          color: 'inherit',
                          fontSize: 13,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Film size={14} style={{ color: '#ec4899' }} />
                          <span style={{ fontWeight: 600 }}>{ep.title}</span>
                          {ep.seriesId && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              ({ep.seriesId.title})
                            </span>
                          )}
                        </div>
                        <span style={{ color: '#818cf8', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          View Script & Prompts <Play size={12} />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Email Settings */}
        <div className="card" style={{ padding: 22, position: 'sticky', top: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <SettingsIcon size={18} style={{ color: '#6366f1' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Email Configuration</h3>
          </div>

          <form onSubmit={handleSaveSettings}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={emailSettings.enabled}
                  onChange={(e) => setEmailSettings({ ...emailSettings, enabled: e.target.checked })}
                />
                <span style={{ fontWeight: 600 }}>Enable Daily Email Delivery</span>
              </label>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                Recipient Email
              </label>
              <input
                type="email"
                className="input"
                placeholder="you@domain.com"
                value={emailSettings.recipientEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, recipientEmail: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Delivery Time
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, fontSize: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={emailSettings.includeScripts}
                  onChange={(e) => setEmailSettings({ ...emailSettings, includeScripts: e.target.checked })}
                />
                <span>Include Full Retention Scripts</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={emailSettings.includePrompts}
                  onChange={(e) => setEmailSettings({ ...emailSettings, includePrompts: e.target.checked })}
                />
                <span>Include Scene Video Prompts</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={emailSettings.includeInsights}
                  onChange={(e) => setEmailSettings({ ...emailSettings, includeInsights: e.target.checked })}
                />
                <span>Include Performance Insights</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {savingSettings ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>

          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 12,
              color: 'var(--text-muted)',
              lineHeight: 1.4,
            }}
          >
            <strong>Cron Integration:</strong> Trigger via external cron using{' '}
            <code style={{ color: '#818cf8' }}>/api/cron/daily-content</code> with your{' '}
            <code>DAILY_CRON_SECRET</code> header.
          </div>
        </div>
      </div>
    </div>
  );
}
