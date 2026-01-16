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
  isAdmin?: boolean;
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
  isAdmin = false,
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
    <section className="mb-8 rounded-2xl bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] overflow-hidden relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
      {/* Header with Toggle and Export Buttons - Glassmorphic */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-[var(--glass-border)] px-4 sm:px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left: Filter Title and Summary */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-3 hover:opacity-80 transition-all text-left flex-1 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
              <Filter className="w-5 h-5 text-primary drop-shadow-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Filtros de Reporte
                </h2>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform" />
                )}
              </div>
              {!isExpanded && (
                <p className="text-sm text-muted-foreground truncate mt-1 font-medium">
                  {getFilterSummary()}
                </p>
              )}
            </div>
          </button>

          {/* Export Buttons - Glassmorphic Gradient */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onExportStats}
              disabled={statsLoading}
              className="group flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-[hsl(221_83%_63%)] text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Exportar Reporte</span>
            </button>

            <button
              onClick={onExportInvoices}
              disabled={invoiceCount === 0}
              className="group flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] text-foreground hover:bg-[var(--glass-white)]/80 hover:shadow-md transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Exportar Facturas (606)</span>
              <span className="sm:hidden">606</span>
              {invoiceCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
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
          {/* Client Filter Buttons - Pill Style */}
          {isAdmin && (<div>
            <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest">
              <div className="w-1 h-4 bg-primary rounded-full"></div>
              Filtrar por cliente
            </label>
            <div className="flex flex-wrap gap-3">
              {/* All clients button - Pill style */}
              <button
                onClick={() => onClientSelect(null)}
                data-state={selectedClientId === null ? "active" : "inactive"}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${selectedClientId === null
                  ? "bg-[#3B82F6] text-white shadow-md hover:bg-[#2563EB] hover:shadow-lg scale-[1.02]"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
              >
                Todos los clientes
              </button>

              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => onClientSelect(client.id)}
                  data-state={selectedClientId === client.id ? "active" : "inactive"}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${selectedClientId === client.id
                    ? "bg-[#3B82F6] text-white shadow-md hover:bg-[#2563EB] hover:shadow-lg scale-[1.02]"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                >
                  {client.name}
                </button>
              ))}
            </div>
          </div>)}

          {/* Divider */}

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
