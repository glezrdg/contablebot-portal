/**
 * DashboardLayout Component
 *
 * Reusable layout for all authenticated dashboard pages.
 * Wraps content with AdminHeader and handles user data fetching.
 */

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminHeader from '@/components/AdminHeader';
import type { MeResponse } from '@/types';

interface DashboardLayoutProps {
  children: ReactNode | ((userData: MeResponse) => ReactNode);
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
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<MeResponse | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

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
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          {typeof children === 'function' ? children(userData) : children}
        </div>
      </div>
    </>
  );
}
