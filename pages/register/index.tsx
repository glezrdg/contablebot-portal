"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Check, ArrowLeft, ArrowRight, Loader2, Gift } from "lucide-react"
import { WHOP_PLANS, type PlanKey } from "@/lib/whop"
import { WhopCheckout } from "@/components/WhopCheckout"

const planOrder: PlanKey[] = ["starter", "business", "pro", "ultra", "enterprise"]

function RegistroContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialPlan = (searchParams.get("plan") as PlanKey) || "starter"

  const [step, setStep] = useState<"plan" | "checkout">("plan")
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(initialPlan)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  })

  useEffect(() => {
    const planParam = searchParams.get("plan") as PlanKey
    if (planParam && WHOP_PLANS[planParam]) {
      setSelectedPlan(planParam)
    }
  }, [searchParams])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
    } else if (formData.password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProceedToCheckout = () => {
    if (validateForm()) {
      setStep("checkout")
    }
  }

  const handleCheckoutComplete = (planId: string, receiptId: string) => {
    console.log("[v0] Checkout complete, redirecting...", { planId, receiptId })
    // Store registration data in session storage for after Whop checkout
    sessionStorage.setItem(
      "pendingRegistration",
      JSON.stringify({
        ...formData,
        plan: selectedPlan,
      }),
    )

    router.push(`/register/complete?receipt_id=${receiptId}&plan=${selectedPlan}`)
  }

  const plan = WHOP_PLANS[selectedPlan]

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form / Checkout */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto w-full max-w-lg">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg text-foreground">Contable Bot</span>
          </Link>

          {step === "plan" && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-2">Selecciona tu plan</h1>
              <p className="text-muted-foreground mb-8">
                Ingresa tu email y elige el plan que mejor se adapte a tus necesidades.
              </p>

              {/* Email input */}
              <div className="space-y-4 mb-8">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    placeholder="Tu nombre"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repite la contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={errors.confirmPassword ? "border-destructive" : ""}
                  />
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Plan selection */}
              <div className="mb-6">
                <Label className="mb-3 block">Selecciona tu plan</Label>
                <div className="grid grid-cols-1 gap-2">
                  {planOrder.map((planKey) => {
                    const p = WHOP_PLANS[planKey]
                    const isSelected = selectedPlan === planKey

                    return (
                      <button
                        key={planKey}
                        type="button"
                        onClick={() => setSelectedPlan(planKey)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                              }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                              <span className="font-medium text-foreground">{p.name}</span>
                              {p.trialDays === 30 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-600 text-xs font-medium rounded-full">
                                  <Gift className="w-3 h-3" />1 mes gratis
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {p.invoices.toLocaleString()} facturas/mes •{" "}
                              {p.trialDays === 30 ? "30 días" : `${p.trialDays} días`} trial
                            </span>
                          </div>
                        </div>
                        <span className="font-semibold text-foreground">${p.price}/mes</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Button onClick={handleProceedToCheckout} className="w-full" size="lg">
                Continuar al pago
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-6">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Iniciar sesión
                </Link>
              </p>
            </>
          )}

          {step === "checkout" && (
            <>
              <button
                onClick={() => setStep("plan")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Cambiar plan
              </button>

              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">Completar pago</h1>
                <p className="text-muted-foreground">
                  Plan {plan.name} • ${plan.price}/mes
                </p>
                {plan.trialDays > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    {plan.trialDays === 30 ? "1 mes de prueba gratis" : `${plan.trialDays} días de prueba gratis`}
                  </p>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <WhopCheckout
                  planId={WHOP_PLANS[selectedPlan].id}
                  email={formData.email}
                  onComplete={handleCheckoutComplete}
                  returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/register/complete`}
                />
              </div>

              <p className="text-center text-xs text-muted-foreground mt-6">
                Al continuar, aceptas nuestros{" "}
                <Link href="/terminos" className="text-primary hover:underline">
                  términos de servicio
                </Link>{" "}
                y{" "}
                <Link href="/privacidad" className="text-primary hover:underline">
                  política de privacidad
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Automatiza tu contabilidad con IA</h2>
          <p className="text-muted-foreground mb-8">
            Extrae datos de facturas automáticamente, ahorra horas de trabajo manual y reduce errores.
          </p>
          <div className="space-y-3 text-left">
            {[
              "Procesamiento instantáneo de facturas",
              "Extracción precisa con inteligencia artificial",
              "Exportación a cualquier formato",
              "Soporte técnico incluido",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegistroPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <RegistroContent />
    </Suspense>
  )
}
