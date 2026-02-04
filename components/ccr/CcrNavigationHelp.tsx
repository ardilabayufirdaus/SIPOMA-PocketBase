import React from 'react';

interface CcrNavigationHelpProps {
  isVisible: boolean;
  onClose: () => void;
  t: Record<string, string>;
}

const CcrNavigationHelp: React.FC<CcrNavigationHelpProps> = ({ isVisible, onClose, t }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">
            {t.ccr_nav_guide_title || '🎯 CCR Table Navigation Guide'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label={t.close || 'Close help'}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-600">
          <div>
            <strong className="text-slate-800">{t.kb_navigation || 'Keyboard Navigation:'}</strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>
                • <kbd className="bg-slate-100 px-2 py-1 rounded">Tab</kbd> -{' '}
                {t.tab_next_cell || 'Move to next cell'}
              </li>
              <li>
                • <kbd className="bg-slate-100 px-2 py-1 rounded">Shift + Tab</kbd> -{' '}
                {t.shift_tab_prev_cell || 'Move to previous cell'}
              </li>
              <li>
                • <kbd className="bg-slate-100 px-2 py-1 rounded">↑↓←→</kbd> -{' '}
                {t.arrows_navigate || 'Navigate in all directions'}
              </li>
              <li>
                • <kbd className="bg-slate-100 px-2 py-1 rounded">Esc</kbd> -{' '}
                {t.esc_exit_nav || 'Exit navigation mode'}
              </li>
              <li>
                • <kbd className="bg-slate-100 px-2 py-1 rounded">Enter</kbd> -{' '}
                {t.enter_edit_cell || 'Edit current cell'}
              </li>
            </ul>
          </div>

          <div>
            <strong className="text-slate-800">
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
            <strong className="text-slate-800">{t.data_entry_tips || 'Data Entry Tips:'}</strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• {t.decimal_format_tip || 'Use decimal format (e.g., 12.50)'}</li>
              <li>• {t.auto_save_tip || 'Values are auto-saved on change'}</li>
              <li>• {t.invalid_values_tip || 'Invalid values are highlighted in red'}</li>
              <li>• {t.footer_calc_tip || 'Footer shows real-time calculations'}</li>
              <li>• {t.enter_confirm_tip || 'Press Enter to confirm entry'}</li>
            </ul>
          </div>

          <div>
            <strong className="text-slate-800">
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
            <strong className="text-slate-800">
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
            <strong className="text-slate-800">{t.accessibility_title || 'Accessibility:'}</strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• {t.screen_reader_tip || 'Screen reader compatible'}</li>
              <li>• {t.contrast_mode_tip || 'High contrast mode support'}</li>
              <li>• {t.kb_only_tip || 'Keyboard-only navigation'}</li>
              <li>• {t.aria_labels_tip || 'ARIA labels for all interactive elements'}</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {t.got_it || 'Got it!'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CcrNavigationHelp;
