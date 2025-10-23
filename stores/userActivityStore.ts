import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { pb } from '../utils/pocketbase-simple';
import { sanitizeForJSON } from '../utils/sanitizeJSON';

// Types
export interface UserSession {
  id: string;
  user_id: string;
  username?: string;
  full_name?: string;
  role?: string;
  session_start: string;
  session_end: string | null;
  ip_address: string;
  user_agent: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location: string;
  is_active: boolean;
  last_activity: string;
  duration_minutes: number;
}

export interface UserAction {
  id: string;
  user_id: string;
  action_type: 'login' | 'logout' | 'view' | 'create' | 'update' | 'delete' | 'export' | 'import';
  module: string;
  description: string;
  ip_address: string;
  created: string;
  metadata: Record<string, any>;
  success: boolean;
  error_message?: string;
  // Joined fields from users table
  username?: string;
  full_name?: string;
}

export interface ActivityStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  topUsers: Array<{
    user_id: string;
    username: string;
    full_name: string;
    action_count: number;
    last_active: string;
  }>;
  topModules: Array<{
    module: string;
    action_count: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    activity_count: number;
  }>;
  dailyActivity: Array<{
    date: string;
    login_count: number;
    action_count: number;
    unique_users: number;
  }>;
}

export interface ActivityFilter {
  dateRange: {
    start: string;
    end: string;
  };
  users: string[];
  actionTypes: string[];
  modules: string[];
  success?: boolean;
}

interface UserActivityState {
  // Data
  sessions: UserSession[];
  actions: UserAction[];
  stats: ActivityStats | null;

  // UI State
  loading: boolean;
  error: string | null;
  filter: ActivityFilter;
  sessionsPage: number;
  sessionsLimit: number;
  totalSessions: number;

  // Actions
  fetchSessions: (page?: number) => Promise<void>;
  fetchActions: () => Promise<void>;
  fetchStats: () => Promise<void>;
  logUserAction: (action: Omit<UserAction, 'id' | 'created'>) => Promise<void>;
  sanitizeForJSON: (obj: any) => any;
  startUserSession: (
    userId: string,
    sessionData: Partial<UserSession>
  ) => Promise<UserSession | undefined>;
  endUserSession: (sessionId: string) => Promise<void>;
  updateLastActivity: (sessionId: string) => Promise<void>;
  deleteAllSessions: () => Promise<void>;
  deleteAllActions: () => Promise<void>;
  setFilter: (filter: Partial<ActivityFilter>) => void;
  clearError: () => void;
}

const defaultFilter: ActivityFilter = {
  dateRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },
  users: [],
  actionTypes: [],
  modules: [],
};

