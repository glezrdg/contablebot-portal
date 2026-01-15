/**
 * POST /api/password-reset/verify
 *
 * Completes password reset process
 * - Validates reset token
 * - Updates password
 * - Sends confirmation email
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendPasswordChangedEmail } from '@/lib/email';
import type { ErrorResponse } from '@/types';

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

interface PasswordResetVerifyBody {
  token: string;
  newPassword: string;
}

interface PasswordResetVerifyResponse {
  success: true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PasswordResetVerifyResponse | ErrorResponse>
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

  try {
    const { token, newPassword } = req.body as PasswordResetVerifyBody;

    // Validate input
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token inválido' });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'Nueva contraseña requerida' });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token that hasn't expired
    const now = new Date().toISOString();
    const userUrl = `${POSTGREST_BASE_URL}/portal_users?reset_token_hash=eq.${tokenHash}&reset_token_expires=gt.${now}`;
    const userResponse = await fetch(userUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!userResponse.ok) {
      console.error('Error fetching user:', userResponse.status);
      return res.status(500).json({ error: 'Error al verificar token' });
    }

    const users = await userResponse.json();

    if (!users || users.length === 0) {
      return res.status(400).json({
        error: 'Token inválido o expirado. Solicita un nuevo enlace de restablecimiento.',
      });
    }

    const user = users[0];

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    const updateUrl = `${POSTGREST_BASE_URL}/portal_users?id=eq.${user.id}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        password_hash: newPasswordHash,
        reset_token_hash: null,
        reset_token_expires: null,
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
    console.error('Error in POST /api/password-reset/verify:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export const config = {
  runtime: 'nodejs',
};
