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
      className="w-full space-y-4 overflow-hidden pb-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen p-4"
    >
      {/* Report Header */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl p-4 sm:p-6 border-2 border-white/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0">
            <img src="/sipoma-logo.png" alt="Sipoma Logo" className="h-10 w-auto drop-shadow-lg" />
          </div>
          <div className="text-center flex-1">
            <h1
              className={`${isDailyOperationalReport ? 'text-xl' : 'text-2xl'} font-bold text-white mb-1 drop-shadow-lg`}
            >
              {title}
            </h1>
            <p
              className={`${isDailyOperationalReport ? 'text-sm' : 'text-sm'} text-white/90 font-medium drop-shadow-md`}
            >
              {date}
            </p>
          </div>
          <div className="flex-shrink-0">
            <img src="/tonasa-logo.png" alt="Tonasa Logo" className="h-12 w-auto drop-shadow-lg" />
          </div>
        </div>
      </div>

      {/* Parameter Data Table - Full Width */}
      <div>
        <ParameterTable groupedHeaders={groupedHeaders} rows={rows} footer={footer} t={t} />
      </div>

      {/* Downtime Report - Full Width */}
      <div>
        <DowntimeTable downtimeData={downtimeData} t={t} />
      </div>

      {/* Information Table - Full Width */}
      <div>
        <InformationTable informationData={informationData} t={t} />
      </div>

      {/* Compact Horizontal Layout for Remaining Tables */}
      {isDailyOperationalReport && (
        <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: '0.8fr 1.8fr 1.8fr' }}>
          <div>
            <OperatorTable operatorData={operatorData} t={t} />
          </div>
          <div>
            <MaterialUsageTable materialUsageData={materialUsageData} t={t} />
          </div>
          <div>
            <SiloTable siloData={siloData} t={t} />
          </div>
        </div>
      )}
    </div>
  );
};
