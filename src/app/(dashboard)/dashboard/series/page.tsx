'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  Plus,
  Loader2,
  Users,
  Film,
  MapPin,
  ChevronRight,
  Trash2,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface Channel {
  _id: string;
  name: string;
  genre: string;
}

interface Character {
  name: string;
  role: string;
  visualIdentity: string;
}

interface SeriesItem {
  _id: string;
  title: string;
  concept: string;
  genre: string;
  premise: string;
  theme: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  plannedEpisodes: number;
  currentEpisode: number;
  characters: Character[];
  locations: { name: string }[];
  channelId: {
    _id: string;
    name: string;
    genre: string;
    slug: string;
  };
  createdAt: string;
}

export default function SeriesListPage() {
  const { success, error: toastError } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [formChannelId, setFormChannelId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formConcept, setFormConcept] = useState('');
  const [formEpisodes, setFormEpisodes] = useState(5);

  useEffect(() => {
    fetch('/api/channels')
      .then((r) => r.json())
      .then((d) => {
        const chs = d.channels || [];
        setChannels(chs);
        if (chs.length > 0) setFormChannelId(chs[0]._id);
      })
      .catch(() => {});
  }, []);

  async function loadSeries() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedChannel) params.set('channelId', selectedChannel);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/series?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSeriesList(data.series || []);
      }
    } catch {
      toastError('Failed to load series');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSeries();
  }, [selectedChannel, statusFilter]);

  async function handleAiGenerateSeries(e: React.FormEvent) {
    e.preventDefault();
    if (!formChannelId) {
      toastError('Please select a channel');
      return;
    }

    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/series/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: formChannelId,
          title: formTitle || undefined,
          concept: formConcept || undefined,
          plannedEpisodes: formEpisodes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate series');
      }

      const data = await res.json();
      success(`Series "${data.series.title}" generated with Bible & Characters!`);
      setShowCreateModal(false);
      setFormTitle('');
      setFormConcept('');
      loadSeries();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'AI generation failed');
    } finally {
      setIsAiGenerating(false);
    }
  }

  async function handleDeleteSeries(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this series?')) return;

    try {
      const res = await fetch(`/api/series/${id}`, { method: 'DELETE' });
      if (res.ok) {
        success('Series deleted');
        setSeriesList((prev) => prev.filter((s) => s._id !== id));
      } else {
        toastError('Failed to delete series');
      }
    } catch {
      toastError('Failed to delete series');
    }
  }

  // Derived stats
  const activeCount = seriesList.filter((s) => s.status === 'active').length;
  const totalEpisodesPlanned = seriesList.reduce((acc, s) => acc + (s.plannedEpisodes || 0), 0);
  const totalCharacters = seriesList.reduce((acc, s) => acc + (s.characters?.length || 0), 0);

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
            Series Engine
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Multi-part serialized story arcs with deep character & lore continuity
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Sparkles size={16} />
          <span>AI Generate Series</span>
        </button>
      </div>

      {/* Overview Stats */}
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
            Active Series
          </span>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: '#6366f1' }}>
            {activeCount}
          </div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Planned Episodes
          </span>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: '#10b981' }}>
            {totalEpisodesPlanned}
          </div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Canon Characters
          </span>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: '#ec4899' }}>
            {totalCharacters}
          </div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            AI Continuity Engine
          </span>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 10, color: '#38bdf8' }}>
            Active & Enforced
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="card"
        style={{
          padding: 14,
          marginBottom: 24,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Channel:</span>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="input"
            style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
          >
            <option value="">All Channels</option>
            {channels.map((ch) => (
              <option key={ch._id} value={ch._id}>
                {ch.name} ({ch.genre})
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
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Series List Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <Loader2
            size={32}
            className="animate-spin"
            style={{ margin: '0 auto 12px', color: 'var(--primary)' }}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading series...</p>
        </div>
      ) : seriesList.length === 0 ? (
        <div className="empty-state card" style={{ padding: 64, textAlign: 'center' }}>
          <BookOpen size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Series Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 440, margin: '0 auto 20px' }}>
            Create your first multi-part serialized story arc with continuous characters and world lore.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Sparkles size={16} />
            <span>Generate First Series</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 20,
          }}
        >
          {seriesList.map((series) => {
            const progress = Math.min(
              100,
              Math.round(((series.currentEpisode - 1) / (series.plannedEpisodes || 1)) * 100)
            );

            return (
              <Link
                key={series._id}
                href={`/dashboard/series/${series._id}`}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 20,
                  textDecoration: 'none',
                  color: 'inherit',
                  position: 'relative',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                }}
              >
                {/* Header tags */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <span
                    className="badge"
                    style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      color: '#a5b4fc',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {series.channelId?.name || 'Channel'} • {series.genre}
                  </span>

                  <span
                    className={`badge badge-${
                      series.status === 'active'
                        ? 'success'
                        : series.status === 'completed'
                        ? 'neutral'
                        : 'warning'
                    }`}
                  >
                    {series.status}
                  </span>
                </div>

                {/* Title & Concept */}
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 8,
                    lineHeight: 1.3,
                  }}
                >
                  {series.title}
                </h3>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    lineHeight: 1.5,
                    marginBottom: 16,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flex: 1,
                  }}
                >
                  {series.concept || series.premise}
                </p>

                {/* Progress bar */}
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginBottom: 6,
                    }}
                  >
                    <span>Episode Progress</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      EP {series.currentEpisode} of {series.plannedEpisodes}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: 'rgba(255, 255, 255, 0.1)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>

                {/* Badges footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={14} style={{ color: '#818cf8' }} />
                      {series.characters?.length || 0} characters
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={14} style={{ color: '#34d399' }} />
                      {series.locations?.length || 0} locations
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={(e) => handleDeleteSeries(series._id, e)}
                      title="Delete Series"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* AI Generate Series Modal */}
      {showCreateModal && (
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
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>AI Generate Series & Bible</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
              The AI Brain will synthesize Channel DNA into an episodic series arc complete with
              characters, visual keys, world rules, and episode outlines.
            </p>

            <form onSubmit={handleAiGenerateSeries}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Target Channel
                </label>
                <select
                  value={formChannelId}
                  onChange={(e) => setFormChannelId(e.target.value)}
                  className="input"
                  required
                >
                  {channels.map((ch) => (
                    <option key={ch._id} value={ch._id}>
                      {ch.name} — {ch.genre}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Series Title (optional)
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. The Midnight Elevator"
                  className="input"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Premise or Story Prompt (optional)
                </label>
                <textarea
                  value={formConcept}
                  onChange={(e) => setFormConcept(e.target.value)}
                  placeholder="Describe the overarching mystery or let AI generate from Channel DNA..."
                  className="input"
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Planned Episodes Arc
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[3, 5, 7, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormEpisodes(num)}
                      className="btn"
                      style={{
                        flex: 1,
                        background: formEpisodes === num ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                        borderColor: formEpisodes === num ? '#818cf8' : 'rgba(255, 255, 255, 0.1)',
                        color: formEpisodes === num ? '#fff' : 'var(--text-secondary)',
                      }}
                    >
                      {num} Episodes
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isAiGenerating}
                  className="btn"
                  style={{ background: 'transparent' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAiGenerating}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {isAiGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Forging Series Arc...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Generate Canon & Bible</span>
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
