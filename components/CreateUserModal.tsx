/**
 * CreateUserModal Component
 *
 * Modal for creating a new user with email, password, name, and client assignments.
 * Admin only - Pro+ plan required.
 */

import { useState, useEffect, useRef } from "react";
import { X, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toast } from "primereact/toast";
import type { Client } from "@/types";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
  clients: Client[];
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onUserCreated,
  clients,
}: CreateUserModalProps) {
  const toast = useRef<Toast>(null);

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [fullNameInput, setFullNameInput] = useState("");
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);
  const [defaultClientId, setDefaultClientId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(emailInput);
  const isPasswordValid = passwordInput.length >= 8;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmailInput("");
      setPasswordInput("");
      setFullNameInput("");
      setSelectedClientIds([]);
      setDefaultClientId(null);
      setShowPassword(false);
      setError(null);
    }
  }, [isOpen]);

  // Auto-set default client when first client is selected
  useEffect(() => {
    if (selectedClientIds.length === 1 && defaultClientId === null) {
      setDefaultClientId(selectedClientIds[0]);
    }

    // Clear default if it's no longer selected
    if (defaultClientId && !selectedClientIds.includes(defaultClientId)) {
      setDefaultClientId(selectedClientIds[0] || null);
    }
  }, [selectedClientIds, defaultClientId]);

  const handleClientToggle = (clientId: number) => {
    setSelectedClientIds((prev) => {
      if (prev.includes(clientId)) {
        return prev.filter((id) => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!isEmailValid) {
      setError("Por favor ingresa un correo electrónico válido");
      return;
    }

    if (!isPasswordValid) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (selectedClientIds.length === 0) {
      setError("Selecciona al menos un cliente");
      return;
    }

    if (!defaultClientId) {
      setError("Selecciona un cliente predeterminado");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      email: emailInput.toLowerCase().trim(),
      password: passwordInput,
      fullName: fullNameInput.trim() || undefined,
      clientIds: selectedClientIds,
      defaultClientId,
    };

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el usuario");
      }

      const data = await response.json();

      toast.current?.show({
        severity: "success",
        summary: "Usuario creado",
        detail: `${data.user.email} creado exitosamente`,
        life: 3000,
      });

      onUserCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Toast ref={toast} />

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[51]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-card border border-border rounded-xl shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
            <h2 className="text-xl font-semibold text-foreground">
              Crear nuevo usuario
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Correo electrónico <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className={`
                  w-full px-4 py-2 rounded-lg
                  border bg-background
                  focus:outline-none focus:ring-2
                  ${
                    emailInput && isEmailValid
                      ? "border-green-500 focus:ring-green-500"
                      : emailInput && !isEmailValid
                        ? "border-destructive focus:ring-destructive"
                        : "border-border focus:ring-primary"
                  }
                `}
                disabled={isSubmitting}
                required
              />
              {emailInput && isEmailValid && (
                <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Correo válido</span>
                </div>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Contraseña <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className={`
                    w-full px-4 py-2 rounded-lg pr-10
                    border bg-background
                    focus:outline-none focus:ring-2
                    ${
                      passwordInput && isPasswordValid
                        ? "border-green-500 focus:ring-green-500"
                        : passwordInput && !isPasswordValid
                          ? "border-destructive focus:ring-destructive"
                          : "border-border focus:ring-primary"
                    }
                  `}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo 8 caracteres
              </p>
            </div>

            {/* Full Name Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground mt-1">Opcional</p>
            </div>

            {/* Client Assignment */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Clientes asignados <span className="text-destructive">*</span>
              </label>

              {clients.length === 0 ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-600 font-medium">
                        No hay clientes disponibles
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Crea al menos un cliente antes de crear usuarios.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto border border-border rounded-lg p-4 bg-background">
                  {clients.map((client) => {
                    const isSelected = selectedClientIds.includes(client.id);
                    const isDefault = defaultClientId === client.id;

                    return (
                      <div
                        key={client.id}
                        className={`
                          flex items-center justify-between p-3 rounded-lg border transition-all
                          ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted"
                          }
                        `}
                      >
                        {/* Checkbox */}
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleClientToggle(client.id)}
                            disabled={isSubmitting}
                            className="w-4 h-4 text-primary focus:ring-primary focus:ring-2 rounded"
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {client.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              RNC: {client.rnc}
                            </p>
                          </div>
                        </label>

                        {/* Default Radio */}
                        {isSelected && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="defaultClient"
                              checked={isDefault}
                              onChange={() => setDefaultClientId(client.id)}
                              disabled={isSubmitting}
                              className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
                            />
                            <span className="text-xs text-muted-foreground">
                              Predeterminado
                            </span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                Selecciona los clientes que este usuario podrá gestionar.
                {selectedClientIds.length > 0 &&
                  ` ${selectedClientIds.length} cliente${selectedClientIds.length !== 1 ? "s" : ""} seleccionado${selectedClientIds.length !== 1 ? "s" : ""}.`}
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
                disabled={
                  !isEmailValid ||
                  !isPasswordValid ||
                  selectedClientIds.length === 0 ||
                  !defaultClientId ||
                  isSubmitting
                }
                className="flex-1"
              >
                {isSubmitting ? "Creando..." : "Crear usuario"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
