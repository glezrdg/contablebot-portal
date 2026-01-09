"use client"

import { Button } from "@/components/ui/button"
import { Check, Sparkles, Gift } from "lucide-react"
import { WHOP_PLANS, WHOP_CONFIG, type PlanKey } from "@/lib/whop"
import Link from "next/link"

const planOrder: PlanKey[] = ["starter", "business", "pro", "ultra", "enterprise"]

export function PricingSection() {
  return (
    <section id="precios" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Bot Contable 606 – Planes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Automatiza tu 606 con IA desde fotos de facturas. Todos los planes incluyen prueba gratis.
          </p>
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-500/10 text-green-600 font-medium rounded-full">
            <Gift className="w-5 h-5" />1 MES GRATIS en el plan Starter
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
          {planOrder.map((planKey) => {
            const plan = WHOP_PLANS[planKey]
            const isPopular = planKey === "pro"

            return (
              <div
                key={planKey}
                className={`relative bg-card border rounded-2xl p-5 flex flex-col ${isPopular ? "border-primary shadow-xl shadow-primary/10 lg:scale-105 z-10" : "border-border"
                  }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Más Popular
                  </div>
                )}

                <div className="text-center mb-5">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${plan.color}`} />
                    <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{plan.subtitle}</p>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-sm text-muted-foreground">US$</span>
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">/mes</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-600 text-xs font-medium rounded-full">
                    <Gift className="w-3 h-3" />
                    {plan.trialDays === 30 ? "1 mes gratis" : `${plan.trialDays} días gratis`}
                  </div>
                </div>

                <p className="text-sm text-center font-medium text-foreground mb-4">
                  hasta {plan.invoices.toLocaleString()} facturas/mes
                </p>

                <ul className="space-y-2.5 mb-5 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-primary" />
                      </div>
                      <span className="text-xs text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={`/register?plan=${planKey}`} className="w-full">
                  <Button className="w-full" variant={isPopular ? "default" : "outline"} size="sm">
                    {plan.trialDays === 30 ? "Probar 1 Mes Gratis" : "Comenzar Prueba"}
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>

        <div className="text-center mt-10 space-y-3">
          <p className="text-sm text-muted-foreground">
            Todos los pagos son procesados de forma segura a través de Whop.
          </p>
          <a
            href={WHOP_CONFIG.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
          >
            Ver todos los planes en Whop
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
