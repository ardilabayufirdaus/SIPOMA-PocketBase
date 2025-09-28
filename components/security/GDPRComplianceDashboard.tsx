import React, { useState, useEffect } from 'react';
import { useGDPRComplianceStore } from '../../stores/gdprComplianceStore';
import {
  DataSubject,
  ConsentRecord,
  DataSubjectRequest,
  ComplianceMetrics,
  CONSENT_TYPES,
  DATA_SUBJECT_RIGHTS,
} from '../../stores/gdprComplianceStore';

interface GDPRComplianceDashboardProps {
  className?: string;
}

const GDPRComplianceDashboard: React.FC<GDPRComplianceDashboardProps> = ({ className = '' }) => {
  const {
    dataSubjects,
    consentRecords,
    dataSubjectRequests,
    complianceReports,
    createDataSubject,
    recordConsent,
    createDataSubjectRequest,
    generateComplianceReport,
    getComplianceMetrics,
    getConsentMetrics,
    generateComplianceScore,
    searchDataSubjects,
    getOverdueRequests,
    getExpiringConsents,
  } = useGDPRComplianceStore();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'subjects' | 'consents' | 'requests' | 'reports'
  >('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DataSubject[]>([]);
  const [complianceScore, setComplianceScore] = useState<{
    score: number;
    breakdown: Record<string, number>;
  } | null>(null);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [consentMetrics, setConsentMetrics] = useState<{
    totalConsents: number;
    activeConsents: number;
    revokedConsents: number;
    consentsByType: Record<string, number>;
    renewalRate: number;
  } | null>(null);
  const [overdueRequests, setOverdueRequests] = useState<DataSubjectRequest[]>([]);
  const [expiringConsents, setExpiringConsents] = useState<ConsentRecord[]>([]);

  // Modal states
  const [showNewSubjectModal, setShowNewSubjectModal] = useState(false);
  const [showNewConsentModal, setShowNewConsentModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<DataSubject | null>(null);

  // Form states
  const [newSubjectForm, setNewSubjectForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    nationality: '',
    isActive: true,
    legalBasisForProcessing: ['consent'],
  });

  const [newConsentForm, setNewConsentForm] = useState({
    dataSubjectId: '',
    consentType: 'marketing' as ConsentRecord['consentType'],
    purpose: '',
    isGranted: true,
    consentMethod: 'explicit' as ConsentRecord['consentMethod'],
    legalBasis: 'consent' as ConsentRecord['legalBasis'],
    version: '1.0',
    dataRetention: {
      period: 365,
      justification: 'Marketing communications',
    },
    evidence: [],
  });

  const [newRequestForm, setNewRequestForm] = useState({
    dataSubjectId: '',
    requestType: 'access' as DataSubjectRequest['requestType'],
    description: '',
    identityVerified: false,
    responseMethod: 'email' as DataSubjectRequest['responseMethod'],
  });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [score, metricsData, consentData, overdue, expiring] = await Promise.all([
          generateComplianceScore(),
          getComplianceMetrics(),
          getConsentMetrics(),
          getOverdueRequests(),
          getExpiringConsents(30), // Next 30 days
        ]);

        setComplianceScore(score);
        setMetrics(metricsData);
        setConsentMetrics(consentData);
        setOverdueRequests(overdue);
        setExpiringConsents(expiring);
      } catch (error) {
        void error;
      }
    };

    loadData();
  }, [
    generateComplianceScore,
    getComplianceMetrics,
    getConsentMetrics,
    getOverdueRequests,
    getExpiringConsents,
  ]);

  // Search data subjects
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        const results = await searchDataSubjects(searchQuery);
        setSearchResults(results);
      } catch (error) {
        void error;
      }
    } else {
      setSearchResults([]);
    }
  };

  // Create new data subject
  const handleCreateSubject = async () => {
    try {
      await createDataSubject({
        ...newSubjectForm,
        dataProcessingActivities: [],
        consentHistory: [],
        thirdPartySharing: [],
      });
      setShowNewSubjectModal(false);
      setNewSubjectForm({
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        nationality: '',
        isActive: true,
        legalBasisForProcessing: ['consent'],
      });
      // Refresh data
      window.location.reload();
    } catch (error) {
      void error;
    }
  };

  // Record new consent
  const handleRecordConsent = async () => {
    try {
      await recordConsent({
        ...newConsentForm,
        grantedAt: newConsentForm.isGranted ? new Date() : undefined,
      });
      setShowNewConsentModal(false);
      setNewConsentForm({
        dataSubjectId: '',
        consentType: 'marketing',
        purpose: '',
        isGranted: true,
        consentMethod: 'explicit',
        legalBasis: 'consent',
        version: '1.0',
        dataRetention: {
          period: 365,
          justification: 'Marketing communications',
        },
        evidence: [],
      });
      // Refresh data
      window.location.reload();
    } catch (error) {
      void error;
    }
  };

  // Create new data subject request
  const handleCreateRequest = async () => {
    try {
      await createDataSubjectRequest({
        ...newRequestForm,
        status: 'submitted',
        thirdPartyNotifications: [],
      });
      setShowNewRequestModal(false);
      setNewRequestForm({
        dataSubjectId: '',
        requestType: 'access',
        description: '',
        identityVerified: false,
        responseMethod: 'email',
      });
      // Refresh data
      window.location.reload();
    } catch (error) {
      void error;
    }
  };

  // Generate compliance report
  const handleGenerateReport = async () => {
    try {
      const period = {
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(),
      };
      await generateComplianceReport('monthly', period);
      // Refresh data
      window.location.reload();
    } catch (error) {
      void error;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Compliance Score */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">GDPR Compliance Score</h3>
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#E5E7EB" strokeWidth="10" fill="none" />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={
                  complianceScore?.score && complianceScore.score >= 80
                    ? '#10B981'
                    : complianceScore?.score && complianceScore.score >= 60
                      ? '#F59E0B'
                      : '#EF4444'
                }
                strokeWidth="10"
                fill="none"
                strokeDasharray={`${(complianceScore?.score || 0) * 2.51} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">
                {complianceScore?.score || 0}%
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Data Processing</p>
            <p className="text-xl font-semibold">
              {complianceScore?.breakdown.dataProcessing || 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Consent Management</p>
            <p className="text-xl font-semibold">
              {complianceScore?.breakdown.consentManagement || 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Request Handling</p>
            <p className="text-xl font-semibold">
              {complianceScore?.breakdown.requestHandling || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Data Subjects</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.totalDataSubjects || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Consents</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics?.activeConsents || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Requests</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.dataRequests?.total || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div
              className={`p-2 rounded-lg ${overdueRequests.length > 0 ? 'bg-red-100' : 'bg-green-100'}`}
            >
              <svg
                className={`w-6 h-6 ${overdueRequests.length > 0 ? 'text-red-600' : 'text-green-600'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{overdueRequests.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(overdueRequests.length > 0 || expiringConsents.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">GDPR Compliance Alerts</h3>
          <div className="space-y-3">
            {overdueRequests.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {overdueRequests.length} overdue data subject request
                      {overdueRequests.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-red-700">
                      Immediate attention required to maintain GDPR compliance
                    </p>
                  </div>
                </div>
              </div>
            )}

            {expiringConsents.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.314 15.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-800">
                      {expiringConsents.length} consent{expiringConsents.length > 1 ? 's' : ''}{' '}
                      expiring soon
                    </p>
                    <p className="text-sm text-yellow-700">
                      Renewal required within the next 30 days
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderDataSubjects = () => (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-lg">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search data subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowNewSubjectModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Add Data Subject
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Search Results</h4>
            <div className="space-y-2">
              {searchResults.map((subject) => (
                <div
                  key={subject.id}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => setSelectedSubject(subject)}
                >
                  <p className="font-medium">
                    {subject.firstName} {subject.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{subject.email}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Data Subjects Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Data Subjects ({dataSubjects.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dataSubjects.slice(0, 10).map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {subject.firstName} {subject.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{subject.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        subject.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {subject.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subject.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subject.consentHistory.filter((c) => c.isGranted).length} active
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedSubject(subject)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderConsents = () => (
    <div className="space-y-6">
      {/* Consent Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-sm font-medium text-gray-500">Total Consents</h4>
          <p className="text-2xl font-semibold text-gray-900">
            {consentMetrics?.totalConsents || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-sm font-medium text-gray-500">Active</h4>
          <p className="text-2xl font-semibold text-green-600">
            {consentMetrics?.activeConsents || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-sm font-medium text-gray-500">Revoked</h4>
          <p className="text-2xl font-semibold text-red-600">
            {consentMetrics?.revokedConsents || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-sm font-medium text-gray-500">Renewal Rate</h4>
          <p className="text-2xl font-semibold text-blue-600">
            {consentMetrics?.renewalRate?.toFixed(1) || 0}%
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Consent Management</h3>
          <button
            onClick={() => setShowNewConsentModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Record Consent
          </button>
        </div>
      </div>

      {/* Consents Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Consents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {consentRecords.slice(0, 10).map((consent) => {
                const subject = dataSubjects.find((s) => s.id === consent.dataSubjectId);
                return (
                  <tr key={consent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {subject ? `${subject.firstName} ${subject.lastName}` : 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {consent.consentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consent.purpose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          consent.isGranted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {consent.isGranted ? 'Granted' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consent.grantedAt?.toLocaleDateString() ||
                        consent.revokedAt?.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consent.consentMethod}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-6">
      {/* Request Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-sm font-medium text-gray-500">Total Requests</h4>
          <p className="text-2xl font-semibold text-gray-900">{dataSubjectRequests.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-sm font-medium text-gray-500">Completed</h4>
          <p className="text-2xl font-semibold text-green-600">
            {dataSubjectRequests.filter((r) => r.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-sm font-medium text-gray-500">Pending</h4>
          <p className="text-2xl font-semibold text-yellow-600">
            {
              dataSubjectRequests.filter((r) => r.status !== 'completed' && r.status !== 'rejected')
                .length
            }
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-sm font-medium text-gray-500">Overdue</h4>
          <p className="text-2xl font-semibold text-red-600">{overdueRequests.length}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Data Subject Requests</h3>
          <button
            onClick={() => setShowNewRequestModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            New Request
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dataSubjectRequests.slice(0, 10).map((request) => {
                const subject = dataSubjects.find((s) => s.id === request.dataSubjectId);
                const isOverdue =
                  (request.extendedDueDate || request.dueDate) < new Date() &&
                  request.status !== 'completed' &&
                  request.status !== 'rejected';
                return (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {subject ? `${subject.firstName} ${subject.lastName}` : 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {request.requestType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          request.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : isOverdue
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {isOverdue ? 'Overdue' : request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.submittedAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(request.extendedDueDate || request.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Compliance Reports</h3>
          <button
            onClick={handleGenerateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Generated Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complianceReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{report.title}</div>
                    <div className="text-sm text-gray-500">{report.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {report.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.period.startDate.toLocaleDateString()} -{' '}
                    {report.period.endDate.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        report.status === 'submitted'
                          ? 'bg-green-100 text-green-800'
                          : report.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.generatedAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button className="text-green-600 hover:text-green-900">Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GDPR Compliance Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive GDPR compliance management and data protection oversight
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: '📊' },
                { key: 'subjects', label: 'Data Subjects', icon: '👥' },
                { key: 'consents', label: 'Consents', icon: '✅' },
                { key: 'requests', label: 'Requests', icon: '📋' },
                { key: 'reports', label: 'Reports', icon: '📄' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() =>
                    setActiveTab(
                      tab.key as 'overview' | 'subjects' | 'consents' | 'requests' | 'reports'
                    )
                  }
                  className={`${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'subjects' && renderDataSubjects()}
          {activeTab === 'consents' && renderConsents()}
          {activeTab === 'requests' && renderRequests()}
          {activeTab === 'reports' && renderReports()}
        </div>
      </div>

      {/* Modals */}
      {showNewSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Data Subject</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newSubjectForm.email}
                  onChange={(e) => setNewSubjectForm({ ...newSubjectForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newSubjectForm.firstName}
                    onChange={(e) =>
                      setNewSubjectForm({ ...newSubjectForm, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newSubjectForm.lastName}
                    onChange={(e) =>
                      setNewSubjectForm({ ...newSubjectForm, lastName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newSubjectForm.phoneNumber}
                  onChange={(e) =>
                    setNewSubjectForm({ ...newSubjectForm, phoneNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateSubject}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewSubjectModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewConsentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Record New Consent</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Subject</label>
                <select
                  value={newConsentForm.dataSubjectId}
                  onChange={(e) =>
                    setNewConsentForm({ ...newConsentForm, dataSubjectId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select data subject...</option>
                  {dataSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.firstName} {subject.lastName} ({subject.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consent Type</label>
                <select
                  value={newConsentForm.consentType}
                  onChange={(e) =>
                    setNewConsentForm({
                      ...newConsentForm,
                      consentType: e.target.value as ConsentRecord['consentType'],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(CONSENT_TYPES).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <textarea
                  value={newConsentForm.purpose}
                  onChange={(e) =>
                    setNewConsentForm({ ...newConsentForm, purpose: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleRecordConsent}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Record
              </button>
              <button
                onClick={() => setShowNewConsentModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create Data Subject Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Subject</label>
                <select
                  value={newRequestForm.dataSubjectId}
                  onChange={(e) =>
                    setNewRequestForm({ ...newRequestForm, dataSubjectId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select data subject...</option>
                  {dataSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.firstName} {subject.lastName} ({subject.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
                <select
                  value={newRequestForm.requestType}
                  onChange={(e) =>
                    setNewRequestForm({
                      ...newRequestForm,
                      requestType: e.target.value as DataSubjectRequest['requestType'],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(DATA_SUBJECT_RIGHTS).map((right) => (
                    <option key={right} value={right}>
                      {right}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newRequestForm.description}
                  onChange={(e) =>
                    setNewRequestForm({ ...newRequestForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateRequest}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Data Subject Details</h3>
              <button
                onClick={() => setSelectedSubject(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-sm text-gray-900">
                    {selectedSubject.firstName} {selectedSubject.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{selectedSubject.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{selectedSubject.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-sm text-gray-900">
                    {selectedSubject.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">
                    {selectedSubject.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Consents</p>
                  <p className="text-sm text-gray-900">
                    {selectedSubject.consentHistory.length} total
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Legal Basis for Processing</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSubject.legalBasisForProcessing.map((basis, index) => (
                    <span
                      key={index}
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                    >
                      {basis}
                    </span>
                  ))}
                </div>
              </div>

              {selectedSubject.address && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-sm text-gray-900">
                    {selectedSubject.address.street}, {selectedSubject.address.city},{' '}
                    {selectedSubject.address.postalCode}, {selectedSubject.address.country}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GDPRComplianceDashboard;
