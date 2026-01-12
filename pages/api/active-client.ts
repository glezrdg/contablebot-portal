// PUT /api/active-client - Set the active client for the current user
import type { NextApiRequest, NextApiResponse } from "next";
import type { ErrorResponse } from "../../types";
import { requireAuth } from "../../lib/auth";
import { validateRnc } from "../../lib/rnc-validator";

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

interface SetActiveClientRequest {
  rnc: string; // Client RNC (can be formatted or compact)
}

interface SetActiveClientResponse {
  ok: true;
  activeClientRnc: string; // Compact RNC
  activeClientName?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SetActiveClientResponse | ErrorResponse>
) {
  // Only allow PUT method
  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Validate environment variable
  if (!POSTGREST_BASE_URL) {
    console.error("POSTGREST_BASE_URL is not defined");
    return res
      .status(500)
      .json({ error: "Error de configuración del servidor" });
  }

  // Require authentication
  const session = requireAuth(req, res);
  if (!session) return; // Response already sent by requireAuth

  try {
    const { rnc } = req.body as SetActiveClientRequest;

    // Validate RNC format
    const rncValidation = validateRnc(rnc);
    if (!rncValidation.valid) {
      return res
        .status(400)
        .json({ error: rncValidation.error || "RNC inválido" });
    }

    // Check if client exists for this firm (query by rnc field, not name)
    const clientUrl = `${POSTGREST_BASE_URL}/clients?firm_id=eq.${session.firmId}&rnc=eq.${rncValidation.compact}`;
    const clientResponse = await fetch(clientUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!clientResponse.ok) {
      console.error("PostgREST error fetching client:", clientResponse.status);
      return res.status(500).json({ error: "Error al verificar el cliente" });
    }

    const clients = await clientResponse.json();

    if (!clients || clients.length === 0) {
      return res.status(404).json({
        error: `Cliente con RNC ${rncValidation.formatted} no encontrado. Debes crear el cliente primero.`,
      });
    }

    const client = clients[0];

    // Update user's active_client_id in portal_users table
    const updateUrl = `${POSTGREST_BASE_URL}/portal_users?id=eq.${session.portalUserId}`;
    const updateResponse = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        active_client_id: client.id,
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error(
        "PostgREST error updating user:",
        updateResponse.status,
        errorText
      );
      return res
        .status(500)
        .json({ error: "Error al actualizar el cliente activo" });
    }

    return res.status(200).json({
      ok: true,
      activeClientRnc: rncValidation.compact,
      activeClientName: client.name,
    });
  } catch (error) {
    console.error("Error in /api/active-client:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
