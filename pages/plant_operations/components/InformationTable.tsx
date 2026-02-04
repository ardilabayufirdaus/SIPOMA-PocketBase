import React from 'react';
import { CcrInformationData } from '../../../hooks/useCcrInformationData';

interface InformationTableProps {
  informationData: CcrInformationData | null;
  t: Record<string, string>;
}

export const InformationTable: React.FC<InformationTableProps> = ({ informationData, t }) => {
  const hasData =
    informationData && informationData.information && informationData.information.trim() !== '';

  return (
    <div className="bg-white overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-[#F9F9F9]">
        <h3 className="text-sm font-bold text-[#E95420] flex items-center gap-2 uppercase tracking-wider">
          <div className="w-1.5 h-4 bg-[#772953] rounded-full"></div>
          {t.information || 'INFORMATION'}
        </h3>
      </div>

      <div className="p-6">
        {hasData ? (
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
              {informationData.information}
            </p>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-4">
            <p className="text-sm italic font-medium">
              {t.no_information_available || 'No information available for this date and unit.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
