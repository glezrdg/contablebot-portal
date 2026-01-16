import { useState, useEffect, useCallback, useRef } from "react";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import * as XLSX from "xlsx";
import type {
  Invoice,
  Client,
  InvoicesResponse,
  ClientsResponse,
  ErrorResponse,
} from "../types";
import AddClientModal from "@/components/AddClientModal";
import AddClientWizardModal from "@/components/AddClientWizardModal";
import UploadInvoiceModal from "@/components/UploadInvoiceModal";
import EditInvoiceModal from "@/components/EditInvoiceModal";
import InvoiceDetailModal from "@/components/InvoiceDetailModal";
import DashboardLayout from "@/components/DashboardLayout";
import PageLoader from "@/components/PageLoader";
import ClientFilterButtons from "@/components/ClientFilterButtons";
import InvoiceDataTable from "@/components/InvoiceDataTable";
import ExportButtons from "@/components/ExportButtons";
import { BarChart3, Settings, Upload, ShieldCheck } from "lucide-react";
import { ALL_COLUMNS } from "@/utils/Invoice-columns";
import { useProcessing } from "@/contexts/ProcessingContext";
import { Dropdown } from "primereact/dropdown";
import { validateInvoice, getQualityLevel } from "@/lib/invoice-validator";

// Column definitions for the invoices table

const STORAGE_KEY = "dashboard_visible_columns";

