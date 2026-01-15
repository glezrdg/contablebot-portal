/**
 * Email Service - Nodemailer with Gmail SMTP
 *
 * Handles sending transactional emails for:
 * - Password reset/recovery
 * - Password change notifications
 * - Invoice processing notifications
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || `ContableBot <${SMTP_USER}>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Transporter will be created on-demand (lazy initialization)
// to avoid Next.js module initialization timing issues

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Nodemailer
 */
async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  // Validate environment variables
  if (!SMTP_USER || !SMTP_PASS) {
    console.error('Email transporter not configured. Set SMTP_USER and SMTP_PASS environment variables.');
    return false;
  }

  // Create transporter on-demand (lazy initialization)
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // Use TLS (STARTTLS)
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || undefined,
    });

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to,
      subject
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', {
      error: error instanceof Error ? error.message : error,
      errorStack: error instanceof Error ? error.stack : undefined,
      to,
      subject,
      smtpConfigured: !!SMTP_USER && !!SMTP_PASS
    });
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName?: string
): Promise<boolean> {
  const resetUrl = `${APP_URL}/recuperar/reset?token=${resetToken}`;
  const firstName = userName?.split(' ')[0] || 'Usuario';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer contraseña</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 12px; margin-bottom: 16px;"></div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a;">ContableBot</h1>
          </div>

          <!-- Main Content -->
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #0f172a;">
              Restablecer tu contraseña
            </h2>

            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #64748b;">
              Hola ${firstName},
            </p>

            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #64748b;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta en ContableBot.
              Haz clic en el botón de abajo para crear una nueva contraseña:
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}"
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Restablecer contraseña
              </a>
            </div>

            <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #94a3b8;">
              O copia y pega este enlace en tu navegador:
            </p>
            <p style="margin: 8px 0 0 0; font-size: 14px; line-height: 20px; color: #0ea5e9; word-break: break-all;">
              ${resetUrl}
            </p>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 20px; color: #64748b;">
                <strong>Este enlace expira en 1 hora.</strong>
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 20px; color: #94a3b8;">
                Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 32px;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
              © ${new Date().getFullYear()} ContableBot. Todos los derechos reservados.
            </p>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
              Este es un correo automático, por favor no respondas.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Restablecer tu contraseña - ContableBot

Hola ${firstName},

Recibimos una solicitud para restablecer la contraseña de tu cuenta en ContableBot.

Para crear una nueva contraseña, visita este enlace:
${resetUrl}

Este enlace expira en 1 hora.

Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.

© ${new Date().getFullYear()} ContableBot
  `.trim();

  return sendEmail({
    to: email,
    subject: 'Restablecer tu contraseña - ContableBot',
    html,
    text,
  });
}

/**
 * Send password changed notification
 */
export async function sendPasswordChangedEmail(
  email: string,
  userName?: string
): Promise<boolean> {
  const firstName = userName?.split(' ')[0] || 'Usuario';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contraseña actualizada</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 12px; margin-bottom: 16px;"></div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a;">ContableBot</h1>
          </div>

          <!-- Main Content -->
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">✓</span>
              </div>
            </div>

            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #0f172a; text-align: center;">
              Contraseña actualizada
            </h2>

            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #64748b;">
              Hola ${firstName},
            </p>

            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #64748b;">
              Tu contraseña de ContableBot ha sido actualizada exitosamente.
            </p>

            <div style="background: #f8fafc; border-left: 4px solid #0ea5e9; padding: 16px; border-radius: 4px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; line-height: 20px; color: #64748b;">
                <strong>Fecha:</strong> ${new Date().toLocaleString('es-DO', {
                  timeZone: 'America/Santo_Domingo',
                  dateStyle: 'full',
                  timeStyle: 'short'
                })}
              </p>
            </div>

            <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #94a3b8;">
              Si no realizaste este cambio, contacta inmediatamente con nuestro soporte para proteger tu cuenta.
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 32px;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
              © ${new Date().getFullYear()} ContableBot. Todos los derechos reservados.
            </p>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
              Este es un correo automático, por favor no respondas.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Contraseña actualizada - ContableBot

Hola ${firstName},

Tu contraseña de ContableBot ha sido actualizada exitosamente.

Fecha: ${new Date().toLocaleString('es-DO', {
  timeZone: 'America/Santo_Domingo',
  dateStyle: 'full',
  timeStyle: 'short'
})}

Si no realizaste este cambio, contacta inmediatamente con nuestro soporte para proteger tu cuenta.

© ${new Date().getFullYear()} ContableBot
  `.trim();

  return sendEmail({
    to: email,
    subject: 'Tu contraseña ha sido actualizada - ContableBot',
    html,
    text,
  });
}

