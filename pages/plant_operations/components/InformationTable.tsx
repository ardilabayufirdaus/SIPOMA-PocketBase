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
    <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 rounded-2xl shadow-2xl overflow-hidden border-2 border-indigo-200/50 mt-4">
      <div className="p-3 border-b-2 border-indigo-300/50 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"></div>
          {t.information || 'Information'}
        </h3>
      </div>

      <div className="p-4 sm:p-6">
        {hasData ? (
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-gradient-to-r from-indigo-50/50 to-violet-50/50 p-3 rounded-xl border border-indigo-200/30">
              {informationData.information}
            </p>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-6">
            <p className="text-sm italic font-medium">
              {t.no_information_available || 'No information available for this date and unit.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
