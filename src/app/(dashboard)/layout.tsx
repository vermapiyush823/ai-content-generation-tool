'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  LayoutDashboard,
  Tv2,
  Lightbulb,
  BookOpen,
  FileText,
  BarChart3,
  Brain,
  FlaskConical,
  Mail,
  Settings,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/channels', label: 'Channels', icon: Tv2 },
  { href: '/dashboard/ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/dashboard/series', label: 'Series', icon: BookOpen },
  { href: '/dashboard/content', label: 'Content', icon: FileText },
  { href: '/dashboard/performance', label: 'Performance', icon: BarChart3 },
  { href: '/dashboard/insights', label: 'Insights', icon: Brain },
  { href: '/dashboard/experiments', label: 'Experiments', icon: FlaskConical },
  { href: '/dashboard/daily-email', label: 'Daily Email', icon: Mail },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
        }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-violet)' }} />
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="dashboard-layout-wrapper">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 45,
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside
        className={`dashboard-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        }}
      >
        {/* Logo & Mobile Close */}
        <div
          style={{
            padding: collapsed ? '18px 12px' : '18px 20px',
            borderBottom: '1px solid var(--border-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={17} color="white" />
            </div>
            {!collapsed && (
              <span
                style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}
                className="gradient-text"
              >
                Content Factory
              </span>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="mobile-close-btn btn btn-ghost btn-icon"
            style={{ padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: collapsed ? '10px 12px' : '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all var(--transition-fast)',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      position: 'relative',
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    {isActive && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 3,
                          height: 20,
                          borderRadius: 2,
                          background: 'var(--accent-violet)',
                        }}
                      />
                    )}
                    <Icon
                      size={18}
                      style={{
                        flexShrink: 0,
                        color: isActive ? 'var(--accent-violet)' : undefined,
                      }}
                    />
                    {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div
          style={{
            padding: collapsed ? '12px 8px' : '12px 12px',
            borderTop: '1px solid var(--border-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {/* User Profile */}
          {!collapsed && (
            <div
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                {user.name}
              </div>
              <div style={{ fontSize: 11, marginTop: 2, color: 'var(--text-muted)' }}>
                {user.email}
              </div>
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="desktop-collapse-btn btn btn-ghost"
            style={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              fontSize: 12,
              padding: '8px 10px',
            }}
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={16} /> <span>Collapse</span>
              </>
            )}
          </button>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className="btn btn-ghost"
            style={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              fontSize: 12,
              padding: '8px 10px',
              color: 'var(--text-tertiary)',
            }}
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Top Header (Fixed at top 0, 56px height on mobile only) */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="btn btn-ghost btn-icon"
            style={{ padding: 6 }}
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
          <span className="gradient-text" style={{ fontWeight: 700, fontSize: 15 }}>
            Content Factory
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: 'white',
            }}
          >
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`dashboard-main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {children}
      </main>
    </div>
  );
}
