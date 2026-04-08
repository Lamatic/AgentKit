export default {
  name: "Currency Converter",
  description: "This flow builds a currency converter that fetches real-time exchange rates, enabling users to accurately convert between any currencies.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["tools"],
  steps: [
    { id: "currency-converter", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/currency-converter",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/currency-converter"
},
};
