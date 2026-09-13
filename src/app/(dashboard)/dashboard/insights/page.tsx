'use client';

import { useEffect, useState } from 'react';
import {
  Brain,
  Sparkles,
  Loader2,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface Channel {
  _id: string;
  name: string;
}

interface InsightItem {
  _id: string;
  category: 'hook' | 'duration' | 'format' | 'pacing' | 'character' | 'visual' | 'audience';
  observation: string;
  evidence: string;
  confidence: 'high' | 'medium' | 'low';
  recommendation: string;
  sampleSize?: number;
  channelId?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export default function InsightsPage() {
  const { success, error: toastError } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetch('/api/channels')
      .then((r) => r.json())
      .then((d) => setChannels(d.channels || []))
      .catch(() => {});
  }, []);

  async function loadInsights() {
    setLoading(true);
    try {
      const url = selectedChannel ? `/api/insights?channelId=${selectedChannel}` : '/api/insights';
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setInsights(d.insights || []);
      }
    } catch {
      toastError('Failed to load insights');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInsights();
  }, [selectedChannel]);

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: selectedChannel || undefined }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to generate insights');
      }

      const d = await res.json();
      success(`Synthesized ${d.insights?.length || 0} actionable content insights!`);
      loadInsights();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
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
            Insight Engine
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Continuous learning loop analyzing hook velocity, viewer retention, and pacing patterns
          </p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {analyzing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Mining Content Patterns...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Analyze Performance & Learn</span>
            </>
          )}
        </button>
      </div>

      {/* Info Callout */}
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          border: '1px solid rgba(16, 185, 129, 0.2)',
          background: 'rgba(16, 185, 129, 0.04)',
        }}
      >
        <TrendingUp size={20} style={{ color: '#10b981', flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <strong style={{ color: '#10b981' }}>Active Strategy Loop:</strong> Every insight generated
          here is automatically provided as strategic context when the AI writes your daily content package
          and new scripts.
        </div>
      </div>

      {/* Channel Filter */}
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

      {/* Insights Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Synthesizing content insights...</p>
        </div>
      ) : insights.length === 0 ? (
        <div className="empty-state card" style={{ padding: 64, textAlign: 'center' }}>
          <Brain size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Insights Yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 440, margin: '0 auto 20px' }}>
            Run the AI Insight Engine to analyze your content history, identify winning hook archetypes, and find optimal video duration.
          </p>
          <button onClick={handleAnalyze} disabled={analyzing} className="btn btn-primary">
            Run AI Analysis Now
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 20,
          }}
        >
          {insights.map((ins) => (
            <div
              key={ins._id}
              className="card"
              style={{
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Header tags */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  className="badge"
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    textTransform: 'uppercase',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {ins.category} pattern
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    className={`badge badge-${
                      ins.confidence === 'high'
                        ? 'success'
                        : ins.confidence === 'medium'
                        ? 'primary'
                        : 'neutral'
                    }`}
                    style={{ fontSize: 11 }}
                  >
                    {ins.confidence} confidence
                  </span>
                  {ins.sampleSize ? (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      n={ins.sampleSize}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Observation */}
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, marginBottom: 6 }}>
                  {ins.observation}
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Evidence:</strong> {ins.evidence}
                </p>
              </div>

              {/* Recommendation block */}
              <div
                style={{
                  marginTop: 'auto',
                  padding: 12,
                  background: 'rgba(99, 102, 241, 0.06)',
                  borderRadius: 8,
                  borderLeft: '3px solid #6366f1',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    color: '#818cf8',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  <Lightbulb size={13} />
                  <span>Actionable Recommendation</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {ins.recommendation}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
