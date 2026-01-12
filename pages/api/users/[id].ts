/**
 * /api/users/[id]
 *
 * PATCH  - Update user details and client assignments (admin only)
 * DELETE - Deactivate user (admin only)
 */

import type { NextApiRequest, NextApiResponse} from 'next';
import { requireAdmin, auditLog } from '@/lib/access-control';
import type { UpdateUserRequest, ErrorResponse } from '@/types';

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: true } | ErrorResponse>
) {
  if (!POSTGREST_BASE_URL) {
    console.error('POSTGREST_BASE_URL is not configured');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  // Extract user ID from query
  const { id } = req.query;
  const userId = typeof id === 'string' ? parseInt(id, 10) : null;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  // PATCH - Update user
  if (req.method === 'PATCH') {
    return handleUpdateUser(req, res, userId);
  }

  // DELETE - Deactivate user
  if (req.method === 'DELETE') {
    return handleDeleteUser(req, res, userId);
  }

  res.setHeader('Allow', ['PATCH', 'DELETE']);
  return res.status(405).json({ error: 'Método no permitido' });
}

/**
 * PATCH /api/users/[id] - Update user
 */
async function handleUpdateUser(
  req: NextApiRequest,
  res: NextApiResponse<{ success: true } | ErrorResponse>,
  userId: number
) {
  // Require admin role
  const session = await requireAdmin(req, res);
  if (!session) return;

  try {
    const { fullName, isActive, clientIds, defaultClientId } = req.body as UpdateUserRequest;

    // Verify user exists and belongs to this firm
    const userUrl = `${POSTGREST_BASE_URL}/portal_users?id=eq.${userId}&firm_id=eq.${session.firmId}`;
    const userResponse = await fetch(userUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!userResponse.ok) {
      return res.status(500).json({ error: 'Error al verificar usuario' });
    }

    const users = await userResponse.json();
    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const existingUser = users[0];

    // Prevent modifying own admin status or admin users
    if (existingUser.role === 'admin') {
      return res.status(403).json({ error: 'No se pueden modificar usuarios administradores' });
    }

    // Build update payload
    const updatePayload: Record<string, any> = {};

    if (fullName !== undefined) {
      updatePayload.full_name = fullName || null;
    }

    if (isActive !== undefined) {
      updatePayload.is_active = isActive;
    }

    // Update user if there are changes
    if (Object.keys(updatePayload).length > 0) {
      const updateUrl = `${POSTGREST_BASE_URL}/portal_users?id=eq.${userId}`;
      const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!updateResponse.ok) {
        console.error('Error updating user:', updateResponse.status);
        return res.status(500).json({ error: 'Error al actualizar usuario' });
      }
    }

    // Update client assignments if provided
    if (clientIds && Array.isArray(clientIds)) {
      if (clientIds.length === 0) {
        return res.status(400).json({ error: 'El usuario debe tener al menos un cliente asignado' });
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
      await fetch(deleteUrl, { method: 'DELETE' });

      // Create new assignments
      const clientAssignments = clientIds.map((clientId, index) => ({
        user_id: userId,
        client_id: clientId,
        is_default: clientId === defaultClientId || (index === 0 && !defaultClientId),
        assigned_by: session.portalUserId,
      }));

      const assignUrl = `${POSTGREST_BASE_URL}/user_clients`;
      const assignResponse = await fetch(assignUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(clientAssignments),
      });

      if (!assignResponse.ok) {
        console.error('Error assigning clients:', assignResponse.status);
        return res.status(500).json({ error: 'Error al actualizar asignación de clientes' });
      }
    }

    // Audit log
    await auditLog(
      session.portalUserId,
      'user.updated',
      'user',
      userId,
      { changes: { fullName, isActive, clientIds }, updatedBy: session.email },
      req
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/users/[id]:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * DELETE /api/users/[id] - Deactivate user
 */
async function handleDeleteUser(
  req: NextApiRequest,
  res: NextApiResponse<{ success: true } | ErrorResponse>,
  userId: number
) {
  // Require admin role
  const session = await requireAdmin(req, res);
  if (!session) return;

  try {
    // Verify user exists and belongs to this firm
    const userUrl = `${POSTGREST_BASE_URL}/portal_users?id=eq.${userId}&firm_id=eq.${session.firmId}`;
    const userResponse = await fetch(userUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!userResponse.ok) {
      return res.status(500).json({ error: 'Error al verificar usuario' });
    }

    const users = await userResponse.json();
    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const existingUser = users[0];

    // Prevent deleting admin users
    if (existingUser.role === 'admin') {
      return res.status(403).json({ error: 'No se pueden eliminar usuarios administradores' });
    }

    // Prevent self-deletion
    if (userId === session.portalUserId) {
      return res.status(403).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    // Soft delete: set is_active = false
    const updateUrl = `${POSTGREST_BASE_URL}/portal_users?id=eq.${userId}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        is_active: false,
      }),
    });

    if (!updateResponse.ok) {
      console.error('Error deactivating user:', updateResponse.status);
      return res.status(500).json({ error: 'Error al desactivar usuario' });
    }

    // Audit log
    await auditLog(
      session.portalUserId,
      'user.deactivated',
      'user',
      userId,
      { email: existingUser.email, deletedBy: session.email },
      req
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/users/[id]:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
