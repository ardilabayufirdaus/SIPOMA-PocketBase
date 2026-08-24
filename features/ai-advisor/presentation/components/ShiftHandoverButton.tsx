import React, { useState } from 'react';
import { GenerateShiftSummary } from '../../domain/usecases/GenerateShiftSummary';
import {
  PocketBaseParameterRepository,
  PocketBaseSiloRepository,
  PocketBaseInformationRepository,
} from '../../data/repositories/PocketBaseShiftRepositories';
import { PocketBaseDowntimeRepository } from '../../data/repositories/PocketBaseDowntimeRepository';
import { XAiAdvisorService } from '../../data/services/XAiAdvisorService';
import { ShiftReportModal } from './ShiftReportModal';
import { Sparkles } from 'lucide-react';

interface ShiftHandoverButtonProps {
  date: string;
  unit: string;
}

export const ShiftHandoverButton: React.FC<ShiftHandoverButtonProps & { className?: string }> = ({
  date,
  unit,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsOpen(true);
    if (report) return; // Don't regenerate if already exists in this session instance

    setLoading(true);
    setError(null);
    try {
      // Lazy instantiation to prevent module evaluation errors
      const paramRepo = new PocketBaseParameterRepository();
      const siloRepo = new PocketBaseSiloRepository();
      const downtimeRepo = new PocketBaseDowntimeRepository();
      const infoRepo = new PocketBaseInformationRepository();
      const aiService = new XAiAdvisorService();
      const generateUseCase = new GenerateShiftSummary(
        paramRepo,
        siloRepo,
        downtimeRepo,
        infoRepo,
        aiService
      );

      // Determine shift based on current time or hardcode
      // Currently hardcoded to 1 for MVP or could be prop
      const currentHour = new Date().getHours();
      let shift: 1 | 2 | 3 = 1;
      if (currentHour >= 7 && currentHour < 15) shift = 1;
      else if (currentHour >= 15 && currentHour < 23) shift = 2;
      else shift = 3;

      const result = await generateUseCase.execute(date, shift, unit);
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat laporan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        aria-label="Generate AI Shift Report"
        className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${className}`}
        title="Generate AI Shift Report"
      >
        <Sparkles className="w-4 h-4" />
        <span>Laporan Shift</span>
      </button>

      <ShiftReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        reportContent={report}
        isLoading={loading}
        error={error}
      />
    </>
  );
};
