import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InspectionFormPageProps {
  t: Record<string, string>;
}

type TabType = 'derivative' | 'clinker' | 'cement';

const InspectionFormPage: React.FC<InspectionFormPageProps> = ({ t }) => {
  const [activeTab, setActiveTab] = useState<TabType>('derivative');
  const [activeSection, setActiveSection] = useState<string>('');

  const tabs: { id: TabType; labelKey: string }[] = [
    { id: 'derivative', labelKey: 'insp_unit_derivative' },
    { id: 'clinker', labelKey: 'insp_unit_clinker' },
    { id: 'cement', labelKey: 'insp_unit_cement' },
  ];

  const getSectionsForTab = (tab: TabType) => {
    switch (tab) {
      case 'derivative':
        return [{ id: 'derivative_2_3', labelKey: 'insp_sec_derivative_2_3' }];
      case 'clinker':
        return [
          { id: 'rkc_4', labelKey: 'insp_sec_rkc_4' },
          { id: 'rkc_5', labelKey: 'insp_sec_rkc_5' },
        ];
      case 'cement':
        return [
          { id: 'fm_2_3', labelKey: 'insp_sec_fm_2_3' },
          { id: 'fm_4', labelKey: 'insp_sec_fm_4' },
          { id: 'fm_5', labelKey: 'insp_sec_fm_5' },
        ];
      default:
        return [];
    }
  };

  // Reset section when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setActiveSection('');
  };

  const sections = getSectionsForTab(activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {t.insp_form || 'New Inspection'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Select a production unit and operational section to start an inspection
        </p>
      </div>

      {/* Main Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              {t[tab.labelKey] || tab.labelKey}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                />
              )}
            </button>
          ))}
        </div>

        {/* Section Dropdown/Selection Area */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Select Section
          </label>
          <div className="relative max-w-md">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3"
            >
              <option value="" disabled>
                -- Select Operation Section --
              </option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {t[section.labelKey] || section.labelKey}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Form Content Placeholder */}
      <AnimatePresence mode="wait">
        {activeSection ? (
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 min-h-[400px] flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Form for{' '}
                {sections.find((s) => s.id === activeSection)?.labelKey
                  ? t[sections.find((s) => s.id === activeSection)!.labelKey]
                  : activeSection}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
                This is a placeholder for the inspection form. Select specific parameters and input
                data here.
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
              Start Inspection
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-12 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
              />
            </svg>
            <p className="text-center font-medium">
              Select a section above to load the inspection form
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InspectionFormPage;
