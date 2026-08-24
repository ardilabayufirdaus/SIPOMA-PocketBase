import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClockIcon,
  PlusIcon,
  TrashIcon,
  SunIcon,
  MoonIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { EnhancedCard } from '../ui/EnhancedComponents';
import { TimeInput24h } from '../../pages/plant_operations/components/TimeInput24h';

export interface OperatingSession {
  id: string;
  name: string;
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  is_overnight: boolean; // True if ends next day (e.g., 21:00 to 06:00)
  downtime_hours: number;
  notes?: string;
}

interface DerivativeOperatingHoursCardProps {
  date: string;
  selectedUnit: string;
  canWrite?: boolean;
  downtimeRecords?: Array<{ start_time: string; end_time: string }>;
  totalDowntimeFromEvents?: number;
  onSyncTotalRunningHours?: (totalNetHours: number, hourlyMap?: Record<number, number>) => void;
  t?: Record<string, string>;
}

// Helper to convert HH:mm string to minutes from 00:00
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map((num) => parseInt(num, 10) || 0);
  return h * 60 + m;
};

// Helper to format minutes to decimal hours (e.g. 90 mins -> 1.5 hrs)
const minutesToDecimalHours = (mins: number): number => {
  return Math.round((mins / 60) * 100) / 100;
};

// Calculate duration for a session in hours
export const calculateSessionDuration = (
  startTime: string,
  endTime: string,
  isOvernight: boolean
): { grossHours: number; isValid: boolean; error?: string } => {
  if (!startTime || !endTime) {
    return { grossHours: 0, isValid: false, error: 'Waktu belum lengkap' };
  }

  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);

  if (isOvernight) {
    // Cross-day: (24*60 - startMins) + endMins
    const grossMins = 24 * 60 - startMins + endMins;
    if (grossMins <= 0 || grossMins > 24 * 60) {
      return { grossHours: 0, isValid: false, error: 'Durasi lintas hari melebihi 24 jam' };
    }
    return { grossHours: minutesToDecimalHours(grossMins), isValid: true };
  } else {
    // Same day: endMins - startMins
    if (endMins < startMins) {
      return {
        grossHours: 0,
        isValid: false,
        error: 'Jam stop lebih awal dari jam start. Centang "Lintas Hari" jika stop besok pagi.',
      };
    }
    const grossMins = endMins - startMins;
    return { grossHours: minutesToDecimalHours(grossMins), isValid: true };
  }
};

// Calculate downtime overlap for a specific shift interval from CCR Downtime Data
export const calculateDowntimeForInterval = (
  shiftStart: string,
  shiftStop: string,
  isOvernight: boolean,
  downtimeRecords?: Array<{ start_time: string; end_time: string }>
): number => {
  if (!downtimeRecords || downtimeRecords.length === 0) return 0;

  const shiftStartMins = timeToMinutes(shiftStart);
  let shiftEndMins = timeToMinutes(shiftStop);

  if (isOvernight) {
    shiftEndMins += 24 * 60;
  }

  let totalDowntimeMins = 0;

  for (const dt of downtimeRecords) {
    if (!dt.start_time || !dt.end_time) continue;
    const dtStartMins = timeToMinutes(dt.start_time);
    let dtEndMins = timeToMinutes(dt.end_time);

    // If downtime event crosses midnight (e.g., 23:30 to 01:30)
    if (dtEndMins < dtStartMins) {
      dtEndMins += 24 * 60;
    }

    // Overlap with [shiftStartMins, shiftEndMins]
    const overlapStart1 = Math.max(shiftStartMins, dtStartMins);
    const overlapEnd1 = Math.min(shiftEndMins, dtEndMins);
    if (overlapEnd1 > overlapStart1) {
      totalDowntimeMins += overlapEnd1 - overlapStart1;
    }

    // Also check shifted window (+24h) for overnight shifts
    const dtStart2 = dtStartMins + 24 * 60;
    const dtEnd2 = dtEndMins + 24 * 60;
    const overlapStart2 = Math.max(shiftStartMins, dtStart2);
    const overlapEnd2 = Math.min(shiftEndMins, dtEnd2);
    if (overlapEnd2 > overlapStart2) {
      totalDowntimeMins += overlapEnd2 - overlapStart2;
    }
  }

  return Math.round((totalDowntimeMins / 60) * 100) / 100;
};

