/**
 * UploadInvoiceModal Component
 *
 * Modal for uploading invoices with client selection.
 */

import { X } from "lucide-react";
import ClientSelector from "@/components/ClientSelector";
import InvoiceUploader from "@/components/InvoiceUploader";
import type { Client } from "@/types";

interface UploadInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClientRnc?: string;
  activeClientName?: string;
  onClientSelected?: (client: Client) => void;
  onAddClient?: () => void;
  onOpenAddClient?: () => void;
  onUploadComplete?: (totalUploaded: number) => void;
  userRole?: 'admin' | 'user';
}

export default function UploadInvoiceModal({
  isOpen,
  onClose,
  activeClientRnc,
  activeClientName,
  onClientSelected,
  onAddClient,
  onOpenAddClient,
  onUploadComplete,
  userRole = 'admin',
}: UploadInvoiceModalProps) {
  // Use onOpenAddClient if provided, otherwise fallback to onAddClient
  const handleAddClient = onOpenAddClient || onAddClient;
  const isAdmin = userRole === 'admin';

  console.log("[UploadInvoiceModal] Props:", {
    isOpen,
    activeClientRnc,
    activeClientName,
    userRole,
    hasOnClientSelected: !!onClientSelected
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl h-[90vh] overflow-y-auto">
        <div className="bg-card border border-border rounded-xl shadow-lg m-4">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                Subir Facturas
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isAdmin
                  ? 'Selecciona un cliente y sube las imágenes de las facturas'
                  : 'Sube las imágenes de las facturas'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Client Selector Section - Only show for admin users */}
            {isAdmin ? (
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Cliente
                </label>
                <ClientSelector
                  activeClientRnc={activeClientRnc}
                  activeClientName={activeClientName}
                  onClientSelected={(client) => {
                    console.log("[UploadInvoiceModal] Client selected, calling onClientSelected:", client);
                    if (onClientSelected) {
                      onClientSelected(client);
                    } else {
                      console.warn("[UploadInvoiceModal] onClientSelected is undefined!");
                    }
                  }}
                  onAddClient={handleAddClient || (() => {})}
                />
                {!activeClientRnc && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selecciona o crea un cliente para continuar
                  </p>
                )}
              </div>
            ) : (
              /* For non-admin users, show the pre-selected client */
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Cliente
                </label>
                <p className="text-lg font-semibold text-foreground">
                  {activeClientName || 'Cliente no asignado'}
                </p>
                {activeClientRnc && (
                  <p className="text-sm text-muted-foreground">
                    RNC: {activeClientRnc}
                  </p>
                )}
              </div>
            )}

            {/* Invoice Uploader Section */}
            {activeClientRnc && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Facturas
                </label>
                <InvoiceUploader
                  activeClientName={activeClientName}
                  onUploadComplete={(total) => {
                    onUploadComplete?.(total);
                    onClose();
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
