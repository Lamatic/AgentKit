import openapiDiff from 'openapi-diff';
import axios from 'axios';

export interface SemanticChange {
  endpoint: string;
  code: string;
  field: string;
  action: string;
  changeType: string;
  affectedField: string;
  severity: string;
  before: string;
  after: string;
  description: string;
  isBreaking: boolean;
}

export interface NormalizedPayload {
  allChanges: SemanticChange[];
  breakingChanges: SemanticChange[];
  nonBreakingChanges: SemanticChange[];
  totalBreaking: number;
  totalNonBreaking: number;
  calculatedRisk: 'HIGH' | 'LOW';
}

export async function runOpenApiDiff(specA: any, specB: any) {
  const contentA = typeof specA === 'string' ? specA : JSON.stringify(specA);
  const contentB = typeof specB === 'string' ? specB : JSON.stringify(specB);

  const result = await openapiDiff.diffSpecs({
    sourceSpec: {
      content: contentA,
      location: 'specA',
      format: 'openapi3',
    },
    destinationSpec: {
      content: contentB,
      location: 'specB',
      format: 'openapi3',
    },
  });

  return result;
}

export function detectParameterTypeChanges(specA: any, specB: any): SemanticChange[] {
  const changes: SemanticChange[] = [];
  const parseObj = (s: any) => {
    if (!s) return {};
    if (typeof s === 'string') {
      try {
        return JSON.parse(s);
      } catch {
        return {};
      }
    }
    return s;
  };
  const v1Spec = parseObj(specA);
  const v2Spec = parseObj(specB);

  const v1Paths = v1Spec?.paths || {};
  const v2Paths = v2Spec?.paths || {};

  for (const [pathKey, v1PathItem] of Object.entries(v1Paths) as [string, any][]) {
    const v2PathItem = v2Paths[pathKey];
    if (!v2PathItem) continue;

    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const v1Op = v1PathItem[method];
      const v2Op = v2PathItem[method];
      if (!v1Op || !v2Op) continue;

      const endpoint = `${method.toUpperCase()} ${pathKey}`;
      const v1Params = v1Op.parameters || [];
      const v2Params = v2Op.parameters || [];

      for (const v1Param of v1Params) {
        const v2Param = v2Params.find((p: any) => p.name === v1Param.name && p.in === v1Param.in);
        if (!v2Param) continue;

        const v1Type = v1Param.schema?.type;
        const v2Type = v2Param.schema?.type;

        if (v1Type && v2Type && v1Type !== v2Type) {
          changes.push({
            endpoint,
            code: 'request.parameter.type.change',
            field: v1Param.name,
            action: 'change',
            changeType: 'TYPE_CHANGED',
            affectedField: v1Param.name,
            severity: 'CRITICAL',
            before: String(v1Type),
            after: String(v2Type),
            description: `Parameter '${v1Param.name}' type changed from '${v1Type}' to '${v2Type}' on ${endpoint}`,
            isBreaking: true,
          });
        }
      }
    }
  }

  return changes;
}

