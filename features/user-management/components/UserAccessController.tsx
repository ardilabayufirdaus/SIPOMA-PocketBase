import React from 'react';
import { UserPermission, PermissionLevel } from '../../../src/domain/entities/User';
import { EnhancedBadge } from '../../../components/ui/EnhancedComponents';

interface UserAccessControllerProps {
  permissions: UserPermission;
  onPermissionChange: (section: keyof UserPermission, level: PermissionLevel) => void;
  readOnly?: boolean;
}

const MODULES: { key: keyof UserPermission; label: string; description: string }[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'Access to main dashboard analytics.' },
  {
    key: 'cm_plant_operations',
    label: 'CM Plant Operations',
    description: 'Monitor and input data for Cement Mills.',
  },
  {
    key: 'rkc_plant_operations',
    label: 'RKC Plant Operations',
    description: 'Monitor and input data for RKC units.',
  },
  {
    key: 'project_management',
    label: 'Project Management',
    description: 'Manage projects and tasks.',
  },
  { key: 'database', label: 'Database', description: 'Access system database records.' },
  {
    key: 'inspection',
    label: 'Inspection',
    description: 'Manage and track equipment inspections.',
  },
];

const PermissionOption: React.FC<{
  level: PermissionLevel;
  current: PermissionLevel;
  onClick: () => void;
  disabled?: boolean;
}> = ({ level, current, onClick, disabled }) => {
  const isSelected = level === current;

  let colorClass = 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100';
  if (isSelected) {
    if (level === 'NONE') colorClass = 'bg-red-50 border-red-200 text-red-600';
    if (level === 'READ') colorClass = 'bg-blue-50 border-blue-200 text-blue-600';
    if (level === 'WRITE') colorClass = 'bg-green-50 border-green-200 text-green-600';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${colorClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
    <div className="space-y-4">
      {MODULES.map((module) => (
        <div
          key={module.key}
          className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm"
        >
          <div>
            <h4 className="text-sm font-medium text-slate-800">{module.label}</h4>
            <p className="text-xs text-slate-500">{module.description}</p>
          </div>
          <div className="flex gap-2">
            {(['NONE', 'READ', 'WRITE'] as PermissionLevel[]).map((level) => (
              <PermissionOption
                key={level}
                level={level}
                current={permissions[module.key]}
                onClick={() => onPermissionChange(module.key, level)}
                disabled={readOnly}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
