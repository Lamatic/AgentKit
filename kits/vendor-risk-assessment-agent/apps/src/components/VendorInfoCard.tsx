import React from 'react';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Activity,
  Scale,
  AlertTriangle,
  Building,
  Check,
  XCircle,
  FileText,
  Info,
} from 'lucide-react';
import { VendorInformation } from '../types';
import { EmptyStateCard } from './EmptyStateCard';
import { renderItemContent, formatEnterpriseLabel } from '../utils';
import { motion } from 'motion/react';

interface VendorInfoCardProps {
  info: VendorInformation | null;
}

export const VendorInfoCard: React.FC<VendorInfoCardProps> = ({ info }) => {
  if (!info) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0 shadow-2xs">
              <Building className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Vendor Information Profile
              </h3>
              <p className="text-xs text-slate-500">
                Extracted operational profile, security controls, and compliance certifications.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 sm:p-7">
          <EmptyStateCard
            title="Vendor Profile Pending"
            description="Submit vendor documentation to extract Name, Certifications, Security Controls Table, Compliance Chips, Financial, Operational, Legal, and Missing Information."
          />
        </div>
      </div>
    );
  }

  // Exact mapping from response.result.vendor_information
  const vendorName = info.vendor_name ?? info.vendorName;
  const certifications = info.certifications;
  const securityControls = info.security_controls ?? info.securityControls;
  const compliance = info.compliance;
  const financialInformation = info.financial_information ?? info.financialInformation;
  const operationalInformation = info.operational_information ?? info.operationalInformation;
  const legalInformation = info.legal_information ?? info.legalInformation;
  const missingInformation = info.missing_information ?? info.missingInformation;

  const isNotProvided = (val: any) =>
    val === undefined ||
    val === null ||
    val === '' ||
    (Array.isArray(val) && val.length === 0) ||
    (typeof val === 'string' && (val.trim().toLowerCase() === 'not provided' || val.trim() === '[]'));

  // Normalize array elements or return ['Not Provided']
  const normalizeList = (val: any): any[] => {
    if (isNotProvided(val)) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      if (val.includes(',')) return val.split(',').map((s) => s.trim());
      return [val];
    }
    return [val];
  };

  const certList = normalizeList(certifications);
  const compList = normalizeList(compliance);
  const secControlList = normalizeList(securityControls);
  const missingList = normalizeList(missingInformation);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all"
    >
      {/* Header */}
      <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0 shadow-2xs">
            <Building className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Vendor Information Profile
            </h3>
            <p className="text-xs text-slate-500">
              Verified corporate profile, compliance standards, and evaluated controls.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          Data Verified
        </span>
      </div>

      {/* Body */}
      <div className="p-6 sm:p-7 space-y-6">
        {/* Vendor Name Header Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50/40 p-5 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
              {!isNotProvided(vendorName)
                ? String(typeof vendorName === 'object' ? JSON.stringify(vendorName) : vendorName)
                    .charAt(0)
                    .toUpperCase()
                : 'V'}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                Target Vendor Entity
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 leading-tight mt-0.5">
                {!isNotProvided(vendorName) ? (
                  renderItemContent(vendorName)
                ) : (
                  <span className="text-slate-400 italic font-medium">Not Provided</span>
                )}
              </h4>
            </div>
          </div>
        </div>

        {/* Certifications & Compliance Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Certifications as Badges */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Award className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                  <span>Certifications & Accreditations</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {certList.length} Found
                </span>
              </div>

              {certList.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {certList.map((cert: any, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs"
                    >
                      <Award className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>{renderItemContent(cert)}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-slate-200/60 text-xs text-slate-400 italic">
                  Not Provided
                </div>
              )}
            </div>
          </div>

          {/* Compliance as Chips */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                  <span>Compliance Frameworks</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {compList.length} Active
                </span>
              </div>

              {compList.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {compList.map((comp: any, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{renderItemContent(comp)}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-slate-200/60 text-xs text-slate-400 italic">
                  Not Provided
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Controls Table */}
        <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="h-4.5 w-4.5 text-blue-600 shrink-0" />
              <span>Evaluated Security Controls</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {secControlList.length} Controls
            </span>
          </div>

          {secControlList.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Control / Safeguard Specification</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {secControlList.map((ctrl: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-slate-400 w-10">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">
                        {renderItemContent(ctrl)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Check className="h-3 w-3 text-blue-600" />
                          Implemented
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-3 bg-white rounded-xl border border-slate-200/60 text-xs text-slate-400 italic">
              Not Provided
            </div>
          )}
        </div>

        {/* Financial, Operational, Legal Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Financial Info */}
          <div className="p-4.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Financial Health & Viability</span>
            </div>
            <div className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200/60">
              {!isNotProvided(financialInformation) ? (
                renderItemContent(financialInformation)
              ) : (
                <span className="text-slate-400 italic font-normal">Not Provided</span>
              )}
            </div>
          </div>

          {/* Operational Info */}
          <div className="p-4.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Activity className="h-4 w-4 text-purple-600 shrink-0" />
              <span>Operational Resilience</span>
            </div>
            <div className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200/60">
              {!isNotProvided(operationalInformation) ? (
                renderItemContent(operationalInformation)
              ) : (
                <span className="text-slate-400 italic font-normal">Not Provided</span>
              )}
            </div>
          </div>

          {/* Legal Info */}
          <div className="p-4.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Scale className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>Legal & Regulatory Standing</span>
            </div>
            <div className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200/60">
              {!isNotProvided(legalInformation) ? (
                renderItemContent(legalInformation)
              ) : (
                <span className="text-slate-400 italic font-normal">Not Provided</span>
              )}
            </div>
          </div>
        </div>

        {/* Missing Information Section */}
        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
          <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
            <span>Information Gaps & Documentation Needed</span>
          </div>

          {missingList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {missingList.map((missing: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 bg-white/90 px-3.5 py-2.5 rounded-xl border border-amber-200/80 shadow-2xs text-xs font-medium text-amber-950"
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="flex-1 leading-tight">{renderItemContent(missing)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic font-normal">
              Not Provided / No information gaps identified.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
