import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'operation' | 'inspection' | 'project' | 'user' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  language: 'en' | 'id';
  maxItems?: number;
}

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'operation':
      return (
        <svg
          className="w-5 h-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      );
    case 'inspection':
      return (
        <svg
          className="w-5 h-5 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'project':
      return (
        <svg
          className="w-5 h-5 text-purple-600"
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
      );
    case 'user':
      return (
        <svg
          className="w-5 h-5 text-orange-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      );
    case 'system':
      return (
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      );
    default:
      return null;
  }
};

const getStatusColor = (status?: ActivityItem['status']) => {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'error':
      return 'bg-orange-100 text-orange-800 border-red-200';
    case 'info':
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  language,
  maxItems = 8,
}) => {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <section
      className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-lg p-6 overflow-hidden"
      aria-labelledby="activity-feed-heading"
      role="region"
    >
      {/* Decorative background elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-400/10 to-purple-500/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-purple-400/10 to-indigo-500/5 rounded-full blur-3xl" />

      <header className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h2
            id="activity-feed-heading"
            className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
          >
            {language === 'id' ? 'Aktivitas Terbaru' : 'Recent Activity'}
          </h2>
        </div>
        <div
          className="flex items-center gap-2 text-sm bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-200/50 dark:border-emerald-500/20"
          aria-live="polite"
        >
          <div
            className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-pulse shadow-sm shadow-emerald-500/50"
            aria-hidden="true"
          />
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
            {language === 'id' ? 'Live' : 'Live'}
          </span>
        </div>
      </header>

      <div
        className="relative space-y-3 max-h-96 overflow-y-auto pr-1"
        role="log"
        aria-live="polite"
        aria-label={language === 'id' ? 'Daftar aktivitas terbaru' : 'List of recent activities'}
      >
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-slate-400 dark:text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {language === 'id' ? 'Belum ada aktivitas' : 'No activity yet'}
            </p>
          </div>
        ) : (
          displayedActivities.map((activity, index) => (
            <article
              key={activity.id}
              className="group flex items-start space-x-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-gradient-to-r hover:from-indigo-50/70 hover:to-purple-50/50 dark:hover:from-indigo-500/10 dark:hover:to-purple-500/10 transition-all duration-300 border border-transparent hover:border-indigo-200/50 dark:hover:border-indigo-500/20 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:ring-offset-2"
              style={{ animationDelay: `${index * 50}ms` }}
              aria-labelledby={`activity-${activity.id}-title`}
              aria-describedby={`activity-${activity.id}-description`}
            >
              <div className="flex-shrink-0">
                <div className="w-11 h-11 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 border border-slate-200/50 dark:border-slate-600/50">
                  {getActivityIcon(activity.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4
                      id={`activity-${activity.id}-title`}
                      className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors duration-300"
                    >
                      {activity.title}
                    </h4>
                    <p
                      id={`activity-${activity.id}-description`}
                      className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors duration-300 mt-0.5 line-clamp-2"
                    >
                      {activity.description}
                    </p>
                    {activity.user && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {language === 'id' ? 'Oleh' : 'By'}{' '}
                        <span className="font-medium">{activity.user}</span>
                      </p>
                    )}
                  </div>

                  {activity.status && (
                    <div
                      className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusColor(activity.status)}`}
                    >
                      {activity.status === 'success' &&
                        (language === 'id' ? 'Berhasil' : 'Success')}
                      {activity.status === 'warning' &&
                        (language === 'id' ? 'Peringatan' : 'Warning')}
                      {activity.status === 'error' && (language === 'id' ? 'Error' : 'Error')}
                      {activity.status === 'info' && (language === 'id' ? 'Info' : 'Info')}
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  {formatDistanceToNow(activity.timestamp, {
                    addSuffix: true,
                    locale: language === 'id' ? id : undefined,
                  })}
                </p>
              </div>
            </article>
          ))
        )}
      </div>

      {activities.length > maxItems && (
        <div className="relative mt-5 text-center">
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label={language === 'id' ? 'Lihat semua aktivitas' : 'View all activities'}
          >
            <span>{language === 'id' ? 'Lihat Semua' : 'View All'}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
};
