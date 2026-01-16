/**
 * UploadInvoiceModal Component
 *
 * Modal for uploading invoices with client selection.
 */

import { X, Upload } from "lucide-react";
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
      {/* Backdrop - Enhanced */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
        onClick={onClose}
      />

      {/* Modal - Solid White */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl h-[90vh] overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-[0_24px_64px_0_rgba(0,0,0,0.3)] m-4">
          {/* Header - Glassmorphic with Gradient */}
          <div className="flex items-center justify-between p-6 sm:p-8 border-b border-[var(--glass-border)] bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center shadow-md">
                  <Upload className="w-6 h-6 text-primary drop-shadow-sm" />
                </div>
                Subir Facturas
              </h2>
              <p className="text-sm text-muted-foreground mt-2 font-medium">
                {isAdmin
                  ? 'Selecciona un cliente y sube las imágenes de las facturas'
                  : 'Sube las imágenes de las facturas'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="group text-muted-foreground hover:text-foreground transition-all p-2 hover:bg-[var(--glass-white)] rounded-xl border border-transparent hover:border-[var(--glass-border)] shadow-sm"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Content - Enhanced */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Client Selector Section - Only show for admin users */}
            {isAdmin ? (
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-muted-foreground mb-4 uppercase tracking-widest">
                  <div className="w-1 h-5 bg-primary rounded-full"></div>
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
                  <p className="mt-3 text-sm text-muted-foreground font-medium px-1">
                    💡 Selecciona o crea un cliente para continuar
                  </p>
                )}
              </div>
            ) : (
              /* For non-admin users, show the pre-selected client */
              <div className="bg-muted/30 border border-border rounded-xl p-5">
                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                  <div className="w-1 h-4 bg-primary rounded-full"></div>
                  Cliente
                </label>
                <p className="text-lg font-bold text-foreground">
                  {activeClientName || 'Cliente no asignado'}
                </p>
                {activeClientRnc && (
                  <p className="text-sm text-muted-foreground mt-1 font-medium">
                    RNC: {activeClientRnc}
                  </p>
                )}
              </div>
            )}

            {/* Invoice Uploader Section */}
            {activeClientRnc && (
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-muted-foreground mb-4 uppercase tracking-widest">
                  <div className="w-1 h-5 bg-primary rounded-full"></div>
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
