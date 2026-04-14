// types/index.ts
// All shared TypeScript types for The Warehouse Analyst.
// Any file in the project can import from here.

// A single chat message
export type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

// A single KPI stat card
export type Stat = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
};

// The shape of a response from our Lamatic action
export type AnalystResponse = {
  success: boolean;
  data?: string;
  error?: string;
};
