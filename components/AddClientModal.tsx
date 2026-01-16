/**
 * AddClientModal Component
 *
 * Modal for creating a new client with RNC validation and real-time formatting.
 */

import { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle2, UserPlus } from "lucide-react";
import { validateRnc, type RncValidationResult } from "@/lib/rnc-validator";
import { Button } from "@/components/ui/button";
import type { Client } from "@/types";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: (client: Client) => void;
}

export default function AddClientModal({
  isOpen,
  onClose,
  onClientAdded,
}: AddClientModalProps) {
  const [rncInput, setRncInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [rncValidation, setRncValidation] =
    useState<RncValidationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setRncInput("");
      setNameInput("");
      setRncValidation(null);
      setError(null);
    }
  }, [isOpen]);

  // Validate RNC on input change
  useEffect(() => {
    if (rncInput.trim().length > 0) {
      const validation = validateRnc(rncInput);
      setRncValidation(validation);

      // Auto-fill name with formatted RNC if name is empty
      if (validation.valid && !nameInput) {
        setNameInput(validation.formatted);
      }
    } else {
      setRncValidation(null);
    }
  }, [rncInput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate RNC
    if (!rncValidation || !rncValidation.valid) {
      setError(rncValidation?.error || "Por favor ingresa un RNC válido");
      return;
    }

    // Validate compact RNC exists
    if (!rncValidation.compact || rncValidation.compact.trim().length === 0) {
      setError("Error: RNC compacto no generado correctamente");
      console.error("rncValidation.compact is empty:", rncValidation);
      return;
    }

    setIsSubmitting(true);

    // Create payload: rnc = compact RNC, name = business name (or formatted RNC as fallback)
    const payload = {
      rnc: rncValidation.compact,
      name: nameInput || rncValidation.formatted,
    };

    console.log("[AddClientModal] Submitting payload:", payload);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el cliente");
      }

      const data = await response.json();
      const client = data.client;

      // Auto-select the new client (client.rnc contains the compact RNC)
      const selectResponse = await fetch("/api/active-client", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rnc: client.rnc }),
      });

      if (selectResponse.ok) {
        onClientAdded(client);
        onClose();
      } else {
        // Client created but selection failed - still close modal
        onClientAdded(client);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - Enhanced */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
        onClick={onClose}
      />

      {/* Modal - Solid White */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4">
        <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-[0_24px_64px_0_rgba(0,0,0,0.3)]">
          {/* Header - Glassmorphic with Gradient */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--glass-border)] bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center shadow-md">
                <UserPlus className="w-5 h-5 text-primary drop-shadow-sm" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Agregar nuevo cliente
              </h2>
            </div>
            <button
              onClick={onClose}
              className="group text-muted-foreground hover:text-foreground transition-all p-2 hover:bg-[var(--glass-white)] rounded-xl border border-transparent hover:border-[var(--glass-border)] shadow-sm"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* RNC Input */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                <div className="w-1 h-4 bg-primary rounded-full"></div>
                RNC o Cédula <span className="text-destructive ml-1">*</span>
              </label>
              <input
                type="text"
                value={rncInput}
                onChange={(e) => setRncInput(e.target.value)}
                placeholder="Ej: 1-30-12345-4 o 123-4567890-1"
                className={`
                  w-full px-4 py-3 rounded-xl border bg-background
                  text-sm font-medium text-foreground placeholder:text-muted-foreground/50
                  focus:outline-none focus:ring-2
                  ${rncValidation?.valid
                    ? "border-green-500 focus:ring-green-500"
                    : rncValidation?.error
                      ? "border-destructive focus:ring-destructive"
                      : "border-border focus:ring-primary"
                  }
                `}
                disabled={isSubmitting}
              />

              {/* RNC Validation Feedback */}
              {rncValidation && (
                <div className="mt-3">
                  {rncValidation.valid ? (
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-3">
                      <div className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">
                            {rncValidation.type} válido
                          </p>
                          <p className="text-xs mt-1 font-medium">
                            Formato: {rncValidation.formatted}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                      <div className="flex items-start gap-2 text-sm text-destructive">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p className="font-medium">{rncValidation.error}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Name Input */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                <div className="w-1 h-4 bg-primary rounded-full"></div>
                Nombre del cliente
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={
                  rncValidation?.valid
                    ? `Por defecto: ${rncValidation.formatted}`
                    : "Ej: Nombre de la empresa"
                }
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground mt-2 ml-1 font-medium">
                💡 Opcional. Si se deja vacío, se usará el RNC como nombre.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <p className="text-sm text-destructive font-medium flex-1">{error}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 rounded-xl py-3 font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!rncValidation?.valid || isSubmitting}
                className="flex-1 rounded-xl py-3 font-bold bg-gradient-to-r from-primary to-[hsl(221_83%_63%)] hover:from-primary/90 hover:to-[hsl(221_83%_63%)]/90 shadow-md hover:shadow-lg transition-all"
              >
                {isSubmitting ? "Creando..." : "Crear cliente"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
