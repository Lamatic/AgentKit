import { getDeploymentId } from '../shared/lib/deployment-id';
const deploymentId = getDeploymentId();
globalThis.NEXT_DEPLOYMENT_ID = deploymentId;

//# sourceMappingURL=register-deployment-id-global.js.map