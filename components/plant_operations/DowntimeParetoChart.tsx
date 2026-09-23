import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';

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

interface DowntimeParetoChartProps {
  data: any[];
  type: 'duration' | 'frequency';
  t?: Record<string, string>;
  language?: 'en' | 'id';
}

const DowntimeParetoChart: React.FC<DowntimeParetoChartProps> = ({
  data,
  type,
  t,
  language = 'id',
}) => {
  const chartData = useMemo(() => {
    // 1. Group data by normalized remarks / problems
    const groups: Record<string, { label: string; duration: number; frequency: number }> = {};

    data.forEach((record) => {
      const rawCategory = record.remarks || record.problem || record.category || 'Lain-lain';
      const cleanStr = String(rawCategory)
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ', ');

      // Normalisasi variasi ejaan umum CCR semen:
      let normalizedKey = cleanStr.toLowerCase();
      normalizedKey = normalizedKey.replace(/\b(kerisis|krisi)\b/g, 'krisis');
      normalizedKey = normalizedKey.replace(/\bclinker\b/g, 'klinker');
      normalizedKey = normalizedKey.replace(/\bpmc\b/g, 'pmc');

      // Title case display label dengan penyesuaian istilah industri semen
      let displayLabel = normalizedKey.charAt(0).toUpperCase() + normalizedKey.slice(1);
      displayLabel = displayLabel.replace(/\bpmc\b/gi, 'PMC');
      displayLabel = displayLabel.replace(/\bpcc\b/gi, 'PCC');
      displayLabel = displayLabel.replace(/\bopc\b/gi, 'OPC');
      displayLabel = displayLabel.replace(/\bklinker\b/gi, 'Klinker');

      if (!groups[normalizedKey]) {
        groups[normalizedKey] = { label: displayLabel, duration: 0, frequency: 0 };
      }
      const dur = parseFloat(record.duration) || parseFloat(record.duration_minutes) || 0;
      groups[normalizedKey].duration += dur;
      groups[normalizedKey].frequency += record.frequency || 1;
    });

    const totalAll = Object.values(groups).reduce(
      (sum, g) => sum + (type === 'duration' ? g.duration : g.frequency),
      0
    );

    // 2. Sort and take top 10
    const sorted = Object.values(groups)
      .map((g) => ({
        label: g.label,
        value: type === 'duration' ? Math.round(g.duration * 10) / 10 : g.frequency,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const labels = sorted.map((item) => item.label);
    const values = sorted.map((item) => item.value);

    // 3. Calculate cumulative percentage for Pareto line based on totalAll
    let runningTotal = 0;
    const cumulative = values.map((val) => {
      runningTotal += val;
      return totalAll > 0 ? Math.round((runningTotal / totalAll) * 100 * 10) / 10 : 0;
    });

    const barLabel =
      type === 'duration'
        ? t?.chart_pareto_bar_duration ||
          (language === 'en' ? 'Downtime Duration (Minutes)' : 'Durasi Downtime (Menit)')
        : t?.chart_pareto_bar_frequency ||
          (language === 'en' ? 'Occurrence Frequency (Times)' : 'Frekuensi Kejadian (Kali)');

    const lineLabel =
      t?.chart_pareto_line_cum ||
      (language === 'en' ? 'Cumulative Contribution (%)' : 'Kumulatif Kontribusi (%)');

    return {
      labels,
      totalAll,
      datasets: [
        {
          type: 'bar' as const,
          label: barLabel,
          data: values,
          backgroundColor: '#F43F5E', // Rose 500
          borderRadius: 6,
          barThickness: 20,
          yAxisID: 'y',
          order: 1,
        },
        {
          type: 'line' as const,
          label: lineLabel,
          data: cumulative,
          borderColor: '#6366F1', // Indigo 500
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: '#6366F1',
          pointBorderWidth: 2,
          fill: true,
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          tension: 0.3,
          yAxisID: 'y1',
          order: 0,
        },
      ],
    };
  }, [data, type, t, language]);

  const totalAll = chartData.totalAll;

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            font: { size: 10, weight: 'bold' },
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            padding: 12,
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
              const datasetLabel = context.dataset.label || '';
              const val = context.parsed.y !== null ? context.parsed.y : 0;

              if (context.dataset.type === 'line') {
                return ` ${datasetLabel}: ${val.toFixed(1)}%`;
              }

              const ofTotalText = t?.of_total || (language === 'en' ? 'of total' : 'dari total');

              if (type === 'duration') {
                const hours = (val / 60).toFixed(1);
                const pct =
                  totalAll > 0 ? ` (${((val / totalAll) * 100).toFixed(1)}% ${ofTotalText})` : '';
                const minutesUnit = t?.unit_minutes || (language === 'en' ? 'Minutes' : 'Menit');
                const hoursUnit = t?.unit_hours || (language === 'en' ? 'Hours' : 'Jam');
                return ` ${datasetLabel}: ${val.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')} ${minutesUnit} (${hours} ${hoursUnit})${pct}`;
              }

              const timesUnit = t?.unit_times || (language === 'en' ? 'Times' : 'Kali');
              const freqPct =
                totalAll > 0 ? ` (${((val / totalAll) * 100).toFixed(1)}% ${ofTotalText})` : '';
              return ` ${datasetLabel}: ${val} ${timesUnit}${freqPct}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text:
              type === 'duration'
                ? t?.chart_pareto_y_duration ||
                  (language === 'en' ? 'Duration (Minutes)' : 'Durasi (Menit)')
                : t?.chart_pareto_y_frequency ||
                  (language === 'en' ? 'Frequency (Times)' : 'Frekuensi (Kali)'),
            font: { size: 10, weight: 'bold' },
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
          },
          ticks: {
            font: { size: 10 },
            callback: (value: any) =>
              `${Number(value).toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}`,
          },
        },
        y1: {
          beginAtZero: true,
          max: 100,
          position: 'right' as const,
          title: {
            display: true,
            text: t?.chart_pareto_y_cum || (language === 'en' ? 'Cumulative %' : 'Kumulatif %'),
            font: { size: 10, weight: 'bold' },
          },
          grid: {
            display: false,
          },
          ticks: {
            font: { size: 10 },
            callback: (value: any) => `${value}%`,
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: { size: 10, weight: 'bold' },
            maxRotation: 35,
            minRotation: 20,
            callback: function (val: any, index: number) {
              const label = chartData.labels[index] || '';
              return label.length > 20 ? label.slice(0, 18) + '...' : label;
            },
          },
        },
      },
    }),
    [chartData, type, totalAll, t, language]
  );

  return (
    <div className="w-full h-[300px]">
      <Bar data={chartData as any} options={options as any} />
    </div>
  );
};

export default DowntimeParetoChart;
