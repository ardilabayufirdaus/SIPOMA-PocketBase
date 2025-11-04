// Web Worker for COP Analysis Data Processing
// Handles heavy computations without blocking the main UI thread

interface WorkerMessage {
  type: 'PROCESS_MONTHLY_DATA' | 'CALCULATE_MOISTURE' | 'CALCULATE_FEED' | 'CALCULATE_CAPACITY';
  data: Record<string, unknown>;
  id: string;
}

interface WorkerResponse {
  type: 'RESULT' | 'ERROR';
  data: Record<string, unknown> | null;
  id: string;
  error?: string;
}

// Parameter setting interface
interface ParameterSetting {
  id: string;
  parameter: string;
  opc_min_value?: number;
  opc_max_value?: number;
  pcc_min_value?: number;
  pcc_max_value?: number;
  min_value?: number;
  max_value?: number;
}

// Analysis data row interface
interface AnalysisDataRow {
  parameter: ParameterSetting;
  dailyValues: { value: number | null; raw: number | undefined }[];
  monthlyAverage: number | null;
  monthlyAverageRaw: number | null;
}

// Helper function to get min/max values based on cement type
function getMinMaxForCementType(
  parameter: ParameterSetting,
  cementType: string
): { min: number | undefined; max: number | undefined } {
  if (cementType === 'OPC') {
    return {
      min: parameter.opc_min_value ?? parameter.min_value,
      max: parameter.opc_max_value ?? parameter.max_value,
    };
  } else if (cementType === 'PCC') {
    return {
      min: parameter.pcc_min_value ?? parameter.min_value,
      max: parameter.pcc_max_value ?? parameter.max_value,
    };
  }
  // Default fallback
  return {
    min: parameter.min_value,
    max: parameter.max_value,
  };
}

// Main message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, data, id } = event.data;

  try {
    let result: unknown = null;

    switch (type) {
      case 'PROCESS_MONTHLY_DATA': {
        const { filteredCopParameters, dailyAverages, dates, selectedCementType } = data as {
          filteredCopParameters: ParameterSetting[];
          dailyAverages: Record<string, Record<string, number>>;
          dates: string[];
          selectedCementType: string;
        };

        const analysisData: AnalysisDataRow[] = filteredCopParameters
          .map((parameter) => {
            try {
              // Validate parameter has required fields
              if (!parameter || !parameter.id || !parameter.parameter) {
                return null;
              }

              const dailyValues = dates.map((dateString) => {
                const avg = dailyAverages[parameter.id]?.[dateString];

                // Validate average value
                if (avg !== undefined && (isNaN(avg) || !isFinite(avg))) {
                  return { value: null, raw: undefined };
                }

                // Use helper function for consistent min/max calculation
                const { min: min_value, max: max_value } = getMinMaxForCementType(
                  parameter,
                  selectedCementType
                );

                // Validate min/max values
                if (min_value === undefined || max_value === undefined) {
                  return { value: null, raw: avg };
                }

                if (max_value <= min_value) {
                  return { value: null, raw: avg };
                }

                if (avg === undefined) {
                  return { value: null, raw: avg };
                }

                const percentage = ((avg - min_value) / (max_value - min_value)) * 100;

                // Validate percentage calculation
                if (isNaN(percentage) || !isFinite(percentage)) {
                  return { value: null, raw: avg };
                }

                return { value: percentage, raw: avg };
              });

              const validDailyPercentages = dailyValues
                .map((d) => d.value)
                .filter((v): v is number => v !== null && !isNaN(v) && isFinite(v));
              const monthlyAverage =
                validDailyPercentages.length > 0
                  ? validDailyPercentages.reduce((a, b) => a + b, 0) / validDailyPercentages.length
                  : null;

              const validDailyRaw = dailyValues
                .map((d) => d.raw)
                .filter(
                  (v): v is number => v !== undefined && v !== null && !isNaN(v) && isFinite(v)
                );
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
            } catch {
              return null;
            }
          })
          .filter((p): p is NonNullable<typeof p> => p !== null);

        result = analysisData;
        break;
      }

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const response: WorkerResponse = {
      type: 'RESULT',
      data: result as Record<string, unknown>,
      id,
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type: 'ERROR',
      data: null,
      id,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    self.postMessage(response);
  }
};

// Export for TypeScript
export {};

// Wrapper class for using the Web Worker
export class CopAnalysisWorkerManager {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }
  >();

  constructor() {
    if (typeof Worker !== 'undefined') {
      try {
        // Create worker from the same file
        this.worker = new Worker(new URL('./copAnalysisWorker.ts', import.meta.url), {
          type: 'module',
        });
        this.worker.onmessage = this.handleMessage.bind(this);
        this.worker.onerror = this.handleError.bind(this);
      } catch {
        // Silently fail if Web Worker is not available
      }
    }
  }

  private handleMessage(event: MessageEvent<WorkerResponse>) {
    const { type, data, id, error } = event.data;
    const pending = this.pendingRequests.get(id);

    if (pending) {
      this.pendingRequests.delete(id);

      if (type === 'ERROR') {
        pending.reject(new Error(error || 'Worker processing failed'));
      } else {
        pending.resolve(data);
      }
    }
  }

  private handleError(_error: ErrorEvent) {
    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      pending.reject(new Error('Web Worker failed'));
      this.pendingRequests.delete(id);
    }
  }

  async processCopAnalysisData(data: {
    filteredCopParameters: ParameterSetting[];
    dailyAverages: Record<string, Record<string, number>>;
    dates: string[];
    selectedCementType: string;
  }): Promise<AnalysisDataRow[]> {
    if (!this.worker) {
      throw new Error('Web Worker not available');
    }

    const id = Math.random().toString(36).substr(2, 9);
    const message: WorkerMessage = {
      type: 'PROCESS_MONTHLY_DATA',
      data,
      id,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.worker!.postMessage(message);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Web Worker timeout'));
        }
      }, 30000);
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      pending.reject(new Error('Worker terminated'));
      this.pendingRequests.delete(id);
    }
  }
}

// Singleton instance
export const copAnalysisWorker = new CopAnalysisWorkerManager();
