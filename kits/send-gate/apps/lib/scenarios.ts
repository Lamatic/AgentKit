import type { GateRequest } from "./types";

export interface Scenario extends GateRequest {
  id: string;
  title: string;
  blurb: string;
  expect: string;
}

const j = (v: unknown) => JSON.stringify(v, null, 2);

/** Public sample of the truth endpoint's shape. Reachable from Lamatic's runtime, unlike localhost. */
export const SAMPLE_TRUTH_URL =
  "https://raw.githubusercontent.com/adityamukhopadhyay/AgentKit/feat/send-gate/kits/send-gate/assets/truth/PO1430779.json";

export const SCENARIOS: Scenario[] = [
  {
    id: "invented-offer",
    title: "B2B nudge with invented numbers",
    blurb: "A Hinglish sales agent adds a discount, a lower total, a delivery promise and a guarantee. None of it is in the facts.",
    expect: "Deterministic layer blocks (unsupported 20%, ₹7,091; unsupported ETA; forbidden guarantee). The judge rewrites; the rewrite is re-verified and shipped.",
    draft: "Namaste! Aapke liye special 20% discount hai, order PO1430779 ka total sirf ₹7,091. Kal subah deliver ho jayega, 100% guaranteed.",
    facts: j({ order: { po: "PO1430779", status: "pending", total: 8864, items: 10 }, offers: [], eta: null }),
    recipient: j({ name: "Aditya Kirana Store", phone: "919045576383" }),
    policy: "",
    needsFactCheck: false,
    truthUrl: ""
  },
  {
    id: "grounded-refund",
    title: "Support reply, fully grounded",
    blurb: "Every figure and status in this refund update exists in the facts.",
    expect: "Every claim verified. Verdict allow, message unchanged. The judge still runs because the draft makes claims, and should return no unsupported claims.",
    draft: "Hi Priya, your refund of ₹2,499 for order ORD-88213 has been initiated and will reflect within 5-7 business days. Sorry for the trouble!",
    facts: j({ order: { id: "ORD-88213", status: "returned", total: 2499 }, refund: { status: "initiated", amount: 2499, window: "5-7 business days" } }),
    recipient: j({ name: "Priya", email: "priya@example.com" }),
    policy: "",
    needsFactCheck: false,
    truthUrl: ""
  },
  {
    id: "source-of-truth",
    title: "Drafter's facts vs the source of truth",
    blurb: "The drafter passes facts that agree with its own draft (placed, ₹9,000). truth_url returns the real order: pending, ₹8,864.",
    expect: "Fetched facts override the drafter's. \"placed\" is CONTRADICTED by order.status=\"pending\", ₹9,000 unsupported, source = tool. Verdict block or rewrite.",
    draft: "Order PO1430779 place ho gaya hai, total ₹9,000. Kal tak pahunch jayega.",
    facts: j({ order: { po: "PO1430779", status: "placed", total: 9000 }, eta: "kal" }),
    recipient: j({ name: "Aditya Kirana Store", phone: "919045576383" }),
    policy: "",
    needsFactCheck: false,
    truthUrl: SAMPLE_TRUTH_URL
  },
  {
    id: "fast-path",
    title: "Greeting, nothing to verify",
    blurb: "No figures, no statements, formal register. The gate should cost nothing here.",
    expect: "risk none, needsFactCheck false. Verdict allow with zero model calls (audit.judgeUsed = false). Tick 'force fact check' to see the judge run anyway.",
    draft: "Namaste! Aapka message mil gaya. Kuch madad chahiye toh batayein 🙏",
    facts: "",
    recipient: j({ name: "Aditya Kirana Store" }),
    policy: "",
    needsFactCheck: false,
    truthUrl: ""
  },
  {
    id: "register",
    title: "Right facts, wrong register",
    blurb: "Figures check out, but the agent addresses a customer as 'tu' and drops a phone number that is not the recipient's.",
    expect: "Phone CONTRADICTED against recipient.phone (block). Informal address flagged (rewrite). The judge produces an 'aap' rewrite without the foreign number.",
    draft: "Bhai tera order PO1430779 pending hai, ₹8,864 ka. Koi dikkat ho toh 9876543210 pe call kar.",
    facts: j({ order: { po: "PO1430779", status: "pending", total: 8864, items: 10 } }),
    recipient: j({ name: "Aditya Kirana Store", phone: "919045576383" }),
    policy: "",
    needsFactCheck: false,
    truthUrl: ""
  }
];
