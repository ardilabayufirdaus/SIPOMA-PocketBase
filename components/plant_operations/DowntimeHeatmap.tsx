import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface DowntimeHeatmapProps {
  units: any[];
  downtimeData: any[];
}

const DowntimeHeatmap: React.FC<DowntimeHeatmapProps> = ({ units, downtimeData }) => {
  const heatmapData = useMemo(() => {
    // 24 hours x units
    const data: Record<string, number[]> = {};

    units.forEach((unit) => {
      data[unit.unit] = new Array(24).fill(0);
    });

    downtimeData.forEach((record) => {
      // In ccr_downtime_data, the field is 'unit'
      const unitId = record.unit;
      if (!data[unitId]) return;

      // Extract hour from start_time (formatted as HH:MM)
      let hour = 0;
      if (record.start_time && record.start_time.includes(':')) {
        hour = parseInt(record.start_time.split(':')[0], 10);
      } else {
        const dateObj = new Date(record.date);
        hour = dateObj.getHours();
      }

      if (hour >= 0 && hour < 24) {
        data[unitId][hour] += parseFloat(record.duration_minutes || record.duration) || 0;
      }
    });

    return data;
  }, [units, downtimeData]);

  const getColor = (minutes: number) => {
    if (minutes === 0) return 'bg-slate-100 dark:bg-slate-800/50';
    if (minutes < 15) return 'bg-orange-200 dark:bg-orange-900/30';
    if (minutes < 30) return 'bg-orange-400 dark:bg-orange-700/50';
    if (minutes < 60) return 'bg-red-500 dark:bg-red-800/70';
    return 'bg-red-700 dark:bg-red-950';
  };

  return (
    <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200">
      <div className="min-w-[800px]">
        {/* X-Axis Labels (Hours) */}
        <div className="flex mb-2 ml-24">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 text-[9px] font-bold text-slate-400 text-center uppercase tracking-tighter"
            >
              {String(i).padStart(2, '0')}h
            </div>
          ))}
        </div>

        {/* Heatmap Rows */}
        <div className="space-y-1">
          {units.map((unit) => (
            <div key={unit.unit} className="flex items-center group">
              <div className="w-24 pr-4 text-xs font-black text-slate-600 dark:text-slate-400 truncate text-right uppercase tracking-tighter">
                {unit.unit}
              </div>
              <div className="flex-1 flex gap-1">
                {heatmapData[unit.unit]?.map((val, hour) => (
                  <motion.div
                    key={hour}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: hour * 0.01 }}
                    className={`flex-1 h-8 rounded-sm ${getColor(val)} transition-all hover:ring-2 hover:ring-ubuntu-orange relative group/tile`}
                  >
                    {val > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[9px] rounded-lg opacity-0 group-hover/tile:opacity-100 pointer-events-none z-50 whitespace-nowrap shadow-xl">
                        {val.toFixed(1)} min downtime
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-end gap-4 px-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Legend:
        </span>
        {[
          { label: 'None', color: 'bg-slate-100 dark:bg-slate-800/50' },
          { label: '<15m', color: 'bg-orange-200 dark:bg-orange-900/30' },
          { label: '30m+', color: 'bg-orange-400 dark:bg-orange-700/50' },
          { label: '60m+', color: 'bg-red-500 dark:bg-red-800/70' },
          { label: 'Critical', color: 'bg-red-700 dark:bg-red-950' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${item.color}`} />
            <span className="text-[9px] font-black text-slate-500 uppercase">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DowntimeHeatmap;
