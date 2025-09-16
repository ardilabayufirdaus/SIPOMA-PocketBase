import React from "react";
import PlaceholderPage from "../components/PlaceholderPage";
import PackingPlantMasterData from "./packing_plant/PackingPlantMasterData";
import PackingPlantStockData from "./packing_plant/PackingPlantStockData";
import PackingPlantStockForecast from "./packing_plant/PackingPlantStockForecast";
import LogisticsPerformance from "./packing_plant/LogisticsPerformance";
import { usePackingPlantMasterData } from "../hooks/usePackingPlantMasterData";
import { usePackingPlantStockData } from "../hooks/usePackingPlantStockData";

// Import permission utilities
import { usePermissions } from "../utils/permissions";
import { PermissionLevel } from "../types";
import { useCurrentUser } from "../hooks/useCurrentUser";

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
  </div>
);

const PackingPlantPage: React.FC<{ activePage: string; t: any }> = ({
  activePage,
  t,
}) => {
  const { records: masterData, loading: masterDataLoading } =
    usePackingPlantMasterData();
  const stockData = usePackingPlantStockData();

  // Permission check
  const { currentUser } = useCurrentUser();
  const permissionChecker = usePermissions(currentUser);
  const hasPackingPlantAccess = permissionChecker.hasPermission(
    "packing_plant",
    "READ"
  );

  if (masterDataLoading || stockData.loading) {
    return <LoadingSpinner />;
  }

  // Check permission before rendering
  if (!hasPackingPlantAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 text-red-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
            Access Denied
          </h3>
          <p className="text-red-600 dark:text-red-300">
            You don't have permission to access packing plant features.
          </p>
        </div>
      </div>
    );
  }

  const uniqueAreas = [...new Set(masterData.map((item) => item.area))];

  switch (activePage) {
    case "pack_master_data":
      return <PackingPlantMasterData t={t} />;
    case "pack_stock_data_entry":
      // FIX: Removed incorrect props. The PackingPlantStockData component fetches its own data via a hook.
      return <PackingPlantStockData t={t} areas={uniqueAreas} />;
    case "pack_stock_forecast":
      return (
        <PackingPlantStockForecast
          t={t}
          areas={uniqueAreas}
          stockRecords={stockData.records}
          masterData={masterData}
        />
      );
    case "pack_logistics_performance":
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
