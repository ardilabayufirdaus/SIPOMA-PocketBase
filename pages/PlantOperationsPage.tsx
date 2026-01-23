import React from 'react';
import PlaceholderPage from '../components/PlaceholderPage';
// Use lazy loading for sub-pages to isolate module failures and improve initial load time
const PlantOperationsMasterData = React.lazy(
  () => import('./plant_operations/PlantOperationsMasterData')
);
const RkcMasterDataPage = React.lazy(() => import('./plant_operations/RkcMasterDataPage'));
const CcrDataEntryPage = React.lazy(() => import('./plant_operations/CcrDataEntryPage'));
const RkcCcrDataEntryPage = React.lazy(() => import('./plant_operations/RkcCcrDataEntryPage'));
const AutonomousDataEntryPage = React.lazy(
  () => import('./plant_operations/AutonomousDataEntryPage')
);
const RkcAutonomousDataEntryPage = React.lazy(
  () => import('./plant_operations/RkcAutonomousDataEntryPage')
);
const CopAnalysisPage = React.lazy(() => import('./plant_operations/CopAnalysisPage'));
const RkcCopAnalysisPage = React.lazy(() => import('./plant_operations/RkcCopAnalysisPage'));
const ReportPage = React.lazy(() => import('./plant_operations/ReportPage'));
const WorkInstructionLibraryPage = React.lazy(
  () => import('./plant_operations/WorkInstructionLibraryPage')
);
const WhatsAppGroupReportPage = React.lazy(
  () => import('./plant_operations/WhatsAppGroupReportPage')
);
const RkcWhatsAppGroupReportPage = React.lazy(
  () => import('./plant_operations/RkcWhatsAppGroupReportPage')
);
const PlantOperationsDashboardPage = React.lazy(
  () => import('./plant_operations/PlantOperationsDashboardPage')
);
const MonitoringPage = React.lazy(() => import('./plant_operations/MonitoringPage'));
const PeopleChampionPage = React.lazy(() => import('./plant_operations/PeopleChampionPage'));

// Fallback component for suspense
const PageLoader = () => (
  <div className="w-full h-96 flex flex-col items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
    <p className="text-slate-500 text-sm">Loading module...</p>
  </div>
);

interface PlantData {
  loading: boolean;
}

interface PlantOperationsPageProps {
  activePage: string;
  t: Record<string, string>;
  plantData?: PlantData;
  section?: 'CM' | 'RKC';
}

const PlantOperationsPage: React.FC<PlantOperationsPageProps> = ({ activePage, t, section }) => {
  const renderContent = () => {
    switch (activePage) {
      case 'op_dashboard':
        return <PlantOperationsDashboardPage t={t} section={section} />;
      case 'op_report':
        return <ReportPage t={t} />;
      case 'op_people_champion':
        return <PeopleChampionPage />;
      case 'op_wag_report':
        return section === 'RKC' ? <RkcWhatsAppGroupReportPage /> : <WhatsAppGroupReportPage />;
      case 'op_master_data':
        return section === 'RKC' ? (
          <RkcMasterDataPage t={t} />
        ) : (
          <PlantOperationsMasterData t={t} />
        );
      case 'op_ccr_data_entry':
        return section === 'RKC' ? <RkcCcrDataEntryPage t={t} /> : <CcrDataEntryPage t={t} />;
      case 'op_autonomous_data_entry':
        return section === 'RKC' ? (
          <RkcAutonomousDataEntryPage t={t} />
        ) : (
          <AutonomousDataEntryPage t={t} />
        );
      case 'op_cop_analysis':
        return section === 'RKC' ? <RkcCopAnalysisPage t={t} /> : <CopAnalysisPage t={t} />;
      case 'op_work_instruction_library':
        return <WorkInstructionLibraryPage t={t} />;
      case 'op_monitoring':
        return <MonitoringPage t={t} />;
      default: {
        const pageTitle = t[activePage as keyof typeof t] || activePage;
        return <PlaceholderPage title={pageTitle} t={t} />;
      }
    }
  };

  return <React.Suspense fallback={<PageLoader />}>{renderContent()}</React.Suspense>;
};

export default PlantOperationsPage;
