import { useEffect, useRef, useCallback } from 'react';

interface WorkerMessage {
  type: string;
  payload: any;
  id: string;
}

interface WorkerResponse {
  type: 'SUCCESS' | 'ERROR';
  payload: any;
  id: string;
  error?: string;
}

export const useDataWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<string, (result: any, error?: string) => void>>(new Map());

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker('/data-worker.js');

    // Handle worker messages
    const handleMessage = (e: MessageEvent<WorkerResponse>) => {
      const { type, payload, id, error } = e.data;

      const callback = callbacksRef.current.get(id);
      if (callback) {
        if (type === 'SUCCESS') {
          callback(payload);
        } else {
          callback(null, error);
        }
        callbacksRef.current.delete(id);
      }
    };

    workerRef.current.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.removeEventListener('message', handleMessage);
        workerRef.current.terminate();
      }
    };
  }, []);

  const sendMessage = useCallback(
    <T = any>(type: string, payload: any, callback: (result: T | null, error?: string) => void) => {
      if (!workerRef.current) {
        callback(null, 'Worker not initialized');
        return;
      }

      const id = Math.random().toString(36).substr(2, 9);
      callbacksRef.current.set(id, callback);

      const message: WorkerMessage = {
        type,
        payload,
        id,
      };

      workerRef.current.postMessage(message);
    },
    []
  );

  const processCcrData = useCallback(
    (
      ccrData: any[],
      parameters: any[],
      callback: (result: any[] | null, error?: string) => void
    ) => {
      sendMessage('PROCESS_CCR_DATA', { ccrData, parameters }, callback);
    },
    [sendMessage]
  );

  const calculateChartData = useCallback(
    (
      ccrData: any[],
      parameters: any[],
      selectedMonth: number,
      selectedYear: number,
      callback: (result: any[] | null, error?: string) => void
    ) => {
      sendMessage(
        'CALCULATE_CHART_DATA',
        {
          ccrData,
          parameters,
          selectedMonth,
          selectedYear,
        },
        callback
      );
    },
    [sendMessage]
  );

  const filterParameters = useCallback(
    (parameters: any[], filters: any, callback: (result: any[] | null, error?: string) => void) => {
      sendMessage('FILTER_PARAMETERS', { parameters, filters }, callback);
    },
    [sendMessage]
  );

  const aggregateData = useCallback(
    (
      data: any[],
      aggregationType: string,
      callback: (result: any[] | null, error?: string) => void
    ) => {
      sendMessage('AGGREGATE_DATA', { data, aggregationType }, callback);
    },
    [sendMessage]
  );

  return {
    processCcrData,
    calculateChartData,
    filterParameters,
    aggregateData,
    isWorkerReady: !!workerRef.current,
  };
};
