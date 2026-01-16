"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle2, Loader2, XCircle, AlertCircle, ArrowRight, Sparkles, Home, RotateCcw } from "lucide-react"
import { WHOP_PLANS, type PlanKey } from "@/lib/whop"

function CompleteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [planName, setPlanName] = useState("")
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  useEffect(() => {
    const completeRegistration = async () => {
      try {
        const receiptId = searchParams.get("receipt_id")
        const planKey = searchParams.get("plan") as PlanKey
        // Also support Whop redirect params
        const membershipId = searchParams.get("membership_id")
        const whopStatus = searchParams.get("status")

        // Set plan name for display
        if (planKey && WHOP_PLANS[planKey]) {
          setPlanName(WHOP_PLANS[planKey].name)
        }

        // Handle error status from Whop redirect
        if (whopStatus === "error") {
          setStatus("error")
          setMessage("El pago fue cancelado o falló. Por favor intenta de nuevo.")
          return
        }

        // If we have a receipt_id (from embedded checkout) or membership_id (from redirect)
        if (receiptId || membershipId) {
          // Retrieve pending registration data from sessionStorage
          const pendingRegistrationStr = sessionStorage.getItem("pendingRegistration")

          if (!pendingRegistrationStr) {
            setStatus("error")
            setMessage("No se encontraron datos de registro. Por favor intenta de nuevo.")
            return
          }

          const pendingRegistration = JSON.parse(pendingRegistrationStr)

          // Verify the payment and create user account
          const response = await fetch("/api/verify-whop-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              receiptId,
              membershipId,
              plan: planKey,
              email: pendingRegistration.email,
              password: pendingRegistration.password,
              name: pendingRegistration.name,
            }),
          })

          // Clear session storage after sending
          sessionStorage.removeItem("pendingRegistration")

          if (response.ok) {
            const data = await response.json()
            setStatus("success")
            setMessage(data.message || "¡Tu suscripción ha sido activada!")

            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              router.push("/dashboard")
            }, 3000)
          } else {
            const errorData = await response.json()
            setStatus("error")

            // API returns error in "error" field, not "message"
            const errorMessage = errorData.error || errorData.message || "Error al verificar el pago"
            setMessage(errorMessage)

            // Add helpful details based on status code
            if (response.status === 409) {
              setErrorDetails("Esta cuenta ya existe. Puedes iniciar sesión en su lugar.")
            } else if (response.status === 404) {
              setErrorDetails("No se pudo verificar la membresía con Whop. Por favor contacta soporte.")
            } else if (response.status >= 500) {
              setErrorDetails("Error del servidor. Por favor contacta soporte si el problema persiste.")
            }
          }
        } else {
          // No payment info, show error
          setStatus("error")
          setMessage("No se encontró información de pago. Por favor intenta registrarte de nuevo.")
        }
      } catch (error) {
        console.error("Error completing registration:", error)
        setStatus("error")
        setMessage("Error al procesar el registro.")
        setErrorDetails("Ocurrió un error inesperado. Por favor contacta soporte.")
      }
    }

    completeRegistration()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[hsl(262_83%_58%)]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-[hsl(262_83%_58%)]/5 rounded-full blur-3xl animate-blob-delayed" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="max-w-md w-full text-center relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-10 group">
          <div className="w-11 h-11 bg-gradient-to-br from-primary to-[hsl(262_83%_58%)] rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all group-hover:scale-105">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl text-foreground">ContableBot</span>
        </Link>

        {/* Loading State */}
        {status === "loading" && (
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-8 shadow-xl shadow-primary/5">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-[hsl(262_83%_58%)]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Verificando tu pago...
            </h1>
            <p className="text-muted-foreground">
              Por favor espera mientras activamos tu suscripción.
            </p>
            <div className="mt-6 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-8 shadow-xl shadow-primary/5 animate-fade-up">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-400/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              ¡Bienvenido a ContableBot!
            </h1>
            <p className="text-muted-foreground mb-2">{message}</p>
            {planName && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Plan {planName} activado
              </div>
            )}
            <p className="text-xs text-muted-foreground mb-6">
              Serás redirigido al dashboard en unos segundos...
            </p>
            <Button
              asChild
              className="w-full h-12 bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all"
            >
              <Link href="/dashboard">
                Ir al Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-8 shadow-xl shadow-primary/5 animate-fade-up">
            <div className="w-20 h-20 bg-gradient-to-br from-destructive/20 to-rose-400/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Error en el registro
            </h1>

            {/* Main error message */}
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-4">
              <p className="text-destructive font-medium">{message}</p>
            </div>

            {/* Additional error details if available */}
            {errorDetails && (
              <div className="bg-muted/50 border border-border rounded-xl p-4 flex items-start gap-3 mb-6 text-left">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{errorDetails}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" asChild className="flex-1 h-12 bg-white/50 dark:bg-slate-800/50">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Inicio
                </Link>
              </Button>
              <Button
                asChild
                className="flex-1 h-12 bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] hover:shadow-lg hover:shadow-primary/30"
              >
                <Link href={message.includes("Ya existe") ? "/login" : "/register"}>
                  {message.includes("Ya existe") ? (
                    <>
                      Iniciar sesión
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reintentar
                    </>
                  )}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[hsl(262_83%_58%)]/10 rounded-full blur-3xl" />
          </div>
          <div className="text-center relative z-10">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      }
    >
      <CompleteContent />
    </Suspense>
  )
}
