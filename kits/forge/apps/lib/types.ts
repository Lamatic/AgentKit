// ── Forge Session Types ──

export type ForgeSession = {
  // Step 1 — collected from the form
  projectDetails: ProjectDetails;

  // Step 2 — returned from forge-pricing, confirmed by user
  pricing: PricingResult | null;

  // Step 3 — returned from forge-tradeoff, one selected by user
  governing_law: GoverningLawOption | null;

  // Step 4 — returned from forge-contract and forge-invoice
  contract: Record<string, { heading: string; body: string }> | null;
  invoice: InvoiceData | null;

  // Signatures — stored as base64 PNG strings
  contract_signature: string | null;
  invoice_signature: string | null;
};

export type ProjectDetails = {
  freelancer_name: string;
  freelancer_country: string;
  freelancer_payment_method: string;
  freelancer_primary_concern: string;
  freelancer_address: string;
  freelancer_email: string;
  freelancer_payment_details: string;
  client_name: string;
  client_country: string;
  client_type: string;
  client_address: string;
  client_email: string;
  project_title: string;
  project_description: string;
  deliverables: string;
  timeline_start: string;
  timeline_end: string;
  payment_structure: string;
  payment_currency: string;
  work_type: string;
  field: string;
  experience_level: string;
  years_of_experience: string;
};

export type PricingLineItem = {
  description: string;
  quantity: string;
  rate: string;
  amount: string;
  currency: string;
  justification: string;
};

export type PricingResult = {
  experience_assessment: string;
  market_context: string;
  line_items: PricingLineItem[];
  total_amount: string;
  currency: string;
};

export type GoverningLawOption = {
  option_name: string;
  explanation: string;
  pros: string[];
  cons: string[];
  recommended: boolean;
};

export type InvoiceData = {
  header: {
    invoice_date: string;
    due_date: string;
    project_title: string;
  };
  freelancer: {
    name: string;
    address: string;
    country: string;
    email: string;
  };
  client: {
    name: string;
    address: string;
    country: string;
    email: string;
  };
  line_items: Array<{
    description: string;
    quantity: string;
    rate: string;
    amount: string;
  }>;
  totals: {
    total: string;
  };
  payment_instructions: string;
  notes: string;
};
