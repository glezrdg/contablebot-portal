/**
 * /api/users/[id]/assign-clients
 *
 * POST - Assign clients to a user (admin only)
 *        Useful for fixing users created without client assignments
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/access-control';
import type { ErrorResponse } from '@/types';

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

interface AssignClientsRequest {
  clientIds: number[];
  defaultClientId?: number;
}

interface AssignClientsResponse {
  success: boolean;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AssignClientsResponse | ErrorResponse>
) {
  if (!POSTGREST_BASE_URL) {
    console.error('POSTGREST_BASE_URL is not configured');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Require admin role
  const session = await requireAdmin(req, res);
  if (!session) return;

  const { id } = req.query;
  const userId = parseInt(id as string, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  try {
    const { clientIds, defaultClientId } = req.body as AssignClientsRequest;

    // Validate input
    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un cliente' });
    }

    // Verify user exists and belongs to same firm
    const userUrl = `${POSTGREST_BASE_URL}/portal_users?id=eq.${userId}&firm_id=eq.${session.firmId}&select=id,role`;
    const userResponse = await fetch(userUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!userResponse.ok) {
      return res.status(500).json({ error: 'Error al verificar usuario' });
    }

    const users = await userResponse.json();
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verify all clients belong to this firm
    const clientsUrl = `${POSTGREST_BASE_URL}/clients?id=in.(${clientIds.join(',')})&firm_id=eq.${session.firmId}&select=id`;
    const clientsResponse = await fetch(clientsUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!clientsResponse.ok) {
      return res.status(500).json({ error: 'Error al verificar clientes' });
    }

    const validClients = await clientsResponse.json();
    if (validClients.length !== clientIds.length) {
      return res.status(400).json({ error: 'Uno o más clientes no son válidos' });
    }

    // Delete existing assignments
    const deleteUrl = `${POSTGREST_BASE_URL}/user_clients?user_id=eq.${userId}`;
    await fetch(deleteUrl, {
      method: 'DELETE',
    });

    // Create new assignments
    const clientAssignments = clientIds.map((clientId, index) => ({
      user_id: userId,
      client_id: clientId,
      is_default: clientId === defaultClientId || (index === 0 && !defaultClientId),
      assigned_by: session.portalUserId,
    }));

    const assignClientsUrl = `${POSTGREST_BASE_URL}/user_clients`;
    const assignResponse = await fetch(assignClientsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(clientAssignments),
    });

    if (!assignResponse.ok) {
      console.error('Error assigning clients:', assignResponse.status);
      return res.status(500).json({ error: 'Error al asignar clientes' });
    }

    // Update active_client_id to the default client
    const defaultClient = clientIds.find(id => id === defaultClientId) || clientIds[0];
    const updateActiveClientUrl = `${POSTGREST_BASE_URL}/portal_users?id=eq.${userId}`;
    await fetch(updateActiveClientUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ active_client_id: defaultClient }),
    });

    return res.status(200).json({
      success: true,
      message: `Clientes asignados correctamente (${clientIds.length} clientes)`,
    });
  } catch (error) {
    console.error('Error in POST /api/users/[id]/assign-clients:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
