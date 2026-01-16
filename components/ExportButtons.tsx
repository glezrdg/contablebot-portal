import { Download, FileSpreadsheet, FileText } from "lucide-react";

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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
      {/* Export Excel 606 - Gradient Button */}
      <button
        onClick={onExportExcel}
        disabled={disabled}
        className="group relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        <FileSpreadsheet className="w-4 h-4 relative z-10" />
        <span className="relative z-10">Exportar Excel 606</span>
      </button>

      {/* Export CSV - Glassmorphic Button */}
      <button
        onClick={onExportCSV}
        disabled={disabled}
        className="group inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 bg-[var(--glass-white)] backdrop-blur-sm border border-[var(--glass-border)] text-foreground hover:bg-[var(--glass-white)]/80 hover:border-primary/30 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
      >
        <FileText className="w-4 h-4 transition-transform group-hover:scale-110" />
        <span>Exportar CSV</span>
      </button>

      {totalCount !== undefined && (
        <span className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-muted-foreground bg-[var(--glass-white)] backdrop-blur-sm border border-[var(--glass-border)] rounded-xl shadow-sm">
          {totalCount} {totalCount === 1 ? 'factura' : 'facturas'}
        </span>
      )}
    </div>
  );
}
