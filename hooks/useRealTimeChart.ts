import { useState, useEffect, useCallback, useRef } from 'react';

export interface RealTimeDataPoint {
  [key: string]: string | number | Date;
}

export interface RealTimeChartConfig {
  enabled: boolean;
  interval: number; // milliseconds
  maxDataPoints: number;
  endpoint?: string;
  wsUrl?: string;
  autoUpdate?: boolean;
}

export interface UseRealTimeChartOptions {
  config: RealTimeChartConfig;
  initialData?: RealTimeDataPoint[];
  onDataUpdate?: (newData: RealTimeDataPoint[]) => void;
  onError?: (error: Error) => void;
}

export function useRealTimeChart({
  config,
  initialData = [],
  onDataUpdate,
  onError,
}: UseRealTimeChartOptions) {
  const [data, setData] = useState<RealTimeDataPoint[]>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add new data point
  const addDataPoint = useCallback(
    (newPoint: RealTimeDataPoint) => {
      setData((prevData) => {
        const updatedData = [...prevData, newPoint];

        // Limit data points to maxDataPoints
        if (updatedData.length > config.maxDataPoints) {
          updatedData.splice(0, updatedData.length - config.maxDataPoints);
        }

        setLastUpdate(new Date());
        onDataUpdate?.(updatedData);
        return updatedData;
      });
    },
    [config.maxDataPoints, onDataUpdate]
  );

  // Add multiple data points
  const addDataPoints = useCallback(
    (newPoints: RealTimeDataPoint[]) => {
      setData((prevData) => {
        const updatedData = [...prevData, ...newPoints];

        // Limit data points to maxDataPoints
        if (updatedData.length > config.maxDataPoints) {
          updatedData.splice(0, updatedData.length - config.maxDataPoints);
        }

        setLastUpdate(new Date());
        onDataUpdate?.(updatedData);
        return updatedData;
      });
    },
    [config.maxDataPoints, onDataUpdate]
  );

  // Update existing data point
  const updateDataPoint = useCallback(
    (index: number, updatedPoint: Partial<RealTimeDataPoint>) => {
      setData((prevData) => {
        const newData = [...prevData];
        if (newData[index]) {
          newData[index] = { ...newData[index], ...updatedPoint };
          setLastUpdate(new Date());
          onDataUpdate?.(newData);
        }
        return newData;
      });
    },
    [onDataUpdate]
  );

  // Clear all data
  const clearData = useCallback(() => {
    setData([]);
    setLastUpdate(null);
    onDataUpdate?.([]);
  }, [onDataUpdate]);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!config.wsUrl || wsRef.current) return;

    try {
      const ws = new WebSocket(config.wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const newData = JSON.parse(event.data);
          if (Array.isArray(newData)) {
            addDataPoints(newData);
          } else {
            addDataPoint(newData);
          }
        } catch {
          onError?.(new Error('Failed to parse WebSocket data'));
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        // Auto-reconnect after 5 seconds
        if (config.autoUpdate) {
          setTimeout(connectWebSocket, 5000);
        }
      };

      ws.onerror = () => {
        onError?.(new Error('WebSocket connection error'));
      };
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('WebSocket setup failed'));
    }
  }, [config.wsUrl, config.autoUpdate, addDataPoint, addDataPoints, onError]);

  // HTTP polling
  const startPolling = useCallback(() => {
    if (!config.endpoint || intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(config.endpoint);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const newData = await response.json();
        if (Array.isArray(newData)) {
          addDataPoints(newData);
        } else {
          addDataPoint(newData);
        }
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('Polling failed'));
      }
    }, config.interval);
  }, [config.endpoint, config.interval, addDataPoint, addDataPoints, onError]);

  // Start real-time updates
  const startRealTime = useCallback(() => {
    if (!config.enabled) return;

    if (config.wsUrl) {
      connectWebSocket();
    } else if (config.endpoint) {
      startPolling();
    }
  }, [config.enabled, config.wsUrl, config.endpoint, connectWebSocket, startPolling]);

  // Stop real-time updates
  const stopRealTime = useCallback(() => {
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }

    // Clear polling interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Toggle real-time updates
  const toggleRealTime = useCallback(() => {
    if (isConnected || intervalRef.current) {
      stopRealTime();
    } else {
      startRealTime();
    }
  }, [isConnected, startRealTime, stopRealTime]);

  // Simulate data for demo
  const simulateData = useCallback(() => {
    const timestamp = Date.now();
    const randomValue = Math.random() * 100;

    addDataPoint({
      timestamp,
      value: randomValue,
      trend: randomValue > 50 ? 'up' : 'down',
      category: 'demo',
    });
  }, [addDataPoint]);

  // Start demo mode
  const startDemo = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(simulateData, config.interval);
    setIsConnected(true);
  }, [simulateData, config.interval]);

  // Effects
  useEffect(() => {
    if (config.enabled && config.autoUpdate) {
      startRealTime();
    }

    return () => {
      stopRealTime();
    };
  }, [config.enabled, config.autoUpdate, startRealTime, stopRealTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRealTime();
    };
  }, [stopRealTime]);

  return {
    // Data
    data,
    isConnected,
    lastUpdate,

    // Actions
    addDataPoint,
    addDataPoints,
    updateDataPoint,
    clearData,

    // Control
    startRealTime,
    stopRealTime,
    toggleRealTime,

    // Demo
    simulateData,
    startDemo,
  };
}


