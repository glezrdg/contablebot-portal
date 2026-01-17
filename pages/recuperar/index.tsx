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
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, ArrowLeft, CheckCircle2, Send, RefreshCw, Shield } from 'lucide-react';

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

        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[hsl(262_83%_58%)]/10 rounded-full blur-3xl" />
            <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-blob" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>

          <div className="w-full max-w-md relative z-10">
            {/* Logo */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center justify-center mb-8 group">
                <div className="relative transition-all group-hover:scale-105">
                  <Image
                    src="/contablebot-logo.png"
                    alt="ContableBot"
                    width={160}
                    height={37}
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* Success Card */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-8 shadow-xl shadow-primary/5 text-center animate-fade-up">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-400/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-4">
                Revisa tu correo
              </h1>

              <p className="text-muted-foreground mb-2">
                Si el correo <strong className="text-foreground">{email}</strong> está registrado, recibirás un enlace para
                restablecer tu contraseña.
              </p>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 my-6 text-left">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    El enlace expira en <span className="font-medium text-foreground">1 hora</span>. Revisa tu carpeta de spam si no lo ves.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full h-12 bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio de sesión
                </Button>

                <button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                  className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  <RefreshCw className="w-4 h-4" />
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
                className="text-primary hover:underline font-medium"
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

      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[hsl(262_83%_58%)]/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-blob" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-8 group">
              <div className="w-11 h-11 bg-gradient-to-br from-primary to-[hsl(262_83%_58%)] rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all group-hover:scale-105">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-foreground">ContableBot</span>
            </Link>

            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="text-muted-foreground">
              Ingresa tu correo y te enviaremos un enlace para restablecerla
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-8 shadow-xl shadow-primary/5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    disabled={loading}
                    className="pl-11 h-12 bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-sm text-destructive text-center animate-fade-up">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all text-base font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Enviar enlace de recuperación
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50 text-center">
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
            <a href="mailto:soporte@contablebot.com" className="text-primary hover:underline font-medium">
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