export function normalizeDiff(diffResult: any, specA?: any, specB?: any): NormalizedPayload {
  const parseItem = (change: any, isBreaking: boolean): SemanticChange[] => {
    const srcLoc = change.sourceSpecEntityDetails?.[0]?.location || '';
    const destLoc = change.destinationSpecEntityDetails?.[0]?.location || '';
    const loc = srcLoc || destLoc;

    const endpointMatch = loc.match(/paths\.(\/[^.]+)\.([a-z]+)/i);
    let endpoint = 'API Contract';
    if (endpointMatch) {
      endpoint = `${endpointMatch[2].toUpperCase()} ${endpointMatch[1]}`;
    } else if (change.entity) {
      endpoint = change.entity;
    } else if (Array.isArray(change.entityPath) && change.entityPath.length > 0) {
      const pathsIdx = change.entityPath.indexOf('paths');
      if (pathsIdx !== -1 && change.entityPath[pathsIdx + 1]) {
        const route = change.entityPath[pathsIdx + 1];
        const rawMethod = change.entityPath[pathsIdx + 2];
        const validMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
        if (rawMethod && validMethods.includes(String(rawMethod).toLowerCase())) {
          endpoint = `${String(rawMethod).toUpperCase()} ${route}`;
        } else {
          endpoint = route;
        }
      }
    }

    const code = change.code || 'schema.change';
    const anyOfBranches = change.details?.differenceSchema?.anyOf;

    // Pattern: response.body.scope.add
    if (code === 'response.body.scope.add' && Array.isArray(anyOfBranches)) {
      const removedFields = new Set<string>();
      for (const branch of anyOfBranches) {
        if (Array.isArray(branch.required)) {
          for (const fieldName of branch.required) {
            removedFields.add(fieldName);
          }
        }
      }

      if (removedFields.size > 0) {
        return Array.from(removedFields).map((fieldName) => ({
          endpoint,
          code: 'response.body.scope.remove',
          field: fieldName,
          action: 'remove',
          changeType: 'FIELD_REMOVED',
          affectedField: fieldName,
          severity: isBreaking ? 'CRITICAL' : 'INFO',
          before: '—',
          after: '—',
          description: `Response field '${fieldName}' was removed from ${endpoint}`,
          isBreaking,
        }));
      }
    }

    let action = change.action || 'change';
    let changeType = 'SCHEMA_MODIFIED';
    let field = 'unknown';

    if (code === 'response.body.scope.remove' || (code.includes('remove') && !isBreaking)) {
      changeType = 'FIELD_ADDED';
      action = 'add';
    } else if (code.includes('type.change') || code.includes('parameter.type')) {
      changeType = 'TYPE_CHANGED';
      action = 'change';
    } else if (code.includes('remove') || code.includes('scope.add')) {
      changeType = 'FIELD_REMOVED';
      action = 'remove';
    } else if (code.includes('add') && isBreaking) {
      changeType = 'REQUIRED_FIELD_ADDED';
      action = 'add';
    } else if (code.includes('add')) {
      changeType = 'FIELD_ADDED';
      action = 'add';
    }

    const props = change.details?.differenceSchema?.properties;
    if (props && Object.keys(props).length > 0) {
      field = Object.keys(props).join(', ');
    } else if (change.entity) {
      const parts = change.entity.split('.');
      field = parts[parts.length - 1];
    } else if (Array.isArray(change.entityPath) && change.entityPath.length > 0) {
      field = change.entityPath[change.entityPath.length - 1];
    }

    const extractTypeValue = (entity: any): string => {
      if (entity && typeof entity === 'object' && entity.type) {
        return String(entity.type);
      }
      return '—';
    };

    const before = extractTypeValue(change.sourceSpecEntity);
    const after = extractTypeValue(change.destinationSpecEntity);

    let description = `Change detected under entity: ${change.entity || 'response.body'}`;
    if (action === 'remove') {
      description = `Response field '${field}' was removed from ${endpoint}`;
    } else if (action === 'add') {
      description = `Response field '${field}' was added to ${endpoint}`;
    } else if (action === 'change') {
      description = `Field '${field}' changed on ${endpoint}`;
    }

    return [
      {
        endpoint,
        code,
        field,
        action,
        changeType,
        affectedField: field,
        severity: isBreaking ? 'CRITICAL' : 'INFO',
        before,
        after,
        description,
        isBreaking,
      },
    ];
  };

  const changes: SemanticChange[] = [];

  if (Array.isArray(diffResult?.breakingDifferences)) {
    diffResult.breakingDifferences.forEach((d: any) => {
      changes.push(...parseItem(d, true));
    });
  }

  if (Array.isArray(diffResult?.nonBreakingDifferences)) {
    diffResult.nonBreakingDifferences.forEach((d: any) => {
      changes.push(...parseItem(d, false));
    });
  }

  if (specA && specB) {
    const paramChanges = detectParameterTypeChanges(specA, specB);
    for (const pc of paramChanges) {
      const exists = changes.some(
        (c) => c.endpoint === pc.endpoint && c.field === pc.field && c.code === pc.code
      );
      if (!exists) {
        changes.push(pc);
      }
    }
  }

  const breaking = changes.filter((c) => c.isBreaking);
  const nonBreaking = changes.filter((c) => !c.isBreaking);

  return {
    allChanges: changes,
    breakingChanges: breaking,
    nonBreakingChanges: nonBreaking,
    totalBreaking: breaking.length,
    totalNonBreaking: nonBreaking.length,
    calculatedRisk: breaking.length > 0 ? 'HIGH' : 'LOW',
  };
}

