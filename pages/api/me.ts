// GET /api/me - Get current user and firm info from JWT session
import type { NextApiRequest, NextApiResponse } from "next";
import type { Firm, MeResponse, ErrorResponse } from "../../types";
import { requireAuth } from "../../lib/auth";

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MeResponse | ErrorResponse>
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

  // Require authentication
  const session = requireAuth(req, res);
  if (!session) return; // Response already sent by requireAuth

  try {
    // Fetch fresh firm data from PostgREST
    const firmUrl = `${POSTGREST_BASE_URL}/firms?id=eq.${session.firmId}`;
    const firmResponse = await fetch(firmUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!firmResponse.ok) {
      console.error("PostgREST error fetching firm:", firmResponse.status);
      return res
        .status(500)
        .json({ error: "Error al obtener información de la empresa" });
    }

    const firms: Firm[] = await firmResponse.json();

    if (!firms || firms.length === 0) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    const firm = firms[0];

    // Fetch user data to get active_client_rnc
    // NOTE: Using portal_users table (later we'll migrate from telegram_id-based users table)
    const userUrl = `${POSTGREST_BASE_URL}/portal_users?id=eq.${session.portalUserId}&select=id,active_client_rnc`;
    const userResponse = await fetch(userUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    let activeClientRnc: string | undefined;
    let activeClientName: string | undefined;

    if (userResponse.ok) {
      const users = await userResponse.json();
      if (users && users.length > 0) {
        activeClientRnc = users[0].active_client_rnc || undefined;

        // If user has an active client, fetch client details
        // Note: client.name contains the RNC value
        if (activeClientRnc) {
          const clientUrl = `${POSTGREST_BASE_URL}/clients?firm_id=eq.${firm.id}&name=eq.${activeClientRnc}&select=id,name`;
          const clientResponse = await fetch(clientUrl, {
            method: "GET",
            headers: { Accept: "application/json" },
          });

          if (clientResponse.ok) {
            const clients = await clientResponse.json();
            if (clients && clients.length > 0) {
              // activeClientName will be the same as activeClientRnc since name contains RNC
              activeClientName = clients[0].name;
            }
          }
        }
      }
    }

    return res.status(200).json({
      firmId: firm.id,
      firmName: firm.name,
      email: session.email,
      usedThisMonth: firm.used_this_month,
      planLimit: firm.plan_limit,
      isActive: firm.is_active,
      manageUrl: firm.manage_url || undefined,
      activeClientRnc,
      activeClientName,
    });
  } catch (error) {
    console.error("Error in /api/me:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
