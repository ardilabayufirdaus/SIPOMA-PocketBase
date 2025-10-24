/**
 * Stock Prediction Logic for Packaging
 * Implementasi logika prediksi stok berdasarkan spesifikasi yang diberikan
 */

export interface HistoricalStock {
  date: string; // format: 'YYYY-MM-DD'
  stockLevel: number;
  consumption: number;
  arrivals: number;
}

export interface PlannedDelivery {
  arrivalDate: string; // format: 'YYYY-MM-DD'
  quantity: number;
}

export interface PlantParameters {
  currentStock: number;
  safetyStock: number;
  avgDailyConsumption: number;
}

export interface DailyProjectionData {
  date: string; // format: 'YYYY-MM-DD'
  stockLevel: number;
  consumption: number;
  arrivals: number;
  isActual: boolean;
}

export interface PredictionResult {
  prognosisData: DailyProjectionData[];
  criticalStockDate: string | null;
}

/**
 * Fungsi utama untuk menghitung prediksi stok
 */
export function calculateStockPrediction(
  historicalStock: HistoricalStock[],
  plannedDeliveries: PlannedDelivery[],
  plantParameters: PlantParameters,
  projectionPeriodDays: number,
  historyPeriodDays: number
): PredictionResult {
  const prognosisData: DailyProjectionData[] = [];
  let criticalStockDate: string | null = null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Validasi input parameters
  if (!plantParameters || typeof plantParameters.currentStock !== 'number') {
    throw new Error('Invalid plant parameters: currentStock must be a number');
  }

  if (projectionPeriodDays <= 0 || historyPeriodDays < 0) {
    throw new Error('Invalid period parameters');
  }

  // Tahap 1: Inisialisasi Data Historis
  for (let i = historyPeriodDays; i >= 1; i--) {
    const historicalDate = new Date(today);
    historicalDate.setDate(historicalDate.getDate() - i);
    const dateString = formatDateToYYYYMMDD(historicalDate);

    // Cari data historis untuk tanggal ini
    const historicalData = historicalStock.find((h) => h.date === dateString);

    if (historicalData) {
      prognosisData.push({
        date: dateString,
        stockLevel: Number(historicalData.stockLevel) || 0,
        consumption: Number(historicalData.consumption) || 0,
        arrivals: Number(historicalData.arrivals) || 0,
        isActual: true,
      });
    } else {
      // Jika tidak ada data historis, gunakan data default atau interpolasi
      prognosisData.push({
        date: dateString,
        stockLevel: Number(plantParameters.currentStock) || 0,
        consumption: Number(plantParameters.avgDailyConsumption) || 0,
        arrivals: 0,
        isActual: true,
      });
    }
  }

  // Tahap 2: Data Hari Ini (Titik Awal Proyeksi)
  const todayDateString = formatDateToYYYYMMDD(today);
  const todayHistoricalData = historicalStock.find((h) => h.date === todayDateString);
  const todayArrivals = Number(todayHistoricalData?.arrivals) || 0;

  prognosisData.push({
    date: todayDateString,
    stockLevel: Number(plantParameters.currentStock) || 0,
    consumption: Number(plantParameters.avgDailyConsumption) || 0,
    arrivals: todayArrivals,
    isActual: true,
  });

  // Simpan level stok hari ini sebagai titik awal proyeksi
  let projectedStock = Number(plantParameters.currentStock) || 0;

  // Tahap 3: Proyeksi Masa Depan
  for (let i = 1; i <= projectionPeriodDays; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + i);
    const futureDateString = formatDateToYYYYMMDD(futureDate);

    // Hitung Stok Masuk dari planned deliveries
    const stockIn = plannedDeliveries
      .filter((delivery) => delivery.arrivalDate === futureDateString)
      .reduce((total, delivery) => total + (Number(delivery.quantity) || 0), 0);

    // Hitung Stok Keluar (konsumsi harian rata-rata)
    const stockOut = Number(plantParameters.avgDailyConsumption) || 0;

    // Kalkulasi Stok Proyeksi
    projectedStock = Math.max(0, projectedStock + stockIn - stockOut);

    // Simpan data proyeksi
    prognosisData.push({
      date: futureDateString,
      stockLevel: projectedStock,
      consumption: stockOut,
      arrivals: stockIn,
      isActual: false,
    });

    // Tahap 4: Identifikasi Tanggal Kritis
    if (criticalStockDate === null && projectedStock < (Number(plantParameters.safetyStock) || 0)) {
      criticalStockDate = futureDateString;
    }
  }

  return {
    prognosisData,
    criticalStockDate,
  };
}

/**
 * Helper function untuk format tanggal ke string YYYY-MM-DD
 */
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fungsi untuk mengkonversi data existing ke format yang diperlukan
 */
export function convertExistingDataToHistoricalStock(stockRecords: any[]): HistoricalStock[] {
  if (!Array.isArray(stockRecords)) {
    console.warn('Invalid stockRecords provided, returning empty array');
    return [];
  }

  return stockRecords
    .filter((record) => {
      // Basic validation before processing
      return (
        record &&
        typeof record === 'object' &&
        record.date &&
        typeof record.date === 'string' &&
        record.date.length >= 10
      ); // Minimum date string length YYYY-MM-DD
    })
    .map((record) => {
      const stockLevel = Number(record.closing_stock);
      const consumption = Number(record.stock_out);
      const arrivals = Number(record.stock_received);

      return {
        date: record.date.split('T')[0], // Ensure YYYY-MM-DD format
        stockLevel: !isNaN(stockLevel) && isFinite(stockLevel) && stockLevel >= 0 ? stockLevel : 0,
        consumption:
          !isNaN(consumption) && isFinite(consumption) && consumption >= 0 ? consumption : 0,
        arrivals: !isNaN(arrivals) && isFinite(arrivals) && arrivals >= 0 ? arrivals : 0,
      };
    })
    .filter((record) => {
      // Final validation - ensure we have at least a valid date
      return record.date && record.date.length === 10;
    });
}

