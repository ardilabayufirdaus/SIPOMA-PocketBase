import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ParameterTable } from './ParameterTable';
import { OperatorTable } from './OperatorTable';
import { SiloTable } from './SiloTable';
import { DowntimeTable } from './DowntimeTable';
import { InformationTable } from './InformationTable';
import { MaterialUsageTable } from './MaterialUsageTable';
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
  materialUsageData: Array<{
    shift: string;
    clinker?: number;
    gypsum?: number;
    limestone?: number;
    trass?: number;
    fly_ash?: number;
    fine_trass?: number;
    ckd?: number;
    total_production?: number;
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
  materialUsageData,
  t,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const isDailyOperationalReport = title.toUpperCase().includes('DAILY OPERATIONAL REPORT');

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
        className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl shadow-lg p-6 border border-orange-200/50"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0">
            <img src="/sipoma-logo.png" alt="Sipoma Logo" className="h-9 w-auto" />
          </div>
          <div className="text-center flex-1">
            <h1
              className={`${isDailyOperationalReport ? 'text-xl' : 'text-2xl'} font-bold text-orange-600 mb-2`}
            >
              {title}
            </h1>
            <p
              className={`${isDailyOperationalReport ? 'text-xs' : 'text-sm'} text-slate-600 font-medium`}
            >
              {date}
            </p>
          </div>
          <div className="flex-shrink-0">
            <img src="/tonasa-logo.png" alt="Tonasa Logo" className="h-11 w-auto" />
          </div>
        </div>
      </motion.div>

      {/* Parameter Data Table - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <ParameterTable groupedHeaders={groupedHeaders} rows={rows} footer={footer} t={t} />
      </motion.div>

      {/* Downtime Report - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <DowntimeTable downtimeData={downtimeData} t={t} />
      </motion.div>

      {/* Information Table - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <InformationTable informationData={informationData} t={t} />
      </motion.div>

      {/* 3-Column Grid Layout for Remaining Tables */}
      {isDailyOperationalReport && (
        <div className="grid grid-cols-[0.8fr_1.6fr_1.6fr] gap-2 mt-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <OperatorTable operatorData={operatorData} t={t} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
          >
            <MaterialUsageTable materialUsageData={materialUsageData} t={t} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <SiloTable siloData={siloData} t={t} />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
