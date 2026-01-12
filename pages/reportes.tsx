import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import AdminHeader from "@/components/AdminHeader";
import ClientFilterButtons from "@/components/ClientFilterButtons";
import DateFilterSection from "@/components/DateFilterSection";
import InvoiceDataTable from "@/components/InvoiceDataTable";
import ExportButtons from "@/components/ExportButtons";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  DollarSign,
  Calendar as CalendarIcon,
  Users,
  Download,
  Filter,
  ChevronRight,
} from "lucide-react";
import * as XLSX from "xlsx";
import type {
  MeResponse,
  Invoice,
  Client,
  InvoicesResponse,
  ErrorResponse,
} from "@/types";
import { ALL_COLUMNS } from "@/utils/Invoice-columns";

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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<MeResponse | null>(null);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "month" | "quarter" | "year"
  >("month");
  const [selectedClient, setSelectedClient] = useState<number | null>(null);

  // Invoice list state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalInvoices, setTotalInvoices] = useState<number>(0);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [selectedClientFilter, setSelectedClientFilter] = useState<
    number | null
  >(null);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    // Default visible columns
    return ALL_COLUMNS.filter((col) => col.defaultVisible).map(
      (col) => col.field
    );
  });

  useEffect(() => {
    fetchUserData();
    fetchClients();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchReportStats();
    }
  }, [selectedPeriod, selectedClient, userData]);

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

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/me");
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch user data");
      }
      const data: MeResponse = await response.json();
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportStats = async () => {
    try {
      const params = new URLSearchParams({
        period: selectedPeriod,
      });

      if (selectedClient !== null) {
        params.append("clientId", String(selectedClient));
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
    if (!userData) return;

    setLoadingInvoices(true);

    try {
      const params = new URLSearchParams();

      if (fromDate) {
        params.set("from", formatDateForAPI(fromDate));
      }
      if (toDate) {
        params.set("to", formatDateForAPI(toDate));
      }
      if (selectedClientFilter) {
        params.set("clientId", selectedClientFilter.toString());
      }

      const url = `/api/invoices${
        params.toString() ? `?${params.toString()}` : ""
      }`;
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
      setInvoices(invoicesData.invoices);
      setTotalInvoices(invoicesData.total || 0);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setInvoices([]);
      setTotalInvoices(0);
    } finally {
      setLoadingInvoices(false);
    }
  }, [userData, fromDate, toDate, selectedClientFilter]);

  // Fetch invoices when filters change
  useEffect(() => {
    if (userData) {
      fetchInvoices();
    }
  }, [userData, fromDate, toDate, selectedClientFilter, fetchInvoices]);

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
    if (selectedClientFilter) {
      const selectedClient = clients.find((c) => c.id === selectedClientFilter);
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

  // Export to CSV
  const exportToCSV = () => {
    const rows = invoices.map((inv) => ({
      Fecha: inv.fecha || "Sin fecha",
      Cliente: inv.client_name,
      RNC: inv.rnc,
      NCF: inv.ncf,
      "Total Facturado": inv.total_facturado,
      "Total a Cobrar": inv.total_a_cobrar ?? inv.total_facturado,
      Estado: inv.status,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Facturas");
    XLSX.writeFile(
      wb,
      `facturas_${new Date().toISOString().slice(0, 10)}.csv`,
      {
        bookType: "csv",
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Reportes - ContableBot Portal</title>
        <meta
          name="description"
          content="Reportes y estadísticas de facturas"
        />
      </Head>

      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <AdminHeader
            firmName={userData?.firmName || ""}
            userEmail={userData?.email || ""}
            usedThisMonth={userData?.usedThisMonth || 0}
            planLimit={userData?.planLimit || 0}
            manageUrl={userData?.manageUrl}
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

          {/* Filters Section */}
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Filtros
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {/* Client Filter */}
                <select
                  value={selectedClient!}
                  onChange={(e) =>
                    setSelectedClient(Number(e.target.value) || null)
                  }
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-foreground border border-border hover:bg-muted transition-colors"
                >
                  <option value="all">Todos los clientes</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.id || null}
                    </option>
                  ))}
                </select>

                {/* Period Filter */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPeriod("month")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === "month"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-muted"
                    }`}
                  >
                    Este mes
                  </button>
                  <button
                    onClick={() => setSelectedPeriod("quarter")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === "quarter"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-muted"
                    }`}
                  >
                    Trimestre
                  </button>
                  <button
                    onClick={() => setSelectedPeriod("year")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === "year"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-muted"
                    }`}
                  >
                    Año
                  </button>
                </div>

                {/* Export Button */}
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
                  <Download className="w-4 h-4" />
                  Exportar reporte
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Invoices */}
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-foreground">
                  {stats?.totalInvoices}
                </p>
                <p className="text-sm text-muted-foreground">
                  Facturas procesadas
                </p>
              </div>
            </div>

            {/* Total Amount */}
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-500" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Monto
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-foreground">
                  ${stats?.totalAmount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Monto total</p>
              </div>
            </div>

            {/* This Month */}
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Este mes
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-foreground">
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
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-500" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Promedio
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-foreground">
                  ${stats?.averageAmount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Monto promedio</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Breakdown */}
            <div className="bg-card border border-border rounded-xl p-6">
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
                            width: `${
                              (item.count / (stats?.totalInvoices || 1)) * 100
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
            <div className="bg-card border border-border rounded-xl p-6">
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

          {/* Client Filter */}
          <ClientFilterButtons
            clients={clients}
            selectedClientId={selectedClientFilter}
            onClientSelect={setSelectedClientFilter}
          />

          {/* Date Filters Section */}
          <DateFilterSection
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            onClearFilters={() => {
              setFromDate(null);
              setToDate(null);
              setSelectedClientFilter(null);
            }}
          />

          {/* Facturas Section */}
          <section className="rounded-2xl bg-card border border-border p-5 shadow-lg">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Facturas
                </h2>
                <span className="text-sm text-muted-foreground">
                  ({totalInvoices} resultados)
                </span>
              </div>

              <ExportButtons
                onExportExcel={exportToExcel606}
                onExportCSV={exportToCSV}
                disabled={invoices.length === 0}
              />
            </div>

            <InvoiceDataTable
              invoices={invoices}
              loading={loadingInvoices}
              visibleColumns={visibleColumns}
              onColumnChange={handleColumnChange}
              emptyMessage="Ajusta los filtros o envía nuevas facturas desde el bot de Telegram."
            />
          </section>
        </div>
      </div>
    </>
  );
}

// Helper functions
function formatDateForAPI(date: Date): string {
  return date.toISOString().split("T")[0];
}
