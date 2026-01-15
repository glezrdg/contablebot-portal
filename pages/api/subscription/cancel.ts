import type { NextApiRequest, NextApiResponse } from "next"
import { requireAuth } from "@/lib/auth"
import { cancelWhopMembership } from "@/lib/whop"

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL

interface CancelResponse {
  success: true
  effectiveDate: string
  message: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  // Authenticate user
  const user = await requireAuth(req, res)
  if (!user) return

  try {
    // Fetch current firm data
    const firmResponse = await fetch(`${POSTGREST_BASE_URL}/firms?id=eq.${user.firmId}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!firmResponse.ok) {
      throw new Error("Failed to fetch firm data")
    }

    const firms = await firmResponse.json()
    if (!firms || firms.length === 0) {
      return res.status(404).json({ error: "Firm not found" })
    }

    const firm = firms[0]

    // Validate subscription is active
    if (!firm.is_active) {
      return res.status(403).json({ error: "Subscription is not active" })
    }

    // Check if already cancelled
    if (firm.cancel_at_period_end) {
      return res.status(400).json({
        error: "Subscription is already scheduled for cancellation",
        effectiveDate: firm.cancellation_effective_date,
      })
    }

    // Check if user has a membership ID
    if (!firm.whop_membership_id) {
      return res.status(500).json({ error: "No membership ID found for this firm" })
    }

    console.log(`[Subscription cancel] Firm ${firm.id}, membership ${firm.whop_membership_id}`)

    // Call Whop API to cancel the membership at period end
    const whopResult = await cancelWhopMembership(firm.whop_membership_id)

    if (!whopResult.success) {
      console.error("[Subscription cancel] Whop API error:", whopResult.error)
      return res.status(500).json({
        error: whopResult.error || "Failed to cancel subscription with Whop",
      })
    }

    const effectiveDate = whopResult.effectiveDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // Update database with cancellation state
    const updateData = {
      cancel_at_period_end: true,
      cancellation_scheduled_at: new Date().toISOString(),
      cancellation_effective_date: effectiveDate,
    }

    const updateResponse = await fetch(`${POSTGREST_BASE_URL}/firms?id=eq.${firm.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(updateData),
    })

    if (!updateResponse.ok) {
      const error = await updateResponse.text()
      console.error("[Subscription cancel] Database update failed:", error)
      throw new Error("Failed to update firm in database")
    }

    console.log(`[Subscription cancel] Successfully scheduled cancellation for firm ${firm.id}`)

    // TODO: Send email notification
    console.log(`[Email] Would send cancellation email to ${firm.email || user.email}`)
    console.log(`[Email] Effective date: ${effectiveDate}`)

    const response: CancelResponse = {
      success: true,
      effectiveDate,
      message: `Tu suscripción se cancelará el ${new Date(effectiveDate).toLocaleDateString("es-DO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error("[Subscription cancel] Error:", error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    })
  }
}
