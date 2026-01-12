// GET /api/clients - Fetch unique clients for filter buttons
// POST /api/clients - Create a new client with RNC validation
import type { NextApiRequest, NextApiResponse } from "next";
import type { Client, ClientsResponse, ErrorResponse } from "../../types";
import { requireAuth } from "../../lib/auth";
import { validateRnc } from "../../lib/rnc-validator";

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

interface CreateClientRequest {
  name: string;
  rnc: string; // Can be formatted or compact
}

interface CreateClientResponse {
  client: Client;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClientsResponse | CreateClientResponse | ErrorResponse>
) {
  // Route to appropriate handler
  if (req.method === "GET") {
    return handleGet(req, res);
  } else if (req.method === "POST") {
    return handlePost(req, res);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Método no permitido" });
  }
}

// GET handler - fetch clients
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<ClientsResponse | ErrorResponse>
) {

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

  // Query clients table directly (not invoices!)
  const queryParams: string[] = [];
  queryParams.push(`firm_id=eq.${session.firmId}`);
  queryParams.push(`select=id,firm_id,name,rnc`);
  queryParams.push(`order=name.asc`);

  const postgrestUrl = `${POSTGREST_BASE_URL}/clients?${queryParams.join(
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

    const clients: Client[] = await response.json();

    return res.status(200).json({ clients });
  } catch (error) {
    console.error("Error calling PostgREST:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST handler - create new client
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<CreateClientResponse | ErrorResponse>
) {
  // Validate environment variable
  if (!POSTGREST_BASE_URL) {
    console.error("POSTGREST_BASE_URL is not defined");
    return res.status(500).json({ error: "Error de configuración del servidor" });
  }

  // Require authentication
  const session = requireAuth(req, res);
  if (!session) return; // Response already sent by requireAuth

  try {
    const { rnc, name } = req.body;

    // Debug logging
    console.log("[POST /api/clients] Received:", { rnc, name, types: { rnc: typeof rnc, name: typeof name } });

    // Validate inputs
    if (!rnc || rnc.trim().length === 0) {
      return res.status(400).json({ error: "El RNC es requerido" });
    }
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "El nombre del cliente es requerido" });
    }

    // Validate RNC format
    const rncValidation = validateRnc(rnc);
    console.log("[POST /api/clients] Validation result:", {
      valid: rncValidation.valid,
      type: rncValidation.type,
      compact: rncValidation.compact,
      formatted: rncValidation.formatted,
      error: rncValidation.error
    });
    if (!rncValidation.valid) {
      return res.status(400).json({
        error: rncValidation.error || "RNC/Cédula inválido"
      });
    }

    // Check if client with this RNC already exists for this firm
    const checkUrl = `${POSTGREST_BASE_URL}/clients?firm_id=eq.${session.firmId}&rnc=eq.${rncValidation.compact}`;
    const checkResponse = await fetch(checkUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (checkResponse.ok) {
      const existing = await checkResponse.json();
      if (existing && existing.length > 0) {
        return res.status(409).json({
          error: `Ya existe un cliente con RNC ${rncValidation.formatted}`
        });
      }
    }

    // Create client - store business name in name, compact RNC in rnc
    const createUrl = `${POSTGREST_BASE_URL}/clients`;
    const requestBody = {
      firm_id: session.firmId,
      name: name,                    // Business name
      rnc: rncValidation.compact     // Compact RNC (digits only)
    };

    console.log("[POST /api/clients] Creating client with data:", requestBody);

    const createResponse = await fetch(createUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(requestBody)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("[POST /api/clients] PostgREST error:", {
        status: createResponse.status,
        statusText: createResponse.statusText,
        errorText: errorText,
        requestBody: requestBody
      });
      return res.status(createResponse.status).json({
        error: `Error al crear el cliente: ${errorText}`
      });
    }

    const clients = await createResponse.json();
    const client = clients[0];

    return res.status(201).json({
      client: {
        id: client.id,
        firm_id: client.firm_id,
        name: client.name,
        rnc: client.rnc
      }
    });
  } catch (error) {
    console.error("Error in POST /api/clients:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
