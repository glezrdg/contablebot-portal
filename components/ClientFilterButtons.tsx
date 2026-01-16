import type { Client } from "@/types";
import { Users, Loader2, Sparkles } from "lucide-react";

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
    <section className="mb-6 rounded-2xl bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-[var(--glass-border)] px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-primary drop-shadow-sm" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Seleccionar Cliente
              </h2>
              {activeClientRnc && (
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Cliente activo para subir facturas
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Client buttons */}
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        {/* Scroll container with gradient shadows to indicate scrollable content */}
        <div className="relative">
          {/* Left scroll shadow */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background/80 to-transparent pointer-events-none z-10 rounded-l-xl opacity-0 peer-scroll:opacity-100 transition-opacity"></div>

          {/* Right scroll shadow */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/80 to-transparent pointer-events-none z-10 rounded-r-xl"></div>

          {/* Scrollable buttons container */}
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40 peer">
            {/* All clients button */}
            <button
              onClick={() => handleClientClick(null)}
              className={`
                group relative px-6 py-3 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap flex-shrink-0
                ${selectedClientId === null
                  ? "bg-[#3B82F6] text-white shadow-md hover:bg-[#2563EB] hover:shadow-lg scale-[1.02]"
                  : "bg-[var(--glass-white)] backdrop-blur-sm border border-[var(--glass-border)] text-foreground hover:bg-[var(--glass-white)]/80 hover:border-primary/30 shadow-sm hover:shadow-md"
                }
              `}
            >
              <span className="relative z-10">Todos</span>
            </button>

            {loading ? (
              <div className="flex items-center gap-3 px-6 py-3 bg-[var(--glass-white)] backdrop-blur-sm border border-[var(--glass-border)] rounded-full shadow-sm whitespace-nowrap flex-shrink-0">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm font-medium text-muted-foreground">Cargando clientes...</span>
              </div>
            ) : (
              clients.map((client) => {
                const isActive = client.rnc === activeClientRnc;
                const isSelected = selectedClientId === client.id;

                return (
                  <button
                    key={client.id || client.name}
                    onClick={() => handleClientClick(client)}
                    className={`
                      group relative px-6 py-3 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap flex-shrink-0
                      ${isSelected
                        ? "bg-[#3B82F6] text-white shadow-md hover:bg-[#2563EB] hover:shadow-lg scale-[1.02]"
                        : "bg-[var(--glass-white)] backdrop-blur-sm border border-[var(--glass-border)] text-foreground hover:bg-[var(--glass-white)]/80 hover:border-primary/30 shadow-sm hover:shadow-md"
                      }
                    `}
                  >
                    <span className="relative z-10">{client.name}</span>

                    {/* Active client indicator with sparkle */}
                    {isActive && (
                      <span className="absolute -top-1 -right-1 flex h-6 w-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex items-center justify-center rounded-full h-6 w-6 bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-md">
                          <Sparkles className="w-3 h-3 text-white" />
                        </span>
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
