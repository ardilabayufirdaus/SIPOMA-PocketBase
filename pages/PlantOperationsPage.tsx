import React from "react";
import PlaceholderPage from "../components/PlaceholderPage";
import Monitoring from "../components/plant_operations/Monitoring";
import useCcrDowntimeData from "../hooks/useCcrDowntimeData";
import { useAutonomousRiskData } from "../hooks/useAutonomousRiskData";
import PlantOperationsMasterData from "./plant_operations/PlantOperationsMasterData";
import PlantOperationsDashboardComponent from "./plant_operations/dashboard/PlantOperationsDashboard";
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

interface PlantOperationsPageProps {
  activePage: string;
  t: any;
  plantData: PlantData;
}

interface PageProps {
  t: any;
  plantData: PlantData;
}

const PlantOperationsPage: React.FC<PlantOperationsPageProps> = ({
  activePage,
  t,
  plantData,
}) => {
  const { getAllDowntime } = useCcrDowntimeData();
  const { records: riskRecords } = useAutonomousRiskData();

  switch (activePage) {
    case "op_dashboard":
      return <PlantOperationsDashboardComponent />;
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
    case "op_monitoring":
      return (
        <Monitoring
          downtimeData={getAllDowntime()}
          riskData={riskRecords}
          t={t}
        />
      );
    default:
      const pageTitle = t[activePage as keyof typeof t] || activePage;
      return <PlaceholderPage title={pageTitle} t={t} />;
  }
};

export default PlantOperationsPage;