/**
 * Send invoice processing notification
 */
export async function sendInvoiceProcessedEmail(
  email: string,
  invoiceCount: number,
  successCount: number,
  needsReviewCount: number,
  userName?: string
): Promise<boolean> {
  const firstName = userName?.split(' ')[0] || 'Usuario';
  const dashboardUrl = `${APP_URL}/dashboard`;
  const qaUrl = `${APP_URL}/dashboard/qa`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Facturas procesadas</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 12px; margin-bottom: 16px;"></div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a;">ContableBot</h1>
          </div>

          <!-- Main Content -->
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #0f172a;">
              Facturas procesadas
            </h2>

            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #64748b;">
              Hola ${firstName},
            </p>

            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #64748b;">
              Hemos terminado de procesar ${invoiceCount} ${invoiceCount === 1 ? 'factura' : 'facturas'}.
            </p>

            <!-- Stats -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <div style="display: flex; justify-content: space-around; text-align: center;">
                <div>
                  <div style="font-size: 32px; font-weight: 700; color: #16a34a; margin-bottom: 8px;">
                    ${successCount}
                  </div>
                  <div style="font-size: 14px; color: #64748b;">
                    Exitosas
                  </div>
                </div>
                ${needsReviewCount > 0 ? `
                <div>
                  <div style="font-size: 32px; font-weight: 700; color: #f59e0b; margin-bottom: 8px;">
                    ${needsReviewCount}
                  </div>
                  <div style="font-size: 14px; color: #64748b;">
                    Requieren revisión
                  </div>
                </div>
                ` : ''}
              </div>
            </div>

            ${needsReviewCount > 0 ? `
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; line-height: 20px; color: #92400e;">
                <strong>Acción requerida:</strong> Algunas facturas necesitan revisión manual para asegurar la precisión de los datos.
              </p>
            </div>
            ` : ''}

            <!-- CTA Buttons -->
            <div style="text-align: center; margin: 32px 0;">
              ${needsReviewCount > 0 ? `
              <a href="${qaUrl}"
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 8px 8px 8px;">
                Revisar facturas
              </a>
              ` : ''}
              <a href="${dashboardUrl}"
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 8px 8px 8px;">
                Ver dashboard
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 32px;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
              © ${new Date().getFullYear()} ContableBot. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Facturas procesadas - ContableBot

Hola ${firstName},

Hemos terminado de procesar ${invoiceCount} ${invoiceCount === 1 ? 'factura' : 'facturas'}.

Resultados:
- ${successCount} ${successCount === 1 ? 'factura procesada' : 'facturas procesadas'} exitosamente
${needsReviewCount > 0 ? `- ${needsReviewCount} ${needsReviewCount === 1 ? 'factura requiere' : 'facturas requieren'} revisión` : ''}

${needsReviewCount > 0 ? `Revisar facturas: ${qaUrl}` : ''}
Ver dashboard: ${dashboardUrl}

© ${new Date().getFullYear()} ContableBot
  `.trim();

  return sendEmail({
    to: email,
    subject: `${invoiceCount} ${invoiceCount === 1 ? 'factura procesada' : 'facturas procesadas'} - ContableBot`,
    html,
    text,
  });
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<boolean> {
  if (!SMTP_USER || !SMTP_PASS) {
    console.error('Email transporter not configured');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.verify();
    console.log('Email service configured successfully with SMTP');
    return true;
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return false;
  }
}
