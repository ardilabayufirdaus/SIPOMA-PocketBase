import React, { useState, useEffect } from 'react';
import {
  useSecurityMonitoringStore,
  SecurityAlert,
  SecurityIncident,
  SecurityMetrics,
} from '../../stores/securityMonitoringStore';

const SecurityMonitoringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'alerts' | 'incidents' | 'threats' | 'rules'
  >('overview');
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    getSecurityMetrics,
    alerts: storeAlerts,
    incidents: storeIncidents,
  } = useSecurityMonitoringStore();

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setAlerts(storeAlerts);
    setIncidents(storeIncidents);
  }, [storeAlerts, storeIncidents]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const metricsData = await getSecurityMetrics();
      setMetrics(metricsData);
    } catch (error) {
      // Handle error silently
      void error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-full mx-auto bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Security Monitoring Dashboard</h1>
        <p className="text-gray-600">
          Real-time security monitoring, threat detection, and incident management
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'alerts', 'incidents', 'threats', 'rules'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab metrics={metrics} loading={loading} />}

      {activeTab === 'alerts' && <AlertsTab alerts={alerts} />}

      {activeTab === 'incidents' && <IncidentsTab incidents={incidents} />}

      {activeTab === 'threats' && <ThreatsTab />}

      {activeTab === 'rules' && <RulesTab />}
    </div>
  );
};

// Overview Tab Component
interface OverviewTabProps {
  metrics: SecurityMetrics | null;
  loading: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-gray-600">Loading security metrics...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No metrics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Score */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Security Score</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Security</span>
              <span className="font-medium">{metrics.securityScore}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  metrics.securityScore >= 90
                    ? 'bg-green-600'
                    : metrics.securityScore >= 70
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                }`}
                style={{ width: `${metrics.securityScore}%` }}
              ></div>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              metrics.securityScore >= 90
                ? 'bg-green-100 text-green-800'
                : metrics.securityScore >= 70
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {metrics.securityScore >= 90
              ? 'Excellent'
              : metrics.securityScore >= 70
                ? 'Good'
                : 'Needs Attention'}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Alerts"
          value={metrics.totalAlerts}
          trend="+12%"
          trendUp={false}
          color="red"
        />
        <MetricCard
          title="Active Incidents"
          value={metrics.incidentsToday}
          trend="+5%"
          trendUp={false}
          color="orange"
        />
        <MetricCard
          title="Vulnerabilities"
          value={metrics.vulnerabilityCount}
          trend="-8%"
          trendUp={true}
          color="yellow"
        />
        <MetricCard
          title="Patching Compliance"
          value={`${metrics.patchingCompliance}%`}
          trend="+3%"
          trendUp={true}
          color="green"
        />
      </div>

      {/* Alerts by Severity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Alerts by Severity</h3>
          <div className="space-y-3">
            {Object.entries(metrics.alertsBySeverity).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      severity === 'critical'
                        ? 'bg-red-600'
                        : severity === 'high'
                          ? 'bg-orange-500'
                          : severity === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-gray-400'
                    }`}
                  ></div>
                  <span className="capitalize text-sm font-medium">{severity}</span>
                </div>
                <span className="text-sm text-gray-600">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <div className="space-y-3">
            <HealthMetric label="CPU Usage" value={metrics.systemHealth.cpu} />
            <HealthMetric label="Memory Usage" value={metrics.systemHealth.memory} />
            <HealthMetric label="Disk Usage" value={metrics.systemHealth.disk} />
            <HealthMetric label="Network Usage" value={metrics.systemHealth.network} />
          </div>
        </div>
      </div>

      {/* Response Times */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Response Times</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{metrics.meanTimeToDetection}m</div>
            <div className="text-sm text-gray-600">Mean Time to Detection</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.meanTimeToResponse}m</div>
            <div className="text-sm text-gray-600">Mean Time to Response</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(metrics.averageResolutionTime)}m
            </div>
            <div className="text-sm text-gray-600">Average Resolution Time</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Alerts Tab Component
interface AlertsTabProps {
  alerts: SecurityAlert[];
}

const AlertsTab: React.FC<AlertsTabProps> = ({ alerts }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);

  const { acknowledgeAlert, resolveAlert, escalateAlert } = useSecurityMonitoringStore();

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    return true;
  });

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId, 'current_user');
    } catch (error) {
      void error;
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert(alertId, 'current_user', 'Resolved by user');
    } catch (error) {
      void error;
    }
  };

  const handleEscalate = async (alertId: string) => {
    try {
      await escalateAlert(alertId, 'security_team', 'current_user');
    } catch (error) {
      void error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alert
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{alert.title}</div>
                      <div className="text-sm text-gray-500">{alert.description}</div>
                      <div className="text-xs text-gray-400">Source: {alert.source}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        alert.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : alert.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : alert.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        alert.status === 'new'
                          ? 'bg-blue-100 text-blue-800'
                          : alert.status === 'acknowledged'
                            ? 'bg-yellow-100 text-yellow-800'
                            : alert.status === 'investigating'
                              ? 'bg-purple-100 text-purple-800'
                              : alert.status === 'resolved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {alert.timestamp.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {alert.status === 'new' && (
                      <>
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => handleEscalate(alert.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Escalate
                        </button>
                      </>
                    )}
                    {alert.status === 'acknowledged' && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <AlertDetailsModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </div>
  );
};

