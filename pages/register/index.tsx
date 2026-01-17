"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Gift,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Shield,
  Clock,
} from "lucide-react";
import { WHOP_PLANS, type PlanKey } from "@/lib/whop";
import { WhopCheckout } from "@/components/WhopCheckout";

const planOrder: PlanKey[] = [
  "starter",
  "business",
  "pro",
  "ultra",
  "enterprise",
];

const planGradients: Record<PlanKey, string> = {
  starter: "from-slate-500 to-slate-400",
  business: "from-blue-500 to-cyan-400",
  pro: "from-violet-500 to-purple-400",
  ultra: "from-amber-500 to-orange-400",
  enterprise: "from-rose-500 to-pink-400",
};

function RegistroContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPlan = (searchParams.get("plan") as PlanKey) || "starter";

  const [step, setStep] = useState<"plan" | "checkout">("plan");
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(initialPlan);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState({ password: false, confirm: false });
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  useEffect(() => {
    const planParam = searchParams.get("plan") as PlanKey;
    if (planParam && WHOP_PLANS[planParam]) {
      setSelectedPlan(planParam);
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToCheckout = () => {
    if (validateForm()) {
      setStep("checkout");
    }
  };

  const handleCheckoutComplete = (planId: string, receiptId: string) => {
    console.log("[v0] Checkout complete, redirecting...", {
      planId,
      receiptId,
    });
    // Store registration data in session storage for after Whop checkout
    sessionStorage.setItem(
      "pendingRegistration",
      JSON.stringify({
        ...formData,
        plan: selectedPlan,
      })
    );

    router.push(
      `/register/complete?receipt_id=${receiptId}&plan=${selectedPlan}`
    );
  };

  const plan = WHOP_PLANS[selectedPlan];
  const gradient = planGradients[selectedPlan];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form / Checkout */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[hsl(262_83%_58%)]/10 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto w-full max-w-lg relative z-10">
          {/* Logo */}
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

          {step === "plan" && (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Crea tu cuenta
              </h1>
              <p className="text-muted-foreground mb-8">
                Completa tus datos y elige el plan perfecto para tu negocio
              </p>

              {/* Form Card */}
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-primary/5 mb-6">
                <div className="space-y-4">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground font-medium">
                      Nombre completo
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Tu nombre"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className={`pl-11 h-12 bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 focus:border-primary/50 focus:ring-primary/20 transition-all ${errors.name ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className={`pl-11 h-12 bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 focus:border-primary/50 focus:ring-primary/20 transition-all ${errors.email ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Fields in 2 columns on larger screens */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-foreground font-medium">
                        Contraseña
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword.password ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          className={`pl-11 pr-11 h-12 bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 focus:border-primary/50 focus:ring-primary/20 transition-all ${errors.password ? "border-destructive" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, password: !showPassword.password })}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword.password ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-destructive">{errors.password}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                        Confirmar
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showPassword.confirm ? "text" : "password"}
                          placeholder="Repite contraseña"
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className={`pl-11 pr-11 h-12 bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 focus:border-primary/50 focus:ring-primary/20 transition-all ${errors.confirmPassword ? "border-destructive" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan selection */}
              <div className="mb-6">
                <Label className="mb-3 block text-foreground font-medium">
                  Selecciona tu plan
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {planOrder.map((planKey) => {
                    const p = WHOP_PLANS[planKey];
                    const isSelected = selectedPlan === planKey;
                    const planGradient = planGradients[planKey];

                    return (
                      <button
                        key={planKey}
                        type="button"
                        onClick={() => setSelectedPlan(planKey)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm ${
                          isSelected
                            ? "border-primary/50 ring-2 ring-primary/20 shadow-lg shadow-primary/10"
                            : "border-white/20 dark:border-slate-700/50 hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? "border-primary bg-gradient-to-br from-primary to-[hsl(262_83%_58%)]"
                                : "border-muted-foreground"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${planGradient}`}
                              />
                              <span className="font-semibold text-foreground">
                                {p.name}
                              </span>
                              {p.trialDays === 30 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium rounded-full">
                                  <Gift className="w-3 h-3" />1 mes gratis
                                </span>
                              )}
                              {planKey === "pro" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                  <Sparkles className="w-3 h-3" />
                                  Popular
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {p.invoices.toLocaleString()} facturas/mes •{" "}
                              {p.trialDays === 30
                                ? "30 días"
                                : `${p.trialDays} días`}{" "}
                              trial
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-foreground">
                          ${p.price}<span className="text-sm font-normal text-muted-foreground">/mes</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={handleProceedToCheckout}
                className="w-full h-12 bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all text-base font-medium"
                size="lg"
              >
                Continuar al pago
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-6">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                  Iniciar sesión
                </Link>
              </p>
            </>
          )}

          {step === "checkout" && (
            <>
              <button
                onClick={() => setStep("plan")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Cambiar plan
              </button>

              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  Completar pago
                </h1>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${gradient}`} />
                  <p className="text-muted-foreground">
                    Plan {plan.name} • ${plan.price}/mes
                  </p>
                </div>
                {plan.trialDays > 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-1.5">
                    <Gift className="w-4 h-4" />
                    {plan.trialDays === 30
                      ? "1 mes de prueba gratis"
                      : `${plan.trialDays} días de prueba gratis`}
                  </p>
                )}
              </div>

              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-xl shadow-primary/5">
                <WhopCheckout
                  planId={WHOP_PLANS[selectedPlan].id}
                  email={formData.email}
                  onComplete={handleCheckoutComplete}
                  returnUrl={`${
                    typeof window !== "undefined" ? window.location.origin : ""
                  }/register/complete`}
                />
              </div>

              <p className="text-center text-xs text-muted-foreground mt-6">
                Al continuar, aceptas nuestros{" "}
                <Link href="/terminos" className="text-primary hover:underline">
                  términos de servicio
                </Link>{" "}
                y{" "}
                <Link
                  href="/privacidad"
                  className="text-primary hover:underline"
                >
                  política de privacidad
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/5 via-background to-[hsl(262_83%_58%)]/5 items-center justify-center p-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[hsl(262_83%_58%)]/10 rounded-full blur-3xl animate-blob-delayed" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="max-w-md text-center relative z-10">
          {/* Icon */}
          <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/20 shadow-xl animate-float p-4">
            <Image
              src="/logo_icon.png"
              alt="ContableBot"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-4">
            Automatiza tu{" "}
            <span className="text-gradient">contabilidad con IA</span>
          </h2>

          <p className="text-lg text-muted-foreground mb-10">
            Extrae datos de facturas automáticamente, ahorra horas de trabajo
            manual y reduce errores.
          </p>

          {/* Features */}
          <div className="space-y-4 text-left">
            {[
              { icon: Zap, label: "Procesamiento instantáneo de facturas", gradient: "from-amber-500 to-orange-400" },
              { icon: Sparkles, label: "Extracción precisa con IA", gradient: "from-violet-500 to-purple-400" },
              { icon: Shield, label: "Cumplimiento DGII (606/607)", gradient: "from-emerald-500 to-teal-400" },
              { icon: Clock, label: "Ahorra 90% del tiempo", gradient: "from-blue-500 to-cyan-400" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-slate-700/50">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-foreground font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      }
    >
      <RegistroContent />
    </Suspense>
  );
}
