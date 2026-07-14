/*
 * # IssuePilot Planning Flow
 *
 * ## Purpose
 *
 * Transform a GitHub issue into an implementation-ready engineering plan with technical leadership insights for sprint planning.
 *
 * The flow analyzes an issue, identifies requirements, recommends an implementation strategy,
 * reviews the generated plan, and produces a structured output for engineering teams.
 *
 * ## When To Use
 *
 * - Planning a new GitHub issue
 * - Preparing work before sprint planning
 * - Breaking down engineering tasks
 * - Identifying implementation risks
 *
 * ## When Not To Use
 *
 * - Code generation
 * - Code review
 * - Repository onboarding
 * - Architecture design for entire systems
 *
 * ## Inputs
 *
 * issue_title
 * issue_description
 * labels (optional)
 * tech_stack (optional)
 * repository_context (optional)
 *
 * ## Outputs
 *
 * Structured planning report conforming to planning-output.schema.json
 */

// Flow: github-issue-planning-agent


// ─────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────

export const meta = {
    name: "IssuePilot Planning Flow",
    description:
        "Transforms GitHub issues into structured engineering implementation plans with technical leadership insights.",
    tags: [
        "github",
        "planning",
        "engineering",
        "technical-lead",
        "sprint-planning",
        "ai-agent"
    ],
    testInput: {
        issue_title: "Add Google OAuth Login",
        issue_description:
            "Implement Google OAuth authentication for users.",
        labels: ["feature"],
        tech_stack: "React, FastAPI, MySQL"
    }
};

// ─────────────────────────────────────────────
// Inputs
// ─────────────────────────────────────────────

export const inputs = {
    InstructorLLMNode_Planning: [
        {
            name: "generativeModelName",
            label: "Generative Model Name",
            type: "model",
            mode: "instructor",
            description: "Model used by the Planning Agent.",
            modelType: "generator/text",
            required: true,
            isPrivate: true,
            defaultValue: [
                {
                    configName: "configA",
                    type: "generator/text",
                    provider_name: "",
                    credential_name: "",
                    params: {}
                }
            ],
            typeOptions: {
                loadOptionsMethod: "listModels"
            }
        }
    ],

    InstructorLLMNode_Review: [
        {
            name: "generativeModelName",
            label: "Generative Model Name",
            type: "model",
            mode: "instructor",
            description: "Model used by the Review Agent.",
            modelType: "generator/text",
            required: true,
            isPrivate: true,
            defaultValue: [
                {
                    configName: "configA",
                    type: "generator/text",
                    provider_name: "",
                    credential_name: "",
                    params: {}
                }
            ],
            typeOptions: {
                loadOptionsMethod: "listModels"
            }
        }
    ],

    InstructorLLMNode_Formatter: [
        {
            name: "generativeModelName",
            label: "Generative Model Name",
            type: "model",
            mode: "instructor",
            description: "Model used by the Formatter.",
            modelType: "generator/text",
            required: true,
            isPrivate: true,
            defaultValue: [
                {
                    configName: "configA",
                    type: "generator/text",
                    provider_name: "",
                    credential_name: "",
                    params: {}
                }
            ],
            typeOptions: {
                loadOptionsMethod: "listModels"
            }
        }
    ]
};



// ─────────────────────────────────────────────
// References
// ─────────────────────────────────────────────

export const references = {
    constitutions: {
        engineering: "@constitutions/engineering.md"
    },

    prompts: {
        planning: "@prompts/planning-agent.v1.md",
        review: "@prompts/review-agent.v1.md",
        formatter: "@prompts/formatter.v1.md"
    },

    modelConfigs: {
        planning: "@model-configs/planning.ts",
        review: "@model-configs/review.ts",
        formatter: "@model-configs/formatter.ts"
    }
};




// ───
// Nodes
// ───

export const nodes = [
    {
        id: "planning",
        type: "InstructorLLMNode",
        name: "Planning Agent",
        config: "@model-configs/planning.ts"
    },
    {
        id: "review",
        type: "InstructorLLMNode",
        name: "Engineering Review",
        config: "@model-configs/review.ts"
    },
    {
        id: "formatter",
        type: "InstructorLLMNode",
        name: "Markdown Formatter",
        config: "@model-configs/formatter.ts"
    }
];

// ───
// Edges
// ───

export const edges = [
    {
        source: "planning",
        target: "review"
    },
    {
        source: "review",
        target: "formatter"
    }
];