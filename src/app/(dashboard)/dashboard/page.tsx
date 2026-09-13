'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Tv2,
  Lightbulb,
  BookOpen,
  FileText,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Plus,
  Loader2,
  Film,
  Brain,
  Mail,
  Play,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

interface DashboardData {
  channels: number;
  ideas: number;
  series: number;
  episodes: number;
  prompts: number;
  avgViews: number;
  bestChannel: string;
  recentEpisodes: any[];
  recentPackage?: any;
  topInsights: any[];
  lastEmailJob?: any;
  nextEmailSchedule: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    {
      label: 'Active Channels',
      value: data?.channels ?? 0,
      icon: Tv2,
      color: '#818cf8',
      href: '/dashboard/channels',
    },
    {
      label: 'Videos Generated',
      value: data?.episodes ?? 0,
      icon: FileText,
      color: '#ec4899',
      href: '/dashboard/content',
    },
    {
      label: 'Prompts Ready',
      value: data?.prompts ?? 0,
      icon: Sparkles,
      color: '#10b981',
      href: '/dashboard/content',
    },
    {
      label: 'Current Series',
      value: data?.series ?? 0,
      icon: BookOpen,
      color: '#a855f7',
      href: '/dashboard/series',
    },
    {
      label: 'Average Views',
      value: data?.avgViews ? data.avgViews.toLocaleString() : '—',
      icon: Eye,
      color: '#38bdf8',
      href: '/dashboard/performance',
    },
    {
      label: 'Top Performing Channel',
      value: data?.bestChannel || '—',
      icon: TrendingUp,
      color: '#f59e0b',
      href: '/dashboard/channels',
    },
  ];

  return (
    <div style={{ paddingBottom: 64 }}>
      {/* Hero Welcome & Today's Strategic Directive */}
      <div
        className="card"
        style={{
          padding: 24,
          marginBottom: 24,
          border: '1px solid rgba(99, 102, 241, 0.25)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#c7d2fe', fontWeight: 600 }}>
                AI Content Factory Brain
              </span>
              <span className="badge badge-success">Online & Monitoring</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
              Welcome back{user?.name ? `, ${user.name}` : ''}!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 680, lineHeight: 1.5 }}>
              {data?.recentPackage?.strategy?.objective
                ? `Today's Primary Directive: ${data.recentPackage.strategy.objective}. Focus on ${data.recentPackage.strategy.focus}.`
                : 'Your prompt production system is primed. Operate multiple serialized short-form channels and produce scene-by-scene prompts with strict canon continuity.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href="/dashboard/content"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Sparkles size={16} />
              <span>Generate Script</span>
            </Link>
            <Link
              href="/dashboard/daily-email"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Mail size={16} />
              <span>Daily Pack</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 6 Metric Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              href={card.href}
              className="card"
              style={{
                padding: 18,
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {card.label}
                </span>
                <Icon size={18} style={{ color: card.color }} />
              </div>
              <div style={{ fontSize: typeof card.value === 'string' && card.value.length > 8 ? 20 : 26, fontWeight: 800, marginTop: 'auto' }}>
                {loading ? <Loader2 size={20} className="animate-spin" /> : card.value}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Left (Today's Generated Content) vs Right (AI Insights & Schedule) */}
      <div className="grid-responsive-two-col">
        {/* Left Column: Today's Generated Content & Recent Videos */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Today&apos;s Content & Recent Scripts</h2>
            <Link
              href="/dashboard/content"
              style={{ fontSize: 13, color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 64 }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
              <p style={{ color: 'var(--text-muted)' }}>Loading today&apos;s package...</p>
            </div>
          ) : !data?.recentEpisodes || data.recentEpisodes.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <Film size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 14px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No Content Generated Yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 380, margin: '0 auto 20px' }}>
                Create your first channel, generate an idea, or use the one-click daily package generator.
              </p>
              <Link href="/dashboard/channels" className="btn btn-primary">
                Create First Channel
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.recentEpisodes.map((ep) => (
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
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', fontSize: 11 }}>
                        {ep.channelId?.name || 'Channel'}
                      </span>
                      {ep.seriesId && (
                        <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe', fontSize: 11 }}>
                          {ep.seriesId.title} (EP {ep.episodeNumber})
                        </span>
                      )}
                      <span className="badge badge-success" style={{ fontSize: 11 }}>
                        {ep.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{ep.title}</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Hook: &ldquo;{ep.hook}&rdquo;
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>{ep.duration}s</span>
                    <span>{ep.sceneCount || 0} scenes</span>
                    <Play size={15} style={{ color: '#818cf8' }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Insights & Automation Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* AI Insights Card */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Brain size={18} style={{ color: '#818cf8' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>AI Strategic Insights</h3>
              </div>
              <Link href="/dashboard/insights" style={{ fontSize: 12, color: '#818cf8', textDecoration: 'none' }}>
                All <ArrowRight size={12} style={{ display: 'inline' }} />
              </Link>
            </div>

            {data?.topInsights && data.topInsights.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.topInsights.map((ins) => (
                  <div
                    key={ins._id}
                    style={{
                      padding: 12,
                      background: 'rgba(99, 102, 241, 0.05)',
                      borderRadius: 6,
                      borderLeft: '3px solid #6366f1',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
                        {ins.category} pattern
                      </span>
                      <span className="badge badge-success" style={{ fontSize: 10 }}>
                        {ins.confidence} confidence
                      </span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {ins.observation}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      💡 {ins.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>
                Log performance data to unlock personalized AI strategy recommendations.
              </div>
            )}
          </div>

          {/* Automation & Schedule Card */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Clock size={18} style={{ color: '#10b981' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Daily Automation Status</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Next Dispatch:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {data?.nextEmailSchedule || '08:00 UTC'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Last Email Status:</span>
                <span className="badge badge-success" style={{ fontSize: 11 }}>
                  {data?.lastEmailJob?.status || 'Active (Cron Scheduled)'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Continuous Learning:</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>Enabled</span>
              </div>

              <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <Link
                  href="/dashboard/daily-email"
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
                >
                  Configure Email Delivery
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
