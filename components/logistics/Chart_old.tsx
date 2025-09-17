import React from "react";

export interface ChartProps {
  chartType: "line" | "bar" | "combo";
  performanceData: any;
  showTrend: boolean;
  showComparison: boolean;
  COLORS: string[];
  filterYear: number;
  filterMonth: number;
  chartRef: React.RefObject<HTMLDivElement>;
  handleDaySelection: (e: React.MouseEvent) => void;
  handleChartHover: (e: React.MouseEvent) => void;
  handleMouseLeaveChart: () => void;
  hoveredInfo: any;
  formatDate: (date: Date) => string;
  formatNumber: (n: number) => string;
}

export const Chart: React.FC<ChartProps> = ({
  chartType,
  performanceData,
  showTrend,
  showComparison,
  COLORS,
  filterYear,
  filterMonth,
  chartRef,
  handleDaySelection,
  handleChartHover,
  handleMouseLeaveChart,
  hoveredInfo,
  formatDate,
  formatNumber,
}) => (
  <div
    className="h-80 w-full relative cursor-pointer overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg"
    ref={chartRef}
    onClick={handleDaySelection}
    onMouseMove={handleChartHover}
    onMouseLeave={handleMouseLeaveChart}
    style={{ position: "relative" }}
  >
    <div className="text-center text-slate-500 dark:text-slate-400">
      <div className="text-lg font-medium mb-2">Chart Component</div>
      <div className="text-sm">
        {chartType === "line" && "Line Chart"}
        {chartType === "bar" && "Bar Chart"}
        {chartType === "combo" && "Combo Chart"}
        {" - Implementation with Chart.js pending"}
      </div>
    </div>
  </div>
);

export interface ChartProps {
  chartType: "line" | "bar" | "combo";
  performanceData: any;
  showTrend: boolean;
  showComparison: boolean;
  COLORS: string[];
  filterYear: number;
  filterMonth: number;
  chartRef: React.RefObject<HTMLDivElement>;
  handleDaySelection: (e: React.MouseEvent) => void;
  handleChartHover: (e: React.MouseEvent) => void;
  handleMouseLeaveChart: () => void;
  hoveredInfo: any;
  formatDate: (date: Date) => string;
  formatNumber: (n: number) => string;
}

