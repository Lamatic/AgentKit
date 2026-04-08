# Flows

## 1-finance-select-stocks
**Nodes:** API Request → Variables → Fetch Stock → Collate Suggestions → API Response

## 2-finance-company-profiles
**Nodes:** API Request → Variables → Company Profiles Fetch → Fetch Profile → Check Data → Company Profiles Fetch End → Collate Results → API Response

## 3a-finance-fundamentals
**Nodes:** API Request → Variables → Fetch Fundamentals → Branching → Fetch Balance Sheet → Fetch Income Statement → Fetch Key Metrics → Fetch CashFlow Statement → Collate Fundamentals → Fetch Fundamentals End → Collate Results → API Response

## 3b-finance-historical-stock-data
**Nodes:** API Request → Variables → One Year Ago Date → Fetch Stock Data → Fetch Stock Price → Group Data → Fetch Stock Data End → Collate Results → API Response

## 3c-finance-market-sentiment
Select the credentials for Serper authentication.
**Nodes:** API Request → Variables → Fetch Market Sentiment Data → Web Search → Fetch Socials → Fetch Market Sentiment Data End → Collate Results → API Response

## 3d-finance-analysis
Select the model to generate text based on the prompt.
**Nodes:** API Request → Fetch Data → Execute 3A. Finance - Fundamentals → Execute 3B. Finance - Historical Stock Data → Execute 3C. Finance - Market Sentiment → Collate Data → Generate JSON → API Response

