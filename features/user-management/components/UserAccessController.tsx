import React from 'react';
import { UserPermission, PermissionLevel } from '../../../src/domain/entities/User';
import { EnhancedCard, EnhancedTooltip } from '../../../components/ui/EnhancedComponents';
import ChartPieIcon from '../../../components/icons/ChartPieIcon';
import BuildingLibraryIcon from '../../../components/icons/BuildingLibraryIcon';
import FactoryIcon from '../../../components/icons/FactoryIcon';
import ClipboardDocumentListIcon from '../../../components/icons/ClipboardDocumentListIcon';
import CircleStackIcon from '../../../components/icons/CircleStackIcon';
import EyeIcon from '../../../components/icons/EyeIcon';
import BeakerIcon from '../../../components/icons/BeakerIcon';
import DocumentTextIcon from '../../../components/icons/DocumentTextIcon';

interface UserAccessControllerProps {
  permissions: UserPermission;
  onPermissionChange: (section: keyof UserPermission, level: PermissionLevel) => void;
  readOnly?: boolean;
}

const MODULES: {
  key: keyof UserPermission;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: 'dashboard',
    label: 'Analytic Dashboard',
    description: 'Ringkasan KPI produksi real-time & analitik kinerja pabrik.',
    icon: <ChartPieIcon className="w-5 h-5" />,
  },
  {
    key: 'cm_plant_operations',
    label: 'Cement Mill Operations',
    description: 'Operasional unit CM, CCR logs, autonomous data & monitoring.',
    icon: <BuildingLibraryIcon className="w-5 h-5" />,
  },
  {
    key: 'rkc_plant_operations',
    label: 'RKC Operations',
    description: 'Rotary Kiln Clinker, data termal kiln & CCR logsheet.',
    icon: <FactoryIcon className="w-5 h-5" />,
  },
  {
    key: 'derivative_plant_operations',
    label: 'Derivative Plant Operations',
    description: 'Operasional produk semen khusus & packaging / pengantongan.',
    icon: <BeakerIcon className="w-5 h-5" />,
  },
  {
    key: 'project_management',
    label: 'Capital Project Management',
    description: 'Monitoring proyek, milestone deliverables, kurva S & foto evidence.',
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
  },
  {
    key: 'contract_sla_management',
    label: 'Contract & SLA Management',
    description: 'Monitoring PO, penyerapan anggaran vendor & evaluasi SLA KPI.',
    icon: <DocumentTextIcon className="w-5 h-5" />,
  },
  {
    key: 'database',
    label: 'System Hub Database',
    description: 'Manajemen database sistem, tabel & metadata terpusat.',
    icon: <CircleStackIcon className="w-5 h-5" />,
  },
  {
    key: 'inspection',
    label: 'Maintenance Inspection',
    description: 'Inspeksi keandalan aset, jadwal preventif & log temuan.',
    icon: <EyeIcon className="w-5 h-5" />,
  },
];

const PermissionOption: React.FC<{
  level: PermissionLevel;
  current: PermissionLevel;
  onClick: () => void;
  disabled?: boolean;
}> = ({ level, current, onClick, disabled }) => {
  const isSelected = level === current;

  const baseStyle =
    'flex-1 py-1.5 px-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all duration-200 min-h-[32px] flex items-center justify-center cursor-pointer';
  let activeStyle = '';

  if (isSelected) {
    if (level === 'NONE')
      activeStyle =
        'bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-500/30 scale-[1.02] z-10 dark:bg-rose-600';
    if (level === 'READ')
      activeStyle =
        'bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-500/30 scale-[1.02] z-10 dark:bg-indigo-600';
    if (level === 'WRITE')
      activeStyle =
        'bg-emerald-600 text-white border-emerald-700 shadow-sm shadow-emerald-500/30 scale-[1.02] z-10 dark:bg-emerald-600';
  } else {
    activeStyle =
      'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${activeStyle} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
      aria-pressed={isSelected}
      aria-label={`Set permission level to ${level}`}
    >
      {level}
    </button>
  );
};

export const UserAccessController: React.FC<UserAccessControllerProps> = ({
  permissions,
  onPermissionChange,
  readOnly = false,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {MODULES.map((module) => (
        <EnhancedCard
          key={module.key}
          variant="outlined"
          padding="md"
          rounded="2xl"
          className="group hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white rounded-xl transition-colors shrink-0 text-slate-600 dark:text-slate-300">
              {module.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                {module.label}
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                {module.description}
              </p>
            </div>
          </div>

          <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            {(['NONE', 'READ', 'WRITE'] as PermissionLevel[]).map((level) => (
              <EnhancedTooltip
                key={level}
                content={`Tetapkan hak akses ${level} untuk ${module.label}`}
              >
                <PermissionOption
                  level={level}
                  current={permissions[module.key] || 'NONE'}
                  onClick={() => onPermissionChange(module.key, level)}
                  disabled={readOnly}
                />
              </EnhancedTooltip>
            ))}
          </div>
        </EnhancedCard>
      ))}
    </div>
  );
};
