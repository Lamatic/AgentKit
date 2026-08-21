import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText, Share2 } from 'lucide-react';
import { AssessmentData } from '../types';
import { formatRiskLevel, formatRiskScore } from '../utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AssessmentData | null;
}

function stringifyField(field: any): string {
  if (field === null || field === undefined) return 'N/A';
  if (typeof field === 'string' || typeof field === 'number') return String(field);
  if (Array.isArray(field)) {
    return field
      .map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item)))
      .join(', ');
  }
  if (typeof field === 'object') return JSON.stringify(field);
  return String(field);
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const vendorName = stringifyField(
    data.vendorInfo?.vendorName || data.vendorInfo?.vendor_name || 'Vendor'
  );
  const overallLevel = formatRiskLevel(data.riskAssessment?.overallRiskLevel);
  const overallScoreObj = formatRiskScore(data.riskAssessment?.overallRiskScore);
  const scoreText = overallScoreObj.displayScoreString
    ? `${overallScoreObj.displayScoreString}/100`
    : 'N/A';

  const categoriesText =
    data.riskAssessment?.categories && data.riskAssessment.categories.length > 0
      ? data.riskAssessment.categories
          .map((c) => {
            const scoreObj = formatRiskScore(c.score);
            const scoreStr = scoreObj.displayScoreString ? ` (Score: ${scoreObj.displayScoreString}/100)` : '';
            return `- ${c.category}: ${formatRiskLevel(c.riskLevel)}${scoreStr}\n  Reason: ${stringifyField(c.reason)}\n  Evidence: ${stringifyField(c.evidence)}`;
          })
          .join('\n\n')
      : 'No category details provided.';

  const certsText = stringifyField(data.vendorInfo?.certifications);
  const secControlsText = stringifyField(
    data.vendorInfo?.securityControls || data.vendorInfo?.security_controls
  );
  const complianceText = stringifyField(data.vendorInfo?.compliance);
  const financialText = stringifyField(
    data.vendorInfo?.financialInformation || data.vendorInfo?.financial_information
  );
  const operationalText = stringifyField(
    data.vendorInfo?.operationalInformation || data.vendorInfo?.operational_information
  );
  const legalText = stringifyField(
    data.vendorInfo?.legalInformation || data.vendorInfo?.legal_information
  );

  const execSummary = stringifyField(data.recommendations?.executiveSummary);
  const priorityActionsText =
    data.recommendations?.priorityActions && data.recommendations.priorityActions.length > 0
      ? data.recommendations.priorityActions.map((a) => `- ${stringifyField(a)}`).join('\n')
      : 'None provided';

  const textSummary = `VENDOR RISK ASSESSMENT REPORT
Vendor: ${vendorName}
Overall Risk Level: ${overallLevel} (Score: ${scoreText})

1. VENDOR INFORMATION
- Certifications: ${certsText}
- Security Controls: ${secControlsText}
- Compliance: ${complianceText}
- Financials: ${financialText}
- Operational: ${operationalText}
- Legal: ${legalText}

2. DOMAIN RISK BREAKDOWN
${categoriesText}

3. EXECUTIVE SUMMARY
${execSummary}

4. PRIORITY ACTION ITEMS
${priorityActionsText}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(textSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([textSummary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${vendorName.replace(/\s+/g, '_')}_Risk_Assessment.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Export Assessment Summary
              </h3>
              <p className="text-xs text-slate-500">
                Ready for distribution to Security & Procurement stakeholders
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-6">
          <div className="bg-slate-900 text-slate-200 font-mono text-xs p-4 rounded-xl h-64 overflow-y-auto leading-relaxed border border-slate-800 selection:bg-blue-500 selection:text-white">
            <pre className="whitespace-pre-wrap">{textSummary}</pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            <span>Plaintext & PDF format support</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy Report</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
