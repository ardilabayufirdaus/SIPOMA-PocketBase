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
      className="bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-800 dark:to-purple-900/10 rounded-xl shadow-xl overflow-hidden border border-purple-200/50 dark:border-purple-800/50 mt-6"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="p-4 border-b border-purple-200/50 dark:border-purple-700/50 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></div>
          {t.information || 'Information'}
        </h3>
      </div>

      <div className="p-6">
        {hasData ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {informationData.information}
            </p>
          </div>
        ) : (
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            <p className="text-sm italic">
              {t.no_information_available || 'No information available for this date and unit.'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
