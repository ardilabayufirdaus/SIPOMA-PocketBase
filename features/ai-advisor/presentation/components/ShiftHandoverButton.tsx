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
import { FileText, Sparkles } from 'lucide-react';

// Dependencies
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
        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all font-medium text-sm ${className}`}
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
