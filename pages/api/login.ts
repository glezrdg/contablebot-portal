// POST /api/login - Email/password authentication
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import type {
  Firm,
  PortalUser,
  AuthSuccessResponse,
  ErrorResponse,
} from "../../types";
import { signToken, setAuthCookie } from "../../lib/auth";

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthSuccessResponse | ErrorResponse>
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

  // Extract credentials from request body
  const { email, password } = req.body;

  // Basic validation
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Email inválido" });
  }

  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "Contraseña requerida" });
  }

  try {
    // Step 1: Find portal user by email
    const userUrl = `${POSTGREST_BASE_URL}/portal_users?email=eq.${encodeURIComponent(
      email.toLowerCase().trim()
    )}`;
    const userResponse = await fetch(userUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!userResponse.ok) {
      console.error("PostgREST error fetching user:", userResponse.status);
      return res.status(500).json({ error: "Error al validar credenciales" });
    }

    const users: PortalUser[] = await userResponse.json();

    if (!users || users.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const portalUser = users[0];

    // Step 2: Verify password
    const passwordMatch = await bcrypt.compare(
      password,
      portalUser.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Step 3: Fetch the related firm and check if active
    const firmUrl = `${POSTGREST_BASE_URL}/firms?id=eq.${portalUser.firm_id}`;
    const firmResponse = await fetch(firmUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!firmResponse.ok) {
      console.error("PostgREST error fetching firm:", firmResponse.status);
      return res.status(500).json({ error: "Error al validar cuenta" });
    }

    const firms: Firm[] = await firmResponse.json();

    if (!firms || firms.length === 0) {
      return res.status(403).json({ error: "Cuenta no encontrada" });
    }

    const firm = firms[0];

    if (!firm.is_active) {
      return res
        .status(403)
        .json({ error: "Cuenta inactiva. Contacte soporte." });
    }

    // Step 4: Sign JWT and set cookie
    const token = signToken({
      portalUserId: portalUser.id,
      firmId: firm.id,
      firmName: firm.name,
      email: portalUser.email,
    });

    setAuthCookie(res, token);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
