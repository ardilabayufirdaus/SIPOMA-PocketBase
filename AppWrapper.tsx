import RootRouter from './pages/RootRouter';
import { useSuperAdminAccess } from './hooks/useSuperAdminAccess';
import React from 'react';

/**
 * Enhanced App wrapper yang memastikan Super Admin memiliki akses penuh
 * pada mode development.
 */
export function AppWrapper() {
  // Gunakan hook untuk memastikan akses Super Admin
  useSuperAdminAccess();
  
  // Render aplikasi dengan router normal
  return <RootRouter />;
}

export default AppWrapper;