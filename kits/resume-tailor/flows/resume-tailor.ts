// Flow: resume-tailor

// -- Meta --
export const meta = {
  "name": "Resume Tailor",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "igan paul encila",
    "email": "iganpulencila01@gmail.com"
  }
};

// -- Inputs --
export const inputs = {};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
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
    "data": {}
  }
];

export const edges = [];

export default { meta, inputs, references, nodes, edges };