export const getDefaultShiftSessions = (): OperatingSession[] => [
  {
    id: 'shift_3_cont',
    name: 'Shift 3 (Cont.)',
    start_time: '00:00',
    end_time: '07:00',
    is_overnight: false,
    downtime_hours: 0,
    notes: '00:00 - 07:00',
  },
  {
    id: 'shift_1',
    name: 'Shift 1',
    start_time: '07:00',
    end_time: '15:00',
    is_overnight: false,
    downtime_hours: 0,
    notes: '07:00 - 15:00',
  },
  {
    id: 'shift_2',
    name: 'Shift 2',
    start_time: '15:00',
    end_time: '23:00',
    is_overnight: false,
    downtime_hours: 0,
    notes: '15:00 - 23:00',
  },
  {
    id: 'shift_3',
    name: 'Shift 3',
    start_time: '23:00',
    end_time: '07:00',
    is_overnight: true,
    downtime_hours: 0,
    notes: '23:00 - 07:00 (Besok)',
  },
];

export const DerivativeOperatingHoursCard: React.FC<DerivativeOperatingHoursCardProps> = ({
  date,
  selectedUnit,
  canWrite = true,
  downtimeRecords = [],
  totalDowntimeFromEvents = 0,
  onSyncTotalRunningHours,
  t,
}) => {
  const localStorageKey = useMemo(
    () => `derivative_op_sessions_${selectedUnit}_${date}`,
    [selectedUnit, date]
  );

  // Sessions state
  const [sessions, setSessions] = useState<OperatingSession[]>(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return getDefaultShiftSessions();
  });

  // Sync state on unit or date change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        setSessions(JSON.parse(saved));
      } else {
        setSessions(getDefaultShiftSessions());
      }
    } catch {
      // fallback
    }
  }, [localStorageKey]);

  // Reset to 4 default shifts
  const handleResetDefaultShifts = () => {
    updateSessions(getDefaultShiftSessions());
  };

  // Save to LocalStorage whenever sessions change
  const updateSessions = (newSessions: OperatingSession[]) => {
    setSessions(newSessions);
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(newSessions));
    } catch {
      // ignore
    }
  };

  // Add session
  const handleAddSession = () => {
    const nextNum = sessions.length + 1;
    const newSess: OperatingSession = {
      id: `sess_${Date.now()}_${nextNum}`,
      name: `Sesi ${nextNum}`,
      start_time: '16:00',
      end_time: '24:00',
      is_overnight: false,
      downtime_hours: 0,
      notes: '',
    };
    updateSessions([...sessions, newSess]);
  };

  // Remove session
  const handleRemoveSession = (id: string) => {
    if (sessions.length <= 1) {
      alert('Minimal harus ada 1 sesi log operasional.');
      return;
    }
    updateSessions(sessions.filter((s) => s.id !== id));
  };

  // Update session field
  const handleSessionChange = (
    id: string,
    field: keyof OperatingSession,
    value: string | number | boolean
  ) => {
    const updated = sessions.map((s) => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    });
    updateSessions(updated);
  };

  // Calculate session metrics with automated downtime overlap
  const sessionMetrics = useMemo(() => {
    let totalGross = 0;
    let totalDowntime = 0;

    const list = sessions.map((s) => {
      const { grossHours, isValid, error } = calculateSessionDuration(
        s.start_time,
        s.end_time,
        s.is_overnight
      );

      // Automatically calculate downtime overlap for this shift from CCR Downtime Data
      const dt = calculateDowntimeForInterval(
        s.start_time,
        s.end_time,
        s.is_overnight,
        downtimeRecords
      );
      const netHours = Math.max(0, grossHours - dt);

      if (isValid) {
        totalGross += grossHours;
        totalDowntime += dt;
      }

      return {
        ...s,
        grossHours,
        dtHours: dt,
        netHours,
        isValid,
        error,
      };
    });

    const effectiveDowntime = Math.max(totalDowntime, totalDowntimeFromEvents);
    const totalNet = Math.max(0, totalGross - effectiveDowntime);

    return {
      list,
      totalGross: Math.round(totalGross * 100) / 100,
      totalDowntime: Math.round(effectiveDowntime * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
    };
  }, [sessions, downtimeRecords, totalDowntimeFromEvents]);

  // Compute 24-hour hourly distribution map (Jam 1 - 24)
  const hourlyMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (let h = 1; h <= 24; h++) {
      map[h] = 0;
    }

    sessionMetrics.list.forEach((s) => {
      if (!s.isValid) return;
      const startMins = timeToMinutes(s.start_time);
      const endMins = timeToMinutes(s.end_time);

      for (let h = 1; h <= 24; h++) {
        const hourStartMins = (h - 1) * 60;
        const hourEndMins = h * 60;

        if (!s.is_overnight) {
          // Normal same day overlap
          const overlapStart = Math.max(startMins, hourStartMins);
          const overlapEnd = Math.min(endMins, hourEndMins);
          if (overlapEnd > overlapStart) {
            const fraction = (overlapEnd - overlapStart) / 60;
            map[h] = Math.min(1, Math.round((map[h] + fraction) * 100) / 100);
          }
        } else {
          // Overnight: Part A (startMins to 24:00) on today
          const overlapStartA = Math.max(startMins, hourStartMins);
          const overlapEndA = Math.min(24 * 60, hourEndMins);
          if (overlapEndA > overlapStartA) {
            const fraction = (overlapEndA - overlapStartA) / 60;
            map[h] = Math.min(1, Math.round((map[h] + fraction) * 100) / 100);
          }
        }
      }
    });

    return map;
  }, [sessionMetrics]);

  // Sync handler
  const handleSyncToCCR = useCallback(() => {
    if (onSyncTotalRunningHours) {
      onSyncTotalRunningHours(sessionMetrics.totalNet, hourlyMap);
    }
  }, [onSyncTotalRunningHours, sessionMetrics.totalNet, hourlyMap]);

  return (
    <EnhancedCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-5 transition-all duration-200">
      {/* Header Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <ClockIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Log Jam Operasi Unit ({selectedUnit || 'Derivative'})
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                Multi-Session & Overnight Support
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hitung otomatis total jam kerja dari Jam Start dan Jam Stop (termasuk shift malam
              lintas hari).
            </p>
          </div>
        </div>

        {canWrite && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleResetDefaultShifts}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-slate-500/40"
              title="Reset kembali ke 4 shift standar (Shift 3 Cont, Shift 1, Shift 2, Shift 3)"
            >
              <ClockIcon className="w-4 h-4 text-slate-500" />
              <span>Reset 4 Shift Standar</span>
            </button>
            <button
              type="button"
              onClick={handleAddSession}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors focus:ring-2 focus:ring-emerald-500/40"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Tambah Sesi</span>
            </button>
            {onSyncTotalRunningHours && (
              <button
                type="button"
                onClick={handleSyncToCCR}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-sm transition-colors focus:ring-2 focus:ring-emerald-500/40"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>Terapkan ke Grid CCR</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Session Rows */}
      <div className="space-y-3">
        {sessionMetrics.list.map((sess, idx) => (
          <div
            key={sess.id}
            className={`p-4 rounded-xl border transition-all duration-200 ${
              !sess.isValid
                ? 'border-amber-300 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20'
                : sess.is_overnight
                  ? 'border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
              {/* Left Column: Sesi Name & Overnight Switch */}
              <div className="flex items-center gap-3 min-w-[200px]">
                <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={sess.name}
                  onChange={(e) => handleSessionChange(sess.id, 'name', e.target.value)}
                  disabled={!canWrite}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500/30 w-36"
                  placeholder="Nama Sesi"
                />

                {/* Night shift indicator toggle */}
                <button
                  type="button"
                  onClick={() => handleSessionChange(sess.id, 'is_overnight', !sess.is_overnight)}
                  disabled={!canWrite}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                    sess.is_overnight
                      ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                  }`}
                  title="Klik untuk mengubah status operasi lintas hari (stop besok pagi)"
                >
                  {sess.is_overnight ? (
                    <>
                      <MoonIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>🌙 Stop Besok (+1 Hari)</span>
                    </>
                  ) : (
                    <>
                      <SunIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>☀️ Hari yang Sama</span>
                    </>
                  )}
                </button>
              </div>

              {/* Middle Column: Time Inputs */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Start:
                  </label>
                  <TimeInput24h
                    value={sess.start_time}
                    onChange={(val) => handleSessionChange(sess.id, 'start_time', val)}
                    disabled={!canWrite}
                  />
                </div>

                <span className="text-slate-400 text-xs">➔</span>

                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Stop:
                  </label>
                  <TimeInput24h
                    value={sess.end_time}
                    onChange={(val) => handleSessionChange(sess.id, 'end_time', val)}
                    disabled={!canWrite}
                  />
                </div>
              </div>

              {/* Right Column: Calculated Hours & Automated Downtime Info */}
              <div className="flex items-center justify-between lg:justify-end gap-4 min-w-[220px]">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Net:</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {sess.netHours.toFixed(1)} Jam
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                    <span>Gross: {sess.grossHours.toFixed(1)}h</span>
                    {sess.dtHours > 0 && (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        (-{sess.dtHours.toFixed(1)}h Downtime)
                      </span>
                    )}
                  </div>
                </div>

                {canWrite && sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSession(sess.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Hapus Sesi Ini"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Error banner if invalid */}
            {!sess.isValid && sess.error && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                <ExclamationCircleIcon className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{sess.error}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Visual Timeline Bar (01:00 - 24:00) */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Visualisasi Distribusi Jam Operasi (24 Jam)
          </span>
          <span className="text-[11px] text-slate-400">🟢 Hijau = Operasi Aktif</span>
        </div>
        <div className="grid grid-cols-12 sm:grid-cols-24 gap-0.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => {
            const val = hourlyMap[h] || 0;
            const isFull = val >= 1;
            const isPartial = val > 0 && val < 1;

            return (
              <div key={h} className="relative group flex flex-col items-center">
                <div
                  className={`w-full h-6 rounded-md transition-all duration-200 flex items-center justify-center text-[10px] font-mono font-bold ${
                    isFull
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : isPartial
                        ? 'bg-emerald-300 dark:bg-emerald-700 text-emerald-950 dark:text-emerald-100'
                        : 'bg-slate-200/60 dark:bg-slate-700/40 text-slate-400'
                  }`}
                >
                  {h}
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-50 bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  Jam {String(h).padStart(2, '0')}:00 -{' '}
                  {val > 0 ? `${(val * 100).toFixed(0)}% (${(val * 60).toFixed(0)} mnt)` : 'Off'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Footer Badges */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Total Gross:
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
              {sessionMetrics.totalGross.toFixed(1)} Jam
            </span>
          </div>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Total Downtime:
            </span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
              {sessionMetrics.totalDowntime.toFixed(1)} Jam
            </span>
          </div>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              Total Net Operating Hours:
            </span>
            <span className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono">
              {sessionMetrics.totalNet.toFixed(1)} Jam
            </span>
          </div>
        </div>
      </div>
    </EnhancedCard>
  );
};

export default DerivativeOperatingHoursCard;
