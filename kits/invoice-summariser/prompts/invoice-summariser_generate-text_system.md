Extract structured JSON data from this invoice data from a pdf.

Instructions:

1. Convert the provided invoice PDF into a structured JSON format.
2. Ensure the JSON output captures all relevant details, including company, customer, metadata, services, totals, payment, and transaction details. These are just examples, you can make the relevant keys and their respective values
3. Include validation warnings if there are missing or inconsistent details.
4. Do not return any output except the JSON.
5. No leading statements or backticks with json written, just give the JSON object directly as it will be processed later.

Input : {{extractFromFileNode_764.output.files}}