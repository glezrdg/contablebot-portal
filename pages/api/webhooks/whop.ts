import type { NextApiRequest, NextApiResponse } from "next"
import { Readable } from "stream"
import { whopSdk } from "@/lib/whop-sdk"
import { getPlanByPlanId } from "@/lib/whop"

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL

// Helper to get raw body from request
async function getRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = []
  const stream = req as unknown as Readable

  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
  }

  return Buffer.concat(chunks).toString("utf-8")
}

// Event handlers
async function handlePaymentSucceeded(data: any) {
  console.log("[Webhook] Payment succeeded:", data.id)

  const membershipId = data.membership_id
  const manageUrl = data.manage_url

  if (!membershipId) {
    console.warn("[Webhook] No membership_id in payment.succeeded event")
    return
  }

  // Find firm by membership ID
  const firmResponse = await fetch(
    `${POSTGREST_BASE_URL}/firms?whop_membership_id=eq.${membershipId}`,
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  )

  if (!firmResponse.ok) {
    console.error("[Webhook] Error fetching firm:", await firmResponse.text())
    return
  }

  const firms = await firmResponse.json()

  if (!firms || firms.length === 0) {
    console.warn(`[Webhook] Firm not found for membership ${membershipId} - may not be created yet`)
    return
  }

  const firm = firms[0]

  // Update manage_url if provided
  if (manageUrl) {
    await fetch(`${POSTGREST_BASE_URL}/firms?id=eq.${firm.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        manage_url: manageUrl,
      }),
    })

    console.log(`[Webhook] Updated manage_url for firm ${firm.id}`)
  }
}

async function handleMembershipValid(data: any) {
  console.log("[Webhook] Membership went valid:", data.id)

  const membershipId = data.id
  const planId = data.plan_id

  // Find firm by membership ID
  const firmResponse = await fetch(
    `${POSTGREST_BASE_URL}/firms?whop_membership_id=eq.${membershipId}`,
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  )

  if (!firmResponse.ok) {
    console.error("[Webhook] Error fetching firm:", await firmResponse.text())
    return
  }

  const firms = await firmResponse.json()

  if (!firms || firms.length === 0) {
    console.warn(`[Webhook] Firm not found for membership ${membershipId}`)
    return
  }

  const firm = firms[0]

  // Get plan limit
  const planEntry = getPlanByPlanId(planId)
  const planLimit = planEntry?.plan.invoices || 150

  // Activate subscription
  await fetch(`${POSTGREST_BASE_URL}/firms?id=eq.${firm.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      is_active: true,
      plan_limit: planLimit,
    }),
  })

  console.log(`[Webhook] Activated subscription for firm ${firm.id}, plan_limit: ${planLimit}`)
}

async function handleMembershipInvalid(data: any) {
  console.log("[Webhook] Membership went invalid:", data.id)

  const membershipId = data.id

  // Find firm by membership ID
  const firmResponse = await fetch(
    `${POSTGREST_BASE_URL}/firms?whop_membership_id=eq.${membershipId}`,
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  )

  if (!firmResponse.ok) {
    console.error("[Webhook] Error fetching firm:", await firmResponse.text())
    return
  }

  const firms = await firmResponse.json()

  if (!firms || firms.length === 0) {
    console.warn(`[Webhook] Firm not found for membership ${membershipId}`)
    return
  }

  const firm = firms[0]

  // Deactivate subscription
  await fetch(`${POSTGREST_BASE_URL}/firms?id=eq.${firm.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      is_active: false,
    }),
  })

  console.log(`[Webhook] Deactivated subscription for firm ${firm.id}`)
}

async function handleMembershipUpdated(data: any) {
  console.log("[Webhook] Membership updated:", data.id)

  const membershipId = data.id
  const planId = data.plan_id
  const manageUrl = data.manage_url

  // Find firm by membership ID
  const firmResponse = await fetch(
    `${POSTGREST_BASE_URL}/firms?whop_membership_id=eq.${membershipId}`,
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  )

  if (!firmResponse.ok) {
    console.error("[Webhook] Error fetching firm:", await firmResponse.text())
    return
  }

  const firms = await firmResponse.json()

  if (!firms || firms.length === 0) {
    console.warn(`[Webhook] Firm not found for membership ${membershipId}`)
    return
  }

  const firm = firms[0]

  // Get new plan limit
  const planEntry = getPlanByPlanId(planId)
  const planLimit = planEntry?.plan.invoices || firm.plan_limit

  // Update firm
  const updateData: any = {
    whop_plan_id: planId,
    plan_limit: planLimit,
  }

  if (manageUrl) {
    updateData.manage_url = manageUrl
  }

  await fetch(`${POSTGREST_BASE_URL}/firms?id=eq.${firm.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(updateData),
  })

  console.log(`[Webhook] Updated plan for firm ${firm.id} to ${planId}, plan_limit: ${planLimit}`)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // Get raw body for signature verification
    const rawBody = await getRawBody(req)

    // Get headers in the format Whop SDK expects
    const headers = Object.fromEntries(
      Object.entries(req.headers).map(([key, value]) => [
        key,
        Array.isArray(value) ? value[0] : value || "",
      ])
    )

    // Verify webhook signature using Whop SDK
    let webhookData: any
    try {
      webhookData = whopSdk.webhooks.unwrap(rawBody, { headers })
    } catch (error) {
      console.error("[Webhook] Signature verification failed:", error)
      return res.status(401).json({ error: "Invalid signature" })
    }

    console.log(`[Webhook] Received event: ${webhookData.type}`)

    // Route to appropriate handler
    switch (webhookData.type) {
      case "payment_succeeded":
        await handlePaymentSucceeded(webhookData.data)
        break

      case "membership_activated":
        await handleMembershipValid(webhookData.data)
        break

      case "membership_deactivated":
        await handleMembershipInvalid(webhookData.data)
        break

      case "membership_cancel_at_period_end_changed":
        // Handle scheduled cancellation
        console.log(`[Webhook] Membership scheduled cancellation: ${webhookData.data.id}`)
        break

      default:
        console.log(`[Webhook] Unhandled event type: ${webhookData.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// Disable body parser to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
}
