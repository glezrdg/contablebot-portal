import type { NextApiRequest, NextApiResponse } from "next"
import { requireAuth } from "@/lib/auth"
import {
  getPlanByPlanId,
  comparePlans,
  updateWhopMembershipPlan,
  WHOP_PLANS,
  type PlanKey,
} from "@/lib/whop"

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL

interface UpgradeRequest {
  planId: string
}

interface UpgradeResponse {
  success: true
  newPlan: {
    key: PlanKey
    name: string
    invoices: number
  }
  previousPlan?: {
    key: PlanKey
    name: string
    invoices: number
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  // Authenticate user
  const user = await requireAuth(req, res)
  if (!user) return

  try {
    const { planId } = req.body as UpgradeRequest

    if (!planId) {
      return res.status(400).json({ error: "planId is required" })
    }

    // Validate that the target plan exists
    const targetPlanEntry = getPlanByPlanId(planId)
    if (!targetPlanEntry) {
      return res.status(400).json({ error: "Invalid plan ID" })
    }

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
      return res
        .status(403)
        .json({ error: "Subscription is not active. Please reactivate your subscription first." })
    }

    // Check if user has a membership ID
    if (!firm.whop_membership_id) {
      return res.status(500).json({ error: "No membership ID found for this firm" })
    }

    // Determine if this is an upgrade or downgrade
    const currentPlanId = firm.whop_plan_id
    const changeType = currentPlanId ? comparePlans(currentPlanId, planId) : "upgrade"

    console.log(`[Subscription ${changeType}] Firm ${firm.id}: ${currentPlanId} → ${planId}`)

    // Call Whop API to update the membership plan
    const whopResult = await updateWhopMembershipPlan(firm.whop_membership_id, planId)

    if (!whopResult.success) {
      console.error(`[Subscription ${changeType}] Whop API error:`, whopResult.error)
      return res.status(500).json({
        error: whopResult.error || "Failed to update plan with Whop",
      })
    }

    // Update database with new plan
    const updateData: any = {
      whop_plan_id: planId,
      plan_limit: targetPlanEntry.plan.invoices,
      plan_changed_at: new Date().toISOString(),
    }

    // Store previous plan if we have one
    if (currentPlanId) {
      updateData.previous_plan_id = currentPlanId
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
      console.error(`[Subscription ${changeType}] Database update failed:`, error)
      throw new Error("Failed to update firm in database")
    }

    console.log(
      `[Subscription ${changeType}] Successfully updated firm ${firm.id} to plan ${planId}`,
    )

    // Prepare response
    const response: UpgradeResponse = {
      success: true,
      newPlan: {
        key: targetPlanEntry.key,
        name: targetPlanEntry.plan.name,
        invoices: targetPlanEntry.plan.invoices,
      },
    }

    // Add previous plan info if available
    if (currentPlanId) {
      const previousPlanEntry = getPlanByPlanId(currentPlanId)
      if (previousPlanEntry) {
        response.previousPlan = {
          key: previousPlanEntry.key,
          name: previousPlanEntry.plan.name,
          invoices: previousPlanEntry.plan.invoices,
        }
      }
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error("[Subscription upgrade] Error:", error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    })
  }
}
