import React, { useState, useEffect } from 'react';
import { useRBACStore, initializeRBACDefaults } from '../../stores/rbacStore';
import {
  Shield,
  Users,
  Key,
  Plus,
  Edit,
  Trash2,
  Copy,
  Settings,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  X,
} from 'lucide-react';

export const RoleManagement: React.FC = () => {
  const {
    roles,
    permissions,
    createRole,
    updateRole,
    deleteRole,
    cloneRole,
    getPermissionsByCategory,
    getRoleUsageStats,
  } = useRBACStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<(typeof roles)[0] | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true,
    priority: 50,
    constraints: {
      maxUsers: undefined as number | undefined,
      allowedDepartments: [] as string[],
      sessionDuration: undefined as number | undefined,
    },
  });

  useEffect(() => {
    initializeDefaults();
  }, []);

  const initializeDefaults = async () => {
    try {
      await initializeRBACDefaults();
    } catch {
      setError('Failed to initialize RBAC defaults');
    }
  };

  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'system' && role.isSystemRole) ||
      (selectedCategory === 'custom' && !role.isSystemRole) ||
      (selectedCategory === 'active' && role.isActive) ||
      (selectedCategory === 'inactive' && !role.isActive);

    return matchesSearch && matchesCategory;
  });

  const permissionCategories = [...new Set(permissions.map((p) => p.category))];
  const roleUsageStats = getRoleUsageStats();

  const handleCreateRole = async () => {
    setIsLoading(true);
    setError('');

    try {
      await createRole({
        ...formData,
        parentRoles: [],
        childRoles: [],
        isSystemRole: false,
        metadata: {},
        createdBy: 'current-user', // In production, use actual user ID
      });

      setShowCreateModal(false);
      resetForm();
    } catch {
      setError('Failed to create role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    setError('');

    try {
      await updateRole(selectedRole.id, formData);
      setShowEditModal(false);
      resetForm();
    } catch {
      setError('Failed to update role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteRole(roleId);
    } catch {
      setError('Failed to delete role');
    }
  };

  const handleCloneRole = async (roleId: string) => {
    const roleName = prompt('Enter name for cloned role:');
    if (!roleName) return;

    try {
      await cloneRole(roleId, roleName);
    } catch {
      setError('Failed to clone role');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
      isActive: true,
      priority: 50,
      constraints: {
        maxUsers: undefined,
        allowedDepartments: [],
        sessionDuration: undefined,
      },
    });
    setSelectedRole(null);
  };

  const openEditModal = (role: (typeof roles)[0]) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
      isActive: role.isActive,
      priority: role.priority,
      constraints: {
        maxUsers: role.constraints?.maxUsers,
        allowedDepartments: role.constraints?.allowedDepartments || [],
        sessionDuration: role.constraints?.sessionDuration,
      },
    });
    setShowEditModal(true);
  };

  const toggleRoleExpanded = (roleId: string) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedRoles(newExpanded);
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const getRoleIcon = (role: (typeof roles)[0]) => {
    if (role.metadata?.icon === 'shield-check') return <Shield className="h-5 w-5" />;
    if (role.metadata?.icon === 'building') return <Settings className="h-5 w-5" />;
    if (role.metadata?.icon === 'users') return <Users className="h-5 w-5" />;
    if (role.metadata?.icon === 'eye') return <Search className="h-5 w-5" />;
    return <Key className="h-5 w-5" />;
  };

  const getRoleColor = (role: (typeof roles)[0]) => {
    return role.metadata?.color || '#6b7280';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role Management</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage user roles and permissions for SIPOMA system
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Role</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none"
            >
              <option value="all">All Roles</option>
              <option value="system">System Roles</option>
              <option value="custom">Custom Roles</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Roles List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Roles ({filteredRoles.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredRoles.map((role) => (
            <div key={role.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleRoleExpanded(role.id)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {expandedRoles.has(role.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  <div className="flex items-center space-x-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: `${getRoleColor(role)}20`,
                        color: getRoleColor(role) as string,
                      }}
                    >
                      {getRoleIcon(role)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                        {role.isSystemRole && (
                          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full">
                            System
                          </span>
                        )}
                        {!role.isActive && (
                          <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{role.description}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>{role.permissions.length} permissions</span>
                        <span>{roleUsageStats[role.id] || 0} users</span>
                        <span>Priority: {role.priority}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(role)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                    title="Edit role"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleCloneRole(role.id)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                    title="Clone role"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {!role.isSystemRole && (
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                      title="Delete role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedRoles.has(role.id) && (
                <div className="mt-4 ml-8 space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Permissions</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {role.permissions.map((permId: string) => {
                        const permission = permissions.find((p) => p.id === permId);
                        return permission ? (
                          <div
                            key={permId}
                            className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded text-xs"
                          >
                            {permission.name}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {role.constraints && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Constraints
                      </h4>
                      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        {role.constraints.maxUsers && (
                          <div>Max Users: {role.constraints.maxUsers}</div>
                        )}
                        {role.constraints.sessionDuration && (
                          <div>Session Duration: {role.constraints.sessionDuration} minutes</div>
                        )}
                        {role.constraints.allowedDepartments?.length > 0 && (
                          <div>Departments: {role.constraints.allowedDepartments.join(', ')}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {showCreateModal ? 'Create New Role' : 'Edit Role'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Enter role name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, priority: parseInt(e.target.value) || 50 }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Enter role description"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                  Active Role
                </label>
              </div>

              {/* Permissions */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Permissions</h4>
                <div className="space-y-4">
                  {permissionCategories.map((category) => {
                    const categoryPermissions = getPermissionsByCategory(category);
                    return (
                      <div
                        key={category}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                          {category}
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {categoryPermissions.map((permission) => (
                            <label key={permission.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(permission.id)}
                                onChange={() => togglePermission(permission.id)}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {permission.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Constraints */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Constraints (Optional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Users
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.constraints.maxUsers || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          constraints: {
                            ...prev.constraints,
                            maxUsers: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="No limit"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Session Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.constraints.sessionDuration || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          constraints: {
                            ...prev.constraints,
                            sessionDuration: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="No limit"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => {
                  if (showCreateModal) {
                    setShowCreateModal(false);
                  } else {
                    setShowEditModal(false);
                  }
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showCreateModal ? handleCreateRole : handleUpdateRole}
                disabled={!formData.name.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{showCreateModal ? 'Create Role' : 'Update Role'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
