import React from 'react';

const CcrTableSkeleton: React.FC = () => {
  return (
    <div className="ccr-table-container">
      <div className="ccr-table-wrapper">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="bg-slate-200 h-16 w-full mb-2"></div>

          {/* Body Skeleton */}
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <div className="bg-slate-100 h-12 w-20"></div>
              <div className="bg-slate-100 h-12 w-32"></div>
              <div className="bg-slate-100 h-12 w-48"></div>
              {Array.from({ length: 6 }, (_, j) => (
                <div key={j} className="bg-slate-100 h-12 w-40"></div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="ccr-table-footer-container">
        <div className="animate-pulse">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <div className="bg-slate-200 h-10 w-80"></div>
              {Array.from({ length: 6 }, (_, j) => (
                <div key={j} className="bg-slate-200 h-10 w-40"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CcrTableSkeleton;

