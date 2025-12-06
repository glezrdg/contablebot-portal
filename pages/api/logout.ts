// POST /api/logout - Clear auth cookie
import type { NextApiRequest, NextApiResponse } from "next";
import type { AuthSuccessResponse, ErrorResponse } from "../../types";
import { clearAuthCookie } from "../../lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthSuccessResponse | ErrorResponse>
) {
  // Only allow POST method
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Clear the auth cookie
  clearAuthCookie(res);

  return res.status(200).json({ ok: true });
}
