import React from 'react';

// Interface untuk props
interface WhatsAppReportsProps {
  groupId?: string;
}

/**
 * Component untuk menampilkan laporan WhatsApp
 * Komponen ini adalah placeholder untuk implementasi asli
 */
const WhatsAppReports: React.FC<WhatsAppReportsProps> = ({ groupId = 'default' }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-slate-200">
        WhatsApp Group Reports
      </h2>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-medium text-slate-700 dark:text-slate-300">
            Group: {groupId}
          </h3>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-6">
        <p className="text-slate-600 dark:text-slate-300">
          This is a placeholder for the WhatsApp reporting feature. The actual implementation will
          connect to the WhatsApp API and display reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
          <h4 className="font-medium mb-2 text-slate-700 dark:text-slate-300">Messages Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Total Messages:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">247</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Active Users:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">18</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Media Shared:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">43</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
          <h4 className="font-medium mb-2 text-slate-700 dark:text-slate-300">Top Contributors</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">User A:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">76 messages</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">User B:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">54 messages</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">User C:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">31 messages</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          onClick={() => console.log('Generate report for', groupId)}
        >
          Generate Report
        </button>
      </div>
    </div>
  );
};

export default WhatsAppReports;

