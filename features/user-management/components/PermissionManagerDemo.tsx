import React, { useState } from 'react';
import {
  User,
  PermissionMatrix,
  PermissionLevel,
  PlantOperationsPermissions,
} from '../../../types';
import { getDefaultPermissionsForRole } from '../../../utils/permissions';
import SimplifiedPermissionManager from './SimplifiedPermissionManager';
import { EnhancedButton, EnhancedCard } from '../../../components/ui/EnhancedComponents';
import ShieldCheckIcon from '../../../components/icons/ShieldCheckIcon';

const PermissionManagerDemo: React.FC = () => {
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [currentPermissions, setCurrentPermissions] = useState<PermissionMatrix>(
    getDefaultPermissionsForRole('Operator')
  );

  // Mock user for demo
  const mockUser: User = {
    id: 'demo-user',
    username: 'demo_operator',
    full_name: 'Demo Operator',
    role: 'Operator',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    permissions: currentPermissions,
  };

  const handlePermissionsChange = (permissions: PermissionMatrix) => {
    setCurrentPermissions(permissions);
  };

  const handleSavePermissions = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // In real implementation, this would save to database
  };

  const getPermissionDisplay = (
    permission: PermissionLevel | PlantOperationsPermissions
  ): string => {
    if (typeof permission === 'string') {
      return permission;
    }
    return 'Custom'; // For object permissions
  };

  return (
    <div className="p-6 space-y-6">
      <EnhancedCard>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Simplified Permission Manager Demo
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Demo of the new simplified permission management system
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Dashboard</div>
                <div className="text-lg font-bold text-primary-600">
                  {getPermissionDisplay(currentPermissions.dashboard)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Plant Operations
                </div>
                <div className="text-lg font-bold text-primary-600">
                  {getPermissionDisplay(currentPermissions.plant_operations)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Inspection</div>
                <div className="text-lg font-bold text-primary-600">
                  {getPermissionDisplay(currentPermissions.inspection)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Project Management
                </div>
                <div className="text-lg font-bold text-primary-600">
                  {getPermissionDisplay(currentPermissions.project_management)}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <EnhancedButton variant="primary" onClick={() => setIsPermissionModalOpen(true)}>
                <ShieldCheckIcon className="w-4 h-4 mr-2" />
                Manage Permissions
              </EnhancedButton>

              <EnhancedButton
                variant="outline"
                onClick={() => setCurrentPermissions(getDefaultPermissionsForRole('Super Admin'))}
              >
                Set Super Admin
              </EnhancedButton>

              <EnhancedButton
                variant="outline"
                onClick={() => setCurrentPermissions(getDefaultPermissionsForRole('Operator'))}
              >
                Set Operator
              </EnhancedButton>
            </div>
          </div>
        </div>
      </EnhancedCard>

      <SimplifiedPermissionManager
        user={mockUser}
        currentPermissions={currentPermissions}
        onPermissionsChange={handlePermissionsChange}
        onSave={handleSavePermissions}
        onClose={() => setIsPermissionModalOpen(false)}
        isOpen={isPermissionModalOpen}
        language="en"
      />
    </div>
  );
};

export default PermissionManagerDemo;
