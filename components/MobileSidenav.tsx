import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
      {/* Backdrop with Blur */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-300 z-[1100] ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Solid White Drawer - matching modal style */}
      <div
        ref={drawerRef}
        className={`
          fixed inset-y-0 left-0 w-[280px]
          bg-white dark:bg-slate-900
          border-r border-border
          shadow-[0_24px_64px_0_rgba(0,0,0,0.3)]
          transform transition-all duration-300 ease-out
          z-[1101] flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo Header with gradient accent */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-r from-primary/5 via-[hsl(262_83%_58%)]/10 to-primary/5">
          <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="relative flex items-center justify-center transition-all group-hover:scale-105">
              <Image
                src="/contablebot-logo.png"
                alt="ContableBot"
                width={140}
                height={32}
                className="object-contain"
              />
            </div>
          </Link>
          <button
            onClick={onClose}
            className="group p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* User info section */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-[hsl(262_83%_58%)]/5 border border-primary/10">
            {/* Firm avatar */}
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-[hsl(262_83%_58%)] rounded-full flex items-center justify-center shadow-md shadow-primary/25">
              <span className="text-white font-bold text-sm drop-shadow-sm">
                {userData.firm_name?.[0]?.toUpperCase() || 'F'}
              </span>
            </div>
            {/* Firm info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {userData.firm_name}
              </p>
              <p className="text-xs text-muted-foreground font-medium truncate">{userData.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {navLinks.map((link) => {
              if (!link.show) return null;

              const Icon = link.icon;
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    active
                      ? 'bg-primary/10 text-primary border-l-4 border-primary font-bold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium border-l-4 border-transparent'
                  }`}
                  onClick={onClose}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary' : ''}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Quick actions at bottom */}
        <div className="p-3 border-t border-border space-y-1">
          <Link
            href="/tutorial"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive('/tutorial')
                ? 'bg-primary/10 text-primary border-l-4 border-primary font-bold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium border-l-4 border-transparent'
            }`}
            onClick={onClose}
          >
            <PlayCircle className={`w-5 h-5 flex-shrink-0 ${isActive('/tutorial') ? 'text-primary' : ''}`} />
            <span>Tutorial</span>
          </Link>

          <Link
            href="/configuracion"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive('/configuracion')
                ? 'bg-primary/10 text-primary border-l-4 border-primary font-bold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium border-l-4 border-transparent'
            }`}
            onClick={onClose}
          >
            <Settings className={`w-5 h-5 flex-shrink-0 ${isActive('/configuracion') ? 'text-primary' : ''}`} />
            <span>Configuración</span>
          </Link>

          {userData.plan && (
            <a
              href="https://whop.com/hub/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground font-medium transition-all border-l-4 border-transparent"
            >
              <CreditCard className="w-5 h-5 flex-shrink-0" />
              <span>Suscripción</span>
            </a>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 font-medium transition-all border-l-4 border-transparent"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}
