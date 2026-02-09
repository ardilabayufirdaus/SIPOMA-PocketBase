import React, { useState } from 'react';
import { motion } from 'framer-motion';
import XMarkIcon from '../../../components/icons/XMarkIcon';
import ClipboardCheckIcon from '../../../components/icons/ClipboardCheckIcon';
import { useAuth } from '../../../hooks/useAuth';
import { useUserStore } from '../../../stores/userStore';
import CogIcon from '../../../components/icons/CogIcon';
import ChevronDownIcon from '../../../components/icons/ChevronDownIcon';
import { useEffect } from 'react';
import { InspectionArea } from '../../../services/pocketbase';

interface CheckPoint {
  id: string;
  name: string;
}

interface Equipment {
  id: string;
  name: string;
  checkPoints: CheckPoint[];
}

interface Group {
  id: string;
  name: string;
  equipments: Equipment[];
}

interface DailyReport {
  id: string;
  date: string;
  unit: string;
  unitId?: string; // Relation to InspectionUnit
  areaId?: string;
  status: 'pending' | 'completed' | 'critical';
  data: Record<string, { s1: string; s2: string; s3: string; note: string }>;
  personnel: {
    s1: { tender: string; karu: string };
    s2: { tender: string; karu: string };
    s3: { tender: string; karu: string };
  };
  approvals: {
    s1: boolean;
    s2: boolean;
    s3: boolean;
  };
}

interface ShiftReportFormProps {
  unit: string;
  unitId?: string;
  areas: InspectionArea[];
  groups: Group[];
  existingReports: DailyReport[];
  onClose: () => void;
  onSave: (report: any) => void;
}

