// Flow: interview-reflection-coach

// -- Meta --
export const meta = {
  "name": "interview-reflection-coach",
  "description": "Turn anonymous post-interview notes into structured feedback, improved STAR answers, follow-up email drafts, and next-round preparation plans.",
  "tags": ["interview", "career", "candidate", "coaching", "star-method", "privacy"],
  "testInput": {
    "candidateAlias": "Candidate A",
    "role": "Applied AI Engineer",
    "company": "Lamatic.ai",
    "interviewRound": "AgentKit Challenge Shortlisting Round",
    "interviewNotes": "The candidate received the challenge email and needs to build something using Lamatic AgentKit. They understood the instructions but felt unsure about choosing a unique idea and structuring the PR.",
    "questionsAsked": "Build something extraordinary using Lamatic AgentKit. Choose a unique problem statement. Create a PR with the agentkit-challenge label.",
    "answersGiven": "The candidate planned to create an Interview Reflection Coach that helps candidates improve after interviews.",
    "candidateFeeling": "Excited but slightly confused about implementation steps.",
    "recruiterComments": "Precision matters. Resolve GitHub Action and CodeRabbit issues before final submission."
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/interview-reflection-coach",
  "documentationUrl": "",
  "deployUrl": "https://palaksorganization517-palaksproject797.lamatic.dev",
  "author": {
    "name": "Palak Jaiswal",
    "email": "palakjais9827@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_154": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "interview_reflection_coach_llmnode_154_system_0": "@prompts/interview-reflection-coach_llmnode-154_system_0.md",
    "interview_reflection_coach_llmnode_154_user_1": "@prompts/interview-reflection-coach_llmnode-154_user_1.md"
  },
  "modelConfigs": {
    "interview_reflection_coach_llmnode_154_generative_model_name": "@model-configs/interview-reflection-coach_llmnode-154_generative-model-name.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"candidateAlias\": \"string\",\n  \"role\": \"string\",\n  \"company\": \"string\",\n  \"interviewRound\": \"string\",\n  \"interviewNotes\": \"string\",\n  \"questionsAsked\": \"string\",\n  \"answersGiven\": \"string\",\n  \"candidateFeeling\": \"string\",\n  \"recruiterComments\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_154",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/interview-reflection-coach_llmnode-154_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/interview-reflection-coach_llmnode-154_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Reflection Report",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/interview-reflection-coach_llmnode-154_generative-model-name.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "generatedResponse",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"reflectionReport\": \"{{LLMNode_154.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_154",
    "source": "triggerNode_1",
    "target": "LLMNode_154",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_154-responseNode_triggerNode_1",
    "source": "LLMNode_154",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
