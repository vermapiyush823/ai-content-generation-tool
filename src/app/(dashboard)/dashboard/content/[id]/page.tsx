'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  Edit3,
  RefreshCw,
  Film,
  Save,
  Loader2,
  Play,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Tv2,
  FileText,
  Share2,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface SceneItem {
  _id: string;
  sceneNumber: number;
  duration: number;
  narration: string;
  dialogue?: string;
  visualDescription: string;
  camera: string;
  lighting: string;
  environment: string;
  characterActions: string;
  soundDesign: string;
  transition: string;
  prompts: {
    generic: string;
    gemini: string;
    grok: string;
  };
  characterReferences?: string[];
}

interface EpisodeDetail {
  _id: string;
  episodeNumber: number;
  title: string;
  hook: string;
  objective: string;
  script: string;
  scriptStructure?: {
    hook: string;
    setup: string;
    escalation: string;
    payoff: string;
    cliffhangerOrCta: string;
  };
  duration: number;
  ending: string;
  cliffhanger: string;
  status: 'draft' | 'script_ready' | 'prompts_ready' | 'approved' | 'generated' | 'published';
  qualityScore?: number;
  continuityScore?: number;
  warnings?: string[];
  caption?: string;
  hashtags?: string[];
  cta?: string;
  sceneCount: number;
  seriesId?: {
    _id: string;
    title: string;
    characters: any[];
    locations: any[];
  };
  channelId: {
    _id: string;
    name: string;
    genre: string;
    visualStyle: string;
    narrationStyle: string;
    language: string;
  };
}

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const episodeId = resolvedParams.id;
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [episode, setEpisode] = useState<EpisodeDetail | null>(null);
  const [scenes, setScenes] = useState<SceneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingScenes, setGeneratingScenes] = useState(false);

  // Selected prompt model preview: 'all' | 'gemini' | 'grok' | 'generic'
  const [selectedModel, setSelectedModel] = useState<'all' | 'gemini' | 'grok' | 'generic'>('gemini');

  // Copy tracking
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Edit scene modal / state
  const [editingScene, setEditingScene] = useState<SceneItem | null>(null);
  const [regenInstruction, setRegenInstruction] = useState('');
  const [isRegeneratingScene, setIsRegeneratingScene] = useState<string | null>(null);

  // Editable script
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editableScript, setEditableScript] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/episodes/${episodeId}`);
      if (!res.ok) throw new Error('Failed to load content');
      const data = await res.json();
      setEpisode(data.episode);
      setScenes(data.scenes || []);
      setEditableScript(data.episode.script);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Error loading content');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [episodeId]);

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function handleCopyAllPrompts() {
    if (scenes.length === 0) return;
    const model = selectedModel === 'all' ? 'gemini' : selectedModel;
    const compiled = scenes
      .map(
        (sc) =>
          `--- SCENE ${sc.sceneNumber} (${sc.duration}s) [${model.toUpperCase()}] ---\n${
            (sc.prompts as any)[model] || sc.prompts.generic
          }\n`
      )
      .join('\n');

    handleCopy(compiled, 'all_prompts');
  }

  async function handleGenerateScenes() {
    if (!episode) return;
    setGeneratingScenes(true);
    try {
      const res = await fetch('/api/scenes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: episode._id }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to generate scenes');
      }

      const d = await res.json();
      setScenes(d.scenes || []);
      setEpisode((prev) => (prev ? { ...prev, status: 'prompts_ready', sceneCount: d.count } : null));
      success(`Generated ${d.count} cinematic scenes with multi-model video prompts!`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Scene generation failed');
    } finally {
      setGeneratingScenes(false);
    }
  }

  async function handleRegenerateScenePrompt(sceneId: string, instruction?: string) {
    setIsRegeneratingScene(sceneId);
    try {
      const res = await fetch(`/api/scenes/${sceneId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: instruction || undefined,
          targetModel: selectedModel === 'all' ? 'generic' : selectedModel,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to regenerate prompt');
      }

      const d = await res.json();
      setScenes((prev) => prev.map((s) => (s._id === sceneId ? d.scene : s)));
      success('Scene prompt re-engineered!');
      setEditingScene(null);
      setRegenInstruction('');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Regeneration failed');
    } finally {
      setIsRegeneratingScene(null);
    }
  }

  async function handleSaveScene(scene: SceneItem) {
    try {
      const res = await fetch(`/api/scenes/${scene._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scene),
      });

      if (!res.ok) throw new Error('Failed to update scene');
      const d = await res.json();
      setScenes((prev) => prev.map((s) => (s._id === scene._id ? d.scene : s)));
      setEditingScene(null);
      success('Scene updated successfully');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function handleUpdateEpisodeStatus(newStatus: EpisodeDetail['status']) {
    if (!episode) return;
    try {
      const res = await fetch(`/api/episodes/${episodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Status update failed');
      setEpisode({ ...episode, status: newStatus });
      success(`Content marked as ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function handleSaveScript() {
    if (!episode) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/episodes/${episodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: editableScript }),
      });

      if (!res.ok) throw new Error('Script save failed');
      setEpisode({ ...episode, script: editableScript });
      setIsEditingScript(false);
      success('Script saved!');
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
        <p style={{ color: 'var(--text-muted)' }}>Loading video script and prompts...</p>
      </div>
    );
  }

  if (!episode) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Content item not found</h2>
        <Link href="/dashboard/content" className="btn btn-primary">
          Return to Content
        </Link>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Top action header */}
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
          href="/dashboard/content"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: 13,
          }}
        >
          <ArrowLeft size={16} /> Back to Content
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Status selector */}
          <select
            className="input"
            value={episode.status}
            onChange={(e) => handleUpdateEpisodeStatus(e.target.value as any)}
            style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
          >
            <option value="draft">Draft</option>
            <option value="script_ready">Script Ready</option>
            <option value="prompts_ready">Prompts Ready</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
          </select>

          {scenes.length > 0 && (
            <button
              onClick={handleCopyAllPrompts}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              {copiedKey === 'all_prompts' ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              <span>Copy All Prompts</span>
            </button>
          )}

          <button
            onClick={handleGenerateScenes}
            disabled={generatingScenes}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            {generatingScenes ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Breaking Scenes...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>{scenes.length > 0 ? 'Regenerate All Scenes' : 'Break Into Scenes'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero card */}
      <div
        className="card"
        style={{
          padding: 24,
          marginBottom: 24,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span
            className="badge"
            style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#c7d2fe', fontWeight: 600 }}
          >
            {episode.channelId?.name} • {episode.channelId?.genre}
          </span>

          {episode.seriesId && (
            <Link
              href={`/dashboard/series/${episode.seriesId._id}`}
              className="badge"
              style={{
                background: 'rgba(168, 85, 247, 0.2)',
                color: '#e9d5ff',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Series: {episode.seriesId.title} (EP {episode.episodeNumber})
            </Link>
          )}

          <span className="badge badge-success">{episode.status.replace('_', ' ')}</span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>{episode.title}</h1>

        {/* Hook spotlight */}
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(236, 72, 153, 0.1)',
            borderRadius: 8,
            borderLeft: '4px solid #ec4899',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#f472b6', fontWeight: 700, marginBottom: 4 }}>
            Opening Hook (First 1–2 Seconds)
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            &ldquo;{episode.hook}&rdquo;
          </div>
        </div>

        {/* Quick meta badges */}
        <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={15} style={{ color: '#818cf8' }} />
            {episode.duration} seconds target duration
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Film size={15} style={{ color: '#34d399' }} />
            {scenes.length} production scenes ready
          </span>
          {episode.qualityScore && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={15} style={{ color: '#f59e0b' }} />
              Retention Score: {episode.qualityScore}%
            </span>
          )}
        </div>
      </div>

      {/* Grid: Left Column (Script & Strategy) vs Right Column (Scenes & Prompts) */}
      <div className="grid-responsive-content-detail">
        {/* LEFT COLUMN: Script & Post Package */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Script Card */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Retention Script</h3>
              <button
                onClick={() => {
                  if (isEditingScript) handleSaveScript();
                  else setIsEditingScript(true);
                }}
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '4px 10px' }}
              >
                {saving ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : isEditingScript ? (
                  <Save size={12} />
                ) : (
                  <Edit3 size={12} />
                )}
                <span>{isEditingScript ? 'Save Script' : 'Edit Script'}</span>
              </button>
            </div>

            {isEditingScript ? (
              <textarea
                className="input"
                rows={16}
                value={editableScript}
                onChange={(e) => setEditableScript(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}
              />
            ) : (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: 14,
                  borderRadius: 8,
                  fontSize: 13,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-primary)',
                  maxHeight: 480,
                  overflowY: 'auto',
                }}
              >
                {episode.script}
              </div>
            )}
          </div>

          {/* Social Caption & CTA */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Publishing Package</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                Recommended Caption
              </label>
              <div
                style={{
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 6,
                  fontSize: 13,
                  position: 'relative',
                }}
              >
                {episode.caption || `${episode.title} 🎬`}
                <button
                  onClick={() => handleCopy(episode.caption || episode.title, 'caption')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {copiedKey === 'caption' ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {episode.cta && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Call to Action (CTA)
                </label>
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(99, 102, 241, 0.08)',
                    borderRadius: 6,
                    fontSize: 13,
                    color: '#a5b4fc',
                  }}
                >
                  {episode.cta}
                </div>
              </div>
            )}

            {episode.hashtags && episode.hashtags.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Optimized Hashtags
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {episode.hashtags.map((tag, idx) => (
                    <span key={idx} className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', fontSize: 12 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Scenes & Multi-Model Video Prompts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Controls bar */}
          <div
            className="card"
            style={{
              padding: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Video Model:</span>
              {(['gemini', 'grok', 'generic', 'all'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedModel(m)}
                  className="btn"
                  style={{
                    fontSize: 12,
                    padding: '4px 10px',
                    textTransform: 'capitalize',
                    background: selectedModel === m ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                    color: selectedModel === m ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {scenes.length} Scenes Broken Down
            </div>
          </div>

          {/* Empty scenes state */}
          {scenes.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <Film size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 14px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Scenes Generated Yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 420, margin: '0 auto 20px' }}>
                Break this script into scene-by-scene cinematography instructions and generate multi-model
                AI video prompts optimized for Gemini (Veo) and Grok.
              </p>
              <button
                onClick={handleGenerateScenes}
                disabled={generatingScenes}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                {generatingScenes ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Extracting Scenes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Scene Prompts</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Scene Cards */
            scenes.map((scene) => (
              <div
                key={scene._id}
                className="card"
                style={{
                  padding: 20,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                {/* Scene Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      className="badge"
                      style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 700 }}
                    >
                      SCENE {scene.sceneNumber.toString().padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Duration: ~{scene.duration}s
                    </span>
                    {scene.camera && (
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', fontSize: 11 }}>
                        {scene.camera}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => setEditingScene(scene)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: 12 }}
                      title="Edit Scene"
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleRegenerateScenePrompt(scene._id)}
                      disabled={isRegeneratingScene === scene._id}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: 12 }}
                      title="Regenerate Prompt"
                    >
                      {isRegeneratingScene === scene._id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <RefreshCw size={13} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Narration & Visual Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  {scene.narration && (
                    <div>
                      <strong style={{ color: '#818cf8' }}>Narration:</strong>{' '}
                      <span style={{ color: 'var(--text-primary)' }}>&ldquo;{scene.narration}&rdquo;</span>
                    </div>
                  )}
                  <div>
                    <strong style={{ color: 'var(--text-muted)' }}>Visual Direction:</strong>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{scene.visualDescription}</span>
                  </div>
                  {scene.soundDesign && (
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>Audio / Atmosphere:</strong>{' '}
                      <span style={{ color: 'var(--text-muted)' }}>{scene.soundDesign}</span>
                    </div>
                  )}
                </div>

                {/* Prompt Section according to selectedModel */}
                {(selectedModel === 'gemini' || selectedModel === 'all') && (
                  <div
                    style={{
                      background: 'rgba(99, 102, 241, 0.05)',
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#818cf8' }}>
                        Gemini (Veo) Prompt
                      </span>
                      <button
                        onClick={() => handleCopy(scene.prompts.gemini || scene.prompts.generic, `${scene._id}_gemini`)}
                        className="btn btn-secondary"
                        style={{ padding: '3px 8px', fontSize: 11 }}
                      >
                        {copiedKey === `${scene._id}_gemini` ? (
                          <Check size={12} style={{ color: '#10b981' }} />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        lineHeight: 1.5,
                        fontFamily: 'monospace',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {scene.prompts.gemini || scene.prompts.generic}
                    </div>
                  </div>
                )}

                {(selectedModel === 'grok' || selectedModel === 'all') && (
                  <div
                    style={{
                      background: 'rgba(168, 85, 247, 0.05)',
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid rgba(168, 85, 247, 0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#c084fc' }}>
                        Grok (Aurora) Prompt
                      </span>
                      <button
                        onClick={() => handleCopy(scene.prompts.grok || scene.prompts.generic, `${scene._id}_grok`)}
                        className="btn btn-secondary"
                        style={{ padding: '3px 8px', fontSize: 11 }}
                      >
                        {copiedKey === `${scene._id}_grok` ? (
                          <Check size={12} style={{ color: '#10b981' }} />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        lineHeight: 1.5,
                        fontFamily: 'monospace',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {scene.prompts.grok || scene.prompts.generic}
                    </div>
                  </div>
                )}

                {(selectedModel === 'generic' || selectedModel === 'all') && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                        Generic Video Prompt
                      </span>
                      <button
                        onClick={() => handleCopy(scene.prompts.generic, `${scene._id}_generic`)}
                        className="btn btn-secondary"
                        style={{ padding: '3px 8px', fontSize: 11 }}
                      >
                        {copiedKey === `${scene._id}_generic` ? (
                          <Check size={12} style={{ color: '#10b981' }} />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        lineHeight: 1.5,
                        fontFamily: 'monospace',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {scene.prompts.generic}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Scene Modal */}
      {editingScene && (
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
          <div className="card" style={{ width: '100%', maxWidth: 540, padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>
              Edit Scene {editingScene.sceneNumber}
            </h3>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                Visual Description
              </label>
              <textarea
                className="input"
                rows={3}
                value={editingScene.visualDescription}
                onChange={(e) => setEditingScene({ ...editingScene, visualDescription: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Camera Movement
                </label>
                <input
                  type="text"
                  className="input"
                  value={editingScene.camera}
                  onChange={(e) => setEditingScene({ ...editingScene, camera: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Lighting
                </label>
                <input
                  type="text"
                  className="input"
                  value={editingScene.lighting}
                  onChange={(e) => setEditingScene({ ...editingScene, lighting: e.target.value })}
                />
              </div>
            </div>

            {/* Prompt override */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                Gemini Prompt
              </label>
              <textarea
                className="input"
                rows={3}
                value={editingScene.prompts.gemini}
                onChange={(e) =>
                  setEditingScene({
                    ...editingScene,
                    prompts: { ...editingScene.prompts, gemini: e.target.value },
                  })
                }
              />
            </div>

            {/* AI Prompt Re-engineer with custom instruction */}
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#818cf8', marginBottom: 6 }}>
                AI Re-engineer with Specific Instruction (optional)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Add sudden eerie mist and slow handheld push-in..."
                  value={regenInstruction}
                  onChange={(e) => setRegenInstruction(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleRegenerateScenePrompt(editingScene._id, regenInstruction)}
                  disabled={isRegeneratingScene === editingScene._id}
                  className="btn btn-primary"
                  style={{ whiteSpace: 'nowrap', fontSize: 12 }}
                >
                  {isRegeneratingScene === editingScene._id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  <span>Re-engineer</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setEditingScene(null)} className="btn">
                Cancel
              </button>
              <button onClick={() => handleSaveScene(editingScene)} className="btn btn-primary">
                Save Scene
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
