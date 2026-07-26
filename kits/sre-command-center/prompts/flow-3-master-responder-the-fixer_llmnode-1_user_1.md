Generate a remediation report for the following incident.
## Alert Data
{{triggerNode_1.output.input}}
## Retrieved Context for Remediation
Below is the reference data retrieved to resolve this incident. Note: Either the Runbook data OR the Web data will be provided. Please generate your report based strictly on whichever data is populated below.
### Internal Runbook Data (Vector DB):
{{searchNode_1.output.searchResults}}
### External Web Search Data (Firecrawl):
{{firecrawlNode_1.output.markdown}}