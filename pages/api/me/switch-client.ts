/**
 * POST /api/me/switch-client
 *
 * Allows a user to switch their active client context.
 * Validates that the user has access to the requested client.
 * Returns a new JWT token with the updated activeClientId.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, signToken, setAuthCookie } from '@/lib/auth';
import { verifyClientAccess, auditLog } from '@/lib/access-control';

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

interface SwitchClientRequest {
  clientId: number;
}

interface SwitchClientResponse {
  success: true;
  activeClientId: number;
}

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SwitchClientResponse | ErrorResponse>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Validate environment
  if (!POSTGREST_BASE_URL) {
    console.error('POSTGREST_BASE_URL is not configured');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  // Require authentication
  const session = requireAuth(req, res);
  if (!session) return;

  try {
    const { clientId } = req.body as SwitchClientRequest;

    // Validate input
    if (typeof clientId !== 'number' || clientId <= 0) {
      return res.status(400).json({ error: 'ID de cliente inválido' });
    }

    // Verify user has access to this client
    const hasAccess = await verifyClientAccess(
      session.portalUserId,
      clientId,
      session.role
    );

    if (!hasAccess) {
      await auditLog(
        session.portalUserId,
        'client.switch.denied',
        'client',
        clientId,
        { reason: 'no_access' },
        req
      );

      return res.status(403).json({
        error: 'No tienes permiso para acceder a este cliente'
      });
    }

    // Update active_client_id in database
    const updateUrl = `${POSTGREST_BASE_URL}/portal_users?id=eq.${session.portalUserId}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        active_client_id: clientId,
      }),
    });

    if (!updateResponse.ok) {
      console.error('Error updating active_client_id:', updateResponse.status);
      return res.status(500).json({ error: 'Error al cambiar cliente' });
    }

    // Generate new JWT with updated activeClientId
    const newToken = signToken({
      portalUserId: session.portalUserId,
      firmId: session.firmId,
      firmName: session.firmName,
      email: session.email,
      role: session.role,
      activeClientId: clientId,
      assignedClientIds: session.assignedClientIds,
    });

    setAuthCookie(res, newToken);

    // Audit log the switch
    await auditLog(
      session.portalUserId,
      'client.switched',
      'client',
      clientId,
      { from: session.activeClientId },
      req
    );

    return res.status(200).json({
      success: true,
      activeClientId: clientId,
    });
  } catch (error) {
    console.error('Error in /api/me/switch-client:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
