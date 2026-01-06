export interface ParameterSnapshot {
  parameterName: string;
  currentValue: number;
  unit: string;
  timestamp: string;
}

export interface OptimizationRecommendation {
  parameterName: string;
  currentValue: number;
  recommendedAction: 'Increase' | 'Decrease' | 'Maintain';
  targetValue?: number; // Optional specific target
  reasoning: string;
  impactPrediction: string;
}
