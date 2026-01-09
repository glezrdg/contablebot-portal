"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { WHOP_PLANS, type PlanKey } from "@/lib/whop"

function CompleteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [planName, setPlanName] = useState("")

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
          // Verify the payment and create/update user
          const response = await fetch("/api/verify-whop-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              receiptId,
              membershipId,
              plan: planKey,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            setStatus("success")
            setMessage(data.message || "¡Tu suscripción ha sido activada!")

            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              router.push("/dashboard")
            }, 3000)
          } else {
            const error = await response.json()
            setStatus("error")
            setMessage(error.message || "Error al verificar el pago")
          }
        } else {
          // No payment info, show error
          setStatus("error")
          setMessage("No se encontró información de pago. Por favor intenta registrarte de nuevo.")
        }
      } catch (error) {
        console.error("Error completing registration:", error)
        setStatus("error")
        setMessage("Error al procesar el registro. Por favor contacta soporte.")
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
            <p className="text-muted-foreground">{message}</p>
            <div className="flex gap-3 justify-center mt-4">
              <Button variant="outline" asChild>
                <Link href="/">Volver al inicio</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Intentar de nuevo</Link>
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
