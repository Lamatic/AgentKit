/**
 * Deterministic side of the gate: turn a `terraform show -json` plan into a
 * small list of change facts. No model is involved here, and nothing marked
 * sensitive by Terraform ever leaves this file.
 *
 * Field names follow the Terraform JSON output format (plan representation):
 * resource_changes[].{address, module_address, mode, type, name, provider_name,
 * action_reason, change.{actions, before, after, after_unknown,
 * before_sensitive, after_sensitive, replace_paths}}.
 */

export type Action = "no-op" | "create" | "read" | "update" | "delete" | "forget";

export interface ResourceChange {
  address: string;
  module_address?: string;
  /** Set on the old object of a create-before-destroy replacement; it shares the address with the new one. */
  deposed?: string;
  mode: "managed" | "data";
  type: string;
  name: string;
  provider_name: string;
  action_reason?: string;
  change: {
    actions: Action[];
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    after_unknown?: Record<string, unknown>;
    before_sensitive?: Record<string, unknown> | boolean;
    after_sensitive?: Record<string, unknown> | boolean;
    replace_paths?: unknown[][];
  };
}

export interface TerraformPlan {
  format_version: string;
  terraform_version?: string;
  planned_values?: unknown;
  values?: unknown;
  resource_changes?: ResourceChange[];
}

/** What crosses the boundary into the Lamatic flow. */
export interface ChangeFact {
  address: string;
  type: string;
  provider: string;
  actions: Action[];
  /** Derived from actions. "forget" is a `removed` block: the resource leaves state but keeps running. */
  kind: "create" | "update" | "destroy" | "replace" | "read" | "forget";
  actionReason: string | null;
  /** Attribute names whose value differs between before and after. Never values. */
  changedAttributes: string[];
  /** Attribute names Terraform marks sensitive. Names only; values are dropped. */
  sensitiveAttributes: string[];
  /** Security-relevant attribute values from the safelist below. */
  attributeValues: Record<string, unknown>;
  /** Deterministic hints for the reviewer, e.g. "stateful", "destroy", "open-to-internet:22". */
  flags: string[];
}

export interface PlanFacts {
  terraformVersion: string | null;
  totalChanges: number;
  facts: ChangeFact[];
  counts: { create: number; update: number; destroy: number; replace: number; read: number; forget: number };
  summary: string;
}

/**
 * Attributes whose *values* are safe and useful to show a reviewer. Everything
 * else crosses the boundary as a name only. Tags are deliberately absent: they
 * are free-form maps that people put credentials and internal hostnames in,
 * so only the derived `production` flag is sent, never the map itself.
 */
const SAFE_VALUE_ATTRIBUTES = new Set([
  "acl",
  "publicly_accessible",
  "block_public_acls",
  "block_public_policy",
  "ignore_public_acls",
  "restrict_public_buckets",
  "deletion_protection",
  "deletion_protection_enabled",
  "skip_final_snapshot",
  "force_destroy",
  "storage_encrypted",
  "encrypted",
  "kms_key_id",
  "kms_key_arn",
  "instance_class",
  "instance_type",
  "engine",
  "engine_version",
  "multi_az",
  "backup_retention_period",
  "from_port",
  "to_port",
  "protocol",
  "cidr_blocks",
  "ipv6_cidr_blocks",
  "cidr_ipv4",
  "cidr_ipv6",
  "ingress",
  "egress",
  "versioning",
  "lifecycle",
  "min_size",
  "max_size",
  "desired_capacity",
  "create_before_destroy",
]);

/** Resource types that hold data or long-lived state. Destroying one is never routine. */
const STATEFUL_TYPES = [
  /^aws_(db_instance|rds_cluster|rds_cluster_instance|dynamodb_table|s3_bucket|ebs_volume|efs_file_system|elasticache_cluster|elasticache_replication_group|redshift_cluster|secretsmanager_secret|kms_key|docdb_cluster|neptune_cluster|opensearch_domain|elasticsearch_domain|sqs_queue|kinesis_stream)$/,
  /^google_(sql_database_instance|sql_database|storage_bucket|bigquery_dataset|bigquery_table|compute_disk|redis_instance|secret_manager_secret|spanner_instance|firestore_database)$/,
  /^azurerm_(storage_account|mssql_database|mssql_server|postgresql_server|postgresql_flexible_server|mysql_server|cosmosdb_account|managed_disk|key_vault|redis_cache|storage_container)$/,
];

