export type SqlPreset = {
  accent: "amber" | "indigo" | "rose" | "sky";
  filename: string;
  id: string;
  sql: string;
  summary: string;
  title: string;
};

export const presetDefinitions = [
  {
    accent: "amber",
    filename: "mixed-migration.sql",
    id: "mixed-migration",
    summary: "Multi-step migration combining additive and destructive changes.",
    title: "Mixed Migration",
  },
  {
    accent: "indigo",
    filename: "simple-add-column.sql",
    id: "simple-add-column",
    summary: "Single-table change for extending an existing production schema.",
    title: "Simple Add Column",
  },
  {
    accent: "sky",
    filename: "create-index.sql",
    id: "create-index",
    summary: "Index-focused DDL for performance-sensitive release planning.",
    title: "Create Index",
  },
  {
    accent: "rose",
    filename: "drop-table.sql",
    id: "drop-table",
    summary: "Destructive schema operation that benefits from explicit review.",
    title: "Drop Table",
  },
] satisfies Omit<SqlPreset, "sql">[];

export const initialSampleFile = "simple-add-column.sql";
