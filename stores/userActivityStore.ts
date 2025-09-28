import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '../utils/supabaseClient';

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
  timestamp: string;
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

  // Actions
  fetchSessions: () => Promise<void>;
  fetchActions: () => Promise<void>;
  fetchStats: () => Promise<void>;
  logUserAction: (action: Omit<UserAction, 'id' | 'timestamp'>) => Promise<void>;
  startUserSession: (
    userId: string,
    sessionData: Partial<UserSession>
  ) => Promise<UserSession | undefined>;
  endUserSession: (sessionId: string) => Promise<void>;
  updateLastActivity: (sessionId: string) => Promise<void>;
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

      // Fetch user sessions
      fetchSessions: async () => {
        set({ loading: true, error: null });
        try {
          const { filter } = get();
          let query = supabase
            .from('user_sessions')
            .select(
              `
              *,
              users!inner(username, full_name, role)
            `
            )
            .gte('session_start', filter.dateRange.start)
            .lte('session_start', filter.dateRange.end + 'T23:59:59')
            .order('session_start', { ascending: false });

          if (filter.users.length > 0) {
            query = query.in('user_id', filter.users);
          }

          const { data, error } = await query;

          if (error) throw error;

          const sessions: UserSession[] =
            data?.map((session) => ({
              id: session.id,
              user_id: session.user_id,
              username: session.users?.username || '',
              full_name: session.users?.full_name || '',
              role: session.users?.role || '',
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

          set({ sessions, loading: false });
        } catch (error) {
          console.error('Error fetching sessions:', error);
          set({ error: (error as Error).message, loading: false });
        }
      },

      // Fetch user actions
      fetchActions: async () => {
        set({ loading: true, error: null });
        try {
          const { filter } = get();
          let query = supabase
            .from('user_actions')
            .select(
              `
              *,
              users!inner(username, full_name)
            `
            )
            .gte('timestamp', filter.dateRange.start)
            .lte('timestamp', filter.dateRange.end + 'T23:59:59')
            .order('timestamp', { ascending: false })
            .limit(1000);

          if (filter.users.length > 0) {
            query = query.in('user_id', filter.users);
          }

          if (filter.actionTypes.length > 0) {
            query = query.in('action_type', filter.actionTypes);
          }

          if (filter.modules.length > 0) {
            query = query.in('module', filter.modules);
          }

          if (filter.success !== undefined) {
            query = query.eq('success', filter.success);
          }

          const { data, error } = await query;

          if (error) throw error;

          const actions: UserAction[] =
            data?.map((action) => ({
              id: action.id,
              user_id: action.user_id,
              username: action.users?.username || '',
              full_name: action.users?.full_name || '',
              action_type: action.action_type,
              module: action.module,
              description: action.description,
              ip_address: action.ip_address,
              timestamp: action.timestamp,
              metadata: action.metadata || {},
              success: action.success,
              error_message: action.error_message,
            })) || [];

          set({ actions, loading: false });
        } catch (error) {
          console.error('Error fetching actions:', error);
          set({ error: (error as Error).message, loading: false });
        }
      },

      // Fetch activity statistics
      fetchStats: async () => {
        set({ loading: true, error: null });
        try {
          const { filter } = get();

          // Get basic stats
          const [
            { data: sessionData },
            { data: actionData },
            { data: userData },
            { data: topUsersData },
            { data: topModulesData },
          ] = await Promise.all([
            supabase
              .from('user_sessions')
              .select('duration_minutes, is_active')
              .gte('session_start', filter.dateRange.start)
              .lte('session_start', filter.dateRange.end + 'T23:59:59'),

            supabase
              .from('user_actions')
              .select('success')
              .gte('timestamp', filter.dateRange.start)
              .lte('timestamp', filter.dateRange.end + 'T23:59:59'),

            supabase.from('users').select('id, is_active'),

            supabase
              .from('user_actions')
              .select(
                `
                user_id,
                users!inner(username, full_name),
                timestamp
              `
              )
              .gte('timestamp', filter.dateRange.start)
              .lte('timestamp', filter.dateRange.end + 'T23:59:59'),

            supabase
              .from('user_actions')
              .select('module')
              .gte('timestamp', filter.dateRange.start)
              .lte('timestamp', filter.dateRange.end + 'T23:59:59'),
          ]);

          // Calculate stats
          const totalUsers = userData?.length || 0;
          const activeUsers = userData?.filter((u) => u.is_active)?.length || 0;
          const totalSessions = sessionData?.length || 0;
          const averageSessionDuration =
            sessionData?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) /
            Math.max(totalSessions, 1);
          const totalActions = actionData?.length || 0;
          const successfulActions = actionData?.filter((a) => a.success)?.length || 0;
          const failedActions = totalActions - successfulActions;

          // Top users by activity
          const userActivityMap = new Map();
          topUsersData?.forEach((action) => {
            const key = action.user_id;
            if (!userActivityMap.has(key)) {
              userActivityMap.set(key, {
                user_id: action.user_id,
                username: (action as any).users?.username || '',
                full_name: (action as any).users?.full_name || '',
                action_count: 0,
                last_active: action.timestamp,
              });
            }
            const user = userActivityMap.get(key);
            user.action_count++;
            if (action.timestamp > user.last_active) {
              user.last_active = action.timestamp;
            }
          });

          const topUsers = Array.from(userActivityMap.values())
            .sort((a, b) => b.action_count - a.action_count)
            .slice(0, 10);

          // Top modules
          const moduleActivityMap = new Map();
          topModulesData?.forEach((action) => {
            const module = action.module;
            moduleActivityMap.set(module, (moduleActivityMap.get(module) || 0) + 1);
          });

          const topModules = Array.from(moduleActivityMap.entries())
            .map(([module, count]) => ({ module, action_count: count }))
            .sort((a, b) => b.action_count - a.action_count)
            .slice(0, 10);

          // Hourly activity (mock data for now)
          const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            activity_count: Math.floor(Math.random() * 50),
          }));

          // Daily activity (mock data for now)
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
            totalUsers,
            activeUsers,
            totalSessions,
            averageSessionDuration,
            totalActions,
            successfulActions,
            failedActions,
            topUsers,
            topModules,
            hourlyActivity,
            dailyActivity,
          };

          set({ stats, loading: false });
        } catch (error) {
          console.error('Error fetching stats:', error);
          set({ error: (error as Error).message, loading: false });
        }
      },

      // Log user action
      logUserAction: async (actionData) => {
        try {
          // Remove fields that don't exist in the user_actions table and handle ip_address
          const { username, full_name, ...rawData } = actionData;
          const insertData = {
            ...rawData,
            ip_address: rawData.ip_address === '' ? null : rawData.ip_address,
          };

          const { data, error } = await supabase.from('user_actions').insert({
            ...insertData,
            timestamp: new Date().toISOString(),
          });

          if (error) throw error;

          // Refresh actions if needed
          // get().fetchActions();
        } catch (error) {
          console.error('Error logging user action:', error);
        }
      },

      // Start user session
      startUserSession: async (userId, sessionData) => {
        try {
          // Handle ip_address for INET type - convert empty string to null
          const processedSessionData = {
            ...sessionData,
            ip_address: sessionData.ip_address === '' ? null : sessionData.ip_address,
          };

          const { data, error } = await supabase.from('user_sessions').insert({
            user_id: userId,
            session_start: new Date().toISOString(),
            is_active: true,
            last_activity: new Date().toISOString(),
            ...processedSessionData,
          });

          if (error) throw error;

          // Return the created session data
          return (data as UserSession[])?.[0];
        } catch (error) {
          console.error('Error starting user session:', error);
          throw error;
        }
      },

      // End user session
      endUserSession: async (sessionId) => {
        try {
          const { data, error } = await supabase
            .from('user_sessions')
            .update({
              session_end: new Date().toISOString(),
              is_active: false,
            })
            .eq('id', sessionId);

          if (error) throw error;
        } catch (error) {
          console.error('Error ending user session:', error);
        }
      },

      // Update last activity
      updateLastActivity: async (sessionId) => {
        try {
          const { data, error } = await supabase
            .from('user_sessions')
            .update({
              last_activity: new Date().toISOString(),
            })
            .eq('id', sessionId);

          if (error) throw error;
        } catch (error) {
          console.error('Error updating last activity:', error);
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
