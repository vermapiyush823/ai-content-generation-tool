'use client';

import { useEffect, useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  Loader2,
  Check,
  X,
  Trash2,
  Star,
  Eye,
  Zap,
  Filter,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface Channel {
  _id: string;
  name: string;
  genre: string;
}

interface Idea {
  _id: string;
  title: string;
  concept: string;
  hook: string;
  genre: string;
  format: string;
  seriesPotential: boolean;
  visualPotential: number;
  noveltyScore: number;
  retentionPotential: number;
  productionDifficulty: number;
  overallScore: number;
  reasoning: string;
  status: string;
  channelId: string;
}

function ScoreRing({ score }: { score: number }) {
  const cls = score >= 7 ? 'score-high' : score >= 4 ? 'score-medium' : 'score-low';
  return <div className={`score-ring ${cls}`}>{score}</div>;
}

export default function IdeasPage() {
  const { success, error: toastError } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genCount, setGenCount] = useState(5);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/channels')
      .then((r) => r.json())
      .then((d) => setChannels(d.channels || []))
      .catch(() => {});
  }, []);

  async function loadIdeas() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedChannel) params.set('channelId', selectedChannel);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/ideas?${params}`);
      if (res.ok) {
        const data = await res.json();
        setIdeas(data.ideas);
      }
    } catch {
      toastError('Failed to load ideas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIdeas();
  }, [selectedChannel, statusFilter]);

  async function generateIdeas() {
    if (!selectedChannel) {
      toastError('Select a channel first');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: selectedChannel, count: genCount }),
      });
      if (res.ok) {
        const data = await res.json();
        success(`Generated ${data.generated} ideas!`);
        loadIdeas();
      } else {
        const data = await res.json();
        toastError(data.error || 'Generation failed');
      }
    } catch {
      toastError('Network error');
    } finally {
      setGenerating(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/ideas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        success(`Idea ${status}`);
        setIdeas((prev) => prev.map((i) => (i._id === id ? { ...i, status } : i)));
      }
    } catch {
      toastError('Failed to update');
    }
  }

  async function deleteIdea(id: string) {
    try {
      await fetch(`/api/ideas/${id}`, { method: 'DELETE' });
      setIdeas((prev) => prev.filter((i) => i._id !== id));
    } catch {
      toastError('Failed to delete');
    }
  }

  const channelName = (id: string) => channels.find((c) => c._id === id)?.name || '';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Content Ideas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Generate and manage AI-powered content ideas
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="input"
            style={{ width: 180 }}
            value={genCount}
            onChange={(e) => setGenCount(Number(e.target.value))}
          >
            <option value={3}>3 ideas</option>
            <option value={5}>5 ideas</option>
            <option value={10}>10 ideas</option>
          </select>
          <button
            className="btn btn-primary"
            onClick={generateIdeas}
            disabled={generating || !selectedChannel}
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="card"
        style={{ padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <Filter size={16} style={{ color: 'var(--text-muted)' }} />
        <select
          className="input"
          style={{ width: 200 }}
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
        >
          <option value="">All Channels</option>
          {channels.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="input"
          style={{ width: 140 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="used">Used</option>
        </select>
      </div>

      {/* Ideas list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent-violet)' }} />
        </div>
      ) : ideas.length === 0 ? (
        <div className="empty-state card" style={{ padding: 48 }}>
          <Lightbulb size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No ideas yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            {selectedChannel
              ? 'Click "Generate" to create AI-powered content ideas for this channel'
              : 'Select a channel and generate ideas to get started'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ideas.map((idea) => (
            <div
              key={idea._id}
              className="card"
              style={{
                padding: 16,
                cursor: 'pointer',
                borderLeft: `3px solid ${
                  idea.status === 'approved'
                    ? 'var(--accent-emerald)'
                    : idea.status === 'rejected'
                    ? 'var(--accent-rose)'
                    : 'var(--border-secondary)'
                }`,
              }}
              onClick={() => setExpandedId(expandedId === idea._id ? null : idea._id)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <ScoreRing score={idea.overallScore} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{idea.title}</h3>
                    <span className={`badge badge-${idea.status === 'approved' ? 'emerald' : idea.status === 'rejected' ? 'rose' : idea.status === 'used' ? 'blue' : 'violet'}`}>
                      {idea.status}
                    </span>
                    {idea.seriesPotential && <span className="badge badge-cyan">Series</span>}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
                    {idea.concept}
                  </p>
                  {channelName(idea.channelId) && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'inline-block' }}>
                      {channelName(idea.channelId)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  {idea.status === 'draft' && (
                    <>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => updateStatus(idea._id, 'approved')} title="Approve">
                        <Check size={14} style={{ color: 'var(--accent-emerald)' }} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => updateStatus(idea._id, 'rejected')} title="Reject">
                        <X size={14} style={{ color: 'var(--accent-rose)' }} />
                      </button>
                    </>
                  )}
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteIdea(idea._id)} title="Delete">
                    <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === idea._id && (
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: '1px solid var(--border-secondary)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Hook
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      &ldquo;{idea.hook}&rdquo;
                    </p>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Reasoning
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{idea.reasoning}</p>
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <ScoreItem icon={Eye} label="Visual" score={idea.visualPotential} />
                    <ScoreItem icon={Star} label="Novelty" score={idea.noveltyScore} />
                    <ScoreItem icon={Zap} label="Retention" score={idea.retentionPotential} />
                    <ScoreItem icon={Lightbulb} label="Difficulty" score={idea.productionDifficulty} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreItem({ icon: Icon, label, score }: { icon: typeof Star; label: string; score: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon size={13} style={{ color: 'var(--text-muted)' }} />
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{label}:</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: score >= 7 ? 'var(--accent-emerald)' : score >= 4 ? 'var(--accent-amber)' : 'var(--accent-rose)',
        }}
      >
        {score}/10
      </span>
    </div>
  );
}
