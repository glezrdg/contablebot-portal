/**
 * AdminHeader Component
 *
 * Reusable header for all admin pages (dashboard, configuracion, etc.)
 * Shows firm name, user email, usage stats, and navigation buttons.
 */

import { useState, useEffect } from "react";
import {
  Menu,
} from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import ClientSwitcher from "./ClientSwitcher";
import MobileSidenav from "./MobileSidenav";

interface AdminHeaderProps {
  firmName: string;
  userEmail: string;
  manageUrl?: string;
  userRole?: 'admin' | 'user'; // User role for conditional menu items
  planKey?: string; // Plan key for feature gating
}

export default function AdminHeader({
  firmName,
  userEmail,
  manageUrl,
  userRole = 'admin',
  planKey,
}: AdminHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Check if user has Pro+ plan
  const hasProPlan = planKey === 'pro' || planKey === 'ultra' || planKey === 'enterprise';

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
        sticky top-0 z-40 -mt-6 sm:-mt-8 pt-4 sm:pt-6 mb-4 pb-4
        -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8
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

        {/* Spacer to push items to the right */}
        <div className="flex-1" />

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
    </header>
  );
}
