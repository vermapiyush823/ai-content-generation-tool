'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Plus,
  TrendingUp,
  Eye,
  Heart,
  Share2,
  Percent,
  Trash2,
  Loader2,
  Calendar,
  Filter,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface Channel {
  _id: string;
  name: string;
  genre: string;
}

interface PerformanceMetric {
  _id: string;
  title: string;
  platform: 'youtube_shorts' | 'instagram_reels' | 'tiktok';
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followersGained: number;
  completionRate?: number;
  averagePercentageViewed?: number;
  videoDuration: number;
  publishDate: string;
  channelId: {
    _id: string;
    name: string;
    genre: string;
  };
}

export default function PerformancePage() {
  const { success, error: toastError } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [summary, setSummary] = useState({
    totalEntries: 0,
    totalViews: 0,
    totalLikes: 0,
    totalShares: 0,
    avgCompletion: 0,
  });
  const [selectedChannel, setSelectedChannel] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    channelId: '',
    title: '',
    platform: 'youtube_shorts' as const,
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    followersGained: 0,
    averagePercentageViewed: 75,
    videoDuration: 30,
  });

  useEffect(() => {
    fetch('/api/channels')
      .then((r) => r.json())
      .then((d) => {
        const chs = d.channels || [];
        setChannels(chs);
        if (chs.length > 0) setForm((prev) => ({ ...prev, channelId: chs[0]._id }));
      })
      .catch(() => {});
  }, []);

  async function loadPerformance() {
    setLoading(true);
    try {
      const url = selectedChannel ? `/api/performance?channelId=${selectedChannel}` : '/api/performance';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch {
      toastError('Failed to load performance metrics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPerformance();
  }, [selectedChannel]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.channelId || !form.title) {
      toastError('Channel and Title are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          completionRate: form.averagePercentageViewed,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save performance');
      }

      success('Performance recorded successfully!');
      setShowModal(false);
      setForm((prev) => ({
        ...prev,
        title: '',
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        followersGained: 0,
      }));
      loadPerformance();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Error recording performance');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`/api/performance/${id}`, { method: 'DELETE' });
      if (res.ok) {
        success('Record deleted');
        loadPerformance();
      } else {
        toastError('Failed to delete');
      }
    } catch {
      toastError('Failed to delete');
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
            Performance Tracking
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Log views, engagement, and retention to feed the AI Content Learning Loop
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={16} />
          <span>Record Performance</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Views
            </span>
            <Eye size={16} style={{ color: '#6366f1' }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{summary.totalViews.toLocaleString()}</div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Likes
            </span>
            <Heart size={16} style={{ color: '#ec4899' }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{summary.totalLikes.toLocaleString()}</div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Avg Retention / Completion
            </span>
            <Percent size={16} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>{summary.avgCompletion}%</div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Shares
            </span>
            <Share2 size={16} style={{ color: '#a855f7' }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{summary.totalShares.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter */}
      <div
        className="card"
        style={{
          padding: 14,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Filter by Channel:</span>
        <select
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
          className="input"
          style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
        >
          <option value="">All Channels</option>
          {channels.map((ch) => (
            <option key={ch._id} value={ch._id}>
              {ch.name}
            </option>
          ))}
        </select>
      </div>

      {/* Performance List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading metrics...</p>
        </div>
      ) : metrics.length === 0 ? (
        <div className="card" style={{ padding: 64, textAlign: 'center' }}>
          <BarChart3 size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Performance Logs Yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 420, margin: '0 auto 20px' }}>
            After uploading your video externally to YouTube Shorts or Instagram Reels, log your view counts and retention here to help the AI learn.
          </p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            Log First Video
          </button>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '14px 18px' }}>Video</th>
                <th style={{ padding: '14px 18px' }}>Channel / Platform</th>
                <th style={{ padding: '14px 18px' }}>Views</th>
                <th style={{ padding: '14px 18px' }}>Likes</th>
                <th style={{ padding: '14px 18px' }}>Shares</th>
                <th style={{ padding: '14px 18px' }}>Retention</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr
                  key={m._id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>{m.title}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', marginRight: 6 }}>
                      {m.channelId?.name}
                    </span>
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', fontSize: 11 }}>
                      {m.platform.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 700 }}>{m.views.toLocaleString()}</td>
                  <td style={{ padding: '14px 18px' }}>{m.likes.toLocaleString()}</td>
                  <td style={{ padding: '14px 18px' }}>{m.shares.toLocaleString()}</td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: 600 }}>
                    {m.completionRate || m.averagePercentageViewed || 0}%
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(m._id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Performance Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Log Video Performance</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 18 }}>
              Quickly enter metrics after publishing.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Channel</label>
                <select
                  className="input"
                  value={form.channelId}
                  onChange={(e) => setForm({ ...form, channelId: e.target.value })}
                  required
                >
                  {channels.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Video Title / Episode</label>
                <input
                  type="text"
                  className="input"
                  required
                  placeholder="e.g. EP03 - The Midnight Elevator"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Platform</label>
                  <select
                    className="input"
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value as any })}
                  >
                    <option value="youtube_shorts">YouTube Shorts</option>
                    <option value="instagram_reels">Instagram Reels</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Views</label>
                  <input
                    type="number"
                    className="input"
                    value={form.views}
                    onChange={(e) => setForm({ ...form, views: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Likes</label>
                  <input
                    type="number"
                    className="input"
                    value={form.likes}
                    onChange={(e) => setForm({ ...form, likes: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Shares</label>
                  <input
                    type="number"
                    className="input"
                    value={form.shares}
                    onChange={(e) => setForm({ ...form, shares: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                    Avg Percentage Viewed (%)
                  </label>
                  <input
                    type="number"
                    className="input"
                    min={0}
                    max={100}
                    value={form.averagePercentageViewed}
                    onChange={(e) =>
                      setForm({ ...form, averagePercentageViewed: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={form.videoDuration}
                    onChange={(e) =>
                      setForm({ ...form, videoDuration: parseInt(e.target.value, 10) || 30 })
                    }
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving...' : 'Save Performance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
