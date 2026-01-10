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

    return res.status(200).json({
      firmId: firm.id,
      firmName: firm.name,
      email: session.email,
      usedThisMonth: firm.used_this_month,
      planLimit: firm.plan_limit,
      isActive: firm.is_active,
      manageUrl: firm.manage_url || undefined,
    });
  } catch (error) {
    console.error("Error in /api/me:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
