import React from 'react';
import { motion } from 'framer-motion';

interface StatusTimelineProps {
  units: any[];
  downtimeData: any[]; // ccr_downtime_data
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({ units, downtimeData }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const totalMinutes = 1440;

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('breakdown') || s.includes('stop') || s.includes('unplanned'))
      return 'bg-gradient-to-r from-rose-500 to-rose-400';
    if (s.includes('idle') || s.includes('waiting') || s.includes('planned'))
      return 'bg-gradient-to-r from-amber-400 to-orange-400';
    return 'bg-gradient-to-r from-emerald-500 to-teal-400';
  };

  return (
    <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200">
      <div className="min-w-[900px]">
        {/* Time Labels */}
        <div className="flex mb-6 border-b border-slate-100 pb-3">
          <div className="w-28 shrink-0 flex items-end">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-2">
              Timeline Unit
            </span>
          </div>
          <div className="flex-1 flex justify-between px-2">
            {hours.map((h) => (
              <div key={h} className="flex flex-col items-center">
                <div className="w-px h-1.5 bg-slate-200 mb-1" />
                <div className="text-[10px] font-black text-slate-400 tabular-nums">
                  {String(h).padStart(2, '0')}
                </div>
              </div>
            ))}
            <div className="flex flex-col items-center">
              <div className="w-px h-1.5 bg-slate-200 mb-1" />
              <div className="text-[10px] font-black text-slate-400 tabular-nums">00</div>
            </div>
          </div>
        </div>

        {/* Unit Timelines */}
        <div className="space-y-6 pt-2">
          {units.map((unit) => {
            const unitDowntime = downtimeData.filter((d) => d.plant_unit === unit.unit);

            return (
              <div key={unit.id} className="flex items-center group/row">
                <div className="w-28 shrink-0 pr-4">
                  <div className="text-[10px] font-black text-slate-700 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl shadow-sm text-center group-hover/row:border-red-500/30 group-hover/row:text-red-600 transition-all uppercase truncate">
                    {unit.unit}
                  </div>
                </div>
                <div className="flex-1 h-10 bg-emerald-50/50 rounded-2xl relative overflow-hidden border border-emerald-100/50 shadow-inner group/timeline">
                  {/* Normal Running Background Overlay */}
                  <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />

                  {/* Overlay downtime segments */}
                  {unitDowntime.map((dt, idx) => {
                    const [h, m] = (dt.start_time || '00:00').split(':').map(Number);
                    const startMin = h * 60 + m;
                    const duration = parseFloat(dt.duration) || 0;

                    const left = (startMin / totalMinutes) * 100;
                    const width = (duration / totalMinutes) * 100;

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ duration: 0.6, delay: idx * 0.05, ease: 'circOut' }}
                        style={{ left: `${left}%`, width: `${width}%`, originX: 0 }}
                        className={`absolute top-0 h-full ${getStatusColor(dt.status)} border-x border-white/20 flex items-center justify-center group/segment cursor-help shadow-lg`}
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/segment:block z-50">
                          <div className="bg-slate-900/95 backdrop-blur-xl text-white text-[10px] py-2 px-4 rounded-[1.2rem] shadow-2xl border border-white/10 whitespace-nowrap">
                            <div className="flex items-center gap-3 mb-2 border-b border-white/10 pb-2">
                              <span className="font-black text-rose-400 uppercase tracking-tighter">
                                {dt.status}
                              </span>
                              <span className="text-slate-400 font-bold tabular-nums">
                                {dt.start_time} • {duration}m
                              </span>
                            </div>
                            <div className="max-w-[200px] whitespace-normal italic text-slate-300 font-medium">
                              "{dt.remarks || 'No remarks provided'}"
                            </div>
                          </div>
                          <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-10 flex items-center gap-8 px-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">
            <div className="w-2 h-2 rounded-full bg-slate-300" /> Legend
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">
              Normal Running
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 shadow-sm" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">
              Idle / Standby
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-400 shadow-sm" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">
              Breakdown / Stop
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusTimeline;
