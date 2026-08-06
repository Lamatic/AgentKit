import React from 'react';
import { Lamatic } from 'lamatic';
import { AssessmentData, RiskCategoryDetails, RiskAssessment, VendorInformation, Recommendations, RiskLevel } from './types';

export interface LamaticResponse {
  status: 'success' | 'error';
  result: Record<string, any> | null;
  message?: string;
  statusCode?: number;
}

// Initialize the official Lamatic SDK client using Vite environment variables
export const lamaticClient = new Lamatic({
  endpoint: import.meta.env.VITE_LAMATIC_PROJECT_ENDPOINT || '',
  projectId: import.meta.env.VITE_LAMATIC_PROJECT_ID || '',
  apiKey: import.meta.env.VITE_LAMATIC_PROJECT_API_KEY || '',
});

/**
 * Enterprise compliance label dictionary
 */
export function formatEnterpriseLabel(text: string): string {
  if (!text) return '';
  let str = String(text);

  if (str.trim().toLowerCase() === 'not provided') {
    return 'Information Not Provided';
  }

  // Common compliance replacements
  str = str
    .replace(/\bgdpr\b/gi, 'GDPR')
    .replace(/\bhipaa\b/gi, 'HIPAA')
    .replace(/\bsoc2\b/gi, 'SOC 2 Type II')
    .replace(/\bsoc_2\b/gi, 'SOC 2 Type II')
    .replace(/\biso27001\b/gi, 'ISO 27001')
    .replace(/\biso_27001\b/gi, 'ISO 27001')
    .replace(/\bpci_dss\b/gi, 'PCI-DSS')
    .replace(/\bccpa\b/gi, 'CCPA');

  return str;
}

/**
 * Normalizes risk labels to Title Case (e.g., "low" -> "Low", "critical" -> "Critical")
 */
export function formatRiskLevel(level: any): string {
  if (!level) return 'Unknown';
  const raw = String(level).trim();
  if (raw.toLowerCase() === 'not provided') return 'Information Not Provided';

  const lower = raw.toLowerCase();
  if (lower.includes('crit')) return 'Critical';
  if (lower.includes('high')) return 'High';
  if (lower.includes('mod') || lower.includes('med')) return 'Medium';
  if (lower.includes('low')) return 'Low';

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Converts 1–5 risk scores to percentage scale:
 * 1 -> 20/100
 * 2 -> 40/100
 * 3 -> 60/100
 * 4 -> 80/100
 * 5 -> 100/100
 */
export function formatRiskScore(score: any): { numericScore: number | null; displayScoreString: string } {
  if (score === null || score === undefined || score === '') {
    return { numericScore: null, displayScoreString: '' };
  }

  const num = typeof score === 'number' ? score : parseFloat(String(score));
  if (isNaN(num)) {
    return { numericScore: null, displayScoreString: String(score) };
  }

  let pct = num;
  // If score is on 1–5 scale
  if (num >= 1 && num <= 5) {
    pct = Math.round(num * 20);
  } else if (num > 0 && num < 1) {
    pct = Math.round(num * 100);
  } else {
    pct = Math.min(Math.max(Math.round(num), 0), 100);
  }

  return {
    numericScore: pct,
    displayScoreString: `${pct}`,
  };
}

/**
 * Safely renders string, object, or array items in React components
 * so that objects are never directly rendered as React children.
 */
export function renderItemContent(item: any): React.ReactNode {
  if (item === null || item === undefined || item === '') return null;

  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    const textVal = String(item);
    if (textVal.trim().toLowerCase() === 'not provided') {
      return 'Information Not Provided';
    }
    return formatEnterpriseLabel(textVal);
  }

  if (typeof item === 'object') {
    const entries = Object.entries(item).filter(([_, val]) => val !== null && val !== undefined);
    if (entries.length === 0) {
      return JSON.stringify(item);
    }

    return React.createElement(
      'div',
      { className: 'space-y-1.5 text-xs my-0.5' },
      entries.map(([key, val]) => {
        let formattedKey = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());

        formattedKey = formatEnterpriseLabel(formattedKey);

        let displayVal =
          typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val);

        if (displayVal.trim().toLowerCase() === 'not provided') {
          displayVal = 'Information Not Provided';
        } else {
          displayVal = formatEnterpriseLabel(displayVal);
        }

        return React.createElement(
          'div',
          { key, className: 'leading-snug' },
          React.createElement('span', { className: 'font-bold text-slate-900' }, `${formattedKey}: `),
          React.createElement('span', { className: 'text-slate-700 font-medium' }, displayVal)
        );
      })
    );
  }

  return String(item);
}

