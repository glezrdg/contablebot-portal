// Quality Badge Component
// Displays a color-coded indicator for invoice quality with tooltip

import { Tooltip } from 'primereact/tooltip';
import { useRef } from 'react';
import type { Invoice } from '../types';
import { validateInvoice, getQualityLevel } from '../lib/invoice-validator';

interface QualityBadgeProps {
  invoice: Invoice;
  showScore?: boolean;
}

export default function QualityBadge({ invoice, showScore = false }: QualityBadgeProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Calculate quality
  const validation = validateInvoice(invoice);
  const level = getQualityLevel(validation.qualityScore);

  // Color based on quality level
  const colorClasses = {
    good: 'bg-green-500',
    review: 'bg-yellow-500',
    bad: 'bg-red-500'
  };

  const colorClass = colorClasses[level];

  // Build tooltip content
  const tooltipLines = [];

  if (validation.qualityScore < 100) {
    tooltipLines.push(`Puntuacion: ${validation.qualityScore}/100`);
  }

  if (validation.issues.length > 0) {
    tooltipLines.push(...validation.issues);
  } else {
    tooltipLines.push('Sin problemas detectados');
  }

  const tooltipContent = tooltipLines.join('\n');
  const uniqueId = `quality-badge-${invoice.id}`;

  return (
    <div className="flex items-center gap-2">
      <Tooltip target={`#${uniqueId}`} position="right" />
      <div
        id={uniqueId}
        ref={tooltipRef}
        data-pr-tooltip={tooltipContent}
        data-pr-position="right"
        className={`w-3 h-3 rounded-full ${colorClass} cursor-help transition-transform hover:scale-125`}
        title={tooltipContent}
      />
      {showScore && (
        <span className="text-xs text-muted-foreground">
          {validation.qualityScore}%
        </span>
      )}
    </div>
  );
}

// Simplified version for use in tables without PrimeReact Tooltip
export function QualityDot({ invoice }: { invoice: Invoice }) {
  const validation = validateInvoice(invoice);
  const level = getQualityLevel(validation.qualityScore);

  const colors = {
    good: 'bg-green-500',
    review: 'bg-yellow-500',
    bad: 'bg-red-500'
  };

  const tooltipText = validation.issues.length > 0
    ? `${validation.qualityScore}% - ${validation.issues[0]}`
    : `${validation.qualityScore}% - OK`;

  return (
    <div
      className={`w-3 h-3 rounded-full ${colors[level]} cursor-help`}
      title={tooltipText}
    />
  );
}
