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
  const { from, to, createdFrom, createdTo, client, clientId, page, limit } = req.query;

  // Build the PostgREST query URL
  const queryParams: string[] = [];

  // Always filter by firm_id from the authenticated session
  queryParams.push(`firm_id=eq.${session.firmId}`);

  // Always filter out soft-deleted invoices
  queryParams.push(`is_deleted=eq.false`);

  // Backend enforcement: Non-admin users can only see their active client's data
  // Admin users can manually filter by clientId parameter or see all clients
  if (session.role !== 'admin' && session.activeClientId) {
    // Non-admin users are restricted to their active client
    queryParams.push(`client_id=eq.${session.activeClientId}`);
  } else if (clientId && typeof clientId === "string") {
    // Admin users can manually filter by clientId
    queryParams.push(`client_id=eq.${encodeURIComponent(clientId)}`);
  }

  // Optional: filter by fecha >= from (YYYY-MM-DD format)
  if (from && typeof from === "string") {
    // Validate date format and pass directly (YYYY-MM-DD is URL-safe)
    const fromDate = from.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
      queryParams.push(`fecha=gte.${fromDate}`);
    }
  }

  // Optional: filter by fecha <= to (YYYY-MM-DD format)
  if (to && typeof to === "string") {
    const toDate = to.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
      queryParams.push(`fecha=lte.${toDate}`);
    }
  }

  // Optional: filter by created_at >= createdFrom (ISO timestamp - for dashboard usage tracking)
  if (createdFrom && typeof createdFrom === "string") {
    queryParams.push(`created_at=gte.${encodeURIComponent(createdFrom)}`);
  }

  // Optional: filter by created_at < createdTo (ISO timestamp)
  if (createdTo && typeof createdTo === "string") {
    queryParams.push(`created_at=lt.${encodeURIComponent(createdTo)}`);
  }

  // Optional: filter by client_name (case-insensitive partial match)
  if (client && typeof client === "string" && client.trim().length > 0) {
    // Use ILIKE for case-insensitive partial match
    queryParams.push(
      `client_name=ilike.*${encodeURIComponent(client.trim())}*`
    );
  }

  // Pagination
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 50;
  const offset = (pageNum - 1) * limitNum;

  queryParams.push(`limit=${limitNum}`);
  queryParams.push(`offset=${offset}`);

  // Add ordering by fecha descending for better UX
  queryParams.push("order=fecha.desc");

  const postgrestUrl = `${POSTGREST_BASE_URL}/invoices?${queryParams.join(
    "&"
  )}`;
  console.log("Query Params: ", queryParams);
  // Debug log for troubleshooting
  console.log("[invoices API] PostgREST URL:", postgrestUrl);

  try {
    const response = await fetch(postgrestUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Prefer: "count=exact", // Get total count for pagination
      },
    });

    if (!response.ok) {
      console.error("PostgREST error:", response.status, response.statusText);
      return res.status(500).json({ error: "Error al obtener las facturas" });
    }

    const invoices: Invoice[] = await response.json();

    // Parse total count from Content-Range header
    const contentRange = response.headers.get("content-range");
    let total = invoices.length;
    if (contentRange) {
      const match = contentRange.match(/\/(\d+)/);
      if (match) {
        total = parseInt(match[1], 10);
      }
    }

    return res.status(200).json({
      invoices,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error("Error calling PostgREST:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
