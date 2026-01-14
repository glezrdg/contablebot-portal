/**
 * AdminHeader Component
 *
 * Reusable header for all admin pages (dashboard, configuracion, etc.)
 * Shows firm name, user email, usage stats, and navigation buttons.
 */

import { useRouter } from "next/router";
import Link from "next/link";
import {
  FileText,
  BarChart3,
  TrendingUp,
  Building2,
  Users,
  ShieldCheck,
} from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import ClientSwitcher from "./ClientSwitcher";

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
  const router = useRouter();
  console.log('Plan key', planKey)
  // Check if user module should be visible (admin only, Pro+ plan)
  const showAdminModules = userRole === 'admin' &&
    (planKey === 'pro' || planKey === 'ultra' || planKey === 'enterprise');

  // Calculate usage percentage
  const usagePercentage =
    planLimit > 0 ? Math.min((usedThisMonth / planLimit) * 100, 100) : 0;

  return (
    <header className="mb-6">
      {/* Top Bar - Logo and Actions */}
      <div className="flex items-center justify-between mb-4 pb-6 border-b border-border">
        {/* Logo and Brand */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              ContableBot
            </h1>
            <p className="text-xs text-muted-foreground">Portal de facturas</p>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Dashboard Link */}
          <Link
            href="/dashboard"
            className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${router.pathname === "/dashboard"
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          {/* Reports Link */}
          <Link
            href="/reportes"
            className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${router.pathname === "/reportes"
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Reportes</span>
          </Link>

          {/* Clients Link */}
          {/* Users Link (Admin only, Pro+ plan) */}
          {showAdminModules && (
            <>
              <Link
                href="/usuarios"
                className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${router.pathname === "/usuarios"
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <Users className="w-4 h-4" />
                <span>Usuarios</span>
              </Link></>
          )}
          <Link
            href="/dashboard/qa"
            className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${router.pathname === "/dashboard/qa"
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>QA</span>
          </Link>

          {/* QA Link (Admin only) */}
          {userRole === 'admin' && (
            <>
              <Link
                href="/clientes"
                className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${router.pathname === "/clientes"
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Clientes</span>
              </Link>
            </>
          )}

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
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20">
              <span className="text-lg font-bold text-primary">
                {firmName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {firmName}
              </h2>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          {/* Usage Stats Card */}
          <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-xl px-6 py-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                  Uso mensual
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {usedThisMonth}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {planLimit}
                  </span>
                </div>
              </div>

              {/* Circular Progress Indicator */}
              <div className="relative w-16 h-16">
                {/* Background circle */}
                <svg className="transform -rotate-90 w-16 h-16">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-secondary"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - usagePercentage / 100)
                      }`}
                    className={`transition-all duration-500 ${usagePercentage >= 90
                      ? "text-destructive"
                      : usagePercentage >= 70
                        ? "text-amber-500"
                        : "text-primary"
                      }`}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Percentage text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={`text-xs font-bold ${usagePercentage >= 90
                      ? "text-destructive"
                      : usagePercentage >= 70
                        ? "text-amber-500"
                        : "text-primary"
                      }`}
                  >
                    {Math.round(usagePercentage)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Status message */}
            {usagePercentage >= 90 && (
              <p className="text-xs text-destructive mt-2 font-medium">
                ⚠️ Casi alcanzando el límite
              </p>
            )}
            {usagePercentage >= 70 && usagePercentage < 90 && (
              <p className="text-xs text-amber-500 mt-2 font-medium">
                📊 {planLimit - usedThisMonth} facturas restantes
              </p>
            )}
            {usagePercentage < 70 && (
              <p className="text-xs text-muted-foreground mt-2">
                {planLimit - usedThisMonth} facturas disponibles
              </p>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
