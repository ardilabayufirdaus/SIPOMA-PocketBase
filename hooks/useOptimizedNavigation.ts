import { useMemo, useCallback } from 'react';
import { User } from '../types';

/**
 * Hook untuk optimasi navigation dengan memoization
 * Mengurangi re-renders yang tidak perlu
 */
export const useOptimizedNavigation = (
  currentPage: string,
  activeSubPages: Record<string, string>,
  onNavigate: (page: string, subPage?: string) => void,
  user?: User
) => {
  // Memoized navigation handlers
  const navigationHandlers = useMemo(() => {
    const createHandler = (page: string, subPage?: string) => () => onNavigate(page, subPage);

    return {
      dashboard: createHandler('dashboard'),
      users: {
        list: createHandler('users', 'user_list'),

        activity: createHandler('users', 'user_activity'),
      },
      operations: {
        dashboard: createHandler('operations', 'plant_dashboard'),
        ccrData: createHandler('operations', 'ccr_data'),
        autonomousData: createHandler('operations', 'autonomous_data'),
        copAnalysis: createHandler('operations', 'cop_analysis'),
        reports: createHandler('operations', 'reports'),
        workInstructions: createHandler('operations', 'work_instructions'),
        whatsappReports: createHandler('operations', 'whatsapp_reports'),
      },
      packing: {
        dashboard: createHandler('packing', 'packing_dashboard'),
        overview: createHandler('packing', 'packing_overview'),
        performance: createHandler('packing', 'packing_performance'),
        quality: createHandler('packing', 'packing_quality'),
        maintenance: createHandler('packing', 'packing_maintenance'),
      },
      projects: {
        list: createHandler('projects', 'proj_list'),
        dashboard: createHandler('projects', 'proj_dashboard'),
        detail: createHandler('projects', 'proj_detail'),
      },
      settings: createHandler('settings'),
    };
  }, [onNavigate]);

  // Memoized active states
  const activeStates = useMemo(
    () => ({
      dashboard: currentPage === 'dashboard',
      users: {
        main: currentPage === 'users',
        list: currentPage === 'users' && activeSubPages.users === 'user_list',

        activity: currentPage === 'users' && activeSubPages.users === 'user_activity',
      },
      operations: {
        main: currentPage === 'operations',
        dashboard: currentPage === 'operations' && activeSubPages.operations === 'plant_dashboard',
        ccrData: currentPage === 'operations' && activeSubPages.operations === 'ccr_data',
        autonomousData:
          currentPage === 'operations' && activeSubPages.operations === 'autonomous_data',
        copAnalysis: currentPage === 'operations' && activeSubPages.operations === 'cop_analysis',
        reports: currentPage === 'operations' && activeSubPages.operations === 'reports',
        workInstructions:
          currentPage === 'operations' && activeSubPages.operations === 'work_instructions',
        whatsappReports:
          currentPage === 'operations' && activeSubPages.operations === 'whatsapp_reports',
      },
      packing: {
        main: currentPage === 'packing',
        dashboard: currentPage === 'packing' && activeSubPages.packing === 'packing_dashboard',
        overview: currentPage === 'packing' && activeSubPages.packing === 'packing_overview',
        performance: currentPage === 'packing' && activeSubPages.packing === 'packing_performance',
        quality: currentPage === 'packing' && activeSubPages.packing === 'packing_quality',
        maintenance: currentPage === 'packing' && activeSubPages.packing === 'packing_maintenance',
      },
      projects: {
        main: currentPage === 'projects',
        list: currentPage === 'projects' && activeSubPages.projects === 'proj_list',
        dashboard: currentPage === 'projects' && activeSubPages.projects === 'proj_dashboard',
        detail: currentPage === 'projects' && activeSubPages.projects === 'proj_detail',
      },
      settings: currentPage === 'settings',
    }),
    [currentPage, activeSubPages]
  );

  // Memoized permission checks
  const permissions = useMemo(() => {
    const hasPlantOperationsAccess =
      user?.permissions?.plant_operations &&
      Object.values(user.permissions.plant_operations).some((category) =>
        Object.values(category).some((level) => level !== 'NONE')
      );

    return {
      canViewDashboard: user?.permissions?.dashboard !== 'NONE',
      canViewUsers: user?.role === 'Super Admin',
      canViewOperations: Boolean(hasPlantOperationsAccess),
      canViewProjects: user?.permissions?.project_management !== 'NONE',
      canViewSettings: true, // Settings always accessible
    };
  }, [user?.permissions, user?.role]);

  return {
    navigationHandlers,
    activeStates,
    permissions,
  };
};

/**
 * Hook untuk optimasi sidebar state management
 */
export const useOptimizedSidebar = (
  isCollapsed: boolean,
  expandedMenus: Record<string, boolean>,
  onToggleCollapse: () => void,
  onToggleMenu: (menu: string) => void
) => {
  // Memoized collapse handler
  const handleToggleCollapse = useCallback(() => {
    onToggleCollapse();
  }, [onToggleCollapse]);

  // Memoized menu toggle handlers
  const menuToggleHandlers = useMemo(() => {
    const createToggleHandler = (menu: string) => () => onToggleMenu(menu);

    return {
      users: createToggleHandler('users'),
      operations: createToggleHandler('operations'),
      packing: createToggleHandler('packing'),
      projects: createToggleHandler('projects'),
    };
  }, [onToggleMenu]);

  // Memoized sidebar classes
  const sidebarClasses = useMemo(() => {
    const baseClasses =
      'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out flex flex-col h-full';
    const widthClasses = isCollapsed ? 'w-16' : 'w-64';

    return `${baseClasses} ${widthClasses}`;
  }, [isCollapsed]);

  return {
    handleToggleCollapse,
    menuToggleHandlers,
    sidebarClasses,
    isMenuExpanded: (menu: string) => expandedMenus[menu] || false,
  };
};

