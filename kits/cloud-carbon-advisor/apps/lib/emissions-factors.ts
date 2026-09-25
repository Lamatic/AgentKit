// Emissions-factor tables — the defensible core of every number this kit
// produces. The methodology is the one established by the open-source Cloud
// Carbon Footprint project (thoughtworks/cloud-carbon-footprint):
//
//     emissions (gCO2e) = energy (kWh) × PUE × grid carbon intensity (gCO2e/kWh)
//     energy (kWh)      = usage amount × energy coefficient for that usage class
//
// Every value below is a *published estimate*, not a live measurement, and is
// intentionally kept in one file so it is auditable and swappable. Sources:
//   - Energy coefficients: Cloud Carbon Footprint methodology
//     (https://www.cloudcarbonfootprint.org/docs/methodology) — SSD/HDD watts
//     per TB, network kWh/GB, memory kWh/GB, compute min/max watts per vCPU.
//   - PUE: provider sustainability disclosures (AWS 1.135, Google 1.10,
//     Azure 1.125), generic 1.20 where unknown.
//   - Grid carbon intensity: Cloud Carbon Footprint grid-emissions-factors,
//     provider carbon-data pages, and Ember's 2023 yearly grid averages.
//
// These are order-of-magnitude-correct planning figures. The kit's value is the
// *relative* comparison between regions and levers, which is robust to the
// absolute uncertainty in any single coefficient.

import type { CloudProvider, UsageClass } from "./types";

export type RegionFactor = {
  provider: CloudProvider;
  code: string;
  label: string;
  continent: string;
  gridIntensity: number; // gCO2e/kWh
};

// Provider Power Usage Effectiveness — datacenter overhead multiplier.
export const PUE_BY_PROVIDER: Record<CloudProvider, number> = {
  aws: 1.135,
  gcp: 1.1,
  azure: 1.125,
  unknown: 1.2,
};

// Energy coefficients, in kWh per one unit of the usage class.
//   compute:      per vCPU-hour (x86 effective average of CCF's 0.74–3.5 W/vCPU)
//   compute-arm:  per vCPU-hour for ARM/Graviton (~40% lower silicon draw)
//   memory:       per GB-hour (CCF memory coefficient, 0.000392 kWh/GB-hr)
//   storage-ssd:  per GB-hour (CCF 1.2 W/TB → 1.2e-6 kWh/GB-hr)
//   storage-hdd:  per GB-hour (CCF 0.65 W/TB → 6.5e-7 kWh/GB-hr)
//   network:      per GB transferred (CCF 0.001 kWh/GB)
export const ENERGY_COEFFICIENTS = {
  computeVcpuHour: 0.0021,
  computeVcpuHourArm: 0.00126,
  memoryGbHour: 0.000392,
  storageSsdGbHour: 0.0000012,
  storageHddGbHour: 0.00000065,
  networkGb: 0.001,
} as const;

// Hours in an average month, used to convert GB-Month storage metering.
export const HOURS_PER_MONTH = 730;

