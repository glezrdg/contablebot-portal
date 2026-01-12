import { Download } from "lucide-react";

interface ExportButtonsProps {
  onExportExcel: () => void;
  onExportCSV: () => void;
  disabled?: boolean;
  totalCount?: number;
}

export default function ExportButtons({
  onExportExcel,
  onExportCSV,
  disabled = false,
  totalCount,
}: ExportButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onExportExcel}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <i className="pi pi-file-excel" />
        Exportar Excel 606
      </button>
      <button
        onClick={onExportCSV}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary hover:bg-muted px-4 py-2 text-sm font-medium text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <i className="pi pi-file" />
        Exportar CSV
      </button>
      {totalCount !== undefined && (
        <span className="ml-auto text-sm text-muted-foreground">
          {totalCount} facturas encontradas
        </span>
      )}
    </div>
  );
}
