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
  selectedPlantCategory: string;
  selectedPlantUnit: string;
}

export const ProductionTrendChart: React.FC<ProductionTrendChartProps> = ({
  data,
  parameters,
  selectedPlantCategory,
  selectedPlantUnit,
}) => {
  // Fixed parameters for Production Trend
  const fixedParameterIds = [
    'a3f7b380-1cad-41f3-b459-802d4c33da54', // CM 220
    'fb58e1a8-d808-46fc-8123-c3a33899dfcc', // CM 320
    '8d1d2e1e-b003-44f1-a946-50aed6b44fe8', // CM 419
    '14bf978b-5f3f-4279-b0c1-b91eb8a28e3a', // CM 420
    '0917556b-e2b7-466b-bc55-fc3a79bb9a25', // CM 552
    'fe1548c9-2ee5-44a8-9105-3fa2922438f4', // CM 552
  ];

  // Filter parameters based on fixed parameters
  const filteredParameters = parameters.filter((param) => {
    const categoryMatch =
      selectedPlantCategory === 'all' || param.category === selectedPlantCategory;
    const unitMatch = selectedPlantUnit === 'all' || param.unit === selectedPlantUnit;
    return categoryMatch && unitMatch && fixedParameterIds.includes(param.id);
  });

  const displayParameters = filteredParameters;

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

      // Map parameter IDs to CM names
      const cmNameMap: { [key: string]: string } = {
        'a3f7b380-1cad-41f3-b459-802d4c33da54': 'CM 220',
        'fb58e1a8-d808-46fc-8123-c3a33899dfcc': 'CM 320',
        '8d1d2e1e-b003-44f1-a946-50aed6b44fe8': 'CM 419',
        '14bf978b-5f3f-4279-b0c1-b91eb8a28e3a': 'CM 420',
        '0917556b-e2b7-466b-bc55-fc3a79bb9a25': 'CM 552',
        'fe1548c9-2ee5-44a8-9105-3fa2922438f4': 'CM 552',
      };

      const cmName = param?.id ? cmNameMap[param.id] || param.parameter : `Parameter ${index + 1}`;

      return {
        label: cmName,
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
