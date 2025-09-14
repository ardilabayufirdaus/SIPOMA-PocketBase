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
} from "../utils/stockPrediction";

// Mock data untuk testing
const mockHistoricalStock: HistoricalStock[] = [
  { date: "2024-01-01", stockLevel: 150, consumption: 10, arrivals: 0 },
  { date: "2024-01-02", stockLevel: 140, consumption: 12, arrivals: 0 },
  { date: "2024-01-03", stockLevel: 128, consumption: 8, arrivals: 0 },
  { date: "2024-01-04", stockLevel: 120, consumption: 15, arrivals: 0 },
  { date: "2024-01-05", stockLevel: 105, consumption: 11, arrivals: 0 },
  { date: "2024-01-06", stockLevel: 94, consumption: 9, arrivals: 0 },
  { date: "2024-01-07", stockLevel: 85, consumption: 13, arrivals: 0 },
];

const mockPlannedDeliveries: PlannedDelivery[] = [
  { arrivalDate: "2024-01-09", quantity: 100 },
  { arrivalDate: "2024-01-16", quantity: 80 },
  { arrivalDate: "2024-01-23", quantity: 120 },
];

const mockPlantParameters: PlantParameters = {
  currentStock: 85,
  safetyStock: 40,
  avgDailyConsumption: 11,
};

