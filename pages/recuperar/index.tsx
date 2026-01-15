/**
 * /pages/recuperar/index.tsx
 *
 * Password reset request page
 * User enters email to receive password reset link
 */

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function PasswordResetRequestPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Email inválido');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al procesar solicitud');
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Error de conexión. Intente nuevamente.');
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Head>
          <title>Correo enviado - ContableBot Portal</title>
        </Head>

        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-2 mb-12">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="font-semibold text-xl text-foreground">Contable Bot</span>
              </Link>
            </div>

            <div className="bg-gray-50 border border-border rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-4">
                Revisa tu correo
              </h1>

              <p className="text-muted-foreground mb-2">
                Si el correo <strong>{email}</strong> está registrado, recibirás un enlace para
                restablecer tu contraseña.
              </p>

              <p className="text-sm text-muted-foreground mb-8">
                El enlace expira en 1 hora. Revisa tu carpeta de spam si no lo ves.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio de sesión
                </Button>

                <button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Intentar con otro correo
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              ¿No recibiste el correo?{' '}
              <button
                onClick={() => {
                  setSubmitted(false);
                  setLoading(false);
                }}
                className="text-primary hover:underline"
              >
                Reenviar
              </button>
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Recuperar contraseña - ContableBot Portal</title>
      </Head>

      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-12">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-semibold text-xl text-foreground">Contable Bot</span>
            </Link>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="text-muted-foreground">
              Ingresa tu correo y te enviaremos un enlace para restablecerla
            </p>
          </div>

          <div className="bg-gray-50 border border-border rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    disabled={loading}
                    className="pl-10"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 text-center">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar enlace de recuperación
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            ¿Necesitas ayuda?{' '}
            <a href="mailto:soporte@contablebot.com" className="text-primary hover:underline">
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