/**
 * Formats long sentences or delimited evidence text into bullet point lists
 */
export function formatEvidenceToBullets(evidenceInput: any): string[] {
  if (!evidenceInput) return [];

  if (Array.isArray(evidenceInput)) {
    return evidenceInput.flatMap((item) => formatEvidenceToBullets(item));
  }

  if (typeof evidenceInput === 'object') {
    return Object.entries(evidenceInput).map(([k, v]) => {
      const formattedKey = formatEnterpriseLabel(k.replace(/_/g, ' '));
      const valStr = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return `${formattedKey}: ${formatEnterpriseLabel(valStr)}`;
    });
  }

  const str = String(evidenceInput).trim();
  if (str.toLowerCase() === 'not provided') {
    return ['Information Not Provided'];
  }

  // Split if bullet indicators, semicolons, or newlines or sentence periods exist
  if (str.includes('\n')) {
    return str
      .split('\n')
      .map((s) => s.replace(/^[•\-\*]\s*/, '').trim())
      .filter((s) => s.length > 0)
      .map(formatEnterpriseLabel);
  }

  if (str.includes(';')) {
    return str
      .split(';')
      .map((s) => s.replace(/^[•\-\*]\s*/, '').trim())
      .filter((s) => s.length > 0)
      .map(formatEnterpriseLabel);
  }

  // If contains bullet dots or commas/periods with multiple items
  if (str.includes('•')) {
    return str
      .split('•')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map(formatEnterpriseLabel);
  }

  // Split sentences ending in period followed by space if sentence count > 1
  const sentences = str
    .split(/\.\s+/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter((s) => s.length > 0);

  if (sentences.length > 1) {
    return sentences.map(formatEnterpriseLabel);
  }

  return [formatEnterpriseLabel(str)];
}

/**
 * Helper to safely extract arrays from various casing / locations in API response
 */
function extractArray(...candidates: any[]): any[] {
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

function parseCategoryItem(raw: any, defaultCat: string): RiskCategoryDetails {
  if (!raw) {
    return {
      category: defaultCat,
      riskLevel: '',
      score: '',
      reason: '',
      evidence: '',
    };
  }

  if (typeof raw === 'string') {
    return {
      category: defaultCat,
      riskLevel: '',
      score: '',
      reason: raw,
      evidence: '',
    };
  }

  const category =
    raw.category ||
    raw.category_name ||
    raw.name ||
    raw.domain ||
    defaultCat;

  const riskLevel =
    raw.risk ||
    raw.risk_level ||
    raw.riskLevel ||
    raw.level ||
    '';

  const score =
    raw.score !== undefined && raw.score !== null
      ? raw.score
      : raw.risk_score !== undefined && raw.risk_score !== null
      ? raw.risk_score
      : raw.riskScore !== undefined && raw.riskScore !== null
      ? raw.riskScore
      : '';

  const reason =
    raw.reason ||
    raw.description ||
    raw.details ||
    raw.explanation ||
    '';

  const evidence =
    raw.evidence ||
    raw.proof ||
    raw.findings ||
    '';

  return {
    category,
    riskLevel,
    score,
    reason,
    evidence,
  };
}

function formatCategoryKey(key: string): string {
  const formatted = key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return formatted.toLowerCase().includes('risk') ? formatted : `${formatted} Risk`;
}

export function extractCategories(resObj: any): RiskCategoryDetails[] {
  const rawCategories =
    resObj.riskAssessment?.categories ||
    resObj.categories ||
    resObj.risk_assessment?.categories ||
    resObj.riskAssessment?.risks ||
    resObj.risks ||
    resObj.risk_assessment?.risks;

  if (Array.isArray(rawCategories)) {
    return rawCategories.map((item, idx) => parseCategoryItem(item, `Category ${idx + 1}`));
  }

  if (rawCategories && typeof rawCategories === 'object') {
    return Object.entries(rawCategories).map(([key, val]) =>
      parseCategoryItem(val, formatCategoryKey(key))
    );
  }

  return [];
}

/**
 * Safely parses and normalizes the response from Lamatic's executeFlow call into AssessmentData
 */
export function parseLamaticResponse(response: LamaticResponse): AssessmentData {
  if (response.status !== 'success' || !response.result) {
    throw new Error(
      response.message || 'Lamatic flow execution returned an unsuccessful status or empty result.'
    );
  }

  let resObj: any = response.result;

  // Handle nested stringified JSON output
  if (typeof resObj === 'string') {
    try {
      resObj = JSON.parse(resObj);
    } catch {
      resObj = { executiveSummary: resObj };
    }
  }

  if (resObj.output && typeof resObj.output === 'string') {
    try {
      const parsedOutput = JSON.parse(resObj.output);
      resObj = { ...resObj, ...parsedOutput };
    } catch {
      if (!resObj.executiveSummary) {
        resObj.executiveSummary = resObj.output;
      }
    }
  }

  if (resObj.result && typeof resObj.result === 'object') {
    resObj = { ...resObj, ...resObj.result };
  }

  // Extract Vendor Info directly from response.result.vendor_information
  const rawVendor =
    resObj.vendor_information ||
    resObj.vendorInfo ||
    resObj.vendor_info ||
    resObj;

  const vendorInfo: VendorInformation = {
    vendor_name:
      rawVendor.vendor_name ??
      rawVendor.vendorName ??
      rawVendor.vendor ??
      '',
    certifications:
      rawVendor.certifications ??
      resObj.certifications ??
      [],
    security_controls:
      rawVendor.security_controls ??
      rawVendor.securityControls ??
      [],
    compliance:
      rawVendor.compliance ??
      [],
    financial_information:
      rawVendor.financial_information ??
      rawVendor.financialInformation ??
      '',
    operational_information:
      rawVendor.operational_information ??
      rawVendor.operationalInformation ??
      '',
    legal_information:
      rawVendor.legal_information ??
      rawVendor.legalInformation ??
      '',
    missing_information:
      rawVendor.missing_information ??
      rawVendor.missingInformation ??
      [],

    vendorName:
      rawVendor.vendor_name ??
      rawVendor.vendorName ??
      rawVendor.vendor ??
      '',
    securityControls:
      rawVendor.security_controls ??
      rawVendor.securityControls ??
      [],
    financialInformation:
      rawVendor.financial_information ??
      rawVendor.financialInformation ??
      '',
    operationalInformation:
      rawVendor.operational_information ??
      rawVendor.operationalInformation ??
      '',
    legalInformation:
      rawVendor.legal_information ??
      rawVendor.legalInformation ??
      '',
    missingInformation:
      rawVendor.missing_information ??
      rawVendor.missingInformation ??
      [],
  };

  const overallRiskScore =
    resObj.riskAssessment?.overall_risk_score ??
    resObj.riskAssessment?.overallRiskScore ??
    resObj.risk_assessment?.overall_risk_score ??
    resObj.overall_risk_score ??
    resObj.overallRiskScore ??
    resObj.riskAssessment?.overall_score ??
    resObj.overall_score ??
    null;

  const overallRiskLevel =
    resObj.riskAssessment?.overall_risk ??
    resObj.riskAssessment?.overall_risk_level ??
    resObj.riskAssessment?.overallRiskLevel ??
    resObj.risk_assessment?.overall_risk ??
    resObj.overall_risk ??
    resObj.overall_risk_level ??
    resObj.overallRiskLevel ??
    '';

  const categories = extractCategories(resObj);

  const riskAssessment: RiskAssessment = {
    overallRiskScore,
    overallRiskLevel,
    categories,
  };

  // Extract recommendations block
  const recsObj = resObj.recommendations || {};

  const positiveFindings = extractArray(
    recsObj.positiveFindings,
    recsObj.positive_findings,
    resObj.positiveFindings,
    resObj.positive_findings
  );

  const priorityActions = extractArray(
    recsObj.priorityActions,
    recsObj.priority_actions,
    recsObj.priority_action,
    resObj.priorityActions,
    resObj.priority_actions,
    resObj.priority_action
  );

  const recommendationsList = extractArray(
    recsObj.recommendations,
    recsObj.recommendation,
    recsObj.strategic_recommendations,
    Array.isArray(resObj.recommendations) ? resObj.recommendations : null,
    resObj.recommendation,
    resObj.strategic_recommendations
  );

  const nextSteps = extractArray(
    recsObj.nextSteps,
    recsObj.next_steps,
    recsObj.next_step,
    resObj.nextSteps,
    resObj.next_steps,
    resObj.next_step
  );

  const executiveSummary =
    recsObj.executiveSummary ||
    recsObj.executive_summary ||
    resObj.executiveSummary ||
    resObj.executive_summary ||
    resObj.summary ||
    '';

  const recommendations: Recommendations = {
    executiveSummary,
    positiveFindings,
    priorityActions,
    recommendations: recommendationsList,
    nextSteps,
  };

  return {
    vendorInfo,
    riskAssessment,
    recommendations,
  };
}
