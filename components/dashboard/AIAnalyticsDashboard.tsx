import React, { useState, useMemo } from 'react';
import { useAIAnalyticsStore } from '../../stores/aiAnalyticsStore';

interface AIAnalyticsDashboardProps {
  className?: string;
}

const AIAnalyticsDashboard: React.FC<AIAnalyticsDashboardProps> = ({ className = '' }) => {
  const {
    anomalies,
    trends,
    models,
    insights,
    settings,
    resolveAnomaly,
    markInsightAsRead,
    bookmarkInsight,
    updateSettings,
  } = useAIAnalyticsStore();

  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'anomalies' | 'trends' | 'predictions' | 'insights'
  >('overview');
  const [timeFilter, setTimeFilter] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  // Filter data based on time selection
  const filteredData = useMemo(() => {
    const now = new Date();
    let timeThreshold: Date;

    switch (timeFilter) {
      case '1h':
        timeThreshold = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        timeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    return {
      anomalies: anomalies.filter((a) => new Date(a.timestamp) > timeThreshold),
      trends: trends.filter((t) => new Date(t.createdAt) > timeThreshold),
      insights: insights.filter((i) => new Date(i.createdAt) > timeThreshold),
    };
  }, [anomalies, trends, insights, timeFilter]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'text-blue-600 bg-blue-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'critical':
        return 'text-red-800 bg-red-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      case 'stable':
        return '➡️';
      case 'volatile':
        return '⚡';
      default:
        return '📊';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* AI Analytics Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Anomalies</p>
              <p className="text-2xl font-bold text-slate-900">
                {filteredData.anomalies.filter((a) => !a.isResolved).length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-red-100">
              <div className="w-6 h-6 text-red-600">🚨</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Models</p>
              <p className="text-2xl font-bold text-slate-900">
                {models.filter((m) => m.isActive).length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-blue-100">
              <div className="w-6 h-6 text-blue-600">🤖</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">New Insights</p>
              <p className="text-2xl font-bold text-slate-900">
                {filteredData.insights.filter((i) => !i.isRead).length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-green-100">
              <div className="w-6 h-6 text-green-600">💡</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Trend Analysis</p>
              <p className="text-2xl font-bold text-slate-900">{filteredData.trends.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-100">
              <div className="w-6 h-6 text-purple-600">📊</div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">AI Analytics Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Anomaly Detection
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.anomalyDetection.enabled}
                  onChange={(e) =>
                    updateSettings({
                      anomalyDetection: { ...settings.anomalyDetection, enabled: e.target.checked },
                    })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-600">Enable Detection</span>
              </label>
              <select
                value={settings.anomalyDetection.sensitivity}
                onChange={(e) =>
                  updateSettings({
                    anomalyDetection: {
                      ...settings.anomalyDetection,
                      sensitivity: e.target.value as 'low' | 'medium' | 'high',
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low Sensitivity</option>
                <option value="medium">Medium Sensitivity</option>
                <option value="high">High Sensitivity</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Trend Analysis</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.trendAnalysis.enabled}
                  onChange={(e) =>
                    updateSettings({
                      trendAnalysis: { ...settings.trendAnalysis, enabled: e.target.checked },
                    })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-600">Enable Analysis</span>
              </label>
              <input
                type="number"
                value={settings.trendAnalysis.updateInterval}
                onChange={(e) =>
                  updateSettings({
                    trendAnalysis: {
                      ...settings.trendAnalysis,
                      updateInterval: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Update interval (minutes)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Predictive Modeling
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.predictiveModeling.enabled}
                  onChange={(e) =>
                    updateSettings({
                      predictiveModeling: {
                        ...settings.predictiveModeling,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-600">Enable Modeling</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.predictiveModeling.autoRetrain}
                  onChange={(e) =>
                    updateSettings({
                      predictiveModeling: {
                        ...settings.predictiveModeling,
                        autoRetrain: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-600">Auto Retrain</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Insights */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent AI Insights</h3>
        <div className="space-y-3">
          {filteredData.insights.slice(0, 5).map((insight) => (
            <div key={insight.id} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getImpactColor(insight.impact)}`}
                    >
                      {insight.impact} impact
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(insight.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-slate-900 mb-1">{insight.title}</h4>
                  <p className="text-sm text-slate-600">{insight.description}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => bookmarkInsight(insight.id)}
                    className={`p-1 rounded ${insight.isBookmarked ? 'text-yellow-500' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    ⭐
                  </button>
                  {!insight.isRead && (
                    <button
                      onClick={() => markInsightAsRead(insight.id)}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnomalies = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Anomaly Detection</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {filteredData.anomalies.map((anomaly) => (
            <div key={anomaly.id} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(anomaly.severity)}`}
                    >
                      {anomaly.severity}
                    </span>
                    <span className="text-sm text-slate-600">{anomaly.category}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(anomaly.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-900 mb-2">{anomaly.description}</p>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div>
                      Actual: {anomaly.value.toFixed(2)} | Expected:{' '}
                      {anomaly.expectedValue.toFixed(2)}
                    </div>
                    <div>Confidence: {(anomaly.confidence * 100).toFixed(1)}%</div>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  {!anomaly.isResolved ? (
                    <button
                      onClick={() => resolveAnomaly(anomaly.id, 'admin')}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    >
                      Resolve
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-md">
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Trend Analysis</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Direction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Prediction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredData.trends.map((trend) => (
              <tr key={trend.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {trend.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  <div className="flex items-center space-x-2">
                    <span>{getTrendIcon(trend.direction)}</span>
                    <span>{trend.direction}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {(trend.confidence * 100).toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {trend.prediction.nextValue.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {new Date(trend.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPredictions = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Predictive Models</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <div key={model.id} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-medium text-slate-900">{model.name}</h4>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    model.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {model.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div>Type: {model.type}</div>
                <div>Category: {model.category}</div>
                <div>Accuracy: {(model.accuracy * 100).toFixed(1)}%</div>
                <div>Training Data: {model.trainingDataSize} points</div>
                <div>Last Training: {new Date(model.lastTraining).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">AI Insights</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {filteredData.insights.map((insight) => (
            <div key={insight.id} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getImpactColor(insight.impact)}`}
                    >
                      {insight.impact} impact
                    </span>
                    <span className="text-xs text-slate-500">
                      Confidence: {(insight.confidence * 100).toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(insight.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="text-lg font-medium text-slate-900 mb-1">{insight.title}</h4>
                  <p className="text-sm text-slate-600 mb-3">{insight.description}</p>

                  {insight.suggestedActions && insight.suggestedActions.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-slate-700 mb-1">Suggested Actions:</p>
                      <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                        {insight.suggestedActions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Category: {insight.category}</div>
                    <div>Affected Systems: {insight.relatedData.affectedSystems.join(', ')}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => bookmarkInsight(insight.id)}
                    className={`p-1 rounded ${insight.isBookmarked ? 'text-yellow-500' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    ⭐
                  </button>
                  {!insight.isRead && (
                    <button
                      onClick={() => markInsightAsRead(insight.id)}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">AI Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'anomalies', name: 'Anomalies' },
            { id: 'trends', name: 'Trends' },
            { id: 'predictions', name: 'Predictions' },
            { id: 'insights', name: 'Insights' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'anomalies' && renderAnomalies()}
        {selectedTab === 'trends' && renderTrends()}
        {selectedTab === 'predictions' && renderPredictions()}
        {selectedTab === 'insights' && renderInsights()}
      </div>
    </div>
  );
};

export default AIAnalyticsDashboard;


