import React from "react";
import { Machine, Kpi, Alert, MachineStatus, AlertSeverity } from "../types";
import { formatNumber } from "../utils/formatters";
import PlaceholderPage from "../components/PlaceholderPage";
import PlantOperationsMasterData from "./plant_operations/PlantOperationsMasterData";
import CcrDataEntryPage from "./plant_operations/CcrDataEntryPage";
import AutonomousDataEntryPage from "./plant_operations/AutonomousDataEntryPage";
import CopAnalysisPage from "./plant_operations/CopAnalysisPage";
import ReportPage from "./plant_operations/ReportPage";
import WorkInstructionLibraryPage from "./plant_operations/WorkInstructionLibraryPage";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
} from "recharts";
import ArrowTrendingUpIcon from "../components/icons/ArrowTrendingUpIcon";
import ArrowTrendingDownIcon from "../components/icons/ArrowTrendingDownIcon";
import CogIcon from "../components/icons/CogIcon";

interface PlantData {
  machines: Machine[];
  kpis: Kpi[];
  alerts: Alert[];
  productionData: { hour: number; output: number }[];
  toggleMachineStatus: (machineId: string) => void;
}

interface PageProps {
  t: any;
  plantData: PlantData;
}

const KpiCard: React.FC<{ kpi: Kpi; t: any }> = ({ kpi, t }) => {
  const TrendIcon =
    kpi.trend > 0
      ? ArrowTrendingUpIcon
      : kpi.trend < 0
      ? ArrowTrendingDownIcon
      : CogIcon;
  const trendColor =
    kpi.trend > 0
      ? "text-green-500"
      : kpi.trend < 0
      ? "text-red-500"
      : "text-slate-500";

  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className={`p-4 rounded-full mr-5 bg-red-50 text-red-600`}>
        <kpi.icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">
          {t[kpi.title as keyof typeof t]}
        </p>
        <div className="flex items-baseline space-x-2">
          <p className="text-2xl font-bold text-slate-800">
            {formatNumber(parseFloat(kpi.value))}
          </p>
          <p className="text-sm font-medium text-slate-500">{kpi.unit}</p>
        </div>
      </div>
      <div
        className={`ml-auto flex items-center text-sm font-semibold ${trendColor}`}
      >
        <TrendIcon className="h-5 w-5" />
      </div>
    </div>
  );
};

const MachineStatusRow: React.FC<{
  machine: any;
  onToggle: (id: string) => void;
  t: any;
}> = ({ machine, onToggle, t }) => {
  const statusColors: { [key in MachineStatus]: string } = {
    [MachineStatus.RUNNING]: "bg-green-100 text-green-800",
    [MachineStatus.STOPPED]: "bg-slate-100 text-slate-800",
    [MachineStatus.MAINTENANCE]: "bg-yellow-100 text-yellow-800",
  };
  return (
    <tr className="hover:bg-slate-50 transition-colors duration-150">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
        {machine.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            statusColors[machine.status]
          }`}
        >
          {machine.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
        {formatNumber(machine.output)} T/h
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">
        {formatNumber(machine.temperature)}°C
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">
        {formatNumber(machine.uptime)}%
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {machine.status !== MachineStatus.MAINTENANCE && (
          <button
            onClick={() => onToggle(machine.id)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
              machine.status === MachineStatus.RUNNING
                ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            }`}
          >
            {machine.status === MachineStatus.RUNNING
              ? t.stop_button
              : t.start_button}
          </button>
        )}
      </td>
    </tr>
  );
};

