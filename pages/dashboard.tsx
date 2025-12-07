// /pages/dashboard.tsx - Protected dashboard with invoices table
// PrimeReact CSS imports are in _app.tsx:
//   import "primereact/resources/themes/lara-light-indigo/theme.css";
//   import "primereact/resources/primereact.min.css";
//   import "primeicons/primeicons.css";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import * as XLSX from "xlsx";
import type {
  Invoice,
  InvoicesResponse,
  MeResponse,
  ErrorResponse,
} from "../types";

export default function DashboardPage() {
  const router = useRouter();

  // Firm data from /api/me
  const [firmId, setFirmId] = useState<number | null>(null);
  const [firmName, setFirmName] = useState<string>("");
  const [usageCurrentMonth, setUsageCurrentMonth] = useState<number>(0);
  const [planLimit, setPlanLimit] = useState<number>(0);
  const [userEmail, setUserEmail] = useState<string>("");

  // Filter state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [clientFilter, setClientFilter] = useState("");

  // Invoices data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMe, setLoadingMe] = useState(true);
  const [error, setError] = useState("");

  // Calculate usage percentage
  const usagePercentage =
    planLimit > 0 ? Math.min((usageCurrentMonth / planLimit) * 100, 100) : 0;

  // Fetch user/firm info on mount
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await fetch("/api/me");

        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/login");
            return;
          }
          throw new Error("Failed to fetch user info");
        }

        const data: MeResponse = await response.json();
        setFirmId(data.firmId);
        setFirmName(data.firmName);
        setUsageCurrentMonth(data.usageCurrentMonth);
        setPlanLimit(data.planLimit);
        setUserEmail(data.email);
      } catch (err) {
        console.error("Error fetching /api/me:", err);
        router.replace("/login");
      } finally {
        setLoadingMe(false);
      }
    };

    fetchMe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    }
    router.replace("/login");
  };

  const handleApplyFilters = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!firmId) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (clientFilter.trim()) params.set("client", clientFilter.trim());

      const url = `/api/invoices${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await fetch(url);
      const data: InvoicesResponse | ErrorResponse = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponse;
        setError(errorData.error || "Error al obtener las facturas");
        return;
      }

      const invoicesData = data as InvoicesResponse;
      setInvoices(invoicesData.invoices);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
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
        inv.total_montos_exentos ??
        (inv.monto_servicio_exento ?? 0) + (inv.monto_bien_exento ?? 0),
      "MONTO EN SERVICIO GRAVADO": inv.monto_servicio_gravado ?? 0,
      "MONTO EN BIEN GRAVADO": inv.monto_bien_gravado ?? 0,
      "TOTAL DE MONTOS GRAVADO":
        inv.total_montos_gravados ??
        (inv.monto_servicio_gravado ?? 0) + (inv.monto_bien_gravado ?? 0),
      "ITBIS SERVICIOS": inv.itbis_servicios ?? 0,
      "ITBIS COMPRAS BIENES": inv.itbis_compras_bienes ?? 0,
      "TOTAL FACTURADO EN ITBIS":
        inv.total_facturado_itbis ??
        (inv.itbis_servicios ?? 0) + (inv.itbis_compras_bienes ?? 0),
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
    XLSX.writeFile(
      wb,
      `606_${firmName}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Export to CSV
  const exportToCSV = () => {
    const rows = invoices.map((inv) => ({
      Fecha: inv.fecha,
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

  // DataTable body templates
  const currencyBodyTemplate = (rowData: Invoice, field: keyof Invoice) => {
    const value = rowData[field];
    if (typeof value === "number") {
      return formatCurrency(value);
    }
    return "-";
  };

  const statusBodyTemplate = (rowData: Invoice) => {
    const isOk =
      rowData.status.toLowerCase() === "ok" ||
      rowData.status.toLowerCase() === "processed";
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${
          isOk
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-200 text-slate-700"
        }`}
      >
        {isOk ? "OK" : rowData.status}
      </span>
    );
  };

  const dateBodyTemplate = (rowData: Invoice) => {
    return formatDate(rowData.fecha);
  };

  // Loading state
  if (loadingMe) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3 text-slate-400">
          <Spinner />
          <span>Cargando...</span>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - ContableBot Portal</title>
        <meta name="description" content="Dashboard de facturación 606" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
            {/* Left side */}
            <div>
              <h1 className="text-3xl font-bold text-white">
                ContableBot Portal
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {firmName} • {userEmail}
              </p>
            </div>

            {/* Right side: Usage card + Logout */}
            <div className="flex items-center gap-4">
              {/* Usage card */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 px-5 py-4 shadow-lg min-w-[200px]">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Uso este mes
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {usageCurrentMonth}{" "}
                  <span className="text-slate-500 font-normal">
                    / {planLimit}
                  </span>{" "}
                  <span className="text-sm text-slate-400 font-normal">
                    facturas
                  </span>
                </p>
                <div className="mt-3 h-2 w-full rounded-full bg-slate-800">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      usagePercentage >= 90
                        ? "bg-red-500"
                        : usagePercentage >= 70
                        ? "bg-amber-500"
                        : "bg-sky-500"
                    }`}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                Cerrar sesión
              </button>
            </div>
          </header>

          {/* Filters Section */}
          <section className="mb-6 rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg">
            <h2 className="mb-4 text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Filtros
            </h2>
            <form onSubmit={handleApplyFilters}>
              <div className="grid gap-4 md:grid-cols-4 md:items-end">
                {/* Desde */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="fromDate"
                    className="text-xs font-medium text-slate-500"
                  >
                    Desde
                  </label>
                  <input
                    type="date"
                    id="fromDate"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition"
                  />
                </div>

                {/* Hasta */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="toDate"
                    className="text-xs font-medium text-slate-500"
                  >
                    Hasta
                  </label>
                  <input
                    type="date"
                    id="toDate"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition"
                  />
                </div>

                {/* Cliente */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="clientFilter"
                    className="text-xs font-medium text-slate-500"
                  >
                    Cliente
                  </label>
                  <input
                    type="text"
                    id="clientFilter"
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    placeholder="Buscar por nombre..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition"
                  />
                </div>

                {/* Aplicar Filtros Button */}
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full md:w-auto rounded-xl bg-sky-500 hover:bg-sky-400 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-sky-500/20 transition ${
                      loading ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner size="sm" />
                        Buscando...
                      </span>
                    ) : (
                      "Aplicar filtros"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 rounded-2xl bg-red-900/30 border border-red-800 p-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Facturas Section */}
          <section className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg">
            {/* Section Header */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-semibold text-white">Facturas</h2>
                <span className="text-sm text-slate-500">
                  ({invoices.length})
                </span>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={exportToExcel606}
                  disabled={invoices.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="pi pi-file-excel" />
                  Exportar Excel 606
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={invoices.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="pi pi-file" />
                  Exportar CSV
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Spinner />
                <p className="mt-3 text-sm">Cargando facturas...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && invoices.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 text-5xl opacity-50">📄</div>
                <p className="text-base font-medium text-slate-300">
                  No hay facturas para mostrar.
                </p>
                <p className="mt-2 text-sm text-slate-500 max-w-md">
                  Ajusta los filtros o envía nuevas facturas desde el bot de
                  Telegram.
                </p>
              </div>
            )}

            {/* DataTable */}
            {!loading && invoices.length > 0 && (
              <div className="datatable-dark">
                <DataTable
                  value={invoices}
                  paginator
                  rows={10}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  stripedRows
                  showGridlines
                  size="small"
                  className="text-sm"
                  emptyMessage="No hay facturas para mostrar."
                  paginatorClassName="bg-slate-800 border-t border-slate-700"
                  tableStyle={{ minWidth: "50rem" }}
                >
                  <Column
                    field="fecha"
                    header="Fecha"
                    body={dateBodyTemplate}
                    sortable
                    style={{ minWidth: "100px" }}
                  />
                  <Column
                    field="client_name"
                    header="Cliente"
                    sortable
                    style={{ minWidth: "150px" }}
                  />
                  <Column
                    field="rnc"
                    header="RNC"
                    sortable
                    style={{ minWidth: "120px" }}
                  />
                  <Column
                    field="ncf"
                    header="NCF"
                    sortable
                    style={{ minWidth: "150px" }}
                  />
                  <Column
                    field="total_facturado"
                    header="Total Facturado"
                    body={(rowData) =>
                      currencyBodyTemplate(rowData, "total_facturado")
                    }
                    sortable
                    align="right"
                    style={{ minWidth: "130px" }}
                  />
                  <Column
                    field="total_a_cobrar"
                    header="Total a Cobrar"
                    body={(rowData) =>
                      currencyBodyTemplate(rowData, "total_a_cobrar")
                    }
                    sortable
                    align="right"
                    style={{ minWidth: "130px" }}
                  />
                  <Column
                    field="status"
                    header="Estado"
                    body={statusBodyTemplate}
                    align="center"
                    style={{ minWidth: "80px" }}
                  />
                </DataTable>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Custom styles for PrimeReact DataTable dark theme */}
      <style jsx global>{`
        .datatable-dark .p-datatable {
          background: transparent;
        }
        .datatable-dark .p-datatable-header,
        .datatable-dark .p-datatable-thead > tr > th {
          background: #1e293b;
          color: #94a3b8;
          border-color: #334155;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .datatable-dark .p-datatable-tbody > tr {
          background: #0f172a;
          color: #e2e8f0;
          border-color: #1e293b;
        }
        .datatable-dark .p-datatable-tbody > tr:nth-child(even) {
          background: #1e293b;
        }
        .datatable-dark .p-datatable-tbody > tr:hover {
          background: #334155 !important;
        }
        .datatable-dark .p-datatable-tbody > tr > td {
          border-color: #334155;
          padding: 0.75rem 1rem;
        }
        .datatable-dark .p-paginator {
          background: #1e293b;
          border-color: #334155;
          color: #94a3b8;
        }
        .datatable-dark .p-paginator .p-paginator-pages .p-paginator-page {
          color: #94a3b8;
        }
        .datatable-dark
          .p-paginator
          .p-paginator-pages
          .p-paginator-page.p-highlight {
          background: #0ea5e9;
          border-color: #0ea5e9;
          color: white;
        }
        .datatable-dark .p-dropdown {
          background: #0f172a;
          border-color: #334155;
          color: #e2e8f0;
        }
        .datatable-dark .p-inputtext {
          background: #0f172a;
          border-color: #334155;
          color: #e2e8f0;
        }
        .datatable-dark .p-sortable-column .p-sortable-column-icon {
          color: #64748b;
        }
        .datatable-dark .p-sortable-column.p-highlight .p-sortable-column-icon {
          color: #0ea5e9;
        }
      `}</style>
    </>
  );
}

// Helper Components
function Spinner({ size = "md" }: { size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  return (
    <svg
      className={`${sizeClasses} animate-spin text-current`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
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
}