/** Resources whose replacement means downtime unless done create-before-destroy. */
const LONG_LIVED_COMPUTE = [
  /^aws_(instance|autoscaling_group|eks_cluster|eks_node_group|ecs_service|lb|alb|elb|nat_gateway|vpc|subnet)$/,
  /^google_(compute_instance|container_cluster|container_node_pool|compute_forwarding_rule)$/,
  /^azurerm_(virtual_machine|linux_virtual_machine|windows_virtual_machine|kubernetes_cluster|lb)$/,
];

const ADMIN_PORTS = new Set([22, 3389, 5432, 3306, 6379, 27017, 9200, 1433, 5984]);

/**
 * Plain-language phrasing for each flag. The summary doubles as the Vector
 * Search query for the policy store, so it should read like the policies do.
 */
const FLAG_PHRASES: Record<string, string> = {
  destroy: "destroying a resource",
  replace: "replacing a resource (delete then create)",
  stateful: "a stateful resource such as a database, bucket or table",
  "compute-replacement": "replacing long-lived compute, a rollout with downtime",
  "public-acl": "a publicly readable storage ACL",
  "publicly-accessible": "a publicly accessible database",
  "public-access-block-disabled": "a public access block being disabled on a bucket",
  "deletion-protection-removed": "deletion protection being removed",
  "deletion-protection-off": "deletion protection off on a destroyed resource",
  "skip-final-snapshot": "skipping the final snapshot",
  "force-destroy": "force_destroy on a data store",
  "encryption-disabled": "encryption being disabled",
  "customer-kms-key-removed": "a customer-managed KMS key being removed",
  "iam-wildcard": "an IAM policy granting wildcard actions and resources",
  "iam-admin-access": "AdministratorAccess being attached",
  "large-blast-radius": "a plan touching more than 25 resources or destroying more than 5 (large blast radius)",
  forgotten: "a resource removed from state but left running (drift, orphaned resource)",
  production: "a production resource",
};

function phraseFor(flag: string): string {
  if (flag.startsWith("open-to-internet:")) return `an administrative or service port (${flag.split(":")[1]}) open to the internet 0.0.0.0/0`;
  return FLAG_PHRASES[flag] ?? flag;
}

export function parsePlan(text: string): TerraformPlan {
  let doc: unknown;
  try {
    doc = JSON.parse(text);
  } catch {
    throw new Error("The plan is not valid JSON. Generate it with `terraform show -json tfplan > plan.json`.");
  }
  if (!doc || typeof doc !== "object" || !("format_version" in doc)) {
    throw new Error(
      "This does not look like a Terraform plan: no top-level `format_version`. Use `terraform show -json`, not `terraform plan` text."
    );
  }
  const plan = doc as TerraformPlan;
  if (plan.resource_changes !== undefined && !Array.isArray(plan.resource_changes)) {
    throw new Error("`resource_changes` is present but is not an array.");
  }
  // A state file also has format_version, but carries `values` and never
  // `planned_values`. Treating it as an empty plan would pass it as safe.
  if (plan.resource_changes === undefined && plan.planned_values === undefined && plan.values !== undefined) {
    throw new Error("This is a state file, not a plan: it has `values` but no `planned_values` or `resource_changes`. Run `terraform show -json tfplan` on a saved plan.");
  }
  return plan;
}

function kindOf(actions: Action[]): ChangeFact["kind"] {
  if (actions.includes("forget")) return "forget";
  if (actions.includes("delete") && actions.includes("create")) return "replace";
  if (actions.includes("delete")) return "destroy";
  if (actions.includes("create")) return "create";
  if (actions.includes("read")) return "read";
  return "update";
}

function sensitiveKeys(mask: Record<string, unknown> | boolean | undefined): Set<string> {
  const keys = new Set<string>();
  if (!mask || typeof mask !== "object") return keys;
  for (const [k, v] of Object.entries(mask)) {
    // Terraform marks a sensitive attribute as `true`, or as a nested object
    // for blocks; either way the top-level name is enough to redact.
    if (v === true || (v && typeof v === "object" && JSON.stringify(v).includes("true"))) keys.add(k);
  }
  return keys;
}

