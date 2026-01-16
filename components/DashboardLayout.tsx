/**
 * DashboardLayout Component
 *
 * Reusable layout for all authenticated dashboard pages.
 * Wraps content with AdminHeader and handles user data fetching.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminHeader from '@/components/AdminHeader';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@/contexts/UserContext';
import type { MeResponse } from '@/types';

interface DashboardLayoutProps {
  children: React.ReactNode | ((userData: MeResponse, refreshUserData: () => Promise<void>) => React.ReactNode);
  title?: string;
  description?: string;
  showUserStats?: boolean;
  requireAdmin?: boolean;
  requirePlan?: 'starter' | 'business' | 'pro' | 'ultra' | 'enterprise';
}

export default function DashboardLayout({
  children,
  title = 'ContableBot Portal',
  description = 'Portal de gestión de facturas',
  showUserStats = false,
  requireAdmin = false,
  requirePlan,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { userData, isLoading, refreshUserData } = useUser();
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  // Handle page transitions for smooth content updates
  useEffect(() => {
    const handleRouteChangeStart = () => setIsPageTransitioning(true);
    const handleRouteChangeComplete = () => setIsPageTransitioning(false);
    const handleRouteChangeError = () => setIsPageTransitioning(false);

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router]);

  // Check admin and plan requirements
  useEffect(() => {
    if (!userData || isLoading) return;

    // Check admin requirement
    if (requireAdmin && userData.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    // Check plan requirement
    if (requirePlan) {
      const planHierarchy: Record<string, number> = {
        starter: 1,
        business: 2,
        pro: 3,
        ultra: 4,
        enterprise: 5,
      };

      const userPlanLevel = userData.planKey ? planHierarchy[userData.planKey] || 0 : 0;
      const requiredPlanLevel = planHierarchy[requirePlan] || 0;

      if (userPlanLevel < requiredPlanLevel) {
        router.push('/dashboard');
        return;
      }
    }
  }, [userData, isLoading, requireAdmin, requirePlan, router]);

  // Show loading only on initial load (when userData is null and still loading)
  const showLoading = isLoading && !userData;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      <div className="min-h-screen page-background flex">
        {/* Desktop Sidebar - Always visible, shows skeleton only on initial load */}
        <div className="hidden lg:block">
          {userData ? (
            <Sidebar userRole={userData.role} />
          ) : showLoading ? (
            <div className="fixed left-0 top-0 h-screen w-64 bg-[var(--glass-white)] backdrop-blur-xl border-r border-[var(--glass-border)]">
              {/* Sidebar skeleton */}
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-xl animate-pulse" />
                  <div className="h-6 w-24 bg-muted/50 rounded animate-pulse" />
                </div>
                <div className="space-y-2 mt-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 bg-muted/30 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Header - show skeleton only on initial load */}
            {userData ? (
              <AdminHeader
                firmName={userData.firmName || ''}
                userEmail={userData.email || ''}
                usedThisMonth={userData.usedThisMonth || 0}
                planLimit={userData.planLimit || 0}
                manageUrl={userData.manageUrl}
                showUserStats={showUserStats}
                userRole={userData.role}
                planKey={userData.planKey}
              />
            ) : showLoading ? (
              <div className="flex items-center justify-between mb-6">
                {/* Header skeleton */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-xl animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-muted/30 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-24 bg-gradient-to-r from-primary/10 to-[hsl(262_83%_58%)]/10 rounded-lg animate-pulse" />
                </div>
              </div>
            ) : null}

            {/* Main content */}
            {userData ? (
              <main
                className={`
                  max-w-full
                  transition-all duration-200 ease-in-out
                  ${isPageTransitioning ? 'opacity-70 scale-[0.99]' : 'opacity-100 scale-100'}
                `}
              >
                {typeof children === 'function' ? children(userData, refreshUserData) : children}
              </main>
            ) : showLoading ? (
              <div className="flex items-center justify-center flex-1 min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
                  </div>
                  <p className="text-sm text-muted-foreground">Cargando...</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
