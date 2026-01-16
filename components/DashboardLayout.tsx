/**
 * DashboardLayout Component
 *
 * Reusable layout for all authenticated dashboard pages.
 * Wraps content with AdminHeader and handles user data fetching.
 */

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminHeader from '@/components/AdminHeader';
import Sidebar from '@/components/Sidebar';
import type { MeResponse } from '@/types';

interface DashboardLayoutProps {
  children: ReactNode | ((userData: MeResponse, refreshUserData: () => Promise<void>) => ReactNode);
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
  const [userData, setUserData] = useState<MeResponse | null>(null);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Refresh user data - can be called by children to update usage, etc.
  const refreshUserData = useCallback(async () => {
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        const data: MeResponse = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, []);

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

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/me');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch user data');
      }

      const data: MeResponse = await response.json();
      setUserData(data);
      setIsInitialLoad(false);

      // Check admin requirement
      if (requireAdmin && data.role !== 'admin') {
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

        const userPlanLevel = data.planKey ? planHierarchy[data.planKey] || 0 : 0;
        const requiredPlanLevel = planHierarchy[requirePlan] || 0;

        if (userPlanLevel < requiredPlanLevel) {
          router.push('/dashboard');
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setIsInitialLoad(false);
      router.push('/login');
    }
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      <div className="min-h-screen page-background flex">
        {/* Desktop Sidebar - Always visible after initial load */}
        <div className="hidden lg:block">
          {!isInitialLoad && userData ? (
            <Sidebar userRole={userData.role} />
          ) : !isInitialLoad ? (
            <div className="fixed left-0 top-0 h-screen w-64 bg-[var(--glass-white)] backdrop-blur-xl border-r border-[var(--glass-border)] animate-pulse" />
          ) : null}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {!isInitialLoad && userData ? (
              <>
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

                <main
                  className={`
                    max-w-full
                    transition-all duration-200 ease-in-out
                    ${isPageTransitioning ? 'opacity-70 scale-[0.99]' : 'opacity-100 scale-100'}
                  `}
                >
                  {typeof children === 'function' ? children(userData, refreshUserData) : children}
                </main>
              </>
            ) : (
              <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Cargando...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
