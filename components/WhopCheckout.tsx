"use client"

import { WhopCheckoutEmbed } from "@whop/checkout/react"
import { Loader2, AlertCircle } from "lucide-react"
import { useState } from "react"

interface WhopCheckoutProps {
  planId: string
  email: string
  onComplete: (planId: string, receiptId: string) => void
  returnUrl: string
}

export function WhopCheckout({ planId, email, onComplete, returnUrl }: WhopCheckoutProps) {
  const [error, setError] = useState<string | null>(null)

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive font-medium mb-2">Error en el pago</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative rounded-xl overflow-hidden">
      <WhopCheckoutEmbed
        planId={planId}
        theme="dark"
        returnUrl={returnUrl}
        skipRedirect={true}
        prefill={{
          email: email
        }}
        onComplete={(plan_id, receipt_id) => {
          if (receipt_id) {
            onComplete(plan_id, receipt_id)
          } else {
            console.warn("Checkout completed but no receipt_id provided")
            setError("Error: No se recibió confirmación del pago")
          }
        }}
        onAddressValidationError={(error) => {
          console.error("Address validation error:", error)
          setError(error.error_message || "Error de validación")
        }}
        fallback={
          <div className="w-full h-[600px] bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Cargando checkout...</p>
            </div>
          </div>
        }
      />
    </div>
  )
}
