/**
 * /api/users
 *
 * GET  - List all users in the firm (admin only)
 * POST - Create a new user (admin only, requires Pro+ plan)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { requireAdmin, requirePlan, auditLog } from '@/lib/access-control';
import type { CreateUserRequest, CreateUserResponse, UsersResponse, ErrorResponse } from '@/types';

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UsersResponse | CreateUserResponse | ErrorResponse>
) {
  if (!POSTGREST_BASE_URL) {
    console.error('POSTGREST_BASE_URL is not configured');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  // GET - List users
  if (req.method === 'GET') {
    return handleGetUsers(req, res);
  }

  // POST - Create user
  if (req.method === 'POST') {
    return handleCreateUser(req, res);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Método no permitido' });
}

/**
 * GET /api/users - List all users in the firm
 */
async function handleGetUsers(
  req: NextApiRequest,
  res: NextApiResponse<UsersResponse | ErrorResponse>
) {
  // Require admin role
  const session = await requireAdmin(req, res);
  if (!session) return;

  try {
    // Fetch all users in the firm
    const usersUrl = `${POSTGREST_BASE_URL}/portal_users?firm_id=eq.${session.firmId}&select=id,email,full_name,role,is_active,created_by,created_at,last_login_at&order=created_at.desc`;
    const usersResponse = await fetch(usersUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!usersResponse.ok) {
      console.error('Error fetching users:', usersResponse.status);
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }

    const portalUsers = await usersResponse.json();

    // For each user, fetch their assigned clients
    const usersWithClients = await Promise.all(
      portalUsers.map(async (user: any) => {
        const userClientsUrl = `${POSTGREST_BASE_URL}/user_clients?user_id=eq.${user.id}&select=client_id,is_default`;
        const userClientsResponse = await fetch(userClientsUrl, {
          headers: { 'Accept': 'application/json' },
        });

        let assignedClients: Array<{ id: number; name: string; isDefault: boolean }> = [];

        if (userClientsResponse.ok) {
          const userClientAssignments = await userClientsResponse.json();
          const clientIds = userClientAssignments.map((uc: { client_id: number }) => uc.client_id);

          if (clientIds.length > 0) {
            const clientsUrl = `${POSTGREST_BASE_URL}/clients?id=in.(${clientIds.join(',')})&select=id,name`;
            const clientsResponse = await fetch(clientsUrl, {
              headers: { 'Accept': 'application/json' },
            });

            if (clientsResponse.ok) {
              const clients = await clientsResponse.json();
              assignedClients = clients.map((c: { id: number; name: string }) => {
                const assignment = userClientAssignments.find((uc: { client_id: number }) => uc.client_id === c.id);
                return {
                  id: c.id,
                  name: c.name,
                  isDefault: assignment?.is_default || false,
                };
              });
            }
          }
        }

        return {
          id: user.id,
          email: user.email,
          fullName: user.full_name || undefined,
          role: user.role,
          isActive: user.is_active,
          createdBy: user.created_by || undefined,
          createdAt: user.created_at,
          lastLoginAt: user.last_login_at || undefined,
          assignedClients,
        };
      })
    );

    return res.status(200).json({ users: usersWithClients });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * POST /api/users - Create a new user
 */
async function handleCreateUser(
  req: NextApiRequest,
  res: NextApiResponse<CreateUserResponse | ErrorResponse>
) {
  // Require admin role and Pro+ plan
  const planCheck = await requirePlan(req, res, 'pro');
  if (!planCheck) return;

  const { user: session, firm, planKey } = planCheck;

  try {
    const { email, password, fullName, clientIds, defaultClientId } = req.body as CreateUserRequest;
    console.log('Creating user with data:', { email, passwordLength: password?.length, fullName, clientIds, defaultClientId });

    // Check user count limit based on plan
    const { WHOP_PLANS } = await import('@/lib/whop');
    const planConfig = WHOP_PLANS[planKey];
    const userLimit = 'users' in planConfig ? planConfig.users : undefined;

    if (userLimit !== undefined) {
      // Count existing active users in the firm
      const countUsersUrl = `${POSTGREST_BASE_URL}/portal_users?firm_id=eq.${session.firmId}&is_active=eq.true&select=id`;
      const countResponse = await fetch(countUsersUrl, {
        headers: { 'Accept': 'application/json', 'Prefer': 'count=exact' },
      });

      if (!countResponse.ok) {
        console.error('Error counting users:', countResponse.status);
        return res.status(500).json({ error: 'Error al verificar límite de usuarios' });
      }

      const countHeader = countResponse.headers.get('content-range');
      const currentUserCount = countHeader ? parseInt(countHeader.split('/')[1]) : 0;

      if (currentUserCount >= userLimit) {
        return res.status(403).json({
          error: `Has alcanzado el límite de ${userLimit} usuarios para el plan ${planConfig.name}. Actualiza tu plan para agregar más usuarios.`
        });
      }
    }

    // Validate input
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.error('Invalid email:', email);
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      console.error('Invalid password length:', password?.length);
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      console.error('Invalid clientIds:', clientIds);
      return res.status(400).json({ error: 'Debe asignar al menos un cliente' });
    }

    // Verify all clients belong to this firm
    const clientsUrl = `${POSTGREST_BASE_URL}/clients?id=in.(${clientIds.join(',')})&firm_id=eq.${session.firmId}&select=id`;
    const clientsResponse = await fetch(clientsUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!clientsResponse.ok) {
      return res.status(500).json({ error: 'Error al verificar clientes' });
    }

    const validClients = await clientsResponse.json();
    if (validClients.length !== clientIds.length) {
      return res.status(400).json({ error: 'Uno o más clientes no son válidos' });
    }

    // Check if email already exists
    const checkEmailUrl = `${POSTGREST_BASE_URL}/portal_users?email=eq.${encodeURIComponent(email.toLowerCase().trim())}`;
    const checkResponse = await fetch(checkEmailUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (checkResponse.ok) {
      const existingUsers = await checkResponse.json();
      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Este email ya está registrado' });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const createUserUrl = `${POSTGREST_BASE_URL}/portal_users`;
    const createUserResponse = await fetch(createUserUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        firm_id: session.firmId,
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        full_name: fullName || null,
        role: 'user',
        is_active: true,
        created_by: session.portalUserId,
      }),
    });

    if (!createUserResponse.ok) {
      const errorBody = await createUserResponse.text();
      console.error('Error creating user:', createUserResponse.status, errorBody);
      return res.status(500).json({ error: 'Error al crear usuario en la base de datos' });
    }

    const [newUser] = await createUserResponse.json();

    // Assign clients
    const clientAssignments = clientIds.map((clientId, index) => ({
      user_id: newUser.id,
      client_id: clientId,
      is_default: clientId === defaultClientId || (index === 0 && !defaultClientId),
      assigned_by: session.portalUserId,
    }));

    const assignClientsUrl = `${POSTGREST_BASE_URL}/user_clients`;
    const assignResponse = await fetch(assignClientsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(clientAssignments),
    });

    if (!assignResponse.ok) {
      console.error('Error assigning clients:', assignResponse.status);
      // Rollback: delete the user
      await fetch(`${POSTGREST_BASE_URL}/portal_users?id=eq.${newUser.id}`, {
        method: 'DELETE',
      });
      return res.status(500).json({ error: 'Error al asignar clientes' });
    }

    // Audit log
    await auditLog(
      session.portalUserId,
      'user.created',
      'user',
      newUser.id,
      { email, clientIds, createdBy: session.email },
      req
    );

    return res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        isActive: newUser.is_active,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
