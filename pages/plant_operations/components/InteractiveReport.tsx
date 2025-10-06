import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ParameterTable } from './ParameterTable';
import { OperatorTable } from './OperatorTable';
import { SiloTable } from './SiloTable';
import { DowntimeTable } from './DowntimeTable';
import { InformationTable } from './InformationTable';
import { CcrDowntimeData } from '../../../types';
import { CcrInformationData } from '../../../hooks/useCcrInformationData';

interface InteractiveReportProps {
  groupedHeaders: Array<{
    category: string;
    parameters: Array<{
      id: string;
      parameter: string;
      unit: string;
      data_type: string;
    }>;
  }>;
  rows: Array<{
    hour: number;
    shift: string;
    values: Record<string, string | number>;
  }>;
  footer: Record<string, Record<string, string>>;
  title: string;
  date: string;
  downtimeData: CcrDowntimeData[];
  siloData: Array<{
    master: {
      silo_name: string;
      capacity: number;
    };
    shift1: {
      emptySpace?: number;
      content?: number;
    };
    shift2: {
      emptySpace?: number;
      content?: number;
    };
    shift3: {
      emptySpace?: number;
      content?: number;
    };
  }>;
  informationData: CcrInformationData | null;
  operatorData: Array<{
    shift: string;
    name: string;
  }>;
  t: Record<string, string>;
}

export const InteractiveReport: React.FC<InteractiveReportProps> = ({
  groupedHeaders,
  rows,
  footer,
  title,
  date,
  downtimeData,
  siloData,
  informationData,
  operatorData,
  t,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={reportRef}
      className="space-y-6 max-w-full overflow-hidden pb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Report Header */}
      <motion.div
        className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl shadow-lg p-6 border border-orange-200/50 dark:border-orange-800/50"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">{title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{date}</p>
        </div>
      </motion.div>

      {/* Parameter Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <ParameterTable groupedHeaders={groupedHeaders} rows={rows} footer={footer} t={t} />
      </motion.div>

      {/* Information Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <InformationTable informationData={informationData} t={t} />
      </motion.div>

      {/* Operator Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <OperatorTable operatorData={operatorData} t={t} />
      </motion.div>

      {/* Silo Stock Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <SiloTable siloData={siloData} t={t} />
      </motion.div>

      {/* Downtime Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <DowntimeTable downtimeData={downtimeData} t={t} />
      </motion.div>
    </motion.div>
  );
};
