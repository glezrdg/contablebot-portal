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
    <div className="space-y-6">
      {/* Period Preset Buttons - Pill Style with Icons */}
      <div>
        <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest">
          <div className="w-1 h-4 bg-primary rounded-full"></div>
          Periodos rápidos
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handlePeriodClick("month")}
            data-state={selectedPeriod === "month" ? "active" : "inactive"}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all duration-200 ${
              selectedPeriod === "month"
                ? "bg-[#3B82F6] text-white shadow-md hover:bg-[#2563EB] hover:shadow-lg scale-[1.02]"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Este mes
          </button>
          <button
            onClick={() => handlePeriodClick("quarter")}
            data-state={selectedPeriod === "quarter" ? "active" : "inactive"}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all duration-200 ${
              selectedPeriod === "quarter"
                ? "bg-[#3B82F6] text-white shadow-md hover:bg-[#2563EB] hover:shadow-lg scale-[1.02]"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Trimestre
          </button>
          <button
            onClick={() => handlePeriodClick("year")}
            data-state={selectedPeriod === "year" ? "active" : "inactive"}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all duration-200 ${
              selectedPeriod === "year"
                ? "bg-[#3B82F6] text-white shadow-md hover:bg-[#2563EB] hover:shadow-lg scale-[1.02]"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Año
          </button>
        </div>
      </div>

      {/* Custom Date Range Pickers - Glassmorphic */}
      <div>
        <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest">
          <div className="w-1 h-4 bg-primary rounded-full"></div>
          Rango personalizado
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          {/* From Date - Glassmorphic */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Desde
            </label>
            <div className="bg-[var(--glass-white)] backdrop-blur-sm border border-[var(--glass-border)] rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Calendar
                value={fromDate}
                onChange={(e) => onFromDateChange(e.value as Date | null)}
                dateFormat="dd/mm/yy"
                placeholder="Seleccionar fecha"
                showIcon
                showButtonBar
                className="w-full calendar-dark"
                inputClassName="w-full rounded-xl border-0 bg-transparent px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {/* To Date - Glassmorphic */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Hasta
            </label>
            <div className="bg-[var(--glass-white)] backdrop-blur-sm border border-[var(--glass-border)] rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Calendar
                value={toDate}
                onChange={(e) => onToDateChange(e.value as Date | null)}
                dateFormat="dd/mm/yy"
                placeholder="Seleccionar fecha"
                showIcon
                showButtonBar
                className="w-full calendar-dark"
                inputClassName="w-full rounded-xl border-0 bg-transparent px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50"
                minDate={fromDate || undefined}
              />
            </div>
          </div>

          {/* Clear Filters Button - Glassmorphic with Gradient */}
          <button
            onClick={handleClear}
            className="group w-full lg:w-auto rounded-full bg-gradient-to-r from-destructive/90 to-destructive text-white hover:from-destructive hover:to-destructive/90 px-6 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02]"
          >
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            <span className="lg:hidden">Limpiar filtros</span>
            <span className="hidden lg:inline">Limpiar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
