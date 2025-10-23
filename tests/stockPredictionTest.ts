/**
 * Test file untuk stock prediction logic
 * Memverifikasi implementasi algoritma prediksi stok
 */

import {
  calculateStockPrediction,
  convertExistingDataToHistoricalStock,
  convertMasterDataToPlantParameters,
  generatePlannedDeliveries,
  calculatePredictionMetrics,
  HistoricalStock,
  PlannedDelivery,
  PlantParameters,
} from '../utils/stockPrediction';

// Mock data untuk testing
const mockHistoricalStock: HistoricalStock[] = [
  { date: '2024-01-01', stockLevel: 150, consumption: 10, arrivals: 0 },
  { date: '2024-01-02', stockLevel: 140, consumption: 12, arrivals: 0 },
  { date: '2024-01-03', stockLevel: 128, consumption: 8, arrivals: 0 },
  { date: '2024-01-04', stockLevel: 120, consumption: 15, arrivals: 0 },
  { date: '2024-01-05', stockLevel: 105, consumption: 11, arrivals: 0 },
  { date: '2024-01-06', stockLevel: 94, consumption: 9, arrivals: 0 },
  { date: '2024-01-07', stockLevel: 85, consumption: 13, arrivals: 0 },
];

const mockPlannedDeliveries: PlannedDelivery[] = [
  { arrivalDate: '2024-01-09', quantity: 100 },
  { arrivalDate: '2024-01-16', quantity: 80 },
  { arrivalDate: '2024-01-23', quantity: 120 },
];

const mockPlantParameters: PlantParameters = {
  currentStock: 85,
  safetyStock: 40,
  avgDailyConsumption: 11,
};

