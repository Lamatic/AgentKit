export default {
  name: "Receipt Split",
  description: "Split a restaurant or store receipt fairly between people from just a photo and plain-English instructions.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "HEMANTH AMARTHI", email: "hemanthkumar.amarthi7@gmail.com" },
  tags: ["generative", "productivity", "finance"],
  steps: [
    { id: "receipt-extract", type: "mandatory" as const, envKey: "RECEIPT_EXTRACT_FLOW_ID" },
    { id: "bill-splitter", type: "mandatory" as const, prerequisiteSteps: ["receipt-extract"], envKey: "BILL_SPLITTER_FLOW_ID" }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/receipt-split",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Freceipt-split%2Fapps&env=RECEIPT_EXTRACT_FLOW_ID,BILL_SPLITTER_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20API%20credentials%20and%20deployed%20flow%20IDs%20are%20required.&envLink=https://github.com/Lamatic/AgentKit/tree/main/kits/receipt-split%23readme"
  }
};
