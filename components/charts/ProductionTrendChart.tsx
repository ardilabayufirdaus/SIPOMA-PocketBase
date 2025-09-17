import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface ProductionTrendChartProps {
  data: Array<{
    timestamp: string;
    [key: string]: string | number;
  }>;
  parameters: Array<{
    id: string;
    parameter: string;
    category: string;
    unit: string;
  }>;
  selectedProductionParameters: string[];
  selectedPlantCategory: string;
  selectedPlantUnit: string;
}

export const ProductionTrendChart: React.FC<ProductionTrendChartProps> = ({
  data,
  parameters,
  selectedProductionParameters,
  selectedPlantCategory,
  selectedPlantUnit,
}) => {
  console.log('🔍 ProductionTrendChart Input:', {
    dataCount: data.length,
    parametersCount: parameters.length,
    selectedProductionParameters,
    selectedPlantCategory,
    selectedPlantUnit,
    sampleData: data.slice(0, 3),
    dataKeys: data.length > 0 ? Object.keys(data[0]) : [],
  });

  // Filter parameters based on selection (only for display purposes)
  const filteredParameters = parameters.filter((param) => {
    // If specific parameters are selected, only show those
    if (selectedProductionParameters.length > 0) {
      return selectedProductionParameters.includes(param.id);
    }
    return true; // Show all parameters if none selected
  });

  const displayParameters =
    selectedProductionParameters.length === 0
      ? filteredParameters // Show all filtered parameters instead of limiting to 5
      : selectedProductionParameters
          .map((paramId) => parameters.find((p) => p.id === paramId))
          .filter(Boolean);

  console.log('🔍 Chart displayParameters:', {
    displayParametersCount: displayParameters.length,
    displayParameters: displayParameters.map((p) => ({
      id: p?.id,
      parameter: p?.parameter,
    })),
  });

  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#F97316', // orange-500
  ];

  const chartData = {
    labels: data.map((item) => {
      const date = new Date(item.timestamp);
      return date.toLocaleDateString('id-ID', {
        month: 'short',
        day: 'numeric',
      });
    }),
    datasets: displayParameters.map((param, index) => {
      const datasetData = data.map((item) => {
        // Use the parameter name as the key from the data
        const paramValue = item[param?.parameter];
        return typeof paramValue === 'number' ? paramValue : 0;
      });

      console.log('🔍 Chart Dataset for parameter:', {
        parameterId: param?.id,
        parameterName: param?.parameter,
        sampleData: datasetData.slice(0, 5),
        uniqueValues: [...new Set(datasetData)],
      });

      return {
        label: param?.unit || `Unit ${index + 1}`,
        parameterName: param?.parameter || `Parameter ${index + 1}`,
        data: datasetData,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        tension: 0.4,
        fill: false,
      };
    }),
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
            if (context.dataset.parameterName) {
              label += ` (${context.dataset.parameterName})`;
            }
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Ton',
        },
        beginAtZero: true,
        ticks: {
          stepSize: 1000,
          callback: function (value: any) {
            return value;
          },
        },
        min: 0,
        max: 7000,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className="h-full w-full">
      <Line data={chartData} options={options} />
    </div>
  );
};
