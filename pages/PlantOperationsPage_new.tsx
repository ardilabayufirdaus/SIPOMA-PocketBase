import React from "react";
import PlaceholderPage from "../components/PlaceholderPage";
import PlantOperationsMasterData from "./plant_operations/PlantOperationsMasterData";
import CcrDataEntryPage from "./plant_operations/CcrDataEntryPage";
import AutonomousDataEntryPage from "./plant_operations/AutonomousDataEntryPage";
import CopAnalysisPage from "./plant_operations/CopAnalysisPage";
import ReportPage from "./plant_operations/ReportPage";
import WorkInstructionLibraryPage from "./plant_operations/WorkInstructionLibraryPage";

interface PlantData {
  machines: any[];
  kpis: any[];
  alerts: any[];
  productionData: any[];
  toggleMachineStatus: (machineId: string) => void;
}

interface PageProps {
  t: any;
  plantData: PlantData;
}

const PlantOperationsDashboard: React.FC<PageProps> = ({ t, plantData }) => {
  // Temporary placeholder for development - remove when data is available
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-12 h-12 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          {t.plant_operations_dashboard || "Plant Operations Dashboard"}
        </h3>
        <p className="text-slate-600 mb-6">
          {t.under_development ||
            "Fitur ini sedang dalam pengembangan. Dashboard operasi pabrik akan segera tersedia dengan data real-time."}
        </p>
        <div className="flex justify-center space-x-4 text-sm text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>KPI Monitoring</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Machine Status</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Live Alerts</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Production Charts</span>
          </div>
        </div>
      </div>

      {/* Future feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-blue-800">KPI Overview</h4>
            <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-blue-600">Monitoring performa real-time</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-green-800">Machine Status</h4>
            <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm text-green-600">Status mesin dan equipment</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-yellow-800">Live Alerts</h4>
            <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm text-yellow-600">Peringatan dan notifikasi</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-red-800">Production Data</h4>
            <div className="w-8 h-8 bg-red-200 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-red-600">Grafik produksi dan analisis</p>
        </div>
      </div>
    </div>
  );
};

interface PlantOperationsPageProps {
  activePage: string;
  t: any;
  plantData: PlantData;
}

const PlantOperationsPage: React.FC<PlantOperationsPageProps> = ({
  activePage,
  t,
  plantData,
}) => {
  switch (activePage) {
    case "op_dashboard":
      return <PlantOperationsDashboard t={t} plantData={plantData} />;
    case "op_report":
      return <ReportPage t={t} />;
    case "op_master_data":
      return <PlantOperationsMasterData t={t} />;
    case "op_ccr_data_entry":
      return <CcrDataEntryPage t={t} />;
    case "op_autonomous_data_entry":
      return <AutonomousDataEntryPage t={t} />;
    case "op_cop_analysis":
      return <CopAnalysisPage t={t} />;
    case "op_work_instruction_library":
      return <WorkInstructionLibraryPage t={t} />;
    default:
      const pageTitle = t[activePage as keyof typeof t] || activePage;
      return <PlaceholderPage title={pageTitle} t={t} />;
  }
};

export default PlantOperationsPage;
