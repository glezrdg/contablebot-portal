// DELETE /api/invoices/[id] - Soft delete an invoice
import type { NextApiRequest, NextApiResponse } from "next";
import type { ErrorResponse } from "../../../types";
import { requireAuth } from "../../../lib/auth";

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

interface DeleteSuccessResponse {
  ok: true;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteSuccessResponse | ErrorResponse>
) {
  // Only allow DELETE method
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Validate environment variable
  if (!POSTGREST_BASE_URL) {
    console.error("[delete invoice] POSTGREST_BASE_URL is not defined");
    return res
      .status(500)
      .json({ error: "Error de configuración del servidor" });
  }

  // Require authentication - get session from cookie
  console.log(
    "[delete invoice] Checking auth, cookies present:",
    !!req.headers.cookie
  );
  const session = requireAuth(req, res);

  if (!session) {
    // requireAuth already sent 401 response
    console.log("[delete invoice] No valid session found");
    return;
  }

  console.log("[delete invoice] Session obtained:", {
    firmId: session.firmId,
    portalUserId: session.portalUserId,
  });

  // Validate invoice ID
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "ID de factura requerido" });
  }

  const invoiceId = parseInt(id, 10);
  if (isNaN(invoiceId)) {
    return res.status(400).json({ error: "ID de factura inválido" });
  }

  console.log(
    "[delete invoice] Deleting invoice:",
    invoiceId,
    "for firm:",
    session.firmId
  );

  try {
    // 1) Verify the invoice belongs to the authenticated firm
    const verifyUrl = `${POSTGREST_BASE_URL}/invoices?id=eq.${invoiceId}&firm_id=eq.${session.firmId}&is_deleted=eq.false`;
    console.log("[delete invoice] VERIFY URL:", verifyUrl);

    const verifyResponse = await fetch(verifyUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!verifyResponse.ok) {
      console.error(
        "[delete invoice] PostgREST verify error:",
        verifyResponse.status,
        verifyResponse.statusText
      );
      return res.status(verifyResponse.status).json({
        error: `Error al verificar la factura (PostgREST ${verifyResponse.status})`,
      });
    }

    const existingInvoices = await verifyResponse.json();
    console.log("[delete invoice] Found invoices:", existingInvoices.length);

    if (!Array.isArray(existingInvoices) || existingInvoices.length === 0) {
      return res.status(404).json({ error: "Factura no encontrada" });
    }

    // 2) Soft delete the invoice
    const deleteUrl = `${POSTGREST_BASE_URL}/invoices?id=eq.${invoiceId}&firm_id=eq.${session.firmId}`;
    console.log("[delete invoice] PATCH URL:", deleteUrl);

    const deleteResponse = await fetch(deleteUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      }),
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      console.error(
        "[delete invoice] PostgREST PATCH error:",
        deleteResponse.status,
        errorText
      );
      // Return the actual PostgREST error for debugging
      return res.status(deleteResponse.status).json({
        error: `Error al eliminar la factura: ${errorText}`,
      });
    }

    console.log("[delete invoice] Invoice deleted successfully");
    return res.status(200).json({
      ok: true,
      message: "Factura eliminada correctamente",
    });
  } catch (error) {
    console.error("[delete invoice] Error calling PostgREST:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
