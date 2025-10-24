import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DataPoint {
  timestamp: Date;
  value: number;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface AnomalyDetection {
  id: string;
  timestamp: Date;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  category: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface TrendAnalysis {
  id: string;
  category: string;
  timeframe: '1h' | '24h' | '7d' | '30d';
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  confidence: number;
  slope: number;
  correlation: number;
  prediction: {
    nextValue: number;
    nextTimestamp: Date;
    confidenceInterval: [number, number];
  };
  createdAt: Date;
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'linear_regression' | 'polynomial' | 'exponential' | 'seasonal';
  category: string;
  accuracy: number;
  trainingDataSize: number;
  lastTraining: Date;
  parameters: Record<string, number>;
  isActive: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  category: string;
  condition: {
    operator: '>' | '<' | '==' | '!=' | 'between' | 'anomaly';
    threshold?: number;
    thresholdRange?: [number, number];
    sensitivityLevel?: 'low' | 'medium' | 'high';
  };
  isActive: boolean;
  notificationMethod: 'in-app' | 'email' | 'sms' | 'webhook';
  createdBy: string;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface AIInsight {
  id: string;
  type: 'recommendation' | 'warning' | 'optimization' | 'pattern';
  title: string;
  description: string;
  category: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedActions?: string[];
  relatedData: {
    metrics: string[];
    timeframe: string;
    affectedSystems: string[];
  };
  createdAt: Date;
  isRead: boolean;
  isBookmarked: boolean;
}

interface AIAnalyticsState {
  // Data
  anomalies: AnomalyDetection[];
  trends: TrendAnalysis[];
  models: PredictiveModel[];
  alertRules: AlertRule[];
  insights: AIInsight[];

  // Analytics Settings
  settings: {
    anomalyDetection: {
      enabled: boolean;
      sensitivity: 'low' | 'medium' | 'high';
      excludeCategories: string[];
    };
    trendAnalysis: {
      enabled: boolean;
      updateInterval: number; // minutes
      minDataPoints: number;
    };
    predictiveModeling: {
      enabled: boolean;
      autoRetrain: boolean;
      retrainInterval: number; // hours
    };
    insights: {
      enabled: boolean;
      maxInsights: number;
      categories: string[];
    };
  };

  // Actions
  addAnomaly: (anomaly: Omit<AnomalyDetection, 'id'>) => void;
  resolveAnomaly: (id: string, resolvedBy: string) => void;
  addTrend: (trend: Omit<TrendAnalysis, 'id'>) => void;
  updateModel: (model: PredictiveModel) => void;
  addAlertRule: (rule: Omit<AlertRule, 'id' | 'createdAt' | 'triggerCount'>) => void;
  toggleAlertRule: (id: string) => void;
  addInsight: (insight: Omit<AIInsight, 'id' | 'createdAt' | 'isRead' | 'isBookmarked'>) => void;
  markInsightAsRead: (id: string) => void;
  bookmarkInsight: (id: string) => void;
  updateSettings: (settings: Partial<AIAnalyticsState['settings']>) => void;

  // Analytics Functions
  detectAnomalies: (data: DataPoint[], category: string) => AnomalyDetection[];
  analyzeTrends: (data: DataPoint[], category: string) => TrendAnalysis;
  generatePrediction: (
    data: DataPoint[],
    modelType: PredictiveModel['type']
  ) => {
    nextValues: Array<{ timestamp: Date; value: number; confidence: number }>;
    accuracy: number;
  };
  generateInsights: (data: DataPoint[], categories: string[]) => AIInsight[];
}

// Simple statistical functions for AI analytics
const calculateMean = (values: number[]): number => {
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

const calculateStandardDeviation = (values: number[]): number => {
  const mean = calculateMean(values);
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance = calculateMean(squaredDiffs);
  return Math.sqrt(variance);
};

const calculateCorrelation = (x: number[], y: number[]): number => {
  const n = Math.min(x.length, y.length);
  const meanX = calculateMean(x.slice(0, n));
  const meanY = calculateMean(y.slice(0, n));

  let numerator = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const deltaX = x[i] - meanX;
    const deltaY = y[i] - meanY;
    numerator += deltaX * deltaY;
    sumX2 += deltaX * deltaX;
    sumY2 += deltaY * deltaY;
  }

  const denominator = Math.sqrt(sumX2 * sumY2);
  return denominator === 0 ? 0 : numerator / denominator;
};

export const useAIAnalyticsStore = create<AIAnalyticsState>()(
  persist(
    (set, get) => ({
      anomalies: [],
      trends: [],
      models: [],
      alertRules: [],
      insights: [],

      settings: {
        anomalyDetection: {
          enabled: true,
          sensitivity: 'medium',
          excludeCategories: [],
        },
        trendAnalysis: {
          enabled: true,
          updateInterval: 15,
          minDataPoints: 10,
        },
        predictiveModeling: {
          enabled: true,
          autoRetrain: true,
          retrainInterval: 24,
        },
        insights: {
          enabled: true,
          maxInsights: 50,
          categories: ['temperature', 'pressure', 'flow', 'efficiency'],
        },
      },

      addAnomaly: (anomalyData) => {
        const anomaly: AnomalyDetection = {
          ...anomalyData,
          id: `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        set((state) => ({
          anomalies: [anomaly, ...state.anomalies].slice(0, 1000),
        }));
      },

      resolveAnomaly: (id, resolvedBy) => {
        set((state) => ({
          anomalies: state.anomalies.map((anomaly) =>
            anomaly.id === id
              ? { ...anomaly, isResolved: true, resolvedBy, resolvedAt: new Date() }
              : anomaly
          ),
        }));
      },

      addTrend: (trendData) => {
        const trend: TrendAnalysis = {
          ...trendData,
          id: `trend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        set((state) => ({
          trends: [
            trend,
            ...state.trends.filter(
              (t) => !(t.category === trend.category && t.timeframe === trend.timeframe)
            ),
          ].slice(0, 100),
        }));
      },

      updateModel: (model) => {
        set((state) => ({
          models: [model, ...state.models.filter((m) => m.id !== model.id)],
        }));
      },

      addAlertRule: (ruleData) => {
        const rule: AlertRule = {
          ...ruleData,
          id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          triggerCount: 0,
        };

        set((state) => ({
          alertRules: [...state.alertRules, rule],
        }));
      },

      toggleAlertRule: (id) => {
        set((state) => ({
          alertRules: state.alertRules.map((rule) =>
            rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
          ),
        }));
      },

      addInsight: (insightData) => {
        const insight: AIInsight = {
          ...insightData,
          id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          isRead: false,
          isBookmarked: false,
        };

        set((state) => ({
          insights: [insight, ...state.insights].slice(0, state.settings.insights.maxInsights),
        }));
      },

      markInsightAsRead: (id) => {
        set((state) => ({
          insights: state.insights.map((insight) =>
            insight.id === id ? { ...insight, isRead: true } : insight
          ),
        }));
      },

      bookmarkInsight: (id) => {
        set((state) => ({
          insights: state.insights.map((insight) =>
            insight.id === id ? { ...insight, isBookmarked: !insight.isBookmarked } : insight
          ),
        }));
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      // AI Analytics Functions
      detectAnomalies: (data, category) => {
        const { settings } = get();
        if (!settings.anomalyDetection.enabled) return [];

        const values = data.map((d) => d.value);
        const mean = calculateMean(values);
        const stdDev = calculateStandardDeviation(values);

        const threshold =
          settings.anomalyDetection.sensitivity === 'high'
            ? 1.5
            : settings.anomalyDetection.sensitivity === 'medium'
              ? 2.0
              : 2.5;

        const anomalies: AnomalyDetection[] = [];

        data.forEach((point, index) => {
          const deviation = Math.abs(point.value - mean);
          const zScore = stdDev > 0 ? deviation / stdDev : 0;

          if (zScore > threshold) {
            const severity =
              zScore > 3 ? 'critical' : zScore > 2.5 ? 'high' : zScore > 2 ? 'medium' : 'low';

            anomalies.push({
              id: `anomaly-${Date.now()}-${index}`,
              timestamp: point.timestamp,
              value: point.value,
              expectedValue: mean,
              deviation,
              severity,
              confidence: Math.min(zScore / 3, 1),
              description: `Value ${point.value.toFixed(2)} deviates significantly from expected ${mean.toFixed(2)}`,
              category,
              isResolved: false,
            });
          }
        });

        return anomalies;
      },

      analyzeTrends: (data, category) => {
        const values = data.map((d) => d.value);
        const timeIndices = data.map((_, i) => i);

        const correlation = calculateCorrelation(timeIndices, values);
        const slope =
          correlation *
          (calculateStandardDeviation(values) / calculateStandardDeviation(timeIndices));

        let direction: TrendAnalysis['direction'];
        if (Math.abs(slope) < 0.1) direction = 'stable';
        else if (slope > 0) direction = 'increasing';
        else direction = 'decreasing';

        // Check volatility
        const recentValues = values.slice(-10);
        const volatility = calculateStandardDeviation(recentValues) / calculateMean(recentValues);
        if (volatility > 0.2) direction = 'volatile';

        const lastValue = values[values.length - 1];
        const nextValue = lastValue + slope;
        const confidenceInterval: [number, number] = [
          nextValue - calculateStandardDeviation(values) * 0.5,
          nextValue + calculateStandardDeviation(values) * 0.5,
        ];

        return {
          id: `trend-${Date.now()}`,
          category,
          timeframe: '24h' as const,
          direction,
          confidence: Math.abs(correlation),
          slope,
          correlation,
          prediction: {
            nextValue,
            nextTimestamp: new Date(Date.now() + 60 * 60 * 1000), // 1 hour ahead
            confidenceInterval,
          },
          createdAt: new Date(),
        };
      },

      generatePrediction: (data, _modelType) => {
        const values = data.map((d) => d.value);
        const predictions: Array<{ timestamp: Date; value: number; confidence: number }> = [];

        // Simple linear prediction for demo
        const lastValue = values[values.length - 1];
        const trend = (lastValue - values[0]) / values.length;

        for (let i = 1; i <= 5; i++) {
          const nextTimestamp = new Date(Date.now() + i * 60 * 60 * 1000);
          const nextValue = lastValue + trend * i;
          const confidence = Math.max(0.1, 1 - i * 0.15); // Decreasing confidence

          predictions.push({
            timestamp: nextTimestamp,
            value: nextValue,
            confidence,
          });
        }

        return {
          nextValues: predictions,
          accuracy: 0.85, // Demo accuracy
        };
      },

      generateInsights: (data, categories) => {
        const insights: AIInsight[] = [];
        const now = new Date();

        // Generate sample insights based on data patterns
        categories.forEach((category) => {
          const categoryData = data.filter((d) => d.category === category);
          if (categoryData.length < 5) return;

          const values = categoryData.map((d) => d.value);
          const mean = calculateMean(values);
          const trend = (values[values.length - 1] - values[0]) / values.length;

          if (Math.abs(trend) > mean * 0.1) {
            insights.push({
              id: `insight-${Date.now()}-${category}`,
              type: trend > 0 ? 'warning' : 'optimization',
              title: `${category} Trend Alert`,
              description: `${category} values are ${trend > 0 ? 'increasing' : 'decreasing'} significantly`,
              category,
              confidence: 0.8,
              impact: 'medium',
              actionable: true,
              suggestedActions: [
                'Review operational parameters',
                'Check equipment status',
                'Analyze historical patterns',
              ],
              relatedData: {
                metrics: [category],
                timeframe: '24h',
                affectedSystems: ['monitoring', 'control'],
              },
              createdAt: now,
              isRead: false,
              isBookmarked: false,
            });
          }
        });

        return insights;
      },
    }),
    {
      name: 'ai-analytics-store',
      version: 1,
    }
  )
);
