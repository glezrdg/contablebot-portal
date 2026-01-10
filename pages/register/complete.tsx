"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle2, Loader2, XCircle, AlertCircle } from "lucide-react"
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg text-foreground">Contable Bot</span>
        </Link>

        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Verificando tu pago...</h1>
            <p className="text-muted-foreground">Por favor espera mientras activamos tu suscripción.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">¡Bienvenido a Contable Bot!</h1>
            <p className="text-muted-foreground">{message}</p>
            {planName && <p className="text-sm text-primary font-medium">Plan {planName} activado exitosamente</p>}
            <p className="text-xs text-muted-foreground">Serás redirigido al dashboard en unos segundos...</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">Ir al Dashboard</Link>
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Error en el registro</h1>

            {/* Main error message */}
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive font-medium">{message}</p>
            </div>

            {/* Additional error details if available */}
            {errorDetails && (
              <div className="bg-muted/50 border border-border rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground text-left">{errorDetails}</p>
              </div>
            )}

            <div className="flex gap-3 justify-center mt-6">
              <Button variant="outline" asChild>
                <Link href="/">Volver al inicio</Link>
              </Button>
              <Button asChild>
                <Link href={message.includes("Ya existe") ? "/login" : "/register"}>
                  {message.includes("Ya existe") ? "Iniciar sesión" : "Intentar de nuevo"}
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
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <CompleteContent />
    </Suspense>
  )
}
