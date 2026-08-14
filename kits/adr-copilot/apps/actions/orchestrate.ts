"use server";

import { lamaticClient, flowId } from "@/lib/lamatic-client";

export interface ADRResult {
  adrNumber?: string;
  title: string;
  status: "Accepted" | "Proposed" | "Rejected" | "Draft";
  context: string;
  decisionDrivers?: string[];
  consideredOptions?: Array<{
    name: string;
    description: string;
    pros: string[];
    cons: string[];
  }>;
  chosenOption?: string;
  consequences?: {
    positive: string[];
    negative: string[];
  };
  mermaidDiagram?: string;
  markdownContent: string;
}

export async function generateADR(
  instructions: string,
  constraints: string = ""
): Promise<{
  success: boolean;
  data?: ADRResult;
  error?: string;
  isFallback?: boolean;
}> {
  try {
    if (!instructions || instructions.trim().length < 5) {
      return {
        success: false,
        error: "Please provide a detailed technical design proposal or architectural decision instructions.",
      };
    }

    // Check if API key or Flow ID is set
    const apiKey = process.env.LAMATIC_API_KEY;
    const currentFlowId = process.env.LAMATIC_FLOW_ID || flowId;

    if (!apiKey || !currentFlowId) {
      console.warn("Lamatic API Key or Flow ID missing. Returning interactive simulation ADR payload.");
      return {
        success: true,
        isFallback: true,
        data: generateFallbackADR(instructions, constraints),
      };
    }

    const payload = {
      instructions,
      constraints,
    };

    const res = await lamaticClient.executeFlow(currentFlowId, payload);
    const resData = res as any;
    const answer = resData?.result?.answer?.data || resData?.result?.answer || resData?.data || resData?.result;

    if (!answer) {
      throw new Error("No architectural data returned from Lamatic flow.");
    }

    return {
      success: true,
      data: typeof answer === "string" ? JSON.parse(answer) : answer,
    };
  } catch (err: any) {
    console.error("ADR Generation error:", err);
    return {
      success: true,
      isFallback: true,
      error: err.message ? `Live API Notice: ${err.message}. Showing simulated ADR structure.` : undefined,
      data: generateFallbackADR(instructions, constraints),
    };
  }
}

