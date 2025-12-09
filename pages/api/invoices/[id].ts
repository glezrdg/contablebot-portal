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
 
try {
  const { id } = req.query;
  const invoiceId = parseInt(id as string, 10);

  console.log("[delete invoice] session:", session);
  console.log("[delete invoice] invoiceId:", invoiceId);

  // 1) Verificar que la factura pertenece a la firma
  const verifyUrl = `${POSTGREST_BASE_URL}/invoices?id=eq.${invoiceId}&firm_id=eq.${session.firmId}&is_deleted=eq.false`;
  console.log("[delete invoice] VERIFY URL:", verifyUrl);

  const verifyResponse = await fetch(verifyUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const verifyText = await verifyResponse.text();
  console.log(
    "[delete invoice] verify status:",
    verifyResponse.status,
    verifyResponse.statusText
  );
  console.log("[delete invoice] verify body:", verifyText);

  if (!verifyResponse.ok) {
    return res.status(verifyResponse.status).json({
      error: `Error al verificar la factura (PostgREST ${verifyResponse.status})`,
    });
  }

  const existingInvoices = JSON.parse(verifyText);
  if (!Array.isArray(existingInvoices) || existingInvoices.length === 0) {
    return res.status(404).json({ error: "Factura no encontrada" });
  }

  // 2) Hacer el soft-delete
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

  const deleteText = await deleteResponse.text();
  console.log(
    "[delete invoice] delete status:",
    deleteResponse.status,
    deleteResponse.statusText
  );
  console.log("[delete invoice] delete body:", deleteText);

  if (!deleteResponse.ok) {
    return res.status(deleteResponse.status).json({
      error: `Error al eliminar la factura (PostgREST ${deleteResponse.status})`,
    });
  }

  return res.status(200).json({
    ok: true,
    message: "Factura eliminada correctamente",
  });
} catch (error) {
  console.error("Error calling PostgREST:", error);
  return res.status(500).json({ error: "Error interno del servidor" });
}
}
