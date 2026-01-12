import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { MultiSelect } from "primereact/multiselect";
import type { Invoice } from "@/types";
import { ALL_COLUMNS } from "@/utils/Invoice-columns";

interface InvoiceDataTableProps {
  invoices: Invoice[];
  loading: boolean;
  visibleColumns: string[];
  onColumnChange: (columns: string[]) => void;
  onEditInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoice: Invoice) => void;
  showColumnSelector?: boolean;
  emptyMessage?: string;
}

export default function InvoiceDataTable({
  invoices,
  loading,
  visibleColumns,
  onColumnChange,
  onEditInvoice,
  onDeleteInvoice,
  showColumnSelector = true,
  emptyMessage = "No hay facturas para mostrar",
}: InvoiceDataTableProps) {
  // Get column options for MultiSelect (exclude actions)
  const columnOptions = ALL_COLUMNS.filter(
    (col) => col.field !== "actions"
  ).map((col) => ({ label: col.header, value: col.field }));

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
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isOk ? "OK" : rowData.status}
      </span>
    );
  };

  const dateBodyTemplate = (rowData: Invoice) => {
    if (!rowData.fecha)
      return <span className="text-muted-foreground">Sin fecha</span>;
    return formatDate(rowData.fecha);
  };

  const actionsBodyTemplate = (rowData: Invoice) => {
    if (!onEditInvoice && !onDeleteInvoice) return null;

    return (
      <div className="flex items-center justify-center gap-1">
        {onEditInvoice && (
          <button
            onClick={() => onEditInvoice(rowData)}
            className="p-2 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition"
            title="Editar factura"
          >
            <i className="pi pi-pencil text-sm" />
          </button>
        )}
        {onDeleteInvoice && (
          <button
            onClick={() => onDeleteInvoice(rowData)}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition"
            title="Eliminar factura"
          >
            <i className="pi pi-trash text-sm" />
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
        <p className="text-sm">Cargando facturas...</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 text-5xl opacity-50">📄</div>
        <p className="text-base font-medium text-foreground">
          No hay facturas para mostrar
        </p>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <>
      {showColumnSelector && (
        <div className="mb-4">
          <MultiSelect
            value={visibleColumns.filter((c) => c !== "actions")}
            options={columnOptions}
            onChange={(e) => onColumnChange(e.value)}
            placeholder="Columnas"
            display="chip"
            maxSelectedLabels={2}
            className="w-64"
            panelClassName="column-selector-panel"
            itemClassName="column-selector-item"
          />
        </div>
      )}

      <div className="datatable-dark overflow-x-auto">
        <DataTable
          value={invoices}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          stripedRows
          showGridlines
          size="small"
          className="text-sm"
          emptyMessage={emptyMessage}
          paginatorClassName="dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700"
          tableStyle={{ minWidth: "50rem" }}
          scrollable
          scrollHeight="flex"
        >
          {ALL_COLUMNS.filter((col) => visibleColumns.includes(col.field)).map(
            (col) => {
              const getBody = () => {
                switch (col.type) {
                  case "date":
                    return dateBodyTemplate;
                  case "currency":
                    return (rowData: Invoice) =>
                      currencyBodyTemplate(rowData, col.field as keyof Invoice);
                  case "status":
                    return statusBodyTemplate;
                  case "actions":
                    return actionsBodyTemplate;
                  default:
                    return undefined;
                }
              };

              return (
                <Column
                  key={col.field}
                  field={col.field}
                  header={col.header}
                  body={getBody()}
                  sortable={col.type !== "actions"}
                  align={
                    col.type === "currency"
                      ? "right"
                      : col.type === "status" || col.type === "actions"
                      ? "center"
                      : undefined
                  }
                  style={{ minWidth: col.minWidth }}
                />
              );
            }
          )}
        </DataTable>
      </div>
    </>
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
  if (!dateStr) return "Sin fecha";
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
