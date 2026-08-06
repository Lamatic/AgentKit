export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical' | 'Unknown' | string;

export interface VendorInformation {
  vendor_name?: string | Record<string, any>;
  certifications?: (string | Record<string, any>)[] | Record<string, any> | string;
  security_controls?: (string | Record<string, any>)[] | Record<string, any> | string;
  compliance?: (string | Record<string, any>)[] | Record<string, any> | string;
  financial_information?: string | Record<string, any>;
  operational_information?: string | Record<string, any>;
  legal_information?: string | Record<string, any>;
  missing_information?: (string | Record<string, any>)[] | Record<string, any> | string;

  // Optional legacy / camelCase aliases
  vendorName?: string | Record<string, any>;
  securityControls?: (string | Record<string, any>)[] | Record<string, any> | string;
  financialInformation?: string | Record<string, any>;
  operationalInformation?: string | Record<string, any>;
  legalInformation?: string | Record<string, any>;
  missingInformation?: (string | Record<string, any>)[] | Record<string, any> | string;
}

export interface RiskCategoryDetails {
  category: string;
  riskLevel: RiskLevel;
  score: number | string;
  reason: string | Record<string, any>;
  evidence: string | Record<string, any>;
}

export interface RiskAssessment {
  overallRiskScore: number | string | null;
  overallRiskLevel: RiskLevel;
  categories: RiskCategoryDetails[];
}

export interface Recommendations {
  executiveSummary: string | Record<string, any>;
  positiveFindings: (string | Record<string, any>)[];
  priorityActions: (string | Record<string, any>)[];
  recommendations: (string | Record<string, any>)[];
  nextSteps: (string | Record<string, any>)[];
}

export interface AssessmentData {
  vendorInfo: VendorInformation;
  riskAssessment: RiskAssessment;
  recommendations: Recommendations;
}
