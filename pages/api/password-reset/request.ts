/**
 * POST /api/password-reset/request
 *
 * Initiates password reset process
 * - Validates email exists
 * - Generates reset token
 * - Sends reset email
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';
import type { ErrorResponse } from '@/types';

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

interface PasswordResetRequestBody {
  email: string;
}

interface PasswordResetResponse {
  success: true;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PasswordResetResponse | ErrorResponse>
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
    const { email } = req.body as PasswordResetRequestBody;

    // Validate input
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const userUrl = `${POSTGREST_BASE_URL}/portal_users?email=eq.${encodeURIComponent(normalizedEmail)}`;
    const userResponse = await fetch(userUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!userResponse.ok) {
      console.error('Error fetching user:', userResponse.status);
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        success: true,
        message: 'Si el email existe, recibirás un correo con instrucciones para restablecer tu contraseña.',
      });
    }

    const users = await userResponse.json();

    // Always return success (don't reveal if email exists)
    if (!users || users.length === 0) {
      console.log('Password reset requested for non-existent email:', normalizedEmail);
      return res.status(200).json({
        success: true,
        message: 'Si el email existe, recibirás un correo con instrucciones para restablecer tu contraseña.',
      });
    }

    const user = users[0];

    // Check if user account is active
    if (!user.is_active) {
      console.log('Password reset requested for inactive user:', normalizedEmail);
      return res.status(200).json({
        success: true,
        message: 'Si el email existe, recibirás un correo con instrucciones para restablecer tu contraseña.',
      });
    }

    // Generate reset token (32 bytes = 64 hex characters)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expiration (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Store reset token in database
    const updateUrl = `${POSTGREST_BASE_URL}/portal_users?id=eq.${user.id}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        reset_token_hash: resetTokenHash,
        reset_token_expires: expiresAt.toISOString(),
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Error storing reset token:', {
        status: updateResponse.status,
        statusText: updateResponse.statusText,
        error: errorText
      });

      // Check if it's a column not found error (migration not applied)
      if (errorText.includes('column') && errorText.includes('does not exist')) {
        return res.status(500).json({
          error: 'Error de configuración: Por favor contacta al administrador. (Migración de base de datos requerida)'
        });
      }

      return res.status(500).json({ error: 'Error al procesar solicitud' });
    }

    // Send reset email
    const emailSent = await sendPasswordResetEmail(
      user.email,
      resetToken,
      user.full_name
    );

    if (!emailSent) {
      console.error('Failed to send password reset email to:', user.email);
      // Still return success to not reveal email existence
    }

    return res.status(200).json({
      success: true,
      message: 'Si el email existe, recibirás un correo con instrucciones para restablecer tu contraseña.',
    });
  } catch (error) {
    console.error('Error in POST /api/password-reset/request:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export const config = {
  runtime: 'nodejs',
};
