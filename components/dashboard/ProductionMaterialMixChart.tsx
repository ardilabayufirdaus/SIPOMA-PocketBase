import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { DailyMaterialUsage } from '../../hooks/useMainDashboardChartsData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProductionMaterialMixChartProps {
  data: DailyMaterialUsage[];
  t?: Record<string, string>;
  language?: 'en' | 'id';
}

export const ProductionMaterialMixChart: React.FC<ProductionMaterialMixChartProps> = ({
  data,
  t = {},
  language = 'id',
}) => {
  const [viewRange, setViewRange] = useState<'7d' | '14d'>('14d');

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return viewRange === '7d' ? data.slice(-7) : data.slice(-14);
  }, [data, viewRange]);

  const chartData: ChartData = useMemo(() => {
    const labels = filteredData.map((d) => {
      const parts = d.date.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      return d.date;
    });

    return {
      labels,
      datasets: [
        {
          type: 'line' as const,
          label:
            t.chart_total_production || (language === 'en' ? 'Total Production' : 'Total Produksi'),
          data: filteredData.map((d) => d.total_production),
          borderColor: '#10B981', // Emerald
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#10B981',
          pointBorderColor: '#FFFFFF',
          tension: 0.3,
          yAxisID: 'y',
          order: 0,
        },
        {
          type: 'bar' as const,
          label: t.mat_clinker || (language === 'en' ? 'Clinker' : 'Klinker'),
          data: filteredData.map((d) => d.clinker),
          backgroundColor: '#3B82F6', // Blue
          borderRadius: 4,
          stack: 'materials',
          yAxisID: 'y',
          order: 1,
        },
        {
          type: 'bar' as const,
          label: t.mat_limestone || (language === 'en' ? 'Limestone' : 'Batu Kapur'),
          data: filteredData.map((d) => d.limestone),
          backgroundColor: '#F59E0B', // Amber
          borderRadius: 4,
          stack: 'materials',
          yAxisID: 'y',
          order: 2,
        },
        {
          type: 'bar' as const,
          label: t.mat_gypsum || (language === 'en' ? 'Gypsum' : 'Gipsum'),
          data: filteredData.map((d) => d.gypsum),
          backgroundColor: '#8B5CF6', // Purple
          borderRadius: 4,
          stack: 'materials',
          yAxisID: 'y',
          order: 3,
        },
        {
          type: 'bar' as const,
          label: t.mat_trass || 'Trass',
          data: filteredData.map((d) => d.trass),
          backgroundColor: '#EC4899', // Pink
          borderRadius: 4,
          stack: 'materials',
          yAxisID: 'y',
          order: 4,
        },
        {
          type: 'bar' as const,
          label: t.mat_fly_ash || 'Fly Ash',
          data: filteredData.map((d) => d.fly_ash || 0),
          backgroundColor: '#06B6D4', // Cyan
          borderRadius: 4,
          stack: 'materials',
          yAxisID: 'y',
          order: 5,
        },
        {
          type: 'bar' as const,
          label: t.mat_ckd || (language === 'en' ? 'CKD / Others' : 'CKD / Lainnya'),
          data: filteredData.map((d) => d.ckd || 0),
          backgroundColor: '#64748B', // Slate
          borderRadius: 4,
          stack: 'materials',
          yAxisID: 'y',
          order: 6,
        },
      ],
    };
  }, [filteredData, t, language]);

  const options: ChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            font: {
              size: 10,
              weight: 'bold',
            },
            padding: 8,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 11 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (context: any) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y !== null ? context.parsed.y : 0;
              const dataIndex = context.dataIndex;
              const totalProd = filteredData[dataIndex]?.total_production || 0;
              const pct =
                totalProd > 0 && context.dataset.type === 'bar'
                  ? ` (${((value / totalProd) * 100).toFixed(1)}%)`
                  : '';
              const unit = t.unit_tons || (language === 'en' ? 'Tons' : 'Ton');
              return ` ${label}: ${value.toLocaleString(language === 'en' ? 'en-US' : 'id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${unit}${pct}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 } },
          stacked: true,
        },
        y: {
          type: 'linear',
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text:
              t.chart_y_axis_title ||
              (language === 'en'
                ? 'Production Volume & Materials (Tons)'
                : 'Volume Produksi & Material (Ton)'),
            font: { size: 10, weight: 'bold' },
          },
          grid: { color: 'rgba(148, 163, 184, 0.1)' },
          ticks: {
            font: { size: 10 },
            callback: (val: any) =>
              `${Number(val).toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}`,
          },
        },
      },
    }),
    [filteredData, t, language]
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-3.5 sm:p-4 flex flex-col h-full overflow-hidden">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-2.5 flex-shrink-0">
        <div className="min-w-0 pr-2">
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse"></span>
            {t.chart_production_title ||
              (language === 'en'
                ? 'Production Trends & Material Mix'
                : 'Tren Produksi & Mix Material')}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {t.chart_production_sub ||
              (language === 'en'
                ? 'Raw material usage aggregation and total cement production'
                : 'Agregasi penggunaan bahan baku dan total produksi semen')}
          </p>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 flex-shrink-0">
          <button
            type="button"
            onClick={() => setViewRange('7d')}
            aria-pressed={viewRange === '7d'}
            className={`min-h-[28px] sm:min-h-[30px] px-2.5 py-1 text-[10px] font-bold rounded-md transition-all focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              viewRange === '7d'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.chart_range_7d || (language === 'en' ? '7 Days' : '7 Hari')}
          </button>
          <button
            type="button"
            onClick={() => setViewRange('14d')}
            aria-pressed={viewRange === '14d'}
            className={`min-h-[28px] sm:min-h-[30px] px-2.5 py-1 text-[10px] font-bold rounded-md transition-all focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              viewRange === '14d'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.chart_range_14d || (language === 'en' ? '14 Days' : '14 Hari')}
          </button>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="flex-1 min-h-[250px] w-full relative">
        {filteredData.length > 0 ? (
          <Chart type="bar" data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">
            {t.chart_no_material_data ||
              (language === 'en'
                ? 'No production material data available'
                : 'Belum ada data material produksi')}
          </div>
        )}
      </div>
    </div>
  );
};
