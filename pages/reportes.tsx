import { useState, useEffect, useCallback, useRef } from "react";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import DashboardLayout from "@/components/DashboardLayout";
import ReportFilterSection from "@/components/ReportFilterSection";
import UnifiedDateFilter from "@/components/UnifiedDateFilter";
import InvoiceDataTable from "@/components/InvoiceDataTable";
import EditInvoiceModal from "@/components/EditInvoiceModal";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  DollarSign,
  Calendar as CalendarIcon,
  Users,
  ChevronRight,
} from "lucide-react";
import * as XLSX from "xlsx";
import type {
  Invoice,
  Client,
  InvoicesResponse,
  ErrorResponse,
} from "@/types";
import { ALL_COLUMNS } from "@/utils/Invoice-columns";
import { useProcessing } from "@/contexts/ProcessingContext";
import { useRouter } from "next/router";

interface ReportStats {
  totalInvoices: number;
  totalAmount: number;
  averageAmount: number;
  thisMonth: number;
  lastMonth: number;
  monthlyGrowth: number;
  topClients: Array<{ name: string; count: number; amount: number }>;
  monthlyBreakdown: Array<{ month: string; count: number; amount: number }>;
}

const STORAGE_KEY = "dashboard_visible_columns";

export default function ReportesPage() {
  const toast = useRef<Toast>(null);
  const { onProcessingComplete } = useProcessing();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const router = useRouter();

  // Unified filter state - Initialize with current month by default
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1); // First day of month
  });
  const [toDate, setToDate] = useState<Date | null>(new Date()); // Today

  // Invoice list state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalInvoices, setTotalInvoices] = useState<number>(0);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    // Default visible columns
    return ALL_COLUMNS.filter((col) => col.defaultVisible).map(
      (col) => col.field
    );
  });

  useEffect(() => {
    fetchClients();
    fetchReportStats();
  }, []);

  // Note: User data is now fetched by DashboardLayout and passed via render prop
  // Active client is auto-selected within the render prop function

  useEffect(() => {
    fetchReportStats();
  }, [fromDate, toDate, selectedClientId]);

  // Save column preferences to localStorage
  const handleColumnChange = (selectedColumns: string[]) => {
    // Always keep actions column visible
    const columnsToSave = selectedColumns.includes("actions")
      ? selectedColumns
      : [...selectedColumns, "actions"];
    setVisibleColumns(columnsToSave);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnsToSave));
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };


  const fetchReportStats = async () => {
    try {
      const params = new URLSearchParams();

      if (fromDate) {
        params.append("from", formatDateForAPI(fromDate));
      }
      if (toDate) {
        params.append("to", formatDateForAPI(toDate));
      }
      if (selectedClientId !== null) {
        params.append("clientId", String(selectedClientId));
      }

      const response = await fetch(`/api/reports/stats?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch report stats");
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching report stats:", error);
      // Set empty stats on error
      setStats({
        totalInvoices: 0,
        totalAmount: 0,
        averageAmount: 0,
        thisMonth: 0,
        lastMonth: 0,
        monthlyGrowth: 0,
        topClients: [],
        monthlyBreakdown: [],
      });
    }
  };

  // Fetch invoices with date filters
  const fetchInvoices = useCallback(async () => {
    // if (!userData) {
    //   console.log("fetchInvoices: userData is not available yet");
    //   return;
    // }

    setLoadingInvoices(true);
    console.log("fetchInvoices called with filters:", { fromDate, toDate, selectedClientId });

    try {
      const params = new URLSearchParams();

      if (fromDate) {
        params.set("from", formatDateForAPI(fromDate));
      }
      if (toDate) {
        params.set("to", formatDateForAPI(toDate));
      }
      if (selectedClientId !== null) {
        params.set("clientId", selectedClientId.toString());
      }

      const url = `/api/invoices${params.toString() ? `?${params.toString()}` : ""
        }`;
      console.log("Fetching invoices from:", url);
      const response = await fetch(url);
      const data: InvoicesResponse | ErrorResponse = await response.json();

      if (!response.ok) {
        console.error(
          "Error fetching invoices:",
          (data as ErrorResponse).error
        );
        setInvoices([]);
        setTotalInvoices(0);
        return;
      }

      const invoicesData = data as InvoicesResponse;
      console.log("Received invoices:", invoicesData.invoices?.length, "invoices");

      // Filter out pending/processing invoices - only show fully processed ones
      const completed = invoicesData.invoices.filter(inv =>
        inv.status === "OK" || inv.status === "REVIEW" || inv.status === "ERROR" || inv.status === "processed"
      );
      console.log("After filtering pending:", completed.length, "completed invoices");

      setInvoices(completed);
      setTotalInvoices(completed.length);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setInvoices([]);
      setTotalInvoices(0);
    } finally {
      setLoadingInvoices(false);
    }
  }, [fromDate, toDate, selectedClientId]);

  // Fetch invoices when filters change
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Subscribe to processing completion events
  useEffect(() => {
    const unsubscribe = onProcessingComplete(async () => {
      // Refresh report stats
      await fetchReportStats();

      // Refresh invoice list
      await fetchInvoices();
    });

    return unsubscribe;
  }, [onProcessingComplete, fetchInvoices]);

  // Edit invoice handler
  const handleEditInvoice = (invoice: Invoice) => {
    setInvoiceToEdit(invoice);
    setShowEditModal(true);
  };

  // Save invoice handler
  const handleSaveInvoice = async (updatedInvoice: Partial<Invoice>) => {
    if (!invoiceToEdit) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceToEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedInvoice),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar la factura");
      }

      // Refresh data
      await fetchInvoices();
      await fetchReportStats();

      toast.current?.show({
        severity: "success",
        summary: "Factura actualizada",
        detail: "Los cambios se han guardado correctamente",
        life: 3000,
      });

      setShowEditModal(false);
      setInvoiceToEdit(null);
    } catch (err) {
      console.error("Error updating invoice:", err);
      throw err; // Re-throw to let the modal handle it
    }
  };

  // Delete invoice handler
  const handleDeleteInvoice = (invoice: Invoice) => {
    confirmDialog({
      message: `¿Está seguro que desea eliminar la factura ${invoice.ncf}?`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName:
        "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg ml-2",
      rejectClassName:
        "bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg",
      accept: async () => {
        try {
          const response = await fetch(`/api/invoices/${invoice.id}`, {
            method: "DELETE",
            credentials: "include",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Error al eliminar la factura");
          }

          // Refresh data
          await fetchInvoices();
          await fetchReportStats();

          toast.current?.show({
            severity: "success",
            summary: "Factura eliminada",
            detail: "La factura se ha eliminado correctamente",
            life: 3000,
          });
        } catch (err) {
          console.error("Error deleting invoice:", err);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: err instanceof Error ? err.message : "Error al eliminar la factura",
            life: 5000,
          });
        }
      },
    });
  };

  // Export stats report to Excel
  const exportStatsToExcel = () => {
    if (!stats) return;

    const rows = [
      { Métrica: "Total de Facturas", Valor: stats.totalInvoices },
      {
        Métrica: "Monto Total",
        Valor: `$${stats.totalAmount.toLocaleString()}`,
      },
      {
        Métrica: "Monto Promedio",
        Valor: `$${stats.averageAmount.toLocaleString()}`,
      },
      { Métrica: "Crecimiento Mensual", Valor: `${stats.monthlyGrowth}%` },
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estadísticas");

    // Add monthly breakdown sheet
    if (stats.monthlyBreakdown.length > 0) {
      const breakdownWs = XLSX.utils.json_to_sheet(stats.monthlyBreakdown);
      XLSX.utils.book_append_sheet(wb, breakdownWs, "Por Mes");
    }

    // Add top clients sheet
    if (stats.topClients.length > 0) {
      const clientsWs = XLSX.utils.json_to_sheet(stats.topClients);
      XLSX.utils.book_append_sheet(wb, clientsWs, "Top Clientes");
    }

    const filename = `reporte_estadisticas_${formatDateForAPI(new Date())}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // Export to Excel (606 format)
  const exportToExcel606 = () => {
    const rows = invoices.map((inv) => ({
      RNC: inv.rnc,
      FECHA: inv.fecha,
      "NOMBRE COMPAÑÍA": inv.nombre_compania || inv.client_name,
      "NO. COMPROBANTE FISCAL": inv.ncf,
      MATERIALES: inv.materiales ?? "",
      "MONTO EN SERVICIO EXENTO": inv.monto_servicio_exento ?? 0,
      "MONTO EN BIEN EXENTO": inv.monto_bien_exento ?? 0,
      "TOTAL DE MONTOS EXENTO":
        inv.total_montos_exento ??
        (inv.monto_servicio_exento ?? 0) + (inv.monto_bien_exento ?? 0),
      "MONTO EN SERVICIO GRAVADO": inv.monto_servicio_gravado ?? 0,
      "MONTO EN BIEN GRAVADO": inv.monto_bien_gravado ?? 0,
      "TOTAL DE MONTOS GRAVADO":
        inv.total_montos_gravado ??
        (inv.monto_servicio_gravado ?? 0) + (inv.monto_bien_gravado ?? 0),
      "ITBIS SERVICIOS": inv.itbis_servicios ?? 0,
      "ITBIS COMPRAS BIENES": inv.itbis_bienes ?? 0,
      "TOTAL FACTURADO EN ITBIS":
        inv.total_facturado_itbis ??
        (inv.itbis_servicios ?? 0) + (inv.itbis_bienes ?? 0),
      "ITBIS SERVICIOS RETENIDO": inv.itbis_servicios_retenido ?? 0,
      "RETENCION 30% ITBIS": inv.retencion_30_itbis ?? 0,
      "RETENCION 10%": inv.retencion_10 ?? 0,
      "RETENCION 2%": inv.retencion_2 ?? 0,
      PROPINA: inv.propina ?? inv.propina_legal ?? 0,
      "TOTAL FACTURADO": inv.total_facturado ?? 0,
      "TOTAL A COBRAR": inv.total_a_cobrar ?? 0,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "606");

    // Build filename with client name and month
    const parts = ["606"];

    // Add client name if filtering by specific client
    if (selectedClientId) {
      const selectedClient = clients.find((c) => c.id === selectedClientId);
      if (selectedClient?.name) {
        parts.push(selectedClient.name.replace(/[^a-zA-Z0-9]/g, "_"));
      }
    }

    // Add month and year from date range (use fromDate if available, otherwise current month)
    const monthDate = fromDate || new Date();
    const monthName = monthDate.toLocaleString("es-DO", { month: "long" });
    const year = monthDate.getFullYear();
    parts.push(monthName);
    parts.push(year.toString());

    const filename = `${parts.join("_")}.xlsx`;

    XLSX.writeFile(wb, filename);
  };


  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="flex items-center gap-3 text-muted-foreground">
  //         <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
  //         <span>Cargando...</span>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <DashboardLayout
      title="Reportes - ContableBot Portal"
      description="Reportes y estadísticas de facturas"
    >
      {(userData) => {
        return (
          <>
            <Toast ref={toast} />
            <ConfirmDialog />

            <EditInvoiceModal
              invoice={invoiceToEdit}
              visible={showEditModal}
              onHide={() => {
                setShowEditModal(false);
                setInvoiceToEdit(null);
              }}
              onSave={handleSaveInvoice}
              clients={clients}
            />

            {/* Page Title */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Reportes
              </h1>
              <p className="text-muted-foreground">
                Análisis y estadísticas de tus facturas procesadas
              </p>
            </div>

            {/* Unified Filter Section - Only show for admin users */}

            <ReportFilterSection
              clients={clients}
              selectedClientId={selectedClientId}
              onClientSelect={setSelectedClientId}
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
              onClearFilters={() => {
                setSelectedClientId(null);
                // Reset to current month default
                const now = new Date();
                setFromDate(new Date(now.getFullYear(), now.getMonth(), 1));
                setToDate(new Date());
              }}
              onExportStats={exportStatsToExcel}
              onExportInvoices={exportToExcel606}
              statsLoading={!stats}
              invoiceCount={totalInvoices}
              isAdmin={userData?.role === "admin"}
            />

            {/* Stats Cards Grid with Enhanced 3D Glassmorphic Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Invoices */}
              <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.25),0_6px_24px_0_rgba(31,38,135,0.15),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.5),0_6px_24px_0_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:translate-y-[-6px] transition-all duration-300 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/40 to-primary/10 rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(59,130,246,0.2)]">
                    <FileText className="w-7 h-7 text-primary drop-shadow-sm" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-foreground tabular-nums">
                    {stats?.totalInvoices}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Facturas procesadas
                  </p>
                </div>
              </div>

              {/* Total Amount */}
              <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.25),0_6px_24px_0_rgba(31,38,135,0.15),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.5),0_6px_24px_0_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:translate-y-[-6px] transition-all duration-300 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(16,185,129,0.2)]">
                    <DollarSign className="w-7 h-7 text-emerald-500 drop-shadow-sm" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Monto
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-foreground tabular-nums">
                    ${stats?.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Monto total</p>
                </div>
              </div>

              {/* This Month */}
              <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.25),0_6px_24px_0_rgba(31,38,135,0.15),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.5),0_6px_24px_0_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:translate-y-[-6px] transition-all duration-300 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/40 to-primary/10 rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(59,130,246,0.2)]">
                    <CalendarIcon className="w-7 h-7 text-primary drop-shadow-sm" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Este mes
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-foreground tabular-nums">
                    {stats?.thisMonth}
                  </p>
                  <div className="flex items-center gap-2">
                    {stats && stats.monthlyGrowth > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <p className="text-sm text-emerald-500 font-medium">
                          +{stats.monthlyGrowth}% vs mes anterior
                        </p>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 text-destructive" />
                        <p className="text-sm text-destructive font-medium">
                          {stats?.monthlyGrowth}% vs mes anterior
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Average Amount */}
              <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.25),0_6px_24px_0_rgba(31,38,135,0.15),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.5),0_6px_24px_0_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:translate-y-[-6px] transition-all duration-300 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500/30 to-amber-500/10 rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(245,158,11,0.2)]">
                    <TrendingUp className="w-7 h-7 text-amber-500 drop-shadow-sm" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Promedio
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-foreground tabular-nums">
                    ${stats?.averageAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Monto promedio</p>
                </div>
              </div>
            </div>

            {/* Charts Section with 3D Glassmorphic Design */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Monthly Breakdown */}
              <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Evolución mensual
                  </h2>
                  <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                </div>

                <div className="space-y-4">
                  {stats?.monthlyBreakdown.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">
                          {item.month}
                        </span>
                        <span className="text-muted-foreground">
                          {item.count} facturas
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{
                              width: `${(item.count / (stats?.totalInvoices || 1)) * 100
                                }%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-foreground min-w-[100px] text-right">
                          ${item.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Clients */}
              <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Clientes principales
                  </h2>
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>

                <div className="space-y-3">
                  {stats?.topClients.map((client, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20">
                          <span className="text-sm font-bold text-primary">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {client.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {client.count} facturas
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          ${client.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(
                            (client.amount / (stats?.totalAmount || 1)) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary hover:bg-muted transition-colors text-sm font-medium text-foreground"
                >
                  Ver todos los clientes
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Facturas Section with 3D Glassmorphic Design */}
            <section className="rounded-2xl bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    Facturas
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    ({totalInvoices} resultados)
                  </span>
                </div>
              </div>

              <InvoiceDataTable
                invoices={invoices}
                loading={loadingInvoices}
                visibleColumns={visibleColumns}
                onColumnChange={handleColumnChange}
                onEditInvoice={handleEditInvoice}
                onDeleteInvoice={handleDeleteInvoice}
                emptyMessage="Ajusta los filtros o envía nuevas facturas desde el bot de Telegram."
              />
            </section>
          </>
        );
      }}
    </DashboardLayout>
  );
}

// Helper functions
function formatDateForAPI(date: Date): string {
  return date.toISOString().split("T")[0];
}
