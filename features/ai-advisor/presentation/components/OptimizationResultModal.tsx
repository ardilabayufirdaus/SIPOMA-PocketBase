import React, { useState } from 'react';
import {
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChevronLeftIcon,
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
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<OptimizationRecommendation | null>(null);

  const handleClose = () => {
    setSelectedRecommendation(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        selectedRecommendation
          ? `Detail Analisa: ${selectedRecommendation.parameterName}`
          : 'AI Parameter Optimization Advisor'
      }
      description={
        selectedRecommendation
          ? 'Penjelasan rinci mengenai rekomendasi optimasi.'
          : 'Rekomendasi setpoint berdasarkan knowledge base dan analisa historis.'
      }
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
        ) : selectedRecommendation ? (
          // DETAILED VIEW
          <div className="animate-fadeIn">
            <button
              onClick={() => setSelectedRecommendation(null)}
              className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <ChevronLeftIcon className="w-4 h-4" /> Kembali ke daftar
            </button>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              {/* Header Stats */}
              <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Current Value
                  </label>
                  <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                    {selectedRecommendation.currentValue}
                  </p>
                </div>

                <div className="flex-1 flex justify-center">
                  <div
                    className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${
                      selectedRecommendation.recommendedAction === 'Increase'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200'
                        : selectedRecommendation.recommendedAction === 'Decrease'
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-200'
                          : 'bg-blue-500/10 text-blue-600 border border-blue-200'
                    }`}
                  >
                    {selectedRecommendation.recommendedAction === 'Increase' && (
                      <ArrowTrendingUpIcon className="w-5 h-5" />
                    )}
                    {selectedRecommendation.recommendedAction === 'Decrease' && (
                      <ArrowTrendingDownIcon className="w-5 h-5" />
                    )}
                    {selectedRecommendation.recommendedAction === 'Maintain' && (
                      <MinusIcon className="w-5 h-5" />
                    )}
                    <span className="text-lg uppercase">
                      {selectedRecommendation.recommendedAction}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Target Value
                  </label>
                  <p className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedRecommendation.targetValue || '-'}
                  </p>
                </div>
              </div>

              {/* Analysis Content */}
              <div className="space-y-6">
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-2">
                    <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                    Analisa & Reasoning
                  </h4>
                  <div className="bg-white dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 leading-relaxed text-slate-700 dark:text-slate-300">
                    <p className="whitespace-pre-line">{selectedRecommendation.reasoning}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Prediksi Dampak</h4>
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400 italic">
                    " {selectedRecommendation.impactPrediction} "
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // LIST VIEW
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedRecommendation(rec)}
                className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
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
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 italic line-clamp-2">
                      " {rec.impactPrediction} "
                    </p>
                    <p className="text-[10px] text-indigo-500 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Klik untuk detail &rarr;
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
            onClick={handleClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