// A curated, representative set of cloud regions with published grid-intensity
// estimates. Not exhaustive — it covers the regions most usage lands in and,
// crucially, the very-low-carbon regions that make migration worthwhile.
export const REGIONS: Record<string, RegionFactor> = {
  // ---- AWS ----
  "us-east-1": { provider: "aws", code: "us-east-1", label: "N. Virginia", continent: "NA", gridIntensity: 379 },
  "us-east-2": { provider: "aws", code: "us-east-2", label: "Ohio", continent: "NA", gridIntensity: 410 },
  "us-west-1": { provider: "aws", code: "us-west-1", label: "N. California", continent: "NA", gridIntensity: 190 },
  "us-west-2": { provider: "aws", code: "us-west-2", label: "Oregon", continent: "NA", gridIntensity: 120 },
  "ca-central-1": { provider: "aws", code: "ca-central-1", label: "Canada Central", continent: "NA", gridIntensity: 120 },
  "eu-west-1": { provider: "aws", code: "eu-west-1", label: "Ireland", continent: "EU", gridIntensity: 316 },
  "eu-west-2": { provider: "aws", code: "eu-west-2", label: "London", continent: "EU", gridIntensity: 228 },
  "eu-west-3": { provider: "aws", code: "eu-west-3", label: "Paris", continent: "EU", gridIntensity: 56 },
  "eu-central-1": { provider: "aws", code: "eu-central-1", label: "Frankfurt", continent: "EU", gridIntensity: 338 },
  "eu-north-1": { provider: "aws", code: "eu-north-1", label: "Stockholm", continent: "EU", gridIntensity: 8 },
  "ap-south-1": { provider: "aws", code: "ap-south-1", label: "Mumbai", continent: "AS", gridIntensity: 708 },
  "ap-southeast-1": { provider: "aws", code: "ap-southeast-1", label: "Singapore", continent: "AS", gridIntensity: 408 },
  "ap-southeast-2": { provider: "aws", code: "ap-southeast-2", label: "Sydney", continent: "OC", gridIntensity: 790 },
  "ap-northeast-1": { provider: "aws", code: "ap-northeast-1", label: "Tokyo", continent: "AS", gridIntensity: 506 },
  "sa-east-1": { provider: "aws", code: "sa-east-1", label: "São Paulo", continent: "SA", gridIntensity: 74 },
  // ---- GCP ----
  "us-central1": { provider: "gcp", code: "us-central1", label: "Iowa", continent: "NA", gridIntensity: 394 },
  "us-west1": { provider: "gcp", code: "us-west1", label: "Oregon", continent: "NA", gridIntensity: 120 },
  "europe-west1": { provider: "gcp", code: "europe-west1", label: "Belgium", continent: "EU", gridIntensity: 110 },
  "europe-north1": { provider: "gcp", code: "europe-north1", label: "Finland", continent: "EU", gridIntensity: 62 },
  "asia-south1": { provider: "gcp", code: "asia-south1", label: "Mumbai", continent: "AS", gridIntensity: 708 },
  // ---- Azure ----
  eastus: { provider: "azure", code: "eastus", label: "East US", continent: "NA", gridIntensity: 379 },
  westus2: { provider: "azure", code: "westus2", label: "West US 2", continent: "NA", gridIntensity: 120 },
  westeurope: { provider: "azure", code: "westeurope", label: "West Europe", continent: "EU", gridIntensity: 262 },
  northeurope: { provider: "azure", code: "northeurope", label: "North Europe", continent: "EU", gridIntensity: 316 },
  swedencentral: { provider: "azure", code: "swedencentral", label: "Sweden Central", continent: "EU", gridIntensity: 8 },
};

// Fallback grid intensity for an unrecognised region — the global grid average
// (~475 gCO2e/kWh, IEA). Keeps an unknown region from silently scoring zero.
export const GLOBAL_AVERAGE_INTENSITY = 475;

export function lookupRegion(regionId: string): RegionFactor | undefined {
  return REGIONS[regionId.trim().toLowerCase()] ?? REGIONS[regionId.trim()];
}

export function gridIntensityFor(regionId: string): number {
  return lookupRegion(regionId)?.gridIntensity ?? GLOBAL_AVERAGE_INTENSITY;
}

export function providerFor(regionId: string): CloudProvider {
  return lookupRegion(regionId)?.provider ?? "unknown";
}

export function pueFor(provider: CloudProvider): number {
  return PUE_BY_PROVIDER[provider] ?? PUE_BY_PROVIDER.unknown;
}

// The cleanest region within a provider — the migration ceiling. Cross-provider
// migration is out of scope, so this stays within one provider's regions.
export function cleanestRegionForProvider(provider: CloudProvider): RegionFactor | undefined {
  const candidates = Object.values(REGIONS).filter((r) => r.provider === provider);
  if (candidates.length === 0) return undefined;
  return candidates.reduce((best, r) => (r.gridIntensity < best.gridIntensity ? r : best));
}

