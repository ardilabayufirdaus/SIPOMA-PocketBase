import { useMemo } from "react";
import { ParameterSetting } from "../types";

export interface ProductionTrendDataPoint {
  timestamp: string;
  [key: string]: string | number;
}

export const useProductionTrendData = (
  footerData: any[],
  parameters: ParameterSetting[],
  selectedProductionParameters: string[],
  selectedMonth: number,
  selectedYear: number,
  plantUnit?: string,
  plantCategory?: string
) => {
  const productionTrendData = useMemo((): ProductionTrendDataPoint[] => {
    console.log("🔍 Production Trend Data Processor Input:", {
      footerDataCount: footerData.length,
      parametersCount: parameters.length,
      selectedProductionParameters,
      selectedMonth,
      selectedYear,
      plantUnit,
      plantCategory,
      sampleFooterData: footerData.slice(0, 3),
    });

    // Get start and end dates for selected month
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0);

    // Generate all dates in the month
    const datesInMonth: string[] = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      datesInMonth.push(d.toISOString().split("T")[0]);
    }

    // Group footer data by date and parameter
    const dataByDate: { [date: string]: { [paramName: string]: number } } = {};

    // Initialize all dates with empty data
    datesInMonth.forEach((date) => {
      dataByDate[date] = {};
    });

    // Filter footer data based on selected parameters and plant unit
    const filteredFooterData = footerData.filter((item) => {
      // Filter by plant unit if specified
      if (plantUnit && plantUnit !== "all" && item.plant_unit !== plantUnit) {
        return false;
      }

      // Filter by plant category if specified (need to match with parameter category)
      if (plantCategory && plantCategory !== "all") {
        const param = parameters.find((p) => p.id === item.parameter_id);
        if (param && param.category !== plantCategory) {
          return false;
        }
      }

      // If no parameters selected, show all
      if (
        !selectedProductionParameters ||
        selectedProductionParameters.length === 0
      ) {
        return true;
      }

      // Only show selected parameters
      return selectedProductionParameters.includes(item.parameter_id);
    });

    console.log("🔍 Filtered footer data:", {
      filteredCount: filteredFooterData.length,
      selectedProductionParameters,
      plantUnit,
      plantCategory,
      sampleFilteredData: filteredFooterData.slice(0, 3),
      uniqueParameterIds: [
        ...new Set(filteredFooterData.map((item) => item.parameter_id)),
      ],
    });

    // Group data by date
    filteredFooterData.forEach((item) => {
      const param = parameters.find((p) => p.id === item.parameter_id);
      if (!param) {
        console.log("🔍 Parameter not found for footer item:", {
          parameterId: item.parameter_id,
          availableParameterIds: parameters.map((p) => p.id).slice(0, 10),
          item,
        });
        return;
      }

      const paramName = param.parameter;
      const itemDate = item.date;

      if (!dataByDate[itemDate]) {
        dataByDate[itemDate] = {};
      }

      // Use parameter ID as part of the key to avoid conflicts with duplicate parameter names
      const key = `${param.parameter}_${param.id}`;
      const totalValue = item.total || 0;
      dataByDate[itemDate][key] = totalValue;

      console.log("🔍 Processing footer item:", {
        parameterId: item.parameter_id,
        paramName,
        date: itemDate,
        total: totalValue,
      });
    });

    // Convert grouped data to chart format
    const result: ProductionTrendDataPoint[] = datesInMonth.map((date) => {
      const paramValues = dataByDate[date] || {};

      const chartDataPoint: ProductionTrendDataPoint = {
        timestamp: date,
      };

      // Add values for all selected parameters, defaulting to 0 if no data
      let parametersToShow = parameters;

      // If specific parameters are selected, only show those
      if (
        selectedProductionParameters &&
        selectedProductionParameters.length > 0
      ) {
        parametersToShow = parameters.filter((param) =>
          selectedProductionParameters.includes(param.id)
        );
      }

      console.log("🔍 Converting data for date:", date, {
        paramValuesKeys: Object.keys(paramValues),
        parametersToShowCount: parametersToShow.length,
      });

      parametersToShow.forEach((param) => {
        const key = `${param.parameter}_${param.id}`;
        chartDataPoint[param.parameter] = paramValues[key] || 0;
      });

      return chartDataPoint;
    });

    console.log("🔍 Final Production Trend Data from Footer:", {
      resultCount: result.length,
      sampleData: result.slice(0, 5),
      dataByDateKeys: Object.keys(dataByDate),
      sampleDataByDate: Object.entries(dataByDate)
        .slice(0, 3)
        .map(([date, values]) => ({
          date,
          values,
          valueKeys: Object.keys(values),
        })),
    });

    return result;
  }, [
    footerData,
    parameters,
    selectedProductionParameters,
    selectedMonth,
    selectedYear,
    plantUnit,
    plantCategory,
  ]);

  return { productionTrendData };
};
