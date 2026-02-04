import React from 'react';
import { UserPermission, PermissionLevel } from '../../../src/domain/entities/User';
import { EnhancedCard, EnhancedTooltip } from '../../../components/ui/EnhancedComponents';
import ChartPieIcon from '../../../components/icons/ChartPieIcon';
import BuildingLibraryIcon from '../../../components/icons/BuildingLibraryIcon';
import FactoryIcon from '../../../components/icons/FactoryIcon';
import ClipboardDocumentListIcon from '../../../components/icons/ClipboardDocumentListIcon';
import CircleStackIcon from '../../../components/icons/CircleStackIcon';
import EyeIcon from '../../../components/icons/EyeIcon';

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
    description: 'Real-time plant performance and KPIs.',
    icon: <ChartPieIcon className="w-5 h-5" />,
  },
  {
    key: 'cm_plant_operations',
    label: 'Cement Mill Operations',
    description: 'Unit control and operational logs.',
    icon: <BuildingLibraryIcon className="w-5 h-5" />,
  },
  {
    key: 'rkc_plant_operations',
    label: 'RKC Operations',
    description: 'Kiln performance and thermal data.',
    icon: <FactoryIcon className="w-5 h-5" />,
  },
  {
    key: 'project_management',
    label: 'Capital Project Mgmt',
    description: 'Timeline and resource allocation.',
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
  },
  {
    key: 'database',
    label: 'System Hub Database',
    description: 'Core metadata and system logs.',
    icon: <CircleStackIcon className="w-5 h-5" />,
  },
  {
    key: 'inspection',
    label: 'Maintenance Inspection',
    description: 'Asset health and schedule management.',
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
    'flex-1 py-2 px-3 text-[10px] font-black uppercase tracking-tighter rounded-xl border transition-all duration-300';
  let activeStyle = '';

  if (isSelected) {
    if (level === 'NONE')
      activeStyle = 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm scale-105 z-10';
    if (level === 'READ')
      activeStyle = 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm scale-105 z-10';
    if (level === 'WRITE')
      activeStyle = 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm scale-105 z-10';
  } else {
    activeStyle =
      'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 opacity-60';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${activeStyle} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {MODULES.map((module) => (
        <EnhancedCard
          key={module.key}
          variant="outlined"
          padding="md"
          rounded="2xl"
          className="group hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white rounded-xl transition-colors shrink-0">
              {module.icon}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                {module.label}
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {module.description}
              </p>
            </div>
          </div>

          <div className="flex gap-1.5 p-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            {(['NONE', 'READ', 'WRITE'] as PermissionLevel[]).map((level) => (
              <EnhancedTooltip key={level} content={`Assign ${level} access`}>
                <PermissionOption
                  level={level}
                  current={permissions[module.key]}
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
