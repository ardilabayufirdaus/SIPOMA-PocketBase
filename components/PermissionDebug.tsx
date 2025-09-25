import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const PermissionDebug: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5);

      if (usersError) console.error('Users error:', usersError);
      else setUsers(usersData || []);

      // Fetch permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .limit(10);

      if (permissionsError) console.error('Permissions error:', permissionsError);
      else setPermissions(permissionsData || []);

      // Fetch user_permissions
      const { data: userPermsData, error: userPermsError } = await supabase
        .from('user_permissions')
        .select('*')
        .limit(10);

      if (userPermsError) console.error('User permissions error:', userPermsError);
      else setUserPermissions(userPermsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Permission Debug</h1>

      <div>
        <h2 className="text-xl font-semibold mb-2">Users</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(users, null, 2)}
        </pre>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Permissions</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(permissions, null, 2)}
        </pre>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">User Permissions</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(userPermissions, null, 2)}
        </pre>
      </div>

      <button onClick={fetchAllData} className="bg-blue-500 text-white px-4 py-2 rounded">
        Refresh Data
      </button>
    </div>
  );
};

export default PermissionDebug;
