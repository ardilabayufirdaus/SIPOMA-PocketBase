import React from 'react';
import PlaceholderPage from '../components/PlaceholderPage';
import PackingPlantMasterData from './packing_plant/PackingPlantMasterData';
import PackingPlantStockData from './packing_plant/PackingPlantStockData';
import PackingPlantStockForecast from './packing_plant/PackingPlantStockForecast';
import LogisticsPerformance from './packing_plant/LogisticsPerformance';
import { usePackingPlantMasterData } from '../hooks/usePackingPlantMasterData';
import { usePackingPlantStockData } from '../hooks/usePackingPlantStockData';

// Import permission utilities
import { usePermissions } from '../utils/permissions';
import { PermissionLevel } from '../types';
import { useCurrentUser } from '../hooks/useCurrentUser';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
  </div>
);

const PackingPlantPage: React.FC<{ activePage: string; t: any }> = ({ activePage, t }) => {
  const { records: masterData, loading: masterDataLoading } = usePackingPlantMasterData();
  const stockData = usePackingPlantStockData();

  // Permission check
  const { currentUser } = useCurrentUser();
  const permissionChecker = usePermissions(currentUser);
  const hasPackingPlantAccess = permissionChecker.hasPermission('packing_plant', 'READ');

  if (masterDataLoading || stockData.loading) {
    return <LoadingSpinner />;
  }

  // Check permission before rendering
  if (!hasPackingPlantAccess) {
    return null;
  }

  const uniqueAreas = [...new Set(masterData.map((item) => item.area))];

  switch (activePage) {
    case 'pack_master_data':
      return <PackingPlantMasterData t={t} />;
    case 'pack_stock_data_entry':
      // FIX: Removed incorrect props. The PackingPlantStockData component fetches its own data via a hook.
      return <PackingPlantStockData t={t} areas={uniqueAreas} />;
    case 'pack_stock_forecast':
      return (
        <PackingPlantStockForecast
          t={t}
          areas={uniqueAreas}
          stockRecords={stockData.records}
          masterData={masterData}
        />
      );
    case 'pack_logistics_performance':
      return (
        <LogisticsPerformance
          t={t}
          areas={uniqueAreas}
          stockRecords={stockData.records}
          masterData={masterData}
        />
      );
    default:
      const pageTitle = t[activePage as keyof typeof t] || activePage;
      return <PlaceholderPage title={pageTitle} t={t} />;
  }
};

export default PackingPlantPage;
