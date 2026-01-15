// GET /api/me - Get current user and firm info from JWT session
import type { NextApiRequest, NextApiResponse } from "next";
import type { Firm, MeResponse, ErrorResponse } from "../../types";
import { requireAuth } from "../../lib/auth";

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MeResponse | ErrorResponse>
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

  // Require authentication
  const session = requireAuth(req, res);
  if (!session) return; // Response already sent by requireAuth

  console.log('=== /api/me called ===');
  console.log('[/api/me] Session:', { portalUserId: session.portalUserId, firmId: session.firmId, role: session.role });

  try {
    // Fetch fresh firm data from PostgREST
    const firmUrl = `${POSTGREST_BASE_URL}/firms?id=eq.${session.firmId}`;
    const firmResponse = await fetch(firmUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!firmResponse.ok) {
      console.error("PostgREST error fetching firm:", firmResponse.status);
      return res
        .status(500)
        .json({ error: "Error al obtener información de la empresa" });
    }

    const firms: Firm[] = await firmResponse.json();

    if (!firms || firms.length === 0) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    const firm = firms[0];

    // Fetch user data to get role, active_client_id, and full_name
    const userUrl = `${POSTGREST_BASE_URL}/portal_users?id=eq.${session.portalUserId}&select=id,full_name,role,active_client_id`;
    console.log('[/api/me] Fetching user from:', userUrl);
    const userResponse = await fetch(userUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    let fullName: string | undefined;
    let role: 'admin' | 'user' = session.role || 'admin';
    let activeClientId: number | undefined = session.activeClientId;
    let activeClientRnc: string | undefined;
    let activeClientName: string | undefined;
    let assignedClients: Array<{ id: number; name: string; rnc: string; isDefault: boolean }> = [];

    console.log('[/api/me] userResponse status:', userResponse.status, userResponse.ok);
    if (userResponse.ok) {
      const users = await userResponse.json();
      console.log('[/api/me] portal_users query result:', JSON.stringify(users));
      if (users && users.length > 0) {
        const user = users[0];
        fullName = user.full_name || undefined;
        role = user.role || 'admin';
        activeClientId = user.active_client_id || session.activeClientId;

        console.log('[/api/me] User data:', { id: user.id, role: user.role, activeClientId, session_portalUserId: session.portalUserId });

        // Fetch assigned clients for this user
        const userClientsUrl = `${POSTGREST_BASE_URL}/user_clients?user_id=eq.${session.portalUserId}&select=client_id,is_default`;
        console.log('[/api/me] Fetching user_clients with URL:', userClientsUrl);
        const userClientsResponse = await fetch(userClientsUrl, {
          headers: { Accept: "application/json" },
        });

        console.log('[/api/me] userClientsResponse status:', userClientsResponse.status, userClientsResponse.ok);
        if (userClientsResponse.ok) {
          const userClientAssignments = await userClientsResponse.json();
          console.log('[/api/me] user_clients response:', JSON.stringify(userClientAssignments));
          const clientIds = userClientAssignments.map((uc: { client_id: number }) => uc.client_id);
          console.log('[/api/me] Extracted client IDs:', clientIds);

          if (clientIds.length > 0) {
            // Fetch full client details
            const clientsUrl = `${POSTGREST_BASE_URL}/clients?id=in.(${clientIds.join(',')})&select=id,name,rnc`;
            console.log('[/api/me] Fetching clients with URL:', clientsUrl);
            const clientsResponse = await fetch(clientsUrl, {
              headers: { Accept: "application/json" },
            });

            if (clientsResponse.ok) {
              const clients = await clientsResponse.json();
              console.log('[/api/me] Clients response:', clients);
              assignedClients = clients.map((c: { id: number; name: string; rnc: string }) => {
                const assignment = userClientAssignments.find((uc: { client_id: number }) => uc.client_id === c.id);
                return {
                  id: c.id,
                  name: c.name,
                  rnc: c.rnc,
                  isDefault: assignment?.is_default || false,
                };
              });
              console.log('[/api/me] Final assignedClients array:', assignedClients);

              // Set activeClientName and activeClientRnc if we have an activeClientId
              if (activeClientId) {
                const activeClient = clients.find((c: { id: number; name: string; rnc: string }) => c.id === activeClientId);
                if (activeClient) {
                  activeClientName = activeClient.name;
                  activeClientRnc = activeClient.rnc;
                }
              }
            }
          }
        }
      }
    }

    // Auto-set activeClientId for non-admin users who don't have one
    // This ensures non-admin users are always filtered to their assigned clients
    if (role !== 'admin' && !activeClientId && assignedClients.length > 0) {
      const defaultClient = assignedClients.find(c => c.isDefault);
      const clientToUse = defaultClient || assignedClients[0];
      activeClientId = clientToUse.id;
      activeClientName = clientToUse.name;
      activeClientRnc = clientToUse.rnc;
      console.log('[/api/me] Auto-set activeClientId for non-admin user:', activeClientId);
    }

    // Determine plan key from whop_plan_id
    const { WHOP_PLANS } = await import('../../lib/whop');
    const planEntry = firm.whop_plan_id
      ? Object.entries(WHOP_PLANS).find(([, plan]) => plan.id === firm.whop_plan_id)
      : null;
    const planKey = planEntry?.[0] as string | undefined;

    return res.status(200).json({
      userId: session.portalUserId,
      firmId: firm.id,
      firmName: firm.name,
      email: session.email,
      fullName,
      role,
      usedThisMonth: firm.used_this_month,
      planLimit: firm.plan_limit,
      planKey,
      isActive: firm.is_active,
      manageUrl: firm.manage_url || undefined,
      activeClientId,
      activeClientRnc,
      activeClientName,
      assignedClients,
      // Subscription cancellation state
      cancelAtPeriodEnd: firm.cancel_at_period_end || false,
      cancellationScheduledAt: firm.cancellation_scheduled_at || undefined,
      cancellationEffectiveDate: firm.cancellation_effective_date || undefined,
    });
  } catch (error) {
    console.error("Error in /api/me:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
