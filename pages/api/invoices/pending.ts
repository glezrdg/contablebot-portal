/**
 * GET /api/invoices/pending
 *
 * Returns the count of incomplete invoices (not fully processed) for the authenticated user's firm.
 * Used by the global ProcessingIndicator to determine if processing is ongoing.
 * Counts invoices with status NOT in ("OK", "REVIEW", "ERROR")
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "@/lib/auth";

interface PendingResponse {
  count: number;
}

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PendingResponse | ErrorResponse>
) {
  // Only allow GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Authenticate
  const user = await requireAuth(req, res);
  if (!user) return; // Response already sent by requireAuth

  try {
    const firmId = user.firmId;

    // Query PostgREST for incomplete invoices count
    // Count invoices that are actively being processed (pending, processing, etc.)
    // We need to EXCLUDE completed invoices (OK, REVIEW, ERROR) AND null/empty status
    const url = new URL(`${process.env.POSTGREST_BASE_URL}/invoices`);
    url.searchParams.set("firm_id", `eq.${firmId}`);
    url.searchParams.set("status", "in.(pending,processing)"); // Only count actively processing invoices
    url.searchParams.set("is_deleted", "eq.false");
    url.searchParams.set("select", "id,status"); // Include status for debugging

    console.log("[pending API] Querying:", url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
        "Prefer": "count=exact",
      },
    });

    if (!response.ok) {
      console.error("PostgREST error:", response.status, response.statusText);
      return res.status(500).json({ error: "Error fetching pending invoices" });
    }

    // Get the actual data to debug
    const data = await response.json();
    console.log("[pending API] Found invoices:", data);

    // Extract count from Content-Range header
    const contentRange = response.headers.get("content-range");
    let count = 0;

    if (contentRange) {
      // Content-Range format: "0-24/3573" or "*/0" if no results
      const match = contentRange.match(/\/(\d+)$/);
      if (match) {
        count = parseInt(match[1], 10);
      }
    }

    console.log("[pending API] Returning count:", count);
    return res.status(200).json({ count });
  } catch (error) {
    console.error("Error in /api/invoices/pending:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
