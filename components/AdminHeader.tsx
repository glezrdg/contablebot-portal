/**
 * AdminHeader Component
 *
 * Reusable header for all admin pages (dashboard, configuracion, etc.)
 * Shows firm name, user email, usage stats, and navigation buttons.
 */

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FileText,
  Menu,
} from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import ClientSwitcher from "./ClientSwitcher";
import MobileSidenav from "./MobileSidenav";
import { UsageRing } from "./ui/progress-ring";

interface AdminHeaderProps {
  firmName: string;
  userEmail: string;
  usedThisMonth: number;
  planLimit: number;
  manageUrl?: string;
  showUserStats?: boolean; // Show bottom bar with user info and usage stats
  userRole?: 'admin' | 'user'; // User role for conditional menu items
  planKey?: string; // Plan key for feature gating
}

export default function AdminHeader({
  firmName,
  userEmail,
  usedThisMonth,
  planLimit,
  manageUrl,
  showUserStats = false,
  userRole = 'admin',
  planKey,
}: AdminHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Check if user has Pro+ plan
  const hasProPlan = planKey === 'pro' || planKey === 'ultra' || planKey === 'enterprise';

  // Calculate usage percentage
  const usagePercentage =
    planLimit > 0 ? Math.min((usedThisMonth / planLimit) * 100, 100) : 0;

  // Track scroll for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="mb-6">
      {/* Mobile Sidenav */}
      <MobileSidenav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        userData={{
          firm_name: firmName,
          email: userEmail,
          role: userRole,
          plan: planKey || 'starter',
        }}
        isAdmin={userRole === 'admin'}
        hasProPlan={hasProPlan}
      />

      {/* Top Bar - Logo and Actions */}
      <div className={`
        sticky top-0 z-40 -mt-6 pt-4 mb-4 pb-4
        flex items-center justify-between gap-2 sm:gap-3
        transition-glass
        ${isScrolled
          ? 'bg-[var(--glass-white)] backdrop-blur-lg border-b border-[var(--glass-border)] shadow-md'
          : 'border-b border-border'
        }
      `}>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Logo and Brand - Hidden on mobile when sidebar is present */}
        <Link href="/dashboard" className="hidden lg:flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase text-foreground group-hover:text-primary transition-colors">
              ContableBot
            </h1>
            <p className="text-xs text-muted-foreground">Portal de facturas</p>
          </div>
        </Link>

        {/* Spacer to push items to the right on mobile */}
        <div className="flex-1 lg:hidden" />

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Client Switcher */}
          <ClientSwitcher />

          {/* Profile Dropdown */}
          <ProfileDropdown
            firmName={firmName}
            userEmail={userEmail}
            manageUrl={manageUrl}
          />
        </div>
      </div>

      {/* Bottom Bar - User Info and Usage Stats (Dashboard only) */}
      {showUserStats && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary/30 backdrop-blur-sm shadow-lg">
              <span className="text-xl font-bold text-primary">
                {firmName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-foreground truncate">
                {firmName}
              </h2>
              <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>

          {/* Enhanced Usage Stats Card with Premium 3D Glass Effect */}
          <div className="
            bg-[var(--glass-white)] backdrop-blur-xl
            border-2 border-[var(--glass-border)]
            rounded-2xl px-4 sm:px-6 md:px-8 py-4 md:py-5
            shadow-[0_12px_40px_0_rgba(31,38,135,0.2),0_6px_20px_0_rgba(31,38,135,0.15),inset_0_2px_0_0_rgba(255,255,255,0.6)]
            dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.5),0_6px_20px_0_rgba(0,0,0,0.4),inset_0_2px_0_0_rgba(255,255,255,0.15)]
            hover:shadow-[0_16px_56px_0_rgba(31,38,135,0.3),0_8px_28px_0_rgba(31,38,135,0.2),inset_0_2px_0_0_rgba(255,255,255,0.7)]
            dark:hover:shadow-[0_16px_56px_0_rgba(0,0,0,0.6),0_8px_28px_0_rgba(0,0,0,0.5),inset_0_2px_0_0_rgba(255,255,255,0.2)]
            hover:translate-y-[-6px]
            transition-all duration-300
            relative
            shrink-0
            w-full md:w-auto md:min-w-[300px] md:max-w-[400px]
          ">
            <div className="flex items-center justify-between gap-4 sm:gap-6 md:gap-8">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/40 to-primary/10 rounded-xl flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary/80 whitespace-nowrap">
                    Uso mensual
                  </p>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                    {usedThisMonth}
                  </span>
                  <span className="text-base sm:text-lg text-muted-foreground font-medium whitespace-nowrap">
                    / {planLimit}
                  </span>
                </div>

                {/* Enhanced Status message with color-coded badges */}
                <div className="mt-2">
                  {usagePercentage >= 90 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 backdrop-blur-sm">
                      <svg className="w-4 h-4 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-destructive font-bold">Casi al límite</span>
                    </div>
                  )}
                  {usagePercentage >= 70 && usagePercentage < 90 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
                      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      <span className="text-xs text-amber-500 font-bold">{planLimit - usedThisMonth} restantes</span>
                    </div>
                  )}
                  {usagePercentage < 70 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm">
                      <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-emerald-500 font-bold">{planLimit - usedThisMonth} disponibles</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Usage Ring with stronger glow */}
              <div className="relative shrink-0 hidden sm:block">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50"></div>
                <UsageRing
                  used={usedThisMonth}
                  limit={planLimit}
                  size="md"
                  showLabel={false}
                  glowEffect={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
