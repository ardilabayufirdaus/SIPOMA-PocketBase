import { RouteObject } from 'react-router-dom';
import UnifiedPlantOpsDashboard from '../pages/plant_operations/UnifiedPlantOpsDashboard';

/**
 * Routes for the optimized plant operations dashboard
 */
export const optimizedDashboardRoutes: RouteObject[] = [
  {
    path: '/plant-operations/dashboard',
    element: <UnifiedPlantOpsDashboard />,
  },
];

