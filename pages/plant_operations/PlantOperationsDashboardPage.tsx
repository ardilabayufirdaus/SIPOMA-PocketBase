import React from 'react';
import PlaceholderPage from '../../components/PlaceholderPage';

interface PlantOperationsDashboardPageProps {
  t: Record<string, string>;
  section?: 'CM' | 'RKC';
}

const PlantOperationsDashboardPage: React.FC<PlantOperationsDashboardPageProps> = ({
  t,
  section,
}) => {
  return <PlaceholderPage title={`${section || 'Plant'} Operations Dashboard`} t={t} />;
};

export default PlantOperationsDashboardPage;
