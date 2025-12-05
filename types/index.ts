// TypeScript interfaces for the ContableBot Portal

export interface Firm {
  id: number;
  name: string;
  license_key: string;
  usage_current_month: number;
  plan_limit: number;
}

export interface Invoice {
  id: number;
  firm_id: number;
  client_name: string;
  fecha: string; // ISO format: "YYYY-MM-DD"
  rnc: string;
  ncf: string;
  total_facturado: number;
  status: "OK" | "REVIEW" | "ERROR" | string;
}

export interface LoginResponse {
  firmId: number;
  firmName: string;
  usageCurrentMonth: number;
  planLimit: number;
}

export interface InvoicesResponse {
  invoices: Invoice[];
}

export interface ErrorResponse {
  error: string;
}
