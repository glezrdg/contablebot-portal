/**
 * AddClientModal Component
 *
 * Modal for creating a new client with RNC validation and real-time formatting.
 */

import { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[51]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-md">
        <div className="bg-card border border-border rounded-xl shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">
              Agregar nuevo cliente
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* RNC Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                RNC o Cédula <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={rncInput}
                onChange={(e) => setRncInput(e.target.value)}
                placeholder="Ej: 1-30-12345-4 o 123-4567890-1"
                className={`
                  w-full px-4 py-2 rounded-lg
                  border bg-background
                  focus:outline-none focus:ring-2
                  ${
                    rncValidation?.valid
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
                <div className="mt-2">
                  {rncValidation.valid ? (
                    <div className="flex items-start gap-2 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {rncValidation.type} válido
                        </p>
                        <p className="text-xs">
                          Formato: {rncValidation.formatted}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>{rncValidation.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
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
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Opcional. Si se deja vacío, se usará el RNC como nombre.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!rncValidation?.valid || isSubmitting}
                className="flex-1"
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
