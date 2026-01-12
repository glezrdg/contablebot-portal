/**
 * ReportFilterSection Component
 *
 * Master filter container for the reports page.
 * Combines client filtering, date range filtering, and export functionality
 * into a single unified interface that controls both stats and invoice table.
 * Features collapsible design to save space with filter summary when collapsed.
 */

import { useState } from "react";
import ClientFilterButtons from "./ClientFilterButtons";
import UnifiedDateFilter from "./UnifiedDateFilter";
import { Download, FileSpreadsheet, Filter, ChevronDown, ChevronUp } from "lucide-react";
import type { Client } from "@/types";

interface ReportFilterSectionProps {
  // Client filtering
  clients: Client[];
  selectedClientId: number | null;
  onClientSelect: (clientId: number | null) => void;

  // Date filtering
  fromDate: Date | null;
  toDate: Date | null;
  onFromDateChange: (date: Date | null) => void;
  onToDateChange: (date: Date | null) => void;

  // Actions
  onClearFilters: () => void;
  onExportStats: () => void;
  onExportInvoices: () => void;

  // State info
  statsLoading?: boolean;
  invoiceCount?: number;
}

export default function ReportFilterSection({
  clients,
  selectedClientId,
  onClientSelect,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClearFilters,
  onExportStats,
  onExportInvoices,
  statsLoading = false,
  invoiceCount = 0,
}: ReportFilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate filter summary
  const getFilterSummary = () => {
    const parts: string[] = [];

    // Client filter
    if (selectedClientId) {
      const client = clients.find((c) => c.id === selectedClientId);
      if (client) {
        parts.push(`Cliente: ${client.name}`);
      }
    } else {
      parts.push("Todos los clientes");
    }

    // Date filter
    if (fromDate && toDate) {
      const formatDate = (date: Date) => {
        return date.toLocaleDateString("es-DO", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      };
      parts.push(`${formatDate(fromDate)} - ${formatDate(toDate)}`);
    }

    return parts.join(" • ");
  };

  return (
    <section className="mb-8 rounded-2xl bg-card border border-border shadow-lg overflow-hidden">
      {/* Header with Toggle and Export Buttons */}
      <div className="bg-muted/30 border-b border-border px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left: Filter Title and Summary */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left flex-1"
          >
            <Filter className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Filtros de Reporte
                </h2>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              {!isExpanded && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {getFilterSummary()}
                </p>
              )}
            </div>
          </button>

          {/* Export Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={onExportStats}
              disabled={statsLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Reporte</span>
            </button>

            <button
              onClick={onExportInvoices}
              disabled={invoiceCount === 0}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-foreground hover:bg-muted transition-all text-sm font-medium border border-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Facturas (606)</span>
              {invoiceCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                  {invoiceCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content - Only show when expanded */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
        {/* Client Filter Buttons */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Filtrar por cliente
          </label>
          <div className="flex flex-wrap gap-2">
            {/* All clients button */}
            <button
              onClick={() => onClientSelect(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedClientId === null
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-foreground hover:bg-muted border border-border"
              }`}
            >
              Todos los clientes
            </button>

            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => onClientSelect(client.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedClientId === client.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-foreground hover:bg-muted border border-border"
                }`}
              >
                {client.name}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Date Filter */}
        <UnifiedDateFilter
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={onFromDateChange}
          onToDateChange={onToDateChange}
          onClearFilters={onClearFilters}
        />
        </div>
      )}
    </section>
  );
}
