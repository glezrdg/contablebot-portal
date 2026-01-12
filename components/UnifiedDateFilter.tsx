/**
 * UnifiedDateFilter Component
 *
 * Combines period presets (Este mes, Trimestre, Año) with custom date range pickers.
 * When a period preset is clicked, it auto-populates the date pickers.
 * When dates are manually changed, the period selection is cleared.
 */

import { useState, useEffect } from "react";
import { Calendar } from "primereact/calendar";
import { CalendarIcon, X } from "lucide-react";

interface UnifiedDateFilterProps {
  fromDate: Date | null;
  toDate: Date | null;
  onFromDateChange: (date: Date | null) => void;
  onToDateChange: (date: Date | null) => void;
  onClearFilters: () => void;
}

type PeriodType = "month" | "quarter" | "year" | null;

export default function UnifiedDateFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClearFilters,
}: UnifiedDateFilterProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("month");

  // Calculate dates based on period
  const calculatePeriodDates = (period: PeriodType): { from: Date; to: Date } | null => {
    if (!period) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let from: Date;

    switch (period) {
      case "month":
        // First day of current month to today
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from, to: today };

      case "quarter":
        // 3 months ago (first day) to today
        from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return { from, to: today };

      case "year":
        // 12 months ago (first day) to today
        from = new Date(now.getFullYear(), now.getMonth() - 12, 1);
        return { from, to: today };

      default:
        return null;
    }
  };

  // Handle period button click
  const handlePeriodClick = (period: PeriodType) => {
    setSelectedPeriod(period);
    const dates = calculatePeriodDates(period);
    if (dates) {
      onFromDateChange(dates.from);
      onToDateChange(dates.to);
    }
  };

  // Detect manual date changes and clear period selection
  useEffect(() => {
    if (!fromDate || !toDate) {
      setSelectedPeriod(null);
      return;
    }

    // Check if current dates match any period
    const monthDates = calculatePeriodDates("month");
    const quarterDates = calculatePeriodDates("quarter");
    const yearDates = calculatePeriodDates("year");

    const dateMatches = (d1: Date, d2: Date) => {
      return d1.toDateString() === d2.toDateString();
    };

    if (monthDates && dateMatches(fromDate, monthDates.from) && dateMatches(toDate, monthDates.to)) {
      setSelectedPeriod("month");
    } else if (quarterDates && dateMatches(fromDate, quarterDates.from) && dateMatches(toDate, quarterDates.to)) {
      setSelectedPeriod("quarter");
    } else if (yearDates && dateMatches(fromDate, yearDates.from) && dateMatches(toDate, yearDates.to)) {
      setSelectedPeriod("year");
    } else {
      // Custom date range - no period selected
      setSelectedPeriod(null);
    }
  }, [fromDate, toDate]);

  const handleClear = () => {
    setSelectedPeriod(null);
    onClearFilters();
  };

  return (
    <div className="space-y-4">
      {/* Period Preset Buttons */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Periodos rápidos
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => handlePeriodClick("month")}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              selectedPeriod === "month"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-foreground hover:bg-muted border border-border"
            }`}
          >
            <CalendarIcon className="w-4 h-4 inline mr-2" />
            Este mes
          </button>
          <button
            onClick={() => handlePeriodClick("quarter")}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              selectedPeriod === "quarter"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-foreground hover:bg-muted border border-border"
            }`}
          >
            <CalendarIcon className="w-4 h-4 inline mr-2" />
            Trimestre
          </button>
          <button
            onClick={() => handlePeriodClick("year")}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              selectedPeriod === "year"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-foreground hover:bg-muted border border-border"
            }`}
          >
            <CalendarIcon className="w-4 h-4 inline mr-2" />
            Año
          </button>
        </div>
      </div>

      {/* Custom Date Range Pickers */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Rango personalizado
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-4 items-end">
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
              minDate={fromDate || undefined}
            />
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={handleClear}
            className="w-full lg:w-auto rounded-xl border border-border bg-secondary hover:bg-muted px-5 py-2.5 text-sm font-medium text-foreground transition flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            <span className="lg:hidden">Limpiar filtros</span>
            <span className="hidden lg:inline">Limpiar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
