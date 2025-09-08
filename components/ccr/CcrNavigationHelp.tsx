import React from "react";

interface CcrNavigationHelpProps {
  isVisible: boolean;
  onClose: () => void;
}

const CcrNavigationHelp: React.FC<CcrNavigationHelpProps> = ({
  isVisible,
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            🎯 CCR Table Navigation Guide
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Close help"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <div>
            <strong className="text-slate-800 dark:text-slate-200">
              Keyboard Navigation:
            </strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>
                •{" "}
                <kbd className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  Tab
                </kbd>{" "}
                - Move to next cell
              </li>
              <li>
                •{" "}
                <kbd className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  Shift + Tab
                </kbd>{" "}
                - Move to previous cell
              </li>
              <li>
                •{" "}
                <kbd className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  ↑↓←→
                </kbd>{" "}
                - Navigate in all directions
              </li>
              <li>
                •{" "}
                <kbd className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  Esc
                </kbd>{" "}
                - Exit navigation mode
              </li>
              <li>
                •{" "}
                <kbd className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  Enter
                </kbd>{" "}
                - Edit current cell
              </li>
            </ul>
          </div>

          <div>
            <strong className="text-slate-800 dark:text-slate-200">
              Data Entry Tips:
            </strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Use decimal format (e.g., 12.50)</li>
              <li>• Values are auto-saved on change</li>
              <li>• Invalid values are highlighted in red</li>
              <li>• Footer shows real-time calculations</li>
            </ul>
          </div>

          <div>
            <strong className="text-slate-800 dark:text-slate-200">
              Table Features:
            </strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Sticky headers for easy reference</li>
              <li>• Fixed footer always visible</li>
              <li>• Horizontal & vertical scrolling</li>
              <li>• Auto-calculation of statistics</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default CcrNavigationHelp;
