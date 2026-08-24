import React, { useState } from 'react';
import { EnhancedButton, EnhancedCard } from '../components/ui/EnhancedComponents';
import ExclamationTriangleIcon from '../components/icons/ExclamationTriangleIcon';

interface DatabaseMigrationPromptProps {
  error: string;
  onDismiss: () => void;
}

const DatabaseMigrationPrompt: React.FC<DatabaseMigrationPromptProps> = ({ error, onDismiss }) => {
  const [showSQL, setShowSQL] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && error.includes('users_role_check')) {
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [error, onDismiss]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/70 dark:bg-black/80 transition-opacity"
        onClick={onDismiss}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="migration-dialog-title"
        className="relative w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto z-10"
      >
        <EnhancedCard className="p-2 border-0 shadow-none bg-transparent">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3
                id="migration-dialog-title"
                className="text-lg font-semibold text-slate-900 dark:text-white mb-2"
              >
                Database Schema Update Required
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
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
                <div className="bg-slate-100 dark:bg-slate-900/80 rounded-xl p-4 mb-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Migration SQL:
                    </span>
                    <EnhancedButton variant="outline" size="sm" onClick={copyToClipboard}>
                      Copy to Clipboard
                    </EnhancedButton>
                  </div>
                  <pre className="text-sm text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap font-mono">
                    {migrationSQL}
                  </pre>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 mb-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                  How to apply this migration:
                </h4>
                <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-400 space-y-1">
                  <li>Go to your Supabase Dashboard</li>
                  <li>Navigate to SQL Editor</li>
                  <li>Copy and paste the migration SQL above</li>
                  <li>Click &quot;Run&quot; to execute the migration</li>
                  <li>Refresh this page and try creating users again</li>
                </ol>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                Error details: {error}
              </div>
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
