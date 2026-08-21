export type Urgency = "stop_now" | "urgent" | "soon" | "monitor";
export type Confidence = "low" | "medium" | "high";
export type Likelihood = "low" | "medium" | "high";
export type Drivability = "normal" | "limited" | "immobile";

export interface AssessmentInput {
  make: string;
  model: string;
  year: string;
  mileage: string;
  fuelType: string;
  symptoms: string;
  warningLights: string;
  recentService: string;
  drivability: Drivability;
}

export interface PossibleCause {
  cause: string;
  likelihood: Likelihood;
  evidence: string;
}

export interface InspectionStep {
  priority: number;
  action: string;
  performedBy: "owner" | "technician";
  reason: string;
}

export interface AssessmentReport {
  summary: string;
  urgency: Urgency;
  stopDriving: boolean;
  confidence: Confidence;
  safetyMessage: string;
  possibleCauses: PossibleCause[];
  clarifyingQuestions: string[];
  inspectionPlan: InspectionStep[];
  ownerActions: string[];
  mechanicBrief: string;
  limitations: string;
}

export interface AssessmentResult {
  success: boolean;
  report?: AssessmentReport;
  error?: string;
}
