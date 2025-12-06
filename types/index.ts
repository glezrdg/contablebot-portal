// TypeScript interfaces for the ContableBot Portal

// ============================================
// Database Models (from PostgREST)
// ============================================

export interface Firm {
  id: number;
  name: string;
  license_key: string;
  usage_current_month: number;
  plan_limit: number;
  whop_membership_id?: string;
  whop_plan_id?: string;
  whop_user_id?: string;
  whop_product_id?: string;
  manage_url?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
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
  total_facturado: number;
  total_facturado_itbis?: number;
  raw_ai_dump?: Record<string, unknown>;
  status: "OK" | "REVIEW" | "ERROR" | string;
  created_at?: string;
}

export interface PortalUser {
  id: number;
  firm_id: number;
  email: string;
  password_hash: string;
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
  firmId: number;
  firmName: string;
  email: string;
  usageCurrentMonth: number;
  planLimit: number;
  isActive: boolean;
}

// /api/invoices response
export interface InvoicesResponse {
  invoices: Invoice[];
}

// JWT Payload
export interface JWTPayload {
  portalUserId: number;
  firmId: number;
  firmName: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Legacy types (kept for backwards compatibility during migration)
export interface LoginResponse {
  firmId: number;
  firmName: string;
  usageCurrentMonth: number;
  planLimit: number;
}
