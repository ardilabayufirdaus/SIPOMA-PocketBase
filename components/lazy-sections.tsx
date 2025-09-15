import React, { Suspense, lazy } from "react";
import { ErrorBoundary } from "react-error-boundary";

// Lazy load dashboard sections
const ProductionTrendSection = lazy(
  () =>
    import(
      "../pages/plant_operations/dashboard/sections/ProductionTrendSection"
    )
);

const CopAnalysisSection = lazy(
  () =>
    import("../pages/plant_operations/dashboard/sections/CopAnalysisSection")
);

const WorkInstructionsSection = lazy(
  () =>
    import(
      "../pages/plant_operations/dashboard/sections/WorkInstructionsSection"
    )
);

const CcrParametersSection = lazy(
  () =>
    import("../pages/plant_operations/dashboard/sections/CcrParametersSection")
);

// Loading component
const SectionLoader = ({ sectionName }: { sectionName: string }) => (
  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-sm text-gray-600 dark:text-slate-400">
          Loading {sectionName}...
        </div>
      </div>
    </div>
  </div>
);

// Error fallback component
const SectionErrorFallback = ({
  error,
  resetErrorBoundary,
  sectionName,
}: {
  error: Error;
  resetErrorBoundary: () => void;
  sectionName: string;
}) => (
  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-red-600 text-lg font-semibold mb-2">
          Failed to load {sectionName}
        </div>
        <div className="text-gray-600 dark:text-slate-400 mb-4 text-sm">
          {error.message}
        </div>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

// Lazy loaded section wrapper
const LazySection = ({
  children,
  sectionName,
}: {
  children: React.ReactNode;
  sectionName: string;
}) => (
  <ErrorBoundary
    FallbackComponent={(props) => (
      <SectionErrorFallback {...props} sectionName={sectionName} />
    )}
  >
    <Suspense fallback={<SectionLoader sectionName={sectionName} />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// Export lazy loaded sections
export const LazyProductionTrendSection = (props: any) => (
  <LazySection sectionName="Production Trend">
    <ProductionTrendSection {...props} />
  </LazySection>
);

export const LazyCopAnalysisSection = (props: any) => (
  <LazySection sectionName="COP Analysis">
    <CopAnalysisSection {...props} />
  </LazySection>
);

export const LazyWorkInstructionsSection = (props: any) => (
  <LazySection sectionName="Work Instructions">
    <WorkInstructionsSection {...props} />
  </LazySection>
);

export const LazyCcrParametersSection = (props: any) => (
  <LazySection sectionName="CCR Parameters">
    <CcrParametersSection {...props} />
  </LazySection>
);
