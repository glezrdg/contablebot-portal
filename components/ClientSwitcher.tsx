/**
 * ClientSwitcher Component
 *
 * Dropdown for switching between assigned clients.
 * Only shows if user has multiple clients assigned.
 */

import { useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { useClient } from '@/contexts/ClientContext';
import { Building2 } from 'lucide-react';

export default function ClientSwitcher() {
  const { activeClientId, assignedClients, isLoading, switchClient } = useClient();
  const [switching, setSwitching] = useState(false);

  // Don't show if user has 0 or 1 clients
  console.log('Assigned clients in ClientSwitcher:', assignedClients);
  if (assignedClients.length <= 1) {
    return null;
  }

  const handleClientChange = async (clientId: number) => {
    if (clientId === activeClientId || switching) {
      return;
    }

    setSwitching(true);

    try {
      await switchClient(clientId);
      // Page will reload after successful switch
    } catch (error) {
      console.error('Error switching client:', error);
      setSwitching(false);
      // Could show a toast notification here
    }
  };

  // Custom template for dropdown items
  const clientOptionTemplate = (option: { id: number; name: string; rnc: string; isDefault: boolean }) => {
    return (
      <div className="flex items-center gap-2 py-1">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">{option.name}</div>
          <div className="text-xs text-muted-foreground">RNC: {option.rnc}</div>
        </div>
        {option.isDefault && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
            Predeterminado
          </span>
        )}
      </div>
    );
  };

  // Custom template for selected value
  const selectedClientTemplate = (option: { id: number; name: string; rnc: string } | null) => {
    if (!option) {
      return <span className="text-muted-foreground">Seleccionar cliente</span>;
    }

    return (
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{option.name}</span>
      </div>
    );
  };

  return (
    <div className="relative">
      <Dropdown
        value={activeClientId}
        options={assignedClients}
        onChange={(e) => handleClientChange(e.value)}
        optionLabel="name"
        optionValue="id"
        placeholder="Seleccionar cliente"
        className="border border-border bg-secondary hover:bg-muted text-foreground rounded-lg w-48"
        disabled={isLoading || switching}
        itemTemplate={clientOptionTemplate}
        valueTemplate={selectedClientTemplate}
        panelClassName="client-switcher-panel"
      />

      {switching && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
