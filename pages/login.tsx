// /pages/login.tsx - Email/password login page
import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import type { ErrorResponse } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Email inválido");
      return;
    }
    if (!password) {
      setError("La contraseña es requerida");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponse;
        setError(errorData.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Error de conexión. Intente nuevamente.");
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Iniciar Sesión - ContableBot Portal</title>
        <meta name="description" content="Portal de facturación ContableBot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen flex">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[hsl(262_83%_58%)]/10 rounded-full blur-3xl" />
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
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Bienvenido de vuelta
              </h1>
              <p className="text-muted-foreground">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-8 shadow-xl shadow-primary/5">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    Email
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
                      autoFocus
                      required
                      className="pl-11 h-12 bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-foreground font-medium">
                      Contraseña
                    </Label>
                    <Link
                      href="/recuperar"
                      className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tu contraseña"
                      disabled={loading}
                      required
                      className="pl-11 pr-11 h-12 bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-sm text-destructive text-center animate-fade-up">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all text-base font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      Iniciar Sesión
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Register Link */}
              <div className="mt-6 pt-6 border-t border-border/50 text-center">
                <p className="text-sm text-muted-foreground">
                  ¿No tienes cuenta?{" "}
                  <Link
                    href="/register"
                    className="text-primary hover:text-primary/80 font-semibold transition-colors"
                  >
                    Crear cuenta
                  </Link>
                </p>
              </div>
            </div>

            {/* Terms */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              Al iniciar sesión, aceptas nuestros{" "}
              <Link href="/terminos" className="text-primary hover:underline">
                términos
              </Link>{" "}
              y{" "}
              <Link href="/privacidad" className="text-primary hover:underline">
                privacidad
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/5 via-background to-[hsl(262_83%_58%)]/5 items-center justify-center p-12 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-blob" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[hsl(262_83%_58%)]/10 rounded-full blur-3xl animate-blob-delayed" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>

          <div className="max-w-lg text-center relative z-10">
            {/* Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/20 shadow-xl animate-float">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>

            <h2 className="text-3xl font-bold text-foreground mb-4">
              Potenciado por{" "}
              <span className="text-gradient">Inteligencia Artificial</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-10">
              Automatiza tu contabilidad con la tecnología más avanzada.
              Extrae datos de facturas en segundos con precisión del 99.5%.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 text-left">
              {[
                { label: "Facturas procesadas", value: "10,000+" },
                { label: "Precisión IA", value: "90%" },
                { label: "Tiempo promedio", value: "< 1.25s" },
                { label: "Clientes activos", value: "10+" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-slate-700/50"
                >
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