// Incidents Tab Component
interface IncidentsTabProps {
  incidents: SecurityIncident[];
}

const IncidentsTab: React.FC<IncidentsTabProps> = ({ incidents }) => {
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Security Incidents</h2>
        <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
          Create Incident
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incident
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{incident.title}</div>
                      <div className="text-sm text-gray-500">{incident.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        incident.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : incident.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : incident.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        incident.status === 'open'
                          ? 'bg-red-100 text-red-800'
                          : incident.status === 'investigating'
                            ? 'bg-yellow-100 text-yellow-800'
                            : incident.status === 'contained'
                              ? 'bg-blue-100 text-blue-800'
                              : incident.status === 'resolved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {incident.assignedTo || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {incident.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedIncident(incident)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Details Modal */}
      {selectedIncident && (
        <IncidentDetailsModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  );
};

// Threats Tab Component
const ThreatsTab: React.FC = () => {
  const { threatIntelligence } = useSecurityMonitoringStore();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Threat Intelligence</h2>
        <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
          Import Threats
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Threat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {threatIntelligence.map((threat) => (
                <tr key={threat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{threat.value}</div>
                      <div className="text-sm text-gray-500">{threat.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threat.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        threat.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : threat.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : threat.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {threat.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threat.confidence}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threat.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        threat.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {threat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Rules Tab Component
const RulesTab: React.FC = () => {
  const { securityRules, enableSecurityRule, disableSecurityRule } = useSecurityMonitoringStore();

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await enableSecurityRule(ruleId);
      } else {
        await disableSecurityRule(ruleId);
      }
    } catch (error) {
      void error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Security Rules</h2>
        <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
          Create Rule
        </button>
      </div>

      <div className="grid gap-4">
        {securityRules.map((rule) => (
          <div key={rule.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">{rule.name}</h3>
                <p className="text-gray-600">{rule.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    rule.severity === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : rule.severity === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : rule.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {rule.severity}
                </span>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rule.isActive}
                    onChange={(e) => toggleRule(rule.id, e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p>Triggered: {rule.triggerCount} times</p>
              {rule.lastTriggered && (
                <p>Last triggered: {rule.lastTriggered.toLocaleDateString()}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper Components
interface MetricCardProps {
  title: string;
  value: string | number;
  trend: string;
  trendUp: boolean;
  color: 'red' | 'orange' | 'yellow' | 'green';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, trendUp, color }) => {
  const colorClasses = {
    red: 'text-red-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
        </div>
        <div className={`text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? '↗' : '↘'} {trend}
        </div>
      </div>
    </div>
  );
};

interface HealthMetricProps {
  label: string;
  value: number;
}

const HealthMetric: React.FC<HealthMetricProps> = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              value > 80 ? 'bg-red-600' : value > 60 ? 'bg-yellow-600' : 'bg-green-600'
            }`}
            style={{ width: `${value}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-600">{value}%</span>
      </div>
    </div>
  );
};

// Alert Details Modal
interface AlertDetailsModalProps {
  alert: SecurityAlert;
  onClose: () => void;
}

const AlertDetailsModal: React.FC<AlertDetailsModalProps> = ({ alert, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Alert Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <p className="text-sm text-gray-900">{alert.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Severity</label>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  alert.severity === 'critical'
                    ? 'bg-red-100 text-red-800'
                    : alert.severity === 'high'
                      ? 'bg-orange-100 text-orange-800'
                      : alert.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {alert.severity}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Risk Score</label>
              <p className="text-sm text-gray-900">{alert.riskScore}/100</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confidence</label>
              <p className="text-sm text-gray-900">{alert.confidenceLevel}%</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <p className="text-sm text-gray-900">{alert.description}</p>
          </div>

          {alert.mitigationSteps.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Mitigation Steps</label>
              <ul className="text-sm text-gray-900 list-disc list-inside">
                {alert.mitigationSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          {alert.tags.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {alert.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Incident Details Modal
interface IncidentDetailsModalProps {
  incident: SecurityIncident;
  onClose: () => void;
}

const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({ incident, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Incident Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <p className="text-sm text-gray-900">{incident.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  incident.status === 'open'
                    ? 'bg-red-100 text-red-800'
                    : incident.status === 'investigating'
                      ? 'bg-yellow-100 text-yellow-800'
                      : incident.status === 'contained'
                        ? 'bg-blue-100 text-blue-800'
                        : incident.status === 'resolved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                }`}
              >
                {incident.status}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <p className="text-sm text-gray-900">{incident.description}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Impact Assessment</label>
            <div className="text-sm text-gray-900">
              <p>Affected Systems: {incident.impactAssessment.affectedSystems.join(', ')}</p>
              <p>Affected Users: {incident.impactAssessment.affectedUsers}</p>
              <p>Data Compromised: {incident.impactAssessment.dataCompromised ? 'Yes' : 'No'}</p>
              <p>Business Impact: {incident.impactAssessment.businessImpact}</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Timeline</label>
            <div className="space-y-2">
              {incident.timeline.map((entry) => (
                <div key={entry.id} className="flex items-start space-x-2">
                  <div className="text-xs text-gray-500 w-20">
                    {entry.timestamp.toLocaleTimeString()}
                  </div>
                  <div className="text-sm text-gray-900">{entry.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityMonitoringDashboard;
