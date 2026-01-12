/**
 * ClientSelector Component
 *
 * Dropdown to select the active client for invoice uploads.
 * Shows current active client and allows switching between clients.
 */

import { useState, useEffect } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { formatCompactRnc } from "@/lib/rnc-validator";
import type { Client } from "@/types";

interface ClientSelectorProps {
  activeClientRnc?: string;
  activeClientName?: string;
  onClientSelected: (client: Client) => void;
  onAddClient: () => void;
}

export default function ClientSelector({
  activeClientRnc,
  activeClientName,
  onClientSelected,
  onAddClient,
}: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
        console.log("Fetched clients:", data.clients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = async (client: Client) => {
    setIsOpen(false);

    // Skip clients without RNC
    if (!client.rnc || client.rnc.trim().length === 0) {
      alert(
        "Este cliente no tiene RNC asignado. Por favor, crea un nuevo cliente con RNC."
      );
      return;
    }
    console.log("Selecting client:", client);

    try {
      const response = await fetch("/api/active-client", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rnc: client.rnc }),
      });

      if (response.ok) {
        onClientSelected(client);
      } else {
        const error = await response.json();
        console.error("Error setting active client:", error);
        alert(error.error || "Error al seleccionar cliente");
      }
    } catch (error) {
      console.error("Error setting active client:", error);
      alert("Error al seleccionar cliente");
    }
  };

  const displayText = activeClientName
    ? `${activeClientName}${
        activeClientRnc ? ` (${formatCompactRnc(activeClientRnc)})` : ""
      }`
    : "Seleccionar cliente";

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl
          border border-border bg-secondary
          hover:bg-muted transition-colors
          ${activeClientRnc ? "text-foreground" : "text-muted-foreground"}
        `}
      >
        <span className="text-sm font-medium truncate max-w-xs">
          {loading ? "Cargando..." : displayText}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-20 max-h-96 overflow-y-auto">
            {/* Add New Client Button */}
            <button
              onClick={() => {
                setIsOpen(false);
                onAddClient();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors border-b border-border"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Plus className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">
                  Agregar nuevo cliente
                </p>
                <p className="text-xs text-muted-foreground">
                  Crear cliente con RNC
                </p>
              </div>
            </button>

            {/* Client List */}
            {clients.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No hay clientes. Agrega uno para comenzar.
              </div>
            ) : (
              <div className="py-1">
                {clients.map((client) => {
                  // client.name contains business name, client.rnc contains compact RNC
                  const isActive = client.rnc === activeClientRnc;
                  const formattedRnc = client.rnc
                    ? formatCompactRnc(client.rnc)
                    : null;
                  const hasValidRnc =
                    client.rnc && client.rnc.trim().length > 0;

                  return (
                    <button
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      disabled={!hasValidRnc}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3
                        hover:bg-muted transition-colors
                        ${isActive ? "bg-primary/20" : ""}
                        ${!hasValidRnc ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      {/* Active indicator */}
                      <div className="w-5 flex-shrink-0">
                        {isActive && <Check className="w-5 h-5 text-primary" />}
                      </div>

                      {/* Client info */}
                      <div className="flex-1 text-left min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            isActive ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {client.name}
                        </p>
                        {formattedRnc && (
                          <p className="text-xs text-muted-foreground">{formattedRnc}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