function looksSecretName(key: string): boolean {
  return /(password|secret|token|private_key|credential|connection_string|api_key|access_key)/i.test(key);
}

function changedAttributeNames(before: Record<string, unknown> | null, after: Record<string, unknown> | null): string[] {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const changed: string[] = [];
  for (const k of keys) {
    const b = JSON.stringify(before?.[k] ?? null);
    const a = JSON.stringify(after?.[k] ?? null);
    if (b !== a) changed.push(k);
  }
  return changed.sort();
}

function cidrsOpenToWorld(rule: Record<string, unknown>): boolean {
  const lists = [rule.cidr_blocks, rule.ipv6_cidr_blocks];
  const singles = [rule.cidr_ipv4, rule.cidr_ipv6];
  const all = [
    ...lists.flatMap((l) => (Array.isArray(l) ? l : [])),
    ...singles.filter((s) => typeof s === "string"),
  ] as string[];
  return all.some((c) => c === "0.0.0.0/0" || c === "::/0");
}

function portFlags(rule: Record<string, unknown>): string[] {
  if (!cidrsOpenToWorld(rule)) return [];
  const from = Number(rule.from_port ?? rule.from ?? NaN);
  const to = Number(rule.to_port ?? rule.to ?? NaN);
  const protocol = String(rule.protocol ?? rule.ip_protocol ?? "").toLowerCase();
  if (protocol.startsWith("icmp")) return []; // no ports to expose
  if (protocol === "-1" || protocol === "all" || (from === 0 && to === 65535)) return ["open-to-internet:all-ports"];
  const out: string[] = [];
  for (const p of ADMIN_PORTS) if (!Number.isNaN(from) && !Number.isNaN(to) && p >= from && p <= to) out.push(`open-to-internet:${p}`);
  if (out.length === 0 && !Number.isNaN(from)) out.push(`open-to-internet:${from === to ? from : `${from}-${to}`}`);
  return out;
}

/**
 * Normalise the provider-specific shapes of an inbound rule into
 * { from_port, to_port, protocol, cidr_blocks } so one check covers AWS
 * security groups, GCP firewalls and Azure network security rules.
 */
function ingressRules(type: string, after: Record<string, unknown>): Record<string, unknown>[] {
  const rules: Record<string, unknown>[] = [];
  // AWS: aws_security_group.ingress[] blocks, aws_security_group_rule, aws_vpc_security_group_ingress_rule
  if (Array.isArray(after.ingress)) rules.push(...(after.ingress as Record<string, unknown>[]));
  if (/^aws_(security_group_rule|vpc_security_group_ingress_rule)$/.test(type) && (after.type === "ingress" || after.type === undefined)) rules.push(after);
  // GCP: google_compute_firewall with direction INGRESS, allow[] { protocol, ports[] }, source_ranges[]
  if (type === "google_compute_firewall" && String(after.direction ?? "INGRESS").toUpperCase() === "INGRESS") {
    const allows = Array.isArray(after.allow) ? (after.allow as Record<string, unknown>[]) : [];
    for (const a of allows) {
      const ports = Array.isArray(a.ports) && a.ports.length > 0 ? (a.ports as string[]) : ["0-65535"];
      for (const p of ports) {
        const [from, to] = String(p).split("-");
        rules.push({ from_port: Number(from), to_port: Number(to ?? from), protocol: String(a.protocol ?? "tcp"), cidr_blocks: after.source_ranges });
      }
    }
  }
  // Azure: azurerm_network_security_rule / security_rule[] with direction Inbound, access Allow
  const azRules: Record<string, unknown>[] = [];
  if (type === "azurerm_network_security_rule") azRules.push(after);
  if (Array.isArray(after.security_rule)) azRules.push(...(after.security_rule as Record<string, unknown>[]));
  for (const r of azRules) {
    if (String(r.direction ?? "").toLowerCase() !== "inbound" || String(r.access ?? "Allow").toLowerCase() !== "allow") continue;
    const prefixes = [r.source_address_prefix, ...(Array.isArray(r.source_address_prefixes) ? r.source_address_prefixes : [])]
      .filter((x) => typeof x === "string")
      .map((x) => (x === "*" || x === "Internet" ? "0.0.0.0/0" : x));
    const ranges = [r.destination_port_range, ...(Array.isArray(r.destination_port_ranges) ? r.destination_port_ranges : [])].filter((x) => typeof x === "string") as string[];
    for (const range of ranges.length ? ranges : ["*"]) {
      const [from, to] = range === "*" ? ["0", "65535"] : range.split("-");
      rules.push({ from_port: Number(from), to_port: Number(to ?? from), protocol: String(r.protocol ?? "Tcp") === "*" ? "-1" : String(r.protocol), cidr_blocks: prefixes });
    }
  }
  return rules;
}

