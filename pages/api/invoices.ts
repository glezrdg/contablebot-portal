// GET /api/invoices - Fetch invoices for the authenticated firm
import type { NextApiRequest, NextApiResponse } from "next";
import type { Invoice, InvoicesResponse, ErrorResponse } from "../../types";
import { requireAuth } from "../../lib/auth";

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InvoicesResponse | ErrorResponse>
) {
  // Only allow GET method
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Validate environment variable
  if (!POSTGREST_BASE_URL) {
    console.error("POSTGREST_BASE_URL is not defined");
    return res
      .status(500)
      .json({ error: "Error de configuración del servidor" });
  }

  // Require authentication and get firmId from JWT
  const session = requireAuth(req, res);
  if (!session) return; // Response already sent by requireAuth

  // Extract optional query parameters
  const { from, to, client } = req.query;

  // Build the PostgREST query URL
  const queryParams: string[] = [];

  // Always filter by firm_id from the authenticated session
  queryParams.push(`firm_id=eq.${session.firmId}`);

  // Optional: filter by fecha >= from
  if (from && typeof from === "string") {
    queryParams.push(`fecha=gte.${encodeURIComponent(from)}`);
  }

  // Optional: filter by fecha <= to
  if (to && typeof to === "string") {
    queryParams.push(`fecha=lte.${encodeURIComponent(to)}`);
  }

  // Optional: filter by client_name (case-insensitive partial match)
  if (client && typeof client === "string" && client.trim().length > 0) {
    // Use ILIKE for case-insensitive partial match
    queryParams.push(
      `client_name=ilike.*${encodeURIComponent(client.trim())}*`
    );
  }

  // Add limit
  queryParams.push("limit=100");

  // Add ordering by fecha descending for better UX
  queryParams.push("order=fecha.desc");

  const postgrestUrl = `${POSTGREST_BASE_URL}/invoices?${queryParams.join(
    "&"
  )}`;

  try {
    const response = await fetch(postgrestUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error("PostgREST error:", response.status, response.statusText);
      return res.status(500).json({ error: "Error al obtener las facturas" });
    }

    const invoices: Invoice[] = await response.json();

    return res.status(200).json({ invoices });
  } catch (error) {
    console.error("Error calling PostgREST:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
