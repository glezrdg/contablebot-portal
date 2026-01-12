import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "@/lib/auth";

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

interface ReportStats {
  totalInvoices: number;
  totalAmount: number;
  averageAmount: number;
  thisMonth: number;
  lastMonth: number;
  monthlyGrowth: number;
  topClients: Array<{ name: string; count: number; amount: number }>;
  monthlyBreakdown: Array<{ month: string; count: number; amount: number }>;
}

interface StatsResponse {
  stats: ReportStats;
}

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatsResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!POSTGREST_BASE_URL) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Require authentication
  const session = requireAuth(req, res);
  if (!session) return; // Response already sent by requireAuth

  try {
    const { period = "month", clientId } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let lastPeriodStart: Date;
    let lastPeriodEnd: Date;

    switch (period) {
      case "quarter":
        // Last 3 months
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        lastPeriodStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        lastPeriodEnd = new Date(now.getFullYear(), now.getMonth() - 3, 0);
        break;
      case "year":
        // Last 12 months
        startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
        lastPeriodStart = new Date(now.getFullYear(), now.getMonth() - 24, 1);
        lastPeriodEnd = new Date(now.getFullYear(), now.getMonth() - 12, 0);
        break;
      default: // month
        // Current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        lastPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        lastPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    // Build base URL with firm filter
    let baseUrl = `${POSTGREST_BASE_URL}/invoices?firm_id=eq.${session.firmId}&is_deleted=eq.false`;

    // Add client filter if specified
    if (clientId && clientId !== "all") {
      baseUrl += `&client_id=eq.${clientId}`;
    }

    // Fetch all invoices for the period
    const invoicesUrl = `${baseUrl}&created_at=gte.${startDate.toISOString().split("T")[0]}`;
    const invoicesResponse = await fetch(invoicesUrl, {
      headers: { "Content-Type": "application/json" },
    });

    if (!invoicesResponse.ok) {
      throw new Error("Failed to fetch invoices");
    }

    const invoices = await invoicesResponse.json();

    // Fetch last period invoices for growth calculation
    const lastPeriodUrl = `${baseUrl}&created_at=gte.${lastPeriodStart.toISOString().split("T")[0]}&created_at=lte.${lastPeriodEnd.toISOString().split("T")[0]}`;
    const lastPeriodResponse = await fetch(lastPeriodUrl, {
      headers: { "Content-Type": "application/json" },
    });

    const lastPeriodInvoices = await lastPeriodResponse.json();

    // Calculate total stats
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce(
      (sum: number, inv: any) => sum + (parseFloat(inv.total_facturado) || 0),
      0
    );
    const averageAmount = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

    // Calculate this period vs last period
    const thisMonth = invoices.length;
    const lastMonth = Array.isArray(lastPeriodInvoices) ? lastPeriodInvoices.length : 0;
    const monthlyGrowth =
      lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    // Group by client for top clients
    const clientMap = new Map<string, { name: string; count: number; amount: number }>();

    invoices.forEach((inv: any) => {
      // Use client_id if available, otherwise use client_name as fallback
      const clientKey = inv.client_id ? `id_${inv.client_id}` : `name_${inv.client_name || 'Sin cliente'}`;
      const clientName = inv.client_name || "Sin cliente";

      const current = clientMap.get(clientKey) || { name: clientName, count: 0, amount: 0 };
      clientMap.set(clientKey, {
        name: clientName,
        count: current.count + 1,
        amount: current.amount + (parseFloat(inv.total_facturado) || 0),
      });
    });

    // Get top 5 clients
    const topClients = Array.from(clientMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Group by month for breakdown
    const monthlyMap = new Map<string, { count: number; amount: number }>();
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    invoices.forEach((inv: any) => {
      // Use created_at for grouping by month
      const dateStr = inv.created_at || inv.fecha;
      if (!dateStr) return;

      const date = new Date(dateStr);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthName = monthNames[date.getMonth()];

      const current = monthlyMap.get(monthKey) || { count: 0, amount: 0 };
      monthlyMap.set(monthKey, {
        count: current.count + 1,
        amount: current.amount + (parseFloat(inv.total_facturado) || 0),
      });
    });

    // Get last 3 months for breakdown
    const monthlyBreakdown = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-3)
      .map(([key, data]) => {
        const [year, month] = key.split("-");
        const monthIndex = parseInt(month) - 1;
        return {
          month: monthNames[monthIndex],
          ...data,
        };
      });

    const stats: ReportStats = {
      totalInvoices,
      totalAmount: Math.round(totalAmount * 100) / 100,
      averageAmount: Math.round(averageAmount * 100) / 100,
      thisMonth,
      lastMonth,
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
      topClients,
      monthlyBreakdown,
    };

    return res.status(200).json({ stats });
  } catch (error) {
    console.error("Error in /api/reports/stats:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
