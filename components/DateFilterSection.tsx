import { Calendar } from "primereact/calendar";

interface DateFilterSectionProps {
  fromDate: Date | null;
  toDate: Date | null;
  onFromDateChange: (date: Date | null) => void;
  onToDateChange: (date: Date | null) => void;
  onClearFilters: () => void;
  showClearButton?: boolean;
}

export default function DateFilterSection({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClearFilters,
  showClearButton = true,
}: DateFilterSectionProps) {
  return (
    <section className="mb-6 rounded-2xl bg-card border border-border p-5 shadow-lg">
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Filtrar por Fecha
      </h2>
      <div className="grid gap-4 md:grid-cols-3 md:items-end">
        {/* From Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Desde
          </label>
          <Calendar
            value={fromDate}
            onChange={(e) => onFromDateChange(e.value as Date | null)}
            dateFormat="dd/mm/yy"
            placeholder="Seleccionar fecha"
            showIcon
            showButtonBar
            className="w-full calendar-dark"
            inputClassName="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
          />
        </div>

        {/* To Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Hasta
          </label>
          <Calendar
            value={toDate}
            onChange={(e) => onToDateChange(e.value as Date | null)}
            dateFormat="dd/mm/yy"
            placeholder="Seleccionar fecha"
            showIcon
            showButtonBar
            className="w-full calendar-dark"
            inputClassName="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
          />
        </div>

        {/* Clear Filters Button */}
        {showClearButton && (
          <div>
            <button
              onClick={onClearFilters}
              className="w-full md:w-auto rounded-xl border border-border bg-secondary hover:bg-muted px-5 py-2.5 text-sm font-medium text-foreground transition"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
