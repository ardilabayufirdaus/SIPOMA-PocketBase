import React from "react";
import PlaceholderPage from "../components/PlaceholderPage";

interface SLAManagementPageProps {
  t: any;
}

const SLAManagementPage: React.FC<SLAManagementPageProps> = ({ t }) => {
  return <PlaceholderPage title={t.slaManagement} t={t} />;
};

export default SLAManagementPage;
