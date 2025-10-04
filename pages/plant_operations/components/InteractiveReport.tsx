import React, { useRef } from 'react';
import { ParameterTable } from './ParameterTable';
import { OperatorTable } from './OperatorTable';
import { SiloTable } from './SiloTable';
import { DowntimeTable } from './DowntimeTable';
import { CcrDowntimeData } from '../../../types';

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
  operatorData,
  t,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={reportRef} className="space-y-6 max-w-full overflow-hidden pb-8">
      {/* Report Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-3">
        <div className="text-center flex-1">
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">{title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{date}</p>
        </div>
      </div>

      {/* Parameter Data Table */}
      <ParameterTable groupedHeaders={groupedHeaders} rows={rows} footer={footer} t={t} />

      {/* Operator Data Table */}
      <OperatorTable operatorData={operatorData} t={t} />

      {/* Silo Stock Table */}
      <SiloTable siloData={siloData} t={t} />

      {/* Downtime Table */}
      <DowntimeTable downtimeData={downtimeData} t={t} />
    </div>
  );
};
