import type { NextApiRequest, NextApiResponse } from "next"
import bcrypt from "bcryptjs"
import { signToken, setAuthCookie } from "@/lib/auth"
import { whopSdk } from "@/lib/whop-sdk"
import { WHOP_PLANS, type PlanKey } from "@/lib/whop"
import type { Firm } from "@/types"

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { receiptId, membershipId, plan } = req.body

    // Validate input
    if (!plan) {
      return res.status(400).json({ error: "Plan is required" })
    }

    if (!receiptId && !membershipId) {
      return res.status(400).json({ error: "Receipt ID or Membership ID is required" })
    }

    // Retrieve pending registration data from request body
    // Note: Frontend should send this data in the request since sessionStorage is client-side only
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({
        error: "Registration data is required (email, password, name)"
      })
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" })
    }

    // Convert plan key (e.g., "starter") to actual Whop plan ID (e.g., "plan_H4B8kBzW7wyBb")
    const planKey = plan as PlanKey
    const planConfig = WHOP_PLANS[planKey]

    if (!planConfig) {
      return res.status(400).json({
        error: `Invalid plan: ${plan}. Must be one of: ${Object.keys(WHOP_PLANS).join(", ")}`
      })
    }

    // Use provided data - webhook will handle full verification
    // For initial account creation, we trust the checkout flow and verify via webhooks
    const whopMembershipId = membershipId || receiptId
    const whopUserId = ""
    const whopPlanId = planConfig.id // Use the actual Whop plan ID, not the key
    const manageUrl: string | null = null

    if (!whopMembershipId) {
      return res.status(400).json({ error: "Missing payment information" })
    }

    // Optional: Verify membership exists with Whop if membershipId provided
    if (membershipId) {
      try {
        await whopSdk.memberships.retrieve(membershipId)
      } catch (error: unknown) {
        console.error("Whop membership verification failed:", error)
        return res.status(404).json({
          error: "Membership not found. Please contact support."
        })
      }
    }

    // Get plan details (for invoice limits)
    const planInvoices = planConfig.invoices

    // Check if firm with this email already exists
    const existingFirmResponse = await fetch(
      `${POSTGREST_BASE_URL}/firms?email=eq.${encodeURIComponent(email)}`,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    )

    if (existingFirmResponse.ok) {
      const existingFirms = await existingFirmResponse.json()
      if (existingFirms && existingFirms.length > 0) {
        return res.status(409).json({
          error: "Ya existe una cuenta con este email. Por favor inicia sesión."
        })
      }
    }

    // Create firm
    const firmResponse = await fetch(`${POSTGREST_BASE_URL}/firms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        name,
        email,
        whop_membership_id: whopMembershipId,
        whop_plan_id: whopPlanId,
        whop_user_id: whopUserId,
        whop_product_id: process.env.NEXT_PUBLIC_WHOP_COMPANY_SLUG || "hackstak",
        manage_url: manageUrl,
        is_active: true,
        plan_limit: planInvoices,
      }),
    })

    if (!firmResponse.ok) {
      const errorText = await firmResponse.text()
      console.error("Error creating firm:", errorText)
      return res.status(500).json({
        error: "Error creating account. Please contact support."
      })
    }

    const firms: Firm[] = await firmResponse.json()
    const firm = firms[0]

    if (!firm || !firm.id) {
      return res.status(500).json({ error: "Failed to create firm" })
    }

    // Create portal user
    const passwordHash = await bcrypt.hash(password, 10)

    const portalUserResponse = await fetch(`${POSTGREST_BASE_URL}/portal_users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        email,
        password_hash: passwordHash,
        firm_id: firm.id,
        role: "admin",
      }),
    })

    if (!portalUserResponse.ok) {
      const errorText = await portalUserResponse.text()
      console.error("Error creating portal user:", errorText)
      // Firm was created but portal user wasn't - log for manual cleanup
      return res.status(500).json({
        error: "Error creating login credentials. Please contact support."
      })
    }

    const portalUsers = await portalUserResponse.json()
    const portalUser = portalUsers[0]

    if (!portalUser || !portalUser.id) {
      return res.status(500).json({ error: "Failed to create portal user" })
    }

    // Create admin user
    await fetch(`${POSTGREST_BASE_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        firm_id: firm.id,
        role: "admin",
        telegram_id: Date.now(), // Temporary ID
      }),
    })

    // Sign JWT token with correct portal user ID
    const token = await signToken({
      portalUserId: portalUser.id,
      firmId: firm.id,
      firmName: firm.name,
      email,
      role: 'admin',
    })

    // Set auth cookie
    setAuthCookie(res, token)

    return res.status(200).json({
      success: true,
      message: "¡Tu suscripción ha sido activada exitosamente!",
      firmId: firm.id,
    })
  } catch (error) {
    console.error("Error in verify-whop-payment:", error)
    return res.status(500).json({
      error: "Error interno del servidor. Por favor contacta soporte.",
    })
  }
}
