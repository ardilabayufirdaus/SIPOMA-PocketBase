import React from 'react';
import ExclamationTriangleIcon from '../../components/icons/ExclamationTriangleIcon';

interface Recommendation {
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
}

interface RecommendationsProps {
  recommendations: Recommendation[];
}

export const Recommendations: React.FC<RecommendationsProps> = ({ recommendations }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold text-slate-800 mb-4">
      Performance Insights & Recommendations
    </h3>
    <div className="space-y-3">
      {recommendations.map((rec, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border-l-4 ${
            rec.type === 'critical'
              ? 'bg-red-50 border-red-500'
              : rec.type === 'warning'
                ? 'bg-yellow-50 border-yellow-500'
                : 'bg-blue-50 border-blue-500'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-full ${
                rec.type === 'critical'
                  ? 'bg-red-100'
                  : rec.type === 'warning'
                    ? 'bg-yellow-100'
                    : 'bg-blue-100'
              }`}
            >
              <ExclamationTriangleIcon
                className={`w-5 h-5 ${
                  rec.type === 'critical'
                    ? 'text-red-600'
                    : rec.type === 'warning'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                }`}
              />
            </div>
            <div>
              <h4
                className={`font-semibold ${
                  rec.type === 'critical'
                    ? 'text-red-900'
                    : rec.type === 'warning'
                      ? 'text-yellow-900'
                      : 'text-blue-900'
                }`}
              >
                {rec.title}
              </h4>
              <p
                className={`text-sm mt-1 ${
                  rec.type === 'critical'
                    ? 'text-red-700'
                    : rec.type === 'warning'
                      ? 'text-yellow-700'
                      : 'text-blue-700'
                }`}
              >
                {rec.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

