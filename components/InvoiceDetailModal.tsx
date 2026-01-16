/**
 * InvoiceDetailModal Component
 *
 * Modal for viewing invoice details in read-only mode.
 */

import { X, FileText } from "lucide-react";
import type { Invoice } from "@/types";

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export default function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
}: InvoiceDetailModalProps) {
  if (!isOpen || !invoice) return null;

  // Helper function to format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Helper function to format date
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("es-DO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-[0_24px_64px_0_rgba(0,0,0,0.3)] m-4">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--glass-border)] bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5 text-primary drop-shadow-sm" />
                </div>
                Detalle de Factura
              </h2>
              <p className="text-sm text-muted-foreground mt-2 font-medium">
                {invoice.ncf || "Sin NCF"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="group text-muted-foreground hover:text-foreground transition-all p-2 hover:bg-[var(--glass-white)] rounded-xl border border-transparent hover:border-[var(--glass-border)] shadow-sm"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Invoice Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Cliente</p>
                <p className="font-medium text-foreground">{invoice.client_name || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">NCF</p>
                <p className="font-medium text-foreground">{invoice.ncf || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">RNC</p>
                <p className="font-medium text-foreground">{invoice.rnc || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Fecha</p>
                <p className="font-medium text-foreground">{formatDate(invoice.fecha)}</p>
              </div>
            </div>

            {/* Amounts Section */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Montos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Monto Servicio Gravado</p>
                  <p className="font-medium text-foreground">{formatCurrency(invoice.monto_servicio_gravado)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Monto Bien Gravado</p>
                  <p className="font-medium text-foreground">{formatCurrency(invoice.monto_bien_gravado)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Monto Servicio Exento</p>
                  <p className="font-medium text-foreground">{formatCurrency(invoice.monto_servicio_exento)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Monto Bien Exento</p>
                  <p className="font-medium text-foreground">{formatCurrency(invoice.monto_bien_exento)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Facturado ITBIS</p>
                  <p className="font-medium text-foreground">{formatCurrency(invoice.total_facturado_itbis)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">ITBIS Servicios Retenido</p>
                  <p className="font-medium text-foreground">{formatCurrency(invoice.itbis_servicios_retenido)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Facturado</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(invoice.total_facturado)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total a Cobrar</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(invoice.total_a_cobrar)}</p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Información Adicional</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {invoice.materiales && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Materiales</p>
                    <p className="font-medium text-foreground">{invoice.materiales}</p>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Estado</p>
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      invoice.status?.toLowerCase() === "ok" || invoice.status?.toLowerCase() === "processed"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {invoice.status || "-"}
                  </span>
                </div>

                {invoice.created_at && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Fecha de Carga</p>
                    <p className="font-medium text-foreground">{formatDate(invoice.created_at)}</p>
                  </div>
                )}

                {invoice.processed_at && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Fecha de Procesamiento</p>
                    <p className="font-medium text-foreground">{formatDate(invoice.processed_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quality Flags if present */}
            {invoice.flag_dudoso && (
              <div className="border-t border-border pt-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-600 mb-1">Marcado como dudoso</p>
                      {invoice.razon_duda && (
                        <p className="text-xs text-muted-foreground">{invoice.razon_duda}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-[var(--glass-border)]">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
