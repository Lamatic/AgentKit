export type AppPhase =
  | "welcome"
  | "init"
  | "ready"
  | "generating"
  | "processing"
  | "resolved";

export type SeverityLevel = "P1" | "P2" | "P3" | "P4";

export interface AlertObject {
  alert_id: string;
  severity: SeverityLevel;
  service: string;
  environment: string;
  title: string;
  description: string;
  timestamp: string;
  affected_endpoints: string[];
  error_rate: string;
  suggested_runbook_tags?: string[];
}

export interface LogLine {
  id: number;
  type: "system" | "agent" | "router" | "warning" | "error" | "success" | "dim";
  prefix: string;
  message: string;
  delay?: number;
}

export interface ResolvedData {
  report: string;
  triage_category: string;
  retrieval_source: string;
  confidence: string;
}

export interface AttackPreset {
  id: string;
  title: string;
  badge: SeverityLevel;
  service: string;
  prompt: string;
}

export interface NavbarProps {
  phase: AppPhase;
  currentTime: string;
  onReset?: () => void;
}

export interface WelcomeHeroProps {
  onLaunch: () => void;
  isInitializing: boolean;
}

export interface InitializationPanelProps {
  onComplete?: () => void;
  onInitialized?: () => void;
  onClose?: () => void;
}

export interface AttackPanelProps {
  onAlertGenerated: (alert: AlertObject) => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

export interface AgentTerminalProps {
  logs: LogLine[];
  isActive: boolean;
  currentAlert: AlertObject | null;
}

export interface ResolutionCardProps {
  data: ResolvedData;
  onReset: () => void;
}
