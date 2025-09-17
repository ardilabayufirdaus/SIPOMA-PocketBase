import React from 'react';

interface UserActivityPageProps {
  users: any[];
  t: any;
}

const UserActivityPage: React.FC<UserActivityPageProps> = ({ users, t }) => {
  return (
    <div className="p-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            User Activity Monitoring
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            This feature is under development. User activity monitoring will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserActivityPage;
