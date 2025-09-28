import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { ParameterTable } from './ParameterTable';
import { OperatorTable } from './OperatorTable';
import { SiloTable } from './SiloTable';
import { DowntimeTable } from './DowntimeTable';
import { CcrDowntimeData } from '../../../types';
import { EnhancedButton } from '../../../components/ui/EnhancedComponents';

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
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopyImage = async () => {
    if (!reportRef.current) return;

    setIsCopying(true);
    setCopySuccess(false);

    try {
      const element = reportRef.current;
      const rect = element.getBoundingClientRect();
      const canvas = await html2canvas(element, {
        scale: 4,
        width: rect.width,
        height: rect.height,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopySuccess(true);
          // Clear any existing timeout before setting new one
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => setCopySuccess(false), 2000);
        }
      });
    } catch (error) {
      console.error('Failed to copy report as image:', error);
    } finally {
      setIsCopying(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div ref={reportRef} className="space-y-6 max-w-full overflow-hidden pb-8">
      {/* Report Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-3">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">{title}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">{date}</p>
          </div>
          <EnhancedButton
            onClick={handleCopyImage}
            variant="primary"
            size="sm"
            className="ml-4"
            ariaLabel="Copy report as image"
            disabled={isCopying}
          >
            {isCopying ? 'Copying...' : copySuccess ? 'Copied!' : 'Copy Image'}
          </EnhancedButton>
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
