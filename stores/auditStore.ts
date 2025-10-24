import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Audit Log Types
export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  outcome: 'success' | 'failure' | 'partial';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  tags: string[];
  correlationId?: string;
  metadata: Record<string, unknown>;
}

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  resource?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  outcome?: 'success' | 'failure' | 'partial';
  tags?: string[];
  searchText?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity' | 'action';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditReport {
  id: string;
  name: string;
  description: string;
  query: AuditQuery;
  format: 'json' | 'csv' | 'pdf' | 'excel';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    timezone: string;
    recipients: string[];
  };
  isActive: boolean;
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
}

export interface AuditDashboard {
  id: string;
  name: string;
  description: string;
  widgets: AuditWidget[];
  layout: { x: number; y: number; w: number; h: number; i: string }[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'map' | 'timeline' | 'heatmap';
  title: string;
  query: AuditQuery;
  configuration: Record<string, unknown>;
  refreshInterval?: number; // in seconds
}

export interface AuditRule {
  id: string;
  name: string;
  description: string;
  condition: AuditCondition;
  actions: AuditAction[];
  isActive: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  triggeredCount: number;
  lastTriggered?: Date;
}

export interface AuditCondition {
  type: 'threshold' | 'pattern' | 'anomaly' | 'composite';
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'regex' | 'in' | 'not_in';
  value: unknown;
  timeWindow?: {
    duration: number; // in minutes
    aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max';
  };
  children?: AuditCondition[]; // for composite conditions
  logicOperator?: 'and' | 'or'; // for composite conditions
}

export interface AuditAction {
  type: 'email' | 'webhook' | 'notification' | 'escalation' | 'automation';
  configuration: Record<string, unknown>;
  isActive: boolean;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  requirements: ComplianceRequirement[];
  isActive: boolean;
  version: string;
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  category: string;
  mandatoryFields: string[];
  retentionPeriod: number; // in days
  auditRules: string[]; // rule IDs
  reportTemplates: string[]; // report IDs
}

export interface AuditArchive {
  id: string;
  name: string;
  description: string;
  query: AuditQuery;
  archiveDate: Date;
  totalEvents: number;
  compressedSize: number;
  originalSize: number;
  location: string; // storage location
  checksum: string;
  isEncrypted: boolean;
  encryptionKeyId?: string;
}

export interface AuditMetrics {
  totalEvents: number;
  eventsToday: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  averageEventsPerDay: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
  topResources: Array<{ resource: string; count: number }>;
  severityDistribution: Record<string, number>;
  outcomeDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  storageUsage: {
    totalSize: number;
    archivedSize: number;
    activeSize: number;
  };
  performanceMetrics: {
    averageIngestionTime: number;
    averageQueryTime: number;
    indexingEfficiency: number;
  };
}

export interface AuditStore {
  // State
  auditEvents: AuditEvent[];
  auditReports: AuditReport[];
  auditDashboards: AuditDashboard[];
  auditRules: AuditRule[];
  complianceFrameworks: ComplianceFramework[];
  auditArchives: AuditArchive[];

  // Settings
  retentionPolicy: {
    defaultRetentionDays: number;
    archiveAfterDays: number;
    deleteAfterDays: number;
    compressArchives: boolean;
    encryptArchives: boolean;
  };

  // Event Management
  logEvent: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => Promise<AuditEvent>;
  logBulkEvents: (events: Omit<AuditEvent, 'id' | 'timestamp'>[]) => Promise<AuditEvent[]>;
  getEvents: (query?: AuditQuery) => Promise<AuditEvent[]>;
  getEvent: (id: string) => AuditEvent | undefined;
  deleteEvent: (id: string) => Promise<void>;

  // Search & Filtering
  searchEvents: (query: AuditQuery) => Promise<{ events: AuditEvent[]; total: number }>;
  getEventsByUser: (userId: string, limit?: number) => Promise<AuditEvent[]>;
  getEventsByResource: (
    resource: string,
    resourceId?: string,
    limit?: number
  ) => Promise<AuditEvent[]>;
  getEventsByTimeRange: (startDate: Date, endDate: Date) => Promise<AuditEvent[]>;

  // Reports
  createReport: (report: Omit<AuditReport, 'id' | 'createdAt'>) => Promise<AuditReport>;
  updateReport: (id: string, updates: Partial<AuditReport>) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  generateReport: (reportId: string) => Promise<GeneratedReport>;
  exportReport: (reportId: string, format: 'json' | 'csv' | 'pdf' | 'excel') => Promise<Blob>;
  scheduleReport: (reportId: string) => Promise<void>;

