import React from 'react';
import PlaceholderPage from '../../components/PlaceholderPage';

interface PlantOperationsDashboardPageProps {
  t: Record<string, string>;
}

const PlantOperationsDashboardPage: React.FC<PlantOperationsDashboardPageProps> = ({ t }) => {
  return <PlaceholderPage title="Plant Operations Dashboard" t={t} />;
};

export default PlantOperationsDashboardPage;
