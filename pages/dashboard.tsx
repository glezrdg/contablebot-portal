import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import * as XLSX from "xlsx";
import type {
  Invoice,
  Client,
  InvoicesResponse,
  ClientsResponse,
  MeResponse,
  ErrorResponse,
} from "../types";
import AddClientModal from "@/components/AddClientModal";
import UploadInvoiceModal from "@/components/UploadInvoiceModal";
import EditInvoiceModal from "@/components/EditInvoiceModal";
import AdminHeader from "@/components/AdminHeader";
import ClientFilterButtons from "@/components/ClientFilterButtons";
import InvoiceDataTable from "@/components/InvoiceDataTable";
import ExportButtons from "@/components/ExportButtons";
import { BarChart3, Settings, Upload } from "lucide-react";
import { ALL_COLUMNS } from "@/utils/Invoice-columns";

// Column definitions for the invoices table

const STORAGE_KEY = "dashboard_visible_columns";

export default function DashboardPage() {
  const router = useRouter();
  const toast = useRef<Toast>(null);

  // Firm data from /api/me
  const [firmId, setFirmId] = useState<number | null>(null);
  const [firmName, setFirmName] = useState<string>("");
  const [usedThisMonth, setUsedThisMonth] = useState<number>(0);
  const [planLimit, setPlanLimit] = useState<number>(0);
  const [userEmail, setUserEmail] = useState<string>("");
  const [manageUrl, setManageUrl] = useState<string | undefined>(undefined);

  // Active client state (for invoice uploads)
  const [activeClientRnc, setActiveClientRnc] = useState<string | undefined>(
    undefined
  );
  const [activeClientName, setActiveClientName] = useState<string | undefined>(
    undefined
  );
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);

  // Filter state - Dashboard only shows current month
  const [fromDate] = useState<Date | null>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [toDate] = useState<Date | null>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  });
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  // Clients for filter buttons
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Invoices data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalInvoices, setTotalInvoices] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [loadingMe, setLoadingMe] = useState(true);
  const [error, setError] = useState("");

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    // Default visible columns
    return ALL_COLUMNS.filter((col) => col.defaultVisible).map(
      (col) => col.field
    );
  });

  // Load saved column preferences from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVisibleColumns(parsed);
          }
        } catch (e) {
          console.error("Error parsing saved columns:", e);
        }
      }
    }
  }, []);

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
        console.log(data, "data");
        setFirmId(data.firmId);
        setFirmName(data.firmName);
        setUsedThisMonth(data.usedThisMonth);
        setPlanLimit(data.planLimit);
        setUserEmail(data.email);
        setManageUrl(data.manageUrl);
        setActiveClientRnc(data.activeClientRnc);
        setActiveClientName(data.activeClientName);
      } catch (err) {
        console.error("Error fetching /api/me:", err);
        router.replace("/login");
      } finally {
        setLoadingMe(false);
      }
    };

    fetchMe();
  }, [router]);

  // Fetch clients for filter buttons
  const fetchClients = useCallback(async () => {
    if (!firmId) return;

    setLoadingClients(true);
    try {
      const response = await fetch("/api/clients");
      const data: ClientsResponse | ErrorResponse = await response.json();

      if (response.ok) {
        setClients((data as ClientsResponse).clients);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoadingClients(false);
    }
  }, [firmId]);

  useEffect(() => {
    if (firmId) {
      fetchClients();
    }
  }, [firmId, fetchClients]);

  // Handle client selection
  // Note: client.rnc contains the compact RNC, client.name contains business name
  const handleClientSelected = (client: Client) => {
    setActiveClientRnc(client.rnc);
    setActiveClientName(client.name);
    fetchClients(); // Refresh client list
    toast.current?.show({
      severity: "success",
      summary: "Cliente seleccionado",
      detail: `Ahora trabajando con: ${client.name}`,
      life: 3000,
    });
  };

  // Handle client added
  // Note: client.rnc contains the compact RNC, client.name contains business name
  const handleClientAdded = (client: Client) => {
    setActiveClientRnc(client.rnc);
    setActiveClientName(client.name);
    fetchClients(); // Refresh client list
    toast.current?.show({
      severity: "success",
      summary: "Cliente creado",
      detail: `${client.name} ha sido agregado exitosamente`,
      life: 3000,
    });
  };

  // Handle upload complete
  const handleUploadComplete = (totalUploaded: number) => {
    fetchInvoices(); // Refresh invoice list
    toast.current?.show({
      severity: "success",
      summary: "Facturas procesadas",
      detail: `${totalUploaded} factura${
        totalUploaded !== 1 ? "s" : ""
      } procesada${totalUploaded !== 1 ? "s" : ""} exitosamente`,
      life: 3000,
    });
  };

  // Handle open uploader from card
  const handleOpenUploader = () => {
    setShowUploadModal(true);
  };

  // Fetch invoices with filters
  const fetchInvoices = useCallback(async () => {
    if (!firmId) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (fromDate) {
        params.set("from", formatDateForAPI(fromDate));
      }
      if (toDate) {
        params.set("to", formatDateForAPI(toDate));
      }
      if (selectedClientId) {
        params.set("clientId", selectedClientId.toString());
      }

      const url = `/api/invoices${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await fetch(url);
      const data: InvoicesResponse | ErrorResponse = await response.json();
      console.log(data, "invoices data");
      if (!response.ok) {
        const errorData = data as ErrorResponse;
        setError(errorData.error || "Error al obtener las facturas");
        return;
      }

      const invoicesData = data as InvoicesResponse;
      setInvoices(invoicesData.invoices);
      setTotalInvoices(invoicesData.total || 0);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [firmId, fromDate, toDate, selectedClientId]);

  // Fetch invoices when filters change
  useEffect(() => {
    if (firmId) {
      fetchInvoices();
    }
  }, [firmId, fromDate, toDate, selectedClientId, fetchInvoices]);

  // Edit invoice handler
  const handleEditInvoice = (invoice: Invoice) => {
    setInvoiceToEdit(invoice);
    setShowEditModal(true);
  };

  const handleSaveInvoice = async (updatedInvoice: Partial<Invoice>) => {
    if (!invoiceToEdit) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceToEdit.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updatedInvoice),
      });

      if (!response.ok) {
        const data: ErrorResponse = await response.json();
        throw new Error(data.error || "Error al actualizar la factura");
      }

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Factura actualizada correctamente",
        life: 3000,
      });

      // Refresh invoices list
      fetchInvoices();
      setShowEditModal(false);
      setInvoiceToEdit(null);
    } catch (err) {
      console.error("Error updating invoice:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err instanceof Error ? err.message : "Error de conexión",
        life: 3000,
      });
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
            const data: ErrorResponse = await response.json();
            toast.current?.show({
              severity: "error",
              summary: "Error",
              detail: data.error || "Error al eliminar la factura",
              life: 3000,
            });
            return;
          }

          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Factura eliminada correctamente",
            life: 3000,
          });

          // Refresh invoices list
          fetchInvoices();
        } catch (err) {
          console.error("Error deleting invoice:", err);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error de conexión",
            life: 3000,
          });
        }
      },
    });
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
    if (activeClientName) {
      parts.push(activeClientName.replace(/[^a-zA-Z0-9]/g, "_"));
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

  // Loading state
  if (loadingMe) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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

      <Toast ref={toast} />
      <ConfirmDialog />

      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {/* Header */}
          <AdminHeader
            firmName={firmName}
            userEmail={userEmail}
            usedThisMonth={usedThisMonth}
            planLimit={planLimit}
            manageUrl={manageUrl}
            showUserStats={true}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div
              onClick={handleOpenUploader}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Subir Factura
              </h3>
              <p className="text-sm text-muted-foreground">
                Arrastra o selecciona una imagen de factura para procesar
              </p>
            </div>

            <a
              href="/reportes"
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg block"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Ver Reportes
              </h3>
              <p className="text-sm text-muted-foreground">
                Analiza tus facturas procesadas y genera reportes
              </p>
            </a>

            <a
              href="/configuracion"
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg block"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Configuración
              </h3>
              <p className="text-sm text-muted-foreground">
                Ajusta tu perfil, integraciones y preferencias
              </p>
            </a>
          </div>

          {/* Add Client Modal */}
          <AddClientModal
            isOpen={showAddClientModal}
            onClose={() => setShowAddClientModal(false)}
            onClientAdded={handleClientAdded}
          />

          {/* Upload Invoice Modal */}
          <UploadInvoiceModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            activeClientRnc={activeClientRnc}
            activeClientName={activeClientName}
            onClientSelected={handleClientSelected}
            onAddClient={() => setShowAddClientModal(true)}
            onUploadComplete={handleUploadComplete}
          />

          {/* Edit Invoice Modal */}
          <EditInvoiceModal
            visible={showEditModal}
            invoice={invoiceToEdit}
            clients={clients}
            onHide={() => {
              setShowEditModal(false);
              setInvoiceToEdit(null);
            }}
            onSave={handleSaveInvoice}
          />

          {/* Client Filter Buttons */}
          <ClientFilterButtons
            clients={clients}
            selectedClientId={selectedClientId}
            onClientSelect={setSelectedClientId}
            onSetActiveClient={(client) => {
              if (client) {
                setActiveClientRnc(client.rnc);
                setActiveClientName(client.name);
                toast.current?.show({
                  severity: "success",
                  summary: "Cliente seleccionado",
                  detail: `${client.name} establecido como cliente activo`,
                  life: 3000,
                });
              } else {
                setActiveClientRnc(undefined);
                setActiveClientName(undefined);
              }
            }}
            activeClientRnc={activeClientRnc}
            loading={loadingClients}
          />

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
          <section className="rounded-2xl bg-card border border-border p-5 shadow-lg">
            {/* Section Header */}
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
              loading={loading}
              visibleColumns={visibleColumns}
              onColumnChange={handleColumnChange}
              onEditInvoice={handleEditInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              emptyMessage="Ajusta los filtros o envía nuevas facturas desde el bot de Telegram."
            />
          </section>
        </div>
      </main>
    </>
  );
}

// Helper functions
function formatDateForAPI(date: Date): string {
  return date.toISOString().split("T")[0];
}

