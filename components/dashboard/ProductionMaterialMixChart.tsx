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
}

export const ProductionMaterialMixChart: React.FC<ProductionMaterialMixChartProps> = ({
  data,
  t = {},
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
          label: t.chart_total_production || 'Total Produksi (Ton)',
          data: filteredData.map((d) => d.total_production),
          borderColor: '#10B981', // Emerald
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#10B981',
          pointBorderColor: '#FFFFFF',
          tension: 0.3,
          yAxisID: 'yProduction',
          order: 0,
        },
        {
          type: 'bar' as const,
          label: 'Clinker',
          data: filteredData.map((d) => d.clinker),
          backgroundColor: '#3B82F6', // Blue
          borderRadius: 4,
          stack: 'materials',
          yAxisID: 'yMaterials',
          order: 1,
        },
        {
          type: 'bar' as const,
          label: 'Limestone',
          data: filteredData.map((d) => d.limestone),
          backgroundColor: '#F59E0B', // Amber
          borderRadius: 4,
          stack: 'materials',
          yAxisID: 'yMaterials',
          order: 2,
        },
        {
          type: 'bar' as const,
          label: 'Gypsum',
          data: filteredData.map((d) => d.gypsum),
          backgroundColor: '#8B5CF6', // Purple
          borderRadius: 4,
          stack: 'materials',
          yAxisID: 'yMaterials',
          order: 3,
        },
        {
          type: 'bar' as const,
          label: 'Trass',
          data: filteredData.map((d) => d.trass),
          backgroundColor: '#EC4899', // Pink
          borderRadius: 4,
          stack: 'materials',
          yAxisID: 'yMaterials',
          order: 4,
        },
      ],
    };
  }, [filteredData, t]);

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
              size: 11,
              weight: 'bold',
            },
            padding: 12,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 11 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (context: any) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y !== null ? context.parsed.y : 0;
              return ` ${label}: ${value.toLocaleString('id-ID')} Ton`;
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
        yMaterials: {
          type: 'linear',
          position: 'left',
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Material Usage (Ton)',
            font: { size: 10, weight: 'bold' },
          },
          grid: { color: 'rgba(148, 163, 184, 0.1)' },
          ticks: { font: { size: 10 } },
        },
        yProduction: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Total Production (Ton)',
            font: { size: 10, weight: 'bold' },
          },
          grid: { display: false },
          ticks: { font: { size: 10 } },
        },
      },
    }),
    []
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col h-full">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {t.chart_production_title || 'Tren Produksi & Mix Material'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {t.chart_production_sub || 'Agregasi penggunaan bahan baku dan total produksi semen'}
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewRange('7d')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
              viewRange === '7d'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setViewRange('14d')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
              viewRange === '14d'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            14 Hari
          </button>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="flex-1 min-h-[260px] w-full relative">
        {filteredData.length > 0 ? (
          <Chart type="bar" data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">
            Belum ada data material produksi
          </div>
        )}
      </div>
    </div>
  );
};
