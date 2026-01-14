// Invoice Quality Validation Utility
// Calculates quality scores and validates invoice data integrity

import type { Invoice } from '../types';

export interface ValidationResult {
  isValid: boolean;
  qualityScore: number;  // 0-100
  issues: string[];
  mathValid: boolean;
  hasRequiredFields: boolean;
  confidenceScore: number;  // 0-1 from CONF_BIEN_SERVICIO
}

/**
 * Validates an invoice and calculates its quality score
 *
 * Scoring:
 * - Base score: 100
 * - flag_dudoso = true: -30
 * - CONF_BIEN_SERVICIO < 0.7: -20
 * - Math doesn't reconcile: -25
 * - Missing RNC: -10
 * - Missing NCF: -10
 * - Missing fecha: -5
 */
export function validateInvoice(invoice: Invoice): ValidationResult {
  const issues: string[] = [];
  let score = 100;

  // Extract confidence from raw_ai_dump
  const confidenceScore = getConfidenceScore(invoice);

  // Check flag_dudoso
  if (invoice.flag_dudoso) {
    score -= 30;
    issues.push(invoice.razon_duda || 'Marcado como dudoso por IA');
  }

  // Check confidence score
  if (confidenceScore < 0.7) {
    score -= 20;
    issues.push(`Baja confianza en clasificación: ${Math.round(confidenceScore * 100)}%`);
  }

  // Check math consistency
  const mathValid = checkMathConsistency(invoice);
  if (!mathValid) {
    score -= 25;
    issues.push('Los totales no cuadran matemáticamente');
  }

  // Check required fields
  const hasRequiredFields = checkRequiredFields(invoice, issues);
  if (!hasRequiredFields) {
    // Points already deducted in checkRequiredFields
  }

  // Calculate missing field deductions
  if (!invoice.rnc) {
    score -= 10;
  }
  if (!invoice.ncf) {
    score -= 10;
  }
  if (!invoice.fecha) {
    score -= 5;
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return {
    isValid: score >= 70,
    qualityScore: score,
    issues,
    mathValid,
    hasRequiredFields,
    confidenceScore
  };
}

/**
 * Extracts CONF_BIEN_SERVICIO from raw_ai_dump
 */
function getConfidenceScore(invoice: Invoice): number {
  if (!invoice.raw_ai_dump) return 1; // Assume good if no AI dump

  const confidence = invoice.raw_ai_dump['CONF_BIEN_SERVICIO'];
  if (typeof confidence === 'number') {
    return confidence;
  }

  return 1; // Default to good confidence
}

/**
 * Validates that invoice totals are mathematically consistent
 *
 * Rules:
 * - total_facturado ≈ total_exento + total_gravado + total_itbis
 * - total_a_cobrar ≈ total_facturado + propina - retenciones
 */
function checkMathConsistency(invoice: Invoice): boolean {
  const tolerance = 1; // Allow $1 variance for rounding

  // Check total_facturado calculation
  const calculatedTotal =
    (invoice.total_montos_exento ?? 0) +
    (invoice.total_montos_gravado ?? 0) +
    (invoice.total_facturado_itbis ?? 0);

  const totalDiff = Math.abs((invoice.total_facturado ?? 0) - calculatedTotal);

  if (totalDiff > tolerance && calculatedTotal > 0) {
    return false;
  }

  // Check total_a_cobrar calculation (if present)
  if (invoice.total_a_cobrar !== undefined && invoice.total_a_cobrar !== null) {
    const retenciones =
      (invoice.itbis_servicios_retenido ?? 0) +
      (invoice.retencion_30_itbis ?? 0) +
      (invoice.retencion_10 ?? 0) +
      (invoice.retencion_2 ?? 0);

    const calculatedACobrar =
      (invoice.total_facturado ?? 0) +
      (invoice.propina ?? invoice.propina_legal ?? 0) -
      retenciones;

    const cobrarDiff = Math.abs(invoice.total_a_cobrar - calculatedACobrar);

    if (cobrarDiff > tolerance && calculatedACobrar > 0) {
      return false;
    }
  }

  return true;
}

/**
 * Checks that required fields are present
 */
function checkRequiredFields(invoice: Invoice, issues: string[]): boolean {
  let allPresent = true;

  if (!invoice.rnc) {
    issues.push('Falta RNC del proveedor');
    allPresent = false;
  }

  if (!invoice.ncf) {
    issues.push('Falta NCF (Comprobante Fiscal)');
    allPresent = false;
  }

  if (!invoice.fecha) {
    issues.push('Falta fecha de factura');
    allPresent = false;
  }

  return allPresent;
}

/**
 * Returns the quality level based on score
 */
export function getQualityLevel(score: number): 'good' | 'review' | 'bad' {
  if (score >= 90) return 'good';
  if (score >= 70) return 'review';
  return 'bad';
}

/**
 * Batch validate multiple invoices
 */
export function validateInvoices(invoices: Invoice[]): {
  results: Map<number, ValidationResult>;
  stats: {
    total: number;
    good: number;
    needsReview: number;
    bad: number;
    flaggedByAI: number;
    mathErrors: number;
  };
} {
  const results = new Map<number, ValidationResult>();
  const stats = {
    total: invoices.length,
    good: 0,
    needsReview: 0,
    bad: 0,
    flaggedByAI: 0,
    mathErrors: 0
  };

  for (const invoice of invoices) {
    const result = validateInvoice(invoice);
    results.set(invoice.id, result);

    const level = getQualityLevel(result.qualityScore);
    if (level === 'good') stats.good++;
    else if (level === 'review') stats.needsReview++;
    else stats.bad++;

    if (invoice.flag_dudoso) stats.flaggedByAI++;
    if (!result.mathValid) stats.mathErrors++;
  }

  return { results, stats };
}
