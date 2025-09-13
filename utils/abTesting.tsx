/**
 * Advanced A/B Testing Framework
 * Comprehensive testing system with analytics and variant management
 */

import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface ABTestVariant {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  weight: number; // 0-1, probability of being selected
  metadata?: Record<string, any>;
}

interface ABTestConfig {
  id: string;
  name: string;
  description?: string;
  variants: ABTestVariant[];
  startDate?: Date;
  endDate?: Date;
  targetAudience?: {
    userRoles?: string[];
    userIds?: string[];
    percentage?: number; // 0-100
  };
  goals?: {
    primary: string;
    secondary?: string[];
  };
}

interface ABTestResult {
  testId: string;
  variantId: string;
  userId: string;
  timestamp: number;
  event: string;
  metadata?: Record<string, any>;
}

interface ABTestAnalytics {
  testId: string;
  variantId: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  confidence: number;
  isSignificant: boolean;
  winner?: string;
}

// =============================================================================
// A/B TESTING CONTEXT
// =============================================================================

interface ABTestingContextType {
  activeTests: Map<string, ABTestConfig>;
  userVariants: Map<string, string>;
  results: ABTestResult[];
  analytics: Map<string, ABTestAnalytics>;

  // Methods
  registerTest: (config: ABTestConfig) => void;
  getVariant: (testId: string, userId?: string) => ABTestVariant | null;
  trackEvent: (
    testId: string,
    variantId: string,
    event: string,
    metadata?: Record<string, any>
  ) => void;
  getAnalytics: (testId: string) => ABTestAnalytics[];
  getWinner: (testId: string) => string | null;
  resetTest: (testId: string) => void;
}

const ABTestingContext = createContext<ABTestingContextType | null>(null);

export const useABTesting = () => {
  const context = useContext(ABTestingContext);
  if (!context) {
    throw new Error("useABTesting must be used within ABTestingProvider");
  }
  return context;
};

// =============================================================================
// A/B TESTING PROVIDER
// =============================================================================

interface ABTestingProviderProps {
  children: React.ReactNode;
  userId?: string;
  enablePersistence?: boolean;
  onEventTracked?: (result: ABTestResult) => void;
}

