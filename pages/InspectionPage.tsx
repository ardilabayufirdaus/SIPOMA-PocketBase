import React, { Suspense } from 'react';
import PlaceholderPage from '../components/PlaceholderPage';

// Lazy load the form page
const InspectionFormPage = React.lazy(() => import('./inspection/InspectionFormPage'));

// Fallback component for suspense
const PageLoader = () => (
  <div className="w-full h-96 flex flex-col items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
    <p className="text-slate-500 text-sm">Loading module...</p>
  </div>
);

interface InspectionPageProps {
  activePage: string;
  t: Record<string, string>;
}

const InspectionPage: React.FC<InspectionPageProps> = ({ activePage, t }) => {
  const renderContent = () => {
    switch (activePage) {
      case 'insp_dashboard':
        return <PlaceholderPage title={t.insp_dashboard || 'Inspection Dashboard'} t={t} />;
      case 'insp_form':
        return <InspectionFormPage t={t} />;
      case 'insp_details':
        return <PlaceholderPage title={t.insp_details || 'Inspection Details'} t={t} />;
      case 'insp_reports':
        return <PlaceholderPage title={t.insp_reports || 'Inspection Reports'} t={t} />;
      default: {
        const pageTitle = t[activePage as keyof typeof t] || activePage;
        return <PlaceholderPage title={pageTitle} t={t} />;
      }
    }
  };

  return <Suspense fallback={<PageLoader />}>{renderContent()}</Suspense>;
};

export default InspectionPage;
