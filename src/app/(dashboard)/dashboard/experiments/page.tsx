'use client';

import { useEffect, useState } from 'react';
import {
  FlaskConical,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface Channel {
  _id: string;
  name: string;
}

interface ExperimentItem {
  _id: string;
  hypothesis: string;
  test: string;
  baseline: string;
  successMetric: string;
  duration: string;
  status: 'active' | 'completed' | 'abandoned';
  outcome?: string;
  channelId?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export default function ExperimentsPage() {
  const { success, error: toastError } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [experiments, setExperiments] = useState<ExperimentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    channelId: '',
    hypothesis: '',
    test: '',
    baseline: '',
    successMetric: '',
    duration: '5 videos',
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

  async function loadExperiments() {
    setLoading(true);
    try {
      const res = await fetch('/api/experiments');
      if (res.ok) {
        const d = await res.json();
        setExperiments(d.experiments || []);
      }
    } catch {
      toastError('Failed to load experiments');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExperiments();
  }, []);

  async function handleCreateExperiment(e: React.FormEvent) {
    e.preventDefault();
    if (!form.hypothesis || !form.test) {
      toastError('Hypothesis and test are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to create experiment');
      }

      success('Experiment launched!');
      setShowModal(false);
      setForm((prev) => ({
        ...prev,
        hypothesis: '',
        test: '',
        baseline: '',
        successMetric: '',
      }));
      loadExperiments();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to launch');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStatus(id: string, status: ExperimentItem['status'], outcome?: string) {
    try {
      const res = await fetch('/api/experiments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, outcome }),
      });

      if (res.ok) {
        success(`Experiment marked as ${status}`);
        loadExperiments();
      } else {
        toastError('Failed to update');
      }
    } catch {
      toastError('Failed to update');
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
            Experiment Engine
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Formulate hypotheses, test novel hook variations, and track retention shifts
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={16} />
          <span>Launch New Experiment</span>
        </button>
      </div>

      {/* Experiment Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading experiments...</p>
        </div>
      ) : experiments.length === 0 ? (
        <div className="empty-state card" style={{ padding: 64, textAlign: 'center' }}>
          <FlaskConical size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Experiments Running</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 440, margin: '0 auto 20px' }}>
            A/B test different narration styles, visual aesthetics, or hook speeds against your baseline metrics.
          </p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            Create First Experiment
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
          {experiments.map((exp) => (
            <div
              key={exp._id}
              className="card"
              style={{
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  className="badge"
                  style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontSize: 11 }}
                >
                  {exp.channelId?.name || 'All Channels'}
                </span>

                <span
                  className={`badge badge-${
                    exp.status === 'active'
                      ? 'warning'
                      : exp.status === 'completed'
                      ? 'success'
                      : 'neutral'
                  }`}
                >
                  {exp.status}
                </span>
              </div>

              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Hypothesis
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{exp.hypothesis}</h4>
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Test:</strong> {exp.test}
              </div>

              {exp.baseline && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Baseline: {exp.baseline} • Metric: {exp.successMetric || 'Retention rate'}
                </div>
              )}

              {exp.outcome && (
                <div
                  style={{
                    padding: 10,
                    background: 'rgba(16, 185, 129, 0.08)',
                    borderRadius: 6,
                    borderLeft: '3px solid #10b981',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                  }}
                >
                  <strong>Outcome:</strong> {exp.outcome}
                </div>
              )}

              {/* Status toggles */}
              {exp.status === 'active' && (
                <div
                  style={{
                    marginTop: 'auto',
                    display: 'flex',
                    gap: 8,
                    paddingTop: 10,
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <button
                    onClick={() => {
                      const outcome = prompt('What was the outcome of this experiment?') || 'Successful';
                      handleUpdateStatus(exp._id, 'completed', outcome);
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <CheckCircle2 size={13} style={{ color: '#10b981' }} /> Complete
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(exp._id, 'abandoned', 'Abandoned')}
                    className="btn"
                    style={{ fontSize: 12, background: 'transparent' }}
                  >
                    Abandon
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Launch Experiment Modal */}
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
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Launch New Experiment</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
              Define a testable hypothesis to optimize retention and completion rates.
            </p>

            <form onSubmit={handleCreateExperiment}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Channel</label>
                <select
                  className="input"
                  value={form.channelId}
                  onChange={(e) => setForm({ ...form, channelId: e.target.value })}
                >
                  {channels.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Hypothesis</label>
                <input
                  type="text"
                  className="input"
                  required
                  placeholder="e.g. First-person narration will increase completion rate by 15%"
                  value={form.hypothesis}
                  onChange={(e) => setForm({ ...form, hypothesis: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Test Description</label>
                <textarea
                  className="input"
                  rows={2}
                  required
                  placeholder="e.g. Generate next 5 videos exclusively in first-person male voice"
                  value={form.test}
                  onChange={(e) => setForm({ ...form, test: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Current Baseline</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 64% completion"
                    value={form.baseline}
                    onChange={(e) => setForm({ ...form, baseline: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Duration</label>
                  <input
                    type="text"
                    className="input"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Launching...' : 'Start Experiment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
