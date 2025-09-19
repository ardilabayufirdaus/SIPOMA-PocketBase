import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useCcrParameterData } from '../hooks/useCcrParameterData';
import { useCcrFooterData } from '../hooks/useCcrFooterData';
import useCcrDowntimeData from '../hooks/useCcrDowntimeData';
import { usePlantUnits } from '../hooks/usePlantUnits';
import { useParameterSettings } from '../hooks/useParameterSettings';
import { useSiloCapacities } from '../hooks/useSiloCapacities';
import { supabase } from '../utils/supabase';
import { CcrDowntimeData } from '../types';

interface ReportData {
  date: string;
  shift?: string;
  plantCategory: string;
  targetProduction?: number;
  nextShiftPic?: string;
  handoverNotes?: string;
  reportType?: 'daily' | 'shift' | 'feed';
}

interface SiloData {
  id: string;
  silo_id: string;
  date: string;
  shift1: { emptySpace?: number; content?: number };
  shift2: { emptySpace?: number; content?: number };
  shift3: { emptySpace?: number; content?: number };
}

export const ReportGenerator: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    date: new Date().toISOString().split('T')[0],
    plantCategory: 'Cement Mill',
    shift: '1',
    reportType: 'shift',
  });
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { getDataForDate: getParameterData } = useCcrParameterData();
  const { getFooterDataForDate } = useCcrFooterData();
  const { getDowntimeForDate } = useCcrDowntimeData();
  const { records: plantUnits } = usePlantUnits();
  const { records: parameterSettings } = useParameterSettings();
  const { records: silos } = useSiloCapacities();

  // Export report to Excel
  const handleExportReport = useCallback(async () => {
    if (!generatedReport) return;

    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['Report'], [generatedReport]]);
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `Report_${reportData.date}.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [generatedReport, reportData.date]);

  // Fetch silo data
  const getSiloData = useCallback(async (date: string): Promise<SiloData[]> => {
    try {
      const { data, error } = await supabase.from('ccr_silo_data').select('*').eq('date', date);

      if (error) {
        console.error('Error fetching silo data:', error);
        return [];
      }

      return (data || []) as unknown as SiloData[];
    } catch (error) {
      console.error('Error in getSiloData:', error);
      return [];
    }
  }, []);

  // Calculate downtime duration for shift
  const calculateShiftDowntime = useCallback(
    (date: string, shift: string, downtimeData: CcrDowntimeData[]): number => {
      if (!downtimeData || downtimeData.length === 0) return 0;

      const shiftDowntime = downtimeData.filter(
        (d) =>
          d.date === date &&
          d.unit.includes('Mill') &&
          // Filter berdasarkan shift dari waktu start_time
          (() => {
            const hour = parseInt(d.start_time.split(':')[0]);
            if (shift === '1') return hour >= 6 && hour < 14;
            if (shift === '2') return hour >= 14 && hour < 22;
            if (shift === '3') return hour >= 22 || hour < 6;
            return false;
          })()
      );

      return shiftDowntime.reduce((total, d) => {
        const start = new Date(`${d.date} ${d.start_time}`);
        const end = new Date(`${d.date} ${d.end_time}`);
        const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
        return total + duration;
      }, 0);
    },
    []
  );

  // Get downtime notes for date/shift
  const getDowntimeNotes = useCallback((date: string, downtimeData: CcrDowntimeData[]): string => {
    if (!downtimeData || downtimeData.length === 0) return '';

    const filteredDowntime = downtimeData.filter((d) => d.date === date && d.unit.includes('Mill'));

    return filteredDowntime
      .map((d) => `${d.problem} - ${d.action || 'No action recorded'}`)
      .join('\n');
  }, []);

  // Generate Daily Report
  const generateDailyReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { date, plantCategory } = reportData;

      // Fetch all required data
      const [footerData, siloData, downtimeData] = await Promise.all([
        getFooterDataForDate(date),
        getSiloData(date),
        getDowntimeForDate(date),
      ]);

      // Format date
      const reportDate = new Date(date);
      const formattedDate = reportDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      let report = `*Laporan Harian Produksi*\n*${plantCategory}*\n${formattedDate}\n===============================\n\n`;

      // Plant Units - get from database based on category
      const plantUnitsFiltered = plantUnits
        .filter((unit) => unit.category === plantCategory)
        .map((unit) => unit.unit.replace('Cement Mill ', '')); // Extract number part

      for (const unit of plantUnitsFiltered) {
        // Filter parameter data for this unit
        const unitParameterIds = parameterSettings
          .filter((param) => param.category === plantCategory && param.unit === unit)
          .map((param) => param.id);

        report += `*Plant Unit Cement Mill ${unit}*\n`;

        // Get values from footer data (using parameter settings for accurate mapping)
        // Filter footer data for parameters that belong to this unit
        const unitFooterDataFiltered = footerData.filter((f) =>
          unitParameterIds.includes(f.parameter_id)
        );

        // Cari data berdasarkan parameter_id di footer data
        const feedData = unitFooterDataFiltered.find((f) => {
          const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
          return paramSetting && paramSetting.parameter === 'Feed (tph)';
        });
        const operationHoursData = unitFooterDataFiltered.find((f) => {
          const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
          return (
            paramSetting &&
            (paramSetting.parameter.toLowerCase().includes('running hours') ||
              paramSetting.parameter.toLowerCase().includes('jam operasi') ||
              paramSetting.parameter.toLowerCase().includes('operation hours'))
          );
        });
        const productionData = unitFooterDataFiltered.find((f) => {
          const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
          return (
            paramSetting &&
            (paramSetting.parameter.toLowerCase().includes('production') ||
              paramSetting.parameter.toLowerCase().includes('total production'))
          );
        });

        report += `Tipe Produk  : ${productionData?.total || 'N/A'}\n`;
        report += `Feed  : ${feedData?.total || 'N/A'} tph\n`;
        report += `Jam Operasi  : ${operationHoursData?.total || 'N/A'} jam\n`;
        report += `Total Produksi  : ${productionData?.total || 'N/A'} ton\n\n`;

        // Pemakaian Bahan
        report += `/Pemakaian Bahan/\n`;
        const bahanParams = [
          { name: 'Clinker', param: 'counter feeder clinker' },
          { name: 'Gypsum', param: 'counter feeder gypsum' },
          { name: 'Batu Kapur', param: 'counter feeder limestone' },
          { name: 'Trass', param: 'counter feeder trass' },
          { name: 'FineTrass', param: 'counter feeder fine trass' },
          { name: 'Fly Ash', param: 'counter feeder flyash' },
          { name: 'CKD', param: 'counter feeder ckd' },
        ];
        bahanParams.forEach(({ name, param }) => {
          const bahanData = unitFooterDataFiltered.find((f) => {
            const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
            return (
              paramSetting && paramSetting.parameter.toLowerCase().includes(param.toLowerCase())
            );
          });
          const bahanTotal = bahanData ? Number(bahanData.counter_total || 0) : 0;
          console.log(`Pemakaian Bahan ${name}:`, { bahanData, bahanTotal });
          report += `- ${name} : ${bahanTotal.toFixed(2)} ton\n`;
        });

        report += `\n/Setting Feeder/\n`;
        const feederParams = [
          { name: 'Clinker', param: 'set. feeder clinker' },
          { name: 'Gypsum', param: 'set. feeder gypsum' },
          { name: 'Batu Kapur', param: 'set. feeder limestone' },
          { name: 'Trass', param: 'set. feeder trass' },
          { name: 'FineTrass', param: 'set. feeder fine trass' },
          { name: 'Fly Ash', param: 'set. feeder flyash' },
          { name: 'CKD', param: 'set. feeder ckd' },
        ];
        feederParams.forEach(({ name, param }) => {
          const feederData = unitFooterDataFiltered.find((f) => {
            const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
            return (
              paramSetting && paramSetting.parameter.toLowerCase().includes(param.toLowerCase())
            );
          });
          const feederAvg = feederData ? Number(feederData.average || 0) : 0;
          console.log(`Setting Feeder ${name}:`, { feederData, feederAvg });
          report += `- ${name} : ${feederAvg.toFixed(2)} %\n`;
        });

        // Catatan Tambahan - Downtime data per unit
        const unitDowntimeData = downtimeData.filter((d) => d.unit === `Cement Mill ${unit}`);
        if (unitDowntimeData.length > 0) {
          report += `\n/Catatan Tambahan/\n`;
          unitDowntimeData.forEach((d) => {
            const start = new Date(`${d.date} ${d.start_time}`);
            const end = new Date(`${d.date} ${d.end_time}`);
            const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
            report += `- ${d.start_time} - ${d.end_time} (${duration.toFixed(2)} jam): ${d.problem} - PIC: ${d.pic || 'N/A'} - ${d.action || 'No action recorded'}\n`;
          });
          report += `\n`;
        } else {
          report += `\n/Catatan Tambahan/\n- Tidak ada downtime tercatat\n\n`;
        }
      }

      // Silo Data - hanya shift 3
      report += `*Ruang Kosong & Isi Silo Semen*\n`;
      const filteredSiloData = siloData.filter((silo) => {
        const siloInfo = silos.find((s) => s.id === silo.silo_id);
        return siloInfo && siloInfo.plant_category === plantCategory;
      });
      filteredSiloData.forEach((silo) => {
        const siloInfo = silos.find((s) => s.id === silo.silo_id);
        const siloName = siloInfo?.silo_name || silo.silo_id;
        const shift3Data = silo.shift3;
        if (shift3Data) {
          const percentage =
            siloInfo && shift3Data.content
              ? ((shift3Data.content / siloInfo.capacity) * 100).toFixed(1)
              : 'N/A';
          report += `${siloName}: Empty ${shift3Data.emptySpace || 'N/A'}m, Content ${shift3Data.content || 'N/A'} ton, ${percentage}%\n`;
        }
      });

      report += `\n*Demikian laporan ini. Terima kasih.*`;

      setGeneratedReport(report);
    } catch (error) {
      console.error('Error generating daily report:', error);
      setGeneratedReport('Error generating report');
    } finally {
      setIsGenerating(false);
    }
  }, [reportData, getParameterData, getFooterDataForDate, getSiloData, getDowntimeNotes]);

  // Generate Shift Report
  const generateShiftReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { date, shift, plantCategory, targetProduction, nextShiftPic, handoverNotes } =
        reportData;

      // Fetch data
      const [parameterData, footerData, siloData, downtimeData] = await Promise.all([
        getParameterData(date),
        getFooterDataForDate(date),
        getSiloData(date),
        getDowntimeForDate(date),
      ]);

      // Format date
      const reportDate = new Date(date);
      const formattedDate = reportDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      let report = `*Laporan Shift Produksi*\n*${plantCategory}*\n${formattedDate}\n`;
      report += `Shift  : ${shift}\n`;
      report += `P. Jawab Shift  : ${'Nama PIC' /* perlu implementasi */}\n`;
      report += `===============================\n\n`;

      // Plant Units - get from database based on category
      const plantUnitsFiltered = plantUnits
        .filter((unit) => unit.category === plantCategory)
        .map((unit) => ({
          fullName: unit.unit,
          shortName: unit.unit.replace('Cement Mill ', ''),
        }));

      for (const unitInfo of plantUnitsFiltered) {
        const unitParameterData = parameterData.filter(() => true); // Placeholder

        report += `*Produksi Shift Unit Mill ${unitInfo.shortName}*\n`;
        report += `Target Produksi  : ${targetProduction || 'N/A'} ton\n`;

        // Get values from footer data (using parameter settings for accurate mapping)
        // Filter footer data for parameters that belong to this unit
        const unitParameterIds = parameterSettings
          .filter((param) => param.category === plantCategory && param.unit === unitInfo.fullName)
          .map((param) => param.id);

        const unitFooterDataFiltered = footerData.filter((f) =>
          unitParameterIds.includes(f.parameter_id)
        );

        const productionData = unitFooterDataFiltered.find((f) => {
          const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
          return (
            paramSetting &&
            (paramSetting.parameter.toLowerCase().includes('production') ||
              paramSetting.parameter.toLowerCase().includes('total production'))
          );
        });
        const feedData = unitFooterDataFiltered.find((f) => {
          const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
          return paramSetting && paramSetting.parameter === 'Feed (tph)';
        });
        const operationHoursData = unitFooterDataFiltered.find((f) => {
          const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
          return (
            paramSetting &&
            (paramSetting.parameter.toLowerCase().includes('running hours') ||
              paramSetting.parameter.toLowerCase().includes('jam operasi') ||
              paramSetting.parameter.toLowerCase().includes('operation hours'))
          );
        });

        report += `Realisasi Produksi  : ${productionData?.shift1_total || 'N/A'} ton\n`;
        report += `Jam Operasional  : ${operationHoursData?.shift1_total || 'N/A'} jam\n`;
        report += `Durasi down time  : ${calculateShiftDowntime(date, shift || '1', downtimeData).toFixed(2)} jam\n`;
        report += `Feed rate  : ${feedData?.shift1_average || 'N/A'} tph\n\n`;

        // Pemakaian Bahan
        report += `/Pemakaian Bahan/\n`;
        const bahanParams = [
          'Clinker',
          'Gypsum',
          'Batu Kapur',
          'Trass',
          'FineTrass',
          'Fly Ash',
          'CKD',
          'CGA',
        ];
        bahanParams.forEach((bahan) => {
          const bahanData = unitParameterData.find((p) => p.name?.includes(bahan));
          const bahanSum = bahanData
            ? Object.values(bahanData.hourly_values).reduce(
                (sum: number, val) => sum + Number(val || 0),
                0
              )
            : 0;
          const unit = bahan === 'CGA' ? (bahan.includes('PPM') ? 'PPM' : 'Liter') : 'ton';
          report += `- ${bahan} : ${bahanData ? Number(bahanSum).toFixed(2) : 'N/A'} ${unit}\n`;
        });

        // Kualitas Produk
        report += `\n/Kualitas Produk/\n`;
        const r45Data = unitParameterData.find((p) => p.name?.includes('R45'));
        const blaineData = unitParameterData.find((p) => p.name?.includes('Blaine'));
        const r45Sum = r45Data
          ? Object.values(r45Data.hourly_values).reduce(
              (sum: number, val) => sum + Number(val || 0),
              0
            )
          : 0;
        const blaineSum = blaineData
          ? Object.values(blaineData.hourly_values).reduce(
              (sum: number, val) => sum + Number(val || 0),
              0
            )
          : 0;
        report += `- R45 (Residue 45 µm) : ${r45Data ? (Number(r45Sum) / 24).toFixed(2) : 'N/A'} %\n`;
        report += `- Blaine : ${blaineData ? (Number(blaineSum) / 24).toFixed(2) : 'N/A'} cm²/g\n`;

        // Kondisi peralatan & Mesin
        report += `\n/Kondisi peralatan & Mesin/\n${getDowntimeNotes(date, downtimeData)}\n\n`;
      }

      // Silo Data untuk shift tertentu
      report += `*Ruang Kosong & Isi Silo Semen*\n`;
      const filteredSiloDataShift = siloData.filter((silo) => {
        const siloInfo = silos.find((s) => s.id === silo.silo_id);
        return siloInfo && siloInfo.plant_category === plantCategory;
      });
      filteredSiloDataShift.forEach((silo) => {
        const siloInfo = silos.find((s) => s.id === silo.silo_id);
        const siloName = siloInfo?.silo_name || silo.silo_id;
        const shiftData = silo[`shift${shift}` as keyof SiloData];
        if (shiftData && typeof shiftData === 'object' && 'emptySpace' in shiftData) {
          const data = shiftData as { emptySpace?: number; content?: number };
          const percentage =
            siloInfo && data.content
              ? ((data.content / siloInfo.capacity) * 100).toFixed(1)
              : 'N/A';
          report += `${siloName}: Empty ${data.emptySpace || 'N/A'}m, Content ${data.content || 'N/A'} ton, ${percentage}%\n`;
        }
      });

      // Serah Terima Shift
      report += `\n/Serah Terima Shift/\n`;
      report += `P. Jawab Shift Berikutnya : ${nextShiftPic || 'N/A'}\n`;
      report += `Catatan Serah Terima : ${handoverNotes || 'N/A'}\n\n`;

      report += `*Demikian laporan ini*\n*Terima kasih atas kerja kerasnya*\n*Terus semangat untuk hasil yang lebih baik!*`;

      setGeneratedReport(report);
    } catch (error) {
      console.error('Error generating shift report:', error);
      setGeneratedReport('Error generating report');
    } finally {
      setIsGenerating(false);
    }
  }, [
    reportData,
    getParameterData,
    getFooterDataForDate,
    getSiloData,
    getDowntimeNotes,
    calculateShiftDowntime,
  ]);

  // Generate Feed Report
  const generateFeedReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { date, shift, plantCategory } = reportData;

      // Fetch footer data for feed information
      const footerData = await getFooterDataForDate(date);

      // Format date
      const reportDate = new Date(date);
      const formattedDate = reportDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      let report = `*Laporan Feed Shift ${shift}*\n*${plantCategory}*\n${formattedDate}\n===============================\n\n`;

      // Plant Units - get from database based on category
      const plantUnitsFiltered = plantUnits
        .filter((unit) => unit.category === plantCategory)
        .map((unit) => ({
          fullName: unit.unit,
          shortName: unit.unit.replace('Cement Mill ', ''),
        }));

      for (const unitInfo of plantUnitsFiltered) {
        // Get feed data for this unit
        const unitParameterIds = parameterSettings
          .filter((param) => param.category === plantCategory && param.unit === unitInfo.fullName)
          .map((param) => param.id);

        const unitFooterDataFiltered = footerData.filter((f) =>
          unitParameterIds.includes(f.parameter_id)
        );

        const feedData = unitFooterDataFiltered.find((f) => {
          const paramSetting = parameterSettings.find((s) => s.id === f.parameter_id);
          return paramSetting && paramSetting.parameter === 'Feed (tph)';
        });

        report += `*Feed Data Unit Mill ${unitInfo.shortName}*\n`;
        report += `Shift : ${shift}\n`;
        report += `Feed Rate Average : ${feedData?.[`shift${shift}_average`] || 'N/A'} tph\n`;
        report += `Feed Total : ${feedData?.[`shift${shift}_total`] || 'N/A'} ton\n\n`;
      }

      report += `*Demikian laporan feed shift ${shift}*\n*Terima kasih atas kerja kerasnya*\n*Terus semangat untuk hasil yang lebih baik!*`;

      setGeneratedReport(report);
    } catch (error) {
      console.error('Error generating feed report:', error);
      setGeneratedReport('Error generating feed report');
    } finally {
      setIsGenerating(false);
    }
  }, [reportData, getFooterDataForDate, plantUnits, parameterSettings]);

  const handleGenerateReport = () => {
    if (reportData.reportType === 'feed') {
      generateFeedReport();
    } else if (reportData.shift) {
      generateShiftReport();
    } else {
      generateDailyReport();
    }
  };

  return (
    <div className="report-generator p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Report Generator</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Tanggal</label>
          <input
            type="date"
            value={reportData.date}
            onChange={(e) => setReportData((prev) => ({ ...prev, date: e.target.value }))}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Plant Category</label>
          <select
            value={reportData.plantCategory}
            onChange={(e) => setReportData((prev) => ({ ...prev, plantCategory: e.target.value }))}
            className="w-full p-2 border rounded"
          >
            <option value="Cement Mill">Cement Mill</option>
            <option value="Raw Mill">Raw Mill</option>
            <option value="Packing Plant">Packing Plant</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tipe Laporan</label>
          <select
            value={reportData.reportType || 'shift'}
            onChange={(e) => {
              const value = e.target.value as 'daily' | 'shift' | 'feed';
              setReportData((prev) => ({
                ...prev,
                reportType: value,
                shift: value === 'daily' ? undefined : prev.shift || '1',
              }));
            }}
            className="w-full p-2 border rounded"
          >
            <option value="daily">Daily Report</option>
            <option value="shift">Shift Report</option>
            <option value="feed">Feed Report</option>
          </select>
        </div>

        {(reportData.reportType === 'shift' || reportData.reportType === 'feed') && (
          <div>
            <label className="block text-sm font-medium mb-2">Shift</label>
            <select
              value={reportData.shift}
              onChange={(e) => setReportData((prev) => ({ ...prev, shift: e.target.value }))}
              className="w-full p-2 border rounded"
            >
              <option value="1">Shift 1 (06:00-14:00)</option>
              <option value="2">Shift 2 (14:00-22:00)</option>
              <option value="3">Shift 3 (22:00-06:00)</option>
            </select>
          </div>
        )}

        {reportData.reportType === 'shift' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Target Produksi (ton)</label>
              <input
                type="number"
                value={reportData.targetProduction || ''}
                onChange={(e) =>
                  setReportData((prev) => ({
                    ...prev,
                    targetProduction: Number(e.target.value) || undefined,
                  }))
                }
                className="w-full p-2 border rounded"
                placeholder="Masukkan target produksi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">P. Jawab Shift Berikutnya</label>
              <input
                type="text"
                value={reportData.nextShiftPic || ''}
                onChange={(e) =>
                  setReportData((prev) => ({ ...prev, nextShiftPic: e.target.value }))
                }
                className="w-full p-2 border rounded"
                placeholder="Nama PIC shift berikutnya"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Catatan Serah Terima</label>
              <textarea
                value={reportData.handoverNotes || ''}
                onChange={(e) =>
                  setReportData((prev) => ({ ...prev, handoverNotes: e.target.value }))
                }
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Catatan serah terima shift"
              />
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleGenerateReport}
        disabled={isGenerating}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isGenerating ? 'Generating...' : 'Generate Report'}
      </button>

      {generatedReport && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Generated Report</h3>
          <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap text-sm">
            {generatedReport}
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(generatedReport)}
            className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Copy to Clipboard
          </button>
          <button
            onClick={handleExportReport}
            disabled={isExporting}
            className="mt-2 ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      )}
    </div>
  );
};
