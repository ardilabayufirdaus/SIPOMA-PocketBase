import { useMemo } from "react";
import { CcrParameterData, ParameterSetting } from "../types";
import { useCcrDataCache } from "./useDataCache";

export interface ProcessedDashboardData {
  chartData: Array<{
    timestamp: string;
    production: number;
    efficiency: number;
    quality: number;
    downtime: number;
    energy: number;
  }>;
  keyMetrics: {
    totalProduction: number;
    averageEfficiency: number;
    totalParameters: number;
    activeCopParameters: number;
  };
  copAnalysisData: Array<{
    name: string;
    value: number;
    target: number;
    deviation: number;
  }>;
  productionTrendData: Array<{
    timestamp: string;
    [key: string]: string | number; // Dynamic parameter data
  }>;
}

export const useDashboardDataProcessor = (
  ccrData: CcrParameterData[],
  parameters: ParameterSetting[],
  copParameterIds: string[],
  plantCategory?: string,
  plantUnit?: string,
  selectedProductionParameters?: string[],
  selectedMonth?: number,
  selectedYear?: number
) => {
  const cache = useCcrDataCache();

  const processedData = useMemo((): ProcessedDashboardData => {
    // Check cache first
    const cachedProcessedData = cache.getCachedProcessedData(
      selectedMonth || new Date().getMonth() + 1,
      selectedYear || new Date().getFullYear(),
      plantUnit,
      selectedProductionParameters
    );

    if (cachedProcessedData) {
      console.log("✅ Using cached processed dashboard data");
      return cachedProcessedData as unknown as ProcessedDashboardData;
    }

    console.log("🔄 Processing dashboard data...");
    // Filter parameters based on plant category and unit
    const filteredParameters = parameters.filter((param) => {
      const categoryMatch =
        !plantCategory ||
        plantCategory === "all" ||
        param.category === plantCategory;
      const unitMatch =
        !plantUnit || plantUnit === "all" || param.unit === plantUnit;
      return categoryMatch && unitMatch;
    });

    // Process chart data
    const chartData = ccrData.map((item, index) => {
      const hourlyValues = Object.values(item.hourly_values);
      const avgValue =
        hourlyValues.length > 0
          ? (hourlyValues as number[]).reduce(
              (sum, val) => sum + (Number(val) || 0),
              0
            ) / hourlyValues.length
          : 0;

      // Find corresponding parameter settings for calculations
      const parameterSetting = filteredParameters.find(
        (p) => p.id === item.parameter_id
      );

      // Calculate efficiency based on target vs actual
      const efficiency =
        parameterSetting && parameterSetting.max_value
          ? Math.min(100, (avgValue / parameterSetting.max_value) * 100)
          : avgValue > 0
          ? Math.min(100, avgValue * 10)
          : 0; // Fallback calculation

      // Calculate quality based on deviation from target
      const quality =
        parameterSetting && parameterSetting.max_value
          ? Math.max(
              0,
              100 -
                Math.abs(
                  ((avgValue - parameterSetting.max_value) /
                    parameterSetting.max_value) *
                    100
                )
            )
          : avgValue > 0
          ? Math.min(100, avgValue * 8)
          : 0; // Fallback calculation

      // Calculate downtime based on data availability (lower downtime = more data points)
      const downtime = Math.max(
        0,
        Math.min(24, 24 - hourlyValues.length * 0.5)
      ); // Estimate based on data availability

      // Calculate energy consumption based on production volume
      const energy = avgValue > 0 ? avgValue * 2.5 : 0; // Estimate based on production

      return {
        timestamp: `T${index + 1}`,
        production: avgValue,
        efficiency: Math.round(efficiency * 100) / 100,
        quality: Math.round(quality * 100) / 100,
        downtime: Math.round(downtime * 100) / 100,
        energy: Math.round(energy * 100) / 100,
      };
    });

    // Calculate key metrics
    const totalProduction = ccrData.reduce((sum, item) => {
      const hourlyValues = Object.values(item.hourly_values);
      const avgValue =
        hourlyValues.length > 0
          ? (hourlyValues as number[]).reduce(
              (s, val) => s + (Number(val) || 0),
              0
            ) / hourlyValues.length
          : 0;
      return sum + avgValue;
    }, 0);

    // Calculate average efficiency based on parameter targets
    const efficiencyValues = ccrData.map((item) => {
      const hourlyValues = Object.values(item.hourly_values);
      const avgValue =
        hourlyValues.length > 0
          ? (hourlyValues as number[]).reduce(
              (s, val) => s + (Number(val) || 0),
              0
            ) / hourlyValues.length
          : 0;

      const parameterSetting = filteredParameters.find(
        (p) => p.id === item.parameter_id
      );
      return parameterSetting && parameterSetting.max_value
        ? Math.min(100, (avgValue / parameterSetting.max_value) * 100)
        : avgValue > 0
        ? Math.min(100, avgValue * 10)
        : 0;
    });

    const averageEfficiency =
      efficiencyValues.length > 0
        ? efficiencyValues.reduce((sum, val) => sum + val, 0) /
          efficiencyValues.length
        : 0;

    // Process COP analysis data
    const copAnalysisData = filteredParameters
      .filter((param) => copParameterIds.includes(param.id))
      .map((param) => {
        const data = ccrData.find((d) => d.parameter_id === param.id);
        const hourlyValues = data ? Object.values(data.hourly_values) : [];
        const avgValue =
          hourlyValues.length > 0
            ? (hourlyValues as number[]).reduce(
                (sum, val) => sum + (Number(val) || 0),
                0
              ) / hourlyValues.length
            : 0;

        return {
          name: param.parameter,
          value: avgValue,
          target: param.max_value || 100,
          deviation: param.min_value
            ? ((avgValue - param.min_value) / param.min_value) * 100
            : 0,
        };
      });

    // Process Production Trend data based on selected parameters
    // Calculate total values per day for the selected month
    const productionTrendData: Array<{
      timestamp: string;
      [key: string]: string | number;
    }> = [];

    // Get start and end dates for selected month
    const startDate = new Date(
      selectedYear || new Date().getFullYear(),
      (selectedMonth || new Date().getMonth() + 1) - 1,
      1
    );
    const endDate = new Date(
      selectedYear || new Date().getFullYear(),
      selectedMonth || new Date().getMonth() + 1,
      0
    );

    // Generate all dates in the month
    const datesInMonth: string[] = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      datesInMonth.push(d.toISOString().split("T")[0]);
    }

    // Group data by date and calculate totals
    const dataByDate: { [date: string]: { [paramName: string]: number } } = {};

    // Initialize all dates with empty data
    datesInMonth.forEach((date) => {
      dataByDate[date] = {};
    });

    ccrData
      .filter((item) => {
        const param = parameters.find((p) => p.id === item.parameter_id);
        if (!param) return false;

        // If no parameters selected, show all filtered parameters
        if (
          !selectedProductionParameters ||
          selectedProductionParameters.length === 0
        ) {
          return true;
        }

        // Only show selected parameters
        return selectedProductionParameters.includes(param.id);
      })
      .forEach((item) => {
        const param = parameters.find((p) => p.id === item.parameter_id);
        if (!param) return;

        const paramName = param.parameter;
        const hourlyValues = Object.values(item.hourly_values);

        // Use the actual date from the data
        const itemDate = item.date;

        if (!dataByDate[itemDate]) {
          dataByDate[itemDate] = {};
        }

        // Calculate total for the day (sum of all hourly values)
        const totalValue =
          hourlyValues.length > 0
            ? (hourlyValues as number[]).reduce(
                (sum, val) => sum + (Number(val) || 0),
                0
              )
            : 0;

        dataByDate[itemDate][paramName] =
          (dataByDate[itemDate][paramName] || 0) + totalValue;
      });

    // Convert grouped data to chart format - include all dates in month
    datesInMonth.forEach((date) => {
      const paramValues = dataByDate[date] || {};

      // Ensure all parameters have values (0 if no data)
      const chartDataPoint: {
        timestamp: string;
        [key: string]: string | number;
      } = {
        timestamp: date,
      };

      // Add values for all parameters, defaulting to 0 if no data
      let parametersToShow = filteredParameters;

      // If specific parameters are selected, only show those
      if (
        selectedProductionParameters &&
        selectedProductionParameters.length > 0
      ) {
        parametersToShow = filteredParameters.filter((param) =>
          selectedProductionParameters.includes(param.id)
        );
      }

      parametersToShow.forEach((param) => {
        chartDataPoint[param.parameter] = paramValues[param.parameter] || 0;
      });

      productionTrendData.push(chartDataPoint);
    });

    // Sort by date (already sorted since we used datesInMonth order)
    productionTrendData.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const result = {
      chartData,
      keyMetrics: {
        totalProduction,
        averageEfficiency,
        totalParameters: filteredParameters.length,
        activeCopParameters: copParameterIds.length,
      },
      copAnalysisData,
      productionTrendData,
    };

    // Cache the processed data
    cache.setCachedProcessedData(
      selectedMonth || new Date().getMonth() + 1,
      selectedYear || new Date().getFullYear(),
      plantUnit,
      selectedProductionParameters,
      result
    );

    return result;
  }, [
    ccrData,
    parameters,
    copParameterIds,
    plantCategory,
    plantUnit,
    selectedProductionParameters,
    cache,
  ]);

  return processedData;
};
