import React, { memo } from 'react';
import LazyChart from '../../../../components/LazyChart';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface WorkInstructionsChartProps {
  data: any[];
}

const WorkInstructionsChart = memo<WorkInstructionsChartProps>(({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
));

WorkInstructionsChart.displayName = 'WorkInstructionsChart';

interface WorkInstructionsSectionProps {
  workInstructionsSummary: any[];
}

const WorkInstructionsSection: React.FC<WorkInstructionsSectionProps> = ({
  workInstructionsSummary,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Work Instructions by Activity</h3>
      {workInstructionsSummary.length > 0 ? (
        <LazyChart>
          <WorkInstructionsChart data={workInstructionsSummary} />
        </LazyChart>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📋</div>
            <div className="text-lg font-medium">No Work Instructions</div>
            <div className="text-sm">No work instructions available</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkInstructionsSection;
