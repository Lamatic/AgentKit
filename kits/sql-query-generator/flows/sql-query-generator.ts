/*
 * # SQL Query Generator
 * Converts natural language questions into optimized SQL queries using a provided database schema.
 *
 * ## Purpose
 * This flow takes a database schema and a natural language question, then generates
 * an optimized SELECT query with an explanation, confidence score, and any assumptions made.
 * It only generates read-only queries and never produces data-modifying statements.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `schema` | `string` | Yes | The database schema (CREATE TABLE statements) |
 * | `question` | `string` | Yes | Natural language question to convert to SQL |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `result` | `string` | JSON string containing sql, explanation, tables_used, assumptions, and confidence |
 */

// Flow: sql-query-generator

// ── Meta ──────────────────────────────────────────────
export const meta = {
  name: "SQL Query Generator",
  description:
    "Converts natural language questions into optimized SQL queries based on a provided database schema.",
  tags: ["sql", "database", "developer-tools"],
  testInput: {
    schema:
      "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100), email VARCHAR(100), created_at DATE); CREATE TABLE orders (id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), status VARCHAR(20), order_date DATE);",
    question:
      "Find the top 5 users who spent the most money on completed orders",
  },
  githubUrl: "",
  documentationUrl: "",
  deployUrl: "",
  author: {
    name: "Aakriti",
    email: "pandey.aakriti1@gmail.com",
  },
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  LLMNode_534: [
    {
      name: "generativeModelName",
      label: "Generative Model Name",
      type: "model",
      modelType: "generator/text",
      mode: "chat",
      description: "Select the model to generate SQL queries.",
      required: true,
      defaultValue: [
        {
          configName: "configA",
          type: "generator/text",
          provider_name: "",
          credential_name: "",
          params: {},
        },
      ],
      typeOptions: {
        loadOptionsMethod: "listModels",
      },
      isPrivate: true,
    },
  ],
};

// ── References ────────────────────────────────────────
export const references = {
  constitutions: {
    default: "@constitutions/default.md",
  },
  prompts: {
    sql_generator_system:
      "@prompts/sql-query-generator_system.md",
    sql_generator_user:
      "@prompts/sql-query-generator_user.md",
  },
  modelConfigs: {
    sql_generator_model:
      "@model-configs/sql-query-generator_model.ts",
  },
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    id: "triggerNode_1",
    type: "triggerNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "graphqlNode",
      trigger: true,
      values: {
        id: "triggerNode_1",
        nodeName: "API Request",
        responeType: "realtime",
        advance_schema: '{\n  "schema": "string",\n  "question": "string"\n}',
      },
    },
  },
  {
    id: "LLMNode_534",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "LLMNode",
      values: {
        id: "LLMNode_534",
        tools: [],
        prompts: [
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            role: "system",
            content: "@prompts/sql-query-generator_system.md",
          },
          {
            id: "05196b64-9fb1-4f02-9996-3edba8afbdf7",
            role: "user",
            content: "@prompts/sql-query-generator_user.md",
          },
        ],
        memories: "[]",
        messages: "[]",
        nodeName: "Generate Text",
        attachments: "",
        credentials: "",
        generativeModelName:
          "@model-configs/sql-query-generator_model.ts",
      },
    },
  },
  {
    id: "responseNode_triggerNode_1",
    type: "responseNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        schema: { result: "string" },
        headers: '{"content-type":"application/json"}',
        retries: "0",
        nodeName: "API Response",
        webhookUrl: "",
        retry_delay: "0",
        outputMapping:
          '{\n  "result": "{{LLMNode_534.output.generatedResponse}}"\n}',
      },
    },
  },
];

export const edges = [
  {
    id: "triggerNode_1-LLMNode_534",
    source: "triggerNode_1",
    target: "LLMNode_534",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "LLMNode_534-responseNode_triggerNode_1",
    source: "LLMNode_534",
    target: "responseNode_triggerNode_1",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "response-responseNode_triggerNode_1",
    source: "triggerNode_1",
    target: "responseNode_triggerNode_1",
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
    type: "responseEdge",
  },
];

export default { meta, inputs, references, nodes, edges };
