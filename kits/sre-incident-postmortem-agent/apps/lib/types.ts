export interface IncidentInput {
  service_name: string;
  incident_title: string;
  alert_details: string;
  logs_or_symptoms: string;
  timeline_notes: string;
  impact_description: string;
  current_status: string;
}

export interface Postmortem {
  severity: string;
  executive_summary: string;
  suspected_root_cause: string;
  timeline: string[];
  customer_impact: string;
  immediate_remediation: string;
  long_term_prevention: string[];
  owner_followups: string[];
  markdown_postmortem: string;
}

export interface GeneratePostmortemResponse {
  success: boolean;
  postmortem?: Postmortem;
  error?: string;
}

export interface LamaticGraphQLResponse {
  data?: {
    executeWorkflow?: {
      status?: string;
      result?: {
        postmortem?: Postmortem;
      };
    };
  };
  errors?: Array<{
    message?: string;
  }>;
}
