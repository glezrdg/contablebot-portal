import type { NextApiRequest, NextApiResponse } from "next"
import { requireAuth } from "@/lib/auth"
import { reactivateWhopMembership } from "@/lib/whop"

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL

interface ReactivateResponse {
  success: true
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

    // Check if subscription is scheduled for cancellation
    if (!firm.cancel_at_period_end) {
      return res.status(400).json({
        error: "Subscription is not scheduled for cancellation",
      })
    }

    // Check if user has a membership ID
    if (!firm.whop_membership_id) {
      return res.status(500).json({ error: "No membership ID found for this firm" })
    }

    console.log(`[Subscription reactivate] Firm ${firm.id}, membership ${firm.whop_membership_id}`)

    // Call Whop API to reactivate the membership (remove cancellation)
    const whopResult = await reactivateWhopMembership(firm.whop_membership_id)

    if (!whopResult.success) {
      console.error("[Subscription reactivate] Whop API error:", whopResult.error)
      return res.status(500).json({
        error: whopResult.error || "Failed to reactivate subscription with Whop",
      })
    }

    // Update database to clear cancellation state
    const updateData = {
      cancel_at_period_end: false,
      cancellation_scheduled_at: null,
      cancellation_effective_date: null,
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
      console.error("[Subscription reactivate] Database update failed:", error)
      throw new Error("Failed to update firm in database")
    }

    console.log(`[Subscription reactivate] Successfully reactivated subscription for firm ${firm.id}`)

    // TODO: Send email notification
    console.log(`[Email] Would send reactivation email to ${firm.email || user.email}`)

    const response: ReactivateResponse = {
      success: true,
      message: "Tu suscripción ha sido reactivada exitosamente",
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error("[Subscription reactivate] Error:", error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    })
  }
}
