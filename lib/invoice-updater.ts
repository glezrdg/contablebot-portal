// Invoice Database Updater
// Handles atomic claiming and updating of invoices

import type { ExtractedInvoiceData } from './gemini-client';

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

export interface PendingInvoice {
  id: number;
  firm_id: number;
  user_id?: number;
  client_id?: number;
  client_name: string;
  rnc: string;
  raw_ocr_text: string;
  retry_count: number;  // Track retry attempts
}

/**
 * Result of updating invoices (supports partial success)
 */
export interface UpdateInvoicesResult {
  successful: number[];
  failed: { id: number; error: string }[];
}

/**
 * Atomically claim pending invoices to prevent double-processing
 * Uses PostgreSQL RPC function with SELECT FOR UPDATE SKIP LOCKED
 */
export async function claimPendingInvoices(batchSize: number): Promise<PendingInvoice[]> {
  if (!POSTGREST_BASE_URL) {
    throw new Error('POSTGREST_BASE_URL is not defined');
  }

  const response = await fetch(
    `${POSTGREST_BASE_URL}/rpc/claim_pending_invoices`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ batch_size: batchSize })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to claim invoices: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Update invoices with extracted data from Gemini
 * Handles partial failures - continues even if individual invoices fail
 * Stores raw_ai_dump, flag_dudoso, and razon_duda for each invoice
 */
export async function updateInvoices(extractedData: ExtractedInvoiceData[]): Promise<UpdateInvoicesResult> {
  if (!POSTGREST_BASE_URL) {
    throw new Error('POSTGREST_BASE_URL is not defined');
  }

  const successful: number[] = [];
  const failed: { id: number; error: string }[] = [];

  for (const data of extractedData) {
    const updateUrl = `${POSTGREST_BASE_URL}/invoices?id=eq.${data.id_interna}`;

    try {
      const response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          rnc: data.RNC,
          fecha: parseDate(data.FECHA),
          nombre_compania: data['NOMBRE COMPAÑÍA'],
          ncf: data['NO. COMPROBANTE FISCAL'],
          materiales: data.MATERIALES,

          // Exento
          monto_servicio_exento: data['MONTO EN SERVICIO EXENTO'] || 0,
          monto_bien_exento: data['MONTO EN BIEN EXENTO'] || 0,
          total_montos_exento: data['TOTAL DE MONTOS EXENTO'] || 0,

          // Gravado
          monto_servicio_gravado: data['MONTO EN SERVICIO GRAVADO'] || 0,
          monto_bien_gravado: data['MONTO EN BIEN GRAVADO'] || 0,
          total_montos_gravado: data['TOTAL DE MONTOS GRAVADO'] || 0,

          // ITBIS
          itbis_servicios: data['ITBIS SERVICIOS'] || 0,
          itbis_bienes: data['ITBIS COMPRAS BIENES'] || 0,
          total_facturado_itbis: data['TOTAL FACTURADO EN ITBIS'] || 0,

          // Retenciones
          itbis_servicios_retenido: data['ITBIS SERVICIOS RETENIDO'] || 0,
          retencion_30_itbis: data['RETENCION 30% ITBIS'] || 0,
          retencion_10: data['RETENCION 10%'] || 0,
          retencion_2: data['RETENCION 2%'] || 0,

          // Totals
          propina: data.PROPINA || 0,
          total_facturado: data['TOTAL FACTURADO'] || 0,
          total_a_cobrar: data['TOTAL A COBRAR'] || 0,

          // Error tracking / quality flags
          raw_ai_dump: data,  // Store full Gemini response for debugging
          flag_dudoso: data.FLAG_DUDOSO || false,
          razon_duda: data.RAZON_DUDA || null,

          // Status
          status: 'processed',
          processed_at: new Date().toISOString(),
          retry_count: 0,  // Reset retry count on success
          error_message: null  // Clear any previous error
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status} ${errorText}`);
      }

      successful.push(data.id_interna);
      console.log(`[Invoice Updater] Updated invoice ${data.id_interna}${data.FLAG_DUDOSO ? ' (flagged as doubtful)' : ''}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      failed.push({ id: data.id_interna, error: errorMessage });
      console.error(`[Invoice Updater] Failed to update invoice ${data.id_interna}:`, errorMessage);
    }
  }

  return { successful, failed };
}

/**
 * Mark invoices as error status
 * @param invoices - Invoices to mark as error
 * @param error - The error that occurred
 * @param incrementRetry - Whether to increment retry_count (default true)
 */
export async function markInvoicesAsError(
  invoices: PendingInvoice[],
  error: Error,
  incrementRetry: boolean = true
) {
  if (!POSTGREST_BASE_URL) {
    console.error('[Invoice Updater] Cannot mark as error: POSTGREST_BASE_URL not defined');
    return;
  }

  for (const invoice of invoices) {
    const updateUrl = `${POSTGREST_BASE_URL}/invoices?id=eq.${invoice.id}`;
    const currentRetryCount = invoice.retry_count || 0;
    const newRetryCount = incrementRetry ? currentRetryCount + 1 : currentRetryCount;

    try {
      await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'error',
          error_message: error.message.substring(0, 500),  // Truncate long errors
          retry_count: newRetryCount,
          processed_at: new Date().toISOString()
        })
      });

      const retryInfo = newRetryCount >= 3
        ? ' (max retries reached, manual intervention required)'
        : ` (retry ${newRetryCount}/3, will auto-retry after 10 min)`;

      console.log(`[Invoice Updater] Marked invoice ${invoice.id} as error${retryInfo}:`, error.message);
    } catch (e) {
      console.error(`[Invoice Updater] Failed to mark invoice ${invoice.id} as error:`, e);
    }
  }
}

/**
 * Update firm usage counters by incrementing for each processed invoice
 */
export async function updateFirmUsage(invoices: PendingInvoice[]) {
  console.log(`[Invoice Updater] updateFirmUsage called with ${invoices.length} invoices`);

  if (!POSTGREST_BASE_URL) {
    console.error('[Invoice Updater] Cannot update firm usage: POSTGREST_BASE_URL not defined');
    return;
  }

  // Group invoices by firm_id and count
  const firmCounts = new Map<number, number>();
  for (const inv of invoices) {
    console.log(`[Invoice Updater] Invoice ${inv.id} has firm_id: ${inv.firm_id}`);
    firmCounts.set(inv.firm_id, (firmCounts.get(inv.firm_id) || 0) + 1);
  }

  console.log(`[Invoice Updater] Firm counts:`, Object.fromEntries(firmCounts));

  // Increment usage for each firm
  for (const [firmId, count] of firmCounts) {
    try {
      const url = `${POSTGREST_BASE_URL}/rpc/increment_firm_usage`;
      console.log(`[Invoice Updater] Calling ${url} with firm_id=${firmId}, increment=${count}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          p_firm_id: firmId,
          p_increment: count
        })
      });

      const responseText = await response.text();
      console.log(`[Invoice Updater] Response: ${response.status} ${responseText}`);

      if (!response.ok) {
        throw new Error(`${response.status} ${responseText}`);
      }

      console.log(`[Invoice Updater] Incremented firm ${firmId} usage by +${count}`);
    } catch (error) {
      console.error(`[Invoice Updater] Failed to update firm ${firmId} usage:`, error);
    }
  }
}

/**
 * Parse date from dd/mm/yyyy format to ISO format (yyyy-mm-dd)
 */
function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr === 'null') return null;

  // Expected format: dd/mm/yyyy
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;  // Convert to ISO format for PostgreSQL
}

