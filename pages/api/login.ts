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

    // Step 4: Fetch user's assigned clients
    const clientsUrl = `${POSTGREST_BASE_URL}/user_clients?user_id=eq.${portalUser.id}&select=client_id,is_default`;
    const clientsResponse = await fetch(clientsUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    let activeClientId: number | undefined;
    let assignedClientIds: number[] = [];

    if (clientsResponse.ok) {
      const userClients = await clientsResponse.json();
      assignedClientIds = userClients.map((uc: { client_id: number }) => uc.client_id);

      // Find default client or use first assigned
      const defaultClient = userClients.find((uc: { is_default: boolean }) => uc.is_default);
      activeClientId = defaultClient?.client_id || userClients[0]?.client_id;
    }

    // For regular users, verify they have at least one client assigned
    if (portalUser.role === 'user' && assignedClientIds.length === 0) {
      return res.status(403).json({
        error: 'Sin clientes asignados. Contacte al administrador.'
      });
    }

    // Step 5: Update last_login_at
    await fetch(`${POSTGREST_BASE_URL}/portal_users?id=eq.${portalUser.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        last_login_at: new Date().toISOString(),
        active_client_id: activeClientId,
      }),
    });

    // Step 6: Sign JWT with role and client info
    const token = signToken({
      portalUserId: portalUser.id,
      firmId: firm.id,
      firmName: firm.name,
      email: portalUser.email,
      role: portalUser.role,
      activeClientId,
      assignedClientIds,
    });

    setAuthCookie(res, token);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
