// /pages/dashboard.tsx - Protected dashboard with invoices table
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
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

  // Fetch user/firm info on mount
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await fetch("/api/me");

        if (!response.ok) {
          // Not authenticated or error - redirect handled by middleware
          // but just in case, redirect to login
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
      // Build query string with optional filters
      const params = new URLSearchParams();

      if (fromDate) {
        params.set("from", fromDate);
      }
      if (toDate) {
        params.set("to", toDate);
      }
      if (clientFilter.trim()) {
        params.set("client", clientFilter.trim());
      }

      const url = `/api/invoices${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await fetch(url);
      const data: InvoicesResponse | ErrorResponse = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponse;
        setError(errorData.error || "Error al obtener las facturas");
        setLoading(false);
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

  // Show loading state while checking authentication
  if (loadingMe) {
    return (
      <div style={styles.loadingContainer}>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - ContableBot Portal</title>
        <meta name="description" content="Dashboard de facturación" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>ContableBot Portal</h1>
            <p style={styles.headerSubtitle}>
              {firmName} • {userEmail}
            </p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.usageInfo}>
              <span style={styles.usageLabel}>Uso este mes:</span>
              <span style={styles.usageValue}>
                {usageCurrentMonth} / {planLimit} facturas
              </span>
            </div>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Main content */}
        <main style={styles.main}>
          {/* Filters */}
          <section style={styles.filtersSection}>
            <h2 style={styles.sectionTitle}>Filtros</h2>
            <form onSubmit={handleApplyFilters} style={styles.filtersForm}>
              <div style={styles.filterGroup}>
                <label htmlFor="fromDate" style={styles.label}>
                  Desde
                </label>
                <input
                  type="date"
                  id="fromDate"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.filterGroup}>
                <label htmlFor="toDate" style={styles.label}>
                  Hasta
                </label>
                <input
                  type="date"
                  id="toDate"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.filterGroup}>
                <label htmlFor="clientFilter" style={styles.label}>
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  id="clientFilter"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  placeholder="Buscar por nombre"
                  style={styles.input}
                />
              </div>

              <button
                type="submit"
                style={{
                  ...styles.applyButton,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                disabled={loading}
              >
                {loading ? "Buscando..." : "Aplicar Filtros"}
              </button>
            </form>
          </section>

          {/* Error message */}
          {error && <div style={styles.error}>{error}</div>}

          {/* Invoices table */}
          <section style={styles.tableSection}>
            <h2 style={styles.sectionTitle}>
              Facturas {invoices.length > 0 && `(${invoices.length})`}
            </h2>

            {invoices.length === 0 ? (
              <p style={styles.noData}>
                No hay facturas para mostrar. Use los filtros y presione
                &quot;Aplicar Filtros&quot;.
              </p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Fecha</th>
                      <th style={styles.th}>Cliente</th>
                      <th style={styles.th}>RNC</th>
                      <th style={styles.th}>NCF</th>
                      <th style={styles.thRight}>Total Facturado</th>
                      <th style={styles.th}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} style={styles.tr}>
                        <td style={styles.td}>{invoice.fecha}</td>
                        <td style={styles.td}>{invoice.client_name}</td>
                        <td style={styles.td}>{invoice.rnc}</td>
                        <td style={styles.td}>{invoice.ncf}</td>
                        <td style={styles.tdRight}>
                          {formatCurrency(invoice.total_facturado)}
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...getStatusStyle(invoice.status),
                            }}
                          >
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
  }).format(amount);
}

function getStatusStyle(status: string): React.CSSProperties {
  switch (status.toUpperCase()) {
    case "OK":
      return { backgroundColor: "#d4edda", color: "#155724" };
    case "REVIEW":
      return { backgroundColor: "#fff3cd", color: "#856404" };
    case "ERROR":
      return { backgroundColor: "#f8d7da", color: "#721c24" };
    default:
      return { backgroundColor: "#e2e3e5", color: "#383d41" };
  }
}

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  container: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 40px",
    backgroundColor: "#fff",
    borderBottom: "1px solid #e0e0e0",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "600",
    color: "#333",
  },
  headerSubtitle: {
    margin: "4px 0 0 0",
    fontSize: "14px",
    color: "#666",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  usageInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  usageLabel: {
    fontSize: "12px",
    color: "#888",
  },
  usageValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
  },
  logoutButton: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#666",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  main: {
    padding: "30px 40px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  filtersSection: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "8px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  sectionTitle: {
    margin: "0 0 20px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#333",
  },
  filtersForm: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    alignItems: "flex-end",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "180px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#555",
  },
  input: {
    padding: "10px 14px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  applyButton: {
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    backgroundColor: "#0070f3",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    height: "fit-content",
  },
  error: {
    padding: "16px",
    backgroundColor: "#fee",
    border: "1px solid #fcc",
    borderRadius: "8px",
    color: "#c00",
    fontSize: "14px",
    marginBottom: "24px",
  },
  tableSection: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  noData: {
    color: "#666",
    fontSize: "14px",
    textAlign: "center",
    padding: "40px 0",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    borderBottom: "2px solid #e0e0e0",
    fontWeight: "600",
    color: "#333",
    backgroundColor: "#fafafa",
  },
  thRight: {
    textAlign: "right",
    padding: "12px 16px",
    borderBottom: "2px solid #e0e0e0",
    fontWeight: "600",
    color: "#333",
    backgroundColor: "#fafafa",
  },
  tr: {
    borderBottom: "1px solid #e0e0e0",
  },
  td: {
    padding: "12px 16px",
    color: "#444",
  },
  tdRight: {
    padding: "12px 16px",
    color: "#444",
    textAlign: "right",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
  },
};
