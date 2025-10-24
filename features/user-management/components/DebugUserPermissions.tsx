import React, { useState } from 'react';
import { pb } from '../../../utils/pocketbase';
import { buildPermissionMatrix } from '../../../utils/permissionUtils';
import { PermissionChecker } from '../../../utils/permissions';
import { PermissionMatrix, User } from '../../../types';
import {
  EnhancedCard,
  EnhancedButton,
  EnhancedModal,
} from '../../../components/ui/EnhancedComponents';

interface PermissionCheckResult {
  dashboard: boolean;
  plant_operations: boolean;
  inspection: boolean;
  project_management: boolean;
}

interface DebugUserPermissionsProps {
  isOpen: boolean;
  onClose: () => void;
}

const DebugUserPermissions: React.FC<DebugUserPermissionsProps> = ({ isOpen, onClose }) => {
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  const [permissions, setPermissions] = useState<unknown[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix | null>(null);
  const [permissionCheck, setPermissionCheck] = useState<PermissionCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const debugUser = async (username: string) => {
    setLoading(true);
    setError('');

    try {
      // 1. Cari user berdasarkan username
      const userRecords = await pb.collection('users').getList(1, 1, {
        filter: `username = '${username}'`,
      });

      if (userRecords.items.length === 0) {
        throw new Error(`User ${username} tidak ditemukan`);
      }

      const user = userRecords.items[0];
      setUserData(user);

      // 2. Ambil permission dari database
      const permissionRecords = await pb.collection('user_permissions').getList(1, 10, {
        filter: `user_id = '${user.id}'`,
        expand: 'permissions',
      });

      setPermissions(permissionRecords.items);

      // 3. Build permission matrix
      const matrix = buildPermissionMatrix(permissionRecords.items);
      setPermissionMatrix(matrix);

      // 4. Test permission checker
      const userWithPermissions: User = {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
        last_active: user.last_active,
        created_at: user.created,
        updated_at: user.updated,
        permissions: matrix,
        is_custom_permissions: user.is_custom_permissions,
      };

      const checker = new PermissionChecker(userWithPermissions);

      const checks: PermissionCheckResult = {
        dashboard: checker.hasPermission('dashboard', 'READ'),
        plant_operations: checker.hasPermission('plant_operations', 'READ'),
        inspection: checker.hasPermission('inspection', 'READ'),
        project_management: checker.hasPermission('project_management', 'READ'),
      };

      setPermissionCheck(checks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EnhancedModal isOpen={isOpen} onClose={onClose} title="Debug User Permissions" size="xl">
      <div className="space-y-6">
        <EnhancedCard>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Debug User Permissions</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <EnhancedButton onClick={() => debugUser('asnur')} loading={loading}>
                  Debug User &quot;asnur&quot;
                </EnhancedButton>

                <EnhancedButton variant="outline" onClick={() => debugUser('admin')}>
                  Debug User &quot;admin&quot;
                </EnhancedButton>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {userData && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800">User Data:</h3>
                    <pre className="text-sm text-blue-700 mt-2">
                      {JSON.stringify(
                        {
                          id: userData.id,
                          username: userData.username,
                          role: userData.role,
                          is_active: userData.is_active,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>

                  {permissions && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-800">Raw Permissions from DB:</h3>
                      <pre className="text-sm text-green-700 mt-2">
                        {JSON.stringify(permissions, null, 2)}
                      </pre>
                    </div>
                  )}

                  {permissionMatrix && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h3 className="font-semibold text-purple-800">Permission Matrix:</h3>
                      <pre className="text-sm text-purple-700 mt-2">
                        {JSON.stringify(permissionMatrix, null, 2)}
                      </pre>
                    </div>
                  )}

                  {permissionCheck && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h3 className="font-semibold text-orange-800">Permission Check Results:</h3>
                      <div className="mt-2 space-y-1">
                        {Object.entries(permissionCheck).map(([module, hasAccess]) => (
                          <div key={module} className="flex justify-between">
                            <span className="text-sm">{module}:</span>
                            <span
                              className={`text-sm font-medium ${hasAccess ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {hasAccess ? '✅ ACCESS' : '❌ NO ACCESS'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </EnhancedCard>
      </div>
    </EnhancedModal>
  );
};

export default DebugUserPermissions;
