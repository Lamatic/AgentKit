# Receipt Split

Split a restaurant or store receipt fairly between people — starting from just a photo and a plain-English description of who had what.

## Why

Splitting a group bill by hand means someone squints at a blurry receipt, does mental math for tax and tip, and inevitably gets it slightly wrong. This bundle automates both steps: reading the receipt and doing the math.

## How it works

Two flows, run in sequence:

```
photo of receipt ──▶ receipt-extract ──▶ structured JSON ──▶ bill-splitter ──▶ per-person settlement
                                              ▲
                              "Alex had the burger, Sam had the pizza,
                               split tax and tip evenly"
```

### 1. `receipt-extract`

Reads a receipt image with a vision-capable model and returns structured JSON.

**Input**

| Field | Type | Description |
|---|---|---|
| `imageUrl` | string | URL of the receipt photo/scan |
| `rawText` | string | Optional OCR text, used as a hint |

**Output**

```json
{
  "items": [
    { "name": "PET TOY", "quantity": 1, "unitPrice": 1.97, "totalPrice": 1.97 }
  ],
  "subtotal": 25.00,
  "tax": 2.10,
  "tip": 4.00,
  "grandTotal": 31.10,
  "currency": "USD",
  "merchantName": "Example Store"
}
```

### 2. `bill-splitter`

Assigns each item to a person based on plain-English instructions, and distributes tax/tip proportionally.

**Input**

| Field | Type | Description |
|---|---|---|
| `receiptData` | string | The JSON output from `receipt-extract` |
| `splitInstructions` | string | Plain English, e.g. `"Alex had the burger, Sam had the pizza, split tax and tip evenly"` |

**Output**

```json
{
  "perPerson": [
    { "name": "Alex", "itemsShare": 10.00, "taxShare": 1.00, "tipShare": 2.00, "total": 13.00 },
    { "name": "Sam", "itemsShare": 15.00, "taxShare": 1.10, "tipShare": 2.00, "total": 18.10 }
  ],
  "subtotal": 25.00,
  "tax": 2.10,
  "tip": 4.00,
  "grandTotal": 31.10,
  "currency": "USD",
  "notes": "Rounding applied to the largest share"
}
```

## Models

Both flows run on Groq: `receipt-extract` uses `meta-llama/llama-4-scout-17b-16e-instruct` (vision), `bill-splitter` uses `llama-3.3-70b-versatile` (text reasoning). Swap either in Studio's model dropdown if you'd rather use a different provider.

## Usage

1. Deploy this bundle in [Lamatic Studio](https://studio.lamatic.ai): import both flows from `flows/`, deploy them, and note each flow's ID (three-dot menu → Copy ID) plus your `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` (Settings → API Keys).
2. Call `receipt-extract` with the receipt image:

   ```bash
   curl -X POST "$LAMATIC_API_URL/v2/$LAMATIC_PROJECT_ID/flow/$RECEIPT_EXTRACT_FLOW_ID" \
     -H "Authorization: Bearer $LAMATIC_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"imageUrl": "https://example.com/receipt.jpg", "rawText": ""}'
   ```

3. Pass the response straight into `bill-splitter` along with instructions:

   ```bash
   curl -X POST "$LAMATIC_API_URL/v2/$LAMATIC_PROJECT_ID/flow/$BILL_SPLITTER_FLOW_ID" \
     -H "Authorization: Bearer $LAMATIC_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"receiptData": "<json string from step 2>", "splitInstructions": "Alex had the burger, Sam had the pizza, split tax and tip evenly"}'
   ```

## Guardrails

See `constitutions/default.md`. Both flows are instructed to return `null` rather than invent values for anything missing or illegible on the receipt, and neither flow logs or persists the receipt image or extracted data outside of the request/response cycle.

## Notes

- These are flows only (`type: bundle`) — no frontend is included. Wire them into any app via the Lamatic SDK or the raw API calls above.
- Rounding: `bill-splitter` reconciles cent-level rounding errors against the largest individual share so `sum(perPerson.total) == grandTotal`.
