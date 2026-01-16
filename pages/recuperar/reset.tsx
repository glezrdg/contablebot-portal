/**
 * /pages/recuperar/reset.tsx
 *
 * Password reset confirmation page
 * User enters new password using token from email
 */

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Shield, Lightbulb } from 'lucide-react';

export default function PasswordResetPage() {
  const router = useRouter();
  const { token } = router.query;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState({ new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (router.isReady && !token) {
      router.push('/recuperar');
    }
  }, [router.isReady, token, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate passwords
    if (!newPassword) {
      setError('Ingresa una nueva contraseña');
      return;
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!token) {
      setError('Token inválido');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/password-reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token as string,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al restablecer contraseña');
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Error de conexión. Intente nuevamente.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Contraseña actualizada - ContableBot Portal</title>
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
              <Link href="/" className="inline-flex items-center gap-2.5 mb-8 group">
                <div className="w-11 h-11 bg-gradient-to-br from-primary to-[hsl(262_83%_58%)] rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all group-hover:scale-105">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl text-foreground">ContableBot</span>
              </Link>
            </div>

            {/* Success Card */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-8 shadow-xl shadow-primary/5 text-center animate-fade-up">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-400/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-4">
                ¡Contraseña actualizada!
              </h1>

              <p className="text-muted-foreground mb-6">
                Tu contraseña ha sido restablecida exitosamente.
                Serás redirigido al inicio de sesión en unos segundos...
              </p>

              <Button
                onClick={() => router.push('/login')}
                className="w-full h-12 bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all"
              >
                Ir al inicio de sesión
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Restablecer contraseña - ContableBot Portal</title>
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
              Crear nueva contraseña
            </h1>
            <p className="text-muted-foreground">
              Ingresa tu nueva contraseña para tu cuenta
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-8 shadow-xl shadow-primary/5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-foreground font-medium">
                  Nueva contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword.new ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    disabled={loading}
                    className="pl-11 pr-11 h-12 bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword.new ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Debe tener al menos 8 caracteres
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword.confirm ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    disabled={loading}
                    className="pl-11 pr-11 h-12 bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword({ ...showPassword, confirm: !showPassword.confirm })
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword.confirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
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
                    Restableciendo...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Restablecer contraseña
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50 text-center">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </div>

          {/* Tip Card */}
          <div className="mt-6 bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500/20 to-orange-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Consejo:</span> Usa una contraseña única y segura que no hayas usado antes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
