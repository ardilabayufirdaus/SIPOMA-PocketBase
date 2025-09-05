import React, { useState, useMemo, useEffect } from "react";
import { useCopParametersSupabase } from "../../hooks/useCopParametersSupabase";
import { useParameterSettings } from "../../hooks/useParameterSettings";
import { useCcrParameterData } from "../../hooks/useCcrParameterData";
import { ParameterDataType, ParameterSetting } from "../../types";
import { formatDate } from "../../utils/formatters";
import { usePlantUnits } from "../../hooks/usePlantUnits";

interface AnalysisDataRow {
  parameter: ParameterSetting;
  dailyValues: { value: number | null; raw: number | undefined }[];
  monthlyAverage: number | null;
  monthlyAverageRaw: number | null;
}

const CopAnalysisPage: React.FC<{ t: any }> = ({ t }) => {
  // ...existing code...
  const { copParameterIds } = useCopParametersSupabase();
  const { records: allParameters } = useParameterSettings();
  useEffect(() => {
    // DEBUG copParameterIds: copParameterIds
    // DEBUG allParameters: allParameters
  }, [copParameterIds, allParameters]);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const { records: plantUnits } = usePlantUnits();
  // Set default filter so not all parameters are shown for all categories/units
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");

  // Set default filter only after plantUnits are loaded
  useEffect(() => {
    if (plantUnits && plantUnits.length > 0) {
      if (!selectedCategory) {
        setSelectedCategory(plantUnits[0].category);
      }
    }
  }, [plantUnits, selectedCategory]);

  useEffect(() => {
    if (plantUnits && plantUnits.length > 0 && selectedCategory) {
      const units = plantUnits
        .filter((u) => u.category === selectedCategory)
        .map((u) => u.unit);
      if (units.length > 0 && !selectedUnit) {
        setSelectedUnit(units[0]);
      }
    }
  }, [plantUnits, selectedCategory, selectedUnit]);

  const unitsForCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return plantUnits
      .filter((unit) => unit.category === selectedCategory)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, selectedCategory]);

  useEffect(() => {
    if (unitsForCategory.length > 0) {
      if (!selectedUnit || !unitsForCategory.includes(selectedUnit)) {
        setSelectedUnit(unitsForCategory[0]);
      }
    } else {
      setSelectedUnit("");
    }
  }, [unitsForCategory, selectedUnit]);

  const plantCategories = useMemo(
    () => [...new Set(plantUnits.map((unit) => unit.category).sort())],
    [plantUnits]
  );
  const unitToCategoryMap = useMemo(
    () => new Map(plantUnits.map((pu) => [pu.unit, pu.category])),
    [plantUnits]
  );

  const formatCopNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined || isNaN(num)) {
      return "-";
    }
    // Use 'de-DE' locale to get dot as thousand separator and comma as decimal separator.
    return num.toLocaleString("de-DE", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  };

  useEffect(() => {
    // DEBUG copParameterIds: copParameterIds
    // DEBUG allParameters: allParameters
  }, [copParameterIds, allParameters]);

  useEffect(() => {
    // DEBUG copParameterIds: copParameterIds
    // DEBUG allParameters: allParameters
  }, [copParameterIds, allParameters]);

  // ...existing code...

  // ...existing code...
  const { getDataForDate } = useCcrParameterData();
  const [analysisData, setAnalysisData] = useState<AnalysisDataRow[]>([]);

  useEffect(() => {
    const fetchDataAndAnalyze = async () => {
      const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
      const dates = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(Date.UTC(filterYear, filterMonth, i + 1));
        return date.toISOString().split("T")[0];
      });

      const dailyAverages = new Map<string, Map<string, number>>();

      const dataPromises = dates.map((dateString) =>
        getDataForDate(dateString)
      );
      const allDataForMonth = await Promise.all(dataPromises);

      allDataForMonth.flat().forEach((paramData) => {
        // FIX: Use snake_case property `parameter_id`
        const paramSetting = allParameters.find(
          (p) => p.id === paramData.parameter_id
        );
        // FIX: Use snake_case property `data_type`
        if (
          paramSetting &&
          paramSetting.data_type === ParameterDataType.NUMBER
        ) {
          // FIX: Use snake_case property `hourly_values`
          const values = Object.values(paramData.hourly_values)
            .map((v) => Number(v))
            .filter((v) => !isNaN(v));
          if (values.length > 0) {
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            // FIX: Use snake_case property `parameter_id`
            if (!dailyAverages.has(paramData.parameter_id)) {
              // FIX: Use snake_case property `parameter_id`
              dailyAverages.set(paramData.parameter_id, new Map());
            }
            // FIX: Use snake_case property `parameter_id`
            dailyAverages.get(paramData.parameter_id)!.set(paramData.date, avg);
          }
        }
      });

      const filteredCopIds = copParameterIds.filter((paramId) => {
        const parameter = allParameters.find((p) => p.id === paramId);
        if (!parameter) return false;

        // Pastikan filter benar-benar sesuai dengan plant category dan unit
        // parameter.unit = unit, parameter.category = category
        const categoryMatch =
          !selectedCategory || parameter.category === selectedCategory;
        const unitMatch = !selectedUnit || parameter.unit === selectedUnit;

        return categoryMatch && unitMatch;
      });

      const data = filteredCopIds
        .map((paramId) => {
          const parameter = allParameters.find((p) => p.id === paramId);
          if (!parameter) return null;

          const dailyValues = dates.map((dateString) => {
            const avg = dailyAverages.get(paramId)?.get(dateString);
            // FIX: Use snake_case properties `min_value` and `max_value`
            const { min_value, max_value } = parameter;

            if (
              avg === undefined ||
              min_value === undefined ||
              max_value === undefined ||
              max_value <= min_value
            ) {
              return { value: null, raw: avg };
            }

            const percentage =
              ((avg - min_value) / (max_value - min_value)) * 100;
            return { value: percentage, raw: avg };
          });

          const validDailyPercentages = dailyValues
            .map((d) => d.value)
            .filter((v): v is number => v !== null);
          const monthlyAverage =
            validDailyPercentages.length > 0
              ? validDailyPercentages.reduce((a, b) => a + b, 0) /
                validDailyPercentages.length
              : null;

          const validDailyRaw = dailyValues
            .map((d) => d.raw)
            .filter((v): v is number => v !== undefined && v !== null);
          const monthlyAverageRaw =
            validDailyRaw.length > 0
              ? validDailyRaw.reduce((a, b) => a + b, 0) / validDailyRaw.length
              : null;

          return {
            parameter,
            dailyValues,
            monthlyAverage,
            monthlyAverageRaw,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      setAnalysisData(data);
    };

    if (allParameters.length > 0) {
      fetchDataAndAnalyze();
    }
  }, [
    filterMonth,
    filterYear,
    copParameterIds,
    allParameters,
    getDataForDate,
    selectedCategory,
    selectedUnit,
    unitToCategoryMap,
  ]);

  const dailyQaf = useMemo(() => {
    if (!analysisData || analysisData.length === 0) {
      return { daily: [], monthly: { value: null, inRange: 0, total: 0 } };
    }

    const daysInMonth = analysisData[0]?.dailyValues.length || 0;
    if (daysInMonth === 0) {
      return { daily: [], monthly: { value: null, inRange: 0, total: 0 } };
    }

    const dailyStats: {
      value: number | null;
      inRange: number;
      total: number;
    }[] = [];
    let totalInRangeMonthly = 0;
    let totalWithValueMonthly = 0;

    for (let i = 0; i < daysInMonth; i++) {
      let paramsInRange = 0;
      let totalParamsWithValue = 0;

      analysisData.forEach((paramRow) => {
        const dayValue = paramRow.dailyValues[i]?.value;
        if (dayValue !== null && dayValue !== undefined) {
          totalParamsWithValue++;
          if (dayValue >= 0 && dayValue <= 100) {
            paramsInRange++;
          }
        }
      });

      totalInRangeMonthly += paramsInRange;
      totalWithValueMonthly += totalParamsWithValue;

      if (totalParamsWithValue > 0) {
        dailyStats.push({
          value: (paramsInRange / totalParamsWithValue) * 100,
          inRange: paramsInRange,
          total: totalParamsWithValue,
        });
      } else {
        dailyStats.push({ value: null, inRange: 0, total: 0 });
      }
    }

    const monthlyQafValue =
      totalWithValueMonthly > 0
        ? (totalInRangeMonthly / totalWithValueMonthly) * 100
        : null;

    return {
      daily: dailyStats,
      monthly: {
        value: monthlyQafValue,
        inRange: totalInRangeMonthly,
        total: totalWithValueMonthly,
      },
    };
  }, [analysisData]);

  const getPercentageColor = (
    percentage: number | null
  ): { bg: string; text: string; darkBg: string; status: string } => {
    if (percentage === null)
      return {
        bg: "bg-slate-50",
        text: "text-slate-500",
        darkBg: "bg-slate-700",
        status: "N/A",
      };
    if (percentage < 0)
      return {
        bg: "bg-red-100",
        text: "text-red-800",
        darkBg: "bg-red-500",
        status: "Low",
      }; // Too Low = Red
    if (percentage > 100)
      return {
        bg: "bg-amber-100",
        text: "text-amber-800",
        darkBg: "bg-amber-500",
        status: "High",
      }; // Too High = Yellow
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      darkBg: "bg-emerald-500",
      status: "Normal",
    }; // In Range = Green
  };

  const getQafColor = (qaf: number | null): { bg: string; text: string } => {
    if (qaf === null) return { bg: "bg-slate-100", text: "text-slate-600" };
    if (qaf >= 95) return { bg: "bg-emerald-100", text: "text-emerald-800" };
    if (qaf >= 85) return { bg: "bg-amber-100", text: "text-amber-800" };
    return { bg: "bg-red-100", text: "text-red-800" };
  };

  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label:
      t[
        `month_${
          [
            "jan",
            "feb",
            "mar",
            "apr",
            "may",
            "jun",
            "jul",
            "aug",
            "sep",
            "oct",
            "nov",
            "dec",
          ][i]
        }`
      ],
  }));

  const daysHeader =
    analysisData[0]?.dailyValues.map((_, index) => index + 1) ||
    Array.from(
      { length: new Date(filterYear, filterMonth + 1, 0).getDate() },
      (_, i) => i + 1
    );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-800">
            {t.op_cop_analysis}
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="w-full sm:w-48">
              <label htmlFor="cop-filter-category" className="sr-only">
                {t.plant_category_label}
              </label>
              <select
                id="cop-filter-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base bg-white text-slate-900 border-slate-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
              >
                {plantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-48">
              <label htmlFor="cop-filter-unit" className="sr-only">
                {t.unit_label}
              </label>
              <select
                id="cop-filter-unit"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base bg-white text-slate-900 border-slate-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                disabled={unitsForCategory.length === 0}
              >
                {unitsForCategory.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-48">
              <label htmlFor="cop-filter-month" className="sr-only">
                {t.filter_by_month}
              </label>
              <select
                id="cop-filter-month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                className="block w-full pl-3 pr-10 py-2 text-base bg-white text-slate-900 border-slate-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-32">
              <label htmlFor="cop-filter-year" className="sr-only">
                {t.filter_by_year}
              </label>
              <select
                id="cop-filter-year"
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                className="block w-full pl-3 pr-10 py-2 text-base bg-white text-slate-900 border-slate-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-slate-100">
              <tr>
                <th className="sticky left-0 bg-slate-100 z-30 px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-r border-slate-200">
                  No.
                </th>
                <th className="sticky left-12 bg-slate-100 z-30 px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-r border-slate-200 min-w-[200px]">
                  {t.parameter}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-r border-slate-200">
                  {t.min}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-r border-slate-200">
                  {t.max}
                </th>
                {daysHeader.map((day) => (
                  <th
                    key={day}
                    className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-r border-slate-200 w-14"
                  >
                    {day}
                  </th>
                ))}
                <th className="sticky right-0 bg-slate-100 z-30 px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-l-2 border-slate-300">
                  Avg.
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {analysisData.map((row, rowIndex) => (
                <tr key={row.parameter.id} className="group">
                  <td className="sticky left-0 z-20 px-4 py-2 whitespace-nowrap text-slate-500 border-b border-r border-slate-200 bg-white group-hover:bg-slate-50">
                    {rowIndex + 1}
                  </td>
                  <td className="sticky left-12 z-20 px-4 py-2 whitespace-nowrap font-medium text-slate-800 border-b border-r border-slate-200 bg-white group-hover:bg-slate-50">
                    {row.parameter.parameter}
                  </td>
                  {/* FIX: Use snake_case properties `min_value` and `max_value` */}
                  <td className="px-4 py-2 whitespace-nowrap text-center text-slate-600 border-b border-r border-slate-200">
                    {formatCopNumber(row.parameter.min_value)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center text-slate-600 border-b border-r border-slate-200">
                    {formatCopNumber(row.parameter.max_value)}
                  </td>
                  {row.dailyValues.map((day, dayIndex) => {
                    const colors = getPercentageColor(day.value);
                    return (
                      <td
                        key={dayIndex}
                        className={`relative px-2 py-1.5 whitespace-nowrap text-center border-b border-r border-slate-200 transition-colors duration-150 ${colors.bg}`}
                      >
                        <div className="relative group/cell h-full w-full flex items-center justify-center">
                          <span className={`font-medium ${colors.text}`}>
                            {formatCopNumber(day.raw)}
                          </span>
                          {day.raw !== undefined && (
                            <div className="absolute bottom-full mb-2 w-max max-w-xs bg-slate-800 text-white text-xs rounded py-1.5 px-3 opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-30 shadow-lg">
                              <div className="flex items-center justify-between gap-4">
                                <span className="font-bold">
                                  {formatDate(
                                    new Date(
                                      Date.UTC(
                                        filterYear,
                                        filterMonth,
                                        dayIndex + 1
                                      )
                                    )
                                  )}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-white text-[10px] uppercase ${colors.darkBg}`}
                                >
                                  {colors.status}
                                </span>
                              </div>
                              <hr className="border-slate-600 my-1" />
                              <p>
                                <strong>{t.average}:</strong>{" "}
                                <span className="font-mono">
                                  {formatCopNumber(day.raw)}{" "}
                                  {row.parameter.unit}
                                </span>
                              </p>
                              {/* FIX: Use snake_case properties `min_value` and `max_value` */}
                              <p>
                                <strong>Target:</strong>{" "}
                                <span className="font-mono">
                                  {formatCopNumber(row.parameter.min_value)} -{" "}
                                  {formatCopNumber(row.parameter.max_value)}
                                </span>
                              </p>
                              {day.value !== null && (
                                <p>
                                  <strong>Normalized:</strong>{" "}
                                  <span className="font-mono">
                                    {day.value.toFixed(1)}%
                                  </span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  {(() => {
                    const avgColors = getPercentageColor(row.monthlyAverage);
                    return (
                      <td
                        className={`sticky right-0 z-20 px-4 py-2 whitespace-nowrap text-center font-bold border-b border-l-2 border-slate-300 transition-colors duration-150 ${avgColors.bg} group-hover:bg-slate-100`}
                      >
                        <span className={avgColors.text}>
                          {formatCopNumber(row.monthlyAverageRaw)}
                        </span>
                      </td>
                    );
                  })()}
                </tr>
              ))}
              {analysisData.length === 0 && (
                <tr>
                  <td
                    colSpan={daysHeader.length + 5}
                    className="text-center py-10 text-slate-500"
                  >
                    No COP parameters selected or no data available.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="font-semibold">
              <tr className="border-t-2 border-slate-300">
                <td
                  colSpan={4}
                  className="sticky left-0 z-20 px-4 py-3 text-right text-sm text-slate-700 border-b border-r border-slate-200 bg-slate-100"
                >
                  {t.qaf_daily}
                </td>
                {dailyQaf.daily.map((qaf, index) => {
                  const colors = getQafColor(qaf.value);
                  return (
                    <td
                      key={index}
                      className={`px-2 py-3 text-center border-b border-r border-slate-200 ${colors.bg} ${colors.text}`}
                    >
                      <div className="relative group/cell h-full w-full flex items-center justify-center">
                        <span>
                          {qaf.value !== null
                            ? `${formatCopNumber(qaf.value)}%`
                            : "-"}
                        </span>
                        {qaf.total > 0 && (
                          <div className="absolute bottom-full mb-2 w-max max-w-xs bg-slate-800 text-white text-xs rounded py-1.5 px-3 opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-30 shadow-lg">
                            {t.qaf_tooltip
                              ?.replace("{inRange}", qaf.inRange)
                              .replace("{total}", qaf.total)}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
                {(() => {
                  const qaf = dailyQaf.monthly;
                  const colors = getQafColor(qaf.value);
                  return (
                    <td
                      className={`sticky right-0 z-20 px-4 py-3 text-center border-b border-l-2 border-slate-300 ${colors.bg} ${colors.text}`}
                    >
                      <div className="relative group/cell h-full w-full flex items-center justify-center">
                        <span>
                          {qaf.value !== null
                            ? `${formatCopNumber(qaf.value)}%`
                            : "-"}
                        </span>
                        {qaf.total > 0 && (
                          <div className="absolute bottom-full mb-2 w-max max-w-xs bg-slate-800 text-white text-xs rounded py-1.5 px-3 opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-30 left-1/2 -translate-x-1/2 shadow-lg">
                            {t.qaf_tooltip
                              ?.replace("{inRange}", qaf.inRange)
                              .replace("{total}", qaf.total)}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })()}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CopAnalysisPage;
