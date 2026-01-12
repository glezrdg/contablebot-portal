/**
 * Access Control Middleware
 *
 * Provides role-based and plan-based access control for API routes.
 * Works in conjunction with lib/auth.ts for authentication.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { JWTPayload, Firm } from '../types';
import { requireAuth } from './auth';
import { WHOP_PLANS, type PlanKey } from './whop';

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

// ============================================
// Role-Based Access Control
// ============================================

/**
 * Requires the user to have a specific role
 */
export async function requireRole(
  req: NextApiRequest,
  res: NextApiResponse,
  requiredRole: 'admin' | 'user'
): Promise<JWTPayload | null> {
  const user = requireAuth(req, res);
  if (!user) return null;

  // Check role requirement
  if (requiredRole === 'admin' && user.role !== 'admin') {
    res.status(403).json({
      error: 'Acceso denegado. Esta función requiere privilegios de administrador.'
    });
    return null;
  }

  return user;
}

/**
 * Requires admin role (shorthand for requireRole)
 */
export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<JWTPayload | null> {
  return requireRole(req, res, 'admin');
}

// ============================================
// Plan-Based Access Control
// ============================================

const PLAN_HIERARCHY: Record<PlanKey, number> = {
  starter: 1,
  business: 2,
  pro: 3,
  ultra: 4,
  enterprise: 5,
};

/**
 * Check if a plan meets the minimum required plan level
 */
function planMeetsRequirement(currentPlan: string | undefined, requiredPlan: PlanKey): boolean {
  if (!currentPlan) return false;

  const currentLevel = PLAN_HIERARCHY[currentPlan as PlanKey] || 0;
  const requiredLevel = PLAN_HIERARCHY[requiredPlan];

  return currentLevel >= requiredLevel;
}

/**
 * Requires the firm to have a minimum plan level
 */
export async function requirePlan(
  req: NextApiRequest,
  res: NextApiResponse,
  requiredPlan: PlanKey
): Promise<{ user: JWTPayload; firm: Firm } | null> {
  const user = requireAuth(req, res);
  if (!user) return null;

  if (!POSTGREST_BASE_URL) {
    console.error('POSTGREST_BASE_URL is not configured');
    res.status(500).json({ error: 'Error de configuración del servidor' });
    return null;
  }

  try {
    // Fetch firm to check plan
    const firmUrl = `${POSTGREST_BASE_URL}/firms?id=eq.${user.firmId}`;
    const response = await fetch(firmUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error('Error fetching firm:', response.status);
      res.status(500).json({ error: 'Error al verificar plan' });
      return null;
    }

    const firms: Firm[] = await response.json();
    if (!firms || firms.length === 0) {
      res.status(403).json({ error: 'Cuenta no encontrada' });
      return null;
    }

    const firm = firms[0];

    // Determine current plan from whop_plan_id
    const planEntry = firm.whop_plan_id
      ? Object.entries(WHOP_PLANS).find(([, plan]) => plan.id === firm.whop_plan_id)
      : null;

    const currentPlanKey = planEntry?.[0] as PlanKey | undefined;

    console.log('requirePlan check:', {
      firmWhopPlanId: firm.whop_plan_id,
      currentPlanKey,
      requiredPlan,
      planEntry: planEntry?.[0],
    });

    if (!planMeetsRequirement(currentPlanKey, requiredPlan)) {
      const requiredPlanName = WHOP_PLANS[requiredPlan].name;
      console.log('Plan requirement not met:', { currentPlanKey, requiredPlan });
      res.status(403).json({
        error: `Esta función requiere el plan ${requiredPlanName} o superior`,
        upgradeRequired: true,
        requiredPlan: requiredPlanName,
      });
      return null;
    }

    return { user, firm };
  } catch (error) {
    console.error('Error in requirePlan:', error);
    res.status(500).json({ error: 'Error al verificar plan' });
    return null;
  }
}

// ============================================
// Client Access Control
// ============================================

/**
 * Verify if user has access to a specific client
 * Admins have access to all clients in their firm
 * Regular users need explicit assignment
 */
export async function verifyClientAccess(
  userId: number,
  clientId: number,
  role: 'admin' | 'user'
): Promise<boolean> {
  // Admins have access to all clients in their firm
  if (role === 'admin') {
    return true;
  }

  if (!POSTGREST_BASE_URL) {
    console.error('POSTGREST_BASE_URL is not configured');
    return false;
  }

  try {
    // Check if user has explicit assignment to this client
    const url = `${POSTGREST_BASE_URL}/user_clients?user_id=eq.${userId}&client_id=eq.${clientId}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error('Error checking client access:', response.status);
      return false;
    }

    const assignments = await response.json();
    return assignments && assignments.length > 0;
  } catch (error) {
    console.error('Error in verifyClientAccess:', error);
    return false;
  }
}

/**
 * Requires user to have access to the active client
 * Returns null and sends error response if access is denied
 */
export async function requireClientAccess(
  req: NextApiRequest,
  res: NextApiResponse,
  clientId: number
): Promise<JWTPayload | null> {
  const user = requireAuth(req, res);
  if (!user) return null;

  const hasAccess = await verifyClientAccess(user.portalUserId, clientId, user.role);

  if (!hasAccess) {
    res.status(403).json({
      error: 'No tienes permiso para acceder a este cliente'
    });
    return null;
  }

  return user;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get all accessible client IDs for a user
 */
export async function getUserAccessibleClientIds(
  userId: number,
  firmId: number,
  role: 'admin' | 'user'
): Promise<number[]> {
  if (!POSTGREST_BASE_URL) {
    console.error('POSTGREST_BASE_URL is not configured');
    return [];
  }

  try {
    // Admins get all clients in their firm
    if (role === 'admin') {
      const url = `${POSTGREST_BASE_URL}/clients?firm_id=eq.${firmId}&select=id`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        console.error('Error fetching clients:', response.status);
        return [];
      }

      const clients = await response.json();
      return clients.map((c: { id: number }) => c.id);
    }

    // Regular users get their assigned clients
    const url = `${POSTGREST_BASE_URL}/user_clients?user_id=eq.${userId}&select=client_id`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error('Error fetching user clients:', response.status);
      return [];
    }

    const assignments = await response.json();
    return assignments.map((a: { client_id: number }) => a.client_id);
  } catch (error) {
    console.error('Error in getUserAccessibleClientIds:', error);
    return [];
  }
}

/**
 * Audit log helper - logs user actions
 */
export async function auditLog(
  userId: number,
  action: string,
  resourceType?: string,
  resourceId?: number,
  metadata?: Record<string, unknown>,
  req?: NextApiRequest
): Promise<void> {
  if (!POSTGREST_BASE_URL) return;

  try {
    const logEntry = {
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
      ip_address: req?.headers['x-forwarded-for'] || req?.socket.remoteAddress,
      user_agent: req?.headers['user-agent'],
    };

    await fetch(`${POSTGREST_BASE_URL}/user_audit_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(logEntry),
    });
  } catch (error) {
    console.error('Error writing audit log:', error);
    // Don't throw - audit log failures shouldn't break the main flow
  }
}
