import { useMemo } from 'react';
import { ParameterSetting } from '../types';

export interface ProductionTrendDataPoint {
  timestamp: string;
  [key: string]: string | number;
}

export const useProductionTrendData = (
  footerData: any[],
  parameters: ParameterSetting[],
  selectedMonth: number,
  selectedYear: number,
  plantUnit?: string,
  plantCategory?: string
) => {
  const productionTrendData = useMemo((): ProductionTrendDataPoint[] => {
    // Fixed parameters for Production Trend
    const fixedParameterIds = [
      'a3f7b380-1cad-41f3-b459-802d4c33da54', // CM 220
      'fb58e1a8-d808-46fc-8123-c3a33899dfcc', // CM 320
      '8d1d2e1e-b003-44f1-a946-50aed6b44fe8', // CM 419
      '14bf978b-5f5f-4279-b0c1-b91eb8a28e3a', // CM 420
      '0917556b-e2b7-466b-bc55-fc3a79bb9a25', // CM 552
      'fe1548c9-2ee5-44a8-9105-3fa2922438f4', // CM 552
    ];

    // Get start and end dates for selected month
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0);

    // Generate all dates in the month
    const datesInMonth: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      datesInMonth.push(d.toISOString().split('T')[0]);
    }

    // Group footer data by date and parameter
    const dataByDate: { [date: string]: { [paramName: string]: number } } = {};

    // Initialize all dates with empty data
    datesInMonth.forEach((date) => {
      dataByDate[date] = {};
    });

    // Filter footer data based on fixed parameters and plant unit
    const filteredFooterData = footerData.filter((item) => {
      // Filter by plant unit if specified
      if (plantUnit && plantUnit !== 'all' && item.plant_unit !== plantUnit) {
        return false;
      }

      // Filter by plant category if specified (need to match with parameter category)
      if (plantCategory && plantCategory !== 'all') {
        const param = parameters.find((p) => p.id === item.parameter_id);
        if (param && param.category !== plantCategory) {
          return false;
        }
      }

      // Only show fixed parameters
      return fixedParameterIds.includes(item.parameter_id);
    });

    // Group data by date
    filteredFooterData.forEach((item) => {
      const param = parameters.find((p) => p.id === item.parameter_id);
      if (!param) {
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
    });

    // Convert grouped data to chart format
    const result: ProductionTrendDataPoint[] = datesInMonth.map((date) => {
      const paramValues = dataByDate[date] || {};

      const chartDataPoint: ProductionTrendDataPoint = {
        timestamp: date,
      };

      // Add values for all fixed parameters, defaulting to 0 if no data
      const parametersToShow = parameters.filter((param) => fixedParameterIds.includes(param.id));

      parametersToShow.forEach((param) => {
        const key = `${param.parameter}_${param.id}`;
        chartDataPoint[param.parameter] = paramValues[key] || 0;
      });

      return chartDataPoint;
    });

    return result;
  }, [footerData, parameters, selectedMonth, selectedYear, plantUnit, plantCategory]);

  return { productionTrendData };
};
