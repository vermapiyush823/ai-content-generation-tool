'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  Users,
  MapPin,
  FileText,
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Play,
  Film,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface Character {
  _id?: string;
  name: string;
  age?: string;
  appearance: string;
  clothing?: string;
  personality?: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'narrator';
  relationships?: string[];
  visualIdentity: string;
}

interface Location {
  _id?: string;
  name: string;
  description: string;
  visualIdentity: string;
  importantDetails?: string[];
}

interface EpisodeOutline {
  episodeNumber: number;
  title: string;
  summary: string;
  keyEvents: string[];
  cliffhanger: string;
}

interface SeriesDetail {
  _id: string;
  title: string;
  concept: string;
  genre: string;
  premise: string;
  theme: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  plannedEpisodes: number;
  currentEpisode: number;
  seriesBible: {
    worldRules: string[];
    timeline: string;
    storyArc: string;
    episodeOutlines: EpisodeOutline[];
    storyState: {
      whatHasHappened: string[];
      currentMystery: string;
      knownInformation: string[];
      unknownInformation: string[];
      openThreads: string[];
      resolvedThreads: string[];
      futureClues: string[];
    };
  };
  characters: Character[];
  locations: Location[];
  channelId: {
    _id: string;
    name: string;
    genre: string;
    slug: string;
  };
}

interface EpisodeItem {
  _id: string;
  episodeNumber: number;
  title: string;
  hook: string;
  duration: number;
  status: string;
  sceneCount: number;
  createdAt: string;
}

