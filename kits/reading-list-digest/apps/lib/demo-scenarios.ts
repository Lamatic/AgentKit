export type DemoScenario = {
  id: string;
  label: string;
  urls: string[];
  query: string;
  maxArticles: number;
};

export {
  SOURCE_TEMPLATES,
  newChipId,
  type SourceTemplate,
  type UrlChip,
  type UrlChipOrigin,
  type UrlChipStatus,
} from "./source-templates";

import { SOURCE_TEMPLATES } from "./source-templates";

/** @deprecated Prefer SOURCE_TEMPLATES */
export const DEMO_SCENARIOS: DemoScenario[] = SOURCE_TEMPLATES.map((t) => ({
  id: t.id,
  label: t.label,
  urls: t.urls,
  query: t.query,
  maxArticles: t.urls.length,
}));

export const DEFAULT_SCENARIO = DEMO_SCENARIOS[0];
