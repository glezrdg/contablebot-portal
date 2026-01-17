import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import DashboardLayout from "@/components/DashboardLayout";
import PageLoader from "@/components/PageLoader";
import type { Invoice, Client } from "@/types";
import { validateInvoice, getQualityLevel, type ValidationResult } from "@/lib/invoice-validator";
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, RefreshCw, Eye, Calculator, FileWarning, AlertOctagon, X, Trash2, FileText } from "lucide-react";

interface QAInvoice extends Invoice {
  validation: ValidationResult;
  qualityLevel: 'good' | 'review' | 'bad';
}

interface QAStats {
  total: number;
  flaggedByAI: number;
  lowConfidence: number;
  mathErrors: number;
  missingFields: number;
}

const filterOptions = [
  { label: "Todas", value: "all" },
  { label: "Necesitan revision", value: "needsReview" },
  { label: "Dudosas (IA)", value: "flagged" },
  { label: "Error matematico", value: "mathError" },
];

export default function QADashboardPage() {
  const toast = useRef<Toast>(null);
  const [invoices, setInvoices] = useState<QAInvoice[]>([]);
  const [stats, setStats] = useState<QAStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("needsReview");
  const [selectedInvoices, setSelectedInvoices] = useState<QAInvoice[]>([]);
  const [detailInvoice, setDetailInvoice] = useState<QAInvoice | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Confirmation modals
  const [confirmReprocess, setConfirmReprocess] = useState<{ show: boolean; invoice?: QAInvoice; bulk?: boolean }>({ show: false });
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; invoice?: QAInvoice }>({ show: false });
  const [confirmApprove, setConfirmApprove] = useState<{ show: boolean; invoice?: QAInvoice }>({ show: false });
  const [confirmBulkApprove, setConfirmBulkApprove] = useState(false);

  // Fetch QA invoices
  const fetchQAInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({ filter });
      if (selectedClientId) {
        queryParams.set('clientId', selectedClientId.toString());
      }
      const response = await fetch(`/api/invoices/qa?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar facturas");
      }

      // Compute validation for each invoice client-side
      const qaInvoices: QAInvoice[] = data.invoices.map((inv: Invoice) => {
        const validation = validateInvoice(inv);
        const qualityLevel = getQualityLevel(validation.qualityScore);
        return { ...inv, validation, qualityLevel };
      });

      setInvoices(qaInvoices);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching QA invoices:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las facturas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [filter, selectedClientId]);

  // Fetch clients for admin filter
  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error('Error al cargar clientes');
      }
      const data = await response.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, []);

  useEffect(() => {
    fetchQAInvoices();
  }, [fetchQAInvoices]);

  // Show approve confirmation
  const handleApprove = (invoice: QAInvoice) => {
    setConfirmApprove({ show: true, invoice });
  };

  // Execute approve after confirmation
  const executeApprove = async (invoice: QAInvoice) => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OK", flag_dudoso: false }),
      });

      if (!response.ok) {
        throw new Error("Error al aprobar factura");
      }

      toast.current?.show({
        severity: "success",
        summary: "Aprobada",
        detail: `Factura ${invoice.ncf} marcada como OK`,
        life: 3000,
      });

      fetchQAInvoices();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo aprobar la factura",
        life: 3000,
      });
    }
  };

  // Re-process invoice (reset to pending)
  const handleReprocess = (invoice: QAInvoice) => {
    setConfirmReprocess({ show: true, invoice, bulk: false });
  };

  const executeReprocess = async (invoice: QAInvoice) => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "pending",
          flag_dudoso: false,
          razon_duda: null,
          error_message: null,
          retry_count: 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al reprocesar factura");
      }

      toast.current?.show({
        severity: "info",
        summary: "Reprocesando",
        detail: `Factura ${invoice.ncf} enviada a reprocesar`,
        life: 3000,
      });

      fetchQAInvoices();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo reprocesar la factura",
        life: 3000,
      });
    }
  };

  // Delete invoice
  const handleDelete = (invoice: QAInvoice) => {
    setConfirmDelete({ show: true, invoice });
  };

  const executeDelete = async (invoice: QAInvoice) => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar factura");
      }

      toast.current?.show({
        severity: "success",
        summary: "Eliminada",
        detail: `Factura ${invoice.ncf} eliminada`,
        life: 3000,
      });

      fetchQAInvoices();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar la factura",
        life: 3000,
      });
    }
  };

  // Bulk approve selected
  const handleBulkApprove = () => {
    if (selectedInvoices.length === 0) return;
    setConfirmBulkApprove(true);
  };

  const executeBulkApprove = async () => {
    let approved = 0;
    for (const invoice of selectedInvoices) {
      try {
        const response = await fetch(`/api/invoices/${invoice.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "OK", flag_dudoso: false }),
        });
        if (response.ok) approved++;
      } catch (error) {
        console.error(`Error approving invoice ${invoice.id}:`, error);
      }
    }

    toast.current?.show({
      severity: "success",
      summary: "Aprobacion masiva",
      detail: `${approved} de ${selectedInvoices.length} facturas aprobadas`,
      life: 3000,
    });

    setSelectedInvoices([]);
    fetchQAInvoices();
  };

  // Bulk re-process selected (for dudosas)
  const handleBulkReprocess = () => {
    if (selectedInvoices.length === 0) return;
    setConfirmReprocess({ show: true, bulk: true });
  };

  const executeBulkReprocess = async () => {
    let reprocessed = 0;
    for (const invoice of selectedInvoices) {
      try {
        // Build QA feedback from validation issues
        const qaFeedback = buildQAFeedback(invoice);

        const response = await fetch(`/api/invoices/${invoice.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "pending",
            flag_dudoso: false,
            razon_duda: null,
            error_message: null,
            retry_count: 0,
            qa_feedback: qaFeedback, // Pass previous validation context
          }),
        });
        if (response.ok) reprocessed++;
      } catch (error) {
        console.error(`Error reprocessing invoice ${invoice.id}:`, error);
      }
    }

    toast.current?.show({
      severity: "info",
      summary: "Reprocesamiento masivo",
      detail: `${reprocessed} de ${selectedInvoices.length} facturas enviadas a reprocesar`,
      life: 3000,
    });

    setSelectedInvoices([]);
    fetchQAInvoices();
  };

  // Build QA feedback string from validation issues
  const buildQAFeedback = (invoice: QAInvoice): string => {
    const feedback: string[] = [];

    if (invoice.razon_duda) {
      feedback.push(`IA marcó como dudosa: ${invoice.razon_duda}`);
    }

    if (!invoice.validation.mathValid) {
      feedback.push("Los totales matematicos no cuadran - verificar suma de montos");
    }

    if (invoice.validation.confidenceScore < 0.7) {
      feedback.push(`Baja confianza (${Math.round(invoice.validation.confidenceScore * 100)}%) en clasificacion bien/servicio`);
    }

    // Add specific issues
    for (const issue of invoice.validation.issues) {
      if (!feedback.includes(issue)) {
        feedback.push(issue);
      }
    }

    return feedback.join(". ");
  };

  // Open detail dialog
  const openDetailDialog = (invoice: QAInvoice) => {
    setDetailInvoice(invoice);
    setShowDetailDialog(true);
  };

  // Column templates
  const qualityTemplate = (rowData: QAInvoice) => {
    const colors = {
      good: "bg-green-500",
      review: "bg-yellow-500",
      bad: "bg-red-500",
    };
    return (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${colors[rowData.qualityLevel]}`} />
        <span className="text-sm">{rowData.validation.qualityScore}%</span>
      </div>
    );
  };

  const issuesTemplate = (rowData: QAInvoice) => {
    if (rowData.validation.issues.length === 0) {
      return <span className="text-green-400 text-sm">Sin problemas</span>;
    }
    return (
      <ul className="text-sm text-muted-foreground">
        {rowData.validation.issues.slice(0, 2).map((issue, idx) => (
          <li key={idx} className="truncate max-w-[200px]" title={issue}>
            {issue}
          </li>
        ))}
        {rowData.validation.issues.length > 2 && (
          <li className="text-xs text-muted-foreground">
            +{rowData.validation.issues.length - 2} mas...
          </li>
        )}
      </ul>
    );
  };

  const actionsTemplate = (rowData: QAInvoice) => {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => openDetailDialog(rowData)}
          className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded transition-colors"
          title="Ver detalle"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleApprove(rowData)}
          className="p-2 text-muted-foreground hover:text-green-500 hover:bg-muted rounded transition-colors"
          title="Aprobar"
        >
          <CheckCircle className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleReprocess(rowData)}
          className="p-2 text-muted-foreground hover:text-orange-500 hover:bg-muted rounded transition-colors"
          title="Reprocesar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDelete(rowData)}
          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-muted rounded transition-colors"
          title="Eliminar"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const dateTemplate = (rowData: QAInvoice) => {
    if (!rowData.fecha) return "-";
    try {
      return new Intl.DateTimeFormat("es-DO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(rowData.fecha));
    } catch {
      return rowData.fecha;
    }
  };

  return (
    <DashboardLayout
      title="Control de Calidad - ContableBot"
      description="Revisar y aprobar facturas"
    >
      {(userData) => {
        // Set admin status and fetch clients on userData load
        if (userData && !isAdmin && userData.role === 'admin') {
          setIsAdmin(true);
          fetchClients();
        }

        // Show loader during initial data fetch
        if (loading && invoices.length === 0) {
          return <PageLoader message="Cargando control de calidad..." />;
        }

        return (
        <>
          <Toast ref={toast} />

          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Control de Calidad</h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Revisa y aprueba facturas que necesitan atencion
            </p>
          </div>

          {/* Stats Cards with 3D Glassmorphic Design */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-[0_4px_16px_0_rgba(31,38,135,0.08),0_2px_8px_0_rgba(31,38,135,0.05),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_16px_0_rgba(0,0,0,0.2),0_2px_8px_0_rgba(0,0,0,0.15),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:translate-y-[-2px] transition-all duration-300">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-yellow-500/30 to-yellow-500/10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(234,179,8,0.2)] flex-shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 drop-shadow-sm" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-tight">Dudosas (IA)</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">{stats.flaggedByAI}</p>
              </div>
              <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-[0_4px_16px_0_rgba(31,38,135,0.08),0_2px_8px_0_rgba(31,38,135,0.05),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_16px_0_rgba(0,0,0,0.2),0_2px_8px_0_rgba(0,0,0,0.15),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:translate-y-[-2px] transition-all duration-300">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-red-500/30 to-red-500/10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(239,68,68,0.2)] flex-shrink-0">
                    <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 drop-shadow-sm" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-tight">Errores matemáticos</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">{stats.mathErrors}</p>
              </div>
              <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-[0_4px_16px_0_rgba(31,38,135,0.08),0_2px_8px_0_rgba(31,38,135,0.05),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_16px_0_rgba(0,0,0,0.2),0_2px_8px_0_rgba(0,0,0,0.15),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:translate-y-[-2px] transition-all duration-300">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-500/30 to-orange-500/10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(249,115,22,0.2)] flex-shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 drop-shadow-sm" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-tight">Baja confianza</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">{stats.lowConfidence}</p>
              </div>
              <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-[0_4px_16px_0_rgba(31,38,135,0.08),0_2px_8px_0_rgba(31,38,135,0.05),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_16px_0_rgba(0,0,0,0.2),0_2px_8px_0_rgba(0,0,0,0.15),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:translate-y-[-2px] transition-all duration-300">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500/30 to-green-500/10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(34,197,94,0.2)] flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 drop-shadow-sm" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-tight">Total revisadas</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">{stats.total}</p>
              </div>
            </div>
          )}

          {/* Filter and Actions */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-4">
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Dropdown
                value={filter}
                options={filterOptions}
                onChange={(e) => setFilter(e.value)}
                className="w-full sm:w-48 text-sm"
              />
              {isAdmin && clients.length > 0 && (
                <Dropdown
                  value={selectedClientId}
                  options={[
                    { label: "Todos los clientes", value: null },
                    ...clients.map(client => ({
                      label: client.name,
                      value: client.id
                    }))
                  ]}
                  onChange={(e) => setSelectedClientId(e.value)}
                  placeholder="Filtrar por cliente"
                  className="w-full sm:w-56 text-sm"
                />
              )}
              <button
                onClick={fetchQAInvoices}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            </div>

            {/* Bulk Actions Row */}
            {selectedInvoices.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <span className="text-xs sm:text-sm text-foreground font-medium">
                  {selectedInvoices.length} factura{selectedInvoices.length !== 1 ? 's' : ''} seleccionada{selectedInvoices.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2 sm:ml-auto">
                  <button
                    onClick={handleBulkApprove}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprobar
                  </button>
                  <button
                    onClick={handleBulkReprocess}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reprocesar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Data Table with 3D Glassmorphic Design */}
          <div className="bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-[0_4px_16px_0_rgba(31,38,135,0.08),0_2px_8px_0_rgba(31,38,135,0.05),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_16px_0_rgba(0,0,0,0.2),0_2px_8px_0_rgba(0,0,0,0.15),inset_0_1px_0_0_rgba(255,255,255,0.1)] overflow-x-auto">
            <DataTable
              value={invoices}
              loading={loading}
              selection={selectedInvoices}
              onSelectionChange={(e) => setSelectedInvoices(e.value as QAInvoice[])}
              selectionMode="checkbox"
              paginator
              rows={10}
              rowsPerPageOptions={[10, 25, 50]}
              emptyMessage="No hay facturas que revisar"
              className="datatable-dark text-sm"
              stripedRows
            >
              <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
              <Column field="quality" header="Calidad" body={qualityTemplate} style={{ width: "100px" }} />
              <Column field="fecha" header="Fecha" body={dateTemplate} sortable style={{ width: "100px" }} />
              <Column field="client_name" header="Cliente" sortable style={{ minWidth: "150px" }} />
              <Column field="ncf" header="NCF" sortable style={{ minWidth: "150px" }} />
              <Column field="total_facturado" header="Total" sortable style={{ width: "120px" }}
                body={(rowData) => `$${(rowData.total_facturado || 0).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`}
              />
              <Column field="issues" header="Problemas" body={issuesTemplate} style={{ minWidth: "200px" }} />
              <Column field="actions" header="Acciones" body={actionsTemplate} style={{ width: "180px" }} />
            </DataTable>
          </div>

          {/* Detail Dialog */}
          {showDetailDialog && detailInvoice && createPortal(
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-md z-[1100]"
                onClick={() => setShowDetailDialog(false)}
              />

              {/* Modal */}
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[1101] w-full max-w-3xl px-4">
                <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-[0_24px_64px_0_rgba(0,0,0,0.3)] max-h-[90vh] flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-[var(--glass-border)] bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 flex-shrink-0">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 flex items-center justify-center shadow-md">
                          <FileText className="w-5 h-5 text-primary drop-shadow-sm" />
                        </div>
                        Detalle de Factura
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowDetailDialog(false)}
                      className="group text-muted-foreground hover:text-foreground transition-all p-2 hover:bg-[var(--glass-white)] rounded-xl border border-transparent hover:border-[var(--glass-border)]"
                    >
                      <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>

                  {/* Content - Scrollable */}
                  <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {/* Invoice Basic Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 border border-border rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Cliente</p>
                    <p className="font-medium text-foreground">{detailInvoice.client_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">NCF</p>
                    <p className="font-medium text-foreground">{detailInvoice.ncf || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">RNC</p>
                    <p className="font-medium text-foreground">{detailInvoice.rnc || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Fecha</p>
                    <p className="font-medium text-foreground">
                      {detailInvoice.fecha ? new Intl.DateTimeFormat("es-DO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(detailInvoice.fecha)) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Facturado</p>
                    <p className="font-medium text-foreground text-lg">
                      ${(detailInvoice.total_facturado || 0).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Puntuacion Calidad</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${detailInvoice.qualityLevel === "good" ? "bg-green-500" :
                        detailInvoice.qualityLevel === "review" ? "bg-yellow-500" : "bg-red-500"
                        }`} />
                      <span className="font-medium text-foreground">{detailInvoice.validation.qualityScore}%</span>
                    </div>
                  </div>
                </div>

                {/* Problems Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-yellow-500" />
                    Problemas Detectados
                  </h3>

                  {detailInvoice.validation.issues.length === 0 ? (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-green-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Sin problemas detectados
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {detailInvoice.validation.issues.map((issue, idx) => (
                        <li
                          key={idx}
                          className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
                        >
                          <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-foreground">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* AI Doubt Reason */}
                {detailInvoice.flag_dudoso && detailInvoice.razon_duda && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <FileWarning className="w-4 h-4 text-orange-500" />
                      Razon de Duda (IA)
                    </h3>
                    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <p className="text-sm text-foreground">{detailInvoice.razon_duda}</p>
                    </div>
                  </div>
                )}

                {/* Math Validation */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-500" />
                    Validacion Matematica
                  </h3>
                  <div className={`p-4 rounded-lg border ${detailInvoice.validation.mathValid
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-red-500/10 border-red-500/30"
                    }`}>
                    {detailInvoice.validation.mathValid ? (
                      <p className="text-green-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Los totales cuadran correctamente
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-red-400 flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Los totales no coinciden
                        </p>
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                          <p>Exento: ${(detailInvoice.total_montos_exento || 0).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</p>
                          <p>Gravado: ${(detailInvoice.total_montos_gravado || 0).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</p>
                          <p>ITBIS: ${(detailInvoice.total_facturado_itbis || 0).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</p>
                          <p className="font-medium">Calculado: ${((detailInvoice.total_montos_exento || 0) + (detailInvoice.total_montos_gravado || 0) + (detailInvoice.total_facturado_itbis || 0)).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</p>
                          <p className="font-medium">Total Factura: ${(detailInvoice.total_facturado || 0).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Confidence Score */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Confianza IA</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${detailInvoice.validation.confidenceScore >= 0.7 ? "bg-green-500" :
                          detailInvoice.validation.confidenceScore >= 0.5 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                        style={{ width: `${detailInvoice.validation.confidenceScore * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {Math.round(detailInvoice.validation.confidenceScore * 100)}%
                    </span>
                  </div>
                </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                      <button
                        onClick={() => {
                          handleApprove(detailInvoice);
                          setShowDetailDialog(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprobar
                      </button>
                      <button
                        onClick={() => {
                          handleReprocess(detailInvoice);
                          setShowDetailDialog(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reprocesar
                      </button>
                      <button
                        onClick={() => setShowDetailDialog(false)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>,
            document.body
          )}

          {/* Reprocess Confirmation Modal */}
          {confirmReprocess.show && createPortal(
            <>
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-md z-[1100]"
                onClick={() => setConfirmReprocess({ show: false })}
              />
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[1101] w-full max-w-md px-4">
                <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-[0_24px_64px_0_rgba(0,0,0,0.3)] overflow-hidden">
                  <div className="flex items-center justify-between p-6 border-b border-[var(--glass-border)] bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
                    <div>
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 flex items-center justify-center shadow-md">
                          <RefreshCw className="w-5 h-5 text-primary drop-shadow-sm" />
                        </div>
                        Confirmar reprocesamiento
                      </h2>
                    </div>
                    <button
                      onClick={() => setConfirmReprocess({ show: false })}
                      className="group text-muted-foreground hover:text-foreground transition-all p-2 hover:bg-[var(--glass-white)] rounded-xl border border-transparent hover:border-[var(--glass-border)]"
                    >
                      <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>
                  <div className="p-6">
                    <p className="text-foreground mb-6">
                      {confirmReprocess.bulk
                        ? `Enviar ${selectedInvoices.length} facturas a reprocesar? Se usara el contexto de validacion previo para mejorar el resultado.`
                        : `Esto enviara la factura ${confirmReprocess.invoice?.ncf} a reprocesar. Continuar?`}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmReprocess({ show: false })}
                        className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          if (confirmReprocess.bulk) {
                            await executeBulkReprocess();
                          } else if (confirmReprocess.invoice) {
                            await executeReprocess(confirmReprocess.invoice);
                          }
                          setConfirmReprocess({ show: false });
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Reprocesar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>,
            document.body
          )}

          {/* Approve Confirmation Modal */}
          {confirmApprove.show && confirmApprove.invoice && createPortal(
            <>
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-md z-[1100]"
                onClick={() => setConfirmApprove({ show: false })}
              />
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[1101] w-full max-w-md px-4">
                <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-[0_24px_64px_0_rgba(0,0,0,0.3)] overflow-hidden">
                  <div className="flex items-center justify-between p-6 border-b border-[var(--glass-border)] bg-gradient-to-r from-green-500/5 via-green-500/10 to-green-500/5">
                    <div>
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center shadow-md">
                          <CheckCircle className="w-5 h-5 text-green-500 drop-shadow-sm" />
                        </div>
                        Confirmar aprobación
                      </h2>
                    </div>
                    <button
                      onClick={() => setConfirmApprove({ show: false })}
                      className="group text-muted-foreground hover:text-foreground transition-all p-2 hover:bg-[var(--glass-white)] rounded-xl border border-transparent hover:border-[var(--glass-border)]"
                    >
                      <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>
                  <div className="p-6">
                    <p className="text-foreground mb-6">
                      ¿Aprobar la factura <span className="font-semibold text-primary">{confirmApprove.invoice.ncf}</span>?
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Esta acción marcará la factura como OK y se removerán las banderas de dudoso.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmApprove({ show: false })}
                        className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          if (confirmApprove.invoice) {
                            await executeApprove(confirmApprove.invoice);
                          }
                          setConfirmApprove({ show: false });
                          if (showDetailDialog) {
                            setShowDetailDialog(false);
                          }
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors font-medium"
                      >
                        Aprobar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>,
            document.body
          )}

          {/* Delete Confirmation Modal */}
          {confirmDelete.show && confirmDelete.invoice && createPortal(
            <>
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-md z-[1100]"
                onClick={() => setConfirmDelete({ show: false })}
              />
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[1101] w-full max-w-md px-4">
                <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-[0_24px_64px_0_rgba(0,0,0,0.3)] overflow-hidden">
                  <div className="flex items-center justify-between p-6 border-b border-[var(--glass-border)] bg-gradient-to-r from-red-500/5 via-red-500/10 to-red-500/5">
                    <div>
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/40 to-red-500/10 flex items-center justify-center shadow-md">
                          <Trash2 className="w-5 h-5 text-red-500 drop-shadow-sm" />
                        </div>
                        Confirmar eliminación
                      </h2>
                    </div>
                    <button
                      onClick={() => setConfirmDelete({ show: false })}
                      className="group text-muted-foreground hover:text-foreground transition-all p-2 hover:bg-[var(--glass-white)] rounded-xl border border-transparent hover:border-[var(--glass-border)]"
                    >
                      <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>
                  <div className="p-6">
                    <p className="text-foreground mb-6">
                      Eliminar la factura {confirmDelete.invoice.ncf}?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmDelete({ show: false })}
                        className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          await executeDelete(confirmDelete.invoice!);
                          setConfirmDelete({ show: false });
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>,
            document.body
          )}

          {/* Bulk Approve Confirmation Modal */}
          {confirmBulkApprove && createPortal(
            <>
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-md z-[1100]"
                onClick={() => setConfirmBulkApprove(false)}
              />
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[1101] w-full max-w-md px-4">
                <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-[0_24px_64px_0_rgba(0,0,0,0.3)] overflow-hidden">
                  <div className="flex items-center justify-between p-6 border-b border-[var(--glass-border)] bg-gradient-to-r from-green-500/5 via-green-500/10 to-green-500/5">
                    <div>
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/40 to-green-500/10 flex items-center justify-center shadow-md">
                          <CheckCircle className="w-5 h-5 text-green-500 drop-shadow-sm" />
                        </div>
                        Confirmar aprobación masiva
                      </h2>
                    </div>
                    <button
                      onClick={() => setConfirmBulkApprove(false)}
                      className="group text-muted-foreground hover:text-foreground transition-all p-2 hover:bg-[var(--glass-white)] rounded-xl border border-transparent hover:border-[var(--glass-border)]"
                    >
                      <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>
                  <div className="p-6">
                    <p className="text-foreground mb-6">
                      Aprobar {selectedInvoices.length} facturas seleccionadas?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmBulkApprove(false)}
                        className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          await executeBulkApprove();
                          setConfirmBulkApprove(false);
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Aprobar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>,
            document.body
          )}
        </>
        );
      }}
    </DashboardLayout>
  );
}
