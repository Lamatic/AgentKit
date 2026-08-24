export interface Plan {
  name: string;
  price: string;
  billingPeriod: string;
  features: string[];
}

export interface Competitor {
  competitorName: string;
  url: string;
  currency: string;
  plans: Plan[];
  notableFeatures: string[];
  freeTrial: string;
  extractionNotes: string;
}

export interface CompetitorInput {
  competitorName: string;
  url: string;
}

export interface TrackResult {
  ok: boolean;
  competitor?: Competitor;
  error?: string;
  input: CompetitorInput;
}
