import { useState, useEffect, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import type { Invoice, ErrorResponse } from "@/types";
import { validateInvoice, getQualityLevel, type ValidationResult } from "@/lib/invoice-validator";
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, RefreshCw, Eye, Calculator, FileWarning, AlertOctagon } from "lucide-react";

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

  // Fetch QA invoices
  const fetchQAInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/qa?filter=${filter}`);
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
  }, [filter]);

  useEffect(() => {
    fetchQAInvoices();
  }, [fetchQAInvoices]);

  // Approve invoice (mark as OK)
  const handleApprove = async (invoice: QAInvoice) => {
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
  const handleReprocess = async (invoice: QAInvoice) => {
    confirmDialog({
      message: `Esto enviara la factura ${invoice.ncf} a reprocesar. Continuar?`,
      header: "Confirmar reprocesamiento",
      icon: "pi pi-refresh",
      accept: async () => {
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
      },
    });
  };

  // Delete invoice
  const handleDelete = async (invoice: QAInvoice) => {
    confirmDialog({
      message: `Eliminar la factura ${invoice.ncf}?`,
      header: "Confirmar eliminacion",
      icon: "pi pi-trash",
      acceptClassName: "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg ml-2",
      rejectClassName: "bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg",
      accept: async () => {
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
      },
    });
  };

  // Bulk approve selected
  const handleBulkApprove = async () => {
    if (selectedInvoices.length === 0) return;

    confirmDialog({
      message: `Aprobar ${selectedInvoices.length} facturas seleccionadas?`,
      header: "Confirmar aprobacion masiva",
      icon: "pi pi-check",
      accept: async () => {
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
      },
    });
  };

  // Bulk re-process selected (for dudosas)
  const handleBulkReprocess = async () => {
    if (selectedInvoices.length === 0) return;

    confirmDialog({
      message: `Enviar ${selectedInvoices.length} facturas a reprocesar? Se usara el contexto de validacion previo para mejorar el resultado.`,
      header: "Confirmar reprocesamiento masivo",
      icon: "pi pi-refresh",
      accept: async () => {
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
      },
    });
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
        <Button
          icon="pi pi-eye"
          className="p-button-info p-button-sm p-button-text"
          onClick={() => openDetailDialog(rowData)}
          tooltip="Ver detalle"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-check"
          className="p-button-success p-button-sm p-button-text"
          onClick={() => handleApprove(rowData)}
          tooltip="Aprobar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-refresh"
          className="p-button-warning p-button-sm p-button-text"
          onClick={() => handleReprocess(rowData)}
          tooltip="Reprocesar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-danger p-button-sm p-button-text"
          onClick={() => handleDelete(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
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
      showUserStats={false}
    >
      {() => (
        <>
          <Toast ref={toast} />
          <ConfirmDialog />

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Control de Calidad</h1>
            </div>
            <p className="text-muted-foreground">
              Revisa y aprueba facturas que necesitan atencion
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Dudosas (IA)</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.flaggedByAI}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Errores matematicos</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.mathErrors}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Baja confianza</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.lowConfidence}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Total revisadas</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          )}

          {/* Filter and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Dropdown
                value={filter}
                options={filterOptions}
                onChange={(e) => setFilter(e.value)}
                className="w-48"
              />
              <Button
                icon="pi pi-refresh"
                label="Actualizar"
                className="p-button-outlined p-button-sm"
                onClick={fetchQAInvoices}
              />
            </div>

            {selectedInvoices.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedInvoices.length} seleccionadas
                </span>
                <Button
                  icon="pi pi-check-circle"
                  label="Aprobar"
                  className="p-button-success p-button-sm"
                  onClick={handleBulkApprove}
                />
                <Button
                  icon="pi pi-refresh"
                  label="Reprocesar"
                  className="p-button-warning p-button-sm"
                  onClick={handleBulkReprocess}
                />
              </div>
            )}
          </div>

          {/* Data Table */}
          <div className="bg-card border border-border rounded-xl p-4">
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
          <Dialog
            header="Detalle de Factura"
            visible={showDetailDialog}
            style={{ width: "700px" }}
            onHide={() => setShowDetailDialog(false)}
            className="qa-detail-dialog"
          >
            {detailInvoice && (
              <div className="space-y-6">
                {/* Invoice Basic Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-white border rounded-lg">
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
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                  <Button
                    icon="pi pi-check"
                    label="Aprobar"
                    className="p-button-success"
                    onClick={() => {
                      handleApprove(detailInvoice);
                      setShowDetailDialog(false);
                    }}
                  />
                  <Button
                    icon="pi pi-refresh"
                    label="Reprocesar"
                    className="p-button-warning"
                    onClick={() => {
                      handleReprocess(detailInvoice);
                      setShowDetailDialog(false);
                    }}
                  />
                  <Button
                    icon="pi pi-times"
                    label="Cerrar"
                    className="p-button-secondary"
                    onClick={() => setShowDetailDialog(false)}
                  />
                </div>
              </div>
            )}
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
}
