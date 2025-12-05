import type { NextApiRequest, NextApiResponse } from "next";
import type { Firm, LoginResponse, ErrorResponse } from "../../types";

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse | ErrorResponse>
) {
  // Only allow POST method
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Validate environment variable
  if (!POSTGREST_BASE_URL) {
    console.error("POSTGREST_BASE_URL is not defined");
    return res
      .status(500)
      .json({ error: "Error de configuración del servidor" });
  }

  // Extract license_key from request body
  const { license_key } = req.body;

  if (!license_key || typeof license_key !== "string") {
    return res
      .status(400)
      .json({ error: "Debe proporcionar una licencia válida" });
  }

  try {
    // Query PostgREST for the firm with this license_key
    const postgrestUrl = `${POSTGREST_BASE_URL}/firms?license_key=eq.${encodeURIComponent(
      license_key
    )}`;

    const response = await fetch(postgrestUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("PostgREST error:", response.status, response.statusText);
      return res.status(500).json({ error: "Error al validar la licencia" });
    }

    const firms: Firm[] = await response.json();

    // Check if we found a matching firm
    if (!firms || firms.length === 0) {
      return res.status(401).json({ error: "Licencia inválida" });
    }

    const firm = firms[0];

    // Return the firm data
    return res.status(200).json({
      firmId: firm.id,
      firmName: firm.name,
      usageCurrentMonth: firm.usage_current_month,
      planLimit: firm.plan_limit,
    });
  } catch (error) {
    console.error("Error calling PostgREST:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