const ShiftReportForm: React.FC<ShiftReportFormProps> = ({
  unit,
  unitId,
  areas,
  groups,
  existingReports,
  onClose,
  onSave,
}) => {
  const { user: currentUser } = useAuth();
  const { users, fetchUsers } = useUserStore();

  const [reportData, setReportData] = useState<Record<string, any>>({});
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [personnel, setPersonnel] = useState({
    s1: { tender: '', karu: '' },
    s2: { tender: '', karu: '' },
    s3: { tender: '', karu: '' },
  });

  useEffect(() => {
    fetchUsers(1, 100);
  }, []);

  const filteredAreas = areas.filter((a) => a.unit === unitId);
  // Filter users to only show Supervisors for the Karu dropdown
  const supervisors = users.filter((u: any) => u.role === 'Supervisor');

  const handleInputChange = (cpId: string, shift: 's1' | 's2' | 's3' | 'note', value: string) => {
    setReportData((prev) => ({
      ...prev,
      [cpId]: {
        ...(prev[cpId] || { s1: '', s2: '', s3: '', note: '' }),
        [shift]: value,
      },
    }));
  };

  const handlePersonnelChange = (
    shift: 's1' | 's2' | 's3',
    type: 'tender' | 'karu',
    value: string
  ) => {
    setPersonnel((prev) => ({
      ...prev,
      [shift]: { ...prev[shift], [type]: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine which shifts are being submitted in this form
    const submittedShifts = (['s1', 's2', 's3'] as const).filter((s) => personnel[s].tender);

    if (submittedShifts.length === 0) {
      setError('Silakan isi minimal satu shift (Tender) sebelum menyimpan.');
      return;
    }

    // Validate that each submitted shift has a Karu selected
    const missingKaru = submittedShifts.find((s) => !personnel[s].karu);
    if (missingKaru) {
      setError(`Silakan pilih Karu (Supervisor) untuk Shift ${missingKaru.replace('s', '')}.`);
      return;
    }

    if (!selectedAreaId) {
      setError('Silakan pilih Area kerja terlebih dahulu.');
      return;
    }

    // Check for duplicates at shift level
    const existingReport = existingReports.find((rep) => {
      const repDate = new Date(rep.date).toISOString().split('T')[0];
      return rep.unit === unit && repDate === reportDate;
    });

    if (existingReport) {
      // Check for conflicts
      const conflictingShifts = submittedShifts.filter((s) => existingReport.personnel[s].tender);

      if (conflictingShifts.length > 0) {
        const shiftNames = conflictingShifts.map((s) => s.toUpperCase()).join(', ');
        setError(
          `Shift ${shiftNames} untuk unit ${unit} pada tanggal ${reportDate} sudah terisi oleh personil lain!`
        );
        return;
      }
    }

    onSave({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date(reportDate).toISOString(),
      unit,
      unitId,
      areaId: selectedAreaId,
      status: Object.values(reportData).some((d) => d.note) ? 'critical' : 'completed',
      data: reportData,
      personnel: personnel,
      approvals: { s1: false, s2: false, s3: false },
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 backdrop-blur-3xl font-ubuntu">
      <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-gradient-to-br from-ubuntu-orange to-orange-600 rounded-2xl text-white shadow-lg shadow-orange-500/20">
            <ClipboardCheckIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-ubuntu-coolGrey dark:text-white tracking-tight">
              Daily Shift Report
            </h3>
            <p className="text-[11px] font-bold text-ubuntu-warmGrey uppercase tracking-widest flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-ubuntu-orange animate-pulse"></span>
              Unit: {unit}
            </p>
          </div>

          <div className="ml-8 flex items-center gap-4 bg-white/50 dark:bg-slate-800/50 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-sm">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Work Area
            </label>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <select
              required
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-ubuntu-coolGrey dark:text-white focus:ring-0 outline-none cursor-pointer p-0 pr-8"
            >
              <option value="" className="bg-white dark:bg-slate-900">
                Select Area...
              </option>
              {filteredAreas.map((a) => (
                <option key={a.id} value={a.id} className="bg-white dark:bg-slate-900">
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-8 hidden sm:flex items-center gap-4 bg-white/50 dark:bg-slate-800/50 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-sm">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Report Date
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-ubuntu-coolGrey dark:text-white focus:ring-0 outline-none cursor-pointer p-0"
            />
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-white/10 shadow-sm group"
        >
          <XMarkIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-8 mt-6 p-5 bg-rose-50 border border-rose-200 rounded-3xl flex items-center justify-between backdrop-blur-md"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
              <XMarkIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-rose-600">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-600 hover:text-rose-700 font-black text-xs bg-rose-500/10 px-4 py-2 rounded-xl transition-all"
          >
            Sembunyikan
          </button>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
        {/* Personnel Section */}
        <div className="p-8 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((s) => {
              const shiftKey = `s${s}` as 's1' | 's2' | 's3';
              const isAssigned =
                personnel[shiftKey].tender === (currentUser?.full_name || currentUser?.username);

              return (
                <motion.div
                  key={s}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: s * 0.1 }}
                  className="group space-y-5 p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/5 shadow-soft hover:-translate-y-1 transition-all duration-500 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-12 bg-ubuntu-orange/5 rounded-full -mr-8 -mt-8 group-hover:bg-ubuntu-orange/10 transition-colors"></div>

                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-bold text-ubuntu-warmGrey uppercase tracking-[0.2em]">
                      Shift {s}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handlePersonnelChange(
                          shiftKey,
                          'tender',
                          isAssigned ? '' : currentUser?.full_name || currentUser?.username || ''
                        )
                      }
                      className={`px-5 py-2 rounded-xl text-[10px] font-bold transition-all duration-300 ${
                        isAssigned
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-ubuntu-orange hover:text-white hover:shadow-lg hover:shadow-orange-500/20'
                      }`}
                    >
                      {isAssigned ? '✓ ASSIGNED' : '+ TAKE SHIFT'}
                    </button>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-1 mb-2">
                        Operational Tender
                      </label>
                      <div className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-ubuntu-coolGrey dark:text-white flex items-center shadow-inner">
                        {personnel[shiftKey].tender ? (
                          <span className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-ubuntu-orange animate-pulse"></span>
                            {personnel[shiftKey].tender}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold italic opacity-60">
                            Not assigned
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-1 mb-2">
                        Karu Shift
                      </label>
                      <div className="relative">
                        <select
                          required={!!personnel[shiftKey].tender}
                          value={personnel[shiftKey].karu}
                          onChange={(e) => handlePersonnelChange(shiftKey, 'karu', e.target.value)}
                          className={`w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-ubuntu-coolGrey dark:text-white outline-none focus:ring-2 ring-ubuntu-orange/20 focus:border-ubuntu-orange transition-all appearance-none shadow-inner ${
                            !personnel[shiftKey].tender ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={!personnel[shiftKey].tender}
                        >
                          <option value="" className="bg-white dark:bg-slate-900">
                            Select Supervisor
                          </option>
                          {supervisors.map((u) => (
                            <option
                              key={u.id}
                              value={u.full_name || u.name || u.username}
                              className="bg-white dark:bg-slate-900"
                            >
                              {u.full_name || u.name || u.username}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <ChevronDownIcon className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-soft overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-[0.2em] text-ubuntu-warmGrey border-b border-slate-200 dark:border-white/10">
                  <th className="px-6 py-5 w-16 text-center">No.</th>
                  <th className="px-6 py-5 min-w-[250px]">Check Point</th>
                  <th className="px-3 py-5 text-center w-28">Shift 1</th>
                  <th className="px-3 py-5 text-center w-28">Shift 2</th>
                  <th className="px-3 py-5 text-center w-28">Shift 3</th>
                  <th className="px-6 py-5">Abnormalitas Peralatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {groups.map((group) => (
                  <React.Fragment key={group.id}>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                      <td
                        colSpan={6}
                        className="px-8 py-4 font-bold text-ubuntu-coolGrey dark:text-slate-200 uppercase tracking-[0.2em] text-[11px]"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-1.5 h-6 bg-ubuntu-orange rounded-full"></span>
                          {group.name}
                        </div>
                      </td>
                    </tr>
                    {group.equipments.map((eq, eIdx) => (
                      <React.Fragment key={eq.id}>
                        <tr className="bg-white dark:bg-slate-900 group/eq border-b border-slate-50 dark:border-white/5">
                          <td className="px-6 py-4 text-center font-bold text-slate-400 group-hover/eq:text-ubuntu-orange transition-colors">
                            {eIdx + 1}
                          </td>
                          <td
                            className="px-6 py-4 font-bold text-ubuntu-coolGrey dark:text-white group-hover/eq:text-ubuntu-orange transition-colors"
                            colSpan={5}
                          >
                            {eq.name}
                          </td>
                        </tr>
                        {eq.checkPoints.map((cp) => (
                          <tr
                            key={cp.id}
                            className="group/row hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200"
                          >
                            <td className="px-6 py-3"></td>
                            <td className="px-6 py-3 text-slate-600 dark:text-slate-400 pl-12 font-bold group-hover/row:text-slate-900 dark:group-hover/row:text-white transition-colors">
                              - {cp.name}
                            </td>
                            <td className="px-2 py-3">
                              <input
                                placeholder="Status"
                                className="w-full px-3 py-2.5 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 ring-ubuntu-orange/20 focus:bg-white dark:focus:bg-slate-900 focus:border-ubuntu-orange outline-none text-xs font-bold transition-all shadow-inner text-ubuntu-coolGrey dark:text-white"
                                value={reportData[cp.id]?.s1 || ''}
                                onChange={(e) => handleInputChange(cp.id, 's1', e.target.value)}
                              />
                            </td>
                            <td className="px-2 py-3">
                              <input
                                placeholder="Status"
                                className="w-full px-3 py-2.5 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 ring-ubuntu-orange/20 focus:bg-white dark:focus:bg-slate-900 focus:border-ubuntu-orange outline-none text-xs font-bold transition-all shadow-inner text-ubuntu-coolGrey dark:text-white"
                                value={reportData[cp.id]?.s2 || ''}
                                onChange={(e) => handleInputChange(cp.id, 's2', e.target.value)}
                              />
                            </td>
                            <td className="px-2 py-3">
                              <input
                                placeholder="Status"
                                className="w-full px-3 py-2.5 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 ring-ubuntu-orange/20 focus:bg-white dark:focus:bg-slate-900 focus:border-ubuntu-orange outline-none text-xs font-bold transition-all shadow-inner text-ubuntu-coolGrey dark:text-white"
                                value={reportData[cp.id]?.s3 || ''}
                                onChange={(e) => handleInputChange(cp.id, 's3', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                placeholder="Catat kelainan..."
                                className={`w-full px-5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 outline-none text-xs transition-all shadow-inner ${
                                  reportData[cp.id]?.note
                                    ? 'border-rose-500/50 text-rose-600 ring-rose-500/10 font-bold bg-rose-50 dark:bg-rose-500/10'
                                    : 'border-slate-200 dark:border-white/10 text-slate-500 italic focus:ring-ubuntu-orange/20 focus:border-ubuntu-orange group-hover/row:bg-white dark:group-hover/row:bg-slate-900 font-medium'
                                }`}
                                value={reportData[cp.id]?.note || ''}
                                onChange={(e) => handleInputChange(cp.id, 'note', e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-8 border-t border-slate-200 dark:border-white/10 flex gap-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-300 rounded-xl font-bold uppercase tracking-widest hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white transition-all border border-slate-200 dark:border-white/10 shadow-sm active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-[2] py-4 bg-gradient-to-r from-ubuntu-orange to-orange-600 hover:from-orange-500 hover:to-orange-500 text-white rounded-xl font-bold uppercase tracking-[0.2em] transition-all shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 active:scale-[0.98]"
          >
            Submit Daily Report
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShiftReportForm;
