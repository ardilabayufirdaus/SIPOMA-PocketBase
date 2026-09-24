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
const DerivativeWhatsAppGroupReportPage = React.lazy(
  () => import('./plant_operations/DerivativeWhatsAppGroupReportPage')
);
const DerivativeMasterDataPage = React.lazy(
  () => import('./plant_operations/DerivativeMasterDataPage')
);
const DerivativeCcrDataEntryPage = React.lazy(
  () => import('./plant_operations/DerivativeCcrDataEntryPage')
);
const DerivativeCopAnalysisPage = React.lazy(
  () => import('./plant_operations/DerivativeCopAnalysisPage')
);
const DerivativeAutonomousDataEntryPage = React.lazy(
  () => import('./plant_operations/DerivativeAutonomousDataEntryPage')
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
  section?: 'CM' | 'RKC' | 'Derivative';
}

const DerivativeReportPage = React.lazy(() => import('./plant_operations/DerivativeReportPage'));
const RkcReportPage = React.lazy(() => import('./plant_operations/RkcReportPage'));

const PlantOperationsPage: React.FC<PlantOperationsPageProps> = ({ activePage, t, section }) => {
  const renderContent = () => {
    switch (activePage) {
      case 'op_dashboard':
        return <PlantOperationsDashboardPage t={t} section={section} />;
      case 'op_report':
        if (section === 'Derivative') return <DerivativeReportPage t={t} />;
        if (section === 'RKC') return <RkcReportPage t={t} />;
        return <ReportPage t={t} />;
      case 'op_people_champion':
        return <PeopleChampionPage section={section} />;
      case 'op_wag_report':
        if (section === 'Derivative') return <DerivativeWhatsAppGroupReportPage />;
        return section === 'RKC' ? <RkcWhatsAppGroupReportPage /> : <WhatsAppGroupReportPage />;
      case 'op_master_data':
        if (section === 'Derivative') return <DerivativeMasterDataPage t={t} />;
        return section === 'RKC' ? (
          <RkcMasterDataPage t={t} />
        ) : (
          <PlantOperationsMasterData t={t} />
        );
      case 'op_ccr_data_entry':
        if (section === 'Derivative') return <DerivativeCcrDataEntryPage t={t} />;
        return section === 'RKC' ? <RkcCcrDataEntryPage t={t} /> : <CcrDataEntryPage t={t} />;
      case 'op_autonomous_data_entry':
        if (section === 'Derivative') return <DerivativeAutonomousDataEntryPage t={t} />;
        return section === 'RKC' ? (
          <RkcAutonomousDataEntryPage t={t} />
        ) : (
          <AutonomousDataEntryPage t={t} />
        );
      case 'op_cop_analysis':
        if (section === 'Derivative') return <DerivativeCopAnalysisPage t={t} />;
        return section === 'RKC' ? <RkcCopAnalysisPage t={t} /> : <CopAnalysisPage t={t} />;
      case 'op_work_instruction_library':
        return <WorkInstructionLibraryPage t={t} section={section} />;
      case 'op_monitoring':
        return <MonitoringPage t={t} section={section} />;
      default: {
        const pageTitle = t[activePage as keyof typeof t] || activePage;
        return <PlaceholderPage title={pageTitle} t={t} />;
      }
    }
  };

  return <React.Suspense fallback={<PageLoader />}>{renderContent()}</React.Suspense>;
};

export default PlantOperationsPage;
