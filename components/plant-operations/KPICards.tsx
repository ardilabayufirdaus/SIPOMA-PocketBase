import React from 'react';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

interface DashboardKPI {
  id: string;
  title: string;
  value: number | string;
  unit: string;
  trend: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  status: 'normal' | 'warning' | 'critical';
  target?: number;
}

interface KPICardsProps {
  kpis: DashboardKPI[];
  isLoading: boolean;
}

const KPICards: React.FC<KPICardsProps> = ({ kpis, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 animate-pulse"
          >
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-6">
      {kpis.map((kpi) => (
        <div key={kpi.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">{kpi.icon}</div>
            <div
              className={`flex items-center gap-1 text-sm ${
                kpi.trend.isPositive ? 'text-green-600' : '!text-red-600'
              }`}
            >
              {kpi.trend.isPositive ? (
                <TrendingUpIcon className="w-4 h-4" />
              ) : (
                <TrendingDownIcon className="w-4 h-4" />
              )}
              {kpi.trend.value}%
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-medium text-slate-600">{kpi.title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{kpi.value}</span>
              <span className="text-sm text-slate-500">{kpi.unit}</span>
            </div>
            {kpi.target && (
              <div className="text-xs text-slate-500">
                Target: {kpi.target} {kpi.unit}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
