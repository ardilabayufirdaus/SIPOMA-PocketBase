import React, { useState } from 'react';
import { AnalyzeRootCause } from '../../domain/usecases/AnalyzeRootCause';
import { PocketBaseDowntimeRepository } from '../../data/repositories/PocketBaseDowntimeRepository';
import { XAiAdvisorService } from '../../data/services/XAiAdvisorService';
import { DowntimeLog } from '../../domain/entities/DowntimeLog';
import { Sparkles, X, Loader2, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface RcaAnalysisButtonProps {
  currentDowntime: Partial<DowntimeLog>; // Partial because user might be typing
  onAnalysisComplete?: (analysis: string) => void;
  disabled?: boolean;
}

export const RcaAnalysisButton: React.FC<RcaAnalysisButtonProps> = ({
  currentDowntime,
  onAnalysisComplete,
  disabled,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!currentDowntime.problem || !currentDowntime.unit) {
      setError('Mohon isi Unit dan Masalah terlebih dahulu.');
      setIsOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    setIsOpen(true);

    try {
      // Lazy instantiation of dependencies to prevent module evaluation side-effects
      const downtimeRepo = new PocketBaseDowntimeRepository();
      const aiService = new XAiAdvisorService();
      const analyzeUseCase = new AnalyzeRootCause(downtimeRepo, aiService);

      // Cast to DowntimeLog safely
      const logToAnalyze: DowntimeLog = {
        id: 'new',
        date: new Date().toISOString(),
        startTime: currentDowntime.startTime || '',
        endTime: currentDowntime.endTime || '',
        pic: currentDowntime.pic || '',
        problem: currentDowntime.problem,
        unit: currentDowntime.unit,
        action: currentDowntime.action || '',
      };

      const analysis = await analyzeUseCase.execute(logToAnalyze);
      setResult(analysis);
      if (onAnalysisComplete) {
        onAnalysisComplete(analysis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat analisa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={disabled || loading}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all text-sm font-medium shadow-sm"
      >
        <Sparkles className="w-4 h-4" />
        {loading ? 'Menganalisa...' : 'AI RCA'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-t-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                  AI Root Cause Analysis
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-gray-700 dark:text-gray-300">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                  <p className="text-sm font-medium animate-pulse">
                    Sedang menganalisa history downtime & mencari akar masalah...
                  </p>
                </div>
              ) : error ? (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {/* Render Markdown result */}
                  <ReactMarkdown>{result || ''}</ReactMarkdown>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
