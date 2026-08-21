import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Risk Score Hero Skeleton */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="h-20 w-20 rounded-2xl bg-slate-800 shrink-0" />
            <div className="space-y-3 flex-1">
              <div className="h-4 w-32 bg-slate-800 rounded" />
              <div className="h-7 w-48 bg-slate-800 rounded" />
              <div className="h-3 w-64 bg-slate-800 rounded" />
            </div>
          </div>
          <div className="h-10 w-36 bg-slate-800 rounded-xl shrink-0" />
        </div>
      </div>

      {/* Main Cards Skeletons */}
      <div className="space-y-6">
        {/* Vendor Info Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-100" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-64 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="md:col-span-2 h-20 bg-slate-100 rounded-xl" />
            <div className="h-28 bg-slate-50 rounded-xl border border-slate-100" />
            <div className="h-28 bg-slate-50 rounded-xl border border-slate-100" />
            <div className="h-28 bg-slate-50 rounded-xl border border-slate-100" />
            <div className="h-28 bg-slate-50 rounded-xl border border-slate-100" />
          </div>
        </div>

        {/* Risk Assessment Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-100" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-64 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="h-44 bg-slate-50 rounded-2xl border border-slate-100" />
            <div className="h-44 bg-slate-50 rounded-2xl border border-slate-100" />
            <div className="h-44 bg-slate-50 rounded-2xl border border-slate-100" />
          </div>
        </div>

        {/* Recommendations Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-100" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-64 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="h-20 bg-slate-50 rounded-2xl border border-slate-100" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-36 bg-slate-50 rounded-2xl border border-slate-100" />
            <div className="h-36 bg-slate-50 rounded-2xl border border-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
};