export default function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const seriesId = resolvedParams.id;
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [activeTab, setActiveTab] = useState<'bible' | 'characters' | 'locations' | 'episodes' | 'continuity'>('bible');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingEpisode, setGeneratingEpisode] = useState(false);

  // Continuity checker states
  const [testContent, setTestContent] = useState('');
  const [checkingContinuity, setCheckingContinuity] = useState(false);
  const [continuityResult, setContinuityResult] = useState<any | null>(null);

  // New item forms
  const [newRule, setNewRule] = useState('');
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    role: 'protagonist' as const,
    visualIdentity: '',
    appearance: '',
    clothing: '',
    personality: '',
  });
  const [showAddChar, setShowAddChar] = useState(false);

  async function loadSeriesData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/series/${seriesId}`);
      if (!res.ok) throw new Error('Failed to load series');
      const data = await res.json();
      setSeries(data.series);
      setEpisodes(data.episodes || []);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Error loading series');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSeriesData();
  }, [seriesId]);

  async function handleSaveBible() {
    if (!series) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/series/${seriesId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: series.title,
          concept: series.concept,
          premise: series.premise,
          theme: series.theme,
          status: series.status,
          seriesBible: series.seriesBible,
          characters: series.characters,
          locations: series.locations,
        }),
      });

      if (!res.ok) throw new Error('Failed to update series');
      const data = await res.json();
      setSeries(data.series);
      success('Series Bible saved successfully');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddRule() {
    if (!newRule.trim() || !series) return;
    const updatedRules = [...(series.seriesBible.worldRules || []), newRule.trim()];
    setSeries({
      ...series,
      seriesBible: {
        ...series.seriesBible,
        worldRules: updatedRules,
      },
    });
    setNewRule('');
  }

  function handleRemoveRule(index: number) {
    if (!series) return;
    const updated = series.seriesBible.worldRules.filter((_, i) => i !== index);
    setSeries({
      ...series,
      seriesBible: {
        ...series.seriesBible,
        worldRules: updated,
      },
    });
  }

  async function handleAddCharacter(e: React.FormEvent) {
    e.preventDefault();
    if (!series || !newCharacter.name || !newCharacter.appearance) return;

    const updatedChars = [...(series.characters || []), { ...newCharacter }];
    setSeries({
      ...series,
      characters: updatedChars,
    });
    setNewCharacter({
      name: '',
      role: 'protagonist',
      visualIdentity: '',
      appearance: '',
      clothing: '',
      personality: '',
    });
    setShowAddChar(false);
  }

  function handleRemoveCharacter(index: number) {
    if (!series) return;
    const updated = series.characters.filter((_, i) => i !== index);
    setSeries({
      ...series,
      characters: updated,
    });
  }

  async function handleGenerateNextEpisode() {
    if (!series) return;
    setGeneratingEpisode(true);
    try {
      const nextEpNum = (episodes.length || 0) + 1;
      const res = await fetch('/api/episodes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: series.channelId._id,
          seriesId: series._id,
          episodeNumber: nextEpNum,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to generate episode');
      }

      const d = await res.json();
      success(`Episode ${nextEpNum}: "${d.episode.title}" generated!`);
      loadSeriesData();
      router.push(`/dashboard/content/${d.episode._id}`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Episode generation failed');
    } finally {
      setGeneratingEpisode(false);
    }
  }

  async function handleRunContinuityCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!testContent.trim()) return;

    setCheckingContinuity(true);
    setContinuityResult(null);
    try {
      const res = await fetch(`/api/series/${seriesId}/continuity-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newContent: testContent }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Continuity check failed');
      }

      const data = await res.json();
      setContinuityResult(data);
      success('Continuity analysis completed');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Continuity check failed');
    } finally {
      setCheckingContinuity(false);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading Series Bible & Canon...</p>
      </div>
    );
  }

  if (!series) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Series not found</h2>
        <Link href="/dashboard/series" className="btn btn-primary">
          Return to Series
        </Link>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 64 }}>
      {/* Back button & Action Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Link
          href="/dashboard/series"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: 13,
          }}
        >
          <ArrowLeft size={16} /> Back to Series
        </Link>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleGenerateNextEpisode}
            disabled={generatingEpisode}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {generatingEpisode ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Writing Episode Script...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate Next Episode</span>
              </>
            )}
          </button>

          <button
            onClick={handleSaveBible}
            disabled={saving}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Save Bible</span>
          </button>
        </div>
      </div>

      {/* Series Hero Banner */}
      <div
        className="card"
        style={{
          padding: 24,
          marginBottom: 24,
          border: '1px solid rgba(99, 102, 241, 0.2)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span
            className="badge"
            style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#c7d2fe', fontWeight: 600 }}
          >
            {series.channelId?.name} • {series.genre}
          </span>
          <span className="badge badge-success">{series.status}</span>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>{series.title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, maxWidth: 840 }}>
          {series.concept}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: 24,
          overflowX: 'auto',
        }}
      >
        {[
          { key: 'bible', label: 'Series Bible & Lore', icon: BookOpen },
          { key: 'characters', label: `Characters (${series.characters?.length || 0})`, icon: Users },
          { key: 'locations', label: `Locations (${series.locations?.length || 0})`, icon: MapPin },
          { key: 'episodes', label: `Episodes (${episodes.length})`, icon: Film },
          { key: 'continuity', label: 'Continuity Engine', icon: ShieldCheck },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} style={{ color: isActive ? '#818cf8' : 'var(--text-muted)' }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BIBLE & LORE */}
      {activeTab === 'bible' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Premise & Theme */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Premise & Core Theme</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: 16,
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Story Premise
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={series.premise}
                  onChange={(e) => setSeries({ ...series, premise: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Core Theme
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={series.theme}
                  onChange={(e) => setSeries({ ...series, theme: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Story Arc & Mystery */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Overarching Arc & Mystery</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Full Series Story Arc
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={series.seriesBible.storyArc || ''}
                  onChange={(e) =>
                    setSeries({
                      ...series,
                      seriesBible: { ...series.seriesBible, storyArc: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Active Unsolved Mystery
                </label>
                <input
                  type="text"
                  className="input"
                  value={series.seriesBible.storyState?.currentMystery || ''}
                  onChange={(e) =>
                    setSeries({
                      ...series,
                      seriesBible: {
                        ...series.seriesBible,
                        storyState: {
                          ...series.seriesBible.storyState,
                          currentMystery: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* World Rules */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Canon World Rules</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
              Hard rules that the AI must follow when generating scripts (e.g. &ldquo;The entity cannot appear in daylight&rdquo;).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {series.seriesBible.worldRules?.map((rule, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                >
                  <span>• {rule}</span>
                  <button
                    onClick={() => handleRemoveRule(idx)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                className="input"
                placeholder="Add a new world rule (e.g. The entity cannot speak words, only mimic voices)..."
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
              />
              <button onClick={handleAddRule} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                <Plus size={14} /> Add Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHARACTERS */}
      {activeTab === 'characters' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Canon Character Profiles</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Visual identities are automatically injected into scene prompts for continuity
              </p>
            </div>
            <button
              onClick={() => setShowAddChar(true)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={14} /> Add Character
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            {series.characters?.map((c, idx) => (
              <div key={idx} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 700 }}>{c.name}</h4>
                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontSize: 11 }}>
                      {c.role} {c.age ? `• ${c.age}` : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveCharacter(idx)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <div>
                    <strong style={{ color: '#a855f7' }}>Visual Identity:</strong>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{c.visualIdentity}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-muted)' }}>Appearance:</strong>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{c.appearance}</span>
                  </div>
                  {c.clothing && (
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>Signature Look:</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>{c.clothing}</span>
                    </div>
                  )}
                  {c.personality && (
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>Personality:</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>{c.personality}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Character Modal */}
          {showAddChar && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                padding: 16,
              }}
            >
              <div className="card" style={{ width: '100%', maxWidth: 480, padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Add Canon Character</h3>
                <form onSubmit={handleAddCharacter}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Name</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={newCharacter.name}
                      onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Role</label>
                    <select
                      className="input"
                      value={newCharacter.role}
                      onChange={(e) => setNewCharacter({ ...newCharacter, role: e.target.value as any })}
                    >
                      <option value="protagonist">Protagonist</option>
                      <option value="antagonist">Antagonist</option>
                      <option value="supporting">Supporting</option>
                      <option value="narrator">Narrator</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Visual Identity (Key prompt marker)</label>
                    <input
                      type="text"
                      className="input"
                      required
                      placeholder="e.g. 28yo South Asian detective with trench coat and silver watch"
                      value={newCharacter.visualIdentity}
                      onChange={(e) => setNewCharacter({ ...newCharacter, visualIdentity: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Detailed Appearance</label>
                    <textarea
                      className="input"
                      rows={2}
                      required
                      value={newCharacter.appearance}
                      onChange={(e) => setNewCharacter({ ...newCharacter, appearance: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button type="button" onClick={() => setShowAddChar(false)} className="btn">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Add Character
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LOCATIONS */}
      {activeTab === 'locations' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {series.locations?.map((loc, idx) => (
            <div key={idx} className="card" style={{ padding: 18 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{loc.name}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 10 }}>
                {loc.description}
              </p>
              <div style={{ fontSize: 12 }}>
                <strong style={{ color: '#38bdf8' }}>Visual Identity:</strong>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>{loc.visualIdentity}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: EPISODES */}
      {activeTab === 'episodes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Generated Episodes</h3>
            <button
              onClick={handleGenerateNextEpisode}
              disabled={generatingEpisode}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {generatingEpisode ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              <span>Generate Next Episode</span>
            </button>
          </div>

          {episodes.length === 0 ? (
            <div className="card" style={{ padding: 36, textAlign: 'center' }}>
              <Film size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                No episodes created for this series yet.
              </p>
              <button onClick={handleGenerateNextEpisode} className="btn btn-primary">
                Generate Episode 1
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {episodes.map((ep) => (
                <Link
                  key={ep._id}
                  href={`/dashboard/content/${ep._id}`}
                  className="card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span
                        className="badge"
                        style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', fontWeight: 600 }}
                      >
                        EP {ep.episodeNumber}
                      </span>
                      <h4 style={{ fontSize: 15, fontWeight: 700 }}>{ep.title}</h4>
                      <span className="badge badge-success" style={{ fontSize: 11 }}>
                        {ep.status}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      Hook: &ldquo;{ep.hook}&rdquo;
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                    <span>{ep.duration}s</span>
                    <span>{ep.sceneCount} scenes</span>
                    <Play size={16} style={{ color: '#818cf8' }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CONTINUITY ENGINE */}
      {activeTab === 'continuity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ShieldCheck size={20} style={{ color: '#10b981' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>AI Continuity Validator</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
              Paste any script, scene, or plot twist below. The AI will verify character consistency,
              timeline accuracy, location rules, and world lore against this series bible.
            </p>

            <form onSubmit={handleRunContinuityCheck}>
              <textarea
                className="input"
                rows={5}
                required
                placeholder="Paste script excerpt, episode outline, or new plot point to validate..."
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                style={{ marginBottom: 12 }}
              />

              <button
                type="submit"
                disabled={checkingContinuity}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {checkingContinuity ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Analyzing Canon & Lore...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Run Continuity Audit</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {continuityResult && (
            <div className="card" style={{ padding: 24, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h4 style={{ fontSize: 18, fontWeight: 700 }}>Continuity Audit Report</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{continuityResult.summary}</p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Score</span>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color:
                        continuityResult.continuityScore >= 80
                          ? '#10b981'
                          : continuityResult.continuityScore >= 50
                          ? '#f59e0b'
                          : '#ef4444',
                    }}
                  >
                    {continuityResult.continuityScore}/100
                  </div>
                </div>
              </div>

              {/* Issues */}
              {continuityResult.issues?.length > 0 ? (
                <div>
                  <h5 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#f59e0b' }}>
                    Identified Issues ({continuityResult.issues.length})
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {continuityResult.issues.map((iss: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: 12,
                          background: 'rgba(245, 158, 11, 0.08)',
                          borderRadius: 6,
                          borderLeft: '3px solid #f59e0b',
                          fontSize: 13,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <strong>{iss.description}</strong>
                          <span className="badge badge-warning">{iss.severity}</span>
                        </div>
                        {iss.reference && (
                          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>
                            Contradicts: {iss.reference}
                          </div>
                        )}
                        {iss.suggestion && (
                          <div style={{ color: '#10b981', fontSize: 12 }}>
                            💡 Suggestion: {iss.suggestion}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: 14 }}>
                  <CheckCircle2 size={18} />
                  <span>100% Canon Compliant — No continuity conflicts detected!</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
