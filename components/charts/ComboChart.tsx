import React from "react";
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from "recharts";

interface ComboChartProps {
  data: any[];
  height?: number;
  showBrush?: boolean;
  referenceLines?: Array<{
    value: number;
    label: string;
    color: string;
    strokeDasharray?: string;
  }>;
  areas?: Array<{
    dataKey: string;
    stroke: string;
    fill: string;
    fillOpacity?: number;
    strokeWidth?: number;
    strokeDasharray?: string;
    name: string;
  }>;
  bars?: Array<{
    dataKey: string;
    fill: string;
    name: string;
    yAxisId?: string;
  }>;
  lines?: Array<{
    dataKey: string;
    stroke: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    name: string;
    yAxisId?: string;
  }>;
  xAxisConfig?: {
    dataKey: string;
    formatter?: (value: any) => string;
    label?: string;
  };
  leftYAxisConfig?: {
    label?: string;
    domain?: [number | string, number | string];
  };
  rightYAxisConfig?: {
    label?: string;
    domain?: [number | string, number | string];
  };
  customTooltip?: React.FC<any>;
}

const ComboChart: React.FC<ComboChartProps> = ({
  data,
  height = 400,
  showBrush = false,
  referenceLines = [],
  areas = [],
  bars = [],
  lines = [],
  xAxisConfig,
  leftYAxisConfig,
  rightYAxisConfig,
  customTooltip,
}) => {
  const xConfig = xAxisConfig || { dataKey: "date" };
  const leftYConfig = leftYAxisConfig || {};
  const rightYConfig = rightYAxisConfig || {};
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

          <XAxis
            dataKey={xConfig.dataKey}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickFormatter={xConfig.formatter}
            label={
              xConfig.label
                ? {
                    value: xConfig.label,
                    position: "insideBottom",
                    offset: -10,
                  }
                : undefined
            }
          />

          <YAxis
            yAxisId="left"
            orientation="left"
            tick={{ fontSize: 12, fill: "#64748b" }}
            label={
              leftYConfig.label
                ? {
                    value: leftYConfig.label,
                    angle: -90,
                    position: "insideLeft",
                  }
                : undefined
            }
            domain={leftYConfig.domain}
          />

          {(bars.some((bar) => bar.yAxisId === "right") ||
            lines.some((line) => line.yAxisId === "right")) && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: "#64748b" }}
              label={
                rightYConfig.label
                  ? {
                      value: rightYConfig.label,
                      angle: 90,
                      position: "insideRight",
                    }
                  : undefined
              }
              domain={rightYConfig.domain}
            />
          )}

          {/* Reference Lines */}
          {referenceLines.map((refLine, index) => (
            <ReferenceLine
              key={index}
              y={refLine.value}
              stroke={refLine.color}
              strokeDasharray={refLine.strokeDasharray || "8 8"}
              yAxisId="left"
              label={{ value: refLine.label, position: "insideTopRight" }}
            />
          ))}

          {/* Areas */}
          {areas.map((area, index) => (
            <Area
              key={index}
              yAxisId="left"
              type="monotone"
              dataKey={area.dataKey}
              fill={area.fill}
              stroke={area.stroke}
              strokeWidth={area.strokeWidth || 2}
              strokeDasharray={area.strokeDasharray}
              fillOpacity={area.fillOpacity || 0.6}
              name={area.name}
            />
          ))}

          {/* Bars */}
          {bars.map((bar, index) => (
            <Bar
              key={index}
              yAxisId={bar.yAxisId || "left"}
              dataKey={bar.dataKey}
              fill={bar.fill}
              name={bar.name}
              radius={[2, 2, 0, 0]}
            />
          ))}

          {/* Lines */}
          {lines.map((line, index) => (
            <Line
              key={index}
              yAxisId={line.yAxisId || "left"}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              strokeWidth={line.strokeWidth || 2}
              strokeDasharray={line.strokeDasharray}
              dot={false}
              name={line.name}
            />
          ))}

          {customTooltip ? (
            <Tooltip content={customTooltip as any} />
          ) : (
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "8px",
                color: "white",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
            />
          )}

          <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="rect" />

          {showBrush && (
            <Brush
              dataKey={xConfig.dataKey}
              height={30}
              stroke="#6366f1"
              fill="#f1f5f9"
            />
          )}

          {/* Gradients */}
          <defs>
            <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
            </linearGradient>
          </defs>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComboChart;
