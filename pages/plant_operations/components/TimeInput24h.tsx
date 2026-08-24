import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimeInput24hProps {
  label?: string;
  value: string; // "00:00" to "23:59"
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
}

export const TimeInput24h: React.FC<TimeInput24hProps> = ({
  label,
  value,
  onChange,
  required = false,
  error,
  readOnly = false,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '00:00');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync prop value when not focused
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value || '00:00');
    }
  }, [value, isFocused]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to normalize input string into valid 24h HH:MM format
  const normalizeTime = (inputStr: string): string => {
    if (!inputStr || !inputStr.trim()) return '00:00';

    // Standardize delimiters (. or , to :)
    const clean = inputStr.trim().replace(/[.,]/g, ':');

    // Case 1: HH:MM already formatted
    if (/^([0-1]?[0-9]|2[0-3]):[0-5]?[0-9]?$/.test(clean)) {
      const parts = clean.split(':');
      const h = String(Math.min(23, parseInt(parts[0] || '0', 10))).padStart(2, '0');
      const m = String(Math.min(59, parseInt(parts[1] || '0', 10))).padStart(2, '0');
      return `${h}:${m}`;
    }

    // Case 2: Only digits (e.g. 1830 -> 18:30, 6 -> 06:00, 18 -> 18:00)
    const digits = clean.replace(/[^0-9]/g, '').slice(0, 4);
    if (!digits) return '00:00';

    if (digits.length <= 2) {
      const h = String(Math.min(23, parseInt(digits, 10))).padStart(2, '0');
      return `${h}:00`;
    } else {
      const hStr = digits.slice(0, 2);
      const mStr = digits.slice(2, 4);
      const h = String(Math.min(23, parseInt(hStr, 10))).padStart(2, '0');
      const m = String(Math.min(59, parseInt(mStr, 10))).padStart(2, '0');
      return `${h}:${m}`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[.,]/g, ':');

    // Auto-insert colon if 4 raw digits typed without colon
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    if (!raw.includes(':') && digitsOnly.length === 4) {
      raw = `${digitsOnly.slice(0, 2)}:${digitsOnly.slice(2, 4)}`;
    }

    setInputValue(raw);

    // If a full valid HH:MM pattern matches while typing, notify parent immediately
    if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(raw)) {
      onChange(raw);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const normalized = normalizeTime(inputValue);
    setInputValue(normalized);
    onChange(normalized);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleHourSelect = (h: number) => {
    const parts = (inputValue || '00:00').split(':');
    const mStr = parts[1] ? parts[1].padStart(2, '0') : '00';
    const hStr = String(h).padStart(2, '0');
    const newTime = `${hStr}:${mStr}`;
    setInputValue(newTime);
    onChange(newTime);
  };

  const handleMinuteSelect = (m: number) => {
    const parts = (inputValue || '00:00').split(':');
    const hStr = parts[0] ? parts[0].padStart(2, '0') : '00';
    const mStr = String(m).padStart(2, '0');
    const newTime = `${hStr}:${mStr}`;
    setInputValue(newTime);
    onChange(newTime);
    setIsOpen(false);
  };

  const parts = (inputValue || '00:00').split(':');
  const currentHour = parts[0] ? parts[0].padStart(2, '0') : '00';
  const currentMinute = parts[1] ? parts[1].padStart(2, '0') : '00';

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          readOnly={readOnly}
          disabled={disabled}
          placeholder="HH:MM"
          maxLength={5}
          className={`w-full px-3 py-2.5 bg-white border ${
            error ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 hover:border-slate-400'
          } rounded-xl text-slate-900 font-mono font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/40 focus:border-[#059669] transition-all duration-150 disabled:bg-slate-100 disabled:text-slate-400`}
        />

        {!readOnly && !disabled && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-[#059669] transition-colors rounded-lg focus:outline-none"
            title="Pilih Waktu 24 Jam"
          >
            <Clock className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}

      {/* 24h Time Picker Dropdown */}
      {isOpen && !readOnly && !disabled && (
        <div className="absolute top-full left-0 mt-1 z-50 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 grid grid-cols-2 gap-3 text-xs animate-in fade-in zoom-in-95 duration-150">
          {/* Hours (00 - 23) */}
          <div className="flex flex-col gap-1 border-r border-slate-100 pr-2">
            <div className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Jam (24H)</span>
              <span className="text-[#059669] font-mono">{currentHour}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              {hourOptions.map((h) => {
                const hStr = String(h).padStart(2, '0');
                const isSelected = hStr === currentHour;
                return (
                  <button
                    key={h}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleHourSelect(h)}
                    className={`py-1.5 rounded-lg font-mono text-center font-medium transition-all ${
                      isSelected
                        ? 'bg-[#059669] text-white font-bold shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {hStr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minutes (00 - 55) */}
          <div className="flex flex-col gap-1 pl-1">
            <div className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Menit</span>
              <span className="text-[#059669] font-mono">{currentMinute}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              {minuteOptions.map((m) => {
                const mStr = String(m).padStart(2, '0');
                const isSelected = mStr === currentMinute;
                return (
                  <button
                    key={m}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleMinuteSelect(m)}
                    className={`py-1.5 px-2 rounded-lg font-mono text-center font-medium transition-all ${
                      isSelected
                        ? 'bg-[#059669] text-white font-bold shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    :{mStr}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