function generateFallbackADR(instructions: string, constraints: string): ADRResult {
  const isVectorDB = instructions.toLowerCase().includes("vector") || instructions.toLowerCase().includes("qdrant") || instructions.toLowerCase().includes("postgres");
  const isMicroservices = instructions.toLowerCase().includes("microservice") || instructions.toLowerCase().includes("monolith") || instructions.toLowerCase().includes("event");

  if (isVectorDB) {
    return {
      adrNumber: "0004",
      title: "Selection of Vector Storage Architecture for AI Retrieval Pipeline",
      status: "Accepted",
      context: `The engineering team needs to choose a vector storage solution for our high-throughput AI search engine. Key constraints specified: ${constraints || "Sub-50ms latency budget and cost efficiency"}.\n\nRaw proposal: ${instructions}`,
      decisionDrivers: [
        "Sub-50ms p99 query latency for 1536-dim embeddings",
        "Operational familiarity (team has 4+ years PostgreSQL experience)",
        "Monthly infrastructure cost ceiling under $500/mo",
        "ACID transactional consistency for vector + relational metadata joins"
      ],
      consideredOptions: [
        {
          name: "Option A: PostgreSQL with PGVector Extension",
          description: "Utilize existing AWS RDS Postgres cluster with pgvector HNSW indexing enabled.",
          pros: [
            "Zero extra infrastructure or vendor lock-in",
            "Single atomic transactions combining metadata and vector search",
            "Leverages existing PostgreSQL monitoring and backup infrastructure"
          ],
          cons: [
            "HNSW index build times scale non-linearly over 10M vectors",
            "Requires careful memory allocation tuning for work_mem and maintenance_work_mem"
          ]
        },
        {
          name: "Option B: Dedicated Managed Vector DB (Qdrant / Pinecone)",
          description: "Deploy a dedicated cluster specifically optimized for high-scale ANN vector search.",
          pros: [
            "Sub-20ms query latency at 100M+ vector scale",
            "Purpose-built filtering and payload indexing out-of-the-box"
          ],
          cons: [
            "Adds second database technology stack to maintain",
            "Dual-writes required between PostgreSQL and Vector DB introducing eventual consistency risks",
            "Higher base monthly infrastructure cost (~$400/mo base)"
          ]
        }
      ],
      chosenOption: "Option A (PostgreSQL with PGVector)",
      consequences: {
        positive: [
          "Eliminates multi-database sync complexity and eventual consistency bugs",
          "Keeps monthly cost at $0 incremental infra cost by utilizing standby capacity",
          "Allows standard SQL JOIN queries between users, permissions, and vector embeddings"
        ],
        negative: [
          "Will require upgrading to dedicated Qdrant if total vector embeddings exceed 25 million items"
        ]
      },
      mermaidDiagram: `graph TD\n    App[Next.js App Server] -->|SQL + Vector Query| PG[(PostgreSQL + pgvector)]\n    PG -->|HNSW Index Search| Index[Vector Embeddings Index]\n    PG -->|Relational Join| UserData[User Metadata Table]`,
      markdownContent: `# [ADR-0004] Selection of Vector Storage Architecture for AI Retrieval Pipeline

## Status
**Accepted**

## Context
The engineering team needs to choose a vector storage solution for our high-throughput AI search engine.

**Proposal Notes:**
${instructions}

**Constraints:**
${constraints || "Sub-50ms latency budget and cost efficiency."}

## Decision Drivers
- Sub-50ms p99 query latency for 1536-dim embeddings
- Operational familiarity (team has 4+ years PostgreSQL experience)
- Monthly infrastructure cost ceiling under $500/mo
- ACID transactional consistency for vector + relational metadata joins

## Considered Options

### Option A: PostgreSQL with PGVector Extension
- **Pros:**
  - Zero extra infrastructure or vendor lock-in
  - Single atomic transactions combining metadata and vector search
  - Leverages existing PostgreSQL monitoring and backup infrastructure
- **Cons:**
  - HNSW index build times scale non-linearly over 10M vectors
  - Requires careful memory allocation tuning

### Option B: Dedicated Managed Vector DB (Qdrant / Pinecone)
- **Pros:**
  - Sub-20ms query latency at 100M+ vector scale
  - Purpose-built filtering and payload indexing out-of-the-box
- **Cons:**
  - Adds second database technology stack to maintain
  - Dual-writes required introducing eventual consistency risks

## Decision Outcome
**Chosen Option:** Option A (PostgreSQL with PGVector Extension)

### Consequences
**Positive:**
- Eliminates multi-database sync complexity and eventual consistency bugs
- Keeps monthly cost at $0 incremental infra cost by utilizing standby capacity
- Allows standard SQL JOIN queries between users, permissions, and vector embeddings

**Negative:**
- Will require upgrading to dedicated Qdrant if total vector embeddings exceed 25 million items

## Architecture Component Diagram
\`\`\`mermaid
graph TD
    App[Next.js App Server] -->|SQL + Vector Query| PG[(PostgreSQL + pgvector)]
    PG -->|HNSW Index Search| Index[Vector Embeddings Index]
    PG -->|Relational Join| UserData[User Metadata Table]
\`\`\`
`
    };
  }

  return {
    adrNumber: "0001",
    title: `Architectural Evaluation: ${instructions.slice(0, 55)}...`,
    status: "Accepted",
    context: `This Architecture Decision Record captures the technical evaluation and design choice for: "${instructions}". Operational constraints provided: ${constraints || "Standard enterprise availability & performance limits"}.`,
    decisionDrivers: [
      "Maintainability and clear component boundaries",
      "System fault isolation and disaster recovery capability",
      "Developer productivity and deployment speed",
      "Operational simplicity and cost efficiency"
    ],
    consideredOptions: [
      {
        name: "Option A: Primary Recommended Architecture",
        description: "Modern modular design satisfying core requirements with low operational friction.",
        pros: [
          "High alignment with current team skills and existing infrastructure",
          "Low deployment complexity and straightforward monitoring"
        ],
        cons: [
          "May require secondary refactoring during 10x traffic scaling"
        ]
      },
      {
        name: "Option B: Alternative Distributed Approach",
        description: "Fully decoupled asynchronous worker pipeline.",
        pros: [
          "Independent scaling of high-load background workers",
          "Maximum fault isolation"
        ],
        cons: [
          "Increased infrastructure footprint and operational overhead"
        ]
      }
    ],
    chosenOption: "Option A (Primary Recommended Architecture)",
    consequences: {
      positive: [
        "Delivers fastest time-to-market while retaining modular boundaries",
        "Simplifies debugging and distributed tracing"
      ],
      negative: [
        "Requires monitoring memory utilization during peak traffic events"
      ]
    },
    mermaidDiagram: `graph TD\n    Client[Client Browser / API] --> Router[API Gateway / Ingress]\n    Router --> Service[Core Application Service]\n    Service --> DB[(Primary Database)]\n    Service --> Cache[(Redis Cache)]`,
    markdownContent: `# [ADR-0001] Architectural Evaluation: ${instructions.slice(0, 50)}...

## Status
**Accepted**

## Context
${instructions}

**Constraints & Forces:**
${constraints || "Standard production SLAs and maintainability requirements."}

## Decision Drivers
- Maintainability and clear component boundaries
- System fault isolation and disaster recovery capability
- Developer productivity and deployment speed
- Operational simplicity and cost efficiency

## Considered Options

### Option A: Primary Recommended Architecture
- **Pros:** High alignment with team skills, minimal overhead.
- **Cons:** Monolithic bottleneck if traffic scales 10x rapidly.

### Option B: Alternative Distributed Approach
- **Pros:** Excellent fault isolation and worker scaling.
- **Cons:** High operational friction and infrastructure cost.

## Decision Outcome
Chosen **Option A** for speed of execution and low operational complexity.

### Consequences
**Positive:** Fast delivery, clean codebase, low maintenance cost.
**Negative:** Requires capacity monitoring at peak loads.

## System Architecture Diagram
\`\`\`mermaid
graph TD
    Client[Client Browser / API] --> Router[API Gateway / Ingress]
    Router --> Service[Core Application Service]
    Service --> DB[(Primary Database)]
    Service --> Cache[(Redis Cache)]
\`\`\`
`
  };
}
