'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Tv2,
  Plus,
  Loader2,
  MoreHorizontal,
  Trash2,
  Edit,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface Channel {
  _id: string;
  name: string;
  slug: string;
  genre: string;
  language: string;
  platforms: string[];
  active: boolean;
  createdAt: string;
}

const PLATFORMS: Record<string, string> = {
  youtube_shorts: 'YouTube Shorts',
  instagram_reels: 'Instagram Reels',
  tiktok: 'TikTok',
};

const GENRES = [
  'Horror', 'Sci-Fi', 'Mystery', 'Thriller', 'Fantasy', 'Comedy',
  'Drama', 'Romance', 'Action', 'Documentary', 'Educational',
  'True Crime', 'Mythology', 'Conspiracy', 'History', 'Other',
];

export default function ChannelsPage() {
  const { success, error: toastError } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('English');
  const [platforms, setPlatforms] = useState<string[]>(['youtube_shorts']);

  async function loadChannels() {
    try {
      const res = await fetch('/api/channels');
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels);
      }
    } catch {
      toastError('Failed to load channels');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChannels();
  }, []);

  async function handleCreate() {
    if (!name.trim() || !genre) return;
    setCreating(true);
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, genre, language, platforms }),
      });
      if (res.ok) {
        success('Channel created successfully!');
        setShowCreate(false);
        setName('');
        setGenre('');
        loadChannels();
      } else {
        const data = await res.json();
        toastError(data.error || 'Failed to create channel');
      }
    } catch {
      toastError('Network error');
    } finally {
      setCreating(false);
    }
  }

  async function toggleChannel(id: string, active: boolean) {
    try {
      const res = await fetch(`/api/channels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      });
      if (res.ok) {
        success(`Channel ${!active ? 'activated' : 'deactivated'}`);
        loadChannels();
      }
    } catch {
      toastError('Failed to update channel');
    }
  }

  async function deleteChannel(id: string) {
    if (!confirm('Are you sure you want to delete this channel? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/channels/${id}`, { method: 'DELETE' });
      if (res.ok) {
        success('Channel deleted');
        loadChannels();
      }
    } catch {
      toastError('Failed to delete channel');
    }
  }

  function togglePlatform(platform: string) {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-violet)' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Channels
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Manage your content channels and their DNA
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Channel
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Create Channel</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Channel Name *
                </label>
                <input
                  className="input"
                  placeholder="e.g., DarkVerse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Genre *
                </label>
                <select
                  className="input"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                >
                  <option value="">Select genre...</option>
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Language
                </label>
                <input
                  className="input"
                  placeholder="English"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
                  Platforms *
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {Object.entries(PLATFORMS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => togglePlatform(key)}
                      className={platforms.includes(key) ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleCreate}
                  disabled={creating || !name.trim() || !genre || platforms.length === 0}
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : 'Create Channel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Channel grid */}
      {channels.length === 0 ? (
        <div className="empty-state card" style={{ padding: 48 }}>
          <Tv2 size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No channels yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            Create your first channel to start generating content
          </p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Channel
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
            gap: 16,
          }}
        >
          {channels.map((channel) => (
            <div key={channel._id} className="card card-glow" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <Link
                  href={`/dashboard/channels/${channel._id}`}
                  style={{ textDecoration: 'none', flex: 1 }}
                >
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {channel.name}
                  </h3>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="badge badge-violet">{channel.genre}</span>
                    <span className="badge badge-cyan">{channel.language}</span>
                    {!channel.active && <span className="badge badge-rose">Inactive</span>}
                  </div>
                </Link>

                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => toggleChannel(channel._id, channel.active)}
                    title={channel.active ? 'Deactivate' : 'Activate'}
                  >
                    {channel.active ? <ToggleRight size={16} style={{ color: 'var(--accent-emerald)' }} /> : <ToggleLeft size={16} />}
                  </button>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => deleteChannel(channel._id)}
                    title="Delete"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {channel.platforms.map((p) => (
                  <span
                    key={p}
                    style={{
                      fontSize: 11,
                      color: 'var(--text-tertiary)',
                      background: 'var(--bg-tertiary)',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {PLATFORMS[p] || p}
                  </span>
                ))}
              </div>

              <Link
                href={`/dashboard/channels/${channel._id}`}
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 12, fontSize: 12, padding: '6px 0' }}
              >
                <Edit size={12} /> Edit Channel DNA →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
