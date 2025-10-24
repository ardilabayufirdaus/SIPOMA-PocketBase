import React from 'react';
import { Page } from '../App';
import ClipboardCheckIcon from '../components/icons/ClipboardCheckIcon';
import { EnhancedCard } from '../components/ui/EnhancedComponents';

/**
 * Inspection Dashboard Page
 *
 * Halaman utama untuk modul Inspection (Placeholder)
 */
const InspectionDashboardPage: React.FC<{
  language: 'en' | 'id';
  onNavigate: (page: Page, subPage?: string) => void;
}> = ({ language }) => {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center">
        <ClipboardCheckIcon className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === 'en' ? 'Inspection Dashboard' : 'Dashboard Inspeksi'}
        </h1>
      </div>

      <EnhancedCard className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center py-8">
          <ClipboardCheckIcon className="w-16 h-16 mx-auto text-gray-400" />
          <h2 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">
            {language === 'en' ? 'Inspection Module Placeholder' : 'Placeholder Modul Inspeksi'}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {language === 'en'
              ? 'This is a placeholder for the inspection module. Content will be implemented later.'
              : 'Ini adalah placeholder untuk modul inspeksi. Konten akan diimplementasikan nanti.'}
          </p>
        </div>
      </EnhancedCard>
    </div>
  );
};

export default InspectionDashboardPage;
