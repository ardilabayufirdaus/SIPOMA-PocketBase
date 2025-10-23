import React, { useState, useEffect } from 'react';
import { WhatsAppGroupReport } from './WhatsAppGroupReport';
import { getDependencyContainer } from '../../infrastructure/dependency-container';
import { GroupReport } from '../../domain/entities/whatsapp';

interface WhatsAppGroupReportContainerProps {
  groupId: string;
}

export const WhatsAppGroupReportContainer: React.FC<WhatsAppGroupReportContainerProps> = ({
  groupId,
}) => {
  const [reports, setReports] = useState<GroupReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize use cases using dependency injection
  const container = getDependencyContainer();
  const generateReportUseCase = container.createGenerateGroupReportUseCase();
  const getReportsUseCase = container.createGetGroupReportsUseCase();

  useEffect(() => {
    loadReports();
  }, [groupId]);

  const loadReports = async () => {
    try {
      setError(null);
      const groupReports = await getReportsUseCase.execute(groupId);
      setReports(groupReports);
    } catch (err) {
      setError('Failed to load reports');
      console.error('Error loading reports:', err);
    }
  };

  const handleGenerateReport = async (
    groupId: string,
    reportType: 'daily' | 'weekly' | 'monthly'
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      await generateReportUseCase.execute(groupId, reportType);
      await loadReports(); // Reload reports after generation
    } catch (err) {
      setError('Failed to generate report');
      console.error('Error generating report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="w-full p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadReports}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <WhatsAppGroupReport
      groupId={groupId}
      onGenerateReport={handleGenerateReport}
      reports={reports}
      isLoading={isLoading}
    />
  );
};


