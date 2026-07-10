export default {
  name: "Top_Crypto_Movers",
  description: "Pulls the top 100 cryptocurrencies from CoinGecko, ranks the five largest 24-hour gainers and losers in code, and uses an LLM to summarize the results into a daily report.",
  version: "1.0.0",
  type: "template",
  author: {
    "name": "Isaiah Ng",
    "email": "ngisaiah17@gmail.com"
  },
  tags: [
    "cryptocurrency",
    "coingecko",
    "market-data",
    "reporting",
    "automation",
    "cron",
    "llm-summarization"
  ],
  steps: [
    {
      id: "top-crypto-movers",
      type: "mandatory"
    }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/crypto-market-movers",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/crypto-market-movers"
  }
};