export const Chart: React.FC<ChartProps> = ({
  chartType,
  performanceData,
  showTrend,
  showComparison,
  COLORS,
  filterYear,
  filterMonth,
  chartRef,
  handleDaySelection,
  handleChartHover,
  handleMouseLeaveChart,
  hoveredInfo,
  formatDate,
  formatNumber,
}) => (
  <div
    className="h-80 w-full relative cursor-pointer overflow-hidden"
    ref={chartRef}
    onClick={handleDaySelection}
    onMouseMove={handleChartHover}
    onMouseLeave={handleMouseLeaveChart}
    style={{ position: "relative" }}
  >
    {chartType === "line" || chartType === "combo" ? (
      <ResponsiveLine
        data={[
          ...performanceData.displayedAreas.map((area, index) => ({
            id: area || `Area ${index}`,
            data:
              performanceData.chartData[area]?.map((d) => ({
                x: d?.day || 0,
                y: d?.stock_out || 0,
              })) || [],
          })),
          ...(showTrend
            ? performanceData.displayedAreas.map((area, index) => ({
                id: `${area || `Area ${index}`} (Trend)`,
                data:
                  performanceData.trendData[area]?.map((d) => ({
                    x: d?.day || 0,
                    y: d?.moving_average || 0,
                  })) || [],
              }))
            : []),
          ...(showComparison
            ? performanceData.displayedAreas.map((area, index) => ({
                id: `${area || `Area ${index}`} (Prev Month)`,
                data:
                  performanceData.comparisonData[area]?.map((d, dayIndex) => ({
                    x: dayIndex + 1,
                    y: d?.stock_out || 0,
                  })) || [],
              }))
            : []),
        ]}
        margin={{ top: 20, right: 30, bottom: 60, left: 70 }}
        xScale={{ type: "point" }}
        yScale={{
          type: "linear",
          min: "auto",
          max: "auto",
          stacked: false,
        }}
        axisBottom={{
          legend: "Day of Month",
          legendPosition: "middle",
          legendOffset: 40,
          tickRotation: -45,
        }}
        axisLeft={{
          legend: "Stock Out (Ton)",
          legendPosition: "middle",
          legendOffset: -50,
        }}
        colors={(serie) => {
          const serieIdStr = serie.id?.toString() || "";
          const areaIndex = performanceData.displayedAreas.findIndex((area) =>
            serieIdStr.startsWith(area || "")
          );
          const validAreaIndex = areaIndex >= 0 ? areaIndex : 0;
          if (serieIdStr.includes("(Trend)")) return "#64748B";
          if (serieIdStr.includes("(Prev Month)"))
            return COLORS[validAreaIndex % COLORS.length] + "80";
          return COLORS[validAreaIndex % COLORS.length];
        }}
        pointSize={chartType === "combo" ? 4 : 6}
        pointColor={{ theme: "background" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        enableArea={!showComparison}
        areaOpacity={0.1}
        useMesh={true}
        enableSlices="x"
        sliceTooltip={({ slice }) => (
          <div
            style={{
              padding: 8,
              background: "#1E293B",
              color: "#fff",
              borderRadius: 4,
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
              maxWidth: "200px",
              fontSize: "12px",
              zIndex: 1000,
            }}
          >
            <div className="font-semibold mb-1 text-xs">
              Day {slice.points[0].data.x}
            </div>
            <div className="max-h-32 overflow-y-auto">
              {[...slice.points]
                .sort((a, b) => (b.data.y as number) - (a.data.y as number))
                .slice(0, 6)
                .map((point) => {
                  const serieId = point.seriesId?.toString() || "Unknown";
                  return (
                    <div
                      key={point.id}
                      style={{
                        color: point.seriesColor,
                        marginBottom: 2,
                        fontSize: "11px",
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span
                          className="truncate mr-2"
                          style={{ maxWidth: "80px" }}
                        >
                          {serieId.length > 10
                            ? serieId.substring(0, 10) + "..."
                            : serieId}
                        </span>
                        <span className="font-semibold text-right">
                          {formatNumber(point.data.y as number)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              {slice.points.length > 6 && (
                <div className="text-xs text-gray-400 mt-1">
                  +{slice.points.length - 6} more areas...
                </div>
              )}
            </div>
          </div>
        )}
        theme={{
          background: "#FFFFFF",
          text: { fill: "#374151", fontSize: 12 },
          axis: {
            domain: { line: { stroke: "#D1D5DB", strokeWidth: 1 } },
            ticks: {
              line: { stroke: "#D1D5DB", strokeWidth: 1 },
              text: { fill: "#374151" },
            },
            legend: { text: { fill: "#374151" } },
          },
          grid: { line: { stroke: "#E5E7EB", strokeWidth: 1 } },
          legends: { text: { fill: "#374151" } },
          tooltip: {
            container: {
              background: "#1E293B",
              color: "#FFFFFF",
              fontSize: 12,
              borderRadius: 4,
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            },
          },
          crosshair: {
            line: { stroke: "#DC2626", strokeWidth: 2, strokeOpacity: 0.5 },
          },
        }}
      />
    ) : (
      <ResponsiveBar
        data={performanceData.chartData[performanceData.displayedAreas[0]]?.map(
          (d, index) => {
            const result: any = { day: `Day ${d?.day || index + 1}` };
            performanceData.displayedAreas.forEach((area) => {
              const areaData = performanceData.chartData[area]?.[index];
              result[area || `Area_${index}`] = areaData?.stock_out || 0;
            });
            return result;
          }
        )}
        keys={performanceData.displayedAreas}
        indexBy="day"
        margin={{ top: 20, right: 30, bottom: 60, left: 70 }}
        padding={0.3}
        valueScale={{ type: "linear" }}
        colors={COLORS}
        borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
        axisBottom={{
          legend: "Day of Month",
          legendPosition: "middle",
          legendOffset: 40,
          tickRotation: -45,
        }}
        axisLeft={{
          legend: "Stock Out (Ton)",
          legendPosition: "middle",
          legendOffset: -50,
        }}
        tooltip={({ id, value, indexValue, color }) => {
          const serieId = id?.toString() || "Unknown";
          return (
            <div
              style={{
                padding: 6,
                background: "#1E293B",
                color: "#fff",
                borderRadius: 4,
                fontSize: "12px",
                maxWidth: "150px",
              }}
            >
              <div className="font-semibold text-xs">
                {serieId.length > 12
                  ? serieId.substring(0, 12) + "..."
                  : serieId}
              </div>
              <div className="text-xs">{formatNumber(value || 0)} Ton</div>
              <div className="text-xs text-gray-300">{indexValue || "N/A"}</div>
            </div>
          );
        }}
        theme={{ grid: { line: { stroke: "#E5E7EB", strokeWidth: 1 } } }}
      />
    )}
    {hoveredInfo && (
      <div
        className="absolute p-2 text-xs text-white bg-slate-800 rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full z-20"
        style={{
          left: `${hoveredInfo.x}px`,
          top: `${hoveredInfo.y}px`,
          maxWidth: "180px",
          fontSize: "11px",
        }}
      >
        <div className="font-semibold text-center mb-1 text-xs">
          {formatDate(new Date(filterYear, filterMonth, hoveredInfo.day))}
        </div>
        <div className="max-h-24 overflow-y-auto space-y-0.5">
          {Object.entries(hoveredInfo.values)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 5)
            .map(([area, value]) => (
              <div
                key={area}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <span
                    className="w-2 h-2 rounded-sm mr-1.5 flex-shrink-0"
                    style={{
                      backgroundColor:
                        COLORS[
                          performanceData.displayedAreas.indexOf(area) %
                            COLORS.length
                        ],
                    }}
                  ></span>
                  <span className="text-slate-300 truncate text-xs">
                    {area.length > 8 ? area.substring(0, 8) + "..." : area}:
                  </span>
                </div>
                <span className="font-bold text-right text-xs flex-shrink-0">
                  {formatNumber(Math.round(value as number))}
                </span>
              </div>
            ))}
          {Object.keys(hoveredInfo.values).length > 5 && (
            <div className="text-xs text-slate-400 text-center mt-1">
              +{Object.keys(hoveredInfo.values).length - 5} more
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);
