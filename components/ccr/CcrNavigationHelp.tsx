import React, { useEffect } from 'react';

interface CcrNavigationHelpProps {
  isVisible: boolean;
  onClose: () => void;
  t: Record<string, string>;
}

const CcrNavigationHelp: React.FC<CcrNavigationHelpProps> = ({ isVisible, onClose, t }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose();
      }
    };
    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ccr-nav-guide-title"
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 id="ccr-nav-guide-title" className="text-lg font-bold text-slate-900 dark:text-white">
            {t.ccr_nav_guide_title || '🎯 CCR Table Navigation Guide'}
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={t.close || 'Close help'}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <div>
            <strong className="text-slate-900 dark:text-white">
              {t.kb_navigation || 'Keyboard Navigation:'}
            </strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>
                •{' '}
                <kbd className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-xs">
                  Tab
                </kbd>{' '}
                - {t.tab_next_cell || 'Move to next cell'}
              </li>
              <li>
                •{' '}
                <kbd className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-xs">
                  Shift + Tab
                </kbd>{' '}
                - {t.shift_tab_prev_cell || 'Move to previous cell'}
              </li>
              <li>
                •{' '}
                <kbd className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-xs">
                  ↑↓←→
                </kbd>{' '}
                - {t.arrows_navigate || 'Navigate in all directions'}
              </li>
              <li>
                •{' '}
                <kbd className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-xs">
                  Esc
                </kbd>{' '}
                - {t.esc_exit_nav || 'Exit navigation mode'}
              </li>
              <li>
                •{' '}
                <kbd className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-xs">
                  Enter
                </kbd>{' '}
                - {t.enter_edit_cell || 'Edit current cell'}
              </li>
            </ul>
          </div>

          <div>
            <strong className="text-slate-900 dark:text-white">
              {t.search_filtering || 'Search & Filtering:'}
            </strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>
                • {t.search_filter_desc || 'Use search bar to filter parameters by name or unit'}
              </li>
              <li>• {t.real_time_update || 'Real-time results update as you type'}</li>
              <li>• {t.clear_search_reset || 'Clear search to reset filters'}</li>
              <li>• {t.partial_matches || 'Search supports partial matches'}</li>
            </ul>
          </div>

          <div>
            <strong className="text-slate-900 dark:text-white">
              {t.data_entry_tips || 'Data Entry Tips:'}
            </strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• {t.decimal_format_tip || 'Use decimal format (e.g., 12.50)'}</li>
              <li>• {t.auto_save_tip || 'Values are auto-saved on change'}</li>
              <li>• {t.invalid_values_tip || 'Invalid values are highlighted in red'}</li>
              <li>• {t.footer_calc_tip || 'Footer shows real-time calculations'}</li>
              <li>• {t.enter_confirm_tip || 'Press Enter to confirm entry'}</li>
            </ul>
          </div>

          <div>
            <strong className="text-slate-900 dark:text-white">
              {t.error_handling_title || 'Error Handling:'}
            </strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• {t.network_retry_tip || 'Network errors show retry options'}</li>
              <li>• {t.validation_msg_tip || 'Invalid data triggers validation messages'}</li>
              <li>• {t.auto_recovery_tip || 'Auto-recovery for temporary connection issues'}</li>
              <li>• {t.boundary_crash_tip || 'Error boundaries prevent app crashes'}</li>
            </ul>
          </div>

          <div>
            <strong className="text-slate-900 dark:text-white">
              {t.table_features_title || 'Table Features:'}
            </strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• {t.sticky_headers_tip || 'Sticky headers for easy reference'}</li>
              <li>• {t.fixed_footer_tip || 'Fixed footer always visible'}</li>
              <li>• {t.scroll_nav_tip || 'Horizontal & vertical scrolling'}</li>
              <li>• {t.auto_stat_tip || 'Auto-calculation of statistics'}</li>
              <li>• {t.responsive_tip || 'Responsive design for mobile devices'}</li>
            </ul>
          </div>

          <div>
            <strong className="text-slate-900 dark:text-white">
              {t.accessibility_title || 'Accessibility:'}
            </strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• {t.screen_reader_tip || 'Screen reader compatible'}</li>
              <li>• {t.contrast_mode_tip || 'High contrast mode support'}</li>
              <li>• {t.kb_only_tip || 'Keyboard-only navigation'}</li>
              <li>• {t.aria_labels_tip || 'ARIA labels for all interactive elements'}</li>
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            aria-label={t.got_it || 'Got it!'}
            className="min-h-[44px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {t.got_it || 'Got it!'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CcrNavigationHelp;
