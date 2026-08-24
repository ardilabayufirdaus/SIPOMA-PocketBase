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
        className={`min-h-[44px] group relative inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${className}`}
        title="AI Optimization Advisor"
      >
        <LightBulbIcon className="w-5 h-5 group-hover:text-amber-300 transition-colors" />
        <span className="font-bold">AI Optimize</span>
        <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
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
