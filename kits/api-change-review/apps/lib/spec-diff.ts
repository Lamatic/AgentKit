// Deterministic OpenAPI 3.x diff. No dependencies, no LLM.
// Ported from the Lamatic Code Node — kept dependency-free so it runs
// identically in the browser, in a Node script, and in a Lamatic code node.
//
// Emits neutral change FACTS. Severity is decided downstream by the flow.

export type ChangeFact = {
  id: string;
  kind: string;
  location: string;
  before: unknown;
  after: unknown;
  requiredNow?: boolean;
};

export type DiffResult = {
  oldVersion: string | null;
  newVersion: string | null;
  totalChanges: number;
  hasChanges: boolean;
  byKind: Record<string, number>;
  endpointsTouched: string[];
  changes: ChangeFact[];
};

export function diffSpecs(oldSpec: any, newSpec: any): DiffResult {

  const METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options', 'trace'];
  const MAX_DEPTH = 6;
  const changes: ChangeFact[] = [];
  let seq = 0;

  function add(kind: any, location: any, before: any, after: any, extra?: any) {
    changes.push(Object.assign({
      id: 'c' + (++seq),
      kind: kind,
      location: location,
      before: before === undefined ? null : before,
      after: after === undefined ? null : after
    }, extra || {}));
  }

  // ---------- $ref resolution ----------
  function deref(spec: any, node: any, guard?: any) {
    guard = guard || 0;
    if (!node || typeof node !== 'object' || !node.$ref || guard > 20) return node;
    const ref = node.$ref;
    if (ref.indexOf('#/') !== 0) return node; // external refs not followed
    let cur = spec;
    const parts = ref.slice(2).split('/');
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i].replace(/~1/g, '/').replace(/~0/g, '~');
      if (!cur || typeof cur !== 'object') return node;
      cur = cur[key];
    }
    return deref(spec, cur, guard + 1);
  }

  // ---------- flatten a schema into dot-path leaves ----------
  function flatten(spec: any, schema: any, prefix: any, depth: any, acc: any, required: any) {
    schema = deref(spec, schema);
    if (!schema || typeof schema !== 'object' || depth > MAX_DEPTH) return acc;

    if (Array.isArray(schema.allOf)) {
      schema.allOf.forEach(function (s: any) { flatten(spec, s, prefix, depth + 1, acc, required); });
    }
    const variant = schema.oneOf || schema.anyOf;
    if (Array.isArray(variant)) {
      variant.forEach(function (s: any, i: any) { flatten(spec, s, prefix, depth + 1, acc, false); });
    }

    if (schema.type === 'array' && schema.items) {
      return flatten(spec, schema.items, prefix + '[]', depth + 1, acc, required);
    }

    if (schema.properties) {
      const req = Array.isArray(schema.required) ? schema.required : [];
      Object.keys(schema.properties).forEach(function (name: any) {
        const child = deref(spec, schema.properties[name]);
        const path = prefix ? prefix + '.' + name : name;
        acc[path] = {
          type: child && child.type ? child.type : (child && (child.oneOf || child.anyOf) ? 'union' : 'unknown'),
          format: child && child.format ? child.format : null,
          required: req.indexOf(name) !== -1,
          nullable: !!(child && (child.nullable === true || (Array.isArray(child.type) && child.type.indexOf('null') !== -1))),
          enum: child && Array.isArray(child.enum) ? child.enum.slice() : null,
          deprecated: !!(child && child.deprecated)
        };
        flatten(spec, child, path, depth + 1, acc, req.indexOf(name) !== -1);
      });
    }
    return acc;
  }

  function schemaOf(spec: any, holder: any) {
    holder = deref(spec, holder);
    if (!holder || !holder.content) return null;
    const keys = Object.keys(holder.content);
    if (!keys.length) return null;
    const json = keys.filter(function (k: any) { return k.indexOf('json') !== -1; })[0] || keys[0];
    const media = holder.content[json];
    return media ? media.schema : null;
  }

  // ---------- compare two flattened property maps ----------
  function diffProps(oldMap: any, newMap: any, where: any, direction: any) {
    // direction: 'request' (client sends) or 'response' (client reads)
    Object.keys(oldMap).forEach(function (p: any) {
      const a = oldMap[p], b = newMap[p];
      if (!b) {
        add(direction === 'response' ? 'response.property.removed' : 'request.property.removed',
          where + ' :: ' + p, a, null);
        return;
      }
      if (a.type !== b.type) {
        add(direction === 'response' ? 'response.property.type.changed' : 'request.property.type.changed',
          where + ' :: ' + p, a.type, b.type);
      }
      if (a.format !== b.format) {
        add('property.format.changed', where + ' :: ' + p, a.format, b.format);
      }
      if (!a.required && b.required && direction === 'request') {
        add('request.property.required.added', where + ' :: ' + p, false, true);
      }
      if (a.required && !b.required && direction === 'response') {
        add('response.property.required.removed', where + ' :: ' + p, true, false);
      }
      if (a.enum && b.enum) {
        const removed = a.enum.filter(function (v: any) { return b.enum.indexOf(v) === -1; });
        const added = b.enum.filter(function (v: any) { return a.enum.indexOf(v) === -1; });
        if (removed.length) add('enum.values.removed', where + ' :: ' + p, removed, null);
        if (added.length) add('enum.values.added', where + ' :: ' + p, null, added);
      }
      if (!a.deprecated && b.deprecated) add('property.deprecated', where + ' :: ' + p, false, true);
    });
    Object.keys(newMap).forEach(function (p: any) {
      if (!oldMap[p]) {
        add(direction === 'response' ? 'response.property.added' : 'request.property.added',
          where + ' :: ' + p, null, newMap[p], { requiredNow: !!newMap[p].required });
      }
    });
  }

  // ---------- parameters ----------
  function paramMap(spec: any, list: any) {
    const map: Record<string, any> = {};
    (list || []).forEach(function (raw: any) {
      const p = deref(spec, raw);
      if (!p || !p.name) return;
      const s = deref(spec, p.schema) || {};
      map[(p.in || 'query') + ':' + p.name] = {
        in: p.in, name: p.name, required: !!p.required,
        type: s.type || 'unknown',
        enum: Array.isArray(s.enum) ? s.enum.slice() : null
      };
    });
    return map;
  }

  function diffParams(oldP: any, newP: any, where: any) {
    Object.keys(oldP).forEach(function (k: any) {
      const a = oldP[k], b = newP[k];
      if (!b) { add('param.removed', where + ' :: ' + k, a, null); return; }
      if (a.type !== b.type) add('param.type.changed', where + ' :: ' + k, a.type, b.type);
      if (!a.required && b.required) add('param.required.added', where + ' :: ' + k, false, true);
      if (a.enum && b.enum) {
        const removed = a.enum.filter(function (v: any) { return b.enum.indexOf(v) === -1; });
        if (removed.length) add('param.enum.values.removed', where + ' :: ' + k, removed, null);
      }
    });
    Object.keys(newP).forEach(function (k: any) {
      if (!oldP[k]) add('param.added', where + ' :: ' + k, null, newP[k], { requiredNow: newP[k].required });
    });
  }

  // ---------- walk the spec ----------
  const oldPaths = (oldSpec && oldSpec.paths) || {};
  const newPaths = (newSpec && newSpec.paths) || {};

  Object.keys(oldPaths).forEach(function (path: any) {
    if (!newPaths[path]) { add('endpoint.removed', path, path, null); return; }

    METHODS.forEach(function (m: any) {
      const a = deref(oldSpec, oldPaths[path][m]);
      const b = deref(newSpec, newPaths[path][m]);
      if (!a) return;
      const where = m.toUpperCase() + ' ' + path;
      if (!b) { add('operation.removed', where, where, null); return; }

      if (!a.deprecated && b.deprecated) add('operation.deprecated', where, false, true);

      diffParams(
        paramMap(oldSpec, (oldPaths[path].parameters || []).concat(a.parameters || [])),
        paramMap(newSpec, (newPaths[path].parameters || []).concat(b.parameters || [])),
        where
      );

      const aBody = deref(oldSpec, a.requestBody), bBody = deref(newSpec, b.requestBody);
      if (aBody || bBody) {
        if (!aBody && bBody && bBody.required) add('requestBody.added.required', where, null, true);
        if (aBody && bBody && !aBody.required && bBody.required) add('requestBody.required.added', where, false, true);
        diffProps(
          flatten(oldSpec, schemaOf(oldSpec, aBody), '', 0, {}, false),
          flatten(newSpec, schemaOf(newSpec, bBody), '', 0, {}, false),
          where + ' request', 'request'
        );
      }

      const aRes = a.responses || {}, bRes = b.responses || {};
      Object.keys(aRes).forEach(function (code: any) {
        if (!bRes[code]) { add('response.status.removed', where + ' :: ' + code, code, null); return; }
        if (String(code).charAt(0) !== '2') return; // only diff success payloads
        diffProps(
          flatten(oldSpec, schemaOf(oldSpec, aRes[code]), '', 0, {}, false),
          flatten(newSpec, schemaOf(newSpec, bRes[code]), '', 0, {}, false),
          where + ' response ' + code, 'response'
        );
      });
      Object.keys(bRes).forEach(function (code: any) {
        if (!aRes[code]) add('response.status.added', where + ' :: ' + code, null, code);
      });

      const aSec = JSON.stringify(a.security || oldSpec.security || null);
      const bSec = JSON.stringify(b.security || newSpec.security || null);
      if (aSec !== bSec) add('security.changed', where, a.security || null, b.security || null);
    });
  });

  Object.keys(newPaths).forEach(function (path: any) {
    if (!oldPaths[path]) { add('endpoint.added', path, null, path); return; }
    METHODS.forEach(function (m: any) {
      if (newPaths[path][m] && !oldPaths[path][m]) {
        add('operation.added', m.toUpperCase() + ' ' + path, null, m.toUpperCase() + ' ' + path);
      }
    });
  });

  // ---------- meta ----------
  const oldVersion = (oldSpec && oldSpec.info && oldSpec.info.version) || null;
  const newVersion = (newSpec && newSpec.info && newSpec.info.version) || null;

  const byKind: Record<string, number> = {};
  changes.forEach(function (c: any) { byKind[c.kind] = (byKind[c.kind] || 0) + 1; });

  const result: DiffResult = {
    oldVersion: oldVersion,
    newVersion: newVersion,
    totalChanges: changes.length,
    hasChanges: changes.length > 0,
    byKind: byKind,
    endpointsTouched: Array.from(
      new Set(changes.map(function (c: any) { return c.location.split(' :: ')[0]; }))
    ),
    changes: changes
  };

  return result;
}
