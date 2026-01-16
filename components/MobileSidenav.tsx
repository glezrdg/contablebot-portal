import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  X,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Users,
  Building2,
  Settings,
  CreditCard,
  LogOut,
  PlayCircle,
  FileText,
} from 'lucide-react';

interface MobileSidenavProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    firm_name: string;
    email: string;
    role: string;
    plan: string;
  };
  isAdmin: boolean;
  hasProPlan: boolean;
}

export default function MobileSidenav({
  isOpen,
  onClose,
  userData,
  isAdmin,
  hasProPlan,
}: MobileSidenavProps) {
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Check if a route is active
  const isActive = (path: string) => router.pathname === path;

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Navigation links configuration
  const navLinks = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      show: true,
    },
    {
      href: '/reportes',
      label: 'Reportes',
      icon: TrendingUp,
      show: true,
    },
    {
      href: '/dashboard/qa',
      label: 'QA',
      icon: ShieldCheck,
      show: true,
    },
    {
      href: '/usuarios',
      label: 'Usuarios',
      icon: Users,
      show: isAdmin && hasProPlan,
    },
    {
      href: '/clientes',
      label: 'Clientes',
      icon: Building2,
      show: isAdmin,
    },
  ];

  return (
    <>
      {/* Glassmorphic Backdrop with Blur */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-all duration-300 z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Glass Drawer */}
      <div
        ref={drawerRef}
        className={`
          fixed inset-y-0 left-0 w-72
          bg-[var(--glass-white)] backdrop-blur-xl
          border-r border-[var(--glass-border)]
          shadow-2xl
          transform transition-all duration-300 ease-out
          z-50 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
          <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                ContableBot
              </h1>
              <p className="text-xs text-muted-foreground">Portal de facturas</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-[var(--glass-white)] hover:backdrop-blur-md rounded-lg transition-all"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info section with glass effect */}
        <div className="p-4 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--glass-white)] backdrop-blur-sm border border-[var(--glass-border)]">
            {/* Firm avatar */}
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-semibold text-sm">
                {userData.firm_name?.[0]?.toUpperCase() || 'F'}
              </span>
            </div>
            {/* Firm info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {userData.firm_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{userData.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation links with glass styling */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navLinks.map((link) => {
              if (!link.show) return null;

              const Icon = link.icon;
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-[var(--glass-white)] backdrop-blur-md text-primary border border-primary/20 shadow-sm'
                      : 'text-muted-foreground hover:bg-[var(--glass-white)] hover:backdrop-blur-md hover:text-foreground hover:border hover:border-[var(--glass-border)] hover:scale-[1.02]'
                  }`}
                  onClick={onClose}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Quick actions at bottom with glass effects */}
        <div className="p-4 border-t border-[var(--glass-border)] space-y-1">
          <Link
            href="/tutorial"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-[var(--glass-white)] hover:backdrop-blur-md hover:text-foreground hover:border hover:border-[var(--glass-border)] transition-all"
            onClick={onClose}
          >
            <PlayCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">Tutorial</span>
          </Link>

          <Link
            href="/configuracion"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-[var(--glass-white)] hover:backdrop-blur-md hover:text-foreground hover:border hover:border-[var(--glass-border)] transition-all"
            onClick={onClose}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">Configuración</span>
          </Link>

          {userData.plan && (
            <a
              href={
                userData.plan === 'starter'
                  ? 'https://whop.com/hub/'
                  : 'https://whop.com/hub/'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-[var(--glass-white)] hover:backdrop-blur-md hover:text-foreground hover:border hover:border-[var(--glass-border)] transition-all"
            >
              <CreditCard className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Suscripción</span>
            </a>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive/80 hover:bg-destructive/10 hover:text-destructive hover:border hover:border-destructive/20 transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}
