/**
 * Konfigurasi untuk lazy loaded components
 * File ini berisi semua definisi komponen yang dimuat secara lazy
 */

import React from 'react';
import { createStandardLazy } from '../components/LazyLoading';
import LoadingSkeleton from '../components/LoadingSkeleton';

/**
 * Dashboard Pages
 */
export const MainDashboardPage = createStandardLazy({
  importPath: '../pages/MainDashboardPage.tsx',
  displayName: 'MainDashboardPage',
  loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
  errorFallback: (
    <div className="text-center p-8 bg-red-50 border border-red-300 rounded">
      Error loading Dashboard. Please refresh.
    </div>
  ),
});

/**
 * Plant Operations Pages
 */
export const PlantOperationsPage = createStandardLazy({
  importPath: '../pages/PlantOperationsPage.tsx',
  displayName: 'PlantOperationsPage',
  loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
  errorFallback: (
    <div className="text-center p-8 bg-red-50 border border-red-300 rounded">
      Error loading Plant Operations. Please refresh.
    </div>
  ),
  onError: (error: Error) => {
    // Log to monitoring service
    // In production this would send to an error monitoring service
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Failed to load PlantOperationsPage:', error);
    }
  },
});

/**
 * Project Management
 */
export const ProjectManagementPage = createStandardLazy({
  importPath: '../pages/ProjectManagementPage.tsx',
  displayName: 'ProjectManagementPage',
  loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
  errorFallback: (
    <div className="text-center p-8 bg-red-50 border border-red-300 rounded">
      Error loading Project Management. Please refresh.
    </div>
  ),
});

/**
 * Inspection Pages
 */
export const InspectionPage = createStandardLazy({
  importPath: '../pages/InspectionPage.tsx',
  displayName: 'InspectionPage',
  loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
  errorFallback: (
    <div className="text-center p-8 bg-red-50 border border-red-300 rounded">
      Error loading Inspection. Please refresh.
    </div>
  ),
});

/**
 * User Management Pages
 */
export const UserListPage = createStandardLazy({
  importPath: '../features/user-management/pages/UserListPage.tsx',
  displayName: 'UserListPage',
  loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
  errorFallback: (
    <div className="text-center p-8 bg-red-50 border border-red-300 rounded">
      Error loading User List. Please refresh.
    </div>
  ),
});

export const UserActivityPage = createStandardLazy({
  importPath: '../features/user-management/pages/UserActivityPage.tsx',
  displayName: 'UserActivityPage',
  loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
  errorFallback: (
    <div className="text-center p-8 bg-red-50 border border-red-300 rounded">
      Error loading User Activity. Please refresh.
    </div>
  ),
});

/**
 * Settings Page
 */
export const SettingsPage = createStandardLazy({
  importPath: '../pages/SettingsPage.tsx',
  displayName: 'SettingsPage',
  loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
  errorFallback: (
    <div className="text-center p-8 bg-red-50 border border-red-300 rounded">
      Error loading Settings. Please refresh.
    </div>
  ),
});

/**
 * WhatsApp Reports Pages
 */
export const WhatsAppReportsPage = createStandardLazy({
  importPath: '../pages/plant_operations/WhatsAppGroupReportPage.tsx',
  displayName: 'WhatsAppReportsPage',
  loadingFallback: <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
  errorFallback: (
    <div className="text-center p-8 bg-red-50 border border-red-300 rounded">
      Error loading WhatsApp Reports. Please refresh.
    </div>
  ),
});

