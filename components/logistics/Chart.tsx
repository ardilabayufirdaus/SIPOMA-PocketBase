import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface ChartProps {
  chartType: 'line' | 'bar' | 'combo';
  performanceData: any;
  showTrend: boolean;
  showComparison: boolean;
  COLORS: string[];
  filterYear: number;
  filterMonth: number;
  chartRef: React.RefObject<HTMLDivElement>;
  handleDaySelection: (e: React.MouseEvent) => void;
  handleChartHover: (e: React.MouseEvent) => void;
  handleMouseLeaveChart: () => void;
  hoveredInfo: any;
  formatDate: (date: Date) => string;
  formatNumber: (n: number) => string;
}

export const Chart: React.FC<ChartProps> = ({
  chartType,
  performanceData,
  showTrend,
  showComparison,
  COLORS,
  filterYear,
  filterMonth,
  chartRef,
  handleDaySelection,
  handleChartHover,
  handleMouseLeaveChart,
  hoveredInfo,
  formatDate,
  formatNumber,
}) => {
  // Check if we have data to display
  if (
    performanceData.noData ||
    !performanceData.chartData ||
    Object.keys(performanceData.chartData).length === 0
  ) {
    return (
      <div className="h-80 w-full relative overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div className="text-center text-slate-500 dark:text-slate-400">
          <div className="text-lg font-medium mb-2">No Data Available</div>
          <div className="text-sm">No stock data found for the selected filters</div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const daysInMonth = performanceData.daysInMonth;
  const displayedAreas = performanceData.displayedAreas || [];
  const labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

  const datasets = displayedAreas.map((area: string, index: number) => {
    const areaData = performanceData.chartData[area] || [];
    const data = labels.map((_, dayIndex) => {
      const dayData = areaData.find((d: any) => d.day === dayIndex + 1);
      return dayData ? dayData.stock_out : 0;
    });

    return {
      label: area,
      data,
      borderColor: COLORS[index % COLORS.length],
      backgroundColor: COLORS[index % COLORS.length] + '20',
      borderWidth: 2,
      fill: chartType === 'bar',
      tension: 0.4,
    };
  });

  // Add comparison data if enabled
  if (showComparison && performanceData.comparisonData) {
    displayedAreas.forEach((area: string, index: number) => {
      const comparisonData = performanceData.comparisonData[area] || [];
      const data = labels.map((_, dayIndex) => {
        const dayData = comparisonData.find((d: any) => d.day === dayIndex + 1);
        return dayData ? dayData.stock_out : 0;
      });

      datasets.push({
        label: `${area} (Prev Month)`,
        data,
        borderColor: COLORS[index % COLORS.length],
        backgroundColor: COLORS[index % COLORS.length] + '10',
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
      });
    });
  }

  const chartData = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatNumber(context.parsed.y) + ' tons';
            }
            return label;
          },
        },
      },
      title: {
        display: true,
        text: 'Daily Stock Out Performance',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          top: 10,
          bottom: 30,
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Day of Month',
        },
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Stock Out (tons)',
        },
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const dataIndex = elements[0].index;
        const day = dataIndex + 1;
        // Create a synthetic mouse event for day selection
        const syntheticEvent = {
          clientX: event.x,
          clientY: event.y,
        } as React.MouseEvent;
        handleDaySelection(syntheticEvent);
      }
    },
  };

  return (
    <div
      className="h-80 w-full relative overflow-hidden bg-white dark:bg-slate-800 rounded-lg p-4"
      ref={chartRef}
      onMouseMove={handleChartHover}
      onMouseLeave={handleMouseLeaveChart}
    >
      {chartType === 'line' && <Line data={chartData} options={options} />}
      {chartType === 'bar' && <Bar data={chartData} options={options} />}
      {chartType === 'combo' && <Bar data={chartData} options={options} />}
    </div>
  );
};
