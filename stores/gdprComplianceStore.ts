import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// GDPR Data Subject Types
export interface DataSubject {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  nationality?: string;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  dataRetentionExpiry?: Date;
  legalBasisForProcessing: string[];
  consentHistory: ConsentRecord[];
  dataProcessingActivities: string[];
  thirdPartySharing: ThirdPartySharing[];
}

export interface ConsentRecord {
  id: string;
  dataSubjectId: string;
  consentType:
    | 'marketing'
    | 'analytics'
    | 'functional'
    | 'performance'
    | 'advertising'
    | 'profiling';
  purpose: string;
  isGranted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  consentMethod: 'explicit' | 'implicit' | 'opt_in' | 'opt_out' | 'pre_ticked' | 'clear_action';
  ipAddress?: string;
  userAgent?: string;
  version: string; // Consent version for tracking changes
  legalBasis:
    | 'consent'
    | 'contract'
    | 'legal_obligation'
    | 'vital_interests'
    | 'public_task'
    | 'legitimate_interests';
  withdrawalMechanism?: string;
  evidence: ConsentEvidence[];
  renewalRequired?: Date;
  parentalConsent?: boolean;
  dataRetention: {
    period: number; // in days
    justification: string;
  };
}

export interface ConsentEvidence {
  id: string;
  type: 'screenshot' | 'form_data' | 'email' | 'signature' | 'recording' | 'log';
  description: string;
  timestamp: Date;
  data: unknown;
  hash: string; // For integrity verification
  isEncrypted: boolean;
}

export interface ThirdPartySharing {
  id: string;
  dataSubjectId: string;
  thirdPartyName: string;
  thirdPartyContact: string;
  purposeOfSharing: string;
  dataCategories: string[];
  legalBasis: string;
  safeguards: string[];
  retentionPeriod: number; // in days
  isActive: boolean;
  consentRequired: boolean;
  consentGranted?: boolean;
  transferMechanism:
    | 'adequacy_decision'
    | 'standard_contractual_clauses'
    | 'bcr'
    | 'certification'
    | 'codes_of_conduct';
  createdAt: Date;
  updatedAt: Date;
}

