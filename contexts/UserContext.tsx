/**
 * UserContext
 *
 * Global context for managing authenticated user data.
 * Persists user data across page navigations to avoid loading screens.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/router';
import type { MeResponse } from '@/types';

interface UserContextValue {
  userData: MeResponse | null;
  isLoading: boolean;
  refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [userData, setUserData] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    // Don't fetch on public pages
    const isPublicPage = router.pathname === '/' ||
      router.pathname.startsWith('/login') ||
      router.pathname.startsWith('/register') ||
      router.pathname.startsWith('/recuperar') ||
      router.pathname.startsWith('/setup-account');

    if (isPublicPage) {
      setIsLoading(false);
      return;
    }

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
    } catch (error) {
      console.error('Error fetching user data:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Fetch user data on mount and when pathname changes to a protected page
  useEffect(() => {
    const isPublicPage = router.pathname === '/' ||
      router.pathname.startsWith('/login') ||
      router.pathname.startsWith('/register') ||
      router.pathname.startsWith('/recuperar') ||
      router.pathname.startsWith('/setup-account');

    if (!isPublicPage && !userData) {
      fetchUserData();
    } else {
      // If userData exists or it's a public page, not loading
      setIsLoading(false);
    }
  }, [router.pathname, userData, fetchUserData]);

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

  return (
    <UserContext.Provider
      value={{
        userData,
        isLoading,
        refreshUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
