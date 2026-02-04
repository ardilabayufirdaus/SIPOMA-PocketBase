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
  // Ubuntu Theme configuration based on Rank
  const rankTheme = useMemo(() => {
    switch (operator.rank) {
      case 1:
        return {
          bg: 'bg-white',
          border: 'border-[#E95420]', // Ubuntu Orange
          shadow: 'shadow-lg shadow-[#E95420]/20 hover:shadow-[#E95420]/30',
          title: 'text-[#E95420]',
          badge: 'bg-[#E95420] text-white shadow-md shadow-[#E95420]/40',
          icon: '🥇',
          iconBg: 'bg-[#E95420]/10',
          glow: 'after:absolute after:inset-0 after:rounded-2xl after:shadow-[0_0_20px_rgba(233,84,32,0.15)] after:pointer-events-none',
          progressTrack: 'bg-[#E95420]/20',
          progressColor: 'bg-[#E95420]',
        };
      case 2:
        return {
          bg: 'bg-white',
          border: 'border-[#772953]', // Ubuntu Aubergine
          shadow: 'shadow-md shadow-[#772953]/10 hover:shadow-[#772953]/20',
          title: 'text-[#772953]',
          badge: 'bg-[#772953] text-white shadow-md shadow-[#772953]/30',
          icon: '🥈',
          iconBg: 'bg-[#772953]/10',
          glow: '',
          progressTrack: 'bg-[#772953]/20',
          progressColor: 'bg-[#772953]',
        };
      case 3:
        return {
          bg: 'bg-white',
          border: 'border-[#AEA79F]', // Ubuntu Warm Grey
          shadow: 'shadow-sm shadow-[#AEA79F]/20 hover:shadow-[#AEA79F]/30',
          title: 'text-[#333333]', // Cool Grey
          badge: 'bg-[#AEA79F] text-white shadow-md shadow-[#AEA79F]/30',
          icon: '🥉',
          iconBg: 'bg-[#AEA79F]/20',
          glow: '',
          progressTrack: 'bg-[#AEA79F]/30',
          progressColor: 'bg-[#AEA79F]',
        };
      default:
        return {
          bg: 'bg-white',
          border: 'border-slate-200',
          shadow: 'shadow-sm hover:shadow-md',
          title: 'text-slate-700',
          badge: 'bg-slate-200 text-slate-600',
          icon: '🏅',
          iconBg: 'bg-slate-100',
          glow: '',
          progressTrack: 'bg-slate-100',
          progressColor: 'bg-slate-400',
        };
    }
  }, [operator.rank]);

  const isPodium = operator.rank <= 3;

  return (
    <div
      className={`relative group rounded-xl border-2 transition-all duration-300 hover:-translate-y-1 ${
        rankTheme.bg
      } ${rankTheme.border} ${rankTheme.shadow} ${rankTheme.glow} ${
        operator.rank === 1 ? 'z-10 scale-[1.02] md:scale-105' : 'z-0'
      } cursor-pointer`}
      onClick={onClick}
    >
      {/* Rank Badge */}
      <div className="absolute -top-4 -right-2 flex flex-col items-center z-20">
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg ring-4 ring-white ${rankTheme.badge}`}
        >
          {operator.rank}
        </div>
      </div>

      {/* Category Tag */}
      {isPodium && (
        <div className="absolute top-4 left-4 z-20">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
            {operator.category}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex flex-col items-center text-center h-full relative z-10">
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
          style={{ fontFamily: 'Ubuntu, sans-serif' }}
        >
          {operator.operatorName}
        </h3>

        {/* Achievement Bar */}
        <div className="w-full mt-2 mb-4 space-y-1.5">
          <div className="flex justify-between items-end text-xs font-semibold text-slate-500">
            <span>Achievement</span>
            <span className={rankTheme.title}>{operator.overallAchievement}%</span>
          </div>
          <div className={`w-full h-2.5 rounded-full overflow-hidden ${rankTheme.progressTrack}`}>
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${rankTheme.progressColor}`}
              style={{ width: `${operator.overallAchievement}%` }}
            ></div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="w-full grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-slate-100">
          <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50/50 border border-slate-100">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Parameters
            </span>
            <span className="text-sm font-bold text-slate-700">{operator.totalParameters}</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50/50 border border-slate-100">
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
