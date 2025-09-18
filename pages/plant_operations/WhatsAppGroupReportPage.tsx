import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useCcrParameterData } from '../../hooks/useCcrParameterData';
import { useCcrFooterData } from '../../hooks/useCcrFooterData';
import { useCcrSiloData } from '../../hooks/useCcrSiloData';
import useCcrDowntimeData from '../../hooks/useCcrDowntimeData';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { useParameterSettings } from '../../hooks/useParameterSettings';
import { useAuth } from '../../hooks/useAuth';
import { CcrDowntimeData } from '../../types';

import { EnhancedButton } from '../../components/ui/EnhancedComponents';

interface WhatsAppGroupReportPageProps {
  t: Record<string, string>;
}

const WhatsAppGroupReportPage: React.FC<WhatsAppGroupReportPageProps> = ({ t }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPlantCategory, setSelectedPlantCategory] = useState<string>('Cement Mill');
  const [selectedPlantUnits, setSelectedPlantUnits] = useState<string[]>(['220', '320']);
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);

  // Cache for generated reports
  const reportCache = useMemo(() => new Map<string, string>(), []);

  const { user } = useAuth();

  const { getDataForDate: getParameterData } = useCcrParameterData();
  const { getFooterDataForDate } = useCcrFooterData();
  const { getDataForDate: getSiloData } = useCcrSiloData();
  const { getDowntimeForDate } = useCcrDowntimeData();
  const { records: plantUnits } = usePlantUnits();
  const { records: parameterSettings } = useParameterSettings();

  const plantCategories = useMemo(() => {
    const categories = [...new Set(plantUnits.map((unit) => unit.category))];
    return categories.sort();
  }, [plantUnits]);

  const filteredUnits = useMemo(() => {
    return plantUnits.filter((unit) => unit.category === selectedPlantCategory);
  }, [plantUnits, selectedPlantCategory]);

  // Update selected plant units when category changes
  useEffect(() => {
    const availableUnits = filteredUnits.map((unit) => unit.unit);
    // Keep only units that are still available in the new category
    const validSelectedUnits = selectedPlantUnits.filter((unit) => availableUnits.includes(unit));
    // If no valid units selected, select all available units
    if (validSelectedUnits.length === 0 && availableUnits.length > 0) {
      setSelectedPlantUnits(availableUnits);
    } else if (validSelectedUnits.length !== selectedPlantUnits.length) {
      // Only update if the filtered list is different from current selection
      setSelectedPlantUnits(validSelectedUnits);
    }
  }, [selectedPlantCategory, filteredUnits]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUnitDropdownOpen && !(event.target as Element).closest('.unit-dropdown-container')) {
        setIsUnitDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUnitDropdownOpen]);

  // Helper function to get PIC name from CCR Parameter data
  const getShiftPic = useCallback(async (): Promise<string> => {
    try {
      // For now, return current user as PIC or a placeholder
      // TODO: Implement proper PIC detection from parameter data entry logs
      return user?.email || 'PIC Tidak Diketahui';
    } catch (error) {
      console.error('Error getting shift PIC:', error);
      return 'PIC Tidak Diketahui';
    }
  }, [user]);

  // Helper function to calculate total downtime duration for shift
  const calculateTotalDowntime = useCallback(
    (downtimeData: CcrDowntimeData[]): number => {
      let totalDuration = 0;

      downtimeData.forEach((dt) => {
        if (
          dt.unit &&
          plantUnits.some(
            (unit) => unit.unit === dt.unit && unit.category === selectedPlantCategory
          )
        ) {
          // Calculate duration in hours
          const startTime = new Date(`2000-01-01T${dt.start_time}`);
          const endTime = new Date(`2000-01-01T${dt.end_time}`);
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationHours = durationMs / (1000 * 60 * 60);
          totalDuration += durationHours;
        }
      });

      return totalDuration;
    },
    [plantUnits, selectedPlantCategory]
  );

  // Generate Daily Report sesuai format yang diminta
  const generateDailyReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { date } = { date: selectedDate };

      // Fetch all required data
      const [parameterData, siloData] = await Promise.all([
        getParameterData(date),
        getSiloData(date),
      ]);

      // Debug logging untuk memastikan data parameter dari CCR Parameter Data Entry
      console.log('CCR Parameter Data Entry - Raw Data:', parameterData);
      console.log('Parameter Settings:', parameterSettings);
      console.log('Selected Plant Units:', selectedPlantUnits);

      // Format date
      const reportDate = new Date(date);
      const formattedDate = reportDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      let report = `*Laporan Harian Produksi*\n*${selectedPlantCategory}*\n${formattedDate}\n===============================\n\n`;

      // Plant Units - use selected units
      const plantUnitsFiltered = selectedPlantUnits;

      for (const unit of plantUnitsFiltered) {
        // Filter parameter data based on parameter settings that belong to this unit
        const unitParameterData = parameterData.filter((p) => {
          const paramSetting = parameterSettings.find((setting) => setting.id === p.parameter_id);
          return paramSetting && paramSetting.unit === unit;
        });

        // Debug logging untuk memastikan parameter data yang benar diambil
        console.log(
          `Unit ${unit} - Parameter Data:`,
          unitParameterData.map((p) => ({
            parameter_id: p.parameter_id,
            name: p.name,
            setting: parameterSettings.find((s) => s.id === p.parameter_id),
          }))
        );

        report += `*Plant Unit Cement Mill ${unit}*\n`;

        // Get values from parameter data
        const feedParam = unitParameterData.find((p) => p.name?.toLowerCase().includes('feed'));
        const runningHoursParam = unitParameterData.find(
          (p) =>
            p.name?.toLowerCase().includes('running hours') ||
            p.name?.toLowerCase().includes('jam operasi')
        );

        // Debug logging untuk parameter yang ditemukan
        console.log(`Unit ${unit} - Found Parameters:`, {
          feedParam: feedParam
            ? { parameter_id: feedParam.parameter_id, name: feedParam.name }
            : null,
          runningHoursParam: runningHoursParam
            ? { parameter_id: runningHoursParam.parameter_id, name: runningHoursParam.name }
            : null,
          totalParameters: unitParameterData.length,
        });

        // Calculate averages
        const feedValues = feedParam
          ? (Object.values(feedParam.hourly_values).filter(
              (v) => typeof v === 'number' && !isNaN(v)
            ) as number[])
          : [];
        const feedAvg =
          feedValues.length > 0 ? feedValues.reduce((a, b) => a + b, 0) / feedValues.length : 0;

        const runningHoursValues = runningHoursParam
          ? (Object.values(runningHoursParam.hourly_values).filter(
              (v) => typeof v === 'number' && !isNaN(v)
            ) as number[])
          : [];
        const runningHoursAvg =
          runningHoursValues.length > 0
            ? runningHoursValues.reduce((a, b) => a + b, 0) / runningHoursValues.length
            : 0;

        // Debug logging untuk nilai yang dihitung
        console.log(`Unit ${unit} - Calculated Values:`, {
          feedAvg: feedAvg.toFixed(2),
          runningHoursAvg: runningHoursAvg.toFixed(2),
          feedValues: feedValues,
          runningHoursValues: runningHoursValues,
        });

        // Tipe Produk - menggunakan data dari parameter atau default
        const productType = 'OPC'; // Default, bisa disesuaikan

        report += `Tipe Produk  : ${productType}\n`;
        report += `Feed  : ${feedAvg.toFixed(2)} tph\n`;
        report += `Jam Operasi  : ${runningHoursAvg.toFixed(2)} jam\n`;
        report += `Total Produksi  : ${(feedAvg * runningHoursAvg).toFixed(2)} ton\n\n`;

        // Pemakaian Bahan
        report += `*Pemakaian Bahan*\n`;
        const bahanParams = [
          { name: 'Clinker', param: 'counter feeder clinker' },
          { name: 'Gypsum', param: 'counter feeder gypsum' },
          { name: 'Batu Kapur', param: 'counter feeder limestone' },
          { name: 'Trass', param: 'counter feeder trass' },
          { name: 'FineTrass', param: 'counter feeder fine trass' },
          { name: 'Fly Ash', param: 'counter feeder flyash' },
          { name: 'CKD', param: 'counter feeder ckd' },
        ];

        bahanParams.forEach(({ name, param }) => {
          const bahanData = unitParameterData.find((p) =>
            p.name?.toLowerCase().includes(param.toLowerCase())
          );
          const bahanValues = bahanData
            ? (Object.values(bahanData.hourly_values).filter(
                (v) => typeof v === 'number' && !isNaN(v)
              ) as number[])
            : [];
          const bahanTotal = bahanValues.length > 0 ? bahanValues.reduce((a, b) => a + b, 0) : 0;
          report += `- ${name} : ${bahanTotal.toFixed(2)} ton\n`;
        });

        report += `\n*Setting Feeder*\n`;
        const feederParams = [
          { name: 'Clinker', param: 'set. feeder clinker' },
          { name: 'Gypsum', param: 'set. feeder gypsum' },
          { name: 'Batu Kapur', param: 'set. feeder limestone' },
          { name: 'Trass', param: 'set. feeder trass' },
          { name: 'FineTrass', param: 'set. feeder fine trass' },
          { name: 'Fly Ash', param: 'set. feeder flyash' },
          { name: 'CKD', param: 'set. feeder ckd' },
        ];

        feederParams.forEach(({ name, param }) => {
          const feederData = unitParameterData.find((p) =>
            p.name?.toLowerCase().includes(param.toLowerCase())
          );
          const feederValues = feederData
            ? (Object.values(feederData.hourly_values).filter(
                (v) => typeof v === 'number' && !isNaN(v)
              ) as number[])
            : [];
          const feederAvg =
            feederValues.length > 0
              ? feederValues.reduce((a, b) => a + b, 0) / feederValues.length
              : 0;
          report += `- ${name} : ${feederAvg.toFixed(2)} %\n`;
        });

        // Catatan Tambahan - downtime data
        const downtimeNotes = await getDowntimeForDate(date);
        const unitDowntime = downtimeNotes.filter((d) => d.unit.includes(unit));
        const notes = unitDowntime.map((d) => `${d.problem} - ${d.start_time || 'N/A'}`).join('\n');
        report += `\n*Catatan Tambahan*\n${notes}\n\n`;
      }

      // Silo Data - hanya shift 3
      report += `*Ruang Kosong & Isi Silo Semen*\n`;
      siloData.forEach((silo) => {
        const shift3Data = silo.shift3;
        if (shift3Data) {
          const percentage = shift3Data.content
            ? ((shift3Data.content / 100) * 100).toFixed(1)
            : 'N/A';
          report += `${silo.silo_id}: Empty ${shift3Data.emptySpace || 'N/A'} m³, Content ${shift3Data.content || 'N/A'} ton, ${percentage}%\n`;
        }
      });

      report += `\n*Demikian laporan ini. Terima kasih.*\n\n`;

      return report;
    } catch (error) {
      console.error('Error generating daily report:', error);
      return `*Laporan Harian Produksi*\n**\n\n Error generating report. Please try again or contact support if the problem persists.\n\n\n *SIPOMA - Production Monitoring System*\n`;
    } finally {
      setIsGenerating(false);
    }
  }, [
    selectedDate,
    selectedPlantCategory,
    selectedPlantUnits,
    getParameterData,
    getFooterDataForDate,
    getSiloData,
    getDowntimeForDate,
  ]);

  // Handle generate report button click
  const handleGenerateReport = useCallback(async () => {
    setIsGenerating(true);
    setReportGenerated(false);
    try {
      const report = await generateDailyReport();
      setGeneratedReport(report);
      setReportGenerated(true);
      // Reset success state after animation
      setTimeout(() => setReportGenerated(false), 2000);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [generateDailyReport]);

  // Handle copy to clipboard with feedback
  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedReport);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [generatedReport]);

  // Function to render formatted report content
  const renderFormattedReport = (content: string) => {
    return content.split('\n').map((line, index) => {
      // Handle bold text (*text*)
      if (line.includes('*')) {
        const parts = line.split('*');
        return (
          <div key={index} className="mb-1">
            {parts.map((part, partIndex) => {
              if (partIndex % 2 === 1) {
                return (
                  <strong key={partIndex} className="font-bold text-gray-900">
                    {part}
                  </strong>
                );
              }
              return part;
            })}
          </div>
        );
      }

      // Handle list items (- item)
      if (line.startsWith('- ')) {
        return (
          <div key={index} className="mb-1 ml-4 flex items-start">
            <span className="text-blue-500 mr-2 mt-1">•</span>
            <span>{line.substring(2)}</span>
          </div>
        );
      }

      // Handle section headers
      if (line.includes('===') || line.trim() === '') {
        return <div key={index} className="mb-2 h-2"></div>;
      }

      // Regular text
      return (
        <div key={index} className="mb-1">
          {line}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">WhatsApp Group Report</h1>
                <p className="text-blue-100 mt-1">
                  Generate daily production reports for plant operations
                </p>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Date Selection */}
              <div className="space-y-2">
                <label
                  htmlFor="date-select"
                  className="block text-sm font-semibold text-gray-700 flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-2 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Report Date
                </label>
                <input
                  id="date-select"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                />
              </div>

              {/* Plant Category Selection */}
              <div className="space-y-2">
                <label
                  htmlFor="category-select"
                  className="block text-sm font-semibold text-gray-700 flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-2 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Plant Category
                </label>
                <select
                  id="category-select"
                  value={selectedPlantCategory}
                  onChange={(e) => setSelectedPlantCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                >
                  {plantCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Plant Unit Multi-Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  Plant Units ({selectedPlantUnits.length} selected)
                </label>
                <div className="relative unit-dropdown-container">
                  <div
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm hover:shadow-md cursor-pointer transition-all duration-200"
                    onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                  >
                    <div className="flex flex-wrap gap-2 min-h-[2.75rem] items-center">
                      {selectedPlantUnits.length === 0 ? (
                        <span className="text-gray-500">Select plant units...</span>
                      ) : (
                        selectedPlantUnits.map((unit) => (
                          <span
                            key={unit}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                          >
                            Unit {unit}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPlantUnits((prev) => prev.filter((u) => u !== unit));
                              }}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </span>
                        ))
                      )}
                      <div className="ml-auto">
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                            isUnitDropdownOpen ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown for unit selection */}
                  {isUnitDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <div className="flex items-center justify-between p-2 border-b border-gray-200">
                          <button
                            onClick={() => setSelectedPlantUnits(filteredUnits.map((u) => u.unit))}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Select All
                          </button>
                          <button
                            onClick={() => setSelectedPlantUnits([])}
                            className="text-sm text-gray-600 hover:text-gray-800"
                          >
                            Clear All
                          </button>
                        </div>
                        {filteredUnits.map((unit) => (
                          <label
                            key={unit.id}
                            className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPlantUnits.includes(unit.unit)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPlantUnits((prev) => [...prev, unit.unit]);
                                } else {
                                  setSelectedPlantUnits((prev) =>
                                    prev.filter((u) => u !== unit.unit)
                                  );
                                }
                              }}
                              className="mr-3 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              Unit {unit.unit} - {unit.description || 'No description'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <EnhancedButton
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                  isGenerating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Generating Report...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>Generate Daily Report</span>
                    </>
                  )}
                </div>
              </EnhancedButton>
            </div>
          </div>
        </div>

        {/* Report Output Section */}
        {generatedReport && (
          <div
            className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-500 ${
              reportGenerated ? 'ring-2 ring-green-400 ring-opacity-50' : ''
            }`}
          >
            <div
              className={`bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 transition-all duration-300 ${
                reportGenerated ? 'bg-gradient-to-r from-green-500 to-emerald-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`bg-white/20 p-3 rounded-xl transition-all duration-300 ${
                      reportGenerated ? 'bg-green-300/30 scale-110' : ''
                    }`}
                  >
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Generated Report</h2>
                    <p className="text-green-100 mt-1">
                      Daily production report ready for WhatsApp
                    </p>
                    {reportGenerated && (
                      <div className="flex items-center mt-2 text-green-200 animate-pulse">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Report generated successfully!
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCopyToClipboard}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="text-sm text-gray-800 leading-relaxed font-mono">
                  {renderFormattedReport(generatedReport)}
                </div>
              </div>

              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={handleCopyToClipboard}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl ${
                    copySuccess
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
                </button>

                <button
                  onClick={() =>
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(generatedReport)}`,
                      '_blank'
                    )
                  }
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                  </svg>
                  <span>Share on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>SIPOMA - Production Monitoring System</p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppGroupReportPage;
