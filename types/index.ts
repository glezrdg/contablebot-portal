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
  active_client_rnc?: string; // Currently selected client RNC (compact format, digits only)
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
  usedThisMonth: number;
  planLimit: number;
  isActive: boolean;
  manageUrl?: string;
  activeClientRnc?: string; // Currently selected client RNC (compact format)
  activeClientName?: string; // Name of active client
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
  iat?: number;
  exp?: number;
}

// Legacy types (kept for backwards compatibility during migration)
export interface LoginResponse {
  firmId: number;
  firmName: string;
  usedThisMonth: number;
  planLimit: number;
}
