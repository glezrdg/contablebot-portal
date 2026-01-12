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
  onClientSelected: (client: Client) => void;
  onAddClient: () => void;
  onUploadComplete: (totalUploaded: number) => void;
}

export default function UploadInvoiceModal({
  isOpen,
  onClose,
  activeClientRnc,
  activeClientName,
  onClientSelected,
  onAddClient,
  onUploadComplete,
}: UploadInvoiceModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
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
                Selecciona un cliente y sube las imágenes de las facturas
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
            {/* Client Selector Section */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Cliente
              </label>
              <ClientSelector
                activeClientRnc={activeClientRnc}
                activeClientName={activeClientName}
                onClientSelected={onClientSelected}
                onAddClient={onAddClient}
              />
              {!activeClientRnc && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selecciona o crea un cliente para continuar
                </p>
              )}
            </div>

            {/* Invoice Uploader Section */}
            {activeClientRnc && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Facturas
                </label>
                <InvoiceUploader
                  activeClientName={activeClientName}
                  onUploadComplete={(total) => {
                    onUploadComplete(total);
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
