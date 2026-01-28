import React from 'react';
import MetricCard from './MetricCard';
import { DashboardMetrics } from '../../hooks/useDashboardData';
import { motion } from 'framer-motion';

interface KPISectionProps {
  metrics: DashboardMetrics;
  t: Record<string, string>;
}

const KPISection: React.FC<KPISectionProps> = ({ metrics, t }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {/* Total Production (Placeholders for now) */}
      <MetricCard
        title={t.dashboard_total_production || 'Total Cement Production'}
        value={`${metrics.totalProduction.toLocaleString()} Tons`}
        subtitle="Current Month Production"
        status="neutral"
        delay={0.1}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        }
      />

      {/* Plant Availability */}
      <MetricCard
        title={t.dashboard_availability || 'Plant Availability'}
        value={`${metrics.availability}%`}
        subtitle="Operational units vs Total"
        status={
          metrics.availability >= 90 ? 'success' : metrics.availability >= 80 ? 'warning' : 'danger'
        }
        delay={0.2}
        trend={{
          value: metrics.availability >= 90 ? 'Optimal' : 'Attention',
          isPositive: metrics.availability >= 90,
        }}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />

      {/* Critical Downtime */}
      <MetricCard
        title={t.dashboard_critical_downtime || 'Active Downtime'}
        value={metrics.criticalDowntime}
        subtitle="Open Risk/Issues"
        status={metrics.criticalDowntime === 0 ? 'success' : 'danger'}
        delay={0.3}
        icon={
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {metrics.criticalDowntime > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
        }
      />

      {/* Pending Projects */}
      <MetricCard
        title={t.dashboard_pending_projects || 'Pending Projects'}
        value={metrics.pendingProjects}
        subtitle="Active tasks assigned"
        status="neutral"
        delay={0.4}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        }
      />
    </div>
  );
};

export default KPISection;