export const ABTestingProvider: React.FC<ABTestingProviderProps> = ({
  children,
  userId = "anonymous",
  enablePersistence = true,
  onEventTracked,
}) => {
  const [activeTests] = useState(new Map<string, ABTestConfig>());
  const [userVariants] = useState(new Map<string, string>());
  const [results, setResults] = useState<ABTestResult[]>([]);
  const [analytics] = useState(new Map<string, ABTestAnalytics>());

  // Load persisted data
  useEffect(() => {
    if (!enablePersistence) return;

    try {
      const persistedVariants = localStorage.getItem(`ab_variants_${userId}`);
      const persistedResults = localStorage.getItem(`ab_results_${userId}`);

      if (persistedVariants) {
        const variants = JSON.parse(persistedVariants);
        Object.entries(variants).forEach(([testId, variantId]) => {
          userVariants.set(testId, variantId as string);
        });
      }

      if (persistedResults) {
        setResults(JSON.parse(persistedResults));
      }
    } catch (error) {
      console.warn("Failed to load A/B testing data:", error);
    }
  }, [userId, enablePersistence, userVariants]);

  // Persist data
  useEffect(() => {
    if (!enablePersistence) return;

    const variants = Object.fromEntries(userVariants);
    const resultsData = JSON.stringify(results);

    try {
      localStorage.setItem(`ab_variants_${userId}`, JSON.stringify(variants));
      localStorage.setItem(`ab_results_${userId}`, resultsData);
    } catch (error) {
      console.warn("Failed to persist A/B testing data:", error);
    }
  }, [userVariants, results, userId, enablePersistence]);

  const registerTest = useCallback(
    (config: ABTestConfig) => {
      activeTests.set(config.id, config);
    },
    [activeTests]
  );

  const getVariant = useCallback(
    (testId: string, testUserId?: string): ABTestVariant | null => {
      const currentUserId = testUserId || userId;
      const config = activeTests.get(testId);

      if (!config) return null;

      // Check if user is in target audience
      if (config.targetAudience) {
        const { userRoles, userIds, percentage } = config.targetAudience;

        if (userIds && !userIds.includes(currentUserId)) return null;
        if (percentage && Math.random() * 100 > percentage) return null;
        // Note: userRoles check would require additional user context
      }

      // Check if test is within date range
      const now = new Date();
      if (config.startDate && now < config.startDate) return null;
      if (config.endDate && now > config.endDate) return null;

      // Return cached variant if exists
      const cachedVariantId = userVariants.get(testId);
      if (cachedVariantId) {
        return config.variants.find((v) => v.id === cachedVariantId) || null;
      }

      // Select variant using weighted random selection
      const random = Math.random();
      let cumulativeWeight = 0;

      for (const variant of config.variants) {
        cumulativeWeight += variant.weight;
        if (random <= cumulativeWeight) {
          userVariants.set(testId, variant.id);
          return variant;
        }
      }

      // Fallback to first variant
      const fallbackVariant = config.variants[0];
      if (fallbackVariant) {
        userVariants.set(testId, fallbackVariant.id);
        return fallbackVariant;
      }

      return null;
    },
    [activeTests, userVariants, userId]
  );

  const trackEvent = useCallback(
    (
      testId: string,
      variantId: string,
      event: string,
      metadata?: Record<string, any>
    ) => {
      const result: ABTestResult = {
        testId,
        variantId,
        userId,
        timestamp: Date.now(),
        event,
        metadata,
      };

      setResults((prev) => [...prev, result]);
      onEventTracked?.(result);

      // Update analytics
      const analyticsKey = `${testId}_${variantId}`;
      const currentAnalytics = analytics.get(analyticsKey) || {
        testId,
        variantId,
        impressions: 0,
        conversions: 0,
        conversionRate: 0,
        confidence: 0,
        isSignificant: false,
      };

      if (event === "impression") {
        currentAnalytics.impressions++;
      } else if (event === "conversion") {
        currentAnalytics.conversions++;
      }

      currentAnalytics.conversionRate =
        currentAnalytics.impressions > 0
          ? currentAnalytics.conversions / currentAnalytics.impressions
          : 0;

      analytics.set(analyticsKey, currentAnalytics);
    },
    [userId, analytics, onEventTracked]
  );

  const getAnalytics = useCallback(
    (testId: string): ABTestAnalytics[] => {
      const testAnalytics: ABTestAnalytics[] = [];
      const config = activeTests.get(testId);

      if (!config) return testAnalytics;

      config.variants.forEach((variant) => {
        const analyticsKey = `${testId}_${variant.id}`;
        const variantAnalytics = analytics.get(analyticsKey);

        if (variantAnalytics) {
          testAnalytics.push(variantAnalytics);
        }
      });

      return testAnalytics;
    },
    [activeTests, analytics]
  );

  const getWinner = useCallback(
    (testId: string): string | null => {
      const testAnalytics = getAnalytics(testId);

      if (testAnalytics.length < 2) return null;

      // Simple winner determination based on conversion rate
      // In production, use statistical significance testing
      let winner = null;
      let bestRate = 0;

      testAnalytics.forEach((analytics) => {
        if (analytics.conversionRate > bestRate && analytics.impressions > 10) {
          bestRate = analytics.conversionRate;
          winner = analytics.variantId;
        }
      });

      return winner;
    },
    [getAnalytics]
  );

  const resetTest = useCallback(
    (testId: string) => {
      // Remove cached variant
      userVariants.delete(testId);

      // Remove results for this test
      setResults((prev) => prev.filter((r) => r.testId !== testId));

      // Remove analytics for this test
      const keysToDelete: string[] = [];
      analytics.forEach((_, key) => {
        if (key.startsWith(`${testId}_`)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => analytics.delete(key));

      // Clear localStorage
      if (enablePersistence) {
        try {
          const persistedVariants = localStorage.getItem(
            `ab_variants_${userId}`
          );
          if (persistedVariants) {
            const variants = JSON.parse(persistedVariants);
            delete variants[testId];
            localStorage.setItem(
              `ab_variants_${userId}`,
              JSON.stringify(variants)
            );
          }

          const persistedResults = localStorage.getItem(`ab_results_${userId}`);
          if (persistedResults) {
            const allResults = JSON.parse(persistedResults);
            const filteredResults = allResults.filter(
              (r: ABTestResult) => r.testId !== testId
            );
            localStorage.setItem(
              `ab_results_${userId}`,
              JSON.stringify(filteredResults)
            );
          }
        } catch (error) {
          console.warn("Failed to clear A/B testing data:", error);
        }
      }
    },
    [userVariants, enablePersistence, userId, analytics]
  );

  const contextValue: ABTestingContextType = {
    activeTests,
    userVariants,
    results,
    analytics,
    registerTest,
    getVariant,
    trackEvent,
    getAnalytics,
    getWinner,
    resetTest,
  };

  return (
    <ABTestingContext.Provider value={contextValue}>
      {children}
    </ABTestingContext.Provider>
  );
};

// =============================================================================
// ENHANCED A/B TEST COMPONENT
// =============================================================================

interface EnhancedABTestProps {
  testId: string;
  variants: ABTestVariant[];
  fallback?: React.ComponentType<any>;
  trackImpressions?: boolean;
  trackConversions?: boolean;
  conversionEvent?: string;
  className?: string;
  onVariantSelected?: (variantId: string) => void;
}

export const EnhancedABTest: React.FC<EnhancedABTestProps> = ({
  testId,
  variants,
  fallback: Fallback,
  trackImpressions = true,
  trackConversions = false,
  conversionEvent = "conversion",
  className = "",
  onVariantSelected,
}) => {
  const { getVariant, trackEvent } = useABTesting();
  const [selectedVariant, setSelectedVariant] = useState<ABTestVariant | null>(
    null
  );
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  useEffect(() => {
    const variant = getVariant(testId);
    if (variant) {
      setSelectedVariant(variant);
      onVariantSelected?.(variant.id);

      if (trackImpressions && !hasTrackedImpression) {
        trackEvent(testId, variant.id, "impression");
        setHasTrackedImpression(true);
      }
    }
  }, [
    testId,
    getVariant,
    trackEvent,
    trackImpressions,
    hasTrackedImpression,
    onVariantSelected,
  ]);

  const handleConversion = useCallback(() => {
    if (selectedVariant && trackConversions) {
      trackEvent(testId, selectedVariant.id, conversionEvent);
    }
  }, [selectedVariant, trackConversions, trackEvent, testId, conversionEvent]);

  if (!selectedVariant) {
    return Fallback ? <Fallback className={className} /> : null;
  }

  const VariantComponent = selectedVariant.component;

  return (
    <div
      className={className}
      data-ab-test={testId}
      data-ab-variant={selectedVariant.id}
      onClick={trackConversions ? handleConversion : undefined}
    >
      <VariantComponent />
    </div>
  );
};

// =============================================================================
// A/B TEST HOOKS
// =============================================================================

export const useABTestVariant = (testId: string) => {
  const { getVariant } = useABTesting();
  const [variant, setVariant] = useState<ABTestVariant | null>(null);

  useEffect(() => {
    const selectedVariant = getVariant(testId);
    setVariant(selectedVariant);
  }, [testId, getVariant]);

  return variant;
};

export const useABTestTracking = (testId: string, variantId: string) => {
  const { trackEvent } = useABTesting();

  const trackImpression = useCallback(() => {
    trackEvent(testId, variantId, "impression");
  }, [testId, variantId, trackEvent]);

  const trackConversion = useCallback(
    (event = "conversion", metadata?: Record<string, any>) => {
      trackEvent(testId, variantId, event, metadata);
    },
    [testId, variantId, trackEvent]
  );

  const trackCustomEvent = useCallback(
    (event: string, metadata?: Record<string, any>) => {
      trackEvent(testId, variantId, event, metadata);
    },
    [testId, variantId, trackEvent]
  );

  return {
    trackImpression,
    trackConversion,
    trackCustomEvent,
  };
};

// =============================================================================
// A/B TEST ANALYTICS COMPONENTS
// =============================================================================

interface ABTestAnalyticsDashboardProps {
  testId: string;
  className?: string;
}

export const ABTestAnalyticsDashboard: React.FC<
  ABTestAnalyticsDashboardProps
> = ({ testId, className = "" }) => {
  const { getAnalytics, getWinner } = useABTesting();
  const analytics = getAnalytics(testId);
  const winner = getWinner(testId);

  if (analytics.length === 0) {
    return (
      <div className={`p-6 text-center text-neutral-500 ${className}`}>
        No analytics data available for this test.
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          A/B Test Analytics: {testId}
        </h3>
        {winner && (
          <div className="px-3 py-1 bg-success-100 text-success-800 rounded-full text-sm font-medium">
            Winner: {winner}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {analytics.map((data) => (
          <div
            key={data.variantId}
            className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                Variant {data.variantId}
              </h4>
              {winner === data.variantId && (
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Impressions:
                </span>
                <span className="font-medium">
                  {data.impressions.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Conversions:
                </span>
                <span className="font-medium">
                  {data.conversions.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Conversion Rate:
                </span>
                <span className="font-medium">
                  {(data.conversionRate * 100).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(data.conversionRate * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// PRESET A/B TEST VARIANTS
// =============================================================================

export const createButtonVariants = (baseProps: any) => [
  {
    id: "primary",
    name: "Primary Button",
    weight: 0.5,
    component: () => <button {...baseProps} className="btn-primary" />,
  },
  {
    id: "primary-large",
    name: "Primary Large Button",
    weight: 0.3,
    component: () => (
      <button {...baseProps} className="btn-primary btn-large" />
    ),
  },
  {
    id: "secondary",
    name: "Secondary Button",
    weight: 0.2,
    component: () => <button {...baseProps} className="btn-secondary" />,
  },
];

export const createLayoutVariants = (content: React.ReactNode) => [
  {
    id: "single-column",
    name: "Single Column",
    weight: 0.6,
    component: () => <div className="max-w-4xl mx-auto">{content}</div>,
  },
  {
    id: "two-column",
    name: "Two Column",
    weight: 0.4,
    component: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <div>{content}</div>
        <div>{content}</div>
      </div>
    ),
  },
];

export const createColorVariants = (content: React.ReactNode) => [
  {
    id: "blue-theme",
    name: "Blue Theme",
    weight: 0.4,
    component: () => <div className="theme-blue">{content}</div>,
  },
  {
    id: "green-theme",
    name: "Green Theme",
    weight: 0.4,
    component: () => <div className="theme-green">{content}</div>,
  },
  {
    id: "purple-theme",
    name: "Purple Theme",
    weight: 0.2,
    component: () => <div className="theme-purple">{content}</div>,
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const calculateStatisticalSignificance = (
  variantA: ABTestAnalytics,
  variantB: ABTestAnalytics
): { confidence: number; isSignificant: boolean } => {
  // Simplified statistical significance calculation
  // In production, use proper statistical testing libraries

  const totalA = variantA.impressions;
  const totalB = variantB.impressions;
  const conversionsA = variantA.conversions;
  const conversionsB = variantB.conversions;

  if (totalA === 0 || totalB === 0) {
    return { confidence: 0, isSignificant: false };
  }

  const rateA = conversionsA / totalA;
  const rateB = conversionsB / totalB;

  // Simple z-test approximation
  const pooledRate = (conversionsA + conversionsB) / (totalA + totalB);
  const se = Math.sqrt(
    pooledRate * (1 - pooledRate) * (1 / totalA + 1 / totalB)
  );
  const zScore = Math.abs(rateA - rateB) / se;

  // Convert z-score to confidence level (simplified)
  const confidence = Math.min(zScore * 20, 99.9);
  const isSignificant = confidence > 95; // 95% confidence threshold

  return { confidence, isSignificant };
};

export const generateABTestReport = (
  testId: string,
  analytics: ABTestAnalytics[]
): string => {
  let report = `# A/B Test Report: ${testId}\n\n`;
  report += `Generated on: ${new Date().toLocaleString()}\n\n`;

  analytics.forEach((data, index) => {
    report += `## Variant ${data.variantId}\n`;
    report += `- Impressions: ${data.impressions.toLocaleString()}\n`;
    report += `- Conversions: ${data.conversions.toLocaleString()}\n`;
    report += `- Conversion Rate: ${(data.conversionRate * 100).toFixed(2)}%\n`;
    report += `- Confidence: ${data.confidence.toFixed(2)}%\n`;
    report += `- Significant: ${data.isSignificant ? "Yes" : "No"}\n\n`;
  });

  if (analytics.length > 1) {
    const winner = analytics.reduce((prev, current) =>
      prev.conversionRate > current.conversionRate ? prev : current
    );
    report += `## Winner: Variant ${winner.variantId}\n`;
    report += `Best conversion rate: ${(winner.conversionRate * 100).toFixed(
      2
    )}%\n`;
  }

  return report;
};

// =============================================================================
// EXPORT ALL A/B TESTING COMPONENTS
// =============================================================================

export default {
  ABTestingProvider,
  EnhancedABTest,
  ABTestAnalyticsDashboard,
  useABTesting,
  useABTestVariant,
  useABTestTracking,
  createButtonVariants,
  createLayoutVariants,
  createColorVariants,
  calculateStatisticalSignificance,
  generateABTestReport,
};