export const useUserActivityStore = create<UserActivityState>()(
  devtools(
    (set, get) => ({
      // Initial state
      sessions: [],
      actions: [],
      stats: null,
      loading: false,
      error: null,
      filter: defaultFilter,
      sessionsPage: 1,
      sessionsLimit: 100,
      totalSessions: 0,

      // Fetch user sessions
      fetchSessions: async (page: number = 1) => {
        set({ loading: true, error: null });
        try {
          const { filter, sessionsLimit } = get();
          const from = (page - 1) * sessionsLimit;
          const to = from + sessionsLimit - 1;

          const filterParts = [`session_start >= "${filter.dateRange.start}"`];

          if (filter.users.length > 0) {
            filterParts.push(`user ~ "${filter.users.join(',')}"`);
          }

          const filterStr = filterParts.join(' && ');

          const result = await pb.collection('user_sessions').getList(page, sessionsLimit, {
            filter: filterStr,
            sort: '-session_start',
            expand: 'user',
          });

          const sessions: UserSession[] =
            result.items?.map((session) => ({
              id: session.id,
              user_id: session.user,
              username: (session.expand as any)?.user?.username || '',
              full_name: (session.expand as any)?.user?.full_name || '',
              role: (session.expand as any)?.user?.role || '',
              session_start: session.session_start,
              session_end: session.session_end,
              ip_address: session.ip_address,
              user_agent: session.user_agent,
              device_type: session.device_type,
              browser: session.browser,
              location: session.location,
              is_active: session.is_active,
              last_activity: session.last_activity,
              duration_minutes: session.duration_minutes || 0,
            })) || [];

          set({ sessions, sessionsPage: page, totalSessions: result.totalItems, loading: false });
        } catch (error) {
          // If collection doesn't exist, set empty data
          if ((error as any)?.response?.status === 404) {
            set({
              sessions: [],
              sessionsPage: page,
              totalSessions: 0,
              loading: false,
              error: 'User activity tracking not available - collections not created yet',
            });
          } else {
            set({ error: (error as Error).message, loading: false });
          }
        }
      },

      // Fetch user actions
      fetchActions: async () => {
        set({ loading: true, error: null });
        try {
          const { filter } = get();
          const filterParts = [
            `created >= "${filter.dateRange.start}"`,
            `created <= "${filter.dateRange.end}T23:59:59"`,
          ];

          if (filter.users.length > 0) {
            filterParts.push(`user ~ "${filter.users.join(',')}"`);
          }

          if (filter.actionTypes.length > 0) {
            filterParts.push(`action_type ~ "${filter.actionTypes.join(',')}"`);
          }

          if (filter.modules.length > 0) {
            filterParts.push(`module ~ "${filter.modules.join(',')}"`);
          }

          if (filter.success !== undefined) {
            filterParts.push(`success = ${filter.success}`);
          }

          const filterStr = filterParts.join(' && ');

          const result = await pb.collection('user_actions').getList(1, 1000, {
            filter: filterStr,
            sort: '-created',
            expand: 'user',
          });

          const actions: UserAction[] =
            result.items?.map((action) => ({
              id: action.id,
              user_id: action.user,
              username: (action.expand as any)?.user?.username || '',
              full_name: (action.expand as any)?.user?.full_name || '',
              action_type: action.action_type,
              module: action.module,
              description: action.description,
              ip_address: action.ip_address,
              created: action.created,
              metadata: action.metadata || {},
              success: action.success,
              error_message: action.error_message,
            })) || [];

          set({ actions, loading: false });
        } catch (error) {
          // If collection doesn't exist, set empty data
          if ((error as any)?.response?.status === 404) {
            set({
              actions: [],
              loading: false,
              error: 'User activity tracking not available - collections not created yet',
            });
          } else {
            set({ error: (error as Error).message, loading: false });
          }
        }
      },

      // Fetch activity statistics
      fetchStats: async () => {
        set({ loading: true, error: null });
        try {
          const { filter } = get();

          // Get counts using separate queries to minimize data transfer
          const [
            totalSessionsResult,
            totalActionsResult,
            successfulActionsResult,
            failedActionsResult,
            totalUsersResult,
            activeUsersResult,
          ] = await Promise.all([
            // Total sessions
            pb.collection('user_sessions').getList(1, 1, {
              filter: `session_start >= "${filter.dateRange.start}" && session_start <= "${filter.dateRange.end}T23:59:59"`,
              fields: 'id',
            }),
            // Total actions
            pb.collection('user_actions').getList(1, 1, {
              filter: `created >= "${filter.dateRange.start}" && created <= "${filter.dateRange.end}T23:59:59"`,
              fields: 'id',
            }),
            // Successful actions
            pb.collection('user_actions').getList(1, 1, {
              filter: `created >= "${filter.dateRange.start}" && created <= "${filter.dateRange.end}T23:59:59" && success = true`,
              fields: 'id',
            }),
            // Failed actions
            pb.collection('user_actions').getList(1, 1, {
              filter: `created >= "${filter.dateRange.start}" && created <= "${filter.dateRange.end}T23:59:59" && success = false`,
              fields: 'id',
            }),
            // Total users
            pb.collection('users').getList(1, 1, { fields: 'id' }),
            // Active users
            pb.collection('users').getList(1, 1, {
              filter: 'is_active = true',
              fields: 'id',
            }),
          ]);

          const totalSessions = totalSessionsResult.totalItems;
          const totalActions = totalActionsResult.totalItems;
          const successfulActions = successfulActionsResult.totalItems;
          const failedActions = failedActionsResult.totalItems;
          const totalUsers = totalUsersResult.totalItems;
          const activeUsers = activeUsersResult.totalItems;

          // Get average session duration (fetch only duration_minutes)
          const sessionDurationsResult = await pb.collection('user_sessions').getFullList({
            filter: `session_start >= "${filter.dateRange.start}" && session_start <= "${filter.dateRange.end}T23:59:59"`,
            fields: 'duration_minutes',
          });

          const averageSessionDuration =
            sessionDurationsResult.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) /
            Math.max(totalSessions || 1, 1);

          // Get top users (limit to 10 with minimal data)
          const topUsersData = await pb.collection('user_actions').getList(1, 1000, {
            filter: `created >= "${filter.dateRange.start}" && created <= "${filter.dateRange.end}T23:59:59"`,
            sort: '-created',
            expand: 'user',
            fields: 'user,created',
          });

          // Get top modules (limit to 10)
          const topModulesData = await pb.collection('user_actions').getList(1, 1000, {
            filter: `created >= "${filter.dateRange.start}" && created <= "${filter.dateRange.end}T23:59:59"`,
            fields: 'module',
          });

          // Calculate top users
          const userActivityMap = new Map();
          topUsersData.items?.forEach((action) => {
            const key = action.user;
            const user = (action.expand as any)?.user;
            if (!userActivityMap.has(key)) {
              userActivityMap.set(key, {
                user_id: action.user,
                username: user?.username || '',
                full_name: user?.full_name || '',
                action_count: 0,
                last_active: action.created,
              });
            }
            const userData = userActivityMap.get(key);
            userData.action_count++;
            if (action.created > userData.last_active) {
              userData.last_active = action.created;
            }
          });

          const topUsers = Array.from(userActivityMap.values())
            .sort((a, b) => b.action_count - a.action_count)
            .slice(0, 10);

          // Calculate top modules
          const moduleActivityMap = new Map();
          topModulesData.items?.forEach((action) => {
            const module = action.module;
            moduleActivityMap.set(module, (moduleActivityMap.get(module) || 0) + 1);
          });

          const topModules = Array.from(moduleActivityMap.entries())
            .map(([module, count]) => ({ module, action_count: count }))
            .sort((a, b) => b.action_count - a.action_count)
            .slice(0, 10);

          // Mock hourly and daily activity (can be optimized later with proper aggregation)
          const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            activity_count: Math.floor(Math.random() * 50),
          }));

          const dailyActivity = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            return {
              date: date.toISOString().split('T')[0],
              login_count: Math.floor(Math.random() * 20),
              action_count: Math.floor(Math.random() * 100),
              unique_users: Math.floor(Math.random() * 15),
            };
          }).reverse();

          const stats: ActivityStats = {
            totalUsers: totalUsers || 0,
            activeUsers: activeUsers || 0,
            totalSessions: totalSessions || 0,
            averageSessionDuration,
            totalActions: totalActions || 0,
            successfulActions: successfulActions || 0,
            failedActions: failedActions || 0,
            topUsers,
            topModules,
            hourlyActivity,
            dailyActivity,
          };

          set({ stats, loading: false });
        } catch (error) {
          // If collection doesn't exist, set empty stats
          if ((error as any)?.response?.status === 404) {
            set({
              stats: {
                totalUsers: 0,
                activeUsers: 0,
                totalSessions: 0,
                averageSessionDuration: 0,
                totalActions: 0,
                successfulActions: 0,
                failedActions: 0,
                topUsers: [],
                topModules: [],
                hourlyActivity: [],
                dailyActivity: [],
              },
              loading: false,
              error: 'User activity tracking not available - collections not created yet',
            });
          } else {
            set({ error: (error as Error).message, loading: false });
          }
        }
      },

      // Log user action
      logUserAction: async (actionData) => {
        const logWithRetry = async (data: typeof actionData, retryCount = 0) => {
          const maxRetries = 2;
          const retryDelay = 1000 * Math.pow(2, retryCount); // Exponential backoff

          try {
            const { user_id, ...rest } = data;
            const insertData = {
              ...rest,
              user: user_id,
              ip_address: data.ip_address === '' ? null : data.ip_address,
            };

            // Sanitize metadata to prevent circular references
            const sanitizedData = {
              ...insertData,
              metadata: sanitizeForJSON(insertData.metadata),
            };

            await pb.collection('user_actions').create(sanitizedData);

            // Refresh actions if needed
            // get().fetchActions();
          } catch (error: unknown) {
            const err = error as Error;
            const isNetworkError =
              err?.message?.includes('ERR_NETWORK_CHANGED') ||
              err?.message?.includes('Failed to fetch') ||
              err?.message?.includes('NetworkError') ||
              err?.message?.includes('autocancelled');

            // For network errors, retry a few times but don't block the UI
            if (isNetworkError && retryCount < maxRetries) {
              console.warn(
                `Network error logging user action, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`
              );
              setTimeout(() => logWithRetry(data, retryCount + 1), retryDelay);
              return;
            }

            // For network errors after retries, or other errors, log but don't throw
            if (isNetworkError) {
              console.warn(
                'Network error while logging user action (giving up after retries):',
                err?.message
              );
              return; // Silently fail for network issues
            }

            console.error('Failed to log user action:', err?.message || 'Unknown error');
            // Handle case where user_actions collection doesn't exist
            if (
              err &&
              (err.message.includes('404') ||
                err.message.includes('autocancelled') ||
                err.message.includes('circular'))
            ) {
              // Collection doesn't exist, silently ignore
              return;
            }

            // For other errors, also silently fail to not block user experience
            return;
          }
        };

        // Start the logging process (fire and forget)
        logWithRetry(actionData);
      },

      // Start user session
      startUserSession: async (userId, sessionData) => {
        try {
          const processedSessionData = {
            ...sessionData,
            ip_address: sessionData.ip_address === '' ? null : sessionData.ip_address,
            location: sessionData.location === '' ? null : sessionData.location,
          };

          const sessionDataToInsert = {
            user: userId,
            session_start: new Date().toISOString(),
            is_active: true,
            last_activity: new Date().toISOString(),
            duration_minutes: 0,
            ...processedSessionData,
          };

          const result = await pb.collection('user_sessions').create(sessionDataToInsert);

          // Return the created session data
          return result as unknown as UserSession;
        } catch (error) {
          // Silently fail if collection doesn't exist
          if ((error as any)?.response?.status !== 404) {
            throw error;
          }
        }
      },

      // End user session
      endUserSession: async (sessionId) => {
        try {
          await pb.collection('user_sessions').update(sessionId, {
            session_end: new Date().toISOString(),
            is_active: false,
          });
        } catch (error) {
          // Silently fail if collection doesn't exist
          if ((error as any)?.response?.status !== 404) {
            throw error;
          }
        }
      },

      // Update last activity
      updateLastActivity: async (sessionId) => {
        try {
          await pb.collection('user_sessions').update(sessionId, {
            last_activity: new Date().toISOString(),
          });
        } catch (error) {
          // Silently fail if collection doesn't exist
          if ((error as any)?.response?.status !== 404) {
            throw error;
          }
        }
      },

      // Delete all sessions
      deleteAllSessions: async () => {
        set({ loading: true, error: null });
        try {
          // Get all session IDs first
          const result = await pb.collection('user_sessions').getList(1, 1000, {
            fields: 'id',
          });

          if (result.items && result.items.length > 0) {
            // Delete all sessions in batches to avoid overwhelming the server
            const batchSize = 50;
            for (let i = 0; i < result.items.length; i += batchSize) {
              const batch = result.items.slice(i, i + batchSize);
              await Promise.all(
                batch.map((session) => pb.collection('user_sessions').delete(session.id))
              );
            }
          }

          // Refresh data
          await get().fetchSessions();
          await get().fetchStats();
        } catch (error) {
          if ((error as any)?.response?.status !== 404) {
            set({ error: (error as Error).message, loading: false });
          } else {
            // Collection doesn't exist, just clear local data
            set({ sessions: [], loading: false });
          }
        }
      },

      // Delete all actions
      deleteAllActions: async () => {
        set({ loading: true, error: null });
        try {
          // Get all action IDs first
          const result = await pb.collection('user_actions').getList(1, 1000, {
            fields: 'id',
          });

          if (result.items && result.items.length > 0) {
            // Delete all actions in batches to avoid overwhelming the server
            const batchSize = 50;
            for (let i = 0; i < result.items.length; i += batchSize) {
              const batch = result.items.slice(i, i + batchSize);
              await Promise.all(
                batch.map((action) => pb.collection('user_actions').delete(action.id))
              );
            }
          }

          // Refresh data
          await get().fetchActions();
          await get().fetchStats();
        } catch (error) {
          if ((error as any)?.response?.status !== 404) {
            set({ error: (error as Error).message, loading: false });
          } else {
            // Collection doesn't exist, just clear local data
            set({ actions: [], loading: false });
          }
        }
      },

      // Set filter
      setFilter: (newFilter) => {
        set({ filter: { ...get().filter, ...newFilter } });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'user-activity-store',
    }
  )
);
