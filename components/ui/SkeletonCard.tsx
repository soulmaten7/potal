import React from 'react';

export function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg h-[220px] flex animate-pulse">
      <div className="w-[140px] shrink-0 border-r border-slate-100 bg-slate-50"></div>
      <div className="flex-1 p-5 flex flex-col gap-4 border-r border-slate-100">
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-slate-200 rounded"></div>
          <div className="h-4 w-12 bg-slate-200 rounded"></div>
        </div>
        <div className="h-4 w-10 bg-slate-200 rounded"></div>
        <div className="space-y-2 mt-2">
          <div className="h-4 w-full bg-slate-200 rounded"></div>
          <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
        </div>
      </div>
      <div className="w-[170px] p-4 flex flex-col gap-4">
        <div className="h-4 w-full bg-slate-200 rounded"></div>
        <div className="h-4 w-2/3 bg-slate-200 rounded ml-auto"></div>
        <div className="h-8 w-full bg-slate-200 rounded mt-auto"></div>
      </div>
    </div>
  );
}