  // Dashboards
  createDashboard: (
    dashboard: Omit<AuditDashboard, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<AuditDashboard>;
  updateDashboard: (id: string, updates: Partial<AuditDashboard>) => Promise<void>;
  deleteDashboard: (id: string) => Promise<void>;
  getDashboard: (id: string) => AuditDashboard | undefined;

  // Rules & Alerting
  createRule: (
    rule: Omit<AuditRule, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount'>
  ) => Promise<AuditRule>;
  updateRule: (id: string, updates: Partial<AuditRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  evaluateRules: (event: AuditEvent) => Promise<AuditRule[]>;
  triggerRule: (ruleId: string, event: AuditEvent) => Promise<void>;

  // Compliance
  createComplianceFramework: (
    framework: Omit<ComplianceFramework, 'id'>
  ) => Promise<ComplianceFramework>;
  updateComplianceFramework: (id: string, updates: Partial<ComplianceFramework>) => Promise<void>;
  deleteComplianceFramework: (id: string) => Promise<void>;
  generateComplianceReport: (
    frameworkId: string,
    startDate: Date,
    endDate: Date
  ) => Promise<GeneratedComplianceReport>;
  checkCompliance: (frameworkId: string) => Promise<ComplianceStatus>;

  // Archiving
  archiveEvents: (query: AuditQuery, archiveName: string) => Promise<AuditArchive>;
  restoreArchive: (archiveId: string) => Promise<void>;
  deleteArchive: (archiveId: string) => Promise<void>;

  // Analytics
  getMetrics: (timeRange?: { start: Date; end: Date }) => Promise<AuditMetrics>;
  getTopActions: (
    limit: number,
    timeRange?: { start: Date; end: Date }
  ) => Promise<Array<{ action: string; count: number }>>;
  getTopUsers: (
    limit: number,
    timeRange?: { start: Date; end: Date }
  ) => Promise<Array<{ userId: string; userName: string; count: number }>>;
  getEventTrends: (
    granularity: 'hour' | 'day' | 'week' | 'month',
    timeRange: { start: Date; end: Date }
  ) => Promise<Array<{ timestamp: Date; count: number }>>;

  // Security
  detectAnomalies: (userId?: string, resource?: string) => Promise<AuditEvent[]>;
  identifyRiskPatterns: () => Promise<
    Array<{ pattern: string; risk: number; events: AuditEvent[] }>
  >;

  // Maintenance
  cleanupOldEvents: () => Promise<{ deleted: number; archived: number }>;
  optimizeStorage: () => Promise<{ beforeSize: number; afterSize: number; savings: number }>;
  rebuildIndexes: () => Promise<void>;
  validateIntegrity: () => Promise<{ valid: boolean; errors: string[] }>;
}

export interface ComplianceStatus {
  frameworkId: string;
  overallCompliance: number; // percentage
  requirements: Array<{
    requirementId: string;
    status: 'compliant' | 'non_compliant' | 'partial';
    issues: string[];
  }>;
  recommendations: string[];
  lastAssessment: Date;
}

export interface GeneratedReport {
  reportId: string;
  reportName: string;
  generatedAt: Date;
  query: AuditQuery;
  totalEvents: number;
  events: AuditEvent[];
  summary: {
    severityBreakdown: Record<string, number>;
    outcomeBreakdown: Record<string, number>;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ user: string; count: number }>;
  };
}

export interface GeneratedComplianceReport {
  frameworkId: string;
  frameworkName: string;
  period: { startDate: Date; endDate: Date };
  totalEvents: number;
  requirements: Array<{
    requirementId: string;
    name: string;
    eventsCount: number;
    compliancePercentage: number;
  }>;
  generatedAt: Date;
}

// Audit categories for SIPOMA system
export const AUDIT_CATEGORIES = {
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  DATA_ACCESS: 'data_access',
  DATA_MODIFICATION: 'data_modification',
  SYSTEM_CONFIGURATION: 'system_configuration',
  USER_MANAGEMENT: 'user_management',
  PLANT_OPERATIONS: 'plant_operations',
  SECURITY: 'security',
  COMPLIANCE: 'compliance',
  MAINTENANCE: 'maintenance',
} as const;

// Common audit actions
export const AUDIT_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  PASSWORD_CHANGE: 'password_change',
  MFA_SETUP: 'mfa_setup',
  MFA_VERIFY: 'mfa_verify',
  ROLE_ASSIGN: 'role_assign',
  ROLE_REVOKE: 'role_revoke',
  PERMISSION_GRANT: 'permission_grant',
  PERMISSION_DENY: 'permission_deny',
  DATA_VIEW: 'data_view',
  DATA_CREATE: 'data_create',
  DATA_UPDATE: 'data_update',
  DATA_DELETE: 'data_delete',
  DATA_EXPORT: 'data_export',
  EQUIPMENT_CONTROL: 'equipment_control',
  EMERGENCY_STOP: 'emergency_stop',
  CONFIG_CHANGE: 'config_change',
  SYSTEM_BACKUP: 'system_backup',
  SYSTEM_RESTORE: 'system_restore',
} as const;

export const useAuditStore = create<AuditStore>()(
  persist(
    (set, get) => ({
      // Initial State
      auditEvents: [],
      auditReports: [],
      auditDashboards: [],
      auditRules: [],
      complianceFrameworks: [],
      auditArchives: [],

      retentionPolicy: {
        defaultRetentionDays: 2555, // 7 years
        archiveAfterDays: 365, // 1 year
        deleteAfterDays: 2555, // 7 years
        compressArchives: true,
        encryptArchives: true,
      },

      // Log Event
      logEvent: async (eventData) => {
        const event: AuditEvent = {
          ...eventData,
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          details: eventData.details || {},
          tags: eventData.tags || [],
          metadata: eventData.metadata || {},
        };

        set((state) => ({
          auditEvents: [event, ...state.auditEvents],
        }));

        // Evaluate rules for this event
        await get().evaluateRules(event);

        return event;
      },

      // Log Bulk Events
      logBulkEvents: async (eventsData) => {
        const events = eventsData.map((eventData) => ({
          ...eventData,
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          details: eventData.details || {},
          tags: eventData.tags || [],
          metadata: eventData.metadata || {},
        }));

        set((state) => ({
          auditEvents: [...events, ...state.auditEvents],
        }));

        // Evaluate rules for each event
        for (const event of events) {
          await get().evaluateRules(event);
        }

        return events;
      },

      // Get Events
      getEvents: async (query) => {
        let events = get().auditEvents;

        if (query) {
          events = events.filter((event) => {
            if (query.startDate && event.timestamp < query.startDate) return false;
            if (query.endDate && event.timestamp > query.endDate) return false;
            if (query.userId && event.userId !== query.userId) return false;
            if (query.action && !event.action.includes(query.action)) return false;
            if (query.resource && !event.resource.includes(query.resource)) return false;
            if (query.severity && event.severity !== query.severity) return false;
            if (query.category && event.category !== query.category) return false;
            if (query.outcome && event.outcome !== query.outcome) return false;
            if (query.tags && !query.tags.some((tag) => event.tags.includes(tag))) return false;
            if (query.searchText) {
              const searchLower = query.searchText.toLowerCase();
              const searchFields = [
                event.action,
                event.resource,
                event.userName,
                JSON.stringify(event.details),
              ];
              if (!searchFields.some((field) => field.toLowerCase().includes(searchLower))) {
                return false;
              }
            }
            return true;
          });

          // Sorting
          if (query.sortBy) {
            events.sort((a, b) => {
              let aVal: number | string;
              let bVal: number | string;
              switch (query.sortBy) {
                case 'timestamp': {
                  aVal = a.timestamp.getTime();
                  bVal = b.timestamp.getTime();
                  break;
                }
                case 'severity': {
                  const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
                  aVal = severityOrder[a.severity];
                  bVal = severityOrder[b.severity];
                  break;
                }
                case 'action': {
                  aVal = a.action;
                  bVal = b.action;
                  break;
                }
                default:
                  return 0;
              }
              if (query.sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
              } else {
                return aVal < bVal ? 1 : -1;
              }
            });
          }

          // Pagination
          if (query.offset !== undefined && query.limit !== undefined) {
            events = events.slice(query.offset, query.offset + query.limit);
          } else if (query.limit !== undefined) {
            events = events.slice(0, query.limit);
          }
        }

        return events;
      },

      // Get Event
      getEvent: (id) => {
        return get().auditEvents.find((event) => event.id === id);
      },

      // Delete Event
      deleteEvent: async (id) => {
        set((state) => ({
          auditEvents: state.auditEvents.filter((event) => event.id !== id),
        }));
      },

      // Search Events
      searchEvents: async (query) => {
        const allEvents = await get().getEvents(query);
        const total = get().auditEvents.filter((event) => {
          // Apply same filters as getEvents but without pagination
          if (query.startDate && event.timestamp < query.startDate) return false;
          if (query.endDate && event.timestamp > query.endDate) return false;
          if (query.userId && event.userId !== query.userId) return false;
          if (query.action && !event.action.includes(query.action)) return false;
          if (query.resource && !event.resource.includes(query.resource)) return false;
          if (query.severity && event.severity !== query.severity) return false;
          if (query.category && event.category !== query.category) return false;
          if (query.outcome && event.outcome !== query.outcome) return false;
          if (query.tags && !query.tags.some((tag) => event.tags.includes(tag))) return false;
          if (query.searchText) {
            const searchLower = query.searchText.toLowerCase();
            const searchFields = [
              event.action,
              event.resource,
              event.userName,
              JSON.stringify(event.details),
            ];
            if (!searchFields.some((field) => field.toLowerCase().includes(searchLower))) {
              return false;
            }
          }
          return true;
        }).length;

        return { events: allEvents, total };
      },

      // Get Events by User
      getEventsByUser: async (userId, limit = 100) => {
        return get().getEvents({ userId, limit, sortBy: 'timestamp', sortOrder: 'desc' });
      },

      // Get Events by Resource
      getEventsByResource: async (resource, resourceId, limit = 100) => {
        const query: AuditQuery = { resource, limit, sortBy: 'timestamp', sortOrder: 'desc' };
        const events = await get().getEvents(query);

        if (resourceId) {
          return events.filter((event) => event.resourceId === resourceId);
        }

        return events;
      },

      // Get Events by Time Range
      getEventsByTimeRange: async (startDate, endDate) => {
        return get().getEvents({ startDate, endDate, sortBy: 'timestamp', sortOrder: 'desc' });
      },

      // Create Report
      createReport: async (reportData) => {
        const report: AuditReport = {
          ...reportData,
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };

        if (report.schedule) {
          // Calculate next run time
          const now = new Date();
          const nextRun = new Date(now);

          switch (report.schedule.frequency) {
            case 'daily':
              nextRun.setDate(nextRun.getDate() + 1);
              break;
            case 'weekly':
              nextRun.setDate(nextRun.getDate() + 7);
              break;
            case 'monthly':
              nextRun.setMonth(nextRun.getMonth() + 1);
              break;
          }

          report.nextRun = nextRun;
        }

        set((state) => ({
          auditReports: [...state.auditReports, report],
        }));

        return report;
      },

      // Update Report
      updateReport: async (id, updates) => {
        set((state) => ({
          auditReports: state.auditReports.map((report) =>
            report.id === id ? { ...report, ...updates } : report
          ),
        }));
      },

      // Delete Report
      deleteReport: async (id) => {
        set((state) => ({
          auditReports: state.auditReports.filter((report) => report.id !== id),
        }));
      },

      // Generate Report
      generateReport: async (reportId) => {
        const report = get().auditReports.find((r) => r.id === reportId);
        if (!report) throw new Error('Report not found');

        const events = await get().getEvents(report.query);

        // Update last run time
        set((state) => ({
          auditReports: state.auditReports.map((r) =>
            r.id === reportId ? { ...r, lastRun: new Date() } : r
          ),
        }));

        return {
          reportId,
          reportName: report.name,
          generatedAt: new Date(),
          query: report.query,
          totalEvents: events.length,
          events,
          summary: {
            severityBreakdown: events.reduce(
              (acc, event) => {
                acc[event.severity] = (acc[event.severity] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            ),
            outcomeBreakdown: events.reduce(
              (acc, event) => {
                acc[event.outcome] = (acc[event.outcome] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            ),
            topActions: Object.entries(
              events.reduce(
                (acc, event) => {
                  acc[event.action] = (acc[event.action] || 0) + 1;
                  return acc;
                },
                {} as Record<string, number>
              )
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([action, count]) => ({ action, count })),
            topUsers: Object.entries(
              events.reduce(
                (acc, event) => {
                  acc[event.userName] = (acc[event.userName] || 0) + 1;
                  return acc;
                },
                {} as Record<string, number>
              )
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([user, count]) => ({ user, count })),
          },
        };
      },

      // Export Report
      exportReport: async (reportId, format) => {
        const reportData = await get().generateReport(reportId);

        let content: string;
        let mimeType: string;

        switch (format) {
          case 'json': {
            content = JSON.stringify(reportData, null, 2);
            mimeType = 'application/json';
            break;
          }
          case 'csv': {
            const csvHeaders = 'Timestamp,User,Action,Resource,Outcome,Severity,Details\n';
            const csvRows = reportData.events
              .map(
                (event: AuditEvent) =>
                  `${event.timestamp.toISOString()},${event.userName},${event.action},${event.resource},${event.outcome},${event.severity},"${JSON.stringify(event.details).replace(/"/g, '""')}"`
              )
              .join('\n');
            content = csvHeaders + csvRows;
            mimeType = 'text/csv';
            break;
          }
          default:
            throw new Error(`Export format ${format} not supported`);
        }

        return new Blob([content], { type: mimeType });
      },

      // Schedule Report
      scheduleReport: async (reportId) => {
        // In production, this would integrate with a job scheduler
        void reportId; // Mark as used
      },

      // Create Dashboard
      createDashboard: async (dashboardData) => {
        const dashboard: AuditDashboard = {
          ...dashboardData,
          id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          auditDashboards: [...state.auditDashboards, dashboard],
        }));

        return dashboard;
      },

      // Update Dashboard
      updateDashboard: async (id, updates) => {
        set((state) => ({
          auditDashboards: state.auditDashboards.map((dashboard) =>
            dashboard.id === id ? { ...dashboard, ...updates, updatedAt: new Date() } : dashboard
          ),
        }));
      },

      // Delete Dashboard
      deleteDashboard: async (id) => {
        set((state) => ({
          auditDashboards: state.auditDashboards.filter((dashboard) => dashboard.id !== id),
        }));
      },

      // Get Dashboard
      getDashboard: (id) => {
        return get().auditDashboards.find((dashboard) => dashboard.id === id);
      },

      // Create Rule
      createRule: async (ruleData) => {
        const rule: AuditRule = {
          ...ruleData,
          id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          triggeredCount: 0,
        };

        set((state) => ({
          auditRules: [...state.auditRules, rule],
        }));

        return rule;
      },

      // Update Rule
      updateRule: async (id, updates) => {
        set((state) => ({
          auditRules: state.auditRules.map((rule) =>
            rule.id === id ? { ...rule, ...updates, updatedAt: new Date() } : rule
          ),
        }));
      },

      // Delete Rule
      deleteRule: async (id) => {
        set((state) => ({
          auditRules: state.auditRules.filter((rule) => rule.id !== id),
        }));
      },

      // Evaluate Rules
      evaluateRules: async (event) => {
        const rules = get().auditRules.filter((rule) => rule.isActive);
        const triggeredRules: AuditRule[] = [];

        for (const rule of rules) {
          if (await evaluateCondition(rule.condition, event, get().auditEvents)) {
            triggeredRules.push(rule);
            await get().triggerRule(rule.id, event);
          }
        }

        return triggeredRules;
      },

      // Trigger Rule
      triggerRule: async (ruleId, event) => {
        const rule = get().auditRules.find((r) => r.id === ruleId);
        if (!rule) return;

        // Update rule statistics
        set((state) => ({
          auditRules: state.auditRules.map((r) =>
            r.id === ruleId
              ? {
                  ...r,
                  triggeredCount: r.triggeredCount + 1,
                  lastTriggered: new Date(),
                }
              : r
          ),
        }));

        // Execute actions
        for (const action of rule.actions) {
          if (action.isActive) {
            switch (action.type) {
              case 'notification':
                // In production, would send notification
                void event; // Mark as used
                break;
              case 'email':
                // In production, would send email
                void event; // Mark as used
                break;
              case 'webhook':
                // In production, would call webhook
                void event; // Mark as used
                break;
            }
          }
        }
      },

      // Create Compliance Framework
      createComplianceFramework: async (frameworkData) => {
        const framework: ComplianceFramework = {
          ...frameworkData,
          id: `framework_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        set((state) => ({
          complianceFrameworks: [...state.complianceFrameworks, framework],
        }));

        return framework;
      },

      // Update Compliance Framework
      updateComplianceFramework: async (id, updates) => {
        set((state) => ({
          complianceFrameworks: state.complianceFrameworks.map((framework) =>
            framework.id === id ? { ...framework, ...updates } : framework
          ),
        }));
      },

      // Delete Compliance Framework
      deleteComplianceFramework: async (id) => {
        set((state) => ({
          complianceFrameworks: state.complianceFrameworks.filter(
            (framework) => framework.id !== id
          ),
        }));
      },

      // Generate Compliance Report
      generateComplianceReport: async (frameworkId, startDate, endDate) => {
        const framework = get().complianceFrameworks.find((f) => f.id === frameworkId);
        if (!framework) throw new Error('Compliance framework not found');

        const events = await get().getEventsByTimeRange(startDate, endDate);

        return {
          frameworkId,
          frameworkName: framework.name,
          period: { startDate, endDate },
          totalEvents: events.length,
          requirements: framework.requirements.map((req) => ({
            requirementId: req.id,
            name: req.name,
            eventsCount: events.filter((e) =>
              req.mandatoryFields.every(
                (field) =>
                  Object.prototype.hasOwnProperty.call(e, field) &&
                  (e as unknown as Record<string, unknown>)[field] !== null &&
                  (e as unknown as Record<string, unknown>)[field] !== undefined
              )
            ).length,
            compliancePercentage:
              events.length > 0
                ? (events.filter((e) =>
                    req.mandatoryFields.every(
                      (field) =>
                        Object.prototype.hasOwnProperty.call(e, field) &&
                        (e as unknown as Record<string, unknown>)[field] !== null &&
                        (e as unknown as Record<string, unknown>)[field] !== undefined
                    )
                  ).length /
                    events.length) *
                  100
                : 0,
          })),
          generatedAt: new Date(),
        };
      },

      // Check Compliance
      checkCompliance: async (frameworkId) => {
        const framework = get().complianceFrameworks.find((f) => f.id === frameworkId);
        if (!framework) throw new Error('Compliance framework not found');

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const events = await get().getEventsByTimeRange(thirtyDaysAgo, now);

        const requirementStatuses = framework.requirements.map((req) => {
          const compliantEvents = events.filter((e) =>
            req.mandatoryFields.every(
              (field) =>
                Object.prototype.hasOwnProperty.call(e, field) &&
                (e as unknown as Record<string, unknown>)[field] !== null &&
                (e as unknown as Record<string, unknown>)[field] !== undefined
            )
          );

          const compliancePercentage =
            events.length > 0 ? (compliantEvents.length / events.length) * 100 : 0;

          return {
            requirementId: req.id,
            status:
              compliancePercentage >= 95
                ? ('compliant' as const)
                : compliancePercentage >= 70
                  ? ('partial' as const)
                  : ('non_compliant' as const),
            issues:
              compliancePercentage < 95
                ? [`${(100 - compliancePercentage).toFixed(1)}% of events missing required fields`]
                : [],
          };
        });

        const overallCompliance =
          requirementStatuses.reduce((sum, req) => {
            return sum + (req.status === 'compliant' ? 100 : req.status === 'partial' ? 70 : 0);
          }, 0) / requirementStatuses.length;

        return {
          frameworkId,
          overallCompliance,
          requirements: requirementStatuses,
          recommendations:
            overallCompliance < 95
              ? ['Review audit logging configuration', 'Ensure all required fields are captured']
              : [],
          lastAssessment: new Date(),
        };
      },

      // Archive Events
      archiveEvents: async (query, archiveName) => {
        const events = await get().getEvents(query);
        const originalSize = JSON.stringify(events).length;
        const compressedSize = Math.floor(originalSize * 0.3); // Mock compression

        const archive: AuditArchive = {
          id: `archive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: archiveName,
          description: `Archive created on ${new Date().toISOString()}`,
          query,
          archiveDate: new Date(),
          totalEvents: events.length,
          compressedSize,
          originalSize,
          location: `storage://archives/${archiveName}`,
          checksum: `sha256_${Math.random().toString(36)}`,
          isEncrypted: get().retentionPolicy.encryptArchives,
        };

        set((state) => ({
          auditArchives: [...state.auditArchives, archive],
          auditEvents: state.auditEvents.filter((event) => !events.find((e) => e.id === event.id)),
        }));

        return archive;
      },

      // Restore Archive
      restoreArchive: async (archiveId) => {
        // In production, would restore events from archive storage
        void archiveId; // Mark as used
      },

      // Delete Archive
      deleteArchive: async (archiveId) => {
        set((state) => ({
          auditArchives: state.auditArchives.filter((archive) => archive.id !== archiveId),
        }));
      },

      // Get Metrics
      getMetrics: async (timeRange) => {
        const events = timeRange
          ? await get().getEventsByTimeRange(timeRange.start, timeRange.end)
          : get().auditEvents;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const topActions = Object.entries(
          events.reduce(
            (acc, event) => {
              acc[event.action] = (acc[event.action] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          )
        )
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([action, count]) => ({ action, count }));

        const topUsers = Object.entries(
          events.reduce(
            (acc, event) => {
              acc[event.userId] = (acc[event.userId] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          )
        )
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([userId, count]) => {
            const event = events.find((e) => e.userId === userId);
            return { userId, userName: event?.userName || 'Unknown', count };
          });

        const topResources = Object.entries(
          events.reduce(
            (acc, event) => {
              acc[event.resource] = (acc[event.resource] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          )
        )
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([resource, count]) => ({ resource, count }));

        return {
          totalEvents: events.length,
          eventsToday: events.filter((e) => e.timestamp >= today).length,
          eventsThisWeek: events.filter((e) => e.timestamp >= thisWeek).length,
          eventsThisMonth: events.filter((e) => e.timestamp >= thisMonth).length,
          averageEventsPerDay: events.length / 30, // Mock calculation
          topActions,
          topUsers,
          topResources,
          severityDistribution: events.reduce(
            (acc, event) => {
              acc[event.severity] = (acc[event.severity] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
          outcomeDistribution: events.reduce(
            (acc, event) => {
              acc[event.outcome] = (acc[event.outcome] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
          categoryDistribution: events.reduce(
            (acc, event) => {
              acc[event.category] = (acc[event.category] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
          storageUsage: {
            totalSize: JSON.stringify(events).length,
            archivedSize: get().auditArchives.reduce(
              (sum, archive) => sum + archive.compressedSize,
              0
            ),
            activeSize: JSON.stringify(events).length,
          },
          performanceMetrics: {
            averageIngestionTime: 25, // Mock values
            averageQueryTime: 150,
            indexingEfficiency: 0.85,
          },
        };
      },

      // Get Top Actions
      getTopActions: async (limit, timeRange) => {
        const events = timeRange
          ? await get().getEventsByTimeRange(timeRange.start, timeRange.end)
          : get().auditEvents;

        return Object.entries(
          events.reduce(
            (acc, event) => {
              acc[event.action] = (acc[event.action] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          )
        )
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
          .map(([action, count]) => ({ action, count }));
      },

      // Get Top Users
      getTopUsers: async (limit, timeRange) => {
        const events = timeRange
          ? await get().getEventsByTimeRange(timeRange.start, timeRange.end)
          : get().auditEvents;

        return Object.entries(
          events.reduce(
            (acc, event) => {
              acc[event.userId] = (acc[event.userId] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          )
        )
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
          .map(([userId, count]) => {
            const event = events.find((e) => e.userId === userId);
            return { userId, userName: event?.userName || 'Unknown', count };
          });
      },

      // Get Event Trends
      getEventTrends: async (granularity, timeRange) => {
        const events = await get().getEventsByTimeRange(timeRange.start, timeRange.end);
        const trends: Array<{ timestamp: Date; count: number }> = [];

        // Group events by time granularity
        const groupedEvents = events.reduce(
          (acc, event) => {
            let key: string;
            const timestamp = new Date(event.timestamp);

            switch (granularity) {
              case 'hour': {
                key = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}-${timestamp.getHours()}`;
                break;
              }
              case 'day': {
                key = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}`;
                break;
              }
              case 'week': {
                const weekStart = new Date(timestamp);
                weekStart.setDate(timestamp.getDate() - timestamp.getDay());
                key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
                break;
              }
              case 'month': {
                key = `${timestamp.getFullYear()}-${timestamp.getMonth()}`;
                break;
              }
            }

            acc[key] = (acc[key] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // Convert to array format
        Object.entries(groupedEvents).forEach(([key, count]) => {
          const parts = key.split('-').map(Number);
          let timestamp: Date;

          switch (granularity) {
            case 'hour': {
              timestamp = new Date(parts[0], parts[1], parts[2], parts[3]);
              break;
            }
            case 'day': {
              timestamp = new Date(parts[0], parts[1], parts[2]);
              break;
            }
            case 'week':
            case 'month': {
              timestamp = new Date(parts[0], parts[1], parts[2] || 1);
              break;
            }
          }

          trends.push({ timestamp, count });
        });

        return trends.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      },

      // Detect Anomalies
      detectAnomalies: async (userId, resource) => {
        const events = get().auditEvents;
        const anomalies: AuditEvent[] = [];

        // Simple anomaly detection based on frequency
        const eventCounts = events.reduce(
          (acc, event) => {
            if (userId && event.userId !== userId) return acc;
            if (resource && event.resource !== resource) return acc;

            const key = `${event.userId}-${event.action}-${event.resource}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        const average =
          Object.values(eventCounts).reduce((sum, count) => sum + count, 0) /
          Object.values(eventCounts).length;
        const threshold = average * 3; // 3x average is considered anomalous

        events.forEach((event) => {
          if (userId && event.userId !== userId) return;
          if (resource && event.resource !== resource) return;

          const key = `${event.userId}-${event.action}-${event.resource}`;
          if (eventCounts[key] > threshold) {
            anomalies.push(event);
          }
        });

        return anomalies;
      },

      // Identify Risk Patterns
      identifyRiskPatterns: async () => {
        const events = get().auditEvents;
        const patterns: Array<{ pattern: string; risk: number; events: AuditEvent[] }> = [];

        // Failed login attempts pattern
        const failedLogins = events.filter((e) => e.action === AUDIT_ACTIONS.LOGIN_FAILED);
        const failedLoginsByUser = failedLogins.reduce(
          (acc, event) => {
            acc[event.userId] = acc[event.userId] || [];
            acc[event.userId].push(event);
            return acc;
          },
          {} as Record<string, AuditEvent[]>
        );

        Object.entries(failedLoginsByUser).forEach(([userId, userEvents]) => {
          if (userEvents.length >= 5) {
            patterns.push({
              pattern: `Multiple failed login attempts for user ${userId}`,
              risk: Math.min(userEvents.length * 10, 100),
              events: userEvents,
            });
          }
        });

        // After-hours access pattern
        const afterHoursEvents = events.filter((event) => {
          const hour = event.timestamp.getHours();
          return hour < 6 || hour > 22; // Before 6 AM or after 10 PM
        });

        if (afterHoursEvents.length > 10) {
          patterns.push({
            pattern: 'High volume of after-hours access',
            risk: 60,
            events: afterHoursEvents,
          });
        }

        return patterns.sort((a, b) => b.risk - a.risk);
      },

      // Cleanup Old Events
      cleanupOldEvents: async () => {
        const now = new Date();
        const archiveThreshold = new Date(
          now.getTime() - get().retentionPolicy.archiveAfterDays * 24 * 60 * 60 * 1000
        );
        const deleteThreshold = new Date(
          now.getTime() - get().retentionPolicy.deleteAfterDays * 24 * 60 * 60 * 1000
        );

        const events = get().auditEvents;
        const eventsToArchive = events.filter(
          (e) => e.timestamp < archiveThreshold && e.timestamp >= deleteThreshold
        );
        const eventsToDelete = events.filter((e) => e.timestamp < deleteThreshold);

        // Archive old events
        if (eventsToArchive.length > 0) {
          await get().archiveEvents(
            {
              endDate: archiveThreshold,
              startDate: deleteThreshold,
            },
            `auto_archive_${now.toISOString().split('T')[0]}`
          );
        }

        // Delete very old events
        set((state) => ({
          auditEvents: state.auditEvents.filter((e) => e.timestamp >= deleteThreshold),
        }));

        return {
          deleted: eventsToDelete.length,
          archived: eventsToArchive.length,
        };
      },

      // Optimize Storage
      optimizeStorage: async () => {
        const beforeSize = JSON.stringify(get().auditEvents).length;

        // Remove duplicate events (same user, action, resource, timestamp within 1 second)
        const events = get().auditEvents;
        const uniqueEvents = events.filter((event, index) => {
          return !events
            .slice(0, index)
            .some(
              (otherEvent) =>
                otherEvent.userId === event.userId &&
                otherEvent.action === event.action &&
                otherEvent.resource === event.resource &&
                Math.abs(otherEvent.timestamp.getTime() - event.timestamp.getTime()) < 1000
            );
        });

        set({ auditEvents: uniqueEvents });

        const afterSize = JSON.stringify(uniqueEvents).length;
        const savings = beforeSize - afterSize;

        return { beforeSize, afterSize, savings };
      },

      // Rebuild Indexes
      rebuildIndexes: async () => {
        // In production, would rebuild database indexes
        // This is a no-op in the in-memory implementation
      },

      // Validate Integrity
      validateIntegrity: async () => {
        const events = get().auditEvents;
        const errors: string[] = [];

        // Check for required fields
        events.forEach((event) => {
          if (!event.id) errors.push(`Event missing ID: ${JSON.stringify(event)}`);
          if (!event.timestamp) errors.push(`Event missing timestamp: ${event.id}`);
          if (!event.userId) errors.push(`Event missing userId: ${event.id}`);
          if (!event.action) errors.push(`Event missing action: ${event.id}`);
          if (!event.resource) errors.push(`Event missing resource: ${event.id}`);
        });

        // Check for duplicate IDs
        const ids = events.map((e) => e.id);
        const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
        if (duplicateIds.length > 0) {
          errors.push(`Duplicate event IDs found: ${duplicateIds.join(', ')}`);
        }

        return {
          valid: errors.length === 0,
          errors,
        };
      },
    }),
    {
      name: 'sipoma-audit-store',
      partialize: (state) => ({
        auditEvents: state.auditEvents,
        auditReports: state.auditReports,
        auditDashboards: state.auditDashboards,
        auditRules: state.auditRules,
        complianceFrameworks: state.complianceFrameworks,
        auditArchives: state.auditArchives,
        retentionPolicy: state.retentionPolicy,
      }),
    }
  )
);

// Helper function to evaluate audit conditions
async function evaluateCondition(
  condition: AuditCondition,
  event: AuditEvent,
  allEvents: AuditEvent[]
): Promise<boolean> {
  switch (condition.type) {
    case 'threshold':
      if (condition.timeWindow) {
        const windowStart = new Date(Date.now() - condition.timeWindow.duration * 60 * 1000);
        const relevantEvents = allEvents.filter(
          (e) => e.timestamp >= windowStart && getFieldValue(e, condition.field) !== undefined
        );

        let value: number;
        switch (condition.timeWindow.aggregation) {
          case 'count':
            value = relevantEvents.length;
            break;
          case 'sum':
            value = relevantEvents.reduce(
              (sum, e) => sum + Number(getFieldValue(e, condition.field) || 0),
              0
            );
            break;
          case 'avg':
            value =
              relevantEvents.reduce(
                (sum, e) => sum + Number(getFieldValue(e, condition.field) || 0),
                0
              ) / relevantEvents.length;
            break;
          case 'min':
            value = Math.min(
              ...relevantEvents.map((e) => Number(getFieldValue(e, condition.field) || 0))
            );
            break;
          case 'max':
            value = Math.max(
              ...relevantEvents.map((e) => Number(getFieldValue(e, condition.field) || 0))
            );
            break;
          default:
            value = 0;
        }

        return compareValues(value, condition.operator, condition.value);
      } else {
        const fieldValue = getFieldValue(event, condition.field);
        return compareValues(fieldValue, condition.operator, condition.value);
      }

    case 'pattern': {
      const fieldValue = String(getFieldValue(event, condition.field) || '');
      if (condition.operator === 'regex') {
        const regex = new RegExp(String(condition.value));
        return regex.test(fieldValue);
      } else {
        return compareValues(fieldValue, condition.operator, condition.value);
      }
    }

    case 'composite': {
      if (!condition.children) return false;

      const results = await Promise.all(
        condition.children.map((child) => evaluateCondition(child, event, allEvents))
      );

      return condition.logicOperator === 'and' ? results.every((r) => r) : results.some((r) => r);
    }

    case 'anomaly': {
      // Simple anomaly detection - check if event count for this user/action is unusually high
      const recentEvents = allEvents.filter(
        (e) =>
          e.userId === event.userId &&
          e.action === event.action &&
          e.timestamp >= new Date(Date.now() - 60 * 60 * 1000) // Last hour
      );
      return recentEvents.length > 10; // More than 10 similar events in the last hour
    }

    default:
      return false;
  }
}

// Helper function to get field value from event
function getFieldValue(event: AuditEvent, field: string): unknown {
  const parts = field.split('.');
  let value: unknown = event;

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      value = undefined;
      break;
    }
  }

  return value;
}

// Helper function to compare values
function compareValues(actual: unknown, operator: string, expected: unknown): boolean {
  switch (operator) {
    case 'eq':
      return actual === expected;
    case 'ne':
      return actual !== expected;
    case 'gt':
      return Number(actual) > Number(expected);
    case 'lt':
      return Number(actual) < Number(expected);
    case 'gte':
      return Number(actual) >= Number(expected);
    case 'lte':
      return Number(actual) <= Number(expected);
    case 'contains':
      return String(actual).includes(String(expected));
    case 'in':
      return Array.isArray(expected) && expected.includes(actual);
    case 'not_in':
      return Array.isArray(expected) && !expected.includes(actual);
    default:
      return false;
  }
}
