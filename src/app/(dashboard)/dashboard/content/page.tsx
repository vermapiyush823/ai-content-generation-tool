'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Sparkles,
  Search,
  Filter,
  Loader2,
  Film,
  Play,
  Copy,
  Trash2,
  Check,
  ChevronRight,
  Tv2,
  BookOpen,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface Channel {
  _id: string;
  name: string;
  genre: string;
}

interface SeriesItem {
  _id: string;
  title: string;
  channelId: string;
}

interface EpisodeItem {
  _id: string;
  episodeNumber: number;
  title: string;
  hook: string;
  duration: number;
  status: 'draft' | 'script_ready' | 'prompts_ready' | 'approved' | 'generated' | 'published';
  qualityScore?: number;
  continuityScore?: number;
  sceneCount: number;
  seriesId?: {
    _id: string;
    title: string;
  };
  channelId: {
    _id: string;
    name: string;
    genre: string;
    slug: string;
  };
  createdAt: string;
}

export default function ContentListPage() {
  const { success, error: toastError } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Generation Modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [modalChannelId, setModalChannelId] = useState('');
  const [modalSeriesId, setModalSeriesId] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalPrompt, setModalPrompt] = useState('');
  const [modalDuration, setModalDuration] = useState('30-45 seconds');

  useEffect(() => {
    // Load channels
    fetch('/api/channels')
      .then((r) => r.json())
      .then((d) => {
        const chs = d.channels || [];
        setChannels(chs);
        if (chs.length > 0) setModalChannelId(chs[0]._id);
      })
      .catch(() => {});

    // Load series
    fetch('/api/series')
      .then((r) => r.json())
      .then((d) => setSeriesList(d.series || []))
      .catch(() => {});
  }, []);

  async function loadEpisodes() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (channelFilter) params.set('channelId', channelFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/episodes?${params}`);
      if (res.ok) {
        const d = await res.json();
        setEpisodes(d.episodes || []);
      }
    } catch {
      toastError('Failed to load content');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEpisodes();
  }, [channelFilter, statusFilter]);

  async function handleGenerateScript(e: React.FormEvent) {
    e.preventDefault();
    if (!modalChannelId) {
      toastError('Please select a channel');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/episodes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: modalChannelId,
          seriesId: modalSeriesId || undefined,
          title: modalTitle || undefined,
          customPrompt: modalPrompt || undefined,
          targetDuration: modalDuration,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to generate content');
      }

      const d = await res.json();
      success(`Generated script: "${d.episode.title}"!`);
      setShowGenModal(false);
      setModalTitle('');
      setModalPrompt('');
      loadEpisodes();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteEpisode(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this content package?')) return;

    try {
      const res = await fetch(`/api/episodes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        success('Content deleted');
        setEpisodes((prev) => prev.filter((ep) => ep._id !== id));
      } else {
        toastError('Failed to delete content');
      }
    } catch {
      toastError('Failed to delete content');
    }
  }

  // Filtered list
  const filteredEpisodes = episodes.filter((ep) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ep.title.toLowerCase().includes(q) ||
      ep.hook.toLowerCase().includes(q) ||
      ep.channelId?.name.toLowerCase().includes(q) ||
      ep.seriesId?.title.toLowerCase().includes(q)
    );
  });

  // Filter series options in modal by chosen channel
  const modalSeriesOptions = seriesList.filter(
    (s) => !modalChannelId || (s as any).channelId?._id === modalChannelId || s.channelId === modalChannelId
  );

  const promptsReadyCount = episodes.filter((ep) => ep.status === 'prompts_ready').length;
  const scriptReadyCount = episodes.filter((ep) => ep.status === 'script_ready').length;
  const approvedCount = episodes.filter((ep) => ep.status === 'approved' || ep.status === 'published').length;

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
            Content & Video Scripts
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Review scripts, inspect scenes, and extract multi-model video generation prompts
          </p>
        </div>

        <button
          onClick={() => setShowGenModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Sparkles size={16} />
          <span>AI Generate Script</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="card" style={{ padding: 18 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Videos
          </span>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{episodes.length}</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Prompts Ready
          </span>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: '#10b981' }}>
            {promptsReadyCount}
          </div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Scripts Ready
          </span>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: '#6366f1' }}>
            {scriptReadyCount}
          </div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Approved / Published
          </span>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: '#a855f7' }}>
            {approvedCount}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 24,
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="input"
            placeholder="Search by title, hook, or series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Channel:</span>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="input"
            style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
          >
            <option value="">All Channels</option>
            {channels.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
            style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="script_ready">Script Ready</option>
            <option value="prompts_ready">Prompts Ready</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {/* Content List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <Loader2
            size={32}
            className="animate-spin"
            style={{ margin: '0 auto 12px', color: 'var(--primary)' }}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading content library...</p>
        </div>
      ) : filteredEpisodes.length === 0 ? (
        <div className="empty-state card" style={{ padding: 64, textAlign: 'center' }}>
          <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Content Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 440, margin: '0 auto 20px' }}>
            Generate your first high-retention short-form video script with hooks and multi-model video prompts.
          </p>
          <button
            onClick={() => setShowGenModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Sparkles size={16} />
            <span>Generate First Script</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredEpisodes.map((ep) => (
            <Link
              key={ep._id}
              href={`/dashboard/content/${ep._id}`}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 18,
                textDecoration: 'none',
                color: 'inherit',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'border-color 0.15s ease, transform 0.15s ease',
              }}
            >
              <div style={{ flex: 1, minWidth: 0, paddingRight: 20 }}>
                {/* Channel & Series Badge row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span
                    className="badge"
                    style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', fontSize: 11 }}
                  >
                    {ep.channelId?.name || 'Channel'}
                  </span>

                  {ep.seriesId ? (
                    <span
                      className="badge"
                      style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe', fontSize: 11 }}
                    >
                      Series: {ep.seriesId.title} (EP {ep.episodeNumber})
                    </span>
                  ) : (
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', fontSize: 11 }}>
                      Standalone
                    </span>
                  )}

                  <span
                    className={`badge badge-${
                      ep.status === 'prompts_ready' || ep.status === 'approved'
                        ? 'success'
                        : ep.status === 'script_ready'
                        ? 'primary'
                        : 'neutral'
                    }`}
                    style={{ fontSize: 11 }}
                  >
                    {ep.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{ep.title}</h3>

                {/* Hook preview */}
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    lineHeight: 1.4,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <strong style={{ color: '#ec4899' }}>Hook:</strong> &ldquo;{ep.hook}&rdquo;
                </p>
              </div>

              {/* Right indicators & actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  flexShrink: 0,
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ep.duration}s</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {ep.sceneCount > 0 ? `${ep.sceneCount} scenes` : 'No scenes yet'}
                  </div>
                </div>

                {ep.qualityScore && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#10b981' }}>{ep.qualityScore}%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Quality</div>
                  </div>
                )}

                <button
                  onClick={(e) => handleDeleteEpisode(ep._id, e)}
                  title="Delete Video"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 6,
                  }}
                >
                  <Trash2 size={16} />
                </button>

                <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* AI Generate Script Modal */}
      {showGenModal && (
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
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 540,
              padding: 28,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Sparkles size={20} style={{ color: '#a855f7' }} />
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>AI Generate Short-Form Script</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
              Generates a retention-optimized script (Hook, Setup, Escalation, Payoff, Cliffhanger) adhering to Channel DNA and canon continuity.
            </p>

            <form onSubmit={handleGenerateScript}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Target Channel
                </label>
                <select
                  value={modalChannelId}
                  onChange={(e) => {
                    setModalChannelId(e.target.value);
                    setModalSeriesId('');
                  }}
                  className="input"
                  required
                >
                  {channels.map((ch) => (
                    <option key={ch._id} value={ch._id}>
                      {ch.name} ({ch.genre})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Attach to Series (optional)
                </label>
                <select
                  value={modalSeriesId}
                  onChange={(e) => setModalSeriesId(e.target.value)}
                  className="input"
                >
                  <option value="">Standalone Video (No Series)</option>
                  {modalSeriesOptions.map((s) => (
                    <option key={s._id} value={s._id}>
                      Series: {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Title or Episode Concept (optional)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. The Man in the Reflection"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Custom Prompt / Plot Beats (optional)
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Leave empty for AI to invent an original hook based on Channel DNA..."
                  value={modalPrompt}
                  onChange={(e) => setModalPrompt(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Target Duration
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['25-35 seconds', '35-60 seconds', '60-90 seconds'].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setModalDuration(dur)}
                      className="btn"
                      style={{
                        flex: 1,
                        fontSize: 12,
                        background: modalDuration === dur ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                        borderColor: modalDuration === dur ? '#818cf8' : 'rgba(255, 255, 255, 0.1)',
                        color: modalDuration === dur ? '#fff' : 'var(--text-secondary)',
                      }}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  disabled={generating}
                  className="btn"
                  style={{ background: 'transparent' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {generating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Writing Retention Script...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Generate Script</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
