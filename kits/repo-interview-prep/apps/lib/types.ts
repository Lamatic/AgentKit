export type FollowUpQuestion = {
  question: string;
  why_they_ask: string;
  suggested_answer: string;
};

export type ConceptToReview = {
  concept: string;
  why_relevant: string;
  depth_needed: "surface" | "moderate" | "deep";
};

export type RedFlag = {
  observation: string;
  how_to_address: string;
};

export type PrepBrief = {
  project_summary: string;
  tech_stack: string[];
  complexity_level: "junior" | "mid" | "senior";
  pitch: string;
  follow_up_questions: FollowUpQuestion[];
  concepts_to_review: ConceptToReview[];
  red_flags: RedFlag[];
  strengths_to_highlight: string[];
};

export type ArchitectureAnalysis = {
  mermaid_diagram: string;
  flow_summary: string;
  tradeoffs: string[];
};

export type GrillQuestion = {
  question: string;
  defensive_strategy: string;
};

export type ProductionReadiness = {
  is_production_ready: boolean;
  critical_missing_features: string[];
  quick_wins: string[];
};

export type RepoAnalysis = {
  prep_brief: PrepBrief;
  architecture: ArchitectureAnalysis;
  grill_me: { questions: GrillQuestion[] };
  production: ProductionReadiness;
};