const AlertItem: React.FC<{ alert: Alert; t: any }> = ({ alert, t }) => {
  const severityConfig: {
    [key in AlertSeverity]: { icon: string; color: string };
  } = {
    [AlertSeverity.INFO]: { icon: "ℹ️", color: "bg-blue-50 border-blue-200" },
    [AlertSeverity.WARNING]: {
      icon: "⚠️",
      color: "bg-yellow-50 border-yellow-200",
    },
    [AlertSeverity.CRITICAL]: { icon: "🚨", color: "bg-red-50 border-red-200" },
  };
  return (
    <li
      className={`p-4 rounded-lg border-l-4 ${
        severityConfig[alert.severity].color
      } flex items-start space-x-3`}
    >
      <span className="text-xl mt-0.5">
        {severityConfig[alert.severity].icon}
      </span>
      <div>
        <p className="text-sm text-slate-800 font-medium">
          {t[alert.message as keyof typeof t]}
        </p>
        <p className="text-xs text-slate-500">
          {alert.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </li>
  );
};

const ProductionChart: React.FC<{
  data: { hour: number; output: number }[];
  t: any;
}> = ({ data, t }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-lg font-semibold text-slate-800 mb-1">
        {t.production_output_title}{" "}
        <span className="text-sm font-normal text-slate-500">{t.last_24h}</span>
      </h3>
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="productionGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} />
            <YAxis tickFormatter={(v) => `${v} T/h`} />
            <Tooltip
              formatter={(value: number) => `${value} T/h`}
              labelFormatter={(label) => `${label}h`}
            />
            <Area
              type="monotone"
              dataKey="output"
              stroke="#DC2626"
              fill="url(#productionGradient)"
              strokeWidth={2.5}
            />
            <Line
              type="monotone"
              dataKey="output"
              stroke="#DC2626"
              strokeWidth={2.5}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const PlantOperationsDashboard: React.FC<PageProps> = ({ t, plantData }) => {
  // Temporary placeholder for development - remove when data is available
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-12 h-12 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          {t.plant_operations_dashboard || "Plant Operations Dashboard"}
        </h3>
        <p className="text-slate-600 mb-6">
          {t.under_development ||
            "Fitur ini sedang dalam pengembangan. Dashboard operasi pabrik akan segera tersedia dengan data real-time."}
        </p>
        <div className="flex justify-center space-x-4 text-sm text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>KPI Monitoring</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Machine Status</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Live Alerts</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Production Charts</span>
          </div>
        </div>
      </div>

      {/* Future feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-blue-800">KPI Overview</h4>
            <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-blue-600">Monitoring performa real-time</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-green-800">Machine Status</h4>
            <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm text-green-600">Status mesin dan equipment</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-yellow-800">Live Alerts</h4>
            <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm text-yellow-600">Peringatan dan notifikasi</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-red-800">Production Data</h4>
            <div className="w-8 h-8 bg-red-200 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-red-600">Grafik produksi dan analisis</p>
        </div>
      </div>
    </div>
  );

  // Original dashboard code - commented out until data is available
  /*
  const { machines, kpis, alerts, productionData, toggleMachineStatus } =
    plantData;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} t={t} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-slate-800 p-6 border-b border-slate-200">
            {t.machine_status_title}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t.machine_header}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t.output_header}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    {t.temp_header}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    {t.uptime_header}
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">{t.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {machines.map((machine) => (
                  <MachineStatusRow
                    key={machine.id}
                    machine={machine}
                    onToggle={toggleMachineStatus}
                    t={t}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl">
          <h3 className="text-lg font-semibold text-slate-800 p-6 border-b border-slate-200">
            {t.live_alerts_title}
          </h3>
          <ul className="space-y-4 p-6 h-[28rem] overflow-y-auto">
            {alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} t={t} />
            ))}
          </ul>
        </div>
      </div>
      <div>
        <ProductionChart data={productionData} t={t} />
      </div>
    </div>
  );
  */
};

interface PlantOperationsPageProps {
  activePage: string;
  t: any;
  plantData: PlantData;
}

const PlantOperationsPage: React.FC<PlantOperationsPageProps> = ({
  activePage,
  t,
  plantData,
}) => {
  switch (activePage) {
    case "op_dashboard":
      return <PlantOperationsDashboard t={t} plantData={plantData} />;
    case "op_report":
      return <ReportPage t={t} />;
    case "op_master_data":
      return <PlantOperationsMasterData t={t} />;
    case "op_ccr_data_entry":
      return <CcrDataEntryPage t={t} />;
    case "op_autonomous_data_entry":
      return <AutonomousDataEntryPage t={t} />;
    case "op_cop_analysis":
      return <CopAnalysisPage t={t} />;
    case "op_work_instruction_library":
      return <WorkInstructionLibraryPage t={t} />;
    default:
      const pageTitle = t[activePage as keyof typeof t] || activePage;
      return <PlaceholderPage title={pageTitle} t={t} />;
  }
};

// Dummy icons used for KPIs
const ArrowUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.03 9.77a.75.75 0 0 1-1.06-1.06l5.25-5.25a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 1 1-1.06 1.06L10.75 5.612V16.25a.75.75 0 0 1-.75-.75Z"
      clipRule="evenodd"
    />
  </svg>
);
const ArrowDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M10 3a.75.75 0 0 1 .75.75v10.638l4.22-4.158a.75.75 0 1 1 1.06 1.06l-5.25 5.25a.75.75 0 0 1-1.06 0l-5.25-5.25a.75.75 0 1 1 1.06-1.06l4.22 4.158V3.75A.75.75 0 0 1 10 3Z"
      clipRule="evenodd"
    />
  </svg>
);
const MinusSmallIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path d="M6.25 10a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5Z" />
  </svg>
);

export default PlantOperationsPage;
