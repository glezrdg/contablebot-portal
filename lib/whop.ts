// Whop SDK configuration and utilities
// Product: Bot Contable 606 – Planes (whop.com/hackstak/contable-bot-606-plans)

export const WHOP_CONFIG = {
  companySlug: "hackstak",
  productSlug: "contable-bot-606-plans",
  productUrl: "https://whop.com/hackstak/contable-bot-606-plans",
} as const

export const WHOP_PLANS = {
  starter: {
    id: "plan_H4B8kBzW7wyBb", // Replace with actual Whop plan ID from dashboard
    name: "Starter",
    subtitle: "Freelancers / Microempresas",
    price: 9,
    trialDays: 30, // 1 mes gratis
    invoices: 150,
    color: "bg-green-500",
    features: ["150 facturas/mes", "Extracción con IA", "Exportación a CSV", "Soporte por email"],
  },
  business: {
    id: "plan_CtT9AiDSmoF2V", // Replace with actual Whop plan ID
    name: "Business",
    subtitle: "Pymes en crecimiento",
    price: 19,
    trialDays: 7,
    invoices: 500,
    color: "bg-blue-500",
    features: [
      "500 facturas/mes",
      "Extracción avanzada con IA",
      "Exportación a Excel y CSV",
      "Dashboard de análisis",
      "Soporte prioritario",
    ],
  },
  pro: {
    id: "plan_NOdE4Vm9Koxaw", // Replace with actual Whop plan ID
    name: "Pro",
    subtitle: "Estudios contables / Alto volumen",
    price: 39,
    trialDays: 3,
    invoices: 1500,
    color: "bg-purple-500",
    features: [
      "1,500 facturas/mes",
      "Multi-usuario (hasta 5)",
      "Integración software contable",
      "API access",
      "Reportes avanzados",
      "Soporte prioritario 24/7",
    ],
  },
  ultra: {
    id: "plan_1MnCrXUhfZdoq", // Replace with actual Whop plan ID
    name: "Ultra",
    subtitle: "Alto rendimiento",
    price: 69,
    trialDays: 3,
    invoices: 3000,
    color: "bg-orange-500",
    features: [
      "3,000 facturas/mes",
      "Multi-usuario (hasta 15)",
      "API ilimitada",
      "Integraciones premium",
      "Account manager dedicado",
      "Onboarding personalizado",
    ],
  },
  enterprise: {
    id: "plan_JyfZRWWZ06q2O", // Replace with actual Whop plan ID
    name: "Enterprise",
    subtitle: "Máxima capacidad",
    price: 99,
    trialDays: 3,
    invoices: 6000,
    color: "bg-red-500",
    features: [
      "6,000 facturas/mes",
      "Usuarios ilimitados",
      "API personalizada",
      "SLA garantizado",
      "Soporte dedicado 24/7",
      "Desarrollo de features prioritario",
    ],
  },
} as const

export type PlanKey = keyof typeof WHOP_PLANS
export type Plan = (typeof WHOP_PLANS)[PlanKey]

// Whop API base URL
const WHOP_API_URL = "https://api.whop.com/api/v5"

export function getPlanByPlanId(planId: string): { key: PlanKey; plan: Plan } | null {
  const entry = Object.entries(WHOP_PLANS).find(([, plan]) => plan.id === planId)
  if (!entry) return null
  return { key: entry[0] as PlanKey, plan: entry[1] }
}

export async function validateWhopMembership(userId: string): Promise<{
  valid: boolean
  plan?: PlanKey
  membership?: {
    id: string
    status: string
    planId: string
    expiresAt: string | null
  }
}> {
  try {
    const response = await fetch(`${WHOP_API_URL}/memberships?user_id=${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
      },
    })

    if (!response.ok) {
      return { valid: false }
    }

    const data = await response.json()
    const activeMembership = data.data?.find(
      (m: { status: string }) => m.status === "active" || m.status === "trialing",
    )

    if (!activeMembership) {
      return { valid: false }
    }

    const planEntry = Object.entries(WHOP_PLANS).find(([, plan]) => plan.id === activeMembership.plan_id)

    return {
      valid: true,
      plan: planEntry?.[0] as PlanKey | undefined,
      membership: {
        id: activeMembership.id,
        status: activeMembership.status,
        planId: activeMembership.plan_id,
        expiresAt: activeMembership.renewal_period_end,
      },
    }
  } catch (error) {
    console.error("Error validating Whop membership:", error)
    return { valid: false }
  }
}

export async function getWhopUser(accessToken: string) {
  try {
    const response = await fetch(`${WHOP_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting Whop user:", error)
    return null
  }
}

export async function verifyWhopReceipt(receiptId: string): Promise<{
  valid: boolean
  email?: string
  planId?: string
  userId?: string
}> {
  try {
    const response = await fetch(`${WHOP_API_URL}/receipts/${receiptId}`, {
      headers: {
        Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
      },
    })

    if (!response.ok) {
      return { valid: false }
    }

    const data = await response.json()

    return {
      valid: true,
      email: data.email,
      planId: data.plan_id,
      userId: data.user_id,
    }
  } catch (error) {
    console.error("Error verifying Whop receipt:", error)
    return { valid: false }
  }
}
