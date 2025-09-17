import React, { memo } from 'react';
import LazyChart from '../../../../components/LazyChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CopAnalysisChartProps {
  data: any[];
}

const CopAnalysisChart = memo<CopAnalysisChartProps>(({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value" fill="#8884d8" name="Actual" />
      <Bar dataKey="target" fill="#82ca9d" name="Target" />
    </BarChart>
  </ResponsiveContainer>
));

CopAnalysisChart.displayName = 'CopAnalysisChart';

interface CopAnalysisSectionProps {
  copAnalysisData: any[];
}

const CopAnalysisSection: React.FC<CopAnalysisSectionProps> = ({ copAnalysisData }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">COP Analysis</h3>
      {copAnalysisData.length > 0 ? (
        <LazyChart>
          <CopAnalysisChart data={copAnalysisData} />
        </LazyChart>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-lg font-medium">No COP Analysis Data</div>
            <div className="text-sm">No COP parameters found for the selected filters</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CopAnalysisSection;
