/**
 * ClientContext
 *
 * Global context for managing active client switching in multi-tenant environment.
 * Allows users to switch between assigned clients dynamically.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/router';

interface AssignedClient {
  id: number;
  name: string;
  rnc: string;
  isDefault: boolean;
}

interface ClientContextValue {
  activeClientId: number | null;
  activeClientName: string | null;
  assignedClients: AssignedClient[];
  isLoading: boolean;
  switchClient: (clientId: number) => Promise<void>;
  refreshClients: () => Promise<void>;
}

const ClientContext = createContext<ClientContextValue | null>(null);

export function ClientProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [activeClientId, setActiveClientId] = useState<number | null>(null);
  const [activeClientName, setActiveClientName] = useState<string | null>(null);
  const [assignedClients, setAssignedClients] = useState<AssignedClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user info to get active client and assigned clients
  const fetchClients = useCallback(async () => {
    // Don't fetch on public pages
    const isPublicPage = router.pathname === '/' ||
      router.pathname.startsWith('/login') ||
      router.pathname.startsWith('/register') ||
      router.pathname.startsWith('/recuperar') ||
      router.pathname.startsWith('/setup-account');
    if (isPublicPage) {
      return;
    }

    try {
      const response = await fetch('/api/me');
      if (!response.ok) {
        // If unauthorized, redirect to login (but only from protected pages)
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      console.log('Fetched client data:', data);
      setActiveClientId(data.activeClientId || null);
      setActiveClientName(data.activeClientName || null);
      setAssignedClients(data.assignedClients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Fetch clients on mount
  useEffect(() => {
    // Only fetch on authenticated pages (not public pages)
    const isPublicPage = router.pathname === '/' ||
      router.pathname.startsWith('/login') ||
      router.pathname.startsWith('/register') ||
      router.pathname.startsWith('/recuperar') ||
      router.pathname.startsWith('/setup-account');
    if (!isPublicPage) {
      fetchClients();
    } else {
      setIsLoading(false);
    }
  }, [router.pathname, fetchClients]);

  // Switch active client
  const switchClient = useCallback(async (clientId: number) => {
    if (clientId === activeClientId) {
      return; // Already active
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/me/switch-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cambiar cliente');
      }

      const data = await response.json();

      // Update active client immediately
      setActiveClientId(data.activeClientId);

      // Find client name from assigned clients
      const client = assignedClients.find(c => c.id === data.activeClientId);
      if (client) {
        setActiveClientName(client.name);
      }

      // Reload the page to refresh all data with new client context
      // This ensures all components re-fetch with the new active client
      window.location.reload();
    } catch (error) {
      console.error('Error switching client:', error);
      setIsLoading(false);
      throw error; // Re-throw so UI can show error message
    }
  }, [activeClientId, assignedClients]);

  // Refresh clients (useful after creating/updating clients)
  const refreshClients = useCallback(async () => {
    setIsLoading(true);
    await fetchClients();
  }, [fetchClients]);

  return (
    <ClientContext.Provider
      value={{
        activeClientId,
        activeClientName,
        assignedClients,
        isLoading,
        switchClient,
        refreshClients,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within ClientProvider');
  }
  return context;
}