/**
 * Fungsi untuk mengkonversi data master ke PlantParameters
 */
export function convertMasterDataToPlantParameters(
  masterData: any[],
  area: string
): PlantParameters {
  if (!Array.isArray(masterData) || masterData.length === 0) {
    console.warn('No master data available, using fallback parameters');
    return {
      currentStock: 1000, // Reasonable default
      safetyStock: 50,
      avgDailyConsumption: 100, // Reasonable default
    };
  }

  const areaData = masterData.find((m) => m?.area === area);

  if (!areaData) {
    console.warn(`No data found for area ${area}, using fallback parameters`);
    return {
      currentStock: 1000,
      safetyStock: 50,
      avgDailyConsumption: 100,
    };
  }

  // Validate and sanitize values
  const currentStock = Number(areaData.current_stock);
  const safetyStock = Number(areaData.safety_stock);
  const avgDailyConsumption = Number(areaData.avg_daily_consumption);

  return {
    currentStock:
      !isNaN(currentStock) && isFinite(currentStock) && currentStock >= 0 ? currentStock : 1000,
    safetyStock:
      !isNaN(safetyStock) && isFinite(safetyStock) && safetyStock >= 0 ? safetyStock : 50,
    avgDailyConsumption:
      !isNaN(avgDailyConsumption) && isFinite(avgDailyConsumption) && avgDailyConsumption > 0
        ? avgDailyConsumption
        : 100,
  };
}

/**
 * Fungsi untuk generate planned deliveries dari data yang ada
 * (Ini bisa disesuaikan dengan sumber data planned deliveries yang sebenarnya)
 */
export function generatePlannedDeliveries(
  projectionStartDate: Date,
  projectionPeriodDays: number,
  avgDeliveryQuantity: number = 100,
  deliveryFrequencyDays: number = 7
): PlannedDelivery[] {
  const plannedDeliveries: PlannedDelivery[] = [];

  for (let i = deliveryFrequencyDays; i <= projectionPeriodDays; i += deliveryFrequencyDays) {
    const deliveryDate = new Date(projectionStartDate);
    deliveryDate.setDate(deliveryDate.getDate() + i);

    plannedDeliveries.push({
      arrivalDate: formatDateToYYYYMMDD(deliveryDate),
      quantity: avgDeliveryQuantity,
    });
  }

  return plannedDeliveries;
}

/**
 * Fungsi untuk menghitung metrik tambahan dari hasil prediksi
 */
export function calculatePredictionMetrics(
  result: PredictionResult,
  plantParameters: PlantParameters
) {
  const { prognosisData, criticalStockDate } = result;

  // Hitung hari sampai stok habis
  const daysUntilEmpty = criticalStockDate
    ? calculateDaysBetween(prognosisData[prognosisData.length - 1].date, criticalStockDate)
    : Infinity;

  // Hitung rata-rata level stok selama periode proyeksi
  const projectionData = prognosisData.filter((d) => !d.isActual);
  const avgProjectedStock =
    projectionData.length > 0
      ? projectionData.reduce((sum, d) => sum + d.stockLevel, 0) / projectionData.length
      : 0;

  // Hitung total konsumsi dan kedatangan yang diproyeksikan
  const totalProjectedConsumption = projectionData.reduce((sum, d) => sum + d.consumption, 0);
  const totalProjectedArrivals = projectionData.reduce((sum, d) => sum + d.arrivals, 0);

  // Hitung tingkat turn-over stok
  const stockTurnoverRate =
    plantParameters.currentStock > 0 ? totalProjectedConsumption / plantParameters.currentStock : 0;

  return {
    daysUntilEmpty,
    avgProjectedStock,
    totalProjectedConsumption,
    totalProjectedArrivals,
    stockTurnoverRate,
    isStockCritical: criticalStockDate !== null,
    projectionAccuracy: calculateProjectionAccuracy(prognosisData),
  };
}

/**
 * Helper function untuk menghitung selisih hari
 */
function calculateDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Fungsi untuk menghitung akurasi proyeksi berdasarkan variance data historis
 */
function calculateProjectionAccuracy(prognosisData: DailyProjectionData[]): number {
  const actualData = prognosisData.filter((d) => d.isActual);

  if (actualData.length < 2) return 0;

  const stockLevels = actualData.map((d) => d.stockLevel);
  const variance = calculateVariance(stockLevels);
  const mean = stockLevels.reduce((sum, level) => sum + level, 0) / stockLevels.length;

  // Hitung coefficient of variation sebagai indikator akurasi
  const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 0;

  // Convert ke percentage accuracy (semakin rendah CV, semakin tinggi akurasi)
  return Math.max(0, Math.min(100, 100 - coefficientOfVariation * 100));
}

/**
 * Helper function untuk menghitung variance
 */
function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const squaredDiffs = numbers.map((num) => Math.pow(num - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
}
