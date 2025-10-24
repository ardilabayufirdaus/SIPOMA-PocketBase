// Web Worker for heavy data processing operations
// This worker handles CCR data processing, chart calculations, and parameter aggregations

// Data processing functions
const processCcrData = (ccrData, parameters) => {
  console.log(' Processing CCR data in worker...');

  const processedData = ccrData
    .map((item) => {
      const param = parameters.find((p) => p.id === item.parameter_id);
      if (!param) return null;

      const hourlyValues = Object.values(item.hourly_values);
      const avgValue =
        hourlyValues.length > 0
          ? hourlyValues.reduce((sum, val) => sum + (Number(val) || 0), 0) / hourlyValues.length
          : 0;

      const deviation = param?.max_value
        ? ((avgValue - param.max_value) / param.max_value) * 100
        : 0;

      return {
        id: item.id,
        parameter_id: item.parameter_id,
        date: item.date,
        avgValue,
        target: param?.max_value || 0,
        deviation,
        parameter: param?.parameter || 'Unknown',
        unit: param?.unit || 'N/A',
        category: param?.category || 'N/A',
      };
    })
    .filter(Boolean);

  return processedData;
};

// Message handler
self.onmessage = (e) => {
  const { type, payload, id } = e.data;

  try {
    let result;

    switch (type) {
      case 'PROCESS_CCR_DATA':
        result = processCcrData(payload.ccrData, payload.parameters);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const response = {
      type: 'SUCCESS',
      payload: result,
      id,
    };

    self.postMessage(response);
  } catch (error) {
    const response = {
      type: 'ERROR',
      payload: null,
      id,
      error: error.message || 'Unknown error',
    };

    self.postMessage(response);
  }
};

// Worker ready notification
self.postMessage({ type: 'WORKER_READY' });
