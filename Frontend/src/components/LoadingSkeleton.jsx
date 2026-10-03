import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3.5 px-4 bg-white rounded-xl border border-slate-100">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/6"></div>
          <div className="h-4 bg-slate-200 rounded w-1/6"></div>
          <div className="h-4 bg-slate-200 rounded w-1/6"></div>
          <div className="h-4 bg-slate-200 rounded w-1/6 ml-auto"></div>
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
            <div className="w-12 h-4 bg-slate-200 rounded"></div>
          </div>
          <div className="h-7 bg-slate-200 rounded w-1/2"></div>
          <div className="h-3 bg-slate-200 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );
};