// Test function
function testStockPrediction() {
  // console.log("🧪 Testing Stock Prediction Algorithm...\n"); // removed for production

  try {
    // Test 1: Basic prediction calculation
    // console.log("📊 Test 1: Basic Prediction Calculation"); // removed for production
    const result = calculateStockPrediction(
      mockHistoricalStock,
      mockPlannedDeliveries,
      mockPlantParameters,
      30, // 30 days projection
      7 // 7 days history
    );

    // console.log(`✅ Generated ${result.prognosisData.length} data points`); // removed for production
    // console.log(
    //   `📅 Critical stock date: ${result.criticalStockDate || "None (Safe)"}`
    // );

    // Test 2: Data structure validation
    // console.log("\n🔍 Test 2: Data Structure Validation"); // removed for production
    const firstDataPoint = result.prognosisData[0];
    const lastDataPoint = result.prognosisData[result.prognosisData.length - 1];
    // console.log(
    //   `📈 First data point (${firstDataPoint.date}): ${
    //     firstDataPoint.isActual ? "Actual" : "Predicted"
    //   }`
    // );
    // console.log(
    //   `📉 Last data point (${lastDataPoint.date}): ${
    //     lastDataPoint.isActual ? "Actual" : "Predicted"
    //   }`
    // );

    // Test 3: Prediction metrics
    // console.log("\n📊 Test 3: Prediction Metrics"); // removed for production
    const metrics = calculatePredictionMetrics(result, mockPlantParameters);
    // console.log(
    //   `⏰ Days until empty: ${
    //     metrics.daysUntilEmpty === Infinity ? "∞" : metrics.daysUntilEmpty
    //   }`
    // );
    // console.log(
    //   `📊 Average projected stock: ${Math.round(
    //     metrics.avgProjectedStock
    //   )} tons`
    // );
    console.log(`⚠️ Stock critical: ${metrics.isStockCritical ? "Yes" : "No"}`);
    console.log(
      `🎯 Projection accuracy: ${Math.round(metrics.projectionAccuracy)}%`
    );

    // Test 4: Critical stock detection
    console.log("\n🚨 Test 4: Critical Stock Detection");
    const criticalStockFound = result.criticalStockDate !== null;
    console.log(
      `Critical stock detection: ${
        criticalStockFound ? "✅ Working" : "❌ Not triggered"
      }`
    );

    if (criticalStockFound) {
      const criticalDate = new Date(result.criticalStockDate!);
      const today = new Date();
      const daysUntilCritical = Math.ceil(
        (criticalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      console.log(`⏳ Days until critical: ${daysUntilCritical}`);
    }

    // Test 5: Data conversion functions
    console.log("\n🔄 Test 5: Data Conversion Functions");

    // Mock existing data format
    const mockExistingData = [
      {
        date: "2024-01-01",
        closing_stock: "150",
        stock_out: "10",
        stock_received: "0",
      },
      {
        date: "2024-01-02",
        closing_stock: "140",
        stock_out: "12",
        stock_received: "0",
      },
    ];

    const convertedHistorical =
      convertExistingDataToHistoricalStock(mockExistingData);
    console.log(
      `✅ Converted ${convertedHistorical.length} historical records`
    );

    // Mock master data format
    const mockMasterData = [
      {
        area: "Area A",
        current_stock: "85",
        safety_stock: "40",
        avg_daily_consumption: "11",
      },
    ];

    const convertedParameters = convertMasterDataToPlantParameters(
      mockMasterData,
      "Area A"
    );
    console.log(
      `✅ Converted plant parameters: Current=${convertedParameters.currentStock}, Safety=${convertedParameters.safetyStock}`
    );

    // Test 6: Planned deliveries generation
    console.log("\n📦 Test 6: Planned Deliveries Generation");
    const generatedDeliveries = generatePlannedDeliveries(
      new Date(),
      30,
      100,
      7
    );
    console.log(
      `✅ Generated ${generatedDeliveries.length} planned deliveries`
    );

    console.log("\n🎉 All tests completed successfully!");

    return {
      success: true,
      result,
      metrics,
    };
  } catch (error) {
    console.error("❌ Test failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Advanced test scenarios
function testEdgeCases() {
  console.log("\n🔬 Testing Edge Cases...\n");

  try {
    // Test dengan data kosong
    console.log("📋 Test: Empty historical data");
    const emptyResult = calculateStockPrediction(
      [],
      [],
      mockPlantParameters,
      30,
      7
    );
    console.log(
      `✅ Handled empty data: ${emptyResult.prognosisData.length} points generated`
    );

    // Test dengan konsumsi nol
    console.log("\n📋 Test: Zero consumption");
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
    console.log(
      `✅ Handled zero consumption: Critical date = ${
        zeroResult.criticalStockDate || "None"
      }`
    );

    // Test dengan stok sangat rendah
    console.log("\n📋 Test: Very low current stock");
    const lowStockParams = { ...mockPlantParameters, currentStock: 20 };
    const lowStockResult = calculateStockPrediction(
      mockHistoricalStock,
      [],
      lowStockParams,
      30,
      7
    );
    console.log(
      `✅ Handled low stock: Critical in ${
        lowStockResult.criticalStockDate ? "soon" : "never"
      }`
    );

    console.log("\n🎯 Edge case testing completed!");
  } catch (error) {
    console.error("❌ Edge case test failed:", error);
  }
}

// Fungsi untuk menampilkan sample data
function displaySamplePrediction() {
  console.log("\n📋 Sample Prediction Data:\n");

  const result = calculateStockPrediction(
    mockHistoricalStock,
    mockPlannedDeliveries,
    mockPlantParameters,
    14, // 2 weeks
    3 // 3 days history
  );

  console.log("Date\t\tStock\tConsump.\tArrivals\tType");
  console.log("─".repeat(60));

  result.prognosisData.forEach((data) => {
    const type = data.isActual ? "Actual" : "Predicted";
    console.log(
      `${data.date}\t${data.stockLevel}\t${data.consumption}\t\t${data.arrivals}\t\t${type}`
    );
  });

  if (result.criticalStockDate) {
    console.log(
      `\n⚠️  Critical stock level reached on: ${result.criticalStockDate}`
    );
  } else {
    console.log("\n✅ Stock levels remain safe throughout projection period");
  }
}

// Export functions untuk digunakan dalam development
export { testStockPrediction, testEdgeCases, displaySamplePrediction };

// Auto-run tests jika file dijalankan langsung
if (typeof window === "undefined" && require.main === module) {
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
  console.log("🔧 Debug Mode: Step-by-step prediction calculation\n");

  // Tampilkan input data
  console.log("📊 Input Data:");
  console.log("Historical Stock:", historicalData.slice(-5)); // Last 5 days
  console.log("Planned Deliveries:", plannedDeliveries);
  console.log("Plant Parameters:", plantParams);
  console.log("Projection Period:", projectionDays, "days\n");

  // Jalankan prediksi dengan logging
  const result = calculateStockPrediction(
    historicalData,
    plannedDeliveries,
    plantParams,
    projectionDays,
    7
  );

  // Tampilkan hasil detail
  console.log("📈 Prediction Results:");
  console.log("Total data points:", result.prognosisData.length);
  console.log("Critical stock date:", result.criticalStockDate);

  // Tampilkan breakdown per week
  const weeklyBreakdown = [];
  for (let i = 0; i < result.prognosisData.length; i += 7) {
    const weekData = result.prognosisData.slice(i, i + 7);
    const avgStock =
      weekData.reduce((sum, d) => sum + d.stockLevel, 0) / weekData.length;
    const totalConsumption = weekData.reduce(
      (sum, d) => sum + d.consumption,
      0
    );
    const totalArrivals = weekData.reduce((sum, d) => sum + d.arrivals, 0);

    weeklyBreakdown.push({
      week: Math.floor(i / 7) + 1,
      avgStock: Math.round(avgStock),
      totalConsumption,
      totalArrivals,
      netFlow: totalArrivals - totalConsumption,
    });
  }

  console.log("\n📊 Weekly Breakdown:");
  console.table(weeklyBreakdown);

  return result;
}
