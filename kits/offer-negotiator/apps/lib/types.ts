/** The offer details the user submits — the flow's trigger payload. */
export type OfferInput = {
  role: string;
  company: string;
  location: string;
  seniority: string;
  current_base: string;
  current_bonus: string;
  current_equity: string;
  offered_base: string;
  offered_bonus: string;
  offered_equity: string;
  competing_offers: string;
  priorities: string;
  constraints: string;
};

/**
 * The structured negotiation brief returned under the flow's `answer` field.
 *
 * Only `assessment` and `counter_email` are guaranteed. Everything else is
 * optional because the shape comes from an LLM, which may omit keys.
 */
export type NegotiationResult = {
  assessment: string;
  leverage?: string[];
  strategy?: {
    summary?: string;
    target_base?: string;
    target_total?: string;
    approach?: string;
  };
  talking_points?: string[];
  counter_email: string;
  call_script?: string;
  risks?: string[];
  assumptions?: string[];
};

/** Blank offer used to seed the form. */
export const emptyOffer: OfferInput = {
  role: "",
  company: "",
  location: "",
  seniority: "",
  current_base: "",
  current_bonus: "",
  current_equity: "",
  offered_base: "",
  offered_bonus: "",
  offered_equity: "",
  competing_offers: "",
  priorities: "",
  constraints: "",
};
