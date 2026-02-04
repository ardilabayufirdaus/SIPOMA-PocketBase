import React, { useRef } from 'react';
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
    <div
      ref={reportRef}
      className="w-full space-y-6 overflow-hidden pb-8 bg-[#F7F7F7] min-h-screen p-6 font-sans"
    >
      {/* Report Header - Ubuntu Theme */}
      <div className="bg-gradient-to-r from-[#772953] to-[#E95420] rounded-xl shadow-lg p-6 border-b-4 border-[#E95420]">
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0 bg-white/10 p-2 rounded-lg backdrop-blur-sm">
            <img src="/sipoma-logo.png" alt="Sipoma Logo" className="h-10 w-auto" />
          </div>
          <div className="text-center flex-1">
            <h1
              className={`${isDailyOperationalReport ? 'text-2xl' : 'text-3xl'} font-bold text-white mb-1 tracking-tight`}
            >
              {title}
            </h1>
            <p
              className={`${isDailyOperationalReport ? 'text-sm' : 'text-base'} text-white/90 font-medium`}
            >
              {date}
            </p>
          </div>
          <div className="flex-shrink-0 bg-white/10 p-2 rounded-lg backdrop-blur-sm">
            <img src="/tonasa-logo.png" alt="Tonasa Logo" className="h-12 w-auto" />
          </div>
        </div>
      </div>

      {/* Parameter Data Table - Full Width */}
      <div className="shadow-sm rounded-xl overflow-hidden bg-white border border-slate-200">
        <ParameterTable groupedHeaders={groupedHeaders} rows={rows} footer={footer} t={t} />
      </div>

      {/* Downtime Report - Full Width */}
      <div className="shadow-sm rounded-xl overflow-hidden bg-white border border-slate-200">
        <DowntimeTable downtimeData={downtimeData} t={t} />
      </div>

      {/* Information Table - Full Width */}
      <div className="shadow-sm rounded-xl overflow-hidden bg-white border border-slate-200">
        <InformationTable informationData={informationData} t={t} />
      </div>

      {/* Compact Horizontal Layout for Remaining Tables */}
      {isDailyOperationalReport && (
        <div className="grid gap-6 mt-6 xl:grid-cols-[0.8fr_1.8fr_1.8fr] lg:grid-cols-1">
          <div className="shadow-sm rounded-xl overflow-hidden bg-white border border-slate-200 h-fit">
            <OperatorTable operatorData={operatorData} t={t} />
          </div>
          <div className="shadow-sm rounded-xl overflow-hidden bg-white border border-slate-200 h-fit">
            <MaterialUsageTable materialUsageData={materialUsageData} t={t} />
          </div>
          <div className="shadow-sm rounded-xl overflow-hidden bg-white border border-slate-200 h-fit">
            <SiloTable siloData={siloData} t={t} />
          </div>
        </div>
      )}
    </div>
  );
};
