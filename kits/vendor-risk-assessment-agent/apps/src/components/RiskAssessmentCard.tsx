import React from 'react';
import {
  ShieldAlert,
  Shield,
  FileCheck,
  DollarSign,
  Cpu,
  Scale,
  Gauge,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';
import { RiskAssessment, RiskCategoryDetails } from '../types';
import { EmptyStateCard } from './EmptyStateCard';
import { renderItemContent, formatRiskLevel, formatRiskScore, formatEvidenceToBullets } from '../utils';
import { motion } from 'motion/react';

interface RiskAssessmentCardProps {
  assessment: RiskAssessment | null;
}

const getRiskLevelBadge = (level: string) => {
  const normalized = formatRiskLevel(level).toLowerCase();
  if (normalized.includes('very low')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
  }
  if (normalized.includes('low')) {
    return 'bg-blue-50 text-blue-800 border-blue-300 font-bold';
  }
  if (normalized.includes('mod') || normalized.includes('med')) {
    return 'bg-amber-50 text-amber-900 border-amber-300 font-bold';
  }
  if (normalized.includes('high')) {
    return 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
  }
  if (normalized.includes('crit')) {
    return 'bg-red-950 text-red-200 border-red-800 font-extrabold shadow-xs';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200 font-semibold';
};

const getCategoryIcon = (category: string) => {
  const catLower = category.toLowerCase();
  if (catLower.includes('security'))
    return <Shield className="h-4 w-4 text-blue-600" />;
  if (catLower.includes('compliance'))
    return <FileCheck className="h-4 w-4 text-emerald-600" />;
  if (catLower.includes('financial'))
    return <DollarSign className="h-4 w-4 text-amber-600" />;
  if (catLower.includes('operational'))
    return <Cpu className="h-4 w-4 text-purple-600" />;
  if (catLower.includes('legal'))
    return <Scale className="h-4 w-4 text-indigo-600" />;
  return <Info className="h-4 w-4 text-slate-500" />;
};

interface IndividualRiskCardProps {
  data: RiskCategoryDetails;
}

const IndividualRiskCard: React.FC<IndividualRiskCardProps> = ({ data }) => {
  const { numericScore } = formatRiskScore(data.score);
  const formattedLevel = formatRiskLevel(data.riskLevel);
  const evidenceBullets = formatEvidenceToBullets(data.evidence);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
    >
      <div className="space-y-4">
        {/* Header: Title + Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0">
              {getCategoryIcon(data.category)}
            </div>
            <h5 className="font-bold text-sm text-slate-900 truncate">{data.category}</h5>
          </div>

          {formattedLevel ? (
            <span
              className={`px-3 py-1 rounded-full text-xs border shrink-0 ${getRiskLevelBadge(
                formattedLevel
              )}`}
            >
              {formattedLevel}
            </span>
          ) : null}
        </div>

        {/* Score Progress Bar */}
        {numericScore !== null && (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 uppercase tracking-wider text-[11px]">Domain Risk Score</span>
              <span className="text-slate-900 font-mono font-black">{numericScore}/100</span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  numericScore <= 30
                    ? 'bg-emerald-500'
                    : numericScore <= 60
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(Math.max(numericScore, 0), 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Reason */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Reason & Analysis
          </span>
          <div className="text-xs text-slate-800 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-200/60 font-medium">
            {renderItemContent(data.reason) || (
              <span className="text-slate-400 italic font-normal">Not Provided</span>
            )}
          </div>
        </div>

        {/* Evidence formatted as bullet points */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Evidence & Findings
          </span>
          <div className="text-xs text-slate-700 leading-relaxed bg-blue-50/30 p-3 rounded-xl border border-blue-100/80">
            {evidenceBullets.length > 0 ? (
              <ul className="space-y-1.5">
                {evidenceBullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold shrink-0 mt-0.5">•</span>
                    <span className="flex-1 font-medium text-slate-800">{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-slate-400 italic font-normal">Not Provided</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({ assessment }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all"
    >
      {/* Card Header */}
      <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0 shadow-2xs">
            <Gauge className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Risk Category Assessment
            </h3>
            <p className="text-xs text-slate-500">
              Granular risk breakdown, domain scoring meters, reasons, and supporting evidence.
            </p>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 sm:p-7">
        {!assessment ? (
          <EmptyStateCard
            title="Risk Category Assessment Pending"
            description="Submit vendor details to run automated evaluation across security, compliance, financial, operational, and legal risk domains."
          />
        ) : (
          <div className="space-y-6">
            {/* Categories Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-slate-600" />
                  <span>Domain Risk Breakdown ({assessment.categories ? assessment.categories.length : 0} Categories)</span>
                </h4>
              </div>

              {assessment.categories && assessment.categories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {assessment.categories.map((cat, idx) => (
                    <IndividualRiskCard key={idx} data={cat} />
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-400 italic text-center">
                  Not Provided / No risk category data extracted.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
