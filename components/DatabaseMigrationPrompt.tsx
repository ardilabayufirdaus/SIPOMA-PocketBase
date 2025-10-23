import React, { useState } from 'react';
import { EnhancedButton, EnhancedCard } from '../components/ui/EnhancedComponents';
import ExclamationTriangleIcon from '../components/icons/ExclamationTriangleIcon';

interface DatabaseMigrationPromptProps {
  error: string;
  onDismiss: () => void;
}

const DatabaseMigrationPrompt: React.FC<DatabaseMigrationPromptProps> = ({ error, onDismiss }) => {
  const [showSQL, setShowSQL] = useState(false);

  const migrationSQL = `-- Run this SQL in your Supabase SQL Editor
-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with all the roles including Tonasa roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN (
    'Super Admin',
    'Admin', 
    'Admin Tonasa 2/3',
    'Admin Tonasa 4',
    'Admin Tonasa 5',
    'Operator',
    'Operator Tonasa 2/3', 
    'Operator Tonasa 4',
    'Operator Tonasa 5',
    'Guest'
));`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(migrationSQL);
    alert('SQL copied to clipboard!');
  };

  if (!error.includes('users_role_check')) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[90%] max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <EnhancedCard className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Database Schema Update Required
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                The new Tonasa roles require a database schema update. Please run the following SQL
                in your Supabase SQL Editor:
              </p>

              <div className="mb-4">
                <EnhancedButton
                  variant="outline"
                  onClick={() => setShowSQL(!showSQL)}
                  className="mb-2"
                >
                  {showSQL ? 'Hide SQL' : 'Show SQL Migration Script'}
                </EnhancedButton>
              </div>

              {showSQL && (
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Migration SQL:
                    </span>
                    <EnhancedButton variant="outline" size="sm" onClick={copyToClipboard}>
                      Copy to Clipboard
                    </EnhancedButton>
                  </div>
                  <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">
                    {migrationSQL}
                  </pre>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  How to apply this migration:
                </h4>
                <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>Go to your Supabase Dashboard</li>
                  <li>Navigate to SQL Editor</li>
                  <li>Copy and paste the migration SQL above</li>
                  <li>Click &quot;Run&quot; to execute the migration</li>
                  <li>Refresh this page and try creating users again</li>
                </ol>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">Error details: {error}</div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <EnhancedButton variant="secondary" onClick={onDismiss}>
              I&apos;ll do this later
            </EnhancedButton>
            <EnhancedButton
              variant="primary"
              onClick={() => {
                window.open('https://supabase.com/dashboard/project/_/sql', '_blank');
              }}
            >
              Open Supabase SQL Editor
            </EnhancedButton>
          </div>
        </EnhancedCard>
      </div>
    </div>
  );
};

export default DatabaseMigrationPrompt;


