import openapiDiff from 'openapi-diff';
import { Lamatic } from 'lamatic';

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

function resolveParamRef(param: any, spec: any): any {
  if (param && typeof param === 'object' && typeof param.$ref === 'string') {
    const match = param.$ref.match(/^#\/components\/parameters\/(.+)$/);
    const resolved = match ? spec?.components?.parameters?.[match[1]] : undefined;
    return resolved || param;
  }
  return param;
}

function getEffectiveParams(pathItem: any, op: any, spec: any): any[] {
  const pathParams: any[] = Array.isArray(pathItem?.parameters) ? pathItem.parameters : [];
  const opParams: any[] = Array.isArray(op?.parameters) ? op.parameters : [];
  const map = new Map<string, any>();
  for (const raw of pathParams) {
    const p = resolveParamRef(raw, spec);
    if (p && p.name && p.in) {
      map.set(`${p.in}:${p.name}`, p);
    }
  }
  // Operation-level parameters are inserted second so they override
  // path-level parameters sharing the same name/in key.
  for (const raw of opParams) {
    const p = resolveParamRef(raw, spec);
    if (p && p.name && p.in) {
      map.set(`${p.in}:${p.name}`, p);
    }
  }
  return Array.from(map.values());
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

    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace']) {
      const v1Op = v1PathItem[method];
      const v2Op = v2PathItem[method];
      if (!v1Op || !v2Op) continue;

      const endpoint = `${method.toUpperCase()} ${pathKey}`;
      const v1Params = getEffectiveParams(v1PathItem, v1Op, v1Spec);
      const v2Params = getEffectiveParams(v2PathItem, v2Op, v2Spec);

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
        const validMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];
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

    if (code === 'response.body.scope.remove') {
      changeType = 'FIELD_ADDED';
      action = 'add';
    } else if (code === 'request.body.scope.add') {
      changeType = 'REQUIRED_FIELD_ADDED';
      action = 'add';
    } else if (code === 'request.body.scope.remove') {
      changeType = 'FIELD_REMOVED';
      action = 'remove';
    } else if (code.includes('type.change') || code.includes('parameter.type')) {
      changeType = 'TYPE_CHANGED';
      action = 'change';
    } else if (code.includes('remove') && !isBreaking) {
      changeType = 'FIELD_ADDED';
      action = 'add';
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

    const isRequest = code.startsWith('request');
    const targetScope = isRequest ? 'Request' : 'Response';
    let description = `Change detected under entity: ${change.entity || (isRequest ? 'request.body' : 'response.body')}`;
    if (action === 'remove') {
      description = `${targetScope} field '${field}' was removed from ${endpoint}`;
    } else if (action === 'add') {
      description = `${targetScope} field '${field}' was added to ${endpoint}`;
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

function getLamaticClient(): Lamatic | null {
  const apiKey = process.env.LAMATIC_API_KEY;
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const endpoint = process.env.LAMATIC_API_URL || 'https://api.lamatic.ai';

  if (!apiKey || !projectId) {
    return null;
  }

  return new Lamatic({ endpoint, projectId, apiKey });
}

const TERMINAL_FAILURE_STATUSES = new Set(['error', 'failed', 'cancelled']);

/**
 * Trigger the Lamatic workflow via the official SDK, which handles
 * request execution and polling internally.
 */
export async function triggerLamaticWorkflow(payload: any) {
  console.dir({ 'STAGE 4: OUTGOING_LAMATIC_PAYLOAD': payload }, { depth: null });

  const flowId = process.env.LAMATIC_DRIFT_FLOW_ID;
  const client = getLamaticClient();

  if (!flowId || !client) {
    throw new Error(
      'Missing Lamatic environment variables (LAMATIC_API_KEY, LAMATIC_PROJECT_ID, LAMATIC_DRIFT_FLOW_ID) in .env.local'
    );
  }

  const res = await client.executeFlow(flowId, payload);
  const flowResult = res as any;
  console.dir({ 'STAGE 5: RAW_LAMATIC_RESPONSE': flowResult }, { depth: null });

  if (TERMINAL_FAILURE_STATUSES.has(flowResult?.status) || flowResult?.statusCode >= 400) {
    throw new Error(`Lamatic flow error: ${flowResult?.message || JSON.stringify(flowResult)}`);
  }

  const analysisOutput =
    flowResult?.result?.answer?.output?.analysis ||
    flowResult?.result?.answer?.analysis ||
    flowResult?.result?.output?.analysis ||
    flowResult?.data?.output?.result?.analysis ||
    flowResult?.result?.answer ||
    flowResult?.result?.output ||
    flowResult?.output;

  if (!analysisOutput) {
    throw new Error(
      `No analysis returned from Lamatic flow. Raw response: ${JSON.stringify(flowResult).slice(0, 300)}`
    );
  }

  return analysisOutput;
}
