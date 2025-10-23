import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SecurityEvent {
  id: string;
  type:
    | 'login'
    | 'logout'
    | 'failed_login'
    | 'permission_check'
    | 'data_access'
    | 'security_violation';
  userId?: string;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  result: 'success' | 'failure' | 'blocked';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, string | number | boolean>;
  timestamp: Date;
}

export interface SecurityAlert {
  id: string;
  type: 'brute_force' | 'suspicious_activity' | 'privilege_escalation' | 'data_breach' | 'malware';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  userId?: string;
  ipAddress?: string;
  affectedResources?: string[];
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface SecurityMetrics {
  totalEvents: number;
  failedLogins: number;
  successfulLogins: number;
  blockedActions: number;
  activeAlerts: number;
  riskScore: number;
  lastSecurityScan?: Date;
}

export interface AuditTrail {
  id: string;
  userId: string;
  username: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  deviceInfo?: {
    browser: string;
    os: string;
    device: string;
  };
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

interface SecurityState {
  // Events and Alerts
  events: SecurityEvent[];
  alerts: SecurityAlert[];
  metrics: SecurityMetrics;
  auditTrail: AuditTrail[];
  activeSessions: SessionInfo[];

  // Security Settings
  settings: {
    maxFailedLogins: number;
    sessionTimeout: number; // minutes
    requireMFA: boolean;
    allowedIpRanges: string[];
    blockedIpAddresses: string[];
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      maxAge: number; // days
    };
  };

  // Actions
  addSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => void;
  addSecurityAlert: (alert: Omit<SecurityAlert, 'id' | 'createdAt'>) => void;
  resolveAlert: (alertId: string, resolvedBy: string) => void;
  addAuditEntry: (entry: Omit<AuditTrail, 'id' | 'timestamp'>) => void;
  updateSession: (sessionInfo: SessionInfo) => void;
  terminateSession: (sessionId: string) => void;
  updateSecuritySettings: (settings: Partial<SecurityState['settings']>) => void;
  calculateRiskScore: () => number;
  getSecurityReport: () => {
    events: SecurityEvent[];
    alerts: SecurityAlert[];
    metrics: SecurityMetrics;
    recommendations: string[];
  };
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      events: [],
      alerts: [],
      auditTrail: [],
      activeSessions: [],
      metrics: {
        totalEvents: 0,
        failedLogins: 0,
        successfulLogins: 0,
        blockedActions: 0,
        activeAlerts: 0,
        riskScore: 0,
      },
      settings: {
        maxFailedLogins: 5,
        sessionTimeout: 30,
        requireMFA: false,
        allowedIpRanges: [],
        blockedIpAddresses: [],
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          maxAge: 90,
        },
      },

      addSecurityEvent: (eventData) => {
        const event: SecurityEvent = {
          ...eventData,
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };

        set((state) => ({
          events: [event, ...state.events].slice(0, 1000), // Keep last 1000 events
          metrics: {
            ...state.metrics,
            totalEvents: state.metrics.totalEvents + 1,
            failedLogins:
              event.type === 'failed_login' && event.result === 'failure'
                ? state.metrics.failedLogins + 1
                : state.metrics.failedLogins,
            successfulLogins:
              event.type === 'login' && event.result === 'success'
                ? state.metrics.successfulLogins + 1
                : state.metrics.successfulLogins,
            blockedActions:
              event.result === 'blocked'
                ? state.metrics.blockedActions + 1
                : state.metrics.blockedActions,
            riskScore: get().calculateRiskScore(),
          },
        }));

        // Auto-generate alerts for high-risk events
        if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
          get().addSecurityAlert({
            type: 'suspicious_activity',
            severity: event.riskLevel === 'critical' ? 'critical' : 'error',
            title: `${event.type.replace('_', ' ').toUpperCase()} Alert`,
            description: `Suspicious ${event.type} detected from ${event.ipAddress || 'unknown IP'}`,
            userId: event.userId,
            ipAddress: event.ipAddress,
            isResolved: false,
          });
        }
      },

      addSecurityAlert: (alertData) => {
        const alert: SecurityAlert = {
          ...alertData,
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };

        set((state) => ({
          alerts: [alert, ...state.alerts],
          metrics: {
            ...state.metrics,
            activeAlerts: state.alerts.filter((a) => !a.isResolved).length + 1,
          },
        }));
      },

      resolveAlert: (alertId, resolvedBy) => {
        set((state) => ({
          alerts: state.alerts.map((alert) =>
            alert.id === alertId
              ? {
                  ...alert,
                  isResolved: true,
                  resolvedBy,
                  resolvedAt: new Date(),
                }
              : alert
          ),
          metrics: {
            ...state.metrics,
            activeAlerts: state.alerts.filter((a) => !a.isResolved && a.id !== alertId).length,
          },
        }));
      },

      addAuditEntry: (entryData) => {
        const entry: AuditTrail = {
          ...entryData,
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };

        set((state) => ({
          auditTrail: [entry, ...state.auditTrail].slice(0, 5000), // Keep last 5000 entries
        }));
      },

      updateSession: (sessionInfo) => {
        set((state) => ({
          activeSessions: [
            sessionInfo,
            ...state.activeSessions.filter((s) => s.sessionId !== sessionInfo.sessionId),
          ],
        }));
      },

      terminateSession: (sessionId) => {
        set((state) => ({
          activeSessions: state.activeSessions.filter((s) => s.sessionId !== sessionId),
        }));
      },

      updateSecuritySettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      calculateRiskScore: () => {
        const state = get();
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const recentEvents = state.events.filter((e) => new Date(e.timestamp) > last24Hours);
        const recentFailedLogins = recentEvents.filter((e) => e.type === 'failed_login').length;
        const recentHighRiskEvents = recentEvents.filter(
          (e) => e.riskLevel === 'high' || e.riskLevel === 'critical'
        ).length;
        const activeAlerts = state.alerts.filter((a) => !a.isResolved).length;

        let riskScore = 0;

        // Failed login attempts (0-30 points)
        riskScore += Math.min(recentFailedLogins * 3, 30);

        // High-risk events (0-40 points)
        riskScore += Math.min(recentHighRiskEvents * 10, 40);

        // Active alerts (0-30 points)
        riskScore += Math.min(activeAlerts * 5, 30);

        return Math.min(riskScore, 100);
      },

      getSecurityReport: () => {
        const state = get();
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const recentEvents = state.events.filter((e) => new Date(e.timestamp) > last24Hours);

        const recommendations: string[] = [];

        // Generate recommendations based on security analysis
        if (state.metrics.failedLogins > 50) {
          recommendations.push('Consider implementing stronger rate limiting for login attempts');
        }

        if (state.metrics.riskScore > 70) {
          recommendations.push('High risk score detected - review recent security events');
        }

        if (!state.settings.requireMFA) {
          recommendations.push('Enable multi-factor authentication for enhanced security');
        }

        if (state.activeSessions.length > 20) {
          recommendations.push('Review active sessions - consider reducing session timeout');
        }

        return {
          events: recentEvents,
          alerts: state.alerts.filter((a) => !a.isResolved),
          metrics: state.metrics,
          recommendations,
        };
      },
    }),
    {
      name: 'security-store',
      version: 1,
    }
  )
);


