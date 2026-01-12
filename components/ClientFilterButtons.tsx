import type { Client } from "@/types";

interface ClientFilterButtonsProps {
  clients: Client[];
  selectedClientId: number | null;
  onClientSelect: (clientId: number | null) => void;
  onSetActiveClient?: (client: Client | null) => void;
  activeClientRnc?: string;
  loading?: boolean;
}

export default function ClientFilterButtons({
  clients,
  selectedClientId,
  onClientSelect,
  onSetActiveClient,
  activeClientRnc,
  loading = false,
}: ClientFilterButtonsProps) {
  const handleClientClick = async (client: Client | null) => {
    // Set as filter
    onClientSelect(client?.id || null);

    // Also set as active client for uploads (if callback provided)
    if (onSetActiveClient) {
      if (client) {
        // Call API to set active client
        try {
          const response = await fetch("/api/active-client", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rnc: client.rnc }),
          });

          if (response.ok) {
            onSetActiveClient(client);
          } else {
            const error = await response.json();
            console.error("Error setting active client:", error);
          }
        } catch (error) {
          console.error("Error setting active client:", error);
        }
      } else {
        // Clear active client
        onSetActiveClient(null);
      }
    }
  };

  return (
    <section className="mb-6 rounded-2xl bg-card border border-border p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Seleccionar Cliente
        </h2>
        {activeClientRnc && (
          <span className="text-xs text-muted-foreground">
            Cliente activo para subir facturas
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {/* All clients button */}
        <button
          onClick={() => handleClientClick(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedClientId === null
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-secondary text-foreground hover:bg-muted border border-border"
          }`}
        >
          Todos
        </button>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Cargando clientes...</span>
          </div>
        ) : (
          clients.map((client) => {
            const isActive = client.rnc === activeClientRnc;
            return (
              <button
                key={client.id || client.name}
                onClick={() => handleClientClick(client)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition relative ${
                  selectedClientId === client.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-secondary text-foreground hover:bg-muted border border-border"
                }`}
              >
                {client.name}
                {isActive && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