export interface DataProcessingActivity {
  id: string;
  name: string;
  description: string;
  controller: {
    name: string;
    contact: string;
    dpoContact?: string;
  };
  processor?: {
    name: string;
    contact: string;
  };
  categories: DataCategory[];
  legalBasis: string[];
  specialCategories: boolean;
  purposes: string[];
  dataSubjects: string[];
  recipients: string[];
  internationalTransfer: {
    countries: string[];
    safeguards: string[];
  };
  retentionPeriod: {
    period: number; // in days
    criteria: string;
  };
  securityMeasures: string[];
  riskAssessment: RiskAssessment;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface DataCategory {
  name: string;
  description: string;
  isSpecialCategory: boolean;
  sources: string[];
  examples: string[];
}

export interface RiskAssessment {
  id: string;
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  riskFactors: string[];
  likelihood: number; // 1-5 scale
  impact: number; // 1-5 scale
  mitigation: string[];
  residualRisk: 'low' | 'medium' | 'high' | 'very_high';
  dpiRequired: boolean; // Data Protection Impact Assessment
  reviewDate: Date;
}

export interface DataSubjectRequest {
  id: string;
  dataSubjectId: string;
  requestType:
    | 'access'
    | 'rectification'
    | 'erasure'
    | 'restriction'
    | 'portability'
    | 'objection'
    | 'automated_decision';
  description: string;
  submittedAt: Date;
  identityVerified: boolean;
  verificationMethod?: string;
  status:
    | 'submitted'
    | 'under_review'
    | 'identity_verification'
    | 'processing'
    | 'completed'
    | 'rejected'
    | 'extended';
  assignedTo?: string;
  dueDate: Date;
  extensionReason?: string;
  extendedDueDate?: Date;
  responseMethod: 'email' | 'postal' | 'secure_portal' | 'phone';
  response?: {
    content: string;
    attachments: string[];
    sentAt: Date;
    method: string;
  };
  timeline: RequestTimelineEntry[];
  legalGrounds?: string;
  exemptions?: string[];
  thirdPartyNotifications: ThirdPartyNotification[];
  dataExported?: DataExport;
  deletionLog?: DeletionLog;
}

export interface RequestTimelineEntry {
  id: string;
  timestamp: Date;
  action: string;
  description: string;
  performedBy: string;
  metadata?: Record<string, unknown>;
}

export interface ThirdPartyNotification {
  id: string;
  requestId: string;
  thirdPartyName: string;
  notificationType: 'rectification' | 'erasure' | 'restriction';
  sentAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  response?: string;
}

export interface DataExport {
  id: string;
  requestId: string;
  dataSubjectId: string;
  format: 'json' | 'xml' | 'csv' | 'pdf';
  structure: 'structured' | 'commonly_used' | 'machine_readable';
  categories: string[];
  generatedAt: Date;
  expiresAt: Date;
  downloadUrl?: string;
  fileSize: number;
  checksum: string;
  isEncrypted: boolean;
  encryptionKey?: string;
}

export interface DeletionLog {
  id: string;
  requestId: string;
  dataSubjectId: string;
  deletionType: 'complete' | 'partial' | 'anonymization' | 'pseudonymization';
  deletedCategories: string[];
  retainedCategories: string[];
  retentionReason?: string;
  executedAt: Date;
  executedBy: string;
  verificationHash: string;
  backupRetention: {
    locations: string[];
    retentionPeriod: number;
    destructionDate: Date;
  };
  thirdPartyDeletions: {
    party: string;
    confirmed: boolean;
    confirmedAt?: Date;
  }[];
}

export interface PrivacyNotice {
  id: string;
  title: string;
  version: string;
  effectiveDate: Date;
  language: string;
  content: {
    dataController: string;
    purposes: string[];
    legalBasis: string[];
    dataCategories: string[];
    recipients: string[];
    retentionPeriod: string;
    rights: string[];
    complaints: string;
    dpoContact?: string;
    internationalTransfers?: string;
  };
  applicableRegions: string[];
  targetAudience: string[];
  isActive: boolean;
  previousVersions: string[];
  acknowledgments: NoticeAcknowledgment[];
}

export interface NoticeAcknowledgment {
  id: string;
  noticeId: string;
  dataSubjectId: string;
  acknowledgedAt: Date;
  method: 'click_through' | 'electronic_signature' | 'email_confirmation' | 'implied_consent';
  ipAddress?: string;
  userAgent?: string;
  evidence: unknown[];
}

export interface ComplianceReport {
  id: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'incident' | 'audit';
  title: string;
  description: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  generatedAt: Date;
  generatedBy: string;
  status: 'draft' | 'review' | 'approved' | 'submitted';
  sections: ReportSection[];
  metrics: ComplianceMetrics;
  recommendations: string[];
  actionItems: ActionItem[];
  regulatorySubmission?: {
    authority: string;
    submittedAt: Date;
    confirmationNumber: string;
  };
}

export interface ReportSection {
  title: string;
  content: string;
  data: unknown;
  charts?: unknown[];
}

export interface ComplianceMetrics {
  totalDataSubjects: number;
  activeConsents: number;
  revokedConsents: number;
  dataRequests: {
    total: number;
    byType: Record<string, number>;
    completedOnTime: number;
    overdue: number;
  };
  dataBreaches: {
    total: number;
    reportedToAuthority: number;
    notifiedToSubjects: number;
  };
  thirdPartySharing: {
    activeParties: number;
    dataTransfers: number;
  };
  retentionCompliance: {
    compliantRecords: number;
    overRetentionRecords: number;
    scheduledDeletions: number;
  };
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  dueDate: Date;
  status: 'open' | 'in_progress' | 'completed' | 'overdue';
  createdAt: Date;
  completedAt?: Date;
}

export interface GDPRComplianceStore {
  // State
  dataSubjects: DataSubject[];
  consentRecords: ConsentRecord[];
  dataProcessingActivities: DataProcessingActivity[];
  dataSubjectRequests: DataSubjectRequest[];
  privacyNotices: PrivacyNotice[];
  complianceReports: ComplianceReport[];

  // Settings
  defaultRetentionPeriod: number; // in days
  consentRenewalPeriod: number; // in days
  requestResponseTime: number; // in days (usually 30)
  dpoContact: {
    name: string;
    email: string;
    phone?: string;
  };
  supervisoryAuthority: {
    name: string;
    contact: string;
    website: string;
  };

