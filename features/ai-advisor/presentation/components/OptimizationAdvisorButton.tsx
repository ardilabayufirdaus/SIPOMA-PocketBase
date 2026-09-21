import React, { useState } from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import { XAiAdvisorService } from '../../data/services/XAiAdvisorService';
import { PocketBaseOptimizationRepository } from '../../data/repositories/PocketBaseOptimizationRepository';
import { OptimizeParameters } from '../../domain/usecases/OptimizeParameters';
import { OptimizationRecommendation } from '../../domain/entities/OptimizationEntities';
import { OptimizationResultModal } from './OptimizationResultModal';

interface OptimizationAdvisorButtonProps {
  unit: string;
  className?: string;
}

export const OptimizationAdvisorButton: React.FC<OptimizationAdvisorButtonProps> = ({
  unit,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    setRecommendations([]);

    try {
      const optimizationRepo = new PocketBaseOptimizationRepository();
      const aiService = new XAiAdvisorService();
      const useCase = new OptimizeParameters(optimizationRepo, aiService);

      const result = await useCase.execute(unit);
      setRecommendations(result);
    } catch (err: any) {
      console.error('Optimization error:', err);
      // Nice error message
      let msg = 'Gagal menganalisa parameter.';
      if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOptimize}
        aria-label="AI Optimization Advisor"
        className={`min-h-[34px] h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs hover:shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-40 disabled:cursor-not-allowed ${className || ''}`}
        title="AI Optimization Advisor"
      >
        <LightBulbIcon className="w-3.5 h-3.5 text-amber-200" />
        <span>AI Optimize</span>
      </button>

      <OptimizationResultModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isLoading={isLoading}
        recommendations={recommendations}
        error={error}
      />
    </>
  );
};
