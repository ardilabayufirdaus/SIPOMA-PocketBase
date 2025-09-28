import React, { useState, useEffect } from 'react';
import {
  useAuditStore,
  AuditEvent,
  AuditQuery,
  AuditReport,
  AuditRule,
  ComplianceFramework,
  AUDIT_CATEGORIES,
  AUDIT_ACTIONS,
} from '../../stores/auditStore';

const AuditLoggingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'events' | 'reports' | 'rules' | 'compliance'>(
    'events'
  );
  const [searchQuery, setSearchQuery] = useState<AuditQuery>({});
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const { searchEvents, auditReports, auditRules, complianceFrameworks } = useAuditStore();

  useEffect(() => {
    loadEvents();
  }, [searchQuery]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const result = await searchEvents(searchQuery);
      setEvents(result.events);
    } catch (error) {
      // Handle error silently or show user notification
      void error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logging Dashboard</h1>
        <p className="text-gray-600">Comprehensive audit trail and compliance monitoring</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {(['events', 'reports', 'rules', 'compliance'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'events' && (
        <AuditEventsTab
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          events={events}
          loading={loading}
        />
      )}

      {activeTab === 'reports' && <AuditReportsTab reports={auditReports} />}

      {activeTab === 'rules' && <AuditRulesTab rules={auditRules} />}

      {activeTab === 'compliance' && <ComplianceTab frameworks={complianceFrameworks} />}
    </div>
  );
};

// Events Tab Component
interface AuditEventsTabProps {
  searchQuery: AuditQuery;
  setSearchQuery: (query: AuditQuery) => void;
  events: AuditEvent[];
  loading: boolean;
}

const AuditEventsTab: React.FC<AuditEventsTabProps> = ({
  searchQuery,
  setSearchQuery,
  events,
  loading,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Audit Events</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery.searchText || ''}
            onChange={(e) => setSearchQuery({ ...searchQuery, searchText: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <input
                type="text"
                placeholder="User ID"
                value={searchQuery.userId || ''}
                onChange={(e) => setSearchQuery({ ...searchQuery, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={searchQuery.action || ''}
                onChange={(e) => setSearchQuery({ ...searchQuery, action: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Actions</option>
                {Object.values(AUDIT_ACTIONS).map((action) => (
                  <option key={String(action)} value={String(action)}>
                    {String(action)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={searchQuery.category || ''}
                onChange={(e) => setSearchQuery({ ...searchQuery, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Categories</option>
                {Object.values(AUDIT_CATEGORIES).map((category) => (
                  <option key={String(category)} value={String(category)}>
                    {String(category)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={searchQuery.severity || ''}
                onChange={(e) =>
                  setSearchQuery({
                    ...searchQuery,
                    severity: e.target.value as 'low' | 'medium' | 'high' | 'critical',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
              <select
                value={searchQuery.outcome || ''}
                onChange={(e) =>
                  setSearchQuery({
                    ...searchQuery,
                    outcome: e.target.value as 'success' | 'failure' | 'partial',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Outcomes</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="partial">Partial</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading events...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outcome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.timestamp.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.resource}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.outcome === 'success'
                            ? 'bg-green-100 text-green-800'
                            : event.outcome === 'failure'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {event.outcome}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : event.severity === 'high'
                              ? 'bg-orange-100 text-orange-800'
                              : event.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {event.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedEvent(event)}
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
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
};

// Reports Tab Component
interface AuditReportsTabProps {
  reports: AuditReport[];
}

const AuditReportsTab: React.FC<AuditReportsTabProps> = ({ reports }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { generateReport, exportReport } = useAuditStore();

  const handleGenerateReport = async (reportId: string) => {
    try {
      const report = await generateReport(reportId);
      // Handle successful report generation
      void report; // Report generated successfully
    } catch (error) {
      // Handle error silently or show user notification
      void error;
    }
  };

  const handleExportReport = async (reportId: string, format: 'csv' | 'json') => {
    try {
      const blob = await exportReport(reportId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_report_${reportId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      // Handle error silently or show user notification
      void error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Audit Reports</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Report
        </button>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">{report.name}</h3>
                <p className="text-gray-600">{report.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleGenerateReport(report.id)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Generate
                </button>
                <button
                  onClick={() => handleExportReport(report.id, 'csv')}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExportReport(report.id, 'json')}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Export JSON
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p>Created: {report.createdAt.toLocaleDateString()}</p>
              {report.lastRun && <p>Last run: {report.lastRun.toLocaleDateString()}</p>}
              {report.schedule && <p>Frequency: {report.schedule.frequency}</p>}
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && <CreateReportModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
};

// Rules Tab Component
interface AuditRulesTabProps {
  rules: AuditRule[];
}

const AuditRulesTab: React.FC<AuditRulesTabProps> = ({ rules }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { updateRule } = useAuditStore();

  const toggleRuleActive = async (ruleId: string, isActive: boolean) => {
    try {
      await updateRule(ruleId, { isActive });
    } catch (error) {
      // Handle error silently or show user notification
      void error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Audit Rules</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Rule
        </button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
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
                    onChange={(e) => toggleRuleActive(rule.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p>Triggered: {rule.triggeredCount} times</p>
              {rule.lastTriggered && (
                <p>Last triggered: {rule.lastTriggered.toLocaleDateString()}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && <CreateRuleModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
};

// Compliance Tab Component
interface ComplianceTabProps {
  frameworks: ComplianceFramework[];
}

const ComplianceTab: React.FC<ComplianceTabProps> = ({ frameworks }) => {
  const { checkCompliance } = useAuditStore();
  const [complianceStatuses, setComplianceStatuses] = useState<
    Array<{
      framework: ComplianceFramework;
      status: {
        overallCompliance: number;
        requirements: Array<{ requirementId: string; status: string; issues: string[] }>;
        recommendations: string[];
      } | null;
    }>
  >([]);

  useEffect(() => {
    loadComplianceStatuses();
  }, [frameworks]);

  const loadComplianceStatuses = async () => {
    const statuses = await Promise.all(
      frameworks.map(async (framework) => {
        try {
          const status = await checkCompliance(framework.id);
          return { framework, status };
        } catch (error) {
          // Handle error silently or show user notification
          void error;
          return { framework, status: null };
        }
      })
    );
    setComplianceStatuses(statuses);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Compliance Frameworks</h2>

      <div className="grid gap-6">
        {complianceStatuses.map(({ framework, status }) => (
          <div key={framework.id} className="bg-white p-6 rounded-lg shadow">
            <div className="mb-4">
              <h3 className="text-lg font-medium">{framework.name}</h3>
              <p className="text-gray-600">{framework.description}</p>
            </div>

            {status && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span>Overall Compliance</span>
                      <span>{status.overallCompliance.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${
                          status.overallCompliance >= 95
                            ? 'bg-green-600'
                            : status.overallCompliance >= 70
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                        }`}
                        style={{ width: `${status.overallCompliance}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {status.requirements.map(
                    (req: { requirementId: string; status: string; issues: string[] }) => (
                      <div key={req.requirementId} className="border rounded p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Requirement {req.requirementId}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              req.status === 'compliant'
                                ? 'bg-green-100 text-green-800'
                                : req.status === 'partial'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        {req.issues.length > 0 && (
                          <ul className="mt-2 text-xs text-gray-600">
                            {req.issues.map((issue: string, index: number) => (
                              <li key={index}>• {issue}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  )}
                </div>

                {status.recommendations.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">Recommendations</h4>
                    <ul className="text-sm text-yellow-700">
                      {status.recommendations.map((rec: string, index: number) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Event Details Modal Component
interface EventDetailsModalProps {
  event: AuditEvent;
  onClose: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Event Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                <p className="text-sm text-gray-900">{event.timestamp.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">User</label>
                <p className="text-sm text-gray-900">
                  {event.userName} ({event.userId})
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Action</label>
                <p className="text-sm text-gray-900">{event.action}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Resource</label>
                <p className="text-sm text-gray-900">{event.resource}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Outcome</label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    event.outcome === 'success'
                      ? 'bg-green-100 text-green-800'
                      : event.outcome === 'failure'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {event.outcome}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Severity</label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    event.severity === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : event.severity === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : event.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {event.severity}
                </span>
              </div>
            </div>

            {event.ipAddress && (
              <div>
                <label className="block text-sm font-medium text-gray-700">IP Address</label>
                <p className="text-sm text-gray-900">{event.ipAddress}</p>
              </div>
            )}

            {event.location && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <p className="text-sm text-gray-900">
                  {event.location.city}, {event.location.country}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Details</label>
              <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded overflow-x-auto">
                {JSON.stringify(event.details, null, 2)}
              </pre>
            </div>

            {event.tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Tags</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {event.tags.map((tag, index) => (
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
    </div>
  );
};

// Create Report Modal Component
const CreateReportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [reportData, setReportData] = useState({
    name: '',
    description: '',
    format: 'json' as 'json' | 'csv' | 'pdf' | 'excel',
    query: {} as AuditQuery,
    isActive: true,
  });

  const { createReport } = useAuditStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReport(reportData);
      onClose();
    } catch (error) {
      // Handle error silently or show user notification
      void error;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Create Audit Report</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={reportData.name}
                onChange={(e) => setReportData({ ...reportData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={reportData.description}
                onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <select
                value={reportData.format}
                onChange={(e) =>
                  setReportData({
                    ...reportData,
                    format: e.target.value as 'json' | 'csv' | 'pdf' | 'excel',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create Rule Modal Component
const CreateRuleModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [ruleData, setRuleData] = useState({
    name: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    condition: {
      type: 'threshold' as const,
      field: 'action',
      operator: 'eq' as const,
      value: '',
    },
    actions: [
      {
        type: 'notification' as const,
        configuration: {},
        isActive: true,
      },
    ],
    isActive: true,
  });

  const { createRule } = useAuditStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRule(ruleData);
      onClose();
    } catch (error) {
      // Handle error silently or show user notification
      void error;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Create Audit Rule</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={ruleData.name}
                onChange={(e) => setRuleData({ ...ruleData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={ruleData.description}
                onChange={(e) => setRuleData({ ...ruleData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={ruleData.severity}
                onChange={(e) =>
                  setRuleData({
                    ...ruleData,
                    severity: e.target.value as 'low' | 'medium' | 'high' | 'critical',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition Field
              </label>
              <input
                type="text"
                value={ruleData.condition.field}
                onChange={(e) =>
                  setRuleData({
                    ...ruleData,
                    condition: { ...ruleData.condition, field: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., action, userId, severity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition Value
              </label>
              <input
                type="text"
                value={String(ruleData.condition.value)}
                onChange={(e) =>
                  setRuleData({
                    ...ruleData,
                    condition: { ...ruleData.condition, value: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Value to match"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuditLoggingDashboard;
