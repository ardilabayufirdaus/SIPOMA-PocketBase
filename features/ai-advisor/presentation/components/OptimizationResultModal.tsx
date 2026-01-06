import React from 'react';
import {
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import Modal from '../../../../components/Modal';
import { OptimizationRecommendation } from '../../domain/entities/OptimizationEntities';

interface OptimizationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  recommendations: OptimizationRecommendation[];
  error?: string | null;
}

export const OptimizationResultModal: React.FC<OptimizationResultModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  recommendations,
  error,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Parameter Optimization Advisor"
      description="Rekomendasi setpoint berdasarkan knowledge base dan analisa historis."
      maxWidth="4xl"
    >
      <div className="mt-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 dark:text-slate-300 animate-pulse">
              Menganalisa parameter proses...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <LightBulbIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Parameter saat ini terlihat optimal. Tidak ada rekomendasi signifikan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {rec.parameterName}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Current: {rec.currentValue}
                    </p>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                      rec.recommendedAction === 'Increase'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : rec.recommendedAction === 'Decrease'
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {rec.recommendedAction === 'Increase' && (
                      <ArrowTrendingUpIcon className="w-3 h-3" />
                    )}
                    {rec.recommendedAction === 'Decrease' && (
                      <ArrowTrendingDownIcon className="w-3 h-3" />
                    )}
                    {rec.recommendedAction === 'Maintain' && <MinusIcon className="w-3 h-3" />}
                    {rec.recommendedAction}
                    {rec.targetValue && ` -> ${rec.targetValue}`}
                  </div>
                </div>
                <div className="space-y-2">
                  <p
                    className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3"
                    title={rec.reasoning}
                  >
                    <span className="text-slate-400 dark:text-slate-500 font-semibold block text-xs uppercase mb-1">
                      Reasoning
                    </span>
                    {rec.reasoning}
                  </p>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 italic">
                      " {rec.impactPrediction} "
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
