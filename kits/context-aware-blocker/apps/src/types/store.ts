export interface TimeWindow {
  id: string;
  start: string;
  end: string;
}

export interface WebItem {
  id: string;
  url: string;
  selected: boolean;
}

export interface BlockCommit {
  id: string;
  title: string;
  iconName: string;
  showRisk: boolean;
  activeDays: string[];
  timeWindows: TimeWindow[];
  blockedWebsites: WebItem[];
  aiRules: string[];
}