/**
 * Trigger Lamatic Workflow with environment variable checks
 */
export async function triggerLamaticWorkflow(payload: any) {
  console.dir({ 'STAGE 4: OUTGOING_LAMATIC_PAYLOAD': payload }, { depth: null });

  const apiUrl = process.env.LAMATIC_API_URL;
  const apiKey = process.env.LAMATIC_API_KEY;
  const flowId = process.env.LAMATIC_DRIFT_FLOW_ID;
  const projectId = process.env.LAMATIC_PROJECT_ID;

  if (!apiUrl || !apiKey || !flowId) {
    throw new Error("Missing Lamatic environment variables in .env.local");
  }

  try {
    const res = await fetch(`${apiUrl}/flow/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...(projectId ? { 'x-project-id': projectId } : {})
      },
      body: JSON.stringify({
        flow_id: flowId,
        input: payload,
      }),
    });

    if (res.ok) {
      const responseData = await res.json();
      console.dir({ 'STAGE 5: RAW_LAMATIC_RESPONSE': responseData }, { depth: null });
      return responseData.data || responseData;
    }
  } catch (e) {
    // Fallback to GraphQL
  }

  const executeQuery = `
    query ExecuteWorkflow($workflowId: String!, $sampleInput: String) {
      executeWorkflow(
        workflowId: $workflowId
        payload: {
          sampleInput: $sampleInput
        }
      ) {
        status
        result
      }
    }
  `;

  const statusQuery = `
    query CheckStatus($requestId: String!) {
      checkStatus(requestId: $requestId)
    }
  `;

  const response = await axios({
    method: 'POST',
    url: apiUrl,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'x-project-id': projectId || ''
    },
    data: {
      query: executeQuery,
      variables: {
        workflowId: flowId,
        sampleInput: typeof payload === 'string' ? payload : (payload?.sampleInput || JSON.stringify(payload))
      }
    }
  });

  const requestId = response.data?.data?.executeWorkflow?.result?.requestId;
  if (!requestId) {
    throw new Error(`Execute workflow failed: ${JSON.stringify(response.data)}`);
  }

  let completed = false;
  let attempts = 0;

  while (!completed && attempts < 20) {
    attempts++;
    await new Promise(res => setTimeout(res, 3000));

    const statusResponse = await axios({
      method: 'POST',
      url: apiUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-project-id': projectId || ''
      },
      data: {
        query: statusQuery,
        variables: { requestId }
      }
    });

    const rawResult = statusResponse.data?.data?.checkStatus;
    const parsedData = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
    console.dir({ 'STAGE 5: RAW_LAMATIC_RESPONSE': parsedData }, { depth: null });
    const analysisOutput = parsedData?.data?.output?.result?.analysis;

    if (parsedData?.status === 'success' && analysisOutput) {
      return analysisOutput;
    } else if (parsedData?.status === 'success' && parsedData?.data?.output) {
      return parsedData.data.output;
    } else if (parsedData?.status === 'error') {
      throw new Error(`Workflow execution error: ${JSON.stringify(parsedData)}`);
    }
  }

  throw new Error(`Workflow execution timed out after ${attempts} polling attempts`);
}
