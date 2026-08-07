Task: Read the client document below and extract its key facts as structured JSON.
Instructions:
- Identify the document type (e.g. "bank-statement", "invoice", "sale-deed", "salary-slip", "form-26as", "pan", "aadhaar", "unknown").
- Extract every fact that could plausibly affect what other documents are required: foreign payments, large cash deposits, new vendors/GSTINs, property transactions, capital gains, high-value transactions, loans, foreign assets, etc.
- Do NOT infer requirements. Do NOT guess values. If a fact is absent, omit it.
- Return ONLY valid JSON, no prose, no markdown fences.
Return this shape:
{
  "docType": string,
  "summary": string,
  "facts": {
    "foreignPayments": [ { "amount": number, "currency": string, "date": string } ],
    "largeCashDeposits": [ { "amount": number, "date": string } ],
    "newVendors": [ { "name": string, "gstin": string } ],
    "propertyTransactions": [ { "type": "sale", "amount": number, "date": string } ],
    "otherNotable": [ string ]
  }
}
Document:
{{trigger.output.document}}