export type RiskLevel = "Critical" | "High" | "Elevated" | "Normal";

export interface SupplierRisk {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  components_supplied: string;
  tier: number;
  risk_score: number;
  risk_level: RiskLevel;
  risk_factors: string[];
  recommended_action: string;
  data_confidence: "high" | "medium" | "low";
}

export interface ScanResult {
  risk_matrix: SupplierRisk[];
  high_risk_suppliers: SupplierRisk[];
  scan_timestamp: string;
  summary: string;
}

export interface EmailDraft {
  email_subject: string;
  email_body: string;
  urgency_level: "critical" | "high" | "elevated";
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