function iamWildcard(policyText: unknown): boolean {
  if (typeof policyText !== "string") return false;
  try {
    const doc = JSON.parse(policyText);
    const statements = Array.isArray(doc.Statement) ? doc.Statement : [doc.Statement].filter(Boolean);
    return statements.some((s: Record<string, unknown>) => {
      const has = (v: unknown) => (Array.isArray(v) ? v : [v]).includes("*");
      return s.Effect === "Allow" && has(s.Action) && has(s.Resource);
    });
  } catch {
    return /"Action"\s*:\s*"\*"/.test(policyText) && /"Resource"\s*:\s*"\*"/.test(policyText);
  }
}

function flagsFor(rc: ResourceChange, kind: ChangeFact["kind"], values: Record<string, unknown>): string[] {
  const flags = new Set<string>();
  const after = rc.change.after ?? {};
  const before = rc.change.before ?? {};

  if (kind === "destroy") flags.add("destroy");
  if (kind === "replace") flags.add("replace");
  if (kind === "forget") flags.add("forgotten");
  if (STATEFUL_TYPES.some((re) => re.test(rc.type))) flags.add("stateful");
  if (LONG_LIVED_COMPUTE.some((re) => re.test(rc.type)) && kind === "replace") flags.add("compute-replacement");

  if (values.acl === "public-read" || values.acl === "public-read-write") flags.add("public-acl");
  if (values.publicly_accessible === true) flags.add("publicly-accessible");
  if (
    values.block_public_acls === false ||
    values.block_public_policy === false ||
    values.ignore_public_acls === false ||
    values.restrict_public_buckets === false
  )
    flags.add("public-access-block-disabled");

  // On a destroy `after` is null, so the safeguard's last known state is in `before`.
  const protectionAtRisk = kind === "destroy" ? before.deletion_protection : after.deletion_protection;
  if (before.deletion_protection === true && after.deletion_protection === false) flags.add("deletion-protection-removed");
  else if (protectionAtRisk === false && (kind === "destroy" || kind === "replace")) flags.add("deletion-protection-off");
  if (after.skip_final_snapshot === true || before.skip_final_snapshot === true) flags.add("skip-final-snapshot");
  if (after.force_destroy === true || (kind === "destroy" && before.force_destroy === true)) flags.add("force-destroy");

  const encBefore = before.storage_encrypted ?? before.encrypted;
  const encAfter = after.storage_encrypted ?? after.encrypted;
  if (encBefore === true && encAfter === false) flags.add("encryption-disabled");
  if ((before.kms_key_id || before.kms_key_arn) && !(after.kms_key_id || after.kms_key_arn) && kind !== "destroy")
    flags.add("customer-kms-key-removed");

  for (const r of ingressRules(rc.type, after)) for (const f of portFlags(r)) flags.add(f);

  for (const key of ["policy", "assume_role_policy", "policy_document", "inline_policy"]) {
    if (iamWildcard(after[key])) flags.add("iam-wildcard");
  }
  if (typeof after.policy_arn === "string" && /AdministratorAccess/.test(after.policy_arn)) flags.add("iam-admin-access");

  const tags = (after.tags_all ?? after.tags ?? before.tags_all ?? before.tags) as Record<string, string> | undefined;
  const env = tags && typeof tags === "object" ? String(tags.environment ?? tags.Environment ?? tags.env ?? tags.Env ?? tags.stage ?? tags.Stage ?? "") : "";
  // "prod" as its own path segment or index key; "product_images" is not production.
  if (/^prod/i.test(env) || /(^|[._\-\["])prod(uction)?([._\-\[\]"]|$)/i.test(rc.address)) flags.add("production");

  return [...flags].sort();
}

/**
 * Upper bound on changes sent to one review. The prompts are written for a
 * plan a human can still read; beyond this, POL-10 already says the plan
 * should be split, so the gate says so directly instead of reviewing it.
 */
export const MAX_CHANGES = 200;

export function extractFacts(plan: TerraformPlan): PlanFacts {
  const counts = { create: 0, update: 0, destroy: 0, replace: 0, read: 0, forget: 0 };
  const facts: ChangeFact[] = [];

  for (const rc of plan.resource_changes ?? []) {
    const actions = rc.change?.actions ?? [];
    if (actions.length === 0 || (actions.length === 1 && actions[0] === "no-op")) continue;
    // Data sources read during apply are not infrastructure changes; count them
    // so the summary is honest, but do not send them for review.
    if (rc.mode === "data") {
      counts.read += 1;
      continue;
    }
    const kind = kindOf(actions);
    counts[kind] += 1;

    const sensitive = new Set([
      ...sensitiveKeys(rc.change.before_sensitive),
      ...sensitiveKeys(rc.change.after_sensitive),
    ]);
    const changed = changedAttributeNames(rc.change.before, rc.change.after);
    for (const k of changed) if (looksSecretName(k)) sensitive.add(k);

    const attributeValues: Record<string, unknown> = {};
    const source = kind === "destroy" ? rc.change.before ?? {} : rc.change.after ?? {};
    for (const [k, v] of Object.entries(source)) {
      if (!SAFE_VALUE_ATTRIBUTES.has(k) || sensitive.has(k) || v === null || v === undefined) continue;
      attributeValues[k] = v;
    }
    // A before/after pair for the safeguards a reviewer cares about most.
    for (const k of ["deletion_protection", "skip_final_snapshot", "storage_encrypted", "publicly_accessible"]) {
      const b = rc.change.before?.[k];
      const a = rc.change.after?.[k];
      if (b !== undefined && a !== undefined && b !== a) attributeValues[`${k}_before`] = b;
    }

    facts.push({
      // The deposed half of a create-before-destroy replacement shares its
      // address with the new object; keep the two apart so every fact and
      // every assessment stays addressable.
      address: rc.deposed ? `${rc.address} (deposed ${rc.deposed})` : rc.address,
      type: rc.type,
      provider: rc.provider_name,
      actions,
      kind,
      actionReason: rc.action_reason ?? null,
      changedAttributes: changed.filter((k) => !sensitive.has(k)),
      sensitiveAttributes: [...sensitive].sort(),
      attributeValues,
      flags: flagsFor(rc, kind, attributeValues),
    });
  }

  if (facts.length > MAX_CHANGES) {
    throw new Error(
      `This plan has ${facts.length} resource changes; the gate reviews up to ${MAX_CHANGES} in one run. Split it with -target and review each part.`
    );
  }

  // POL-10 is about the whole plan, not one resource: over 25 changes or over
  // 5 destroys/replaces marks every change so the reviewer sees it in context.
  const destructive = counts.destroy + counts.replace;
  if (facts.length > 25 || destructive > 5) {
    for (const f of facts) if (!f.flags.includes("large-blast-radius")) f.flags = [...f.flags, "large-blast-radius"].sort();
  }

  const flagged = facts.filter((f) => f.flags.some((x) => x !== "production")).length;
  const stateful = facts.filter((f) => f.flags.includes("stateful") && (f.kind === "destroy" || f.kind === "replace")).length;
  const summary =
    `${facts.length} resource change(s): ${counts.create} create, ${counts.update} update, ${counts.destroy} destroy, ${counts.replace} replace, ${counts.forget} removed from state, ${counts.read} data read. ` +
    `${stateful} stateful resource(s) destroyed or replaced. ${flagged} change(s) carry risk flags: ` +
    (facts
      .flatMap((f) => f.flags.filter((x) => x !== "production").map((x) => `${f.address} ${x}`))
      .slice(0, 12)
      .join("; ") || "none") +
    ". " +
    (flagged > 0
      ? "Policy topics touched: " + [...new Set(facts.flatMap((f) => f.flags.map(phraseFor)))].join("; ") + "."
      : "");

  return { terraformVersion: plan.terraform_version ?? null, totalChanges: facts.length, facts, counts, summary };
}
