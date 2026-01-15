// TypeScript interfaces for the ContableBot Portal

// ============================================
// Database Models (from PostgREST)
// ============================================

export interface Firm {
  id: number;
  name: string;
  license_key: string;
  used_this_month: number;
  plan_limit: number;
  whop_membership_id?: string;
  whop_plan_id?: string;
  whop_user_id?: string;
  whop_product_id?: string;
  manage_url?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  // Subscription cancellation tracking
  cancel_at_period_end?: boolean;
  cancellation_scheduled_at?: string;
  cancellation_effective_date?: string;
  // Plan change history
  previous_plan_id?: string;
  plan_changed_at?: string;
}

export interface Invoice {
  id: number;
  firm_id: number;
  user_id?: number;
  client_id?: number;
  client_name: string;
  fecha: string; // ISO format: "YYYY-MM-DD"
  rnc: string;
  ncf: string;
  nombre_compania?: string;
  materiales?: string;

  // Exento
  monto_servicio_exento?: number;
  monto_bien_exento?: number;
  total_montos_exento?: number;

  // Gravado
  monto_servicio_gravado?: number;
  monto_bien_gravado?: number;
  total_montos_gravado?: number;

  // ITBIS
  itbis_servicios?: number;
  itbis_bienes?: number;
  total_facturado_itbis?: number;

  // Retenciones
  itbis_servicios_retenido?: number;
  retencion_30_itbis?: number;
  retencion_10?: number;
  retencion_2?: number;

  // Totales
  propina?: number;
  propina_legal?: number;
  total_facturado: number;
  total_a_cobrar?: number;

  raw_ai_dump?: Record<string, unknown>;
  raw_ocr_text?: string; // Raw OCR text from Google Vision
  status: "OK" | "REVIEW" | "ERROR" | "pending" | string;
  processed_at?: string;
  created_at?: string;

  // Soft delete
  is_deleted?: boolean;
  deleted_at?: string;

  // Quality tracking
  flag_dudoso?: boolean;
  razon_duda?: string;
  error_message?: string;
  retry_count?: number;
  qa_feedback?: string; // Feedback from QA review for re-processing
}

// Client type for filter buttons
export interface Client {
  id: number;
  firm_id: number;
  name: string;      // Business/company name (e.g., "Supermercado La Familia")
  rnc: string;       // Compact RNC for identification (e.g., "123012345") - NOT NULL
}

export interface PortalUser {
  id: number;
  firm_id: number;
  email: string;
  password_hash: string;
  full_name?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_by?: number; // User ID of admin who created this user
  active_client_id?: number; // Currently selected client ID
  active_client_rnc?: string; // Currently selected client RNC (compact format, digits only) - DEPRECATED
  last_login_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface UserClient {
  id: number;
  user_id: number;
  client_id: number;
  is_default: boolean;
  assigned_at: string;
  assigned_by?: number;
}

export interface UserAuditLog {
  id: number;
  user_id: number;
  action: string;
  resource_type?: string;
  resource_id?: number;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// ============================================
// API Request/Response Types
// ============================================

// Auth responses
export interface AuthSuccessResponse {
  ok: true;
}

export interface ErrorResponse {
  error: string;
}

// /api/me response
export interface MeResponse {
  userId: number;
  firmId: number;
  firmName: string;
  email: string;
  fullName?: string;
  role: 'admin' | 'user';
  usedThisMonth: number;
  planLimit: number;
  planKey?: string; // 'starter', 'business', 'pro', 'ultra', 'enterprise'
  isActive: boolean;
  manageUrl?: string;
  activeClientId?: number; // Currently selected client ID
  activeClientRnc?: string; // Currently selected client RNC (compact format) - DEPRECATED
  activeClientName?: string; // Name of active client
  assignedClients?: Array<{
    id: number;
    name: string;
    rnc: string;
    isDefault: boolean;
  }>;
  // Subscription cancellation state
  cancelAtPeriodEnd?: boolean;
  cancellationScheduledAt?: string;
  cancellationEffectiveDate?: string;
}

// /api/invoices response
export interface InvoicesResponse {
  invoices: Invoice[];
  total?: number;
  page?: number;
  limit?: number;
}

// /api/clients response
export interface ClientsResponse {
  clients: Client[];
}

// JWT Payload
export interface JWTPayload {
  portalUserId: number;
  firmId: number;
  firmName: string;
  email: string;
  role: 'admin' | 'user';
  activeClientId?: number; // Currently selected client
  assignedClientIds?: number[]; // All accessible clients (for permission checking)
  iat?: number;
  exp?: number;
}

// User management types
export interface CreateUserRequest {
  email: string;
  password: string;
  fullName?: string;
  clientIds: number[]; // Clients to assign
  defaultClientId?: number; // Which client is default
}

export interface CreateUserResponse {
  success: true;
  user: {
    id: number;
    email: string;
    fullName?: string;
    role: string;
    isActive: boolean;
  };
}

export interface UpdateUserRequest {
  fullName?: string;
  isActive?: boolean;
  clientIds?: number[]; // Update assigned clients
  defaultClientId?: number;
}

export interface UsersResponse {
  users: Array<{
    id: number;
    email: string;
    fullName?: string;
    role: 'admin' | 'user';
    isActive: boolean;
    createdBy?: number;
    createdAt: string;
    lastLoginAt?: string;
    assignedClients: Array<{
      id: number;
      name: string;
      isDefault: boolean;
    }>;
  }>;
}

// Legacy types (kept for backwards compatibility during migration)
export interface LoginResponse {
  firmId: number;
  firmName: string;
  usedThisMonth: number;
  planLimit: number;
}
