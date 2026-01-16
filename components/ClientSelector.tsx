/**
 * ClientSelector Component
 *
 * Dropdown to select the active client for invoice uploads.
 * Shows current active client and allows switching between clients.
 */

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    fetchClients();
  }, []);

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

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

      console.log("API response status:", response.status, response.ok);
      if (response.ok) {
        const data = await response.json();
        console.log("API response data:", data);
        console.log("Calling onClientSelected with:", client);
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
      {/* Trigger Button - Glassmorphic */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-3 px-5 py-4 rounded-xl
          bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)]
          hover:bg-[var(--glass-white)]/80 hover:shadow-md transition-all
          shadow-sm
          ${activeClientRnc ? "text-foreground" : "text-muted-foreground"}
        `}
      >
        <span className="text-sm font-bold truncate flex-1 text-left">
          {loading ? "Cargando..." : displayText}
        </span>
        <ChevronDown
          className={`w-5 h-5 transition-transform duration-300 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu - Portal-based for better UX in modals */}
      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[1200]"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu - Enhanced Glassmorphic, rendered via portal */}
          <div
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: Math.max(dropdownPosition.width, 320),
            }}
            className="z-[1201] bg-white dark:bg-slate-900 backdrop-blur-xl border border-[var(--glass-border)] rounded-xl shadow-[0_16px_48px_0_rgba(0,0,0,0.3)] max-h-80 overflow-y-auto modal-scrollbar"
          >
            {/* Add New Client Button - Gradient */}
            <button
              onClick={() => {
                setIsOpen(false);
                onAddClient();
              }}
              className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-all border-b border-[var(--glass-border)] group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(221_83%_63%)] flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
                <Plus className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">
                  Agregar nuevo cliente
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  Crear cliente con RNC
                </p>
              </div>
            </button>

            {/* Client List - Enhanced */}
            {clients.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-muted-foreground font-medium">
                  No hay clientes. Agrega uno para comenzar.
                </p>
              </div>
            ) : (
              <div className="py-2">
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
                        w-full flex items-center gap-3 px-5 py-3
                        hover:bg-muted/50 transition-all
                        ${isActive ? "bg-primary/10 border-l-4 border-primary" : "border-l-4 border-transparent"}
                        ${!hasValidRnc ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      {/* Active indicator */}
                      <div className="w-6 flex-shrink-0 flex items-center justify-center">
                        {isActive && (
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary font-bold" />
                          </div>
                        )}
                      </div>

                      {/* Client info */}
                      <div className="flex-1 text-left min-w-0">
                        <p
                          className={`text-sm font-bold truncate ${
                            isActive ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {client.name}
                        </p>
                        {formattedRnc && (
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            {formattedRnc}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
