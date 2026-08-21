import React from 'react';
import { ShieldCheck, ShieldAlert, AlertOctagon, Activity, Sparkles, CheckCircle, Info } from 'lucide-react';
import { RiskAssessment } from '../types';
import { formatRiskLevel, formatRiskScore } from '../utils';
import { motion } from 'motion/react';

interface RiskScoreHeroCardProps {
  assessment: RiskAssessment | null;
  vendorName?: string;
}

export const RiskScoreHeroCard: React.FC<RiskScoreHeroCardProps> = ({
  assessment,
  vendorName,
}) => {
  if (!assessment) return null;

  const { numericScore } = formatRiskScore(assessment.overallRiskScore);
  const rawLevel = formatRiskLevel(assessment.overallRiskLevel);
  const normalizedLevel = rawLevel.toLowerCase();

  // Determine risk category config
  let levelTitle = 'Moderate';
  let badgeClasses = 'bg-amber-500 text-slate-950 border-amber-600';
  let cardBorder = 'border-amber-500/30';
  let glowColor = 'from-amber-500/10 via-slate-900 to-slate-900';
  let ringColor = 'text-amber-500';
  let IconComponent = ShieldAlert;
  let explanationText =
    'This vendor exhibits a moderate security risk profile. Ongoing monitoring and standard contractual safeguards are advised.';

  if (normalizedLevel.includes('very low') || (numericScore !== null && numericScore <= 15)) {
    levelTitle = 'Very Low Risk';
    badgeClasses = 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-emerald-500/20';
    cardBorder = 'border-emerald-500/30';
    glowColor = 'from-emerald-950/80 via-slate-900 to-slate-950';
    ringColor = 'text-emerald-400';
    IconComponent = ShieldCheck;
    explanationText =
      'Outstanding posture! This vendor demonstrates industry-leading security controls, comprehensive compliance, and minimal operational risk.';
  } else if (normalizedLevel.includes('low') || (numericScore !== null && numericScore <= 35)) {
    levelTitle = 'Low Risk';
    badgeClasses = 'bg-blue-500 text-white font-bold border-blue-400 shadow-blue-500/20';
    cardBorder = 'border-blue-500/30';
    glowColor = 'from-blue-950/80 via-slate-900 to-slate-950';
    ringColor = 'text-blue-400';
    IconComponent = CheckCircle;
    explanationText =
      'Favorable risk profile! Key security controls and compliance certifications are present with minimal gaps.';
  } else if (
    normalizedLevel.includes('mod') ||
    normalizedLevel.includes('med') ||
    (numericScore !== null && numericScore <= 60)
  ) {
    levelTitle = 'Moderate Risk';
    badgeClasses = 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-amber-500/20';
    cardBorder = 'border-amber-500/30';
    glowColor = 'from-amber-950/80 via-slate-900 to-slate-950';
    ringColor = 'text-amber-400';
    IconComponent = Activity;
    explanationText =
      'Moderate risk identified. Specific security controls or compliance documentations require contractual review or remediation.';
  } else if (normalizedLevel.includes('high') || (numericScore !== null && numericScore <= 85)) {
    levelTitle = 'High Risk';
    badgeClasses = 'bg-rose-600 text-white font-bold border-rose-500 shadow-rose-600/20';
    cardBorder = 'border-rose-500/40';
    glowColor = 'from-rose-950/90 via-slate-900 to-slate-950';
    ringColor = 'text-rose-500';
    IconComponent = ShieldAlert;
    explanationText =
      'Elevated risk exposure! Significant missing security controls or legal non-compliance require immediate mitigation before onboarding.';
  } else if (normalizedLevel.includes('crit') || (numericScore !== null && numericScore > 85)) {
    levelTitle = 'Critical Risk';
    badgeClasses = 'bg-red-950 text-red-200 font-extrabold border-red-700 ring-2 ring-red-600/50 shadow-xl';
    cardBorder = 'border-red-600/60';
    glowColor = 'from-red-950 via-slate-950 to-slate-950';
    ringColor = 'text-red-500';
    IconComponent = AlertOctagon;
    explanationText =
      'CRITICAL EXPOSURE WARNING! Major security vulnerabilities, missing SOC 2 audit, or severe legal liabilities detected. Executive review mandatory.';
  } else if (rawLevel) {
    levelTitle = `${rawLevel} Risk`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${glowColor} text-white border ${cardBorder} shadow-lg p-6 sm:p-7`}
    >
      {/* Decorative subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        {/* Left Info Column */}
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Overall Security Risk Score</span>
            {vendorName && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-200 truncate font-mono">{vendorName}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {levelTitle}
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider shadow-md border ${badgeClasses}`}
            >
              <IconComponent className="h-4 w-4" />
              <span>{levelTitle}</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-normal">
            {explanationText}
          </p>
        </div>

        {/* Right Numeric Badge / Score Gauge */}
        <div className="flex items-center justify-center lg:justify-end shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
          <div className="bg-slate-900/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-800 flex items-center gap-5 shadow-inner">
            {numericScore !== null ? (
              <div className="relative flex items-center justify-center h-20 w-20 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
                <div className="text-center">
                  <span className="text-3xl font-black text-white font-mono tracking-tighter">
                    {numericScore}
                  </span>
                  <span className="text-[10px] block text-slate-400 font-bold uppercase tracking-widest -mt-1">
                    / 100
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 text-xs font-mono">
                N/A
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Risk Rating Scale
              </span>
              <div className="text-xs font-semibold text-slate-200">
                {numericScore !== null ? (
                  numericScore <= 30 ? (
                    <span className="text-emerald-400 font-bold">0 - 30 (Low Exposure)</span>
                  ) : numericScore <= 60 ? (
                    <span className="text-amber-400 font-bold">31 - 60 (Moderate Exposure)</span>
                  ) : (
                    <span className="text-rose-400 font-bold">61 - 100 (High Exposure)</span>
                  )
                ) : (
                  <span>Assessed Profile</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Lower score indicates better security posture.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