export default function DashboardPage() {
  const toast = useRef<Toast>(null);
  const refreshUserDataRef = useRef<(() => Promise<void>) | null>(null);
  const { onProcessingComplete, checkPending } = useProcessing();

  // Firm data - will be removed after full refactor
  const [firmId, setFirmId] = useState<number | null>(null);

  // Active client state (for invoice uploads)
  const [activeClientRnc, setActiveClientRnc] = useState<string | undefined>(
    undefined
  );
  const [activeClientName, setActiveClientName] = useState<string | undefined>(
    undefined
  );
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddClientWizardModal, setShowAddClientWizardModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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
  const [qualityFilter, setQualityFilter] = useState<string>("all");

  // Clients for filter buttons
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Invoices data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalInvoices, setTotalInvoices] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  // Quality filter options
  const qualityFilterOptions = [
    { label: "Todas las facturas", value: "all" },
    { label: "Necesitan revision", value: "needsReview" },
    { label: "Dudosas (IA)", value: "flagged" },
    { label: "Error matematico", value: "mathError" },
  ];

  // Filter invoices by quality
  const filteredInvoices = invoices.filter((inv) => {
    if (qualityFilter === "all") return true;

    const validation = validateInvoice(inv);
    const level = getQualityLevel(validation.qualityScore);

    if (qualityFilter === "needsReview") return level !== "good";
    if (qualityFilter === "flagged") return inv.flag_dudoso === true;
    if (qualityFilter === "mathError") return !validation.mathValid;

    return true;
  });

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

  // Note: User data is now fetched by DashboardLayout and passed via render prop
  // We'll initialize state from userData inside the render prop

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
    console.log("[Dashboard] handleClientSelected called with:", client);
    console.log("[Dashboard] Setting activeClientRnc to:", client.rnc);
    console.log("[Dashboard] Setting activeClientName to:", client.name);
    setActiveClientRnc(client.rnc);
    setActiveClientName(client.name);
    fetchClients(); // Refresh client list
    console.log("[Dashboard] Showing toast notification");
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
    // Immediately check for pending invoices - this shows the ProcessingIndicator
    checkPending();

    // Refresh invoice list to show newly uploaded invoices
    fetchInvoices();

    toast.current?.show({
      severity: "success",
      summary: "Facturas subidas",
      detail: `${totalUploaded} factura${totalUploaded !== 1 ? "s" : ""
        } subida${totalUploaded !== 1 ? "s" : ""} exitosamente. Procesando...`,
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

      // Filter by created_at (upload date) for dashboard - tied to usage tracking
      if (fromDate) {
        params.set("createdFrom", fromDate.toISOString());
      }
      if (toDate) {
        // Use start of next day to include entire last day
        const nextDay = new Date(toDate);
        nextDay.setDate(nextDay.getDate() + 1);
        params.set("createdTo", nextDay.toISOString());
      }
      if (selectedClientId !== null) {
        params.set("clientId", selectedClientId.toString());
      }

      const url = `/api/invoices${params.toString() ? `?${params.toString()}` : ""
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

      // Filter out pending/processing invoices - only show fully processed ones
      const completed = invoicesData.invoices.filter(inv =>
        inv.status === "OK" || inv.status === "REVIEW" || inv.status === "ERROR" || inv.status === "processed"
      );

      setInvoices(completed);
      setTotalInvoices(completed.length);
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

  // Subscribe to processing completion events
  useEffect(() => {
    const unsubscribe = onProcessingComplete(async () => {
      // Refresh invoice list
      fetchInvoices();

      // Refresh user data (usage counter)
      if (refreshUserDataRef.current) {
        await refreshUserDataRef.current();
      }

      // Show success toast
      toast.current?.show({
        severity: "success",
        summary: "Procesamiento completo",
        detail: "Las facturas han sido procesadas exitosamente",
        life: 3000,
      });
    });

    return unsubscribe;
  }, [onProcessingComplete, fetchInvoices]);

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

  // View invoice details handler
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
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

  return (
    <DashboardLayout
      title="Dashboard - ContableBot Portal"
      description="Dashboard de facturación 606"
      showUserStats={true}
    >
      {(userData, refreshUserData) => {
        // Initialize state from userData on first render
        if (userData && firmId === null) {
          setFirmId(userData.firmId);
          setActiveClientRnc(userData.activeClientRnc);
          setActiveClientName(userData.activeClientName);

          // Auto-select the active client if user has one
          if (userData.activeClientId) {
            setSelectedClientId(userData.activeClientId);
          }

          // Store refreshUserData for use in callbacks
          if (!refreshUserDataRef.current) {
            refreshUserDataRef.current = refreshUserData;
          }

          // Mark initial loading as complete once userData is received
          if (initialLoading) {
            setInitialLoading(false);
          }
        }

        // Show loader while initial data is loading
        if (initialLoading) {
          return <PageLoader message="Cargando dashboard..." />;
        }

        return (
          <>
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* Quick Action Cards with Enhanced 3D Glassmorphic Design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              {/* Subir Factura - Primary Blue-Purple gradient */}
              <div
                onClick={handleOpenUploader}
                className="group bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 cursor-pointer shadow-[0_4px_16px_0_rgba(31,38,135,0.08),0_2px_8px_0_rgba(31,38,135,0.05),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_16px_0_rgba(0,0,0,0.2),0_2px_8px_0_rgba(0,0,0,0.15),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_48px_0_rgba(59,130,246,0.25),0_6px_24px_0_rgba(59,130,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.5),0_6px_24px_0_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:translate-y-[-6px] transition-all duration-300 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary/30 to-[hsl(262_83%_58%)]/20 rounded-2xl flex items-center justify-center mb-4 shadow-[0_4px_16px_rgba(59,130,246,0.2)] group-hover:shadow-[0_6px_24px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-all duration-300">
                  <Upload className="w-8 h-8 text-primary drop-shadow-sm" />
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg">
                  Subir Factura
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Arrastra o selecciona una imagen de factura para procesar
                </p>
              </div>

              {/* Control de Calidad - Emerald with brand accent */}
              <a
                href="/dashboard/qa"
                className="group bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 cursor-pointer shadow-[0_4px_16px_0_rgba(31,38,135,0.08),0_2px_8px_0_rgba(31,38,135,0.05),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_16px_0_rgba(0,0,0,0.2),0_2px_8px_0_rgba(0,0,0,0.15),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_48px_0_rgba(16,185,129,0.25),0_6px_24px_0_rgba(16,185,129,0.15),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.5),0_6px_24px_0_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:translate-y-[-6px] transition-all duration-300 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1] block"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-teal-400/20 rounded-2xl flex items-center justify-center mb-4 shadow-[0_4px_16px_rgba(16,185,129,0.2)] group-hover:shadow-[0_6px_24px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-all duration-300">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 drop-shadow-sm" />
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg">
                  Control de Calidad
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Revisa y aprueba facturas que necesitan atención
                </p>
              </a>

              {/* Ver Reportes - Secondary Purple */}
              <a
                href="/reportes"
                className="group bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 cursor-pointer shadow-[0_4px_16px_0_rgba(31,38,135,0.08),0_2px_8px_0_rgba(31,38,135,0.05),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_16px_0_rgba(0,0,0,0.2),0_2px_8px_0_rgba(0,0,0,0.15),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_48px_0_rgba(139,92,246,0.25),0_6px_24px_0_rgba(139,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.5),0_6px_24px_0_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:translate-y-[-6px] transition-all duration-300 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1] block"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[hsl(262_83%_58%)]/30 to-violet-400/20 rounded-2xl flex items-center justify-center mb-4 shadow-[0_4px_16px_rgba(139,92,246,0.2)] group-hover:shadow-[0_6px_24px_rgba(139,92,246,0.3)] group-hover:scale-110 transition-all duration-300">
                  <BarChart3 className="w-8 h-8 text-[hsl(262_83%_58%)] drop-shadow-sm" />
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg">
                  Ver Reportes
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Analiza tus facturas procesadas y genera reportes
                </p>
              </a>

              {/* Configuración - Amber/Orange accent */}
              <a
                href="/configuracion"
                className="group bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-6 cursor-pointer shadow-[0_4px_16px_0_rgba(31,38,135,0.08),0_2px_8px_0_rgba(31,38,135,0.05),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_16px_0_rgba(0,0,0,0.2),0_2px_8px_0_rgba(0,0,0,0.15),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_48px_0_rgba(245,158,11,0.25),0_6px_24px_0_rgba(245,158,11,0.15),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.5),0_6px_24px_0_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:translate-y-[-6px] transition-all duration-300 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1] block"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500/30 to-orange-400/20 rounded-2xl flex items-center justify-center mb-4 shadow-[0_4px_16px_rgba(245,158,11,0.2)] group-hover:shadow-[0_6px_24px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-all duration-300">
                  <Settings className="w-8 h-8 text-amber-500 drop-shadow-sm" />
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg">
                  Configuración
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
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

            {/* Add Client Wizard Modal (TEST) */}
            {/* <AddClientWizardModal
              isOpen={showAddClientWizardModal}
              onClose={() => setShowAddClientWizardModal(false)}
              onClientAdded={handleClientAdded}
            /> */}

            {/* Upload Invoice Modal */}
            <UploadInvoiceModal
              isOpen={showUploadModal}
              onClose={() => setShowUploadModal(false)}
              activeClientRnc={activeClientRnc}
              activeClientName={activeClientName}
              onClientSelected={handleClientSelected}
              onAddClient={() => setShowAddClientModal(true)}
              onUploadComplete={handleUploadComplete}
              userRole={userData.role}
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

            {/* Invoice Detail Modal */}
            <InvoiceDetailModal
              isOpen={showDetailModal}
              onClose={() => {
                setShowDetailModal(false);
                setSelectedInvoice(null);
              }}
              invoice={selectedInvoice}
            />

            {/* Client Filter Buttons - Only show for admin users */}
            {userData.role === 'admin' && (
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
            )}

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

            {/* Facturas Section with Enhanced 3D Glassmorphic Design */}
            <section className="rounded-2xl bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] p-4 sm:p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:z-[-1]">
              {/* Section Header - Single Row */}
              <div className="mb-6 flex flex-col lg:flex-row lg:items-center gap-3">
                {/* Title and Result Count */}
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-foreground">
                    Facturas
                  </h2>
                  <span className="text-sm font-medium text-muted-foreground px-3 py-1 bg-[var(--glass-white)] backdrop-blur-sm border border-[var(--glass-border)] rounded-full whitespace-nowrap">
                    {filteredInvoices.length}{qualityFilter !== "all" ? ` de ${totalInvoices}` : ""} resultados
                  </span>
                </div>

                {/* Quality Filter */}
                <div className="w-full lg:w-64">
                  <Dropdown
                    value={qualityFilter}
                    options={qualityFilterOptions}
                    onChange={(e) => setQualityFilter(e.value)}
                    placeholder="Filtrar por calidad"
                    className="w-full"
                  />
                </div>

                {/* Export Buttons */}
                <div className="w-full lg:w-auto lg:ml-auto">
                  <ExportButtons
                    onExportExcel={exportToExcel606}
                    onExportCSV={exportToCSV}
                    disabled={filteredInvoices.length === 0}
                    totalCount={filteredInvoices.length}
                  />
                </div>
              </div>

              <InvoiceDataTable
                invoices={filteredInvoices}
                loading={loading}
                visibleColumns={visibleColumns}
                onColumnChange={handleColumnChange}
                onEditInvoice={handleEditInvoice}
                onDeleteInvoice={handleDeleteInvoice}
                onViewInvoice={handleViewInvoice}
                emptyMessage="Ajusta los filtros o envía nuevas facturas desde el bot de Telegram."
              />
            </section>

          </>
        );
      }}
    </DashboardLayout>
  );
}

