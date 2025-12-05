import type { NextApiRequest, NextApiResponse } from "next";
import type { Invoice, InvoicesResponse, ErrorResponse } from "../../types";

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InvoicesResponse | ErrorResponse>
) {
  // Only allow GET method
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Validate environment variable
  if (!POSTGREST_BASE_URL) {
    console.error("POSTGREST_BASE_URL is not defined");
    return res
      .status(500)
      .json({ error: "Error de configuración del servidor" });
  }

  // Extract query parameters
  const { firmId, from, to, clientName } = req.query;

  // Validate firmId is required
  if (!firmId || typeof firmId !== "string") {
    return res.status(400).json({ error: "El parámetro firmId es requerido" });
  }

  // Build the PostgREST query URL
  const queryParams: string[] = [];

  // Required: filter by firm_id
  queryParams.push(`firm_id=eq.${encodeURIComponent(firmId)}`);

  // Optional: filter by fecha >= from
  if (from && typeof from === "string") {
    queryParams.push(`fecha=gte.${encodeURIComponent(from)}`);
  }

  // Optional: filter by fecha <= to
  if (to && typeof to === "string") {
    queryParams.push(`fecha=lte.${encodeURIComponent(to)}`);
  }

  // Optional: filter by client_name
  if (clientName && typeof clientName === "string") {
    queryParams.push(`client_name=eq.${encodeURIComponent(clientName)}`);
  }

  // Add limit
  queryParams.push("limit=100");

  // Add ordering by fecha descending for better UX
  queryParams.push("order=fecha.desc");

  const postgrestUrl = `${POSTGREST_BASE_URL}/invoices?${queryParams.join(
    "&"
  )}`;

  try {
    const response = await fetch(postgrestUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("PostgREST error:", response.status, response.statusText);
      return res.status(500).json({ error: "Error al obtener las facturas" });
    }

    const invoices: Invoice[] = await response.json();

    return res.status(200).json({ invoices });
  } catch (error) {
    console.error("Error calling PostgREST:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
