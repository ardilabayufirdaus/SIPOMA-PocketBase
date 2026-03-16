import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Calendar,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useAiReviews } from '../../hooks/useAiReviews';
import { formatDate } from '../../utils/formatters';

interface AiOperationalReviewProps {
  t: Record<string, string>;
}

const AiOperationalReview: React.FC<AiOperationalReviewProps> = ({ t }) => {
  const { data: reviews, isLoading } = useAiReviews();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-48"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return null;
  }

  const currentReview = reviews[currentIndex];

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Decorative Gradient Header */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-right from-[#E95420] via-[#772953] to-[#E95420]"></div>

      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/10 rounded-xl flex items-center justify-center text-[#E95420]">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {t.ai_review_title || 'Operational AI Review'}
                <span className="text-[10px] font-bold bg-[#E95420] text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  PREMIUM
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar size={12} />
                {t.review_for || 'Review for'} {formatDate(currentReview.date)} •{' '}
                {currentReview.plant_unit}
              </p>
            </div>
          </div>

          {reviews.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={prevReview}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 transition-colors"
                title="Previous Unit"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                {currentIndex + 1} / {reviews.length}
              </div>
              <button
                onClick={nextReview}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 transition-colors"
                title="Next Unit"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentReview.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Review Content */}
            <div className="lg:col-span-2 space-y-6">
              <section>
                <h4 className="text-[11px] font-bold text-[#808080] dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#E95420]" />
                  {t.ai_review_result || 'Hasil Review'}
                </h4>
                <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <ReactMarkdown>{currentReview.review_content}</ReactMarkdown>
                </div>
              </section>

              <section>
                <h4 className="text-[11px] font-bold text-[#808080] dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500" />
                  {t.ai_recommendations || 'Rekomendasi Strategis'}
                </h4>
                <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-50/30 dark:bg-amber-500/5 p-4 rounded-xl border border-amber-100/50 dark:border-amber-500/10">
                  <ReactMarkdown>{currentReview.recommendations}</ReactMarkdown>
                </div>
              </section>
            </div>

            {/* Metrics Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <h4 className="text-[11px] font-bold text-[#808080] dark:text-slate-500 uppercase tracking-widest mb-3 px-1">
                {t.ai_metrics_title || 'Indikator Utama'}
              </h4>

              <MetricCard
                label={t.total_production || 'Produksi Total'}
                value={`${currentReview.metrics_summary.total_production.toLocaleString('id-ID')} Ton`}
                icon="package"
              />
              <MetricCard
                label={t.total_downtime || 'Total Downtime'}
                value={`${currentReview.metrics_summary.downtime_hours} Jam`}
                icon="clock"
                status={currentReview.metrics_summary.downtime_hours > 0 ? 'warning' : 'success'}
              />
              <MetricCard
                label={t.efficiency_score || 'Skor Efisiensi'}
                value={`${currentReview.metrics_summary.efficiency_score}%`}
                icon="zap"
                progress={currentReview.metrics_summary.efficiency_score}
                status={
                  currentReview.metrics_summary.efficiency_score > 90
                    ? 'success'
                    : currentReview.metrics_summary.efficiency_score > 70
                      ? 'warning'
                      : 'error'
                }
              />

              <div className="mt-8 p-4 bg-[#772953]/5 dark:bg-[#772953]/10 rounded-xl border border-[#772953]/10 text-center">
                <p className="text-[10px] text-[#772953] dark:text-pink-300/80 font-medium italic">
                  "AI provided insights based on historical patterns and real-time production
                  metrics."
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  icon: string;
  status?: 'success' | 'warning' | 'error';
  progress?: number;
}> = ({ label, value, status, progress }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-emerald-500';
      case 'warning':
        return 'text-amber-500';
      case 'error':
        return 'text-rose-500';
      default:
        return 'text-slate-400';
    }
  };

  const getBgColor = () => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'error':
        return 'bg-rose-500';
      default:
        return 'bg-[#E95420]';
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 transition-all hover:border-slate-200 dark:hover:border-slate-700 group">
      <div className="flex justify-between items-start mb-1">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
          {label}
        </span>
        <div
          className={`w-1.5 h-1.5 rounded-full ${getStatusColor().replace('text', 'bg')} group-hover:scale-125 transition-transform`}
        ></div>
      </div>
      <div className="text-lg font-black text-slate-800 dark:text-slate-100 tabular-nums">
        {value}
      </div>
      {progress !== undefined && (
        <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={`h-full ${getBgColor()}`}
          />
        </div>
      )}
    </div>
  );
};

export default AiOperationalReview;
