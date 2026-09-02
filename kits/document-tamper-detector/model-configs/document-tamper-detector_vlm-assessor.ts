export default [
  {
    configName: "configA",
    type: "generator/text",
    provider_name: "",
    credential_name: "",
    params: {
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 2048,
      response_format: { type: "json_object" }
    }
  }
];
