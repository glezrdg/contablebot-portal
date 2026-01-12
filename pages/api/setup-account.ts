// POST /api/setup-account - First-time account setup with license_key
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

  // Validate environment variables
  if (!POSTGREST_BASE_URL) {
    console.error("POSTGREST_BASE_URL is not defined");
    return res
      .status(500)
      .json({ error: "Error de configuración del servidor" });
  }

  // Extract and validate request body
  const { licenseKey, email, password, confirmPassword } = req.body;

  // Basic validation
  if (
    !licenseKey ||
    typeof licenseKey !== "string" ||
    licenseKey.trim().length === 0
  ) {
    return res.status(400).json({ error: "La licencia es requerida" });
  }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Email inválido" });
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return res
      .status(400)
      .json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Las contraseñas no coinciden" });
  }

  try {
    // Step 1: Find the firm by license_key (must be active)
    const firmUrl = `${POSTGREST_BASE_URL}/firms?license_key=eq.${encodeURIComponent(
      licenseKey.trim()
    )}&is_active=eq.true`;
    const firmResponse = await fetch(firmUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!firmResponse.ok) {
      console.error("PostgREST error fetching firm:", firmResponse.status);
      return res.status(500).json({ error: "Error al validar la licencia" });
    }

    const firms: Firm[] = await firmResponse.json();

    if (!firms || firms.length === 0) {
      return res
        .status(400)
        .json({ error: "Licencia inválida o cuenta inactiva" });
    }

    const firm = firms[0];

    // Step 2: Check if this firm already has a portal user
    const existingUserUrl = `${POSTGREST_BASE_URL}/portal_users?firm_id=eq.${firm.id}`;
    const existingUserResponse = await fetch(existingUserUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!existingUserResponse.ok) {
      console.error(
        "PostgREST error checking existing user:",
        existingUserResponse.status
      );
      return res
        .status(500)
        .json({ error: "Error al verificar cuenta existente" });
    }

    const existingUsers: PortalUser[] = await existingUserResponse.json();

    if (existingUsers && existingUsers.length > 0) {
      return res
        .status(400)
        .json({
          error: "Esta licencia ya tiene una cuenta registrada. Use el login.",
        });
    }

    // Step 3: Check if email is already in use
    const emailCheckUrl = `${POSTGREST_BASE_URL}/portal_users?email=eq.${encodeURIComponent(
      email.toLowerCase().trim()
    )}`;
    const emailCheckResponse = await fetch(emailCheckUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (emailCheckResponse.ok) {
      const emailUsers: PortalUser[] = await emailCheckResponse.json();
      if (emailUsers && emailUsers.length > 0) {
        return res.status(400).json({ error: "Este email ya está registrado" });
      }
    }

    // Step 4: Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Step 5: Create the portal user in PostgREST
    const createUserUrl = `${POSTGREST_BASE_URL}/portal_users`;
    const createUserResponse = await fetch(createUserUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        firm_id: firm.id,
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
      }),
    });

    if (!createUserResponse.ok) {
      const errorText = await createUserResponse.text();
      console.error(
        "PostgREST error creating user:",
        createUserResponse.status,
        errorText
      );
      return res.status(500).json({ error: "Error al crear la cuenta" });
    }

    const createdUsers: PortalUser[] = await createUserResponse.json();

    if (!createdUsers || createdUsers.length === 0) {
      return res.status(500).json({ error: "Error al crear la cuenta" });
    }

    const portalUser = createdUsers[0];

    // Step 6: Sign JWT and set cookie
    const token = signToken({
      portalUserId: portalUser.id,
      firmId: firm.id,
      firmName: firm.name,
      email: portalUser.email,
      role: 'admin', // First user is always admin
    });

    setAuthCookie(res, token);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error in setup-account:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
