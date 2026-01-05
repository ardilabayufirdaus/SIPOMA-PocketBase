import React, { useMemo } from 'react';

export interface OperatorRanking {
  category: string;
  operatorName: string;
  operatorId: string;
  overallAchievement: number;
  totalParameters: number;
  rank: number;
  totalChecks: number;
  totalInRange: number;
  breakdownData: {
    parameterName: string;
    totalChecks: number;
    inRangeCount: number;
    achievementPercentage: number;
    min: number;
    max: number;
  }[];
}

interface RankCardProps {
  operator: OperatorRanking;
  onClick: () => void;
}

const RankCard: React.FC<RankCardProps> = ({ operator, onClick }) => {
  // Theme configuration based on Rank
  const rankTheme = useMemo(() => {
    switch (operator.rank) {
      case 1:
        return {
          bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
          border: 'border-amber-400',
          shadow: 'shadow-amber-200/50',
          title: 'text-amber-800',
          badge:
            'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-500/30',
          icon: '🥇',
          iconBg: 'bg-amber-100',
          glow: 'after:absolute after:inset-0 after:rounded-2xl after:shadow-[0_0_40px_rgba(251,191,36,0.2)] after:pointer-events-none',
          progressColor: 'bg-amber-500',
        };
      case 2:
        return {
          bg: 'bg-gradient-to-br from-slate-50 to-gray-50',
          border: 'border-slate-300',
          shadow: 'shadow-slate-200/50',
          title: 'text-slate-800',
          badge:
            'bg-gradient-to-r from-slate-400 to-gray-500 text-white shadow-lg shadow-slate-500/30',
          icon: '🥈',
          iconBg: 'bg-slate-100',
          glow: '',
          progressColor: 'bg-slate-500',
        };
      case 3:
        return {
          bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
          border: 'border-orange-300',
          shadow: 'shadow-orange-200/50',
          title: 'text-orange-900',
          badge:
            'bg-gradient-to-r from-orange-400 to-amber-600 text-white shadow-lg shadow-orange-500/30',
          icon: '🥉',
          iconBg: 'bg-orange-100',
          glow: '',
          progressColor: 'bg-orange-500',
        };
      default:
        return {
          bg: 'bg-white',
          border: 'border-slate-200',
          shadow: 'shadow-slate-100',
          title: 'text-slate-700',
          badge: 'bg-slate-100 text-slate-600',
          icon: '🏅',
          iconBg: 'bg-slate-50',
          glow: '',
          progressColor: 'bg-slate-400',
        };
    }
  }, [operator.rank]);

  const isPodium = operator.rank <= 3;

  return (
    <div
      className={`relative group rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        rankTheme.bg
      } ${rankTheme.border} ${rankTheme.shadow} ${rankTheme.glow} ${
        operator.rank === 1 ? 'z-10 scale-[1.02] md:scale-105' : 'z-0'
      } cursor-pointer`}
      onClick={onClick}
    >
      {/* Rank Badge */}
      <div className="absolute -top-4 -right-2 flex flex-col items-center">
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg ring-4 ring-white ${rankTheme.badge}`}
        >
          {operator.rank}
        </div>
      </div>

      {/* Category Tag */}
      {isPodium && (
        <div className="absolute top-4 left-4">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/60 text-slate-500 border border-slate-100/50 backdrop-blur-sm">
            {operator.category}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex flex-col items-center text-center h-full">
        {/* Avatar / Icon Placeholder */}
        <div
          className={`mt-2 mb-4 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
            rankTheme.iconBg
          } ${operator.rank === 1 ? 'w-20 h-20 text-5xl' : 'w-16 h-16 text-4xl'}`}
        >
          {rankTheme.icon}
        </div>

        {/* Name */}
        <h3
          className={`font-bold leading-tight mb-2 line-clamp-2 ${
            operator.rank === 1 ? 'text-xl' : 'text-lg'
          } ${rankTheme.title}`}
        >
          {operator.operatorName}
        </h3>

        {/* Achievement Bar */}
        <div className="w-full mt-2 mb-4 space-y-1.5">
          <div className="flex justify-between items-end text-xs font-semibold text-slate-500">
            <span>Achievement</span>
            <span className={rankTheme.title}>{operator.overallAchievement}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${rankTheme.progressColor}`}
              style={{ width: `${operator.overallAchievement}%` }}
            ></div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="w-full grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-slate-200/60">
          <div className="flex flex-col items-center p-2 rounded-lg bg-white/50 border border-slate-100">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Parameters
            </span>
            <span className="text-sm font-bold text-slate-700">{operator.totalParameters}</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-white/50 border border-slate-100">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              In Range
            </span>
            <span className="text-sm font-bold text-slate-700">
              {operator.totalInRange}/{operator.totalChecks}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankCard;
