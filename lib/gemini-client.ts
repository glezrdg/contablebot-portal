// Gemini Batch API Client
// Calls the existing gemini-batch server (same as n8n workflow)

import * as fs from 'fs';
import * as path from 'path';

const GEMINI_BATCH_URL = process.env.GEMINI_BATCH_URL || 'http://gemini-batch:4000/api/gemini-batch';

// Load prompt from file (cached)
let cachedPrompt: string | null = null;
function getPrompt(): string {
  if (!cachedPrompt) {
    const promptPath = path.join(process.cwd(), 'PROMPT.md');
    cachedPrompt = fs.readFileSync(promptPath, 'utf-8');
  }
  return cachedPrompt;
}

interface PendingInvoice {
  id: number;
  firm_id: number;
  user_id?: number;
  client_id?: number;
  client_name: string;
  rnc: string;
  raw_ocr_text: string;
  qa_feedback?: string; // Previous QA feedback for re-processing
}

export interface ExtractedInvoiceData {
  id_interna: number;
  RNC: string;
  RNC_CLIENTE: string;
  FECHA: string;
  "NOMBRE COMPAÑÍA": string;
  "NO. COMPROBANTE FISCAL": string;
  "TIPO NCF": string;
  "CATEGORIA NCF": string;
  MATERIALES: string;
  "MONTO EN SERVICIO EXENTO": number;
  "MONTO EN BIEN EXENTO": number;
  "TOTAL DE MONTOS EXENTO": number;
  "MONTO EN SERVICIO GRAVADO": number;
  "MONTO EN BIEN GRAVADO": number;
  "TOTAL DE MONTOS GRAVADO": number;
  "ITBIS SERVICIOS": number;
  "ITBIS COMPRAS BIENES": number;
  "TOTAL FACTURADO EN ITBIS": number;
  "ITBIS SERVICIOS RETENIDO": number;
  "RETENCION 30% ITBIS": number;
  "RETENCION 10%": number;
  "RETENCION 2%": number;
  PROPINA: number;
  "TOTAL FACTURADO": number;
  "TOTAL A COBRAR": number;
  CLASIFICACION_PREDOMINANTE: string;
  CONF_BIEN_SERVICIO: number;
  FLAG_DUDOSO: boolean;
  RAZON_DUDA: string;
}

/**
 * Result of processing a batch of invoices
 */
export interface ProcessBatchResult {
  extracted: ExtractedInvoiceData[];
  rawResponse: string;  // Original JSON string from Gemini for debugging
}

/**
 * Process a batch of invoices through the Gemini API server
 * This uses the same API endpoint that the n8n workflow uses
 * Returns both extracted data and raw response for storage
 */
export async function processInvoiceBatch(invoices: PendingInvoice[]): Promise<ProcessBatchResult> {
  console.log(`[Gemini Client] Processing batch of ${invoices.length} invoices`);

  // Build the exact prompt that n8n uses
  const prompt = buildBatchPrompt(invoices);

  // Call the existing Gemini API server
  const response = await fetch(GEMINI_BATCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      invoices
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  // Parse the response (same as n8n Code node)
  const raw = data.text;
  if (!raw) {
    throw new Error('Gemini API returned empty response');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error('[Gemini Client] Failed to parse JSON:', raw.substring(0, 500));
    throw new Error(`Failed to parse Gemini response: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  // Return array of extracted invoices and raw response
  const extracted = Array.isArray(parsed) ? parsed : [parsed];
  console.log(`[Gemini Client] Successfully extracted ${extracted.length} invoices`);

  return {
    extracted,
    rawResponse: raw  // Return raw for storage in raw_ai_dump
  };
}

/**
 * Build the prompt for invoice extraction
 * Loads base prompt from PROMPT.md file and appends invoice data in compact format
 */
function buildBatchPrompt(invoices: PendingInvoice[]): string {
  const basePrompt = getPrompt();

  // Build invoice data in compact format for token efficiency
  const invoiceData = invoices.map((inv, index) => {
    const parts = [
      `[F${index + 1}]`,
      `id:${inv.id}`,
      inv.rnc ? `rnc:${inv.rnc}` : null,
      inv.client_name ? `cli:${inv.client_name}` : null,
      inv.qa_feedback ? `qa:${inv.qa_feedback}` : null,
      `ocr:${inv.raw_ocr_text}`
    ].filter(Boolean);

    return parts.join('|');
  });

  return `${basePrompt}\n\n## INVOICES\n${invoiceData.join('\n---\n')}`;
}
