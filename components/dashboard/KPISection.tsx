import React from 'react';
import MetricCard from './MetricCard';
import { DashboardMetrics } from '../../hooks/useDashboardData';
import {
  CementPlantVector,
  PlantAvailabilityGaugeVector,
  DowntimeHazardGearVector,
  ProjectBlueprintVector,
} from './vectors';

interface KPISectionProps {
  metrics: DashboardMetrics;
  t: Record<string, string>;
  language?: 'en' | 'id';
}

const KPISection: React.FC<KPISectionProps> = ({ metrics, t, language = 'id' }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {/* Total Production */}
      <MetricCard
        title={
          t.dashboard_total_production ||
          (language === 'en' ? 'Total Cement Production' : 'Total Produksi Semen')
        }
        value={`${metrics.totalProduction.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')} ${
          t.unit_tons || (language === 'en' ? 'Tons' : 'Ton')
        }`}
        subtitle={
          t.dashboard_kpi_production_subtitle ||
          (language === 'en' ? 'Current Month Production' : 'Produksi Bulan Berjalan')
        }
        status="neutral"
        delay={0.1}
        vectorIllustration={<CementPlantVector className="w-10 h-10" />}
      />

      {/* Plant Availability */}
      <MetricCard
        title={
          t.dashboard_availability || (language === 'en' ? 'Plant Availability' : 'Kesiapan Pabrik')
        }
        value={`${metrics.availability}%`}
        subtitle={
          t.dashboard_kpi_availability_subtitle ||
          (language === 'en' ? 'Operational Unit Readiness' : 'Kesiapan Unit Operasional')
        }
        status={
          metrics.availability >= 90 ? 'success' : metrics.availability >= 80 ? 'warning' : 'danger'
        }
        delay={0.2}
        trend={{
          value:
            metrics.availability >= 90
              ? t.status_optimal || 'Optimal'
              : metrics.availability >= 80
                ? t.status_warning || (language === 'en' ? 'Warning' : 'Waspada')
                : t.status_critical || (language === 'en' ? 'Critical' : 'Kritis'),
          isPositive: metrics.availability >= 80,
        }}
        vectorIllustration={
          <PlantAvailabilityGaugeVector value={metrics.availability} className="w-10 h-10" />
        }
      />

      {/* Critical Downtime */}
      <MetricCard
        title={
          t.dashboard_critical_downtime ||
          (language === 'en' ? 'Active Downtime' : 'Downtime Aktif')
        }
        value={metrics.criticalDowntime}
        subtitle={
          t.dashboard_kpi_downtime_subtitle ||
          (language === 'en' ? 'Open Issues / Risks' : 'Isu / Risiko Terbuka')
        }
        status={metrics.criticalDowntime === 0 ? 'success' : 'danger'}
        delay={0.3}
        trend={{
          value:
            metrics.criticalDowntime === 0
              ? t.status_normal || 'Normal'
              : `${metrics.criticalDowntime} ${t.issues_count || (language === 'en' ? 'Issues' : 'Isu')}`,
          isPositive: metrics.criticalDowntime === 0,
        }}
        vectorIllustration={
          <DowntimeHazardGearVector count={metrics.criticalDowntime} className="w-10 h-10" />
        }
      />

      {/* Pending Projects */}
      <MetricCard
        title={
          t.dashboard_pending_projects ||
          (language === 'en' ? 'Ongoing Projects' : 'Proyek Berjalan')
        }
        value={metrics.pendingProjects}
        subtitle={
          t.dashboard_kpi_project_subtitle ||
          (language === 'en' ? 'Active Tasks / Projects' : 'Tugas / Proyek Berjalan')
        }
        status="neutral"
        delay={0.4}
        vectorIllustration={<ProjectBlueprintVector className="w-10 h-10" />}
      />
    </div>
  );
};

export default KPISection;
