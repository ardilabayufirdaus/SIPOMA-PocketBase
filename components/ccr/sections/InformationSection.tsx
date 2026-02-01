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
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              {t.information || 'Information'}
            </h3>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="font-medium">Saving...</span>
            </div>
          )}
        </div>

        <textarea
          value={informationText}
          onChange={handleChange}
          disabled={disabled || isSaving}
          className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-medium resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          rows={4}
          placeholder={t.information_placeholder || 'Masukkan informasi shift...'}
          aria-label={t.information}
        />

        <p className="mt-2 text-xs text-slate-500">
          {t.auto_save_info || 'Auto-save setelah 3 detik mengetik'}
        </p>
      </div>
    );
  }
);

InformationSection.displayName = 'InformationSection';

export default InformationSection;
