/**
 * Konfigurasi untuk lazy loaded components yang lebih sesuai dengan production build
 * File ini menggunakan pendekatan yang dioptimalkan untuk Vite bundling
 */

import React from 'react';
import { createLazyComponent } from '../utils/LazyLoadingFixed';

// Import LoadingSkeleton component
import LoadingSkeleton from '../../components/LoadingSkeleton';

// Default error fallback
const DefaultErrorFallback = ({ name }: { name: string }) => (
  <div className="text-center p-8 bg-red-50 border border-red-300 rounded">
    Error loading {name}. Please refresh.
  </div>
);

/**
 * Dashboard Pages
 */
export const MainDashboardPage = createLazyComponent(
  () => import('../../pages/MainDashboardPage'),
  {
    displayName: 'MainDashboardPage',
    loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
    errorFallback: <DefaultErrorFallback name="Dashboard" />,
  }
);

/**
 * API Connectivity Testing
 */
export const ConnectionTesterPage = createLazyComponent(
  () => import('../../components/ConnectionTester'),
  {
    displayName: 'ConnectionTesterPage',
    loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
    errorFallback: <DefaultErrorFallback name="Connection Tester" />,
  }
);

/**
 * Plant Operations Pages
 */
export const PlantOperationsPage = createLazyComponent(
  () => import('../../pages/PlantOperationsPage'),
  {
    displayName: 'PlantOperationsPage',
    loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
    errorFallback: <DefaultErrorFallback name="Plant Operations" />,
    onError: (error: Error) => {
      // Log to monitoring service
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Failed to load PlantOperationsPage:', error);
      }
    },
  }
);

/**
 * Project Management
 */
export const ProjectManagementPage = createLazyComponent(
  () => import('../../pages/ProjectManagementPage'),
  {
    displayName: 'ProjectManagementPage',
    loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
    errorFallback: <DefaultErrorFallback name="Project Management" />,
  }
);

/**
 * Inspection Pages
 */
export const InspectionPage = createLazyComponent(() => import('../../pages/InspectionPage'), {
  displayName: 'InspectionPage',
  loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
  errorFallback: <DefaultErrorFallback name="Inspection" />,
});

/**
 * User Management Pages
 */
export const UserListPage = createLazyComponent(
  () => import('../../features/user-management/pages/UserListPage'),
  {
    displayName: 'UserListPage',
    loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
    errorFallback: <DefaultErrorFallback name="User List" />,
  }
);

export const UserActivityPage = createLazyComponent(
  () => import('../../features/user-management/pages/UserActivityPage'),
  {
    displayName: 'UserActivityPage',
    loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
    errorFallback: <DefaultErrorFallback name="User Activity" />,
  }
);

/**
 * Settings Page
 */
export const SettingsPage = createLazyComponent(() => import('../../pages/SettingsPage'), {
  displayName: 'SettingsPage',
  loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
  errorFallback: <DefaultErrorFallback name="Settings" />,
});

/**
 * WhatsApp Reports Pages
 */
export const WhatsAppReportsPage = createLazyComponent(
  () => import('../../pages/plant_operations/WhatsAppGroupReportPage'),
  {
    displayName: 'WhatsAppReportsPage',
    loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
    errorFallback: <DefaultErrorFallback name="WhatsApp Reports" />,
  }
);
