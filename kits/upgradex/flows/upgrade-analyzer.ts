// Flow: upgrade-analyzer

// -- Meta --
export const meta = {
  "name": "upgrade-analyzer",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "",
    "email": "mudgalsagar42@gmail.com"
  }
};

// -- Inputs --
export const inputs = {};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "upgrade_analyzer_code_node_605_code": "@scripts/upgrade-analyzer_code-node-605_code.ts",
    "upgrade_analyzer_code_node_177_code": "@scripts/upgrade-analyzer_code-node-177_code.ts",
    "upgrade_analyzer_code_node_737_code": "@scripts/upgrade-analyzer_code-node-737_code.ts",
    "upgrade_analyzer_code_node_196_code": "@scripts/upgrade-analyzer_code-node-196_code.ts",
    "upgrade_analyzer_code_node_369_code": "@scripts/upgrade-analyzer_code-node-369_code.ts",
    "upgrade_analyzer_code_node_311_code": "@scripts/upgrade-analyzer_code-node-311_code.ts",
    "upgrade_analyzer_code_node_276_code": "@scripts/upgrade-analyzer_code-node-276_code.ts",
    "upgrade_analyzer_code_node_354_code": "@scripts/upgrade-analyzer_code-node-354_code.ts",
    "upgrade_analyzer_code_node_265_code": "@scripts/upgrade-analyzer_code-node-265_code.ts",
    "upgrade_analyzer_code_node_934_code": "@scripts/upgrade-analyzer_code-node-934_code.ts",
    "upgrade_analyzer_code_node_923_code": "@scripts/upgrade-analyzer_code-node-923_code.ts",
    "upgrade_analyzer_code_node_997_code": "@scripts/upgrade-analyzer_code-node-997_code.ts",
    "upgrade_analyzer_code_node_763_code": "@scripts/upgrade-analyzer_code-node-763_code.ts",
    "upgrade_analyzer_code_node_807_code": "@scripts/upgrade-analyzer_code-node-807_code.ts",
    "upgrade_analyzer_code_node_418_code": "@scripts/upgrade-analyzer_code-node-418_code.ts",
    "upgrade_analyzer_code_node_998_code": "@scripts/upgrade-analyzer_code-node-998_code.ts",
    "upgrade_analyzer_code_node_444_code": "@scripts/upgrade-analyzer_code-node-444_code.ts",
    "upgrade_analyzer_code_node_342_code": "@scripts/upgrade-analyzer_code-node-342_code.ts",
    "upgrade_analyzer_code_node_872_code": "@scripts/upgrade-analyzer_code-node-872_code.ts",
    "upgrade_analyzer_code_node_207_code": "@scripts/upgrade-analyzer_code-node-207_code.ts",
    "upgrade_analyzer_code_node_490_code": "@scripts/upgrade-analyzer_code-node-490_code.ts",
    "upgrade_analyzer_code_node_948_code": "@scripts/upgrade-analyzer_code-node-948_code.ts",
    "upgrade_analyzer_code_node_738_code": "@scripts/upgrade-analyzer_code-node-738_code.ts",
    "upgrade_analyzer_code_node_347_code": "@scripts/upgrade-analyzer_code-node-347_code.ts",
    "upgrade_analyzer_code_node_141_code": "@scripts/upgrade-analyzer_code-node-141_code.ts",
    "upgrade_analyzer_code_node_560_code": "@scripts/upgrade-analyzer_code-node-560_code.ts",
    "upgrade_analyzer_code_node_508_code": "@scripts/upgrade-analyzer_code-node-508_code.ts",
    "upgrade_analyzer_code_node_251_code": "@scripts/upgrade-analyzer_code-node-251_code.ts",
    "upgrade_analyzer_code_node_971_code": "@scripts/upgrade-analyzer_code-node-971_code.ts",
    "upgrade_analyzer_code_node_119_code": "@scripts/upgrade-analyzer_code-node-119_code.ts",
    "upgrade_analyzer_code_node_754_code": "@scripts/upgrade-analyzer_code-node-754_code.ts",
    "upgrade_analyzer_code_node_885_code": "@scripts/upgrade-analyzer_code-node-885_code.ts"
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
        "advance_schema": "{\n  \"repoUrl\": \"string\",\n  \"dependency\": \"string\",\n  \"targetVersion\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_605",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-605_code.ts",
        "nodeName": "Code1"
      }
    }
  },
  {
    "id": "apiNode_594",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_594",
        "url": "https://api.github.com/repos/{{codeNode_605.output.repoPath}}",
        "body": "",
        "method": "GET",
        "headers": "",
        "retries": "0",
        "nodeName": "API 1",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "codeNode_177",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-177_code.ts",
        "nodeName": "Code 3"
      }
    }
  },
  {
    "id": "apiNode_154",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_154",
        "url": "{{codeNode_177.output}}",
        "body": "",
        "method": "GET",
        "headers": "",
        "retries": "0",
        "nodeName": "API 3",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "codeNode_737",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-737_code.ts",
        "nodeName": "Code 4 find repo file"
      }
    }
  },
  {
    "id": "codeNode_196",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-196_code.ts",
        "nodeName": "Code 5 select manifest"
      }
    }
  },
  {
    "id": "apiNode_792",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_792",
        "url": "{{codeNode_196.output.firstManifestUrl}}",
        "body": "",
        "method": "GET",
        "headers": "",
        "retries": "0",
        "nodeName": "API 4",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "codeNode_369",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-369_code.ts",
        "nodeName": "Code 6 extract dependency"
      }
    }
  },
  {
    "id": "codeNode_311",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-311_code.ts",
        "nodeName": "Code 7 compare version"
      }
    }
  },
  {
    "id": "codeNode_276",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-276_code.ts",
        "nodeName": "Code 8 initial risk classification"
      }
    }
  },
  {
    "id": "codeNode_354",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-354_code.ts",
        "nodeName": "Code 9 build source search"
      }
    }
  },
  {
    "id": "codeNode_265",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-265_code.ts",
        "nodeName": "Code10 filter relevant source"
      }
    }
  },
  {
    "id": "codeNode_934",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-934_code.ts",
        "nodeName": "Code11 build loop path "
      }
    }
  },
  {
    "id": "forLoopNode_178",
    "type": "forLoopNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopNode",
      "values": {
        "id": "forLoopNode_178",
        "wait": 0,
        "endValue": "10",
        "nodeName": "Loop",
        "increment": "1",
        "connectedTo": "forLoopEndNode_823",
        "iterateOver": "list",
        "iteratorValue": "{{codeNode_934.output}}"
      }
    }
  },
  {
    "id": "codeNode_923",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-923_code.ts",
        "nodeName": "Code 13 get current url"
      }
    }
  },
  {
    "id": "apiNode_289",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_289",
        "url": "{{codeNode_923.output}}",
        "body": "",
        "method": "GET",
        "headers": "",
        "retries": "0",
        "nodeName": "API 6 fetch source file",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "codeNode_997",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-997_code.ts",
        "nodeName": "Code14 detect dependency usage"
      }
    }
  },
  {
    "id": "forLoopEndNode_823",
    "type": "forLoopEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopEndNode",
      "values": {
        "nodeName": "Loop End",
        "connectedTo": "forLoopNode_178"
      }
    }
  },
  {
    "id": "codeNode_763",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-763_code.ts",
        "nodeName": "Code15 collect affected file"
      }
    }
  },
  {
    "id": "codeNode_807",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-807_code.ts",
        "nodeName": "Code16 npm registry"
      }
    }
  },
  {
    "id": "apiNode_733",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_733",
        "url": "{{codeNode_807.output}}",
        "body": "",
        "method": "GET",
        "headers": "",
        "retries": "0",
        "nodeName": "API 7 npm metadata",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "codeNode_418",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-418_code.ts",
        "nodeName": "Code17 extract package repo"
      }
    }
  },
  {
    "id": "codeNode_998",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-998_code.ts",
        "nodeName": "Code18 Build Changelog URL"
      }
    }
  },
  {
    "id": "codeNode_444",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-444_code.ts",
        "nodeName": "Code19 build release api"
      }
    }
  },
  {
    "id": "apiNode_604",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_604",
        "url": "{{codeNode_444.output.releaseUrl}}",
        "body": "",
        "method": "GET",
        "headers": "",
        "retries": "0",
        "nodeName": "API 8 fetch release meta",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "codeNode_342",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-342_code.ts",
        "nodeName": "Code20 extract release note"
      }
    }
  },
  {
    "id": "codeNode_872",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-872_code.ts",
        "nodeName": "Code21 parse release change"
      }
    }
  },
  {
    "id": "codeNode_207",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-207_code.ts",
        "nodeName": "Code22 filter breaking changes"
      }
    }
  },
  {
    "id": "codeNode_490",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-490_code.ts",
        "nodeName": "Code23 deduplicate breaking change"
      }
    }
  },
  {
    "id": "codeNode_948",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-948_code.ts",
        "nodeName": "Code24 remove reverted change"
      }
    }
  },
  {
    "id": "codeNode_738",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-738_code.ts",
        "nodeName": "Code25 build compatibility evidence"
      }
    }
  },
  {
    "id": "codeNode_347",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-347_code.ts",
        "nodeName": "Code26 build breaking change keyword"
      }
    }
  },
  {
    "id": "codeNode_141",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-141_code.ts",
        "nodeName": "Code27 extract source usage evidence "
      }
    }
  },
  {
    "id": "codeNode_560",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-560_code.ts",
        "nodeName": "Code28 build analysis context"
      }
    }
  },
  {
    "id": "codeNode_508",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-508_code.ts",
        "nodeName": "Code29 Deterministic  compatibility analysis"
      }
    }
  },
  {
    "id": "codeNode_251",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-251_code.ts",
        "nodeName": "Code30 final  risk"
      }
    }
  },
  {
    "id": "codeNode_971",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-971_code.ts",
        "nodeName": "Code31 build upgrade plan"
      }
    }
  },
  {
    "id": "codeNode_119",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-119_code.ts",
        "nodeName": "Code32 build validation pplan"
      }
    }
  },
  {
    "id": "codeNode_754",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-754_code.ts",
        "nodeName": "Code33 build rollback plan"
      }
    }
  },
  {
    "id": "codeNode_885",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/upgrade-analyzer_code-node-885_code.ts",
        "nodeName": "Code34 final result "
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
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_605",
    "source": "triggerNode_1",
    "target": "codeNode_605",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_605-apiNode_594",
    "source": "codeNode_605",
    "target": "apiNode_594",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_594-codeNode_177",
    "source": "apiNode_594",
    "target": "codeNode_177",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_177-apiNode_154",
    "source": "codeNode_177",
    "target": "apiNode_154",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_154-codeNode_737",
    "source": "apiNode_154",
    "target": "codeNode_737",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_737-codeNode_196",
    "source": "codeNode_737",
    "target": "codeNode_196",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_792-codeNode_369",
    "source": "apiNode_792",
    "target": "codeNode_369",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_369-codeNode_311",
    "source": "codeNode_369",
    "target": "codeNode_311",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_311-codeNode_276",
    "source": "codeNode_311",
    "target": "codeNode_276",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_276-codeNode_354",
    "source": "codeNode_276",
    "target": "codeNode_354",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_354-codeNode_265",
    "source": "codeNode_354",
    "target": "codeNode_265",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_196-apiNode_792-218",
    "source": "codeNode_196",
    "target": "apiNode_792",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_265-codeNode_934",
    "source": "codeNode_265",
    "target": "codeNode_934",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_934-forLoopNode_178",
    "source": "codeNode_934",
    "target": "forLoopNode_178",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "forLoopNode_178-plus-node-addNode_751953-483",
    "source": "forLoopNode_178",
    "target": "codeNode_923",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "codeNode_923-apiNode_289",
    "source": "codeNode_923",
    "target": "apiNode_289",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "forLoopEndNode_823-codeNode_763",
    "source": "forLoopEndNode_823",
    "target": "codeNode_763",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_763-codeNode_807",
    "source": "codeNode_763",
    "target": "codeNode_807",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_807-apiNode_733",
    "source": "codeNode_807",
    "target": "apiNode_733",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_733-codeNode_418",
    "source": "apiNode_733",
    "target": "codeNode_418",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_418-codeNode_998",
    "source": "codeNode_418",
    "target": "codeNode_998",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_998-codeNode_444",
    "source": "codeNode_998",
    "target": "codeNode_444",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_444-apiNode_604",
    "source": "codeNode_444",
    "target": "apiNode_604",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_604-codeNode_342",
    "source": "apiNode_604",
    "target": "codeNode_342",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_342-codeNode_872",
    "source": "codeNode_342",
    "target": "codeNode_872",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_872-codeNode_207",
    "source": "codeNode_872",
    "target": "codeNode_207",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_207-codeNode_490",
    "source": "codeNode_207",
    "target": "codeNode_490",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_490-codeNode_948",
    "source": "codeNode_490",
    "target": "codeNode_948",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_948-codeNode_738",
    "source": "codeNode_948",
    "target": "codeNode_738",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_738-codeNode_347",
    "source": "codeNode_738",
    "target": "codeNode_347",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_347-codeNode_141",
    "source": "codeNode_347",
    "target": "codeNode_141",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_141-codeNode_560",
    "source": "codeNode_141",
    "target": "codeNode_560",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_560-codeNode_508",
    "source": "codeNode_560",
    "target": "codeNode_508",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_508-codeNode_251",
    "source": "codeNode_508",
    "target": "codeNode_251",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_251-codeNode_971",
    "source": "codeNode_251",
    "target": "codeNode_971",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_971-codeNode_119",
    "source": "codeNode_971",
    "target": "codeNode_119",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_119-codeNode_754",
    "source": "codeNode_119",
    "target": "codeNode_754",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_754-codeNode_885",
    "source": "codeNode_754",
    "target": "codeNode_885",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_885-responseNode_triggerNode_1",
    "source": "codeNode_885",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_289-codeNode_997",
    "source": "apiNode_289",
    "target": "codeNode_997",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_997-forLoopEndNode_823",
    "source": "codeNode_997",
    "target": "forLoopEndNode_823",
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
  },
  {
    "id": "forLoopNode_178-forLoopEndNode_823-595",
    "source": "forLoopNode_178",
    "target": "forLoopEndNode_823",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "loopEdge"
  },
  {
    "id": "forLoopEndNode_823-forLoopNode_178-253",
    "source": "forLoopEndNode_823",
    "target": "forLoopNode_178",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "loopEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
