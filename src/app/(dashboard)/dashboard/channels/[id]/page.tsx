'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Loader2,
  Tv2,
  Dna,
  Settings,
  FileText,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface ChannelDNA {
  identity: string;
  audienceProfile: string;
  contentPillars: string[];
  visualIdentity: string;
  narrativeStyle: string;
  competitiveEdge: string;
  growthStrategy: string;
}

interface Channel {
  _id: string;
  name: string;
  slug: string;
  genre: string;
  subgenre: string;
  language: string;
  audience: string;
  ageRange: string;
  geography: string;
  tone: string;
  narrationStyle: string;
  visualStyle: string;
  videoLength: string;
  contentFrequency: string;
  seriesPreference: string;
  hookStyle: string;
  endingStyle: string;
  ctaStyle: string;
  contentRules: string[];
  forbiddenTopics: string[];
  platforms: string[];
  active: boolean;
  channelDNA: ChannelDNA;
}

type TabId = 'overview' | 'dna' | 'style';

export default function ChannelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [formData, setFormData] = useState<Partial<Channel>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/channels/${id}`);
        if (res.ok) {
          const data = await res.json();
          setChannel(data.channel);
          setFormData(data.channel);
        } else {
          toastError('Channel not found');
          router.push('/dashboard/channels');
        }
      } catch {
        toastError('Failed to load channel');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/channels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setChannel(data.channel);
        success('Channel updated!');
      } else {
        toastError('Failed to save');
      }
    } catch {
      toastError('Network error');
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function updateDNA(field: string, value: unknown) {
    setFormData((prev) => ({
      ...prev,
      channelDNA: { ...((prev as Channel).channelDNA || {}), [field]: value },
    }));
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-violet)' }} />
      </div>
    );
  }

  if (!channel) return null;

  const tabs: { id: TabId; label: string; icon: typeof Tv2 }[] = [
    { id: 'overview', label: 'Overview', icon: Tv2 },
    { id: 'dna', label: 'Channel DNA', icon: Dna },
    { id: 'style', label: 'Style & Rules', icon: Settings },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dashboard/channels" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>{channel.name}</h1>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <span className="badge badge-violet">{channel.genre}</span>
              <span className="badge badge-cyan">{channel.language}</span>
            </div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-secondary)', marginBottom: 24 }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FieldGroup label="Channel Name">
            <input className="input" value={formData.name || ''} onChange={(e) => updateField('name', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Genre">
            <input className="input" value={formData.genre || ''} onChange={(e) => updateField('genre', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Sub-genre">
            <input className="input" value={formData.subgenre || ''} onChange={(e) => updateField('subgenre', e.target.value)} placeholder="e.g., Psychological Horror" />
          </FieldGroup>
          <FieldGroup label="Language">
            <input className="input" value={formData.language || ''} onChange={(e) => updateField('language', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Target Audience">
            <input className="input" value={formData.audience || ''} onChange={(e) => updateField('audience', e.target.value)} placeholder="e.g., Horror fans aged 18-35" />
          </FieldGroup>
          <FieldGroup label="Age Range">
            <input className="input" value={formData.ageRange || ''} onChange={(e) => updateField('ageRange', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Geography">
            <input className="input" value={formData.geography || ''} onChange={(e) => updateField('geography', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Content Frequency">
            <input className="input" value={formData.contentFrequency || ''} onChange={(e) => updateField('contentFrequency', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Video Length">
            <input className="input" value={formData.videoLength || ''} onChange={(e) => updateField('videoLength', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Series Preference">
            <select className="input" value={formData.seriesPreference || 'mixed'} onChange={(e) => updateField('seriesPreference', e.target.value)}>
              <option value="standalone">Standalone Only</option>
              <option value="series">Series Only</option>
              <option value="mixed">Mixed</option>
            </select>
          </FieldGroup>
        </div>
      )}

      {activeTab === 'dna' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--accent-violet)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              Channel DNA defines the unique identity and strategic direction of this channel.
              The AI will use this context when generating all content — ideas, scripts, and prompts.
            </p>
          </div>
          <FieldGroup label="Channel Identity">
            <textarea className="input" rows={3} value={(formData as Channel).channelDNA?.identity || ''} onChange={(e) => updateDNA('identity', e.target.value)} placeholder="What is this channel about? What makes it unique?" />
          </FieldGroup>
          <FieldGroup label="Audience Profile">
            <textarea className="input" rows={3} value={(formData as Channel).channelDNA?.audienceProfile || ''} onChange={(e) => updateDNA('audienceProfile', e.target.value)} placeholder="Who watches this channel? What do they want?" />
          </FieldGroup>
          <FieldGroup label="Content Pillars (comma-separated)">
            <input className="input" value={(formData as Channel).channelDNA?.contentPillars?.join(', ') || ''} onChange={(e) => updateDNA('contentPillars', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="e.g., Psychological horror, Urban legends, Creepypasta" />
          </FieldGroup>
          <FieldGroup label="Visual Identity">
            <textarea className="input" rows={3} value={(formData as Channel).channelDNA?.visualIdentity || ''} onChange={(e) => updateDNA('visualIdentity', e.target.value)} placeholder="Dark, moody, cinematic. Heavy use of shadows and fog..." />
          </FieldGroup>
          <FieldGroup label="Narrative Style">
            <textarea className="input" rows={3} value={(formData as Channel).channelDNA?.narrativeStyle || ''} onChange={(e) => updateDNA('narrativeStyle', e.target.value)} placeholder="First-person narration, present tense, immersive..." />
          </FieldGroup>
          <FieldGroup label="Competitive Edge">
            <textarea className="input" rows={2} value={(formData as Channel).channelDNA?.competitiveEdge || ''} onChange={(e) => updateDNA('competitiveEdge', e.target.value)} placeholder="What sets this channel apart from competitors?" />
          </FieldGroup>
          <FieldGroup label="Growth Strategy">
            <textarea className="input" rows={2} value={(formData as Channel).channelDNA?.growthStrategy || ''} onChange={(e) => updateDNA('growthStrategy', e.target.value)} placeholder="Strategy for growing this channel..." />
          </FieldGroup>
        </div>
      )}

      {activeTab === 'style' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FieldGroup label="Tone">
              <input className="input" value={formData.tone || ''} onChange={(e) => updateField('tone', e.target.value)} placeholder="e.g., Dark, suspenseful, immersive" />
            </FieldGroup>
            <FieldGroup label="Narration Style">
              <input className="input" value={formData.narrationStyle || ''} onChange={(e) => updateField('narrationStyle', e.target.value)} placeholder="e.g., Whispered first-person" />
            </FieldGroup>
            <FieldGroup label="Visual Style">
              <input className="input" value={formData.visualStyle || ''} onChange={(e) => updateField('visualStyle', e.target.value)} placeholder="e.g., Cinematic, dark, atmospheric" />
            </FieldGroup>
            <FieldGroup label="Hook Style">
              <input className="input" value={formData.hookStyle || ''} onChange={(e) => updateField('hookStyle', e.target.value)} placeholder="e.g., Start with unexplained visual" />
            </FieldGroup>
            <FieldGroup label="Ending Style">
              <input className="input" value={formData.endingStyle || ''} onChange={(e) => updateField('endingStyle', e.target.value)} placeholder="e.g., Cliffhanger with twist" />
            </FieldGroup>
            <FieldGroup label="CTA Style">
              <input className="input" value={formData.ctaStyle || ''} onChange={(e) => updateField('ctaStyle', e.target.value)} placeholder="e.g., Follow for Part 2" />
            </FieldGroup>
          </div>

          <FieldGroup label="Content Rules (one per line)">
            <textarea className="input" rows={4} value={formData.contentRules?.join('\n') || ''} onChange={(e) => updateField('contentRules', e.target.value.split('\n').filter(Boolean))} placeholder="Each line is a rule the AI must follow..." />
          </FieldGroup>
          <FieldGroup label="Forbidden Topics (one per line)">
            <textarea className="input" rows={3} value={formData.forbiddenTopics?.join('\n') || ''} onChange={(e) => updateField('forbiddenTopics', e.target.value.split('\n').filter(Boolean))} placeholder="Topics the AI should never use..." style={{ borderColor: 'rgba(244, 63, 94, 0.3)' }} />
          </FieldGroup>
        </div>
      )}
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
