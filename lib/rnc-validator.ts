/**
 * RNC/Cédula Validator and Formatter
 *
 * Dominican Republic Tax ID validation and formatting utilities.
 * Adapted from n8n workflow logic.
 */

export type RncType = 'RNC' | 'CEDULA' | null

export interface RncValidationResult {
  valid: boolean
  type: RncType
  raw: string
  compact: string // digits only, for database storage
  formatted: string // pretty format with dashes
  error: string | null
}

/**
 * Normalize input text by removing invisible characters and standardizing spaces
 * Also removes common suffixes like "R" that users might accidentally type
 */
function normalizeText(input: string): string {
  return input
    .toUpperCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width characters
    .replace(/\u00A0/g, ' ') // non-breaking space
    .replace(/[‐–—]/g, '-') // various dash types
    .replace(/\s+/g, ' ') // multiple spaces
    .replace(/\s*R\s*$/i, '') // Remove trailing "R" (common copy-paste artifact)
    .trim()
}

/**
 * Extract only digits from string
 */
function extractDigits(input: string): string {
  return input.replace(/[^0-9]/g, '')
}

/**
 * Format RNC (9 digits) as X-XX-XXXXX-X
 */
function formatRnc(digits: string): string {
  if (digits.length !== 9) return digits
  return digits.replace(/^(\d)(\d{2})(\d{5})(\d)$/, '$1-$2-$3-$4')
}

/**
 * Format Cédula (11 digits) as XXX-XXXXXXX-X
 */
function formatCedula(digits: string): string {
  if (digits.length !== 11) return digits
  return digits.replace(/^(\d{3})(\d{7})(\d)$/, '$1-$2-$3')
}

/**
 * Validate and format RNC or Cédula
 *
 * @param input - Raw input string (e.g., "1-30-12345-4" or "12345678901")
 * @returns Validation result with type, formatted value, and compact value
 *
 * @example
 * validateRnc("1-30-12345-4")
 * // => { valid: true, type: 'RNC', raw: '1-30-12345-4', compact: '130123454', formatted: '1-30-12345-4', error: null }
 *
 * @example
 * validateRnc("123-4567890-1")
 * // => { valid: true, type: 'CEDULA', raw: '123-4567890-1', compact: '12345678901', formatted: '123-4567890-1', error: null }
 */
export function validateRnc(input: string): RncValidationResult {
  const raw = input

  // Validate input exists
  if (!input || input.trim().length === 0) {
    return {
      valid: false,
      type: null,
      raw,
      compact: '',
      formatted: '',
      error: 'Por favor indica un RNC o cédula. Ejemplos: 1-30-12345-4 (RNC) o 123-4567890-1 (Cédula)'
    }
  }

  // Normalize and extract digits
  const normalized = normalizeText(input)
  const digits = extractDigits(normalized)

  // Determine type based on length
  let type: RncType = null
  let formatted = ''
  let error: string | null = null

  if (digits.length === 9) {
    type = 'RNC'
    formatted = formatRnc(digits)
  } else if (digits.length === 11) {
    type = 'CEDULA'
    formatted = formatCedula(digits)
  } else {
    error = `Formato inválido. El RNC debe tener 9 dígitos (ej: 1-30-12345-4) y la cédula 11 dígitos (ej: 123-4567890-1). Recibido: ${digits.length} dígitos`
  }

  return {
    valid: error === null,
    type,
    raw,
    compact: digits,
    formatted,
    error
  }
}

/**
 * Quick validation check (boolean only)
 */
export function isValidRnc(input: string): boolean {
  return validateRnc(input).valid
}

/**
 * Get compact (digits-only) version for database storage
 */
export function getRncCompact(input: string): string | null {
  const result = validateRnc(input)
  return result.valid ? result.compact : null
}

/**
 * Get formatted version for display
 */
export function getRncFormatted(input: string): string | null {
  const result = validateRnc(input)
  return result.valid ? result.formatted : null
}

/**
 * Format a compact RNC/Cédula for display
 * Assumes input is already validated and contains only digits
 */
export function formatCompactRnc(compact: string): string {
  const digits = extractDigits(compact)

  if (digits.length === 9) {
    return formatRnc(digits)
  } else if (digits.length === 11) {
    return formatCedula(digits)
  }

  return compact // return as-is if invalid length
}
