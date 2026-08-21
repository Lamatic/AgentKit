import React from 'react';
import { ShieldAlert, FileClock, Info } from 'lucide-react';

interface EmptyStateCardProps {
  title?: string;
  description?: string;
  compact?: boolean;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  title = 'No Assessment Data Available',
  description = 'Analysis results will appear here after the vendor assessment is completed.',
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-500 text-xs">
        <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-medium text-slate-600 block mb-0.5">{title}</span>
          <p className="text-slate-400">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200">
      <div className="h-12 w-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mb-3.5 shadow-2xs">
        <FileClock className="h-6 w-6" />
      </div>
      <h4 className="text-sm font-medium text-slate-700 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <ShieldAlert className="h-3 w-3 text-slate-400" />
        <span>Pending Vendor Input</span>
      </div>
    </div>
  );
};
