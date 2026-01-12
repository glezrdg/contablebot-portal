// PATCH /api/clients/[id] - Update a client
// DELETE /api/clients/[id] - Delete a client
import type { NextApiRequest, NextApiResponse } from "next";
import type { ErrorResponse, Client } from "../../../types";
import { requireAuth } from "../../../lib/auth";
import { validateRnc } from "../../../lib/rnc-validator";

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

interface UpdateClientResponse {
  ok: true;
  client: Client;
}

interface DeleteClientResponse {
  ok: true;
  message: string;
}

interface ClientHasInvoicesResponse {
  error: string;
  invoiceCount: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | UpdateClientResponse
    | DeleteClientResponse
    | ErrorResponse
    | ClientHasInvoicesResponse
  >
) {
  // Only allow PATCH and DELETE methods
  if (req.method !== "PATCH" && req.method !== "DELETE") {
    res.setHeader("Allow", ["PATCH", "DELETE"]);
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Validate environment variable
  if (!POSTGREST_BASE_URL) {
    console.error("POSTGREST_BASE_URL is not defined");
    return res
      .status(500)
      .json({ error: "Error de configuración del servidor" });
  }

  // Require authentication
  const session = requireAuth(req, res);
  if (!session) return; // Response already sent by requireAuth

  // Get client ID from URL
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "ID de cliente requerido" });
  }

  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) {
    return res.status(400).json({ error: "ID de cliente inválido" });
  }

  // Handle PATCH - Update client
  if (req.method === "PATCH") {
    try {
      const { rnc, name } = req.body;

      // Validate inputs
      if (!rnc || rnc.trim().length === 0) {
        return res.status(400).json({ error: "El RNC es requerido" });
      }
      if (!name || name.trim().length === 0) {
        return res
          .status(400)
          .json({ error: "El nombre del cliente es requerido" });
      }

      // Validate RNC format
      const rncValidation = validateRnc(rnc);
      if (!rncValidation.valid) {
        return res.status(400).json({
          error: rncValidation.error || "RNC/Cédula inválido",
        });
      }

      // Check if client exists and belongs to this firm
      const verifyUrl = `${POSTGREST_BASE_URL}/clients?id=eq.${clientId}&firm_id=eq.${session.firmId}`;
      const verifyResponse = await fetch(verifyUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!verifyResponse.ok) {
        return res.status(500).json({ error: "Error al verificar el cliente" });
      }

      const existingClients = await verifyResponse.json();
      if (!Array.isArray(existingClients) || existingClients.length === 0) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }

      // Check if another client with this RNC exists (excluding current client)
      const duplicateCheckUrl = `${POSTGREST_BASE_URL}/clients?firm_id=eq.${session.firmId}&rnc=eq.${rncValidation.compact}&id=neq.${clientId}`;
      const duplicateCheckResponse = await fetch(duplicateCheckUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (duplicateCheckResponse.ok) {
        const duplicates = await duplicateCheckResponse.json();
        if (duplicates && duplicates.length > 0) {
          return res.status(409).json({
            error: `Ya existe otro cliente con RNC ${rncValidation.formatted}`,
          });
        }
      }

      // Update client
      const updateUrl = `${POSTGREST_BASE_URL}/clients?id=eq.${clientId}&firm_id=eq.${session.firmId}`;
      const updateResponse = await fetch(updateUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          name: name,
          rnc: rncValidation.compact,
        }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("PostgREST error updating client:", errorText);
        return res
          .status(updateResponse.status)
          .json({ error: `Error al actualizar el cliente: ${errorText}` });
      }

      const updatedClients = await updateResponse.json();
      if (!Array.isArray(updatedClients) || updatedClients.length === 0) {
        return res
          .status(500)
          .json({ error: "No se recibió el cliente actualizado" });
      }

      return res.status(200).json({
        ok: true,
        client: updatedClients[0],
      });
    } catch (error) {
      console.error("Error in PATCH /api/clients/[id]:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Handle DELETE - Delete client
  if (req.method === "DELETE") {
    try {
      // Get deleteInvoices flag from query params
      const { deleteInvoices } = req.query;
      const shouldDeleteInvoices = deleteInvoices === "true";

      // Check if client exists and belongs to this firm
      const verifyUrl = `${POSTGREST_BASE_URL}/clients?id=eq.${clientId}&firm_id=eq.${session.firmId}`;
      const verifyResponse = await fetch(verifyUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!verifyResponse.ok) {
        return res.status(500).json({ error: "Error al verificar el cliente" });
      }

      const existingClients = await verifyResponse.json();
      if (!Array.isArray(existingClients) || existingClients.length === 0) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }

      // Count invoices for this client
      const invoicesCountUrl = `${POSTGREST_BASE_URL}/invoices?client_id=eq.${clientId}&is_deleted=eq.false&select=id`;
      const invoicesCountResponse = await fetch(invoicesCountUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      let invoiceCount = 0;
      if (invoicesCountResponse.ok) {
        const invoices = await invoicesCountResponse.json();
        invoiceCount = invoices ? invoices.length : 0;
      }

      // If client has invoices and deleteInvoices is not set, return count for confirmation
      if (invoiceCount > 0 && !shouldDeleteInvoices) {
        return res.status(409).json({
          error: "CLIENT_HAS_INVOICES",
          invoiceCount,
        });
      }

      // Delete invoices if requested (soft delete + remove client_id reference)
      if (shouldDeleteInvoices && invoiceCount > 0) {
        const deleteInvoicesUrl = `${POSTGREST_BASE_URL}/invoices?client_id=eq.${clientId}&firm_id=eq.${session.firmId}`;
        const deleteInvoicesResponse = await fetch(deleteInvoicesUrl, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            client_id: null, // Remove foreign key reference to allow client deletion
          }),
        });

        if (!deleteInvoicesResponse.ok) {
          const errorText = await deleteInvoicesResponse.text();
          console.error("Error soft-deleting invoices:", errorText);
          return res.status(500).json({
            error: "Error al eliminar las facturas del cliente",
          });
        }
      }

      // Delete client
      const deleteUrl = `${POSTGREST_BASE_URL}/clients?id=eq.${clientId}&firm_id=eq.${session.firmId}`;
      const deleteResponse = await fetch(deleteUrl, {
        method: "DELETE",
      });

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.error("PostgREST error deleting client:", errorText);
        return res
          .status(deleteResponse.status)
          .json({ error: `Error al eliminar el cliente: ${errorText}` });
      }

      return res.status(200).json({
        ok: true,
        message: shouldDeleteInvoices
          ? `Cliente eliminado correctamente junto con ${invoiceCount} factura${
              invoiceCount !== 1 ? "s" : ""
            }`
          : "Cliente eliminado correctamente",
      });
    } catch (error) {
      console.error("Error in DELETE /api/clients/[id]:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}
