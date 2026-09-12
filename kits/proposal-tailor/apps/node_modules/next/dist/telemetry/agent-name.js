"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getAgentName", {
    enumerable: true,
    get: function() {
        return getAgentName;
    }
});
const _detectagent = require("next/dist/compiled/@vercel/detect-agent");
let agentNamePromise;
function getAgentName() {
    if (!agentNamePromise) {
        agentNamePromise = (0, _detectagent.determineAgent)().then((result)=>result.isAgent ? result.agent.name : null).catch(()=>null);
    }
    return agentNamePromise;
}

//# sourceMappingURL=agent-name.js.map