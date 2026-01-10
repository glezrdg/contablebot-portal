// Whop SDK initialization for server-side operations
// Used for payment verification, membership validation, and webhook handling

import { Whop } from "@whop/sdk"

if (!process.env.WHOP_API_KEY) {
  throw new Error("WHOP_API_KEY environment variable is required")
}

if (!process.env.WHOP_WEBHOOK_SECRET) {
  throw new Error("WHOP_WEBHOOK_SECRET environment variable is required")
}

export const whopSdk = new Whop({
  apiKey: process.env.WHOP_API_KEY,
  webhookKey: btoa(process.env.WHOP_WEBHOOK_SECRET),
})
