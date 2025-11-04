import React from 'react';
import { motion } from 'framer-motion';
import { CcrInformationData } from '../../../hooks/useCcrInformationData';

interface InformationTableProps {
  informationData: CcrInformationData | null;
  t: Record<string, string>;
}

export const InformationTable: React.FC<InformationTableProps> = ({ informationData, t }) => {
  const hasData =
    informationData && informationData.information && informationData.information.trim() !== '';

  return (
    <motion.div
      className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-xl overflow-hidden border border-blue-200/50 mt-6"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="p-4 border-b border-blue-200/50 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
          {t.information || 'Information'}
        </h3>
      </div>

      <div className="p-6">
        {hasData ? (
          <div className="prose prose-sm max-w-none">
            <p className="text-[6px] text-slate-700 whitespace-pre-wrap leading-relaxed">
              {informationData.information}
            </p>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-8">
            <p className="text-[6px] italic">
              {t.no_information_available || 'No information available for this date and unit.'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
