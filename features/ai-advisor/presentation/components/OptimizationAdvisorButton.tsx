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
        if (err.message.includes('API Key')) msg = 'Kunci API AI belum disetting.';
        else if (err.message.includes('No parameter'))
          msg = 'Tidak ada data parameter untuk unit ini hari ini.';
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
        className={`group relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg transition-all duration-300 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 ${className}`}
        title="AI Optimization Advisor"
      >
        <LightBulbIcon className="w-5 h-5 group-hover:text-yellow-300 transition-colors" />
        <span className="font-medium">AI Optimize</span>
        <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
