import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Calendar,
  Zap,
  Clock,
  Package,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useAiReviews } from '../../hooks/useAiReviews';
import { formatDate } from '../../utils/formatters';

interface AiOperationalReviewProps {
  t: Record<string, string>;
  language?: 'en' | 'id';
}

const AiOperationalReview: React.FC<AiOperationalReviewProps> = ({ t, language = 'id' }) => {
  const { data: reviews, isLoading } = useAiReviews();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/90 dark:border-slate-800 shadow-2xs animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36"></div>
          </div>
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return null;
  }

  const currentReview = reviews[currentIndex];

  const nextReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const effScore = currentReview.metrics_summary?.efficiency_score ?? 90;
  const prodTon = currentReview.metrics_summary?.total_production ?? 0;
  const dtHours = currentReview.metrics_summary?.downtime_hours ?? 0;

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden transition-all duration-300">
      {/* Subtle Gradient Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500"></div>

      {/* Main Compact Banner Row */}
      <div className="p-2.5 sm:p-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left: AI Icon + Title & Unit */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider truncate">
                {t.ai_review_title ||
                  (language === 'en' ? 'AI Operational Review' : 'Tinjauan Operasional AI')}
              </h2>
              <span className="text-[9px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.2 rounded-full uppercase tracking-tight">
                {t.ai_badge_intelligence || 'INTELLIGENCE'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
              <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span>{formatDate(currentReview.date)}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                {currentReview.plant_unit}
              </span>
            </p>
          </div>
        </div>

        {/* Middle/Right: Quick Compact KPI Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Produksi Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-[10px]">
            <Package className="w-3 h-3 text-cyan-500 flex-shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {t.ai_kpi_prod || 'Prod:'}
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {prodTon.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}{' '}
              {t.unit_tons_short || 'T'}
            </span>
          </div>

          {/* Downtime Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-[10px]">
            <Clock className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {t.ai_kpi_downtime || 'Downtime:'}
            </span>
            <span
              className={`font-bold tabular-nums ${
                dtHours > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {dtHours} {t.unit_hours || (language === 'en' ? 'Hours' : 'Jam')}
            </span>
          </div>

          {/* Efisiensi Score Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[10px]">
            <Zap className="w-3 h-3 text-emerald-500 flex-shrink-0" />
            <span className="text-emerald-700 dark:text-emerald-300 font-medium">
              {t.ai_kpi_efficiency || (language === 'en' ? 'Efficiency:' : 'Efisiensi:')}
            </span>
            <span className="font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
              {effScore}%
            </span>
          </div>

          {/* Unit Switcher Buttons (if multiple reviews) */}
          {reviews.length > 1 && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 flex-shrink-0">
              <button
                type="button"
                onClick={prevReview}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                title={t.ai_unit_prev || (language === 'en' ? 'Previous Unit' : 'Unit Sebelumnya')}
                aria-label={
                  t.ai_unit_prev || (language === 'en' ? 'Previous Unit' : 'Unit Sebelumnya')
                }
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 px-1.5 tabular-nums">
                {currentIndex + 1}/{reviews.length}
              </span>
              <button
                type="button"
                onClick={nextReview}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                title={t.ai_unit_next || (language === 'en' ? 'Next Unit' : 'Unit Berikutnya')}
                aria-label={t.ai_unit_next || (language === 'en' ? 'Next Unit' : 'Unit Berikutnya')}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Toggle Expand / Collapse Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            className={`
              inline-flex items-center gap-1.5 min-h-[28px] px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all
              focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary-500 focus-visible:outline-none border flex-shrink-0
              ${
                isExpanded
                  ? 'bg-primary-600 text-white border-primary-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }
            `}
          >
            <span>
              {isExpanded
                ? t.ai_close_detail || (language === 'en' ? 'Close Details' : 'Tutup Detail')
                : t.ai_open_analysis || (language === 'en' ? 'Open Analysis' : 'Buka Analisis')}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-3 h-3 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Detailed Analysis Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
          >
            <div className="p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-2 gap-3 bg-slate-50/40 dark:bg-slate-900/50">
              {/* Hasil Analisis */}
              <div className="space-y-1.5">
                <h3 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                  {t.ai_review_result ||
                    (language === 'en'
                      ? 'Operational Analysis Results'
                      : 'Hasil Analisis Operasional')}
                </h3>
                <div className="prose prose-xs dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-xs leading-relaxed bg-white dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/70 dark:border-slate-800">
                  <ReactMarkdown>{currentReview.review_content}</ReactMarkdown>
                </div>
              </div>

              {/* Rekomendasi Strategis */}
              <div className="space-y-1.5">
                <h3 className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  {t.ai_recommendations ||
                    (language === 'en'
                      ? 'Strategic Action Recommendations'
                      : 'Rekomendasi Tindakan Strategis')}
                </h3>
                <div className="prose prose-xs dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-xs leading-relaxed bg-amber-50/40 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                  <ReactMarkdown>{currentReview.recommendations}</ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiOperationalReview;
