import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import type { Invoice, Client } from "@/types";

interface EditInvoiceModalProps {
  visible: boolean;
  invoice: Invoice | null;
  clients: Client[];
  onHide: () => void;
  onSave: (updatedInvoice: Partial<Invoice>) => Promise<void>;
}

export default function EditInvoiceModal({
  visible,
  invoice,
  clients,
  onHide,
  onSave,
}: EditInvoiceModalProps) {
  const [formData, setFormData] = useState<Partial<Invoice>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when invoice changes
  useEffect(() => {
    if (invoice) {
      setFormData({
        ...invoice,
        fecha: invoice.fecha,
      });
    }
  }, [invoice]);

  const handleSave = async () => {
    if (!invoice) return;

    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la factura");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof Invoice, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const statusOptions = [
    { label: "OK", value: "OK" },
    { label: "Revisar", value: "REVIEW" },
    { label: "Error", value: "ERROR" },
    { label: "Pendiente", value: "pending" },
  ];

  const footer = (
    <div className="flex justify-end gap-2">
      <button
        onClick={onHide}
        disabled={saving}
        className="px-4 py-2 rounded-lg border border-border bg-secondary hover:bg-muted text-foreground transition disabled:opacity-50"
      >
        Cancelar
      </button>
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Editar Factura"
      footer={footer}
      className="w-full max-w-4xl"
      dismissableMask
      draggable={false}
    >
      <div className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-400">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Información Básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Cliente
              </label>
              <Dropdown
                value={formData.client_id}
                options={clients}
                onChange={(e) => {
                  handleFieldChange("client_id", e.value);
                  const selectedClient = clients.find((c) => c.id === e.value);
                  if (selectedClient) {
                    handleFieldChange("client_name", selectedClient.name);
                  }
                }}
                optionLabel="name"
                optionValue="id"
                placeholder="Seleccionar cliente"
                className="w-full"
              />
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Fecha
              </label>
              <Calendar
                value={formData.fecha ? new Date(formData.fecha) : null}
                onChange={(e) => {
                  const date = e.value as Date;
                  handleFieldChange(
                    "fecha",
                    date ? date.toISOString().split("T")[0] : ""
                  );
                }}
                dateFormat="dd/mm/yy"
                placeholder="Seleccionar fecha"
                showIcon
                className="w-full"
              />
            </div>

            {/* RNC */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                RNC
              </label>
              <InputText
                value={formData.rnc || ""}
                onChange={(e) => handleFieldChange("rnc", e.target.value)}
                placeholder="RNC"
                className="w-full"
              />
            </div>

            {/* NCF */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                NCF
              </label>
              <InputText
                value={formData.ncf || ""}
                onChange={(e) => handleFieldChange("ncf", e.target.value)}
                placeholder="NCF"
                className="w-full"
              />
            </div>

            {/* Company Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Nombre Compañía
              </label>
              <InputText
                value={formData.nombre_compania || ""}
                onChange={(e) =>
                  handleFieldChange("nombre_compania", e.target.value)
                }
                placeholder="Nombre de la compañía"
                className="w-full"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Estado
              </label>
              <Dropdown
                value={formData.status}
                options={statusOptions}
                onChange={(e) => handleFieldChange("status", e.value)}
                placeholder="Seleccionar estado"
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Amounts - Exento */}
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Montos Exentos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Servicio Exento
              </label>
              <InputNumber
                value={formData.monto_servicio_exento}
                onValueChange={(e) =>
                  handleFieldChange("monto_servicio_exento", e.value)
                }
                mode="currency"
                currency="DOP"
                locale="es-DO"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Bien Exento
              </label>
              <InputNumber
                value={formData.monto_bien_exento}
                onValueChange={(e) =>
                  handleFieldChange("monto_bien_exento", e.value)
                }
                mode="currency"
                currency="DOP"
                locale="es-DO"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Total Exento
              </label>
              <InputNumber
                value={formData.total_montos_exento}
                onValueChange={(e) =>
                  handleFieldChange("total_montos_exento", e.value)
                }
                mode="currency"
                currency="DOP"
                locale="es-DO"
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Amounts - Gravado */}
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Montos Gravados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Servicio Gravado
              </label>
              <InputNumber
                value={formData.monto_servicio_gravado}
                onValueChange={(e) =>
                  handleFieldChange("monto_servicio_gravado", e.value)
                }
                mode="currency"
                currency="DOP"
                locale="es-DO"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Bien Gravado
              </label>
              <InputNumber
                value={formData.monto_bien_gravado}
                onValueChange={(e) =>
                  handleFieldChange("monto_bien_gravado", e.value)
                }
                mode="currency"
                currency="DOP"
                locale="es-DO"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Total Gravado
              </label>
              <InputNumber
                value={formData.total_montos_gravado}
                onValueChange={(e) =>
                  handleFieldChange("total_montos_gravado", e.value)
                }
                mode="currency"
                currency="DOP"
                locale="es-DO"
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* ITBIS */}
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            ITBIS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                ITBIS Servicios
              </label>
              <InputNumber
                value={formData.itbis_servicios}
                onValueChange={(e) =>
                  handleFieldChange("itbis_servicios", e.value)
                }
                mode="currency"
                currency="DOP"
                locale="es-DO"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                ITBIS Bienes
              </label>
              <InputNumber
                value={formData.itbis_bienes}
                onValueChange={(e) =>
                  handleFieldChange("itbis_bienes", e.value)
                }
                mode="currency"
                currency="DOP"
                locale="es-DO"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Total ITBIS
              </label>
              <InputNumber
                value={formData.total_facturado_itbis}
                onValueChange={(e) =>
                  handleFieldChange("total_facturado_itbis", e.value)
                }
                mode="currency"
                currency="DOP"
                locale="es-DO"
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Retenciones */}
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Retenciones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                ITBIS Retenido
              </label>
              <InputNumber
                value={formData.itbis_servicios_retenido}
                onValueChange={(e) =>
                  handleFieldChange("itbis_servicios_retenido", e.value)
                }
                mode="currency"
                currency="DOP"
                locale="es-DO"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Retención 30% ITBIS
              </label>
              <InputNumber
                value={formData.retencion_30_itbis}
                onValueChange={(e) =>
                  handleFieldChange("retencion_30_itbis", e.value)
                }
                mode="currency"
                currency="DOP"
                locale="es-DO"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Retención 10%
              </label>
              <InputNumber
                value={formData.retencion_10}
                onValueChange={(e) => handleFieldChange("retencion_10", e.value)}
                mode="currency"
                currency="DOP"
                locale="es-DO"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Retención 2%
              </label>
              <InputNumber
                value={formData.retencion_2}
                onValueChange={(e) => handleFieldChange("retencion_2", e.value)}
                mode="currency"
                currency="DOP"
                locale="es-DO"
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Totals */}
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Totales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Propina
              </label>
              <InputNumber
                value={formData.propina}
                onValueChange={(e) => handleFieldChange("propina", e.value)}
                mode="currency"
                currency="DOP"
                locale="es-DO"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Total Facturado
              </label>
              <InputNumber
                value={formData.total_facturado}
                onValueChange={(e) =>
                  handleFieldChange("total_facturado", e.value)
                }
                mode="currency"
                currency="DOP"
                locale="es-DO"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Total a Cobrar
              </label>
              <InputNumber
                value={formData.total_a_cobrar}
                onValueChange={(e) =>
                  handleFieldChange("total_a_cobrar", e.value)
                }
                mode="currency"
                currency="DOP"
                locale="es-DO"
                className="w-full"
              />
            </div>
          </div>
        </section>
      </div>
    </Dialog>
  );
}
