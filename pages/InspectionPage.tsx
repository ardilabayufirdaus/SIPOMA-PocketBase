import React, { lazy, Suspense } from 'react';
import { Page } from '../App';
import LoadingSkeleton from '../components/LoadingSkeleton';

// Use lazy loading untuk semua subhalaman
const InspectionDashboard = lazy(() =>
  import('./InspectionDashboardPage').catch(() => ({
    default: () => <div className="p-8 text-center">Error loading Inspection Dashboard</div>,
  }))
);

const InspectionDetails = lazy(() =>
  import('./InspectionDetailsPage').catch(() => ({
    default: () => <div className="p-8 text-center">Error loading Inspection Details</div>,
  }))
);

const InspectionForm = lazy(() =>
  import('./InspectionFormPage').catch(() => ({
    default: () => <div className="p-8 text-center">Error loading Inspection Form</div>,
  }))
);

const InspectionReports = lazy(() =>
  import('./InspectionReportsPage').catch(() => ({
    default: () => <div className="p-8 text-center">Error loading Inspection Reports</div>,
  }))
);

/**
 * Inspection Module Container
 *
 * Container utama untuk modul Inspection
 */
const InspectionPage: React.FC<{
  language: 'en' | 'id';
  subPage: string;
  onNavigate: (page: Page, subPage?: string) => void;
}> = ({ language, subPage, onNavigate }) => {
  // Render berdasarkan subPage
  const renderContent = () => {
    switch (subPage) {
      case 'insp_dashboard':
        return <InspectionDashboard language={language} onNavigate={onNavigate} />;
      case 'insp_details':
        return <InspectionDetails language={language} onNavigate={onNavigate} />;
      case 'insp_form':
        return <InspectionForm language={language} onNavigate={onNavigate} />;
      case 'insp_reports':
        return <InspectionReports language={language} onNavigate={onNavigate} />;
      default:
        return <InspectionDashboard language={language} onNavigate={onNavigate} />;
    }
  };

  return (
    <Suspense
      fallback={
        <div className="p-6">
          <LoadingSkeleton lines={10} />
        </div>
      }
    >
      {renderContent()}
    </Suspense>
  );
};

export default InspectionPage;