// Test function
function testStockPrediction() {

  try {
    // Test 1: Basic prediction calculation
    const result = calculateStockPrediction(
      mockHistoricalStock,
      mockPlannedDeliveries,
      mockPlantParameters,
      30, // 30 days projection
      7 // 7 days history
    );

    //   `📅 Critical stock date: ${result.criticalStockDate || "None (Safe)"}`
    // );

    // Test 2: Data structure validation
    const firstDataPoint = result.prognosisData[0];
    const lastDataPoint = result.prognosisData[result.prognosisData.length - 1];
    //   `📈 First data point (${firstDataPoint.date}): ${
    //     firstDataPoint.isActual ? "Actual" : "Predicted"
    //   }`
    // );
    //   `📉 Last data point (${lastDataPoint.date}): ${
    //     lastDataPoint.isActual ? "Actual" : "Predicted"
    //   }`
    // );

    // Test 3: Prediction metrics
    const metrics = calculatePredictionMetrics(result, mockPlantParameters);
    //   `⏰ Days until empty: ${
    //     metrics.daysUntilEmpty === Infinity ? "∞" : metrics.daysUntilEmpty
    //   }`
    // );
    //   `📊 Average projected stock: ${Math.round(
    //     metrics.avgProjectedStock
    //   )} tons`
    // );

    // Test 4: Critical stock detection
    const criticalStockFound = result.criticalStockDate !== null;
    console.log(`Critical stock detection: ${criticalStockFound ? '✅ Working' : '❌ Not triggered'}`);

    if (criticalStockFound) {
      const criticalDate = new Date(result.criticalStockDate!);
      const today = new Date();
      const daysUntilCritical = Math.ceil(
        (criticalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
    );

    if (criticalStockFound) {
      const criticalDate = new Date(result.criticalStockDate!);
      const today = new Date();
      const daysUntilCritical = Math.ceil(
        (criticalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Test 5: Data conversion functions

    // Mock existing data format
    const mockExistingData = [
      {
        date: '2024-01-01',
        closing_stock: '150',
        stock_out: '10',
        stock_received: '0',
      },
      {
        date: '2024-01-02',
        closing_stock: '140',
        stock_out: '12',
        stock_received: '0',
      },
    ];

    const convertedHistorical = convertExistingDataToHistoricalStock(mockExistingData);

    // Mock master data format
    const mockMasterData = [
      {
        area: 'Area A',
        current_stock: '85',
        safety_stock: '40',
        avg_daily_consumption: '11',
      },
    ];

    const convertedParameters = convertMasterDataToPlantParameters(mockMasterData, 'Area A');
      `✅ Converted plant parameters: Current=${convertedParameters.currentStock}, Safety=${convertedParameters.safetyStock}`
    );

    // Test 6: Planned deliveries generation
    const generatedDeliveries = generatePlannedDeliveries(new Date(), 30, 100, 7);


    return {
      success: true,
      result,
      metrics,
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Advanced test scenarios
function testEdgeCases() {

  try {
    // Test dengan data kosong
    const emptyResult = calculateStockPrediction([], [], mockPlantParameters, 30, 7);

    // Test dengan konsumsi nol
    const zeroConsumptionParams = {
      ...mockPlantParameters,
      avgDailyConsumption: 0,
    };
    const zeroResult = calculateStockPrediction(
      mockHistoricalStock,
      [],
      zeroConsumptionParams,
      30,
      7
    );
      `✅ Handled zero consumption: Critical date = ${zeroResult.criticalStockDate || 'None'}`
    );

    // Test dengan stok sangat rendah
    const lowStockParams = { ...mockPlantParameters, currentStock: 20 };
    const lowStockResult = calculateStockPrediction(mockHistoricalStock, [], lowStockParams, 30, 7);
      `✅ Handled low stock: Critical in ${lowStockResult.criticalStockDate ? 'soon' : 'never'}`
    );

  } catch (error) {
    console.error('❌ Edge case test failed:', error);
  }
}

// Fungsi untuk menampilkan sample data
function displaySamplePrediction() {

  const result = calculateStockPrediction(
    mockHistoricalStock,
    mockPlannedDeliveries,
    mockPlantParameters,
    14, // 2 weeks
    3 // 3 days history
  );


  result.prognosisData.forEach((data) => {
    const type = data.isActual ? 'Actual' : 'Predicted';
      `${data.date}\t${data.stockLevel}\t${data.consumption}\t\t${data.arrivals}\t\t${type}`
    );
  });

  if (result.criticalStockDate) {
  } else {
  }
}

// Export functions untuk digunakan dalam development
export { testStockPrediction, testEdgeCases, displaySamplePrediction };

// Auto-run tests jika file dijalankan langsung
if (typeof window === 'undefined' && require.main === module) {
  testStockPrediction();
  testEdgeCases();
  displaySamplePrediction();
}

// Fungsi helper untuk debugging
export function debugPredictionStep(
  historicalData: HistoricalStock[],
  plannedDeliveries: PlannedDelivery[],
  plantParams: PlantParameters,
  projectionDays: number = 30
) {

  // Tampilkan input data

  // Jalankan prediksi dengan logging
  const result = calculateStockPrediction(
    historicalData,
    plannedDeliveries,
    plantParams,
    projectionDays,
    7
  );

  // Tampilkan hasil detail

  // Tampilkan breakdown per week
  const weeklyBreakdown = [];
  for (let i = 0; i < result.prognosisData.length; i += 7) {
    const weekData = result.prognosisData.slice(i, i + 7);
    const avgStock = weekData.reduce((sum, d) => sum + d.stockLevel, 0) / weekData.length;
    const totalConsumption = weekData.reduce((sum, d) => sum + d.consumption, 0);
    const totalArrivals = weekData.reduce((sum, d) => sum + d.arrivals, 0);

    weeklyBreakdown.push({
      week: Math.floor(i / 7) + 1,
      avgStock: Math.round(avgStock),
      totalConsumption,
      totalArrivals,
      netFlow: totalArrivals - totalConsumption,
    });
  }

  console.table(weeklyBreakdown);

  return result;
}