// Resolve the energy coefficient (kWh per unit) for a usage line, and the
// UsageClass it maps to, from its FOCUS ServiceCategory + PricingUnit + SKU.
// Documented, deterministic, and deliberately conservative on ambiguity.
export function classifyUsage(input: {
  serviceCategory: string;
  pricingUnit: string;
  skuId?: string;
  serviceName?: string;
}): { usageClass: UsageClass; coefficient: number; normalizedUnit: string } {
  const cat = input.serviceCategory.toLowerCase();
  const unit = input.pricingUnit.toLowerCase();
  const sku = `${input.skuId ?? ""} ${input.serviceName ?? ""}`.toLowerCase();
  const isArm = /graviton|arm|ampere|axion|\bc[0-9]+g|\bm[0-9]+g|\br[0-9]+g|t4g/.test(sku);

  // Networking / data transfer — metered per GB, no time component.
  if (cat.includes("network") || /data.?transfer|egress|bandwidth/.test(sku) || (unit === "gb" && cat.includes("network"))) {
    return { usageClass: "network", coefficient: ENERGY_COEFFICIENTS.networkGb, normalizedUnit: "GB" };
  }

  // Storage — GB-Month or GB-Hours. HDD/archival tiers draw less.
  if (cat.includes("storage") || /storage|volume|snapshot|backup|glacier|blob|bucket/.test(sku)) {
    const isCold = /hdd|cold|archive|glacier|sc1|st1|infrequent/.test(sku);
    const perHour = isCold ? ENERGY_COEFFICIENTS.storageHddGbHour : ENERGY_COEFFICIENTS.storageSsdGbHour;
    if (/month|gb-mo/.test(unit)) {
      return {
        usageClass: isCold ? "storage-hdd" : "storage-ssd",
        coefficient: perHour * HOURS_PER_MONTH,
        normalizedUnit: "GB-Month",
      };
    }
    return {
      usageClass: isCold ? "storage-hdd" : "storage-ssd",
      coefficient: perHour,
      normalizedUnit: "GB-Hours",
    };
  }

  // Memory-metered lines (e.g. serverless GB-seconds normalised upstream, or
  // memory-optimised units billed in GB-Hours).
  if (/memory|ram/.test(cat) || (/gb.?hour/.test(unit) && /memory|cache|elasticache|redis/.test(sku))) {
    return { usageClass: "memory", coefficient: ENERGY_COEFFICIENTS.memoryGbHour, normalizedUnit: "GB-Hours" };
  }

  // Compute — vCPU-hours. Only apply the per-vCPU-hour coefficient to lines
  // actually metered in an hour-based unit (vCPU-Hours, Hrs, Hours). A
  // compute-category line billed in GB-Seconds, Requests, etc. has no valid
  // conversion to vCPU-hours, so it falls through to "other" rather than being
  // silently mis-priced.
  const isComputeCat =
    cat.includes("compute") || cat.includes("database") || cat.includes("container") || cat.includes("serverless");
  const isHourUnit = /vcpu|cpu|core|\bhours?\b|\bhrs?\b/.test(unit);
  if (/vcpu/.test(unit) || (isComputeCat && isHourUnit)) {
    return {
      usageClass: "compute",
      coefficient: isArm ? ENERGY_COEFFICIENTS.computeVcpuHourArm : ENERGY_COEFFICIENTS.computeVcpuHour,
      normalizedUnit: "vCPU-Hours",
    };
  }

  // Unknown or non-convertible metering (e.g. GB-Seconds, Requests, Count) —
  // attribute no energy rather than guess. Surfaced as "other" so the UI can
  // report how much of the bill went unmodelled, with the real unit preserved.
  return { usageClass: "other", coefficient: 0, normalizedUnit: input.pricingUnit };
}
