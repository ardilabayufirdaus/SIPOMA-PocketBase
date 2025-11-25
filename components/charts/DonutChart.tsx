import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DonutChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  t: any;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, t }) => {
  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: data.map((item) => item.color),
        borderColor: data.map((item) => item.color),
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBorderColor: data.map((item) => item.color),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // We show custom legend below
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value}`;
          },
        },
      },
    },
    cutout: '60%', // Creates donut effect
  };

  return (
    <div className="w-24 h-24">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};


