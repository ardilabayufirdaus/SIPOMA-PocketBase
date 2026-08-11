import React, { memo, useCallback, useRef, useEffect } from 'react';

interface InformationSectionProps {
  t: Record<string, string>;
  informationText: string;
  setInformationText: (text: string) => void;
  onSave: (text: string) => Promise<void>;
  isSaving: boolean;
  disabled?: boolean;
}

const InformationSection: React.FC<InformationSectionProps> = memo(
  ({ t, informationText, setInformationText, onSave, isSaving, disabled = false }) => {
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedText = useRef(informationText);

    // Auto-save with debounce
    useEffect(() => {
      if (informationText === lastSavedText.current) {
        return;
      }

      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save (3 seconds debounce)
      saveTimeoutRef.current = setTimeout(() => {
        onSave(informationText);
        lastSavedText.current = informationText;
      }, 3000);

      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }, [informationText, onSave]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInformationText(e.target.value);
      },
      [setInformationText]
    );

    return (
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center shadow-md">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
                {t.operational_notes || 'Catatan Operasional'}
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t.important_shift_info || 'Informasi penting terkait shift'}
              </p>
            </div>
          </div>

          {isSaving && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-full border border-blue-100 dark:border-blue-800 shadow-sm">
              <div className="w-3.5 h-3.5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-black uppercase tracking-widest">
                {t.saving || 'Menyimpan...'}
              </span>
            </div>
          )}
        </div>

        <div className="relative">
          <textarea
            value={informationText}
            onChange={handleChange}
            disabled={disabled || isSaving}
            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-500/40 focus:border-slate-500 text-slate-800 dark:text-slate-100 font-bold text-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed leading-relaxed"
            rows={6}
            placeholder={t.placeholder_information || 'Ketik informasi penting di sini...'}
            aria-label={t.operational_notes || t.information}
          />
          {!isSaving && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              {t.saved || 'Tersimpan'}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/50 w-fit px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {t.auto_save_3s || 'Disimpan otomatis meupun 3 detik'}
        </div>
      </div>
    );
  }
);

InformationSection.displayName = 'InformationSection';

export default InformationSection;
