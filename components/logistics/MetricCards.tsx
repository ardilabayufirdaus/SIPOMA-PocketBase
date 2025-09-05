import React, { useState } from "react";
import ArrowPathRoundedSquareIcon from "../../components/icons/ArrowPathRoundedSquareIcon";
import ChartBarSquareIcon from "../../components/icons/ChartBarSquareIcon";
import ExclamationTriangleIcon from "../../components/icons/ExclamationTriangleIcon";
import TruckIcon from "../../components/icons/TruckIcon";
import BuildingLibraryIcon from "../../components/icons/BuildingLibraryIcon";
import ArchiveBoxXMarkIcon from "../../components/icons/ArchiveBoxXMarkIcon";
import ScaleIcon from "../../components/icons/ScaleIcon";
import { InteractiveCardModal, BreakdownData } from "../InteractiveCardModal";

export interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  trend?: "good" | "warning" | "critical" | "neutral";
  breakdownData?: BreakdownData;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend = "neutral",
  breakdownData,
  onClick,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (breakdownData) {
      setIsModalOpen(true);
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "good":
        return "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400";
      case "critical":
        return "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400";
      default:
        return "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400";
    }
  };

  const getTrendBorder = () => {
    switch (trend) {
      case "good":
        return "border-l-4 border-green-500";
      case "warning":
        return "border-l-4 border-yellow-500";
      case "critical":
        return "border-l-4 border-red-500";
      default:
        return "";
    }
  };

  const isInteractive = breakdownData || onClick;

  return (
    <>
      <div
        className={`bg-white dark:bg-slate-900 p-3 rounded-lg shadow-md flex items-start gap-2 transition hover:shadow-lg focus-within:ring-2 focus-within:ring-red-400 dark:focus-within:ring-red-300 ${getTrendBorder()} ${
          isInteractive
            ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transform hover:scale-105"
            : ""
        }`}
        tabIndex={isInteractive ? 0 : -1}
        aria-label={title + (unit ? ` (${unit})` : "")}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (isInteractive && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div
          className={`p-2 rounded-lg flex items-center justify-center ${getTrendColor()}`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p
              className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate"
              title={title}
            >
              {title}
            </p>
            <div className="flex items-center space-x-1">
              {trend !== "neutral" && (
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    trend === "good"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                      : trend === "warning"
                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                  }`}
                  title={
                    trend === "good"
                      ? "Optimal"
                      : trend === "warning"
                      ? "Attention"
                      : "Action Required"
                  }
                >
                  {trend === "good" ? "✓" : trend === "warning" ? "!" : "⚠"}
                </span>
              )}
              {isInteractive && (
                <div className="text-slate-400 dark:text-slate-500">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <p
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
              aria-label={value}
            >
              {value}
            </p>
            {unit && (
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {unit}
              </p>
            )}
          </div>
        </div>
      </div>

      {breakdownData && (
        <InteractiveCardModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={breakdownData}
        />
      )}
    </>
  );
};
