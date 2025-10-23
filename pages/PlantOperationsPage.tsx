import React from 'react';
import PlaceholderPage from '../components/PlaceholderPage';
import PlantOperationsMasterData from './plant_operations/PlantOperationsMasterData';
import CcrDataEntryPage from './plant_operations/CcrDataEntryPage';
import AutonomousDataEntryPage from './plant_operations/AutonomousDataEntryPage';
import CopAnalysisPage from './plant_operations/CopAnalysisPage';
import ReportPage from './plant_operations/ReportPage';
import WorkInstructionLibraryPage from './plant_operations/WorkInstructionLibraryPage';
import WhatsAppGroupReportPage from './plant_operations/WhatsAppGroupReportPage';
import PlantOperationsDashboardPage from './plant_operations/PlantOperationsDashboardPage';
import UnifiedPlantOpsDashboard from './plant_operations/UnifiedPlantOpsDashboard';

interface PlantData {
  loading: boolean;
}

interface PlantOperationsPageProps {
  activePage: string;
  t: Record<string, string>;
  plantData?: PlantData;
}

const PlantOperationsPage: React.FC<PlantOperationsPageProps> = ({ activePage, t }) => {
  switch (activePage) {
    case 'op_dashboard':
      return <PlantOperationsDashboardPage t={t} />;
    case 'op_optimized_dashboard':
      return <UnifiedPlantOpsDashboard />;
    case 'op_report':
      return <ReportPage t={t} />;
    case 'op_wag_report':
      return <WhatsAppGroupReportPage />;
    case 'op_master_data':
      return <PlantOperationsMasterData t={t} />;
    case 'op_ccr_data_entry':
      return <CcrDataEntryPage t={t} />;
    case 'op_autonomous_data_entry':
      return <AutonomousDataEntryPage t={t} />;
    case 'op_cop_analysis':
      return <CopAnalysisPage t={t} />;
    case 'op_work_instruction_library':
      return <WorkInstructionLibraryPage t={t} />;
    default: {
      const pageTitle = t[activePage as keyof typeof t] || activePage;
      return <PlaceholderPage title={pageTitle} t={t} />;
    }
  }
};

export default PlantOperationsPage;
