import React, { useState, useCallback } from 'react';
import { useCcrParameterData } from '../hooks/useCcrParameterData';
import { useCcrFooterData } from '../hooks/useCcrFooterData';
import useCcrDowntimeData from '../hooks/useCcrDowntimeData';
import { supabase } from '../utils/supabase';
import { CcrDowntimeData } from '../types';

interface ReportData {
  date: string;
  shift?: string;
  plantCategory: string;
  targetProduction?: number;
  nextShiftPic?: string;
  handoverNotes?: string;
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
  });
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { getDataForDate: getParameterData } = useCcrParameterData();
  const { getFooterDataForDate } = useCcrFooterData();
  const [downtimeData, setDowntimeData] = useState<CcrDowntimeData[]>([]);
  const { getAllDowntime } = useCcrDowntimeData();

  // Load downtime data on mount
  React.useEffect(() => {
    const loadDowntimeData = async () => {
      const data = await getAllDowntime();
      setDowntimeData(data);
    };
    loadDowntimeData();
  }, [getAllDowntime]);

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
    (date: string, shift: string): number => {
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
    [downtimeData]
  );

  // Get downtime notes for date/shift
  const getDowntimeNotes = useCallback(
    (date: string, shift?: string): string => {
      if (!downtimeData || downtimeData.length === 0) return '';

      let filteredDowntime = downtimeData.filter((d) => d.date === date && d.unit.includes('Mill'));

      if (shift) {
        filteredDowntime = filteredDowntime.filter((d) => {
          const hour = parseInt(d.start_time.split(':')[0]);
          if (shift === '1') return hour >= 6 && hour < 14;
          if (shift === '2') return hour >= 14 && hour < 22;
          if (shift === '3') return hour >= 22 || hour < 6;
          return false;
        });
      }

      return filteredDowntime
        .map((d) => `${d.problem} - ${d.action || 'No action recorded'}`)
        .join('\n');
    },
    [downtimeData]
  );

  // Generate Daily Report
  const generateDailyReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { date, plantCategory } = reportData;

      // Fetch all required data
      const [parameterData, footerData, siloData] = await Promise.all([
        getParameterData(date),
        getFooterDataForDate(date),
        getSiloData(date),
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

      // Plant Units (220 and 320)
      const plantUnits = ['220', '320'];

      for (const unit of plantUnits) {
        const unitFooterData = footerData.filter((f) => f.plant_unit === unit);
        const unitParameterData = parameterData.filter(() => true); // Placeholder

        report += `*Plant Unit Cement Mill ${unit}*\n`;

        // Get values from footer data (placeholder - perlu mapping yang tepat)
        const productionData = unitFooterData.find((f) => f.parameter_id.includes('production'));
        const feedData = unitFooterData.find((f) => f.parameter_id.includes('feed'));
        const operationHoursData = unitFooterData.find((f) =>
          f.parameter_id.includes('operation_hours')
        );

        report += `Tipe Produk  : ${productionData?.total || 'N/A'}\n`;
        report += `Feed  : ${feedData?.total || 'N/A'} tph\n`;
        report += `Jam Operasi  : ${operationHoursData?.total || 'N/A'} jam\n`;
        report += `Total Produksi  : ${productionData?.total || 'N/A'} ton\n\n`;

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
        ];
        bahanParams.forEach((bahan) => {
          const bahanData = unitParameterData.find((p) => p.name?.includes(bahan));
          const bahanSum = bahanData
            ? Object.values(bahanData.hourly_values).reduce(
                (sum: number, val) => sum + Number(val || 0),
                0
              )
            : 0;
          report += `- ${bahan} : ${bahanData ? Number(bahanSum).toFixed(2) : 'N/A'} ton\n`;
        });

        report += `\n/Setting Feeder/\n`;
        bahanParams.forEach((bahan) => {
          const feederData = unitParameterData.find((p) => p.name?.includes(`${bahan} Feeder`));
          const feederValues = feederData ? Object.values(feederData.hourly_values) : [];
          const feederSum = feederValues.reduce((sum: number, val) => sum + Number(val || 0), 0);
          const feederAvg = feederValues.length > 0 ? Number(feederSum) / feederValues.length : 0;
          report += `- ${bahan} : ${feederData ? feederAvg.toFixed(2) : 'N/A'} %\n`;
        });

        report += `\n/Catatan Tambahan/\n${getDowntimeNotes(date)}\n\n`;
      }

      // Silo Data - hanya shift 3
      report += `*Ruang Kosong & Isi Silo Semen*\n`;
      siloData.forEach((silo) => {
        const shift3Data = silo.shift3;
        if (shift3Data) {
          report += `${silo.silo_id}: Empty ${shift3Data.emptySpace || 'N/A'}m, Content ${shift3Data.content || 'N/A'} ton, ${shift3Data.content ? ((shift3Data.content / 100) * 100).toFixed(1) : 'N/A'}%\n`;
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
      const [parameterData, footerData, siloData] = await Promise.all([
        getParameterData(date),
        getFooterDataForDate(date),
        getSiloData(date),
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

      // Plant Units
      const plantUnits = ['220', '320'];

      for (const unit of plantUnits) {
        const unitFooterData = footerData.filter((f) => f.plant_unit === unit);
        const unitParameterData = parameterData.filter(() => true); // Placeholder

        report += `*Produksi Shift Unit Mill ${unit}*\n`;
        report += `Target Produksi  : ${targetProduction || 'N/A'} ton\n`;

        const productionData = unitFooterData.find((f) => f.parameter_id.includes('production'));
        const feedData = unitFooterData.find((f) => f.parameter_id.includes('feed'));
        const operationHoursData = unitFooterData.find((f) =>
          f.parameter_id.includes('operation_hours')
        );

        report += `Realisasi Produksi  : ${productionData?.total || 'N/A'} ton\n`;
        report += `Jam Operasional  : ${operationHoursData?.total || 'N/A'} jam\n`;
        report += `Durasi down time  : ${calculateShiftDowntime(date, shift || '1').toFixed(2)} jam\n`;
        report += `Feed rate  : ${feedData?.total || 'N/A'} tph\n\n`;

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
        report += `\n/Kondisi peralatan & Mesin/\n${getDowntimeNotes(date, shift)}\n\n`;
      }

      // Silo Data untuk shift tertentu
      report += `*Ruang Kosong & Isi Silo Semen*\n`;
      siloData.forEach((silo) => {
        const shiftData = silo[`shift${shift}` as keyof SiloData];
        if (shiftData && typeof shiftData === 'object' && 'emptySpace' in shiftData) {
          const data = shiftData as { emptySpace?: number; content?: number };
          report += `${silo.silo_id}: Empty ${data.emptySpace || 'N/A'}m, Content ${data.content || 'N/A'} ton, ${data.content ? ((data.content / 100) * 100).toFixed(1) : 'N/A'}%\n`;
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

  const handleGenerateReport = () => {
    if (reportData.shift) {
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
            value={reportData.shift ? 'shift' : 'daily'}
            onChange={(e) =>
              setReportData((prev) => ({
                ...prev,
                shift: e.target.value === 'shift' ? '1' : undefined,
              }))
            }
            className="w-full p-2 border rounded"
          >
            <option value="daily">Daily Report</option>
            <option value="shift">Shift Report</option>
          </select>
        </div>

        {reportData.shift && (
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

        {reportData.shift && (
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
        </div>
      )}
    </div>
  );
};
