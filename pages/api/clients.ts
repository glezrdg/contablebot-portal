// GET /api/clients - Fetch unique clients for filter buttons
import type { NextApiRequest, NextApiResponse } from "next";
import type { Client, ClientsResponse, ErrorResponse } from "../../types";
import { requireAuth } from "../../lib/auth";

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClientsResponse | ErrorResponse>
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

  // Build the PostgREST query URL to get distinct clients from invoices
  // We'll get unique client_name and client_id combinations from non-deleted invoices
  const queryParams: string[] = [];
  queryParams.push(`firm_id=eq.${session.firmId}`);
  queryParams.push(`is_deleted=eq.false`);
  queryParams.push(`select=client_id,client_name,rnc`);
  queryParams.push(`order=client_name.asc`);

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
      return res.status(500).json({ error: "Error al obtener los clientes" });
    }

    const invoices: {
      client_id: number | null;
      client_name: string;
      rnc: string;
    }[] = await response.json();

    // Extract unique clients
    const clientMap = new Map<string, Client>();

    for (const inv of invoices) {
      const key = inv.client_id
        ? `id:${inv.client_id}`
        : `name:${inv.client_name}`;

      if (!clientMap.has(key)) {
        clientMap.set(key, {
          id: inv.client_id ?? 0,
          firm_id: session.firmId,
          name: inv.client_name,
          rnc: inv.rnc,
        });
      }
    }

    const clients = Array.from(clientMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return res.status(200).json({ clients });
  } catch (error) {
    console.error("Error calling PostgREST:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
