/**
 * POST /api/change-password
 *
 * Allows authenticated users to change their password
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/auth';
import { sendPasswordChangedEmail } from '@/lib/email';
import type { ErrorResponse } from '@/types';

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  success: true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChangePasswordResponse | ErrorResponse>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Validate environment variable
  if (!POSTGREST_BASE_URL) {
    console.error('POSTGREST_BASE_URL is not configured');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  // Require authentication
  const session = requireAuth(req, res);
  if (!session) return;

  try {
    const { currentPassword, newPassword } = req.body as ChangePasswordRequest;

    // Validate input
    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({ error: 'Contraseña actual requerida' });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'Nueva contraseña requerida' });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }

    // Prevent using the same password
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual' });
    }

    // Fetch current user from database
    const userUrl = `${POSTGREST_BASE_URL}/portal_users?id=eq.${session.portalUserId}`;
    const userResponse = await fetch(userUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!userResponse.ok) {
      console.error('Error fetching user:', userResponse.status);
      return res.status(500).json({ error: 'Error al verificar usuario' });
    }

    const users = await userResponse.json();
    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    const updateUrl = `${POSTGREST_BASE_URL}/portal_users?id=eq.${session.portalUserId}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!updateResponse.ok) {
      console.error('Error updating password:', updateResponse.status);
      return res.status(500).json({ error: 'Error al actualizar contraseña' });
    }

    // Send confirmation email (don't block on this)
    sendPasswordChangedEmail(user.email, user.full_name).catch((error) => {
      console.error('Failed to send password changed email:', error);
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/change-password:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export const config = {
  runtime: 'nodejs',
};
