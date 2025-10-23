import React, { useState, useMemo } from 'react';
import { useSecurityStore } from '../../stores/securityStore';

interface SecurityDashboardProps {
  className?: string;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ className = '' }) => {
  const { events, alerts, metrics, auditTrail, activeSessions, resolveAlert, getSecurityReport } =
    useSecurityStore();

  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'events' | 'alerts' | 'audit' | 'sessions'
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
      events: events.filter((e) => new Date(e.timestamp) > timeThreshold),
      alerts: alerts.filter((a) => new Date(a.createdAt) > timeThreshold),
      auditEntries: auditTrail.filter((a) => new Date(a.timestamp) > timeThreshold),
    };
  }, [events, alerts, auditTrail, timeFilter]);

  // Security report data
  const securityReport = useMemo(() => getSecurityReport(), [getSecurityReport]);

  // Risk level color mapping
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-100';
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'text-blue-600 bg-blue-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'critical':
        return 'text-red-800 bg-red-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Risk Score</p>
              <p className="text-2xl font-bold text-slate-900">{metrics.riskScore}</p>
            </div>
            <div
              className={`p-2 rounded-lg ${metrics.riskScore > 70 ? 'bg-red-100' : metrics.riskScore > 40 ? 'bg-yellow-100' : 'bg-green-100'}`}
            >
              <div
                className={`w-6 h-6 ${metrics.riskScore > 70 ? 'text-red-600' : metrics.riskScore > 40 ? 'text-yellow-600' : 'text-green-600'}`}
              >
                🛡️
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Alerts</p>
              <p className="text-2xl font-bold text-slate-900">{metrics.activeAlerts}</p>
            </div>
            <div className="p-2 rounded-lg bg-orange-100">
              <div className="w-6 h-6 text-orange-600">⚠️</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Failed Logins</p>
              <p className="text-2xl font-bold text-slate-900">{metrics.failedLogins}</p>
            </div>
            <div className="p-2 rounded-lg bg-red-100">
              <div className="w-6 h-6 text-red-600">🚫</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Sessions</p>
              <p className="text-2xl font-bold text-slate-900">{activeSessions.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-100">
              <div className="w-6 h-6 text-blue-600">👥</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      {securityReport.recommendations.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Security Recommendations</h3>
          <div className="space-y-3">
            {securityReport.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 text-yellow-600">💡</div>
                </div>
                <p className="text-sm text-yellow-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Events Chart Placeholder */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Security Events (Last 24h)</h3>
        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
          <p className="text-slate-500">Chart visualization would go here</p>
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Security Events</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Result
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Risk Level
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredData.events.map((event) => (
              <tr key={event.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {new Date(event.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {event.type.replace('_', ' ').toUpperCase()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {event.username || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {event.ipAddress || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      event.result === 'success'
                        ? 'bg-green-100 text-green-800'
                        : event.result === 'failure'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {event.result}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(event.riskLevel)}`}
                  >
                    {event.riskLevel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Security Alerts</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {filteredData.alerts.map((alert) => (
            <div key={alert.id} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-sm text-slate-500">
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="text-lg font-medium text-slate-900 mb-1">{alert.title}</h4>
                  <p className="text-sm text-slate-600 mb-2">{alert.description}</p>
                  {alert.ipAddress && (
                    <p className="text-xs text-slate-500">IP: {alert.ipAddress}</p>
                  )}
                </div>
                <div className="flex-shrink-0 ml-4">
                  {!alert.isResolved ? (
                    <button
                      onClick={() => resolveAlert(alert.id, 'admin')}
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

  const renderSessions = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Active Sessions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Device
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Last Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {activeSessions.map((session) => (
              <tr key={session.sessionId} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {session.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {session.ipAddress}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {session.deviceInfo?.browser} on {session.deviceInfo?.os}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {new Date(session.lastActivity).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      session.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {session.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Security Dashboard</h1>
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
            { id: 'events', name: 'Events' },
            { id: 'alerts', name: 'Alerts' },
            { id: 'audit', name: 'Audit Trail' },
            { id: 'sessions', name: 'Sessions' },
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
        {selectedTab === 'events' && renderEvents()}
        {selectedTab === 'alerts' && renderAlerts()}
        {selectedTab === 'audit' && renderSessions()}
        {selectedTab === 'sessions' && renderSessions()}
      </div>
    </div>
  );
};

export default SecurityDashboard;

