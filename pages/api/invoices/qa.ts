// GET /api/invoices/qa - Fetch invoices that need quality review
import type { NextApiRequest, NextApiResponse } from "next";
import type { Invoice, ErrorResponse } from "../../../types";
import { requireAuth } from "../../../lib/auth";
import { validateInvoice, getQualityLevel, type ValidationResult } from "../../../lib/invoice-validator";

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

interface QAInvoice extends Invoice {
  validation: ValidationResult;
  qualityLevel: 'good' | 'review' | 'bad';
}

interface QAResponse {
  invoices: QAInvoice[];
  stats: {
    total: number;
    flaggedByAI: number;
    lowConfidence: number;
    mathErrors: number;
    missingFields: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QAResponse | ErrorResponse>
) {
  // Only allow GET method
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Validate environment variable
  if (!POSTGREST_BASE_URL) {
    console.error("POSTGREST_BASE_URL is not defined");
    return res.status(500).json({ error: "Error de configuración del servidor" });
  }

  // Require authentication
  const session = requireAuth(req, res);
  if (!session) return;

  // Only admins can access QA dashboard
  if (session.role !== 'admin') {
    return res.status(403).json({ error: "Acceso denegado. Solo administradores." });
  }

  // Extract optional query parameters
  const { filter, limit } = req.query;
  const limitNum = parseInt(limit as string) || 100;

  // Build PostgREST query - fetch recent processed invoices
  const queryParams: string[] = [
    `firm_id=eq.${session.firmId}`,
    `is_deleted=eq.false`,
    `status=neq.pending`,  // Only processed invoices
    `status=neq.processing`,
    `limit=${limitNum}`,
    `order=processed_at.desc`
  ];

  // Optional: filter by flag_dudoso only
  if (filter === 'flagged') {
    queryParams.push('flag_dudoso=eq.true');
  }

  const postgrestUrl = `${POSTGREST_BASE_URL}/invoices?${queryParams.join("&")}`;

  try {
    const response = await fetch(postgrestUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("PostgREST error:", response.status, response.statusText);
      return res.status(500).json({ error: "Error al obtener las facturas" });
    }

    const invoices: Invoice[] = await response.json();

    // Validate each invoice and compute quality scores
    const stats = {
      total: invoices.length,
      flaggedByAI: 0,
      lowConfidence: 0,
      mathErrors: 0,
      missingFields: 0
    };

    const qaInvoices: QAInvoice[] = [];

    for (const invoice of invoices) {
      const validation = validateInvoice(invoice);
      const qualityLevel = getQualityLevel(validation.qualityScore);

      // Update stats
      if (invoice.flag_dudoso) stats.flaggedByAI++;
      if (validation.confidenceScore < 0.7) stats.lowConfidence++;
      if (!validation.mathValid) stats.mathErrors++;
      if (!validation.hasRequiredFields) stats.missingFields++;

      // Filter based on query param
      if (filter === 'all' || !filter) {
        // Return all invoices with validation data
        qaInvoices.push({ ...invoice, validation, qualityLevel });
      } else if (filter === 'flagged' && invoice.flag_dudoso) {
        qaInvoices.push({ ...invoice, validation, qualityLevel });
      } else if (filter === 'lowConfidence' && validation.confidenceScore < 0.7) {
        qaInvoices.push({ ...invoice, validation, qualityLevel });
      } else if (filter === 'mathError' && !validation.mathValid) {
        qaInvoices.push({ ...invoice, validation, qualityLevel });
      } else if (filter === 'needsReview' && qualityLevel !== 'good') {
        qaInvoices.push({ ...invoice, validation, qualityLevel });
      }
    }

    return res.status(200).json({
      invoices: qaInvoices,
      stats
    });
  } catch (error) {
    console.error("Error calling PostgREST:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