  // Data Subject Management
  createDataSubject: (
    subject: Omit<DataSubject, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<DataSubject>;
  updateDataSubject: (id: string, updates: Partial<DataSubject>) => Promise<void>;
  deleteDataSubject: (id: string) => Promise<void>;
  getDataSubject: (id: string) => DataSubject | undefined;
  searchDataSubjects: (query: string) => Promise<DataSubject[]>;

  // Consent Management
  recordConsent: (consent: Omit<ConsentRecord, 'id'>) => Promise<ConsentRecord>;
  revokeConsent: (consentId: string, reason?: string) => Promise<void>;
  renewConsent: (consentId: string) => Promise<ConsentRecord>;
  getConsentHistory: (dataSubjectId: string) => Promise<ConsentRecord[]>;
  validateConsent: (dataSubjectId: string, consentType: string) => Promise<boolean>;
  getExpiringConsents: (days: number) => Promise<ConsentRecord[]>;

  // Data Processing Activities
  createProcessingActivity: (
    activity: Omit<DataProcessingActivity, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<DataProcessingActivity>;
  updateProcessingActivity: (id: string, updates: Partial<DataProcessingActivity>) => Promise<void>;
  deleteProcessingActivity: (id: string) => Promise<void>;
  getProcessingActivities: () => DataProcessingActivity[];

  // Data Subject Requests
  createDataSubjectRequest: (
    request: Omit<DataSubjectRequest, 'id' | 'submittedAt' | 'timeline' | 'dueDate'>
  ) => Promise<DataSubjectRequest>;
  updateRequestStatus: (
    id: string,
    status: DataSubjectRequest['status'],
    notes?: string
  ) => Promise<void>;
  extendRequestDeadline: (id: string, reason: string, newDate: Date) => Promise<void>;
  completeRequest: (id: string, response: DataSubjectRequest['response']) => Promise<void>;
  getOverdueRequests: () => Promise<DataSubjectRequest[]>;

  // Right to Access (Article 15)
  generateDataExport: (
    dataSubjectId: string,
    format: 'json' | 'xml' | 'csv',
    categories?: string[]
  ) => Promise<DataExport>;

  // Right to Erasure (Article 17)
  executeDataDeletion: (
    dataSubjectId: string,
    deletionType: DeletionLog['deletionType'],
    categories?: string[]
  ) => Promise<DeletionLog>;
  anonymizeData: (dataSubjectId: string, categories?: string[]) => Promise<void>;

  // Right to Data Portability (Article 20)
  exportPortableData: (
    dataSubjectId: string,
    format: 'json' | 'xml' | 'csv'
  ) => Promise<DataExport>;

  // Privacy Notices
  createPrivacyNotice: (notice: Omit<PrivacyNotice, 'id'>) => Promise<PrivacyNotice>;
  updatePrivacyNotice: (id: string, updates: Partial<PrivacyNotice>) => Promise<void>;
  publishPrivacyNotice: (id: string) => Promise<void>;
  recordNoticeAcknowledgment: (acknowledgment: Omit<NoticeAcknowledgment, 'id'>) => Promise<void>;

  // Compliance Reporting
  generateComplianceReport: (
    type: ComplianceReport['type'],
    period: { startDate: Date; endDate: Date }
  ) => Promise<ComplianceReport>;
  submitReport: (reportId: string, authority: string) => Promise<void>;

  // Data Retention
  identifyExpiredData: () => Promise<
    Array<{ dataSubjectId: string; categories: string[]; expiredSince: Date }>
  >;
  scheduleDataDeletion: (
    dataSubjectId: string,
    categories: string[],
    deletionDate: Date
  ) => Promise<void>;
  executeScheduledDeletions: () => Promise<{ deleted: number; failed: number }>;

  // Third Party Management
  recordThirdPartySharing: (
    sharing: Omit<ThirdPartySharing, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<ThirdPartySharing>;
  notifyThirdPartyOfDeletion: (requestId: string, thirdPartyId: string) => Promise<void>;
  trackThirdPartyCompliance: (
    thirdPartyId: string
  ) => Promise<{ compliant: boolean; issues: string[] }>;

  // Audit and Compliance
  performDataAudit: (scope?: string[]) => Promise<{
    compliantActivities: number;
    nonCompliantActivities: number;
    issues: Array<{ activity: string; issue: string; severity: string }>;
    recommendations: string[];
  }>;
  validateDataProcessing: (activityId: string) => Promise<{ valid: boolean; issues: string[] }>;
  checkConsentCompliance: () => Promise<{ valid: number; invalid: number; expiring: number }>;

  // Incident Management
  recordDataBreach: (incident: {
    description: string;
    affectedSubjects: string[];
    dataCategories: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    cause: string;
    containmentMeasures: string[];
  }) => Promise<void>;

  // Analytics and Metrics
  getComplianceMetrics: (period?: { startDate: Date; endDate: Date }) => Promise<ComplianceMetrics>;
  getConsentMetrics: () => Promise<{
    totalConsents: number;
    activeConsents: number;
    revokedConsents: number;
    consentsByType: Record<string, number>;
    renewalRate: number;
  }>;

  // Utility Functions
  validateDataSubjectIdentity: (email: string, verificationData: unknown) => Promise<boolean>;
  calculateRetentionExpiry: (createdAt: Date, legalBasis: string) => Date;
  generateComplianceScore: () => Promise<{ score: number; breakdown: Record<string, number> }>;
  exportComplianceData: (format: 'json' | 'xml' | 'csv') => Promise<Blob>;
}

// GDPR Legal Basis Constants
export const LEGAL_BASIS = {
  CONSENT: 'consent',
  CONTRACT: 'contract',
  LEGAL_OBLIGATION: 'legal_obligation',
  VITAL_INTERESTS: 'vital_interests',
  PUBLIC_TASK: 'public_task',
  LEGITIMATE_INTERESTS: 'legitimate_interests',
} as const;

// Data Subject Rights
export const DATA_SUBJECT_RIGHTS = {
  ACCESS: 'access',
  RECTIFICATION: 'rectification',
  ERASURE: 'erasure',
  RESTRICTION: 'restriction',
  PORTABILITY: 'portability',
  OBJECTION: 'objection',
  AUTOMATED_DECISION: 'automated_decision',
} as const;

// Consent Types
export const CONSENT_TYPES = {
  MARKETING: 'marketing',
  ANALYTICS: 'analytics',
  FUNCTIONAL: 'functional',
  PERFORMANCE: 'performance',
  ADVERTISING: 'advertising',
  PROFILING: 'profiling',
} as const;

export const useGDPRComplianceStore = create<GDPRComplianceStore>()(
  persist(
    (set, get) => ({
      // Initial State
      dataSubjects: [],
      consentRecords: [],
      dataProcessingActivities: [],
      dataSubjectRequests: [],
      privacyNotices: [],
      complianceReports: [],

      defaultRetentionPeriod: 2555, // 7 years
      consentRenewalPeriod: 365, // 1 year
      requestResponseTime: 30, // 30 days
      dpoContact: {
        name: 'Data Protection Officer',
        email: 'dpo@sipoma.com',
        phone: '+1-555-DPO-GDPR',
      },
      supervisoryAuthority: {
        name: "Information Commissioner's Office",
        contact: 'casework@ico.org.uk',
        website: 'https://ico.org.uk',
      },

      // Create Data Subject
      createDataSubject: async (subjectData) => {
        const subject: DataSubject = {
          ...subjectData,
          id: `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          consentHistory: [],
          dataProcessingActivities: [],
          thirdPartySharing: [],
        };

        set((state) => ({
          dataSubjects: [...state.dataSubjects, subject],
        }));

        return subject;
      },

      // Update Data Subject
      updateDataSubject: async (id, updates) => {
        set((state) => ({
          dataSubjects: state.dataSubjects.map((subject) =>
            subject.id === id ? { ...subject, ...updates, updatedAt: new Date() } : subject
          ),
        }));
      },

      // Delete Data Subject
      deleteDataSubject: async (id) => {
        // This should only be called after proper erasure request processing
        set((state) => ({
          dataSubjects: state.dataSubjects.filter((subject) => subject.id !== id),
        }));
      },

      // Get Data Subject
      getDataSubject: (id) => {
        return get().dataSubjects.find((subject) => subject.id === id);
      },

      // Search Data Subjects
      searchDataSubjects: async (query) => {
        const subjects = get().dataSubjects;
        const lowerQuery = query.toLowerCase();

        return subjects.filter(
          (subject) =>
            subject.email.toLowerCase().includes(lowerQuery) ||
            subject.firstName.toLowerCase().includes(lowerQuery) ||
            subject.lastName.toLowerCase().includes(lowerQuery)
        );
      },

      // Record Consent
      recordConsent: async (consentData) => {
        const consent: ConsentRecord = {
          ...consentData,
          id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          evidence: consentData.evidence || [],
        };

        set((state) => ({
          consentRecords: [...state.consentRecords, consent],
        }));

        // Update data subject with consent
        const subject = get().dataSubjects.find((s) => s.id === consent.dataSubjectId);
        if (subject) {
          await get().updateDataSubject(subject.id, {
            consentHistory: [...subject.consentHistory, consent],
          });
        }

        return consent;
      },

      // Revoke Consent
      revokeConsent: async (consentId, reason) => {
        set((state) => ({
          consentRecords: state.consentRecords.map((consent) =>
            consent.id === consentId
              ? {
                  ...consent,
                  isGranted: false,
                  revokedAt: new Date(),
                  withdrawalMechanism: reason,
                }
              : consent
          ),
        }));
      },

      // Renew Consent
      renewConsent: async (consentId) => {
        const oldConsent = get().consentRecords.find((c) => c.id === consentId);
        if (!oldConsent) throw new Error('Consent not found');

        const newConsent: ConsentRecord = {
          ...oldConsent,
          id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          isGranted: true,
          grantedAt: new Date(),
          revokedAt: undefined,
          version: `${parseFloat(oldConsent.version) + 0.1}`,
          renewalRequired: new Date(Date.now() + get().consentRenewalPeriod * 24 * 60 * 60 * 1000),
        };

        set((state) => ({
          consentRecords: [...state.consentRecords, newConsent],
        }));

        return newConsent;
      },

      // Get Consent History
      getConsentHistory: async (dataSubjectId) => {
        return get().consentRecords.filter((consent) => consent.dataSubjectId === dataSubjectId);
      },

      // Validate Consent
      validateConsent: async (dataSubjectId, consentType) => {
        const consents = get().consentRecords.filter(
          (consent) =>
            consent.dataSubjectId === dataSubjectId &&
            consent.consentType === consentType &&
            consent.isGranted &&
            (!consent.renewalRequired || consent.renewalRequired > new Date())
        );

        return consents.length > 0;
      },

      // Get Expiring Consents
      getExpiringConsents: async (days) => {
        const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        return get().consentRecords.filter(
          (consent) =>
            consent.isGranted && consent.renewalRequired && consent.renewalRequired <= expiryDate
        );
      },

      // Create Processing Activity
      createProcessingActivity: async (activityData) => {
        const activity: DataProcessingActivity = {
          ...activityData,
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          dataProcessingActivities: [...state.dataProcessingActivities, activity],
        }));

        return activity;
      },

      // Update Processing Activity
      updateProcessingActivity: async (id, updates) => {
        set((state) => ({
          dataProcessingActivities: state.dataProcessingActivities.map((activity) =>
            activity.id === id ? { ...activity, ...updates, updatedAt: new Date() } : activity
          ),
        }));
      },

      // Delete Processing Activity
      deleteProcessingActivity: async (id) => {
        set((state) => ({
          dataProcessingActivities: state.dataProcessingActivities.filter(
            (activity) => activity.id !== id
          ),
        }));
      },

      // Get Processing Activities
      getProcessingActivities: () => {
        return get().dataProcessingActivities;
      },

      // Create Data Subject Request
      createDataSubjectRequest: async (requestData) => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + get().requestResponseTime);

        const request: DataSubjectRequest = {
          ...requestData,
          id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          submittedAt: new Date(),
          dueDate,
          timeline: [
            {
              id: `timeline_${Date.now()}`,
              timestamp: new Date(),
              action: 'submitted',
              description: 'Request submitted',
              performedBy: 'system',
            },
          ],
          thirdPartyNotifications: [],
        };

        set((state) => ({
          dataSubjectRequests: [...state.dataSubjectRequests, request],
        }));

        return request;
      },

      // Update Request Status
      updateRequestStatus: async (id, status, notes) => {
        set((state) => ({
          dataSubjectRequests: state.dataSubjectRequests.map((request) =>
            request.id === id
              ? {
                  ...request,
                  status,
                  timeline: [
                    ...request.timeline,
                    {
                      id: `timeline_${Date.now()}`,
                      timestamp: new Date(),
                      action: 'status_change',
                      description: `Status changed to ${status}${notes ? `: ${notes}` : ''}`,
                      performedBy: 'system',
                    },
                  ],
                }
              : request
          ),
        }));
      },

      // Extend Request Deadline
      extendRequestDeadline: async (id, reason, newDate) => {
        set((state) => ({
          dataSubjectRequests: state.dataSubjectRequests.map((request) =>
            request.id === id
              ? {
                  ...request,
                  status: 'extended',
                  extensionReason: reason,
                  extendedDueDate: newDate,
                  timeline: [
                    ...request.timeline,
                    {
                      id: `timeline_${Date.now()}`,
                      timestamp: new Date(),
                      action: 'extended',
                      description: `Deadline extended to ${newDate.toDateString()}: ${reason}`,
                      performedBy: 'system',
                    },
                  ],
                }
              : request
          ),
        }));
      },

      // Complete Request
      completeRequest: async (id, response) => {
        set((state) => ({
          dataSubjectRequests: state.dataSubjectRequests.map((request) =>
            request.id === id
              ? {
                  ...request,
                  status: 'completed',
                  response,
                  timeline: [
                    ...request.timeline,
                    {
                      id: `timeline_${Date.now()}`,
                      timestamp: new Date(),
                      action: 'completed',
                      description: 'Request completed and response sent',
                      performedBy: 'system',
                    },
                  ],
                }
              : request
          ),
        }));
      },

      // Get Overdue Requests
      getOverdueRequests: async () => {
        const now = new Date();
        return get().dataSubjectRequests.filter(
          (request) =>
            request.status !== 'completed' &&
            request.status !== 'rejected' &&
            (request.extendedDueDate || request.dueDate) < now
        );
      },

      // Generate Data Export
      generateDataExport: async (dataSubjectId, format, categories) => {
        const subject = get().dataSubjects.find((s) => s.id === dataSubjectId);
        if (!subject) throw new Error('Data subject not found');

        const exportData = {
          personalData: subject,
          consentHistory: await get().getConsentHistory(dataSubjectId),
          processingActivities: get().dataProcessingActivities.filter((activity) =>
            activity.dataSubjects.includes(dataSubjectId)
          ),
        };

        const content = JSON.stringify(exportData, null, 2);
        const dataExport: DataExport = {
          id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requestId: '',
          dataSubjectId,
          format,
          structure: 'structured',
          categories: categories || ['all'],
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          fileSize: content.length,
          checksum: `sha256_${Math.random().toString(36)}`,
          isEncrypted: false,
        };

        return dataExport;
      },

      // Execute Data Deletion
      executeDataDeletion: async (dataSubjectId, deletionType, categories) => {
        const subject = get().dataSubjects.find((s) => s.id === dataSubjectId);
        if (!subject) throw new Error('Data subject not found');

        const deletionLog: DeletionLog = {
          id: `deletion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requestId: '',
          dataSubjectId,
          deletionType,
          deletedCategories: categories || ['all'],
          retainedCategories: [],
          executedAt: new Date(),
          executedBy: 'system',
          verificationHash: `hash_${Math.random().toString(36)}`,
          backupRetention: {
            locations: ['primary_backup', 'secondary_backup'],
            retentionPeriod: 90, // 90 days for backup retention
            destructionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
          thirdPartyDeletions: [],
        };

        if (deletionType === 'complete') {
          await get().deleteDataSubject(dataSubjectId);
        }

        return deletionLog;
      },

      // Anonymize Data
      anonymizeData: async (dataSubjectId, _categories) => {
        const subject = get().dataSubjects.find((s) => s.id === dataSubjectId);
        if (!subject) throw new Error('Data subject not found');

        // Anonymize by replacing identifiable data with hashed values
        const anonymizedSubject = {
          ...subject,
          email: `anonymized_${Math.random().toString(36).substr(2, 9)}@anonymized.local`,
          firstName: 'Anonymized',
          lastName: 'User',
          phoneNumber: undefined,
          address: undefined,
        };

        await get().updateDataSubject(dataSubjectId, anonymizedSubject);
      },

      // Export Portable Data
      exportPortableData: async (dataSubjectId, format) => {
        // Similar to generateDataExport but focused on portable format
        return get().generateDataExport(dataSubjectId, format);
      },

      // Create Privacy Notice
      createPrivacyNotice: async (noticeData) => {
        const notice: PrivacyNotice = {
          ...noticeData,
          id: `notice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          acknowledgments: [],
        };

        set((state) => ({
          privacyNotices: [...state.privacyNotices, notice],
        }));

        return notice;
      },

      // Update Privacy Notice
      updatePrivacyNotice: async (id, updates) => {
        set((state) => ({
          privacyNotices: state.privacyNotices.map((notice) =>
            notice.id === id ? { ...notice, ...updates } : notice
          ),
        }));
      },

      // Publish Privacy Notice
      publishPrivacyNotice: async (id) => {
        await get().updatePrivacyNotice(id, { isActive: true });
      },

      // Record Notice Acknowledgment
      recordNoticeAcknowledgment: async (acknowledgmentData) => {
        const acknowledgment: NoticeAcknowledgment = {
          ...acknowledgmentData,
          id: `ack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        set((state) => ({
          privacyNotices: state.privacyNotices.map((notice) =>
            notice.id === acknowledgment.noticeId
              ? { ...notice, acknowledgments: [...notice.acknowledgments, acknowledgment] }
              : notice
          ),
        }));
      },

      // Generate Compliance Report
      generateComplianceReport: async (type, period) => {
        const metrics = await get().getComplianceMetrics(period);

        const report: ComplianceReport = {
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type,
          title: `GDPR Compliance Report - ${type.charAt(0).toUpperCase() + type.slice(1)}`,
          description: `Comprehensive GDPR compliance report for the period ${period.startDate.toDateString()} to ${period.endDate.toDateString()}`,
          period,
          generatedAt: new Date(),
          generatedBy: 'system',
          status: 'draft',
          sections: [
            {
              title: 'Executive Summary',
              content: 'Overview of GDPR compliance status',
              data: metrics,
            },
            {
              title: 'Consent Management',
              content: 'Analysis of consent records and compliance',
              data: {
                activeConsents: metrics.activeConsents,
                revokedConsents: metrics.revokedConsents,
              },
            },
            {
              title: 'Data Subject Requests',
              content: 'Summary of data subject rights requests',
              data: metrics.dataRequests,
            },
          ],
          metrics,
          recommendations: [
            'Review and update privacy notices',
            'Conduct data retention review',
            'Update consent mechanisms',
          ],
          actionItems: [],
        };

        set((state) => ({
          complianceReports: [...state.complianceReports, report],
        }));

        return report;
      },

      // Submit Report
      submitReport: async (reportId, authority) => {
        set((state) => ({
          complianceReports: state.complianceReports.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  status: 'submitted',
                  regulatorySubmission: {
                    authority,
                    submittedAt: new Date(),
                    confirmationNumber: `CONF_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                  },
                }
              : report
          ),
        }));
      },

      // Identify Expired Data
      identifyExpiredData: async () => {
        const now = new Date();
        const expiredData: Array<{
          dataSubjectId: string;
          categories: string[];
          expiredSince: Date;
        }> = [];

        get().dataSubjects.forEach((subject) => {
          if (subject.dataRetentionExpiry && subject.dataRetentionExpiry < now) {
            expiredData.push({
              dataSubjectId: subject.id,
              categories: ['all'],
              expiredSince: subject.dataRetentionExpiry,
            });
          }
        });

        return expiredData;
      },

      // Schedule Data Deletion
      scheduleDataDeletion: async (dataSubjectId, categories, deletionDate) => {
        // In production, this would integrate with a job scheduler
        void dataSubjectId;
        void categories;
        void deletionDate;
      },

      // Execute Scheduled Deletions
      executeScheduledDeletions: async () => {
        const expiredData = await get().identifyExpiredData();
        let deleted = 0;
        let failed = 0;

        for (const data of expiredData) {
          try {
            await get().executeDataDeletion(data.dataSubjectId, 'complete');
            deleted++;
          } catch {
            failed++;
          }
        }

        return { deleted, failed };
      },

      // Record Third Party Sharing
      recordThirdPartySharing: async (sharingData) => {
        const sharing: ThirdPartySharing = {
          ...sharingData,
          id: `sharing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Update data subject record
        const subject = get().dataSubjects.find((s) => s.id === sharing.dataSubjectId);
        if (subject) {
          await get().updateDataSubject(subject.id, {
            thirdPartySharing: [...subject.thirdPartySharing, sharing],
          });
        }

        return sharing;
      },

      // Notify Third Party of Deletion
      notifyThirdPartyOfDeletion: async (requestId, thirdPartyId) => {
        // In production, would send actual notifications
        void requestId;
        void thirdPartyId;
      },

      // Track Third Party Compliance
      trackThirdPartyCompliance: async (thirdPartyId) => {
        // Mock implementation
        void thirdPartyId;
        return { compliant: true, issues: [] };
      },

      // Perform Data Audit
      performDataAudit: async (scope) => {
        const activities = get().dataProcessingActivities;
        const filteredActivities = scope
          ? activities.filter((a) => scope.includes(a.name))
          : activities;

        let compliantActivities = 0;
        let nonCompliantActivities = 0;
        const issues: Array<{ activity: string; issue: string; severity: string }> = [];

        filteredActivities.forEach((activity) => {
          let isCompliant = true;

          // Check if activity has legal basis
          if (!activity.legalBasis || activity.legalBasis.length === 0) {
            issues.push({
              activity: activity.name,
              issue: 'No legal basis specified',
              severity: 'high',
            });
            isCompliant = false;
          }

          // Check retention period
          if (!activity.retentionPeriod || activity.retentionPeriod.period <= 0) {
            issues.push({
              activity: activity.name,
              issue: 'No retention period specified',
              severity: 'medium',
            });
            isCompliant = false;
          }

          if (isCompliant) {
            compliantActivities++;
          } else {
            nonCompliantActivities++;
          }
        });

        return {
          compliantActivities,
          nonCompliantActivities,
          issues,
          recommendations: [
            'Review all processing activities for legal basis',
            'Implement data retention schedules',
            'Update privacy notices',
          ],
        };
      },

      // Validate Data Processing
      validateDataProcessing: async (activityId) => {
        const activity = get().dataProcessingActivities.find((a) => a.id === activityId);
        if (!activity) {
          return { valid: false, issues: ['Activity not found'] };
        }

        const issues: string[] = [];

        if (!activity.legalBasis || activity.legalBasis.length === 0) {
          issues.push('No legal basis specified');
        }

        if (!activity.purposes || activity.purposes.length === 0) {
          issues.push('No processing purposes specified');
        }

        if (!activity.retentionPeriod || activity.retentionPeriod.period <= 0) {
          issues.push('No retention period specified');
        }

        return { valid: issues.length === 0, issues };
      },

      // Check Consent Compliance
      checkConsentCompliance: async () => {
        const consents = get().consentRecords;
        const now = new Date();

        let valid = 0;
        let invalid = 0;
        let expiring = 0;

        consents.forEach((consent) => {
          if (!consent.isGranted) {
            invalid++;
          } else if (consent.renewalRequired && consent.renewalRequired <= now) {
            invalid++;
          } else if (
            consent.renewalRequired &&
            consent.renewalRequired <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          ) {
            expiring++;
            valid++;
          } else {
            valid++;
          }
        });

        return { valid, invalid, expiring };
      },

      // Record Data Breach
      recordDataBreach: async (incident) => {
        // In production, would create proper incident record and trigger notifications
        void incident;
      },

      // Get Compliance Metrics
      getComplianceMetrics: async (period) => {
        const subjects = get().dataSubjects;
        const consents = get().consentRecords;
        const requests = get().dataSubjectRequests;

        // Filter by period if provided
        const filteredSubjects = period
          ? subjects.filter((s) => s.createdAt >= period.startDate && s.createdAt <= period.endDate)
          : subjects;

        const filteredRequests = period
          ? requests.filter(
              (r) => r.submittedAt >= period.startDate && r.submittedAt <= period.endDate
            )
          : requests;

        const activeConsents = consents.filter((c) => c.isGranted).length;
        const revokedConsents = consents.filter((c) => !c.isGranted).length;

        const requestsByType = filteredRequests.reduce(
          (acc, req) => {
            acc[req.requestType] = (acc[req.requestType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        const completedOnTime = filteredRequests.filter(
          (req) =>
            req.status === 'completed' &&
            req.response &&
            req.response.sentAt <= (req.extendedDueDate || req.dueDate)
        ).length;

        const overdue = filteredRequests.filter(
          (req) => req.status !== 'completed' && (req.extendedDueDate || req.dueDate) < new Date()
        ).length;

        return {
          totalDataSubjects: filteredSubjects.length,
          activeConsents,
          revokedConsents,
          dataRequests: {
            total: filteredRequests.length,
            byType: requestsByType,
            completedOnTime,
            overdue,
          },
          dataBreaches: {
            total: 0, // Would be calculated from breach records
            reportedToAuthority: 0,
            notifiedToSubjects: 0,
          },
          thirdPartySharing: {
            activeParties: new Set(
              subjects.flatMap((s) => s.thirdPartySharing.map((t) => t.thirdPartyName))
            ).size,
            dataTransfers: subjects.reduce((sum, s) => sum + s.thirdPartySharing.length, 0),
          },
          retentionCompliance: {
            compliantRecords: subjects.filter(
              (s) => !s.dataRetentionExpiry || s.dataRetentionExpiry > new Date()
            ).length,
            overRetentionRecords: subjects.filter(
              (s) => s.dataRetentionExpiry && s.dataRetentionExpiry < new Date()
            ).length,
            scheduledDeletions: 0, // Would be calculated from deletion schedule
          },
        };
      },

      // Get Consent Metrics
      getConsentMetrics: async () => {
        const consents = get().consentRecords;
        const totalConsents = consents.length;
        const activeConsents = consents.filter((c) => c.isGranted).length;
        const revokedConsents = consents.filter((c) => !c.isGranted).length;

        const consentsByType = consents.reduce(
          (acc, consent) => {
            acc[consent.consentType] = (acc[consent.consentType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // Calculate renewal rate (simplified)
        const renewedConsents = consents.filter((c) => parseFloat(c.version) > 1.0).length;
        const renewalRate = totalConsents > 0 ? (renewedConsents / totalConsents) * 100 : 0;

        return {
          totalConsents,
          activeConsents,
          revokedConsents,
          consentsByType,
          renewalRate,
        };
      },

      // Validate Data Subject Identity
      validateDataSubjectIdentity: async (email, verificationData) => {
        // Mock implementation - in production would use proper identity verification
        void email;
        void verificationData;
        return true;
      },

      // Calculate Retention Expiry
      calculateRetentionExpiry: (createdAt, legalBasis) => {
        const retentionPeriods: Record<string, number> = {
          [LEGAL_BASIS.CONSENT]: 2555, // 7 years
          [LEGAL_BASIS.CONTRACT]: 2190, // 6 years
          [LEGAL_BASIS.LEGAL_OBLIGATION]: 2555, // 7 years
          [LEGAL_BASIS.VITAL_INTERESTS]: 1825, // 5 years
          [LEGAL_BASIS.PUBLIC_TASK]: 2555, // 7 years
          [LEGAL_BASIS.LEGITIMATE_INTERESTS]: 2190, // 6 years
        };

        const days = retentionPeriods[legalBasis] || get().defaultRetentionPeriod;
        const expiryDate = new Date(createdAt);
        expiryDate.setDate(expiryDate.getDate() + days);
        return expiryDate;
      },

      // Generate Compliance Score
      generateComplianceScore: async () => {
        const audit = await get().performDataAudit();
        const consentCompliance = await get().checkConsentCompliance();
        const overdueRequests = await get().getOverdueRequests();

        const totalActivities = audit.compliantActivities + audit.nonCompliantActivities;
        const activityScore =
          totalActivities > 0 ? (audit.compliantActivities / totalActivities) * 100 : 100;

        const totalConsents = consentCompliance.valid + consentCompliance.invalid;
        const consentScore =
          totalConsents > 0 ? (consentCompliance.valid / totalConsents) * 100 : 100;

        const requestScore =
          overdueRequests.length === 0 ? 100 : Math.max(0, 100 - overdueRequests.length * 10);

        const overallScore = activityScore * 0.4 + consentScore * 0.4 + requestScore * 0.2;

        return {
          score: Math.round(overallScore),
          breakdown: {
            dataProcessing: Math.round(activityScore),
            consentManagement: Math.round(consentScore),
            requestHandling: Math.round(requestScore),
          },
        };
      },

      // Export Compliance Data
      exportComplianceData: async (format) => {
        const data = {
          dataSubjects: get().dataSubjects,
          consentRecords: get().consentRecords,
          dataProcessingActivities: get().dataProcessingActivities,
          dataSubjectRequests: get().dataSubjectRequests,
          privacyNotices: get().privacyNotices,
          complianceReports: get().complianceReports,
        };

        let content: string;
        let mimeType: string;

        switch (format) {
          case 'json':
            content = JSON.stringify(data, null, 2);
            mimeType = 'application/json';
            break;
          case 'csv':
            // Simplified CSV export
            content = JSON.stringify(data);
            mimeType = 'text/csv';
            break;
          case 'xml':
            // Simplified XML export
            content = `<?xml version="1.0" encoding="UTF-8"?>\n<gdprData>${JSON.stringify(data)}</gdprData>`;
            mimeType = 'application/xml';
            break;
          default:
            throw new Error(`Format ${format} not supported`);
        }

        return new Blob([content], { type: mimeType });
      },
    }),
    {
      name: 'sipoma-gdpr-compliance-store',
      partialize: (state) => ({
        dataSubjects: state.dataSubjects,
        consentRecords: state.consentRecords,
        dataProcessingActivities: state.dataProcessingActivities,
        dataSubjectRequests: state.dataSubjectRequests,
        privacyNotices: state.privacyNotices,
        complianceReports: state.complianceReports,
        defaultRetentionPeriod: state.defaultRetentionPeriod,
        consentRenewalPeriod: state.consentRenewalPeriod,
        requestResponseTime: state.requestResponseTime,
        dpoContact: state.dpoContact,
        supervisoryAuthority: state.supervisoryAuthority,
      }),
    }
  )
);